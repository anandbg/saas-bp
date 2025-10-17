/**
 * OpenAI Model Configuration for AI Diagram Generator
 * Feature 7.0: GPT-5 Reasoning Model Integration
 *
 * This module provides intelligent model selection with:
 * - GPT-5 primary model with reasoning effort control
 * - Automatic complexity-based reasoning adjustment
 * - Intelligent fallback chain for high availability
 * - Cost estimation and tracking
 */

/**
 * GPT-5 reasoning effort levels
 * Controls how much "thinking" GPT-5 does before responding
 */
export type GPT5ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

/**
 * Supported OpenAI model variants
 */
export type ModelVariant =
  | 'gpt-5'           // Flagship reasoning model (default)
  | 'gpt-5-mini'      // Smaller, cheaper GPT-5 variant
  | 'gpt-5-nano'      // Smallest, fastest GPT-5 variant
  | 'o3'              // Advanced reasoning model
  | 'o3-mini'         // Smaller reasoning model (fallback 1)
  | 'gpt-4o';         // Legacy reliable model (fallback 2)

/**
 * Diagram complexity classification
 */
export type DiagramComplexity = 'simple' | 'medium' | 'complex';

/**
 * Model configuration for diagram generation
 * Loaded from environment variables and feature flags
 */
export interface ModelConfig {
  /** Primary model to attempt first */
  primary: ModelVariant;

  /** Fallback models to try if primary fails */
  fallbackChain: ModelVariant[];

  /** Default reasoning effort level */
  reasoningEffort: GPT5ReasoningEffort;

  /** Temperature for generation (0.0-2.0) */
  temperature: number;

  /** Maximum output tokens */
  maxTokens: number;
}

/**
 * Selected model with computed parameters
 * Result of model selection based on request complexity
 */
export interface ModelSelectionResult {
  /** Model to use for this request */
  model: ModelVariant;

  /** Reasoning effort (only for GPT-5/o3 models) */
  reasoningEffort?: GPT5ReasoningEffort;

  /** Temperature for generation */
  temperature: number;

  /** Maximum output tokens */
  maxTokens: number;

  /** Cost multiplier relative to baseline (1.0 = baseline) */
  costMultiplier: number;
}

/**
 * Get active model configuration based on environment and feature flags
 *
 * Reads from:
 * - GPT5_ENABLED environment variable
 * - GPT5_REASONING_EFFORT environment variable
 * - FEATURES.GPT5_ENABLED feature flag
 *
 * @returns Model configuration for diagram generation
 *
 * @example
 * ```typescript
 * const config = getModelConfig();
 * console.log(config.primary); // "gpt-5" or "gpt-4o"
 * console.log(config.fallbackChain); // ["o3-mini", "gpt-4o"] or []
 * ```
 */
export function getModelConfig(): ModelConfig {
  // Check feature flag (from lib/config/features.ts)
  const gpt5Enabled = process.env.GPT5_ENABLED === 'true';

  // Get configured reasoning effort (default: medium)
  const reasoningEffortEnv = process.env.GPT5_REASONING_EFFORT || 'medium';
  const reasoningEffort = validateReasoningEffort(reasoningEffortEnv);

  if (gpt5Enabled) {
    // GPT-5 mode: New intelligent model selection
    // NOTE: maxTokens for reasoning models must account for BOTH reasoning + output tokens
    // Reasoning models can use 10,000+ tokens for thinking even on "minimal" effort
    return {
      primary: 'gpt-5',
      fallbackChain: ['o3-mini', 'gpt-4o'], // Three-tier availability
      reasoningEffort,
      temperature: 0.7,
      maxTokens: 16000, // High limit to allow for reasoning + output (was 4000)
    };
  }

  // Legacy mode: GPT-4o (existing behavior)
  return {
    primary: 'gpt-4o',
    fallbackChain: [], // No fallback in legacy mode
    reasoningEffort: 'medium', // Ignored for GPT-4o
    temperature: 0.7,
    maxTokens: 4000,
  };
}

/**
 * Validate reasoning effort environment variable
 * Ensures only valid values are used
 *
 * @param effort - Raw value from environment variable
 * @returns Valid reasoning effort or default "medium"
 *
 * @internal
 */
function validateReasoningEffort(effort: string): GPT5ReasoningEffort {
  const validEfforts: GPT5ReasoningEffort[] = ['minimal', 'low', 'medium', 'high'];

  if (validEfforts.includes(effort as GPT5ReasoningEffort)) {
    return effort as GPT5ReasoningEffort;
  }

  console.warn(
    `Invalid GPT5_REASONING_EFFORT: "${effort}". ` +
    `Valid options: ${validEfforts.join(', ')}. Defaulting to "medium".`
  );

  return 'medium';
}

