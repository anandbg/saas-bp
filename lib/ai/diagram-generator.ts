/**
 * Diagram Generation Module
 *
 * Uses OpenAI GPT-5 with intelligent fallback to generate HTML/Tailwind diagrams
 * Implements feedback loop with MCP Playwright validation
 * Feature 7.0: GPT-5 Reasoning Model Integration
 */

import { OpenAI } from 'openai';
import {
  buildDiagramPrompt,
  buildFeedbackPrompt,
  extractHtmlFromResponse,
  validateGeneratedHtml,
  type SearchContext,
} from './diagram-prompt-template';
import { validateDiagram } from '../validation/mcp-playwright';
import type { ParsedFile } from '../parsers';
import {
  getModelConfig,
  selectModelForDiagram,
  getNextFallbackModel,
  supportsReasoningEffort,
  estimateModelCost,
  type ModelVariant,
} from './model-config';
import { modelUsageTracker } from './model-logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DiagramGenerationRequest {
  userRequest: string;
  files?: ParsedFile[];
  conversationHistory?: Array<{ role: string; content: string }>;
  previousDiagrams?: string[];
  searchContext?: SearchContext;
}

export interface DiagramGenerationResult {
  success: boolean;
  html?: string;
  error?: string;
  metadata: {
    model: string;
    tokensUsed: number;
    generationTime: number;
    validationPassed: boolean;
    validationErrors?: string[];
    validationWarnings?: string[];
    iterations?: number;
    // NEW FIELDS (Feature 7.0 - GPT-5 Integration)
    reasoningEffort?: string;         // "minimal" | "low" | "medium" | "high"
    fallback?: boolean;               // True if fallback occurred
    fallbackReason?: string;          // Why fallback was triggered
    originalModelAttempted?: string;  // First model tried
    estimatedCost?: number;           // USD cost estimate
  };
}

/**
 * Generate a diagram from user request
 * REFACTORED for Feature 7.0: GPT-5 integration with intelligent fallback
 *
 * @param request - Generation parameters
 * @returns Generated HTML or error with accurate metadata
 */
