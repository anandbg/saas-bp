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
    const conversationHistoryStr = formData.get('conversationHistory') as string;
    const previousDiagramsStr = formData.get('previousDiagrams') as string;

    // Parse optional JSON fields
    let conversationHistory;
    let previousDiagrams;

    if (conversationHistoryStr) {
      try {
        conversationHistory = JSON.parse(conversationHistoryStr);
      } catch {
        // Invalid JSON, ignore
      }
    }

    if (previousDiagramsStr) {
      try {
        previousDiagrams = JSON.parse(previousDiagramsStr);
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
    let parsedFiles;
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

    // Generate diagram
    let result;

    if (enableValidation) {
      // Generate with MCP Playwright validation feedback loop
      // Note: MCP validation will be implemented in next step
      // For now, generate without custom validation
      result = await generateWithFeedbackLoop(
        {
          userRequest: validationResult.data.userRequest,
          files: parsedFiles?.filter((f) => !('error' in f)),
          conversationHistory: validationResult.data.conversationHistory,
          previousDiagrams: validationResult.data.previousDiagrams,
        },
        maxIterations
      );
    } else {
      // Generate without validation
      result = await generateDiagram({
        userRequest: validationResult.data.userRequest,
        files: parsedFiles?.filter((f) => !('error' in f)),
        conversationHistory: validationResult.data.conversationHistory,
        previousDiagrams: validationResult.data.previousDiagrams,
      });
    }

    // Return result
    return NextResponse.json(
      {
        success: result.success,
        html: result.html,
        error: result.error,
        metadata: result.metadata,
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