/**
 * Select appropriate model and parameters based on diagram complexity
 *
 * Analyzes user request to determine complexity, then selects:
 * - Model variant (primary from config)
 * - Reasoning effort (minimal for simple, high for complex)
 * - Temperature (lower for complex diagrams)
 * - Token limits (higher for complex diagrams)
 * - Cost multiplier (varies with reasoning effort)
 *
 * @param userRequest - User's diagram request text
 * @param config - Base model configuration from getModelConfig()
 * @returns Model selection with computed parameters
 *
 * @example
 * ```typescript
 * const config = getModelConfig();
 *
 * // Simple diagram
 * const simple = selectModelForDiagram("Create a basic org chart", config);
 * // Returns: { model: "gpt-5", reasoningEffort: "minimal", ... }
 *
 * // Complex diagram
 * const complex = selectModelForDiagram(
 *   "Create a complete microservices architecture with databases and queues",
 *   config
 * );
 * // Returns: { model: "gpt-5", reasoningEffort: "high", ... }
 * ```
 */
export function selectModelForDiagram(
  userRequest: string,
  config: ModelConfig
): ModelSelectionResult {
  const complexity = analyzeDiagramComplexity(userRequest);

  // For simple diagrams with GPT-5: use minimal reasoning
  if (config.primary === 'gpt-5' && complexity === 'simple') {
    return {
      model: 'gpt-5',
      reasoningEffort: 'minimal',
      temperature: 0.7,
      maxTokens: 12000, // High limit: reasoning models use many tokens for thinking (was 3000)
      costMultiplier: 0.7, // 30% cheaper due to minimal reasoning
    };
  }

  // For complex diagrams with GPT-5: use high reasoning
  if (config.primary === 'gpt-5' && complexity === 'complex') {
    return {
      model: 'gpt-5',
      reasoningEffort: 'high',
      temperature: 0.5, // Lower temperature for more focused reasoning
      maxTokens: 20000,  // Very high limit for complex diagrams with extensive reasoning (was 6000)
      costMultiplier: 1.3, // 30% more expensive due to high reasoning
    };
  }

  // Default: Use configured reasoning effort for medium complexity
  return {
    model: config.primary,
    reasoningEffort: supportsReasoningEffort(config.primary)
      ? config.reasoningEffort
      : undefined,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    costMultiplier: 1.0, // Baseline cost
  };
}

/**
 * Analyze diagram complexity based on request characteristics
 *
 * Uses heuristics to classify diagram requests:
 * - Length of request (characters)
 * - Presence of complexity keywords
 * - Presence of simplicity keywords
 *
 * @param userRequest - User's diagram request
 * @returns Complexity classification
 *
 * @example
 * ```typescript
 * analyzeDiagramComplexity("Basic org chart");
 * // Returns: "simple"
 *
 * analyzeDiagramComplexity(
 *   "Complete software architecture with microservices, databases, queues"
 * );
 * // Returns: "complex"
 * ```
 */
export function analyzeDiagramComplexity(userRequest: string): DiagramComplexity {
  const request = userRequest.toLowerCase();
  const length = request.length;

  // Complex indicators (multi-step, comprehensive, detailed diagrams)
  const complexIndicators = [
    'flowchart',
    'decision',
    'multiple steps',
    'entire',
    'complete',
    'comprehensive',
    'detailed',
    'integration',
    'architecture',
    'system design',
    'state machine',
    'sequence diagram',
    'interaction',
    'workflow',
    'microservices',
    'database',
    'authentication',
    'multi-tier',
    'distributed',
  ];

  // Simple indicators (basic, quick diagrams)
  const simpleIndicators = [
    'basic',
    'simple',
    'quick',
    'org chart',
    'hierarchy',
    'list',
    'table',
    'bar chart',
    'pie chart',
    'timeline',
    '3 levels',
    '5 items',
    'small',
    'minimal',
  ];

  // Count matches
  const complexScore = complexIndicators.filter(ind =>
    request.includes(ind)
  ).length;

  const simpleScore = simpleIndicators.filter(ind =>
    request.includes(ind)
  ).length;

  // Classification logic
  if (complexScore >= 2 || length > 200) {
    return 'complex';
  }

  if (simpleScore >= 1 || length < 50) {
    return 'simple';
  }

  return 'medium';
}