export async function generateDiagram(
  request: DiagramGenerationRequest
): Promise<DiagramGenerationResult> {
  const startTime = Date.now();

  try {
    // Validate API key (existing check)
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
        metadata: {
          model: 'none',
          tokensUsed: 0,
          generationTime: Date.now() - startTime,
          validationPassed: false,
        },
      };
    }

    // ========================================================================
    // NEW: Get model configuration and select appropriate model
    // ========================================================================
    const modelConfig = getModelConfig();
    const modelSelection = selectModelForDiagram(request.userRequest, modelConfig);

    let currentModel: ModelVariant = modelSelection.model;
    let fallbackOccurred = false;
    let fallbackReason: string | undefined;
    const originalModel = currentModel;

    // ========================================================================
    // EXISTING: Extract file contents and build prompt (unchanged)
    // ========================================================================
    const fileContents = request.files?.map(
      (file) => `**${file.fileName}**:\n${file.content}`
    );

    const messages = buildDiagramPrompt(request.userRequest, {
      fileContents,
      previousDiagrams: request.previousDiagrams,
      conversationHistory: request.conversationHistory,
      searchContext: request.searchContext, // Feature 6.0
    });

    // ========================================================================
    // NEW: Attempt generation with fallback chain
    // ========================================================================
    let response: OpenAI.Chat.Completions.ChatCompletion | undefined;
    let generationError: Error | undefined;

    // Try primary model and fallback chain
    while (currentModel) {
      try {
        // Build API parameters
        const apiParams: any = {
          model: currentModel,
          messages,
          temperature: modelSelection.temperature,
          max_tokens: modelSelection.maxTokens,
        };

        // NEW: Add reasoning_effort for models that support it
        if (supportsReasoningEffort(currentModel) && modelSelection.reasoningEffort) {
          apiParams.reasoning = {
            effort: modelSelection.reasoningEffort,
          };
        }

        // Call OpenAI API
        console.log(`[Model] Attempting generation with ${currentModel}...`);
        response = await openai.chat.completions.create(apiParams);

        // Success! Break out of fallback loop
        console.log(`[Model] ✓ Success with ${currentModel}`);
        break;

      } catch (error: any) {
        generationError = error;
        console.error(`[Model] ✗ ${currentModel} failed:`, error.message);

        // NEW: Check if error is retryable (triggers fallback)
        const isRetryable =
          error.status === 429 ||  // Rate limit
          error.status === 503 ||  // Service unavailable
          error.status === 500 ||  // Server error
          error.status === 502 ||  // Bad gateway
          error.code === 'model_not_found' || // Model unavailable
          error.message?.includes('timeout'); // Timeout

        if (!isRetryable) {
          // Non-retryable error: don't fallback, throw immediately
          console.error(`[Model] Non-retryable error, aborting:`, error.message);
          throw error;
        }

        // Try next model in fallback chain
        const nextModel = getNextFallbackModel(modelConfig, currentModel);

        if (!nextModel) {
          // No more fallbacks available
          console.error(`[Model] No more fallbacks, failing`);
          throw error;
        }

        // Fallback to next model
        fallbackOccurred = true;
        fallbackReason = `${currentModel} failed: ${error.message}`;
        currentModel = nextModel;

        console.warn(`[Model] Falling back to: ${currentModel}`);
      }
    }

    // Check if we got a response
    if (!response) {
      throw generationError || new Error('No response from OpenAI');
    }

    const generatedContent = response.choices[0]?.message?.content;

    if (!generatedContent) {
      return {
        success: false,
        error: 'No response from OpenAI',
        metadata: {
          model: currentModel, // FIXED: Report actual model used
          tokensUsed: response.usage?.total_tokens || 0,
          generationTime: Date.now() - startTime,
          validationPassed: false,
          reasoningEffort: modelSelection.reasoningEffort, // NEW
          fallback: fallbackOccurred, // NEW
          fallbackReason, // NEW
          originalModelAttempted: fallbackOccurred ? originalModel : undefined, // NEW
        },
      };
    }

    // ========================================================================
    // EXISTING: Extract HTML and validate (unchanged)
    // ========================================================================
    const html = extractHtmlFromResponse(generatedContent);
    const validation = validateGeneratedHtml(html);

    // ========================================================================
    // NEW: Calculate cost estimate
    // ========================================================================
    const estimatedCost = estimateModelCost(
      currentModel,
      response.usage?.prompt_tokens || 1000,
      response.usage?.completion_tokens || 2000
    );

    // ========================================================================
    // NEW: Track usage with model logger
    // ========================================================================
    modelUsageTracker.log({
      timestamp: new Date(),
      model: currentModel,
      reasoningEffort: modelSelection.reasoningEffort,
      tokensUsed: response.usage?.total_tokens || 0,
      generationTime: Date.now() - startTime,
      fallbackOccurred,
      success: validation.isValid,
      estimatedCost,
    });

    // ========================================================================
    // RETURN: Enhanced metadata with new fields
    // ========================================================================
    return {
      success: validation.isValid,
      html,
      error: validation.errors.length > 0 ? validation.errors.join(', ') : undefined,
      metadata: {
        model: currentModel, // FIXED: Report actual model used
        tokensUsed: response.usage?.total_tokens || 0,
        generationTime: Date.now() - startTime,
        validationPassed: validation.isValid,
        validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
        validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        // NEW FIELDS:
        reasoningEffort: modelSelection.reasoningEffort,
        fallback: fallbackOccurred,
        fallbackReason,
        originalModelAttempted: fallbackOccurred ? originalModel : undefined,
        estimatedCost,
      },
    };

  } catch (error) {
    // Error handling with accurate metadata
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        model: 'unknown', // FIXED: Report attempted model
        tokensUsed: 0,
        generationTime: Date.now() - startTime,
        validationPassed: false,
      },
    };
  }
}

/**
 * Improve a diagram based on validation feedback
 * REFACTORED for Feature 7.0: GPT-5 integration with intelligent fallback
 *
 * @param originalRequest - Original user request
 * @param currentHtml - Current diagram HTML
 * @param feedback - Validation feedback to address
 * @returns Improved diagram or error with accurate metadata
 */
