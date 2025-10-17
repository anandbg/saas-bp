/**
 * useDiagramGeneration Hook
 *
 * Manages diagram generation with API integration
 * - Handles loading states
 * - Manages errors with retry logic (3 retries, exponential backoff)
 * - 5-minute timeout for API calls
 * - Integrates with conversation history and file uploads
 *
 * @example
 * ```tsx
 * const { generate, isGenerating, currentDiagram, error } = useDiagramGeneration();
 *
 * const result = await generate({
 *   userRequest: 'Create a flowchart',
 *   files: uploadedFiles,
 *   conversationHistory: messages,
 *   enableValidation: true,
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import type { Message, GenerateResponse } from '@/types/diagram';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
const REQUEST_TIMEOUT = 300000; // 5 minutes

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface DiagramGenerationOptions {
  userRequest: string;
  files?: File[];
  conversationHistory?: Message[];
  previousDiagrams?: string[];
  enableValidation?: boolean;
  maxIterations?: number;
}

export interface UseDiagramGenerationResult {
  /** Whether diagram is currently being generated */
  isGenerating: boolean;

  /** Current error message, if any */
  error: string | undefined;

  /** Current diagram HTML */
  currentDiagram: string | null;

  /** Metadata from last generation */
  metadata: GenerateResponse['metadata'] | undefined;

  /** Generate a new diagram */
  generate: (options: DiagramGenerationOptions) => Promise<GenerateResponse | null>;

  /** Retry the last failed generation */
  retry: () => Promise<GenerateResponse | null>;

  /** Clear error state */
  clearError: () => void;

  /** Manually set diagram */
  setDiagram: (html: string | null) => void;

  /** Current retry attempt (0 if no retries) */
  retryAttempt: number;
}

/**
 * Custom hook for diagram generation with retry logic
 * @returns Diagram generation state and control functions
 */
export function useDiagramGeneration(): UseDiagramGenerationResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [currentDiagram, setCurrentDiagram] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<GenerateResponse['metadata'] | undefined>();
  const [lastOptions, setLastOptions] = useState<DiagramGenerationOptions | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  /**
   * Make a single API request with timeout
   */
  const makeRequest = useCallback(async (options: DiagramGenerationOptions): Promise<GenerateResponse> => {
    // Build FormData for API request
    const formData = new FormData();
    formData.append('userRequest', options.userRequest);
    formData.append('enableValidation', String(options.enableValidation ?? true));
    formData.append('maxIterations', String(options.maxIterations ?? 5));

    // Append files if any
    if (options.files && options.files.length > 0) {
      options.files.forEach((file) => {
        formData.append('file', file);
      });
    }

    // Include conversation history
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      formData.append('conversationHistory', JSON.stringify(options.conversationHistory));
    }

    // Include previous diagrams
    if (options.previousDiagrams && options.previousDiagrams.length > 0) {
      formData.append('previousDiagrams', JSON.stringify(options.previousDiagrams));
    }

    // Call API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch('/api/diagram/generate', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = (await response.json()) as GenerateResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate diagram');
      }

      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  }, []);

  /**
   * Generate a diagram from user request with automatic retry
   */
  const generate = useCallback(async (options: DiagramGenerationOptions): Promise<GenerateResponse | null> => {
    setIsGenerating(true);
    setError(undefined);
    setLastOptions(options);
    setRetryAttempt(0);

    let lastError: Error | null = null;

    // Try with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = getRetryDelay(attempt - 1);
          console.log(`[useDiagramGeneration] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms`);
          setRetryAttempt(attempt);
          await sleep(delay);
        }

        const result = await makeRequest(options);

        // Success! Update state
        if (result.html) {
          setCurrentDiagram(result.html);
        }
        setMetadata(result.metadata);
        setRetryAttempt(0);
        setIsGenerating(false);

        console.log(`[useDiagramGeneration] Successfully generated diagram on attempt ${attempt + 1}`);
        return result;

      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');

        // Don't retry on certain errors
        if (lastError.name === 'AbortError') {
          console.error('[useDiagramGeneration] Request timed out, not retrying');
          break;
        }

        // Check if it's a validation error (don't retry)
        if (lastError.message.includes('validation') || lastError.message.includes('invalid')) {
          console.error('[useDiagramGeneration] Validation error, not retrying');
          break;
        }

        // For network errors, continue retrying
        if (attempt < MAX_RETRIES) {
          console.warn(`[useDiagramGeneration] Attempt ${attempt + 1} failed: ${lastError.message}`);
        }
      }
    }

    // All attempts failed
    setRetryAttempt(0);

    let errorMessage: string;
    if (lastError) {
      if (lastError.name === 'AbortError') {
        errorMessage = 'Request timed out after 5 minutes. Please try again with a simpler request.';
      } else if (lastError.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = lastError.message;
      }
    } else {
      errorMessage = 'An unexpected error occurred';
    }

    setError(errorMessage);
    setIsGenerating(false);
    return null;
  }, [makeRequest]);

  /**
   * Retry the last failed generation
   */
  const retry = useCallback(async (): Promise<GenerateResponse | null> => {
    if (!lastOptions) {
      setError('No previous request to retry');
      return null;
    }

    return generate(lastOptions);
  }, [lastOptions, generate]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  /**
   * Set current diagram manually
   */
  const setDiagram = useCallback((html: string | null) => {
    setCurrentDiagram(html);
  }, []);

  return {
    isGenerating,
    error,
    currentDiagram,
    metadata,
    generate,
    retry,
    clearError,
    setDiagram,
    retryAttempt,
  };
}
