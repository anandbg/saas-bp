/**
 * Diagram Generation Module
 *
 * Uses OpenAI GPT-4 to generate HTML/Tailwind diagrams and illustrations
 * Implements feedback loop with MCP Playwright validation
 */

import { OpenAI } from 'openai';
import {
  buildDiagramPrompt,
  buildFeedbackPrompt,
  extractHtmlFromResponse,
  validateGeneratedHtml,
  DIAGRAM_VALIDATION_RULES,
} from './diagram-prompt-template';
import { validateDiagram } from '../validation/mcp-playwright';
import type { ParsedFile } from '../parsers';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DiagramGenerationRequest {
  userRequest: string;
  files?: ParsedFile[];
  conversationHistory?: Array<{ role: string; content: string }>;
  previousDiagrams?: string[];
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
  };
}

/**
 * Generate a diagram from user request
 * @param request - Generation parameters
 * @returns Generated HTML or error
 */
export async function generateDiagram(
  request: DiagramGenerationRequest
): Promise<DiagramGenerationResult> {
  const startTime = Date.now();

  try {
    // Validate API key
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

    // Extract file contents for context
    const fileContents = request.files?.map(
      (file) => `**${file.fileName}**:\n${file.content}`
    );

    // Build prompt
    const messages = buildDiagramPrompt(request.userRequest, {
      fileContents,
      previousDiagrams: request.previousDiagrams,
      conversationHistory: request.conversationHistory,
    });

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedContent = response.choices[0]?.message?.content;

    if (!generatedContent) {
      return {
        success: false,
        error: 'No response from OpenAI',
        metadata: {
          model: 'gpt-4o',
          tokensUsed: response.usage?.total_tokens || 0,
          generationTime: Date.now() - startTime,
          validationPassed: false,
        },
      };
    }

    // Extract HTML from response
    const html = extractHtmlFromResponse(generatedContent);

    // Validate generated HTML
    const validation = validateGeneratedHtml(html);

    return {
      success: validation.isValid,
      html,
      error: validation.errors.length > 0 ? validation.errors.join(', ') : undefined,
      metadata: {
        model: 'gpt-4o',
        tokensUsed: response.usage?.total_tokens || 0,
        generationTime: Date.now() - startTime,
        validationPassed: validation.isValid,
        validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
        validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        model: 'gpt-4o',
        tokensUsed: 0,
        generationTime: Date.now() - startTime,
        validationPassed: false,
      },
    };
  }
}

/**
 * Improve a diagram based on validation feedback
 * @param originalRequest - Original user request
 * @param currentHtml - Current diagram HTML
 * @param feedback - Validation feedback
 * @returns Improved diagram or error
 */
export async function improveDiagram(
  originalRequest: string,
  currentHtml: string,
  feedback: string
): Promise<DiagramGenerationResult> {
  const startTime = Date.now();

  try {
    // Build feedback prompt
    const messages = buildFeedbackPrompt(originalRequest, currentHtml, feedback);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedContent = response.choices[0]?.message?.content;

    if (!generatedContent) {
      return {
        success: false,
        error: 'No response from OpenAI',
        metadata: {
          model: 'gpt-4o',
          tokensUsed: response.usage?.total_tokens || 0,
          generationTime: Date.now() - startTime,
          validationPassed: false,
        },
      };
    }

    // Extract HTML from response
    const html = extractHtmlFromResponse(generatedContent);

    // Validate generated HTML
    const validation = validateGeneratedHtml(html);

    return {
      success: validation.isValid,
      html,
      error: validation.errors.length > 0 ? validation.errors.join(', ') : undefined,
      metadata: {
        model: 'gpt-4o',
        tokensUsed: response.usage?.total_tokens || 0,
        generationTime: Date.now() - startTime,
        validationPassed: validation.isValid,
        validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
        validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        model: 'gpt-4o',
        tokensUsed: 0,
        generationTime: Date.now() - startTime,
        validationPassed: false,
      },
    };
  }
}

/**
 * Generate diagram with automatic feedback loop
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

    while (iterations < maxIterations) {
      // Run validation
      const validationResult = await validateFn(currentHtml);

      // If validation passed, we're done
      if (validationResult.isValid) {
        return {
          success: true,
          html: currentHtml,
          metadata: {
            model: 'gpt-4o',
            tokensUsed: totalTokens,
            generationTime: Date.now() - startTime,
            validationPassed: true,
            iterations,
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
            model: 'gpt-4o',
            tokensUsed: totalTokens,
            generationTime: Date.now() - startTime,
            validationPassed: false,
            validationErrors: [validationResult.feedback || 'Validation failed'],
            iterations,
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

      if (!improvementResult.success || !improvementResult.html) {
        return {
          success: false,
          error: improvementResult.error || 'Failed to improve diagram',
          metadata: {
            model: 'gpt-4o',
            tokensUsed: totalTokens,
            generationTime: Date.now() - startTime,
            validationPassed: false,
            iterations,
          },
        };
      }

      currentHtml = improvementResult.html;
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