export async function improveDiagram(
  originalRequest: string,
  currentHtml: string,
  feedback: string
): Promise<DiagramGenerationResult> {
  const startTime = Date.now();

  try {
    // ========================================================================
    // NEW: Get model configuration and select appropriate model
    // ========================================================================
    const modelConfig = getModelConfig();
    const modelSelection = selectModelForDiagram(originalRequest, modelConfig);

    let currentModel: ModelVariant = modelSelection.model;
    let fallbackOccurred = false;
    let fallbackReason: string | undefined;
    const originalModel = currentModel;

    // ========================================================================
    // EXISTING: Build feedback prompt (unchanged)
    // ========================================================================
    const messages = buildFeedbackPrompt(originalRequest, currentHtml, feedback);

    // ========================================================================
    // NEW: Attempt generation with fallback chain (same logic as generateDiagram)
    // ========================================================================
    let response: OpenAI.Chat.Completions.ChatCompletion | undefined;
    let generationError: Error | undefined;

    while (currentModel) {
      try {
        const apiParams: any = {
          model: currentModel,
          messages,
          temperature: modelSelection.temperature,
          max_tokens: modelSelection.maxTokens,
        };

        // NEW: Add reasoning_effort for models that support it
        if (supportsReasoningEffort(currentModel) && modelSelection.reasoningEffort) {
          apiParams.reasoning = {
            effort: modelSelection.reasoningEffort,
          };
        }

        console.log(`[Model] Attempting improvement with ${currentModel}...`);
        response = await openai.chat.completions.create(apiParams);
        console.log(`[Model] ✓ Success with ${currentModel}`);
        break;

      } catch (error: any) {
        generationError = error;
        console.error(`[Model] ✗ ${currentModel} failed:`, error.message);

        const isRetryable =
          error.status === 429 ||
          error.status === 503 ||
          error.status === 500 ||
          error.status === 502 ||
          error.code === 'model_not_found' ||
          error.message?.includes('timeout');

        if (!isRetryable) {
          throw error;
        }

        const nextModel = getNextFallbackModel(modelConfig, currentModel);
        if (!nextModel) {
          throw error;
        }

        fallbackOccurred = true;
        fallbackReason = `${currentModel} failed: ${error.message}`;
        currentModel = nextModel;
        console.warn(`[Model] Falling back to: ${currentModel}`);
      }
    }

    if (!response) {
      throw generationError || new Error('No response from OpenAI');
    }

    const generatedContent = response.choices[0]?.message?.content;

    if (!generatedContent) {
      return {
        success: false,
        error: 'No response from OpenAI',
        metadata: {
          model: currentModel, // FIXED
          tokensUsed: response.usage?.total_tokens || 0,
          generationTime: Date.now() - startTime,
          validationPassed: false,
          reasoningEffort: modelSelection.reasoningEffort,
          fallback: fallbackOccurred,
          fallbackReason,
          originalModelAttempted: fallbackOccurred ? originalModel : undefined,
        },
      };
    }

    // ========================================================================
    // EXISTING: Extract HTML and validate (unchanged)
    // ========================================================================
    const html = extractHtmlFromResponse(generatedContent);
    const validation = validateGeneratedHtml(html);

    // ========================================================================
    // NEW: Calculate cost and track usage
    // ========================================================================
    const estimatedCost = estimateModelCost(
      currentModel,
      response.usage?.prompt_tokens || 1000,
      response.usage?.completion_tokens || 2000
    );

    modelUsageTracker.log({
      timestamp: new Date(),
      model: currentModel,
      reasoningEffort: modelSelection.reasoningEffort,
      tokensUsed: response.usage?.total_tokens || 0,
      generationTime: Date.now() - startTime,
      fallbackOccurred,
      success: validation.isValid,
      estimatedCost,
    });

    return {
      success: validation.isValid,
      html,
      error: validation.errors.length > 0 ? validation.errors.join(', ') : undefined,
      metadata: {
        model: currentModel, // FIXED
        tokensUsed: response.usage?.total_tokens || 0,
        generationTime: Date.now() - startTime,
        validationPassed: validation.isValid,
        validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
        validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        reasoningEffort: modelSelection.reasoningEffort,
        fallback: fallbackOccurred,
        fallbackReason,
        originalModelAttempted: fallbackOccurred ? originalModel : undefined,
        estimatedCost,
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        model: 'unknown', // FIXED
        tokensUsed: 0,
        generationTime: Date.now() - startTime,
        validationPassed: false,
      },
    };
  }
}

/**
 * Generate diagram with automatic feedback loop
 * UPDATED for Feature 7.0: Use actual model from result metadata
 *
 * Iterates up to maxIterations times until validation passes
 *
 * @param request - Generation parameters
 * @param maxIterations - Maximum number of improvement iterations (default: 5)
 * @param validateFn - Optional custom validation function (uses MCP Playwright if provided)
 * @returns Final diagram or error
 */
