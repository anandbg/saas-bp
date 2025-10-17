# Feature 7.0: GPT-5 Reasoning Model Integration - Technical Design

**Feature ID**: 7.0
**Feature Name**: GPT-5 Reasoning Model Integration
**Status**: Ready for Implementation
**Last Updated**: January 2025
**Author**: Designer Agent

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Module Specifications](#2-module-specifications)
3. [Integration Changes](#3-integration-changes)
4. [API Specifications](#4-api-specifications)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Error Handling Strategy](#6-error-handling-strategy)
7. [Testing Plan](#7-testing-plan)
8. [Performance Considerations](#8-performance-considerations)
9. [Security Considerations](#9-security-considerations)
10. [Deployment Plan](#10-deployment-plan)
11. [Implementation Order](#11-implementation-order)
12. [Migration Notes](#12-migration-notes)

---

## 1. Architecture Overview

### 1.1 High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        User Request                                 │
│         "Create a complete software architecture diagram"          │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│              POST /api/diagram/generate (No Changes)                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. Validate Request & Parse Files (Existing)                 │  │
│  │ 2. Build Diagram Prompt (Existing)                           │  │
│  │ 3. Call generateDiagram() with request                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│       NEW: Model Configuration Module (lib/ai/model-config.ts)     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Check GPT5_ENABLED feature flag                              │  │
│  │   ├─ false → Use GPT-4o (legacy mode)                        │  │
│  │   └─ true  → Continue with GPT-5 setup                       │  │
│  └─────────────────────────┬────────────────────────────────────┘  │
│                            ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Analyze Diagram Complexity                                   │  │
│  │   - Simple (< 50 chars, basic keywords) → minimal reasoning  │  │
│  │   - Medium (50-200 chars) → medium reasoning                 │  │
│  │   - Complex (> 200 chars, multi-step) → high reasoning       │  │
│  └─────────────────────────┬────────────────────────────────────┘  │
│                            ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Select Model + Reasoning Effort                              │  │
│  │   - Model: GPT-5 (primary)                                   │  │
│  │   - Reasoning Effort: minimal/low/medium/high                │  │
│  │   - Fallback Chain: [o3-mini, gpt-4o]                        │  │
│  │   - Temperature: 0.5-0.7                                     │  │
│  │   - Max Tokens: 3000-6000                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│  REFACTORED: Diagram Generator (lib/ai/diagram-generator.ts)       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Attempt 1: Call OpenAI API with GPT-5                        │  │
│  │   POST https://api.openai.com/v1/chat/completions            │  │
│  │   {                                                           │  │
│  │     model: "gpt-5",                                           │  │
│  │     messages: [...],                                          │  │
│  │     reasoning: { effort: "medium" },  // NEW                 │  │
│  │     temperature: 0.7,                                         │  │
│  │     max_tokens: 4000                                          │  │
│  │   }                                                           │  │
│  └─────────────────────────┬────────────────────────────────────┘  │
│                            ▼                                        │
│                      ┌──────────┐                                   │
│                      │ Success? │                                   │
│                      └─────┬────┘                                   │
│                  Yes       │       No (Rate Limit/Error)            │
│          ┌─────────────────┴──────────────┐                        │
│          ▼                                 ▼                        │
│  ┌───────────────┐            ┌─────────────────────────────────┐  │
│  │ Return Result │            │ Attempt 2: Fallback to o3-mini  │  │
│  │ with metadata │            │   model: "o3-mini"              │  │
│  └───────────────┘            │   reasoning: { effort: "medium" }│  │
│                               └────────────┬────────────────────┘  │
│                                            ▼                        │
│                                      ┌──────────┐                   │
│                                      │ Success? │                   │
│                                      └─────┬────┘                   │
│                                  Yes       │       No               │
│                          ┌─────────────────┴──────────────┐        │
│                          ▼                                 ▼        │
│                  ┌───────────────┐            ┌─────────────────┐  │
│                  │ Return Result │            │ Attempt 3:      │  │
│                  │ fallback:true │            │ Fallback to     │  │
│                  └───────────────┘            │ gpt-4o (final)  │  │
│                                               └────────┬────────┘  │
│                                                        ▼            │
│                                               ┌─────────────────┐  │
│                                               │ Return Result   │  │
│                                               │ fallback:true   │  │
│                                               │ (or error)      │  │
│                                               └─────────────────┘  │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│       NEW: Model Usage Tracker (lib/ai/model-logger.ts)            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Log Usage Record:                                            │  │
│  │   - Timestamp                                                │  │
│  │   - Model used (gpt-5 / o3-mini / gpt-4o)                   │  │
│  │   - Reasoning effort (minimal / low / medium / high)        │  │
│  │   - Tokens used                                              │  │
│  │   - Generation time (ms)                                     │  │
│  │   - Fallback occurred (boolean)                              │  │
│  │   - Success (boolean)                                        │  │
│  │   - Estimated cost (USD)                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Console Output:                                              │  │
│  │ [Model Usage] gpt-5 (medium) - 3200 tokens, 8500ms,         │  │
│  │ $0.0132 ✓                                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                  Response with Enhanced Metadata                    │
│  {                                                                  │
│    success: true,                                                   │
│    html: "<html>...</html>",                                        │
│    metadata: {                                                      │
│      model: "gpt-5",                 // FIXED: accurate now         │
│      tokensUsed: 3200,                                              │
│      generationTime: 8500,                                          │
│      validationPassed: true,                                        │
│      // NEW FIELDS:                                                 │
│      reasoningEffort: "medium",                                     │
│      fallback: false,                                               │
│      estimatedCost: 0.0132                                          │
│    }                                                                │
│  }                                                                  │
└────────────────────────────────────────────────────────────────────┘
```

### 1.2 Integration Points

**NEW Modules (3 files)**:
1. `lib/ai/model-config.ts` - Model selection and configuration logic
2. `lib/ai/model-logger.ts` - Usage tracking and statistics
3. `.env.example` - GPT-5 environment variables

**MODIFIED Modules (2 files)**:
1. `lib/ai/diagram-generator.ts` - Refactor all 3 functions:
   - `generateDiagram()` (lines 52-139)
   - `improveDiagram()` (lines 148-213)
   - `generateWithFeedbackLoop()` (lines 224-352)
2. `lib/config/features.ts` - Add `GPT5_ENABLED` feature flag

**UNCHANGED Modules** (backward compatible):
- `app/api/diagram/generate/route.ts` - No changes required
- `lib/ai/diagram-prompt-template.ts` - Prompts work with GPT-5
- All other modules

### 1.3 Feature Flag Architecture

```typescript
// Feature flag controls entire GPT-5 subsystem
if (GPT5_ENABLED === false) {
  // Legacy mode: Use GPT-4o exactly as before
  model = 'gpt-4o';
  // No reasoning parameter
  // No fallback chain
  // Existing behavior preserved
} else {
  // GPT-5 mode: New intelligent model selection
  model = selectModelForDiagram(userRequest, config);
  // Add reasoning parameter
  // Enable fallback chain
  // Track usage and costs
}
```

---

## 2. Module Specifications

### 2.1 Module 1: Model Configuration (`lib/ai/model-config.ts`)

**Purpose**: Centralize all model selection logic, complexity analysis, fallback chain management, and cost estimation.

**File Location**: `/Users/anand/saas-bp/lib/ai/model-config.ts` (NEW FILE)

#### 2.1.1 TypeScript Type Definitions

```typescript
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
```

#### 2.1.2 Core Configuration Functions

```typescript
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
    return {
      primary: 'gpt-5',
      fallbackChain: ['o3-mini', 'gpt-4o'], // Three-tier availability
      reasoningEffort,
      temperature: 0.7,
      maxTokens: 4000,
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
```

#### 2.1.3 Complexity Analysis & Model Selection

```typescript
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
      maxTokens: 3000,
      costMultiplier: 0.7, // 30% cheaper due to minimal reasoning
    };
  }

  // For complex diagrams with GPT-5: use high reasoning
  if (config.primary === 'gpt-5' && complexity === 'complex') {
    return {
      model: 'gpt-5',
      reasoningEffort: 'high',
      temperature: 0.5, // Lower temperature for more focused reasoning
      maxTokens: 6000,  // Allow more tokens for detailed output
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
```

#### 2.1.4 Fallback Chain Management

```typescript
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
```

#### 2.1.5 Cost Estimation

```typescript
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
```

#### 2.1.6 Module Exports Summary

```typescript
/**
 * Module Exports
 */
export {
  // Types
  type GPT5ReasoningEffort,
  type ModelVariant,
  type DiagramComplexity,
  type ModelConfig,
  type ModelSelectionResult,

  // Core Functions
  getModelConfig,
  selectModelForDiagram,
  analyzeDiagramComplexity,

  // Fallback Management
  getNextFallbackModel,
  supportsReasoningEffort,

  // Cost Estimation
  estimateModelCost,
  getModelPricing,
};
```

---

### 2.2 Module 2: Refactored Diagram Generator (`lib/ai/diagram-generator.ts`)

**Purpose**: Update all OpenAI API calls to use GPT-5 with reasoning effort parameter, implement fallback chain, and fix metadata bug.

**File Location**: `/Users/anand/saas-bp/lib/ai/diagram-generator.ts` (MODIFY EXISTING)

#### 2.2.1 Updated Interface with New Metadata Fields

```typescript
/**
 * Enhanced interface with new metadata fields for GPT-5
 * BACKWARD COMPATIBLE: All new fields are optional
 */
export interface DiagramGenerationResult {
  success: boolean;
  html?: string;
  error?: string;
  metadata: {
    // EXISTING FIELDS (unchanged)
    model: string;                    // FIXED: Now reports actual model used
    tokensUsed: number;
    generationTime: number;
    validationPassed: boolean;
    validationErrors?: string[];
    validationWarnings?: string[];
    iterations?: number;

    // NEW FIELDS (Feature 7.0)
    reasoningEffort?: string;         // "minimal" | "low" | "medium" | "high"
    fallback?: boolean;               // True if fallback occurred
    fallbackReason?: string;          // Why fallback was triggered
    originalModelAttempted?: string;  // First model tried
    estimatedCost?: number;           // USD cost estimate
  };
}
```

#### 2.2.2 Refactored `generateDiagram()` Function

**Original Location**: Lines 52-139
**Changes**: Replace hardcoded model, add reasoning parameter, implement fallback chain

```typescript
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
        const apiParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
          model: currentModel,
          messages,
          temperature: modelSelection.temperature,
          max_tokens: modelSelection.maxTokens,
        };

        // NEW: Add reasoning_effort for models that support it
        if (supportsReasoningEffort(currentModel) && modelSelection.reasoningEffort) {
          apiParams.reasoning = {
            effort: modelSelection.reasoningEffort,
          } as any; // Type assertion for new OpenAI SDK parameter
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
        model: currentModel || 'unknown', // FIXED: Report attempted model
        tokensUsed: 0,
        generationTime: Date.now() - startTime,
        validationPassed: false,
      },
    };
  }
}
```

#### 2.2.3 Refactored `improveDiagram()` Function

**Original Location**: Lines 148-213
**Changes**: Same refactoring pattern as `generateDiagram()`

```typescript
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
        const apiParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
          model: currentModel,
          messages,
          temperature: modelSelection.temperature,
          max_tokens: modelSelection.maxTokens,
        };

        // NEW: Add reasoning_effort for models that support it
        if (supportsReasoningEffort(currentModel) && modelSelection.reasoningEffort) {
          apiParams.reasoning = {
            effort: modelSelection.reasoningEffort,
          } as any;
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
        model: currentModel || 'unknown', // FIXED
        tokensUsed: 0,
        generationTime: Date.now() - startTime,
        validationPassed: false,
      },
    };
  }
}
```

#### 2.2.4 Updated `generateWithFeedbackLoop()` Function

**Original Location**: Lines 224-352
**Changes**: Fix hardcoded model references (lines 263, 279, 304)

```typescript
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
```

#### 2.2.5 Required Imports

```typescript
// Add to top of file
import {
  getModelConfig,
  selectModelForDiagram,
  getNextFallbackModel,
  supportsReasoningEffort,
  estimateModelCost,
  type ModelVariant,
} from './model-config';
import { modelUsageTracker } from './model-logger';
```

---

### 2.3 Module 3: Model Usage Tracker (`lib/ai/model-logger.ts`)

**Purpose**: Track model usage, costs, and fallback patterns for analysis and debugging.

**File Location**: `/Users/anand/saas-bp/lib/ai/model-logger.ts` (NEW FILE)

#### 2.3.1 TypeScript Interfaces

```typescript
/**
 * Model Usage Tracker
 * Feature 7.0: GPT-5 Reasoning Model Integration
 *
 * Tracks usage statistics for cost analysis and debugging:
 * - Model usage frequency
 * - Token consumption
 * - Cost tracking
 * - Fallback patterns
 * - Success rates
 */

/**
 * Single usage record for a diagram generation
 */
export interface ModelUsageRecord {
  /** Timestamp of request */
  timestamp: Date;

  /** Model used (gpt-5, o3-mini, gpt-4o, etc.) */
  model: string;

  /** Reasoning effort if applicable */
  reasoningEffort?: string;

  /** Total tokens consumed */
  tokensUsed: number;

  /** Generation time in milliseconds */
  generationTime: number;

  /** Whether fallback occurred */
  fallbackOccurred: boolean;

  /** Whether generation succeeded */
  success: boolean;

  /** Estimated cost in USD */
  estimatedCost: number;
}

/**
 * Aggregated usage statistics
 */
export interface UsageStats {
  /** Total number of requests tracked */
  totalRequests: number;

  /** Success rate percentage (0-100) */
  successRate: number;

  /** Fallback rate percentage (0-100) */
  fallbackRate: number;

  /** Total cost in USD */
  totalCost: number;

  /** Average cost per request in USD */
  avgCostPerRequest: number;

  /** Average tokens per request */
  avgTokens: number;

  /** Average generation time in milliseconds */
  avgGenerationTime: number;

  /** Model usage distribution (model name → count) */
  modelDistribution: Record<string, number>;

  /** Reasoning effort distribution (effort → count) */
  reasoningDistribution: Record<string, number>;
}
```

#### 2.3.2 ModelUsageTracker Class

```typescript
/**
 * Singleton class to track model usage across the application
 *
 * Uses in-memory storage with FIFO eviction to prevent memory leaks.
 * Keeps last 1000 records for analysis.
 */
export class ModelUsageTracker {
  private records: ModelUsageRecord[] = [];
  private maxRecords = 1000; // Keep last 1000 records in memory

  /**
   * Log a usage record
   *
   * @param record - Usage record to log
   *
   * @example
   * ```typescript
   * modelUsageTracker.log({
   *   timestamp: new Date(),
   *   model: 'gpt-5',
   *   reasoningEffort: 'medium',
   *   tokensUsed: 3200,
   *   generationTime: 8500,
   *   fallbackOccurred: false,
   *   success: true,
   *   estimatedCost: 0.0132,
   * });
   * ```
   */
  public log(record: ModelUsageRecord): void {
    this.records.push(record);

    // Trim to max size (FIFO: First In, First Out)
    if (this.records.length > this.maxRecords) {
      this.records.shift(); // Remove oldest record
    }

    // Console log for real-time monitoring
    const successIcon = record.success ? '✓' : '✗';
    const fallbackInfo = record.fallbackOccurred ? '(fallback)' : '';
    const reasoningInfo = record.reasoningEffort ? `(${record.reasoningEffort})` : '';

    console.log(
      `[Model Usage] ${record.model} ${reasoningInfo} - ` +
      `${record.tokensUsed} tokens, ${record.generationTime}ms, ` +
      `$${record.estimatedCost.toFixed(4)} ` +
      `${fallbackInfo} ${successIcon}`
    );
  }

  /**
   * Get aggregated usage statistics
   *
   * @returns Usage statistics or null if no records
   *
   * @example
   * ```typescript
   * const stats = modelUsageTracker.getStats();
   * if (stats) {
   *   console.log(`Total requests: ${stats.totalRequests}`);
   *   console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
   *   console.log(`Total cost: $${stats.totalCost.toFixed(2)}`);
   *   console.log(`Model distribution:`, stats.modelDistribution);
   * }
   * ```
   */
  public getStats(): UsageStats | null {
    const total = this.records.length;

    if (total === 0) {
      return null;
    }

    // Calculate success and fallback rates
    const successful = this.records.filter(r => r.success).length;
    const withFallback = this.records.filter(r => r.fallbackOccurred).length;

    // Calculate totals and averages
    const totalCost = this.records.reduce((sum, r) => sum + r.estimatedCost, 0);
    const avgTokens = this.records.reduce((sum, r) => sum + r.tokensUsed, 0) / total;
    const avgTime = this.records.reduce((sum, r) => sum + r.generationTime, 0) / total;

    // Model distribution
    const modelCounts: Record<string, number> = {};
    this.records.forEach(r => {
      modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
    });

    // Reasoning effort distribution
    const reasoningCounts: Record<string, number> = {};
    this.records.forEach(r => {
      if (r.reasoningEffort) {
        reasoningCounts[r.reasoningEffort] = (reasoningCounts[r.reasoningEffort] || 0) + 1;
      }
    });

    return {
      totalRequests: total,
      successRate: (successful / total) * 100,
      fallbackRate: (withFallback / total) * 100,
      totalCost,
      avgCostPerRequest: totalCost / total,
      avgTokens,
      avgGenerationTime: avgTime,
      modelDistribution: modelCounts,
      reasoningDistribution: reasoningCounts,
    };
  }

  /**
   * Get recent records (for debugging)
   *
   * @param count - Number of records to return (default: 10)
   * @returns Array of most recent records
   */
  public getRecentRecords(count: number = 10): ModelUsageRecord[] {
    return this.records.slice(-count);
  }

  /**
   * Clear all records (for testing)
   */
  public clear(): void {
    this.records = [];
  }

  /**
   * Get total number of tracked records
   */
  public getRecordCount(): number {
    return this.records.length;
  }
}

/**
 * Singleton instance
 * Exported for use throughout the application
 */
export const modelUsageTracker = new ModelUsageTracker();
```

#### 2.3.3 Utility Functions

```typescript
/**
 * Print usage statistics to console
 * Useful for debugging and monitoring
 *
 * @example
 * ```typescript
 * // In API route or debugging session
 * printUsageStats();
 * ```
 */
export function printUsageStats(): void {
  const stats = modelUsageTracker.getStats();

  if (!stats) {
    console.log('[Model Usage] No usage data available');
    return;
  }

  console.log('\n========================================');
  console.log('MODEL USAGE STATISTICS');
  console.log('========================================');
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Success Rate: ${stats.successRate.toFixed(2)}%`);
  console.log(`Fallback Rate: ${stats.fallbackRate.toFixed(2)}%`);
  console.log(`Total Cost: $${stats.totalCost.toFixed(4)}`);
  console.log(`Avg Cost/Request: $${stats.avgCostPerRequest.toFixed(4)}`);
  console.log(`Avg Tokens: ${Math.round(stats.avgTokens)}`);
  console.log(`Avg Time: ${Math.round(stats.avgGenerationTime)}ms`);
  console.log('\nModel Distribution:');
  Object.entries(stats.modelDistribution).forEach(([model, count]) => {
    const percentage = ((count / stats.totalRequests) * 100).toFixed(1);
    console.log(`  ${model}: ${count} (${percentage}%)`);
  });

  if (Object.keys(stats.reasoningDistribution).length > 0) {
    console.log('\nReasoning Effort Distribution:');
    Object.entries(stats.reasoningDistribution).forEach(([effort, count]) => {
      const percentage = ((count / stats.totalRequests) * 100).toFixed(1);
      console.log(`  ${effort}: ${count} (${percentage}%)`);
    });
  }
  console.log('========================================\n');
}

/**
 * Get cost comparison between GPT-5 and GPT-4o
 * Useful for ROI analysis
 *
 * @returns Cost comparison or null if no data
 */
export function getCostComparison(): {
  gpt5AvgCost: number;
  gpt4oAvgCost: number;
  savings: number;
  savingsPercentage: number;
} | null {
  const stats = modelUsageTracker.getStats();

  if (!stats) {
    return null;
  }

  const gpt5Records = modelUsageTracker['records'].filter(r => r.model === 'gpt-5');
  const gpt4oRecords = modelUsageTracker['records'].filter(r => r.model === 'gpt-4o');

  if (gpt5Records.length === 0 || gpt4oRecords.length === 0) {
    return null;
  }

  const gpt5AvgCost = gpt5Records.reduce((sum, r) => sum + r.estimatedCost, 0) / gpt5Records.length;
  const gpt4oAvgCost = gpt4oRecords.reduce((sum, r) => sum + r.estimatedCost, 0) / gpt4oRecords.length;
  const savings = gpt4oAvgCost - gpt5AvgCost;
  const savingsPercentage = (savings / gpt4oAvgCost) * 100;

  return {
    gpt5AvgCost,
    gpt4oAvgCost,
    savings,
    savingsPercentage,
  };
}
```

---

## 3. Integration Changes

### 3.1 Feature Flag Configuration (`lib/config/features.ts`)

**Changes**: Add `GPT5_ENABLED` feature flag

```typescript
// lib/config/features.ts

export const FEATURES = {
  // ... existing flags
  DATABASE: process.env.NEXT_PUBLIC_ENABLE_DATABASE === 'true',
  AUTH: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
  STRIPE: process.env.NEXT_PUBLIC_ENABLE_STRIPE === 'true',
  DIAGRAM_GENERATOR: true,
  FILE_PARSING: true,
  MCP_VALIDATION: false,
  AI_GENERATION: true,
  WEB_SEARCH: process.env.PERPLEXITY_API_KEY ? true : false, // Feature 6.0

  // NEW: Feature 7.0 - GPT-5 Reasoning Model Integration
  GPT5_ENABLED: process.env.GPT5_ENABLED === 'true',
} as const;
```

### 3.2 Environment Configuration (`.env.example`)

**Changes**: Add GPT-5 configuration variables

```bash
# =============================================================================
# OpenAI GPT-5 Configuration (Feature 7.0)
# =============================================================================

# Enable GPT-5 Reasoning Model (set to 'false' to continue using GPT-4o)
# Default: false (requires explicit opt-in for gradual rollout)
# Options: true | false
GPT5_ENABLED=false

# GPT-5 Reasoning Effort Level
# Controls how much "thinking" GPT-5 does before responding
# - minimal: Fast, low-cost, for simple diagrams (uses few/no reasoning tokens)
# - low: Balanced speed and quality, good for standard diagrams
# - medium: Default, good balance for most use cases (recommended)
# - high: Deep reasoning for complex diagrams (slower, more expensive)
# Default: medium
# Options: minimal | low | medium | high
GPT5_REASONING_EFFORT=medium

# Optional: Override default GPT-5 model variant
# Default: gpt-5 (flagship model)
# Options: gpt-5 | gpt-5-mini (cheaper) | gpt-5-nano (fastest/cheapest)
# Uncomment to override:
# GPT5_MODEL_VARIANT=gpt-5
```

### 3.3 API Endpoint (NO CHANGES)

**File**: `app/api/diagram/generate/route.ts`

**Status**: No changes required. API endpoint is backward compatible.

**Reasoning**: All changes are internal to the generation logic. The API contract remains the same:
- Request schema unchanged
- Response schema backward compatible (only additions)
- Error handling unchanged

---

## 4. API Specifications

### 4.1 Request Schema (UNCHANGED)

```typescript
// POST /api/diagram/generate

// Request body (existing, no changes)
{
  userRequest: string;
  files?: Array<{ fileName: string; content: string }>;
  conversationHistory?: Array<{ role: string; content: string }>;
  previousDiagrams?: string[];
}
```

### 4.2 Response Schema (BACKWARD COMPATIBLE)

```typescript
// Response (enhanced with new metadata fields)
{
  success: boolean;
  html?: string;
  error?: string;
  metadata: {
    // EXISTING FIELDS (unchanged)
    model: string;                    // NOW ACCURATE: "gpt-5" or "gpt-4o"
    tokensUsed: number;
    generationTime: number;
    validationPassed: boolean;
    validationErrors?: string[];
    validationWarnings?: string[];
    iterations?: number;

    // NEW FIELDS (Feature 7.0) - all optional for backward compatibility
    reasoningEffort?: string;         // "minimal" | "low" | "medium" | "high"
    fallback?: boolean;               // true if fallback occurred
    fallbackReason?: string;          // e.g., "gpt-5 failed: Rate limit exceeded"
    originalModelAttempted?: string;  // e.g., "gpt-5" (if fallback occurred)
    estimatedCost?: number;           // USD, e.g., 0.0132
  }
}
```

### 4.3 Example Responses

#### Example 1: Success with GPT-5 (No Fallback)

```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...</html>",
  "metadata": {
    "model": "gpt-5",
    "tokensUsed": 3200,
    "generationTime": 8500,
    "validationPassed": true,
    "reasoningEffort": "medium",
    "fallback": false,
    "estimatedCost": 0.0132
  }
}
```

#### Example 2: Success with Fallback to o3-mini

```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...</html>",
  "metadata": {
    "model": "o3-mini",
    "tokensUsed": 3500,
    "generationTime": 12000,
    "validationPassed": true,
    "reasoningEffort": "medium",
    "fallback": true,
    "fallbackReason": "gpt-5 failed: Rate limit exceeded",
    "originalModelAttempted": "gpt-5",
    "estimatedCost": 0.0175
  }
}
```

#### Example 3: Success with GPT-4o (GPT5_ENABLED=false)

```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...</html>",
  "metadata": {
    "model": "gpt-4o",
    "tokensUsed": 4000,
    "generationTime": 9000,
    "validationPassed": true
    // No GPT-5 specific fields when feature disabled
  }
}
```

#### Example 4: Error (All Models Failed)

```json
{
  "success": false,
  "error": "No response from OpenAI after fallback attempts",
  "metadata": {
    "model": "gpt-4o",
    "tokensUsed": 0,
    "generationTime": 15000,
    "validationPassed": false,
    "fallback": true,
    "fallbackReason": "o3-mini failed: Service unavailable",
    "originalModelAttempted": "gpt-5"
  }
}
```

---

## 5. Data Flow Diagrams

### 5.1 Request Flow with Feature Flag

```
User Request
    ↓
Check GPT5_ENABLED feature flag
    ↓
┌─────────────────────┴────────────────────┐
│ GPT5_ENABLED = false │ GPT5_ENABLED = true
▼                      ▼
[Legacy Mode]          [GPT-5 Mode]
    ↓                      ↓
Use GPT-4o             Analyze Complexity
No reasoning param         ↓
No fallback            Select Model + Reasoning
Existing behavior          ↓
    ↓                  Build API Request
    │                  (with reasoning param)
    │                      ↓
    │                  Try GPT-5
    │                      ↓
    │                  ┌──────────┐
    │                  │ Success? │
    │                  └─────┬────┘
    │                 Yes    │    No
    │              ┌─────────┴────────┐
    │              ▼                  ▼
    │          Return             Try o3-mini
    │          Result                 ↓
    │                            ┌──────────┐
    │                            │ Success? │
    │                            └─────┬────┘
    │                           Yes    │    No
    │                        ┌─────────┴────────┐
    │                        ▼                  ▼
    │                    Return             Try gpt-4o
    │                    Result                 ↓
    │                                       ┌──────────┐
    │                                       │ Success? │
    │                                       └─────┬────┘
    │                                      Yes    │    No
    │                                   ┌─────────┴────────┐
    │                                   ▼                  ▼
    │                               Return             Return
    │                               Result             Error
    │                                   │                  │
    └───────────────────────────────────┴──────────────────┘
                                        ↓
                            Track Usage with Logger
                                        ↓
                            Return Enhanced Metadata
```

### 5.2 Complexity Analysis Flow

```
User Request Text
    ↓
Extract Length & Keywords
    ↓
┌─────────────────────────────────────────────┐
│ Check Complexity Indicators                 │
│ - Length (< 50, 50-200, > 200)             │
│ - Simple keywords (basic, org chart, etc.) │
│ - Complex keywords (architecture, etc.)    │
└─────────────────┬───────────────────────────┘
                  ▼
        ┌──────────────────┐
        │ Classify          │
        │ Complexity        │
        └────────┬──────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
[Simple]     [Medium]     [Complex]
Length < 50  50-200 chars Length > 200
"basic org"  standard     "complete architecture"
    │            │            │
    ▼            ▼            ▼
reasoning:   reasoning:   reasoning:
"minimal"    "medium"     "high"
    │            │            │
    └────────────┴────────────┘
                 ↓
        Select Model Parameters
```

### 5.3 Fallback Chain Flow

```
Attempt Generation
    ↓
Try Primary Model (gpt-5)
    ↓
┌──────────────────────┐
│ Check Error Type     │
└──────┬───────────────┘
       │
       ├─ 401 (Auth Error) ────────────→ [Abort] No Fallback
       │
       ├─ 400 (Invalid Request) ───────→ [Abort] No Fallback
       │
       ├─ 429 (Rate Limit) ────────────→ [Retry] Fallback
       │
       ├─ 503 (Service Unavailable) ───→ [Retry] Fallback
       │
       ├─ 500/502 (Server Error) ──────→ [Retry] Fallback
       │
       └─ Timeout ─────────────────────→ [Retry] Fallback
                                              ↓
                                    Get Next Fallback Model
                                              ↓
                                    ┌──────────────────┐
                                    │ Fallback Chain   │
                                    │ [o3-mini, gpt-4o]│
                                    └────────┬─────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                          Try o3-mini    Try gpt-4o     No More
                              │              │          Fallbacks
                              │              │              │
                       ┌──────┴──────┐  ┌────┴────┐        ▼
                       │   Success?  │  │Success? │    Return
                       └──────┬──────┘  └────┬────┘    Error
                        Yes   │   No     Yes │  No
                       ┌──────┴──┐          │   │
                       ▼          ▼          ▼   ▼
                   Return     Try Next   Return  Return
                   Result     Fallback   Result  Error
```

---

## 6. Error Handling Strategy

### 6.1 Error Classification

**Non-Retryable Errors (No Fallback)**:
```typescript
const NON_RETRYABLE_ERRORS = {
  401: 'Authentication failed - Invalid API key',
  400: 'Invalid request - Fix request parameters',
  403: 'Forbidden - Check API permissions',
  // Content policy violations also return 400
};

// Actions:
// - Log error with full context
// - Return error to user immediately
// - DO NOT attempt fallback
// - Alert admin if repeated
```

**Retryable Errors (Trigger Fallback)**:
```typescript
const RETRYABLE_ERRORS = {
  429: 'Rate limit exceeded',
  503: 'Service temporarily unavailable',
  500: 'Internal server error',
  502: 'Bad gateway',
  504: 'Gateway timeout',
  'model_not_found': 'Model not available',
  'timeout': 'Request timeout',
};

// Actions:
// - Log error with model and reason
// - Attempt next model in fallback chain
// - Track fallback metadata
// - Continue until success or no more fallbacks
```

### 6.2 Error Handling Logic

```typescript
/**
 * Determine if error should trigger fallback
 */
function shouldFallback(error: any): boolean {
  // HTTP status codes that trigger fallback
  const retryableStatuses = [429, 500, 502, 503, 504];
  if (error.status && retryableStatuses.includes(error.status)) {
    return true;
  }

  // Error codes that trigger fallback
  const retryableCodes = ['model_not_found', 'insufficient_quota'];
  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.name === 'AbortError') {
    return true;
  }

  // Network errors (connection refused, DNS failure)
  if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND')) {
    return false; // Don't fallback on network errors (likely local issue)
  }

  // Default: don't fallback
  return false;
}
```

### 6.3 User-Facing Error Messages

```typescript
/**
 * Generate user-friendly error messages
 */
function getUserErrorMessage(error: any, fallbackOccurred: boolean): string {
  // If fallback succeeded, no error to user
  if (fallbackOccurred && success) {
    return undefined; // No error message
  }

  // Authentication error
  if (error.status === 401) {
    return 'OpenAI API authentication failed. Please check API key configuration.';
  }

  // Invalid request
  if (error.status === 400) {
    return 'Invalid request parameters. Please try rephrasing your diagram request.';
  }

  // Rate limit (after all fallbacks failed)
  if (error.status === 429) {
    return 'API rate limit exceeded. Please try again in a few minutes.';
  }

  // Service unavailable (after all fallbacks failed)
  if (error.status === 503) {
    return 'AI service temporarily unavailable. Please try again shortly.';
  }

  // Generic error
  return 'Failed to generate diagram. Please try again or contact support if the issue persists.';
}
```

### 6.4 Logging Strategy

```typescript
/**
 * Comprehensive error logging
 */
function logError(
  error: any,
  model: ModelVariant,
  stage: 'primary' | 'fallback_1' | 'fallback_2',
  userRequest: string
) {
  console.error(`[Model Error] ${stage.toUpperCase()} - ${model} failed`);
  console.error(`  Request: "${userRequest.substring(0, 100)}..."`);
  console.error(`  Error: ${error.message}`);
  console.error(`  Status: ${error.status || 'N/A'}`);
  console.error(`  Code: ${error.code || 'N/A'}`);
  console.error(`  Retryable: ${shouldFallback(error)}`);

  // Log full error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('  Full Error:', error);
  }
}
```

---

## 7. Testing Plan

### 7.1 Unit Tests

**File**: `tests/unit/model-config.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getModelConfig,
  selectModelForDiagram,
  analyzeDiagramComplexity,
  getNextFallbackModel,
  supportsReasoningEffort,
  estimateModelCost,
} from '@/lib/ai/model-config';

describe('model-config', () => {
  describe('getModelConfig', () => {
    it('returns GPT-5 config when GPT5_ENABLED=true', () => {
      process.env.GPT5_ENABLED = 'true';
      const config = getModelConfig();
      expect(config.primary).toBe('gpt-5');
      expect(config.fallbackChain).toEqual(['o3-mini', 'gpt-4o']);
    });

    it('returns GPT-4o config when GPT5_ENABLED=false', () => {
      process.env.GPT5_ENABLED = 'false';
      const config = getModelConfig();
      expect(config.primary).toBe('gpt-4o');
      expect(config.fallbackChain).toEqual([]);
    });

    it('uses medium reasoning effort by default', () => {
      process.env.GPT5_ENABLED = 'true';
      delete process.env.GPT5_REASONING_EFFORT;
      const config = getModelConfig();
      expect(config.reasoningEffort).toBe('medium');
    });

    it('respects GPT5_REASONING_EFFORT environment variable', () => {
      process.env.GPT5_ENABLED = 'true';
      process.env.GPT5_REASONING_EFFORT = 'high';
      const config = getModelConfig();
      expect(config.reasoningEffort).toBe('high');
    });
  });

  describe('analyzeDiagramComplexity', () => {
    it('classifies simple diagrams correctly', () => {
      expect(analyzeDiagramComplexity('Basic org chart')).toBe('simple');
      expect(analyzeDiagramComplexity('Simple timeline')).toBe('simple');
      expect(analyzeDiagramComplexity('Quick bar chart')).toBe('simple');
    });

    it('classifies complex diagrams correctly', () => {
      expect(
        analyzeDiagramComplexity(
          'Complete software architecture with microservices, databases, queues'
        )
      ).toBe('complex');
      expect(
        analyzeDiagramComplexity('Detailed flowchart with decision points and integration')
      ).toBe('complex');
    });

    it('classifies medium diagrams by default', () => {
      expect(analyzeDiagramComplexity('Create a product roadmap')).toBe('medium');
      expect(analyzeDiagramComplexity('User journey map with 10 steps')).toBe('medium');
    });
  });

  describe('selectModelForDiagram', () => {
    it('selects minimal reasoning for simple diagrams', () => {
      process.env.GPT5_ENABLED = 'true';
      const config = getModelConfig();
      const selection = selectModelForDiagram('Basic org chart', config);
      expect(selection.model).toBe('gpt-5');
      expect(selection.reasoningEffort).toBe('minimal');
      expect(selection.costMultiplier).toBe(0.7);
    });

    it('selects high reasoning for complex diagrams', () => {
      process.env.GPT5_ENABLED = 'true';
      const config = getModelConfig();
      const selection = selectModelForDiagram(
        'Complete microservices architecture with detailed integration patterns',
        config
      );
      expect(selection.model).toBe('gpt-5');
      expect(selection.reasoningEffort).toBe('high');
      expect(selection.costMultiplier).toBe(1.3);
    });
  });

  describe('getNextFallbackModel', () => {
    it('returns o3-mini when gpt-5 fails', () => {
      process.env.GPT5_ENABLED = 'true';
      const config = getModelConfig();
      const next = getNextFallbackModel(config, 'gpt-5');
      expect(next).toBe('o3-mini');
    });

    it('returns gpt-4o when o3-mini fails', () => {
      process.env.GPT5_ENABLED = 'true';
      const config = getModelConfig();
      const next = getNextFallbackModel(config, 'o3-mini');
      expect(next).toBe('gpt-4o');
    });

    it('returns null when gpt-4o fails (no more fallbacks)', () => {
      process.env.GPT5_ENABLED = 'true';
      const config = getModelConfig();
      const next = getNextFallbackModel(config, 'gpt-4o');
      expect(next).toBeNull();
    });
  });

  describe('supportsReasoningEffort', () => {
    it('returns true for GPT-5 models', () => {
      expect(supportsReasoningEffort('gpt-5')).toBe(true);
      expect(supportsReasoningEffort('gpt-5-mini')).toBe(true);
      expect(supportsReasoningEffort('gpt-5-nano')).toBe(true);
    });

    it('returns true for o3 models', () => {
      expect(supportsReasoningEffort('o3')).toBe(true);
      expect(supportsReasoningEffort('o3-mini')).toBe(true);
    });

    it('returns false for GPT-4o', () => {
      expect(supportsReasoningEffort('gpt-4o')).toBe(false);
    });
  });

  describe('estimateModelCost', () => {
    it('calculates GPT-5 cost correctly', () => {
      const cost = estimateModelCost('gpt-5', 1000, 2000);
      // Input: 1000 * $1.25/1M = $0.00125
      // Output: 2000 * $10/1M = $0.02
      // Total: $0.02125
      expect(cost).toBeCloseTo(0.02125, 5);
    });

    it('calculates GPT-4o cost correctly', () => {
      const cost = estimateModelCost('gpt-4o', 1000, 2000);
      // Input: 1000 * $2.50/1M = $0.0025
      // Output: 2000 * $10/1M = $0.02
      // Total: $0.0225
      expect(cost).toBeCloseTo(0.0225, 5);
    });

    it('shows GPT-5 is cheaper than GPT-4o for same tokens', () => {
      const costGPT5 = estimateModelCost('gpt-5', 1000, 2000);
      const costGPT4o = estimateModelCost('gpt-4o', 1000, 2000);
      expect(costGPT5).toBeLessThan(costGPT4o);
    });
  });
});
```

**File**: `tests/unit/model-logger.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ModelUsageTracker } from '@/lib/ai/model-logger';

describe('ModelUsageTracker', () => {
  let tracker: ModelUsageTracker;

  beforeEach(() => {
    tracker = new ModelUsageTracker();
    tracker.clear();
  });

  it('logs usage records correctly', () => {
    tracker.log({
      timestamp: new Date(),
      model: 'gpt-5',
      reasoningEffort: 'medium',
      tokensUsed: 3200,
      generationTime: 8500,
      fallbackOccurred: false,
      success: true,
      estimatedCost: 0.0132,
    });

    expect(tracker.getRecordCount()).toBe(1);
  });

  it('calculates statistics correctly', () => {
    // Log 3 successful requests
    for (let i = 0; i < 3; i++) {
      tracker.log({
        timestamp: new Date(),
        model: 'gpt-5',
        reasoningEffort: 'medium',
        tokensUsed: 3000,
        generationTime: 8000,
        fallbackOccurred: false,
        success: true,
        estimatedCost: 0.013,
      });
    }

    // Log 1 failed request with fallback
    tracker.log({
      timestamp: new Date(),
      model: 'o3-mini',
      reasoningEffort: 'medium',
      tokensUsed: 3500,
      generationTime: 12000,
      fallbackOccurred: true,
      success: true,
      estimatedCost: 0.018,
    });

    const stats = tracker.getStats();
    expect(stats).not.toBeNull();
    expect(stats!.totalRequests).toBe(4);
    expect(stats!.successRate).toBe(100);
    expect(stats!.fallbackRate).toBe(25);
    expect(stats!.avgCostPerRequest).toBeCloseTo(0.0145, 4);
    expect(stats!.modelDistribution['gpt-5']).toBe(3);
    expect(stats!.modelDistribution['o3-mini']).toBe(1);
  });

  it('maintains FIFO with max 1000 records', () => {
    // Log 1100 records
    for (let i = 0; i < 1100; i++) {
      tracker.log({
        timestamp: new Date(),
        model: 'gpt-5',
        reasoningEffort: 'medium',
        tokensUsed: 3000,
        generationTime: 8000,
        fallbackOccurred: false,
        success: true,
        estimatedCost: 0.013,
      });
    }

    // Should keep only last 1000
    expect(tracker.getRecordCount()).toBe(1000);
  });
});
```

### 7.2 Integration Tests

**File**: `tests/integration/gpt5-integration.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { generateDiagram } from '@/lib/ai/diagram-generator';
import { getModelConfig } from '@/lib/ai/model-config';

describe('GPT-5 Integration', () => {
  beforeAll(() => {
    // Ensure API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY required for integration tests');
    }
  });

  it('generates diagram with GPT-5 when enabled', async () => {
    process.env.GPT5_ENABLED = 'true';

    const result = await generateDiagram({
      userRequest: 'Create a simple org chart with 3 levels',
    });

    expect(result.success).toBe(true);
    expect(result.html).toBeDefined();
    expect(result.metadata.model).toBe('gpt-5');
    expect(result.metadata.reasoningEffort).toBe('minimal');
    expect(result.metadata.fallback).toBe(false);
    expect(result.metadata.estimatedCost).toBeGreaterThan(0);
  }, 30000); // 30 second timeout

  it('generates diagram with GPT-4o when GPT-5 disabled', async () => {
    process.env.GPT5_ENABLED = 'false';

    const result = await generateDiagram({
      userRequest: 'Create a simple org chart',
    });

    expect(result.success).toBe(true);
    expect(result.html).toBeDefined();
    expect(result.metadata.model).toBe('gpt-4o');
    expect(result.metadata.reasoningEffort).toBeUndefined();
    expect(result.metadata.fallback).toBeUndefined();
  }, 30000);

  it('uses high reasoning for complex diagrams', async () => {
    process.env.GPT5_ENABLED = 'true';

    const result = await generateDiagram({
      userRequest: 'Create a complete microservices architecture diagram with databases, queues, authentication, and API gateway',
    });

    expect(result.success).toBe(true);
    expect(result.metadata.reasoningEffort).toBe('high');
  }, 40000);
});
```

**File**: `tests/integration/fallback-chain.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateDiagram } from '@/lib/ai/diagram-generator';
import { OpenAI } from 'openai';

describe('Fallback Chain', () => {
  it('falls back to o3-mini when GPT-5 rate limited', async () => {
    process.env.GPT5_ENABLED = 'true';

    // Mock OpenAI to simulate rate limit on gpt-5
    const mockCreate = vi.fn()
      .mockRejectedValueOnce({ status: 429, message: 'Rate limit exceeded' }) // gpt-5 fails
      .mockResolvedValueOnce({ // o3-mini succeeds
        choices: [{ message: { content: '<!DOCTYPE html><html>...</html>' } }],
        usage: { prompt_tokens: 1000, completion_tokens: 2000, total_tokens: 3000 },
      });

    vi.spyOn(OpenAI.prototype.chat.completions, 'create').mockImplementation(mockCreate);

    const result = await generateDiagram({
      userRequest: 'Create a diagram',
    });

    expect(result.success).toBe(true);
    expect(result.metadata.model).toBe('o3-mini');
    expect(result.metadata.fallback).toBe(true);
    expect(result.metadata.fallbackReason).toContain('gpt-5 failed');
    expect(result.metadata.originalModelAttempted).toBe('gpt-5');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  }, 30000);

  it('does not fallback on authentication error', async () => {
    process.env.GPT5_ENABLED = 'true';

    // Mock OpenAI to simulate auth error
    const mockCreate = vi.fn()
      .mockRejectedValue({ status: 401, message: 'Invalid API key' });

    vi.spyOn(OpenAI.prototype.chat.completions, 'create').mockImplementation(mockCreate);

    const result = await generateDiagram({
      userRequest: 'Create a diagram',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid API key');
    expect(mockCreate).toHaveBeenCalledTimes(1); // Only one attempt, no fallback
  });
});
```

### 7.3 Manual Testing Checklist

**Test Scenario 1: GPT-5 Enabled, Simple Diagram**
- [ ] Set `GPT5_ENABLED=true`, `GPT5_REASONING_EFFORT=medium`
- [ ] Request: "Create a basic org chart with CEO, 2 VPs, and 4 managers"
- [ ] Expected: Success, model=gpt-5, reasoningEffort=minimal, < 10s
- [ ] Verify: HTML diagram renders correctly, cost ~$0.007-0.010

**Test Scenario 2: GPT-5 Enabled, Complex Diagram**
- [ ] Set `GPT5_ENABLED=true`
- [ ] Request: "Create a complete software architecture diagram with microservices, databases, message queues, caching layers, API gateway, and authentication service"
- [ ] Expected: Success, model=gpt-5, reasoningEffort=high, < 25s
- [ ] Verify: Diagram shows logical coherence, cost ~$0.025-0.035

**Test Scenario 3: GPT-5 Disabled (Backward Compatibility)**
- [ ] Set `GPT5_ENABLED=false`
- [ ] Request: Any diagram request
- [ ] Expected: Success, model=gpt-4o, no reasoningEffort field
- [ ] Verify: Existing behavior unchanged, no breaking changes

**Test Scenario 4: Fallback Chain (Simulated)**
- [ ] Temporarily rename API key to trigger auth error
- [ ] Request: Any diagram
- [ ] Expected: Error, no fallback (401 is non-retryable)
- [ ] Restore API key
- [ ] Simulate rate limit by rapid requests (if possible)
- [ ] Expected: Fallback to o3-mini or gpt-4o

**Test Scenario 5: Cost Tracking**
- [ ] Generate 10 diagrams (mix of simple and complex)
- [ ] Call `modelUsageTracker.getStats()`
- [ ] Expected: Stats show accurate cost tracking, model distribution
- [ ] Verify: GPT-5 average cost < GPT-4o average cost

**Test Scenario 6: Metadata Accuracy**
- [ ] Generate diagrams with GPT-5 enabled
- [ ] Inspect all response metadata fields
- [ ] Expected: metadata.model matches actual OpenAI model used
- [ ] Verify: No "gpt-5" in metadata when "gpt-4o" actually called
- [ ] Verify: No "gpt-4o" in metadata when "gpt-5" actually called

---

## 8. Performance Considerations

### 8.1 Performance Benchmarks

**Target Performance** (from SPEC.md):
- Simple diagrams: < 10 seconds (minimal reasoning)
- Medium diagrams: < 15 seconds (medium reasoning)
- Complex diagrams: < 25 seconds (high reasoning)
- Total with fallback: < 30 seconds

**Optimization Strategies**:

1. **Auto-Select Minimal Reasoning for Simple Diagrams**
   - Reduces generation time by 40-60%
   - Saves 70-80% on output tokens
   - Maintains quality for simple use cases

2. **Optimize Fallback Chain**
   - Fast primary model (GPT-5: ~8-12s)
   - Mid-tier fallback (o3-mini: ~10-15s)
   - Reliable final fallback (gpt-4o: ~8-10s)
   - Total worst case: ~30-40s (within tolerance)

3. **Token Optimization**
   - GPT-5 uses 40-70% fewer output tokens than GPT-4o
   - Reduces both cost and transfer time
   - Lower temperature for complex diagrams (focused output)

### 8.2 Performance Monitoring

```typescript
/**
 * Performance monitoring helper
 * Use in development to track generation times
 */
export function monitorPerformance() {
  const stats = modelUsageTracker.getStats();

  if (!stats) {
    console.log('[Performance] No data available');
    return;
  }

  console.log('\n========================================');
  console.log('PERFORMANCE METRICS');
  console.log('========================================');
  console.log(`Avg Generation Time: ${Math.round(stats.avgGenerationTime)}ms`);

  // Calculate percentiles
  const times = modelUsageTracker['records']
    .map(r => r.generationTime)
    .sort((a, b) => a - b);

  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  console.log(`P50 (Median): ${p50}ms`);
  console.log(`P95: ${p95}ms`);
  console.log(`P99: ${p99}ms`);
  console.log('========================================\n');

  // Alert if p95 exceeds 30 seconds
  if (p95 > 30000) {
    console.warn('⚠️  WARNING: P95 latency exceeds 30 seconds!');
  }
}
```

### 8.3 Memory Considerations

**In-Memory Tracking**:
- ModelUsageTracker stores last 1000 records
- FIFO eviction prevents memory leaks
- Average memory per record: ~200 bytes
- Total memory usage: ~200 KB (negligible)

**No Database Required**:
- Stateless architecture maintained
- No persistent storage needed
- Logs sufficient for long-term analysis
- Consider database if need historical analytics (future enhancement)

---

## 9. Security Considerations

### 9.1 No New Security Risks

**GPT-5 integration does NOT introduce new security vulnerabilities**:
- Uses existing OpenAI API key (already secured)
- Same HTTPS-only communication
- Same input validation (Zod schemas)
- Same rate limiting patterns
- No new external dependencies

### 9.2 Existing Security Protections (Maintained)

1. **API Key Security**
   ```bash
   # API key in environment only
   OPENAI_API_KEY=sk-xxx...
   # NEVER commit to git
   # Use .env.local for development
   # Use environment variables in production
   ```

2. **Input Validation**
   ```typescript
   // Existing Zod schema validation (unchanged)
   const DiagramRequestSchema = z.object({
     userRequest: z.string().min(1).max(5000),
     files: z.array(ParsedFileSchema).optional(),
     // ...
   });
   ```

3. **Rate Limiting**
   ```typescript
   // Existing rate limiting (unchanged)
   // Protects against abuse
   // No additional rate limiting needed for GPT-5
   ```

4. **HTTPS Only**
   ```typescript
   // All OpenAI API calls use HTTPS
   // No unencrypted communication
   ```

### 9.3 Security Best Practices

1. **Feature Flag Security**
   ```bash
   # GPT5_ENABLED should be server-side only
   # Do NOT expose in NEXT_PUBLIC_ variables
   # Control rollout via environment variables
   ```

2. **Error Message Sanitization**
   ```typescript
   // Do NOT expose internal errors to users
   // Sanitize OpenAI error messages
   // Log full errors server-side only
   ```

3. **Cost Tracking Privacy**
   ```typescript
   // Cost estimates in metadata are fine for admins
   // Consider hiding from end users if sensitive
   // No PII tracked in model logger
   ```

---

## 10. Deployment Plan

### 10.1 Pre-Deployment Checklist

- [ ] All tests passing (unit, integration)
- [ ] TypeScript compiles without errors
- [ ] Manual testing completed (all 6 scenarios)
- [ ] `.env.example` updated with GPT-5 variables
- [ ] `lib/config/features.ts` updated with GPT5_ENABLED flag
- [ ] Documentation updated (STATUS.md, DESIGN.md)
- [ ] Git commit follows conventional format
- [ ] Code reviewed (if applicable)

### 10.2 Deployment Phases

**Phase 1: Internal Testing (Week 1)**

```bash
# Local/Staging environment
export GPT5_ENABLED=true
export GPT5_REASONING_EFFORT=medium
export OPENAI_API_KEY=sk-xxx...

# Start development server
npm run dev

# Manual testing:
# - Generate 20 diagrams (mix of simple/complex)
# - Test fallback chain (simulate failures)
# - Verify cost tracking
# - Check logs for accurate model reporting
# - Compare quality: GPT-5 vs GPT-4o

# Success criteria:
# - All diagrams generate successfully
# - Metadata accurate (model, reasoning, cost)
# - Fallback chain works
# - Cost savings visible (35-45%)
```

**Phase 2: 10% Production Traffic (Week 2)**

```bash
# Deploy to production with feature flag OFF
export GPT5_ENABLED=false
# Deploy code (backward compatible)

# Enable GPT-5 for 10% of instances
# (Set GPT5_ENABLED=true on 1 of 10 servers, or use load balancer routing)

# Monitor for 1 week:
# - Cost per diagram (target: 35-45% savings)
# - Generation time (target: < 30s p95)
# - Success rate (target: > 95%)
# - Fallback rate (target: < 5%)
# - User-reported issues (target: 0 critical)

# Tools:
# - Vercel Analytics (page load times)
# - Console logs (modelUsageTracker stats)
# - OpenAI usage dashboard (actual costs)

# Rollback procedure if issues detected:
export GPT5_ENABLED=false
# Redeploy to all instances
```

**Phase 3: 50% Production Traffic (Week 3)**

```bash
# If Phase 2 successful, increase to 50%
# Enable GPT5_ENABLED=true on 5 of 10 instances

# Continue monitoring (same metrics as Phase 2)
# Compare GPT-5 cohort vs GPT-4o cohort
# Analyze A/B test results
```

**Phase 4: 100% Production Traffic (Week 4)**

```bash
# If Phase 3 successful, enable for all traffic
export GPT5_ENABLED=true

# Deploy to all production instances
# Mark Feature 7.0 complete
# Update STATUS.md
```

### 10.3 Rollback Procedure

**Emergency Rollback** (if critical issues detected):

```bash
# Step 1: Disable GPT-5 immediately
export GPT5_ENABLED=false

# Step 2: Redeploy application (or restart servers)
# All traffic reverts to GPT-4o
# No code changes needed (feature flag)

# Step 3: Investigate issues
# - Check logs for errors
# - Review user reports
# - Test locally with GPT5_ENABLED=true
# - Fix issues in code

# Step 4: Re-enable after fix
export GPT5_ENABLED=true
# Restart rollout from Phase 2
```

### 10.4 Environment Variables Setup

**Local Development** (`.env.local`):
```bash
OPENAI_API_KEY=sk-xxx...
GPT5_ENABLED=true
GPT5_REASONING_EFFORT=medium
```

**Staging** (Vercel environment variables):
```bash
OPENAI_API_KEY=sk-xxx...
GPT5_ENABLED=true
GPT5_REASONING_EFFORT=medium
```

**Production** (Vercel environment variables):
```bash
# Week 1: Disabled
GPT5_ENABLED=false

# Week 2: 10% enabled (via instance-level config or load balancer)
# Set GPT5_ENABLED=true for subset of instances

# Week 3: 50% enabled
# Week 4: 100% enabled (set for all instances)
GPT5_ENABLED=true
GPT5_REASONING_EFFORT=medium
```

---

## 11. Implementation Order

### 11.1 Step-by-Step Implementation

**Step 1: Create Model Configuration Module** (3 hours)
```bash
# Create new file
touch lib/ai/model-config.ts

# Implement:
# - Type definitions (ModelConfig, ModelSelectionResult, etc.)
# - getModelConfig()
# - selectModelForDiagram()
# - analyzeDiagramComplexity()
# - getNextFallbackModel()
# - supportsReasoningEffort()
# - estimateModelCost()

# Test:
# - Write unit tests (tests/unit/model-config.test.ts)
# - Run tests: npm run test:unit
```

**Step 2: Create Model Usage Tracker** (2 hours)
```bash
# Create new file
touch lib/ai/model-logger.ts

# Implement:
# - ModelUsageRecord interface
# - UsageStats interface
# - ModelUsageTracker class
# - Singleton instance export
# - Utility functions (printUsageStats, getCostComparison)

# Test:
# - Write unit tests (tests/unit/model-logger.test.ts)
# - Run tests: npm run test:unit
```

**Step 3: Refactor Diagram Generator** (6 hours)
```bash
# Modify existing file
# lib/ai/diagram-generator.ts

# Refactor generateDiagram():
# - Import model-config and model-logger
# - Add model selection logic (lines 52-70)
# - Replace hardcoded 'gpt-4o' with dynamic model
# - Add reasoning parameter to API call
# - Implement fallback chain with retry logic
# - Fix metadata (lines 119, 132)
# - Add cost estimation
# - Add usage tracking

# Refactor improveDiagram():
# - Same changes as generateDiagram()
# - Fix metadata (lines 193, 206)

# Refactor generateWithFeedbackLoop():
# - Fix hardcoded 'gpt-4o' references (lines 263, 279, 304)
# - Use result.metadata.model instead

# Test:
# - Write integration tests (tests/integration/gpt5-integration.test.ts)
# - Run tests: npm run test:integration
```

**Step 4: Update Environment Configuration** (1 hour)
```bash
# Update .env.example
# Add GPT5_ENABLED and GPT5_REASONING_EFFORT

# Update lib/config/features.ts
# Add GPT5_ENABLED flag

# Create .env.local for testing
cp .env.example .env.local
# Set GPT5_ENABLED=true for testing
```

**Step 5: Test with GPT-5 Enabled** (4 hours)
```bash
# Start development server
npm run dev

# Manual testing:
# - Test Scenario 1: Simple diagram (minimal reasoning)
# - Test Scenario 2: Complex diagram (high reasoning)
# - Test Scenario 3: Backward compatibility (GPT5_ENABLED=false)
# - Test Scenario 4: Fallback chain (simulate failures)
# - Test Scenario 5: Cost tracking
# - Test Scenario 6: Metadata accuracy

# Verify:
# - All tests pass
# - Logs show accurate model names
# - Cost estimates present in metadata
# - Fallback chain works
```

**Step 6: Documentation** (1 hour)
```bash
# Update STATUS.md
# Mark Feature 7.0 complete

# Create MIGRATION.md (optional)
# Document upgrade process for users

# Update DESIGN.md (this document)
# Final review and corrections
```

**Step 7: Git Commit** (30 minutes)
```bash
# Stage changes
git add lib/ai/model-config.ts
git add lib/ai/model-logger.ts
git add lib/ai/diagram-generator.ts
git add lib/config/features.ts
git add .env.example
git add tests/
git add docs/specs/features/7.0-gpt5-reasoning-model/DESIGN.md
git add docs/03-IMPLEMENTATION/STATUS.md

# Commit with conventional format
git commit -m "feat(gpt5): Implement Feature 7.0 - GPT-5 Reasoning Model Integration

- Add model configuration module (lib/ai/model-config.ts)
  - Dynamic model selection based on complexity
  - Intelligent reasoning effort auto-selection
  - Fallback chain: GPT-5 → o3-mini → gpt-4o
  - Cost estimation and pricing data

- Add model usage tracker (lib/ai/model-logger.ts)
  - In-memory usage tracking (last 1000 records)
  - Cost analysis and statistics
  - Console logging for monitoring

- Refactor diagram generator (lib/ai/diagram-generator.ts)
  - Replace hardcoded 'gpt-4o' with dynamic model selection
  - Fix metadata bug (lines 119, 132, 193, 206)
  - Add reasoning parameter to OpenAI API calls
  - Implement fallback chain with retry logic
  - Add new metadata fields: reasoningEffort, fallback, estimatedCost

- Add GPT5_ENABLED feature flag
  - Default: false (gradual rollout)
  - Environment variable: GPT5_REASONING_EFFORT

- Add comprehensive test suite
  - Unit tests for model-config and model-logger
  - Integration tests for GPT-5 generation
  - Fallback chain tests

BREAKING CHANGES: None (backward compatible)

Closes #7.0"

# Push to remote
git push origin feature/7.0-gpt5-reasoning-model
```

### 11.2 Total Estimated Time

| Task | Estimated Time | Actual Time |
|------|----------------|-------------|
| Model Configuration Module | 3 hours | |
| Model Usage Tracker | 2 hours | |
| Diagram Generator Refactor | 6 hours | |
| Environment Configuration | 1 hour | |
| Testing | 4 hours | |
| Documentation | 1 hour | |
| Git Commit | 30 minutes | |
| **Total** | **17.5 hours** | |

---

## 12. Migration Notes

### 12.1 No Breaking Changes

**Guaranteed Backward Compatibility**:
- API request schema unchanged
- API response schema backward compatible (only additions)
- All existing features work with GPT5_ENABLED=false
- No database migrations required
- No new npm dependencies

### 12.2 Migration from GPT-4o to GPT-5

**For Users**:
- No action required
- Feature flag controls rollout
- Transparent upgrade (no visible changes except metadata)

**For Developers**:
1. Pull latest code from feature branch
2. Run `npm install` (no new dependencies, but ensure existing up to date)
3. Copy `.env.example` updates to `.env.local`
4. Add `GPT5_ENABLED=true` to test locally
5. Run tests: `npm run test`
6. Start dev server: `npm run dev`

### 12.3 Rollout Best Practices

**Week 1: Internal Testing**
- Enable GPT-5 on local/staging only
- Test all scenarios thoroughly
- Collect baseline metrics (cost, speed, quality)

**Week 2: 10% Production**
- Monitor closely for 7 days
- Compare metrics to baseline
- Be ready to rollback

**Week 3: 50% Production**
- If Week 2 successful, expand to 50%
- Continue monitoring
- Analyze A/B test results

**Week 4: 100% Production**
- If Week 3 successful, enable for all traffic
- Mark feature complete
- Celebrate cost savings!

### 12.4 Cost Comparison (Expected)

| Metric | GPT-4o (Before) | GPT-5 (After) | Savings |
|--------|-----------------|---------------|---------|
| Input cost per 1M tokens | $2.50 | $1.25 | 50% |
| Output tokens per diagram | 2,000 | 1,200 | 40% |
| Cost per diagram | $0.0225 | $0.0133 | 41% |
| Monthly cost (3,000 diagrams) | $67.50 | $39.90 | $27.60 |
| Annual savings | - | - | $331.20 |

**ROI**: Immediate (no implementation cost beyond developer time)

---

## Appendix A: OpenAI API Parameters

### GPT-5 API Request Example

```typescript
// Example API request with GPT-5 and reasoning parameter
const response = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    {
      role: 'system',
      content: 'You are an expert at creating HTML/Tailwind diagrams...',
    },
    {
      role: 'user',
      content: 'Create a software architecture diagram with microservices',
    },
  ],
  temperature: 0.5,
  max_tokens: 6000,

  // NEW: Reasoning parameter (only for GPT-5 and o3 models)
  reasoning: {
    effort: 'high', // "minimal" | "low" | "medium" | "high"
  },
});
```

### GPT-4o API Request Example (Legacy)

```typescript
// Example API request with GPT-4o (no reasoning parameter)
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: 'You are an expert at creating HTML/Tailwind diagrams...',
    },
    {
      role: 'user',
      content: 'Create a software architecture diagram',
    },
  ],
  temperature: 0.7,
  max_tokens: 4000,
  // No reasoning parameter (not supported)
});
```

---

## Appendix B: Cost Calculations Reference

### Pricing Table (January 2025)

| Model | Input (per 1M) | Output (per 1M) | Use Case |
|-------|----------------|-----------------|----------|
| gpt-5 | $1.25 | $10.00 | Primary model (flagship) |
| gpt-5-mini | $0.25 | $2.00 | Cost-sensitive (cheaper) |
| gpt-5-nano | $0.05 | $0.40 | High-volume (fastest/cheapest) |
| o3 | $5.00 | $20.00 | Advanced reasoning (expensive) |
| o3-mini | $1.00 | $5.00 | Reasoning fallback |
| gpt-4o | $2.50 | $10.00 | Legacy reliable |

### Cost Calculation Formula

```typescript
// Cost = (Input Tokens / 1,000,000) * Input Price + (Output Tokens / 1,000,000) * Output Price

// Example: GPT-5 with 1000 input tokens and 2000 output tokens
const inputCost = (1000 / 1_000_000) * 1.25;   // $0.00125
const outputCost = (2000 / 1_000_000) * 10.00; // $0.02000
const totalCost = inputCost + outputCost;      // $0.02125

// Example: GPT-4o with same tokens (comparison)
const inputCostGPT4o = (1000 / 1_000_000) * 2.50;   // $0.00250
const outputCostGPT4o = (2000 / 1_000_000) * 10.00; // $0.02000
const totalCostGPT4o = inputCostGPT4o + outputCostGPT4o; // $0.02250

// Savings
const savings = totalCostGPT4o - totalCost; // $0.00125 (5.6%)
```

---

## Appendix C: References

### Source Files
- `/Users/anand/saas-bp/lib/ai/diagram-generator.ts` - Lines requiring changes
- `/Users/anand/saas-bp/lib/config/features.ts` - Feature flag pattern
- `/Users/anand/saas-bp/docs/specs/features/6.0-web-search-integration/DESIGN.md` - Reference design document

### Requirements Documents
- `/Users/anand/saas-bp/docs/specs/features/7.0-gpt5-reasoning-model/SPEC.md` - Feature requirements
- `/Users/anand/saas-bp/docs/specs/features/7.0-gpt5-reasoning-model/DECISIONS.md` - Approved decisions

### External Resources
- [OpenAI GPT-5 Announcement](https://openai.com/index/introducing-gpt-5/)
- [GPT-5 Developer Docs](https://openai.com/index/introducing-gpt-5-for-developers/)
- [OpenAI Cookbook: GPT-5 Params](https://cookbook.openai.com/examples/gpt-5/gpt-5_new_params_and_tools)
- [GPT-5 Pricing](https://pricepertoken.com/pricing-page/model/openai-gpt-5)

---

**END OF DESIGN DOCUMENT**

**Document Version**: 1.0
**Last Updated**: January 17, 2025
**Status**: Ready for Implementation
**Next Phase**: Implementation (Gate 3)

---

## Document Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-17 | 1.0 | Initial comprehensive design document | Designer Agent |

---

**Total Lines**: 2,847
**Estimated Implementation Time**: 17.5 hours
**Feature Priority**: HIGH
**Backward Compatible**: ✅ Yes
**Breaking Changes**: ❌ None
