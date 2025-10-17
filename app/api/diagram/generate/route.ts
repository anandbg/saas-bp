/**
 * Diagram Generation API Route
 *
 * POST /api/diagram/generate
 * Generates HTML/Tailwind diagrams from user requests and files
 *
 * Features:
 * - Multi-format file parsing (PDF, DOCX, PPTX, XLSX, CSV, images)
 * - OpenAI GPT-4 generation with specific prompt engineering
 * - Optional MCP Playwright validation with feedback loop
 * - Conversation history support for iterations
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDiagram, generateWithFeedbackLoop } from '@/lib/ai/diagram-generator';
import { parseMultipleFiles, validateFile } from '@/lib/parsers';
import { z } from 'zod';
import { FEATURES } from '@/lib/config/features';
import { analyzeSearchNeed } from '@/lib/ai/perplexity-query-builder';
import { selectModel } from '@/lib/ai/perplexity-model-selector';
import { searchWithPerplexity } from '@/lib/ai/perplexity-client';
import { rateLimiter } from '@/lib/ai/perplexity-rate-limiter';
import { usageTracker, budgetTracker } from '@/lib/ai/perplexity-usage-tracker';
import type { SearchContext } from '@/lib/ai/diagram-prompt-template';

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const DiagramGenerationSchema = z.object({
  userRequest: z.string().min(10, 'Request must be at least 10 characters'),
  files: z.array(z.any()).optional(), // Files will be validated separately
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  previousDiagrams: z.array(z.string()).optional(),
  enableValidation: z.boolean().optional().default(true),
  maxIterations: z.number().min(1).max(10).optional().default(5),
  enableSearch: z.boolean().optional().default(true), // Feature 6.0
});

// =============================================================================
// API HANDLER
// =============================================================================

/**
 * POST /api/diagram/generate
 *
 * Generate a diagram from user request and optional files
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('userRequest', 'Create a flowchart for user authentication');
 * formData.append('file', pdfFile);
 * formData.append('enableValidation', 'true');
 *
 * const response = await fetch('/api/diagram/generate', {
 *   method: 'POST',
 *   body: formData,
 * });
 *
 * const { success, html, metadata } = await response.json();
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API key not configured',
          code: 'missing_api_key',
        },
        { status: 500 }
      );
    }

    // Parse form data (supports file uploads)
    const formData = await request.formData();

    // Extract fields
    const userRequest = formData.get('userRequest') as string;
    const enableValidation = formData.get('enableValidation') === 'true';
    const maxIterations = parseInt(formData.get('maxIterations') as string) || 5;
    const enableSearch = formData.get('enableSearch') !== 'false'; // Default true
    const conversationHistoryStr = formData.get('conversationHistory') as string;
    const previousDiagramsStr = formData.get('previousDiagrams') as string;

    // Parse optional JSON fields
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> | undefined;
    let previousDiagrams: string[] | undefined;

    if (conversationHistoryStr) {
      try {
        conversationHistory = JSON.parse(conversationHistoryStr) as Array<{ role: 'user' | 'assistant'; content: string }>;
      } catch {
        // Invalid JSON, ignore
      }
    }

    if (previousDiagramsStr) {
      try {
        previousDiagrams = JSON.parse(previousDiagramsStr) as string[];
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Validate basic request
    const validationResult = DiagramGenerationSchema.safeParse({
      userRequest,
      conversationHistory,
      previousDiagrams,
      enableValidation,
      maxIterations,
      enableSearch,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'validation_error',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Parse uploaded files
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'file' && value instanceof File) {
        files.push(value);
      }
    }

    // Validate files
    const fileValidationErrors: string[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        fileValidationErrors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (fileValidationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'File validation failed',
          code: 'invalid_files',
          details: fileValidationErrors,
        },
        { status: 400 }
      );
    }

    // Parse files if provided
    let parsedFiles: Awaited<ReturnType<typeof parseMultipleFiles>> | undefined;
    if (files.length > 0) {
      try {
        parsedFiles = await parseMultipleFiles(files);

        // Check for parsing errors
        const parsingErrors = parsedFiles.filter(
          (f): f is { fileName: string; error: string } => 'error' in f
        );

        if (parsingErrors.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'File parsing failed',
              code: 'parsing_error',
              details: parsingErrors.map((e) => `${e.fileName}: ${e.error}`),
            },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to parse files',
            code: 'parsing_error',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // =============================================================================
    // WEB SEARCH INTEGRATION (Feature 6.0)
    // =============================================================================

    let searchContext: SearchContext | undefined;
    const searchMetadata: {
      searchUsed: boolean;
      searchQuery?: string;
      searchTokens?: number;
      searchTime?: number;
      searchError?: string;
      citationCount?: number;
      searchModel?: string;
      searchCost?: number;
    } = {
      searchUsed: false,
    };

    // Check if search should be activated
    if (enableSearch && FEATURES.WEB_SEARCH) {
      try {
        // Analyze if search is needed
        const analysis = analyzeSearchNeed(validationResult.data.userRequest);

        if (analysis.needsSearch) {
          console.log('[Search] Trigger detected:', analysis.reasoning);

          // Check rate limit and budget
          if (!rateLimiter.canMakeRequest()) {
            console.warn('[Search] Rate limit exceeded, skipping search');
            searchMetadata.searchError = 'Rate limit exceeded';
          } else if (!budgetTracker.canSpend(0.01)) {
            console.warn('[Search] Daily budget limit reached, skipping search');
            searchMetadata.searchError = 'Daily budget limit reached';
          } else {
            // Select appropriate model
            const modelSelection = selectModel(analysis.searchQuery);
            console.log('[Search] Using model:', modelSelection.model, '-', modelSelection.reasoning);

            try {
              // Perform search
              const searchResult = await searchWithPerplexity({
                query: analysis.searchQuery,
                model: modelSelection.model,
              });

              // Build search context for diagram generation
              searchContext = {
                answer: searchResult.answer,
                citations: searchResult.citations.map(c => ({
                  url: c.url,
                  title: c.title,
                })),
              };

              // Record usage
              usageTracker.record({
                timestamp: new Date(),
                query: analysis.searchQuery,
                model: searchResult.modelUsed,
                tokensInput: searchResult.tokensInput,
                tokensOutput: searchResult.tokensOutput,
                costUsd: searchResult.estimatedCostUsd,
                success: true,
              });

              // Update rate limiter and budget tracker
              rateLimiter.recordRequest();
              budgetTracker.recordCost(searchResult.estimatedCostUsd);

              // Update metadata
              searchMetadata.searchUsed = true;
              searchMetadata.searchQuery = analysis.searchQuery;
              searchMetadata.searchTokens = searchResult.tokensTotal;
              searchMetadata.searchTime = searchResult.searchTimeMs;
              searchMetadata.citationCount = searchResult.citations.length;
              searchMetadata.searchModel = searchResult.modelUsed;
              searchMetadata.searchCost = searchResult.estimatedCostUsd;

              console.log('[Search] Success:', {
                tokens: searchResult.tokensTotal,
                time: searchResult.searchTimeMs + 'ms',
                citations: searchResult.citations.length,
                cost: '$' + searchResult.estimatedCostUsd.toFixed(4),
              });
            } catch (searchError) {
              // Log error but continue without search
              console.error('[Search] Failed:', searchError);
              searchMetadata.searchError = searchError instanceof Error ? searchError.message : 'Unknown error';

              // Record failed attempt
              usageTracker.record({
                timestamp: new Date(),
                query: analysis.searchQuery,
                model: modelSelection.model,
                tokensInput: 0,
                tokensOutput: 0,
                costUsd: 0,
                success: false,
                error: searchMetadata.searchError,
              });
            }
          }
        } else {
          console.log('[Search] Not needed:', analysis.reasoning);
        }
      } catch (error) {
        // Log error in search workflow but continue
        console.error('[Search] Workflow error:', error);
        searchMetadata.searchError = error instanceof Error ? error.message : 'Unknown error';
      }
    } else if (!FEATURES.WEB_SEARCH) {
      console.log('[Search] Feature disabled (no API key configured)');
    }

    // =============================================================================
    // DIAGRAM GENERATION
    // =============================================================================

    // Generate diagram
    let result: Awaited<ReturnType<typeof generateDiagram>>;

    // Filter out parsing errors and type cast to ParsedFile[]
    const validFiles = parsedFiles
      ?.filter((f): f is import('@/lib/parsers').ParsedFile => !('error' in f));

    if (enableValidation) {
      // Generate with MCP Playwright validation feedback loop
      // Note: MCP validation will be implemented in next step
      // For now, generate without custom validation
      result = await generateWithFeedbackLoop(
        {
          userRequest: validationResult.data.userRequest,
          files: validFiles,
          conversationHistory: validationResult.data.conversationHistory,
          previousDiagrams: validationResult.data.previousDiagrams,
          searchContext, // Feature 6.0
        },
        maxIterations
      );
    } else {
      // Generate without validation
      result = await generateDiagram({
        userRequest: validationResult.data.userRequest,
        files: validFiles,
        conversationHistory: validationResult.data.conversationHistory,
        previousDiagrams: validationResult.data.previousDiagrams,
        searchContext, // Feature 6.0
      });
    }

    // Return result with search metadata
    return NextResponse.json(
      {
        success: result.success,
        html: result.html,
        error: result.error,
        metadata: {
          ...result.metadata,
          ...searchMetadata, // Feature 6.0: Add search metadata
        },
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    console.error('Diagram generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'internal_error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET method not allowed
 */
export function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to generate diagrams.',
      code: 'method_not_allowed',
    },
    {
      status: 405,
      headers: { Allow: 'POST' },
    }
  );
}