export async function generateWithFeedbackLoop(
  request: DiagramGenerationRequest,
  maxIterations: number = 5,
  validateFn?: (html: string) => Promise<{ isValid: boolean; feedback?: string }>
): Promise<DiagramGenerationResult> {
  const startTime = Date.now();
  let iterations = 0;

  // Initial generation
  let result = await generateDiagram(request);
  iterations++;

  // If basic validation failed, return immediately
  if (!result.success || !result.html) {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        iterations,
        generationTime: Date.now() - startTime,
      },
    };
  }

  // Run feedback loop with validation
  if (validateFn) {
    let currentHtml = result.html;
    let totalTokens = result.metadata.tokensUsed;
    let totalCost = result.metadata.estimatedCost || 0;

    while (iterations < maxIterations) {
      // Run validation
      const validationResult = await validateFn(currentHtml);

      // If validation passed, we're done
      if (validationResult.isValid) {
        return {
          success: true,
          html: currentHtml,
          metadata: {
            // FIXED: Use actual model from result instead of hardcoded 'gpt-4o'
            model: result.metadata.model, // Line 263: WAS 'gpt-4o'
            tokensUsed: totalTokens,
            generationTime: Date.now() - startTime,
            validationPassed: true,
            iterations,
            // Preserve GPT-5 metadata
            reasoningEffort: result.metadata.reasoningEffort,
            fallback: result.metadata.fallback,
            estimatedCost: totalCost,
          },
        };
      }

      // If we've reached max iterations, return current version
      if (iterations >= maxIterations) {
        return {
          success: false,
          html: currentHtml,
          error: `Max iterations (${maxIterations}) reached. Validation feedback: ${validationResult.feedback}`,
          metadata: {
            // FIXED: Use actual model from result instead of hardcoded 'gpt-4o'
            model: result.metadata.model, // Line 279: WAS 'gpt-4o'
            tokensUsed: totalTokens,
            generationTime: Date.now() - startTime,
            validationPassed: false,
            validationErrors: [validationResult.feedback || 'Validation failed'],
            iterations,
            reasoningEffort: result.metadata.reasoningEffort,
            fallback: result.metadata.fallback,
            estimatedCost: totalCost,
          },
        };
      }

      // Improve based on feedback
      const improvementResult = await improveDiagram(
        request.userRequest,
        currentHtml,
        validationResult.feedback || 'Please improve the diagram'
      );

      iterations++;
      totalTokens += improvementResult.metadata.tokensUsed;
      totalCost += improvementResult.metadata.estimatedCost || 0;

      if (!improvementResult.success || !improvementResult.html) {
        return {
          success: false,
          error: improvementResult.error || 'Failed to improve diagram',
          metadata: {
            // FIXED: Use actual model from result instead of hardcoded 'gpt-4o'
            model: improvementResult.metadata.model, // Line 304: WAS 'gpt-4o'
            tokensUsed: totalTokens,
            generationTime: Date.now() - startTime,
            validationPassed: false,
            iterations,
            reasoningEffort: improvementResult.metadata.reasoningEffort,
            fallback: improvementResult.metadata.fallback,
            estimatedCost: totalCost,
          },
        };
      }

      currentHtml = improvementResult.html;
      result = improvementResult; // Update result for next iteration
    }
  }

  // Return result with iteration count
  return {
    ...result,
    metadata: {
      ...result.metadata,
      iterations,
      generationTime: Date.now() - startTime,
    },
  };
}

/**
 * Generate diagram with MCP Playwright validation
 * Convenience wrapper for generateWithFeedbackLoop with MCP validation
 *
 * @param request - Generation parameters
 * @param maxIterations - Maximum iterations (default: 5)
 * @returns Final diagram with validation
 */
export async function generateDiagramWithValidation(
  request: DiagramGenerationRequest,
  maxIterations: number = 5
): Promise<DiagramGenerationResult> {
  return generateWithFeedbackLoop(
    request,
    maxIterations,
    async (html) => {
      // Use MCP Playwright validation
      const validation = await validateDiagram(html, request.userRequest);
      return {
        isValid: validation.isValid,
        feedback: validation.feedback,
      };
    }
  );
}