/**
 * Get next fallback model when current model fails
 *
 * Implements the fallback chain: GPT-5 → o3-mini → gpt-4o
 *
 * @param config - Model configuration
 * @param attemptedModel - Model that just failed
 * @returns Next model to try, or null if no more fallbacks
 *
 * @example
 * ```typescript
 * const config = getModelConfig();
 *
 * // First failure: GPT-5 fails
 * const next1 = getNextFallbackModel(config, 'gpt-5');
 * // Returns: "o3-mini"
 *
 * // Second failure: o3-mini fails
 * const next2 = getNextFallbackModel(config, 'o3-mini');
 * // Returns: "gpt-4o"
 *
 * // Third failure: gpt-4o fails
 * const next3 = getNextFallbackModel(config, 'gpt-4o');
 * // Returns: null (no more fallbacks)
 * ```
 */
export function getNextFallbackModel(
  config: ModelConfig,
  attemptedModel: ModelVariant
): ModelVariant | null {
  // If primary model failed, start fallback chain
  if (attemptedModel === config.primary && config.fallbackChain.length > 0) {
    return config.fallbackChain[0];
  }

  // Find current position in fallback chain
  const currentIndex = config.fallbackChain.indexOf(attemptedModel);

  // If model is in chain and not the last one, return next
  if (currentIndex !== -1 && currentIndex < config.fallbackChain.length - 1) {
    return config.fallbackChain[currentIndex + 1];
  }

  // No more fallbacks available
  return null;
}

/**
 * Check if model supports reasoning effort parameter
 *
 * Only GPT-5 and o3 family models support reasoning.effort parameter
 * GPT-4o and earlier models do not support this parameter
 *
 * @param model - Model variant to check
 * @returns true if model supports reasoning_effort parameter
 *
 * @example
 * ```typescript
 * supportsReasoningEffort('gpt-5');      // true
 * supportsReasoningEffort('o3-mini');    // true
 * supportsReasoningEffort('gpt-4o');     // false
 * ```
 */
export function supportsReasoningEffort(model: ModelVariant): boolean {
  return model.startsWith('gpt-5') || model.startsWith('o3');
}

/**
 * Model pricing per 1M tokens (as of January 2025)
 * Source: https://pricepertoken.com/pricing-page/model/openai-gpt-5
 */
const MODEL_PRICING: Record<ModelVariant, { input: number; output: number }> = {
  'gpt-5': {
    input: 1.25,   // $1.25 per 1M input tokens
    output: 10.00, // $10.00 per 1M output tokens
  },
  'gpt-5-mini': {
    input: 0.25,   // $0.25 per 1M input tokens
    output: 2.00,  // $2.00 per 1M output tokens
  },
  'gpt-5-nano': {
    input: 0.05,   // $0.05 per 1M input tokens
    output: 0.40,  // $0.40 per 1M output tokens
  },
  'o3': {
    input: 5.00,   // $5.00 per 1M input tokens (reasoning model)
    output: 20.00, // $20.00 per 1M output tokens
  },
  'o3-mini': {
    input: 1.00,   // $1.00 per 1M input tokens
    output: 5.00,  // $5.00 per 1M output tokens
  },
  'gpt-4o': {
    input: 2.50,   // $2.50 per 1M input tokens
    output: 10.00, // $10.00 per 1M output tokens
  },
};

/**
 * Calculate estimated cost for model usage
 *
 * Computes cost based on:
 * - Model pricing (input and output tokens priced separately)
 * - Actual token usage from OpenAI response
 *
 * @param model - Model variant used
 * @param inputTokens - Actual input tokens from API response
 * @param outputTokens - Actual output tokens from API response
 * @returns Estimated cost in USD
 *
 * @example
 * ```typescript
 * // GPT-5 example
 * const cost = estimateModelCost('gpt-5', 1000, 2000);
 * // Input:  1000 tokens * $1.25/1M = $0.00125
 * // Output: 2000 tokens * $10.00/1M = $0.02000
 * // Total: $0.02125
 *
 * // GPT-4o example (comparison)
 * const costGPT4o = estimateModelCost('gpt-4o', 1000, 2000);
 * // Input:  1000 tokens * $2.50/1M = $0.00250
 * // Output: 2000 tokens * $10.00/1M = $0.02000
 * // Total: $0.02250
 * // Savings with GPT-5: $0.00125 (5.6% cheaper)
 * ```
 */
export function estimateModelCost(
  model: ModelVariant,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];

  // Calculate cost for each token type
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  // Total cost
  return inputCost + outputCost;
}

/**
 * Get pricing information for a model
 * Useful for displaying cost information to users
 *
 * @param model - Model variant
 * @returns Pricing information
 *
 * @example
 * ```typescript
 * const pricing = getModelPricing('gpt-5');
 * console.log(`Input: $${pricing.input}/1M tokens`);
 * console.log(`Output: $${pricing.output}/1M tokens`);
 * ```
 */
export function getModelPricing(model: ModelVariant): { input: number; output: number } {
  return MODEL_PRICING[model];
}
