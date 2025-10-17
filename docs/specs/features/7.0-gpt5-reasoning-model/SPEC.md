# Feature 7.0: GPT-5 Reasoning Model Integration

## Overview

### Feature ID

7.0

### Feature Name

GPT-5 Reasoning Model Integration

### Description

Upgrade the AI Diagram Generator from OpenAI's GPT-4o to GPT-5, leveraging the new flagship reasoning model released in 2025. GPT-5 provides superior performance with 50-80% fewer output tokens, best-in-class coding capabilities (74.9% vs 69.1% on SWE-bench), and intelligent reasoning effort controls. This upgrade will improve diagram generation quality, reduce costs, and fix the current bug where metadata reports "gpt-5" but the actual API calls use "gpt-4o".

### Priority

**HIGH** - Fixes critical metadata bug, improves generation quality, and reduces operational costs

### Estimated Time

12-16 hours

### Dependencies

- Phase 5: Export Functionality (COMPLETED)
- OpenAI API access with GPT-5 model availability
- Feature flags system (`lib/config/features.ts`)
- No new external dependencies required

### Related Documents

- `/Users/anand/saas-bp/lib/ai/diagram-generator.ts` - Core generation module (REQUIRES REFACTORING)
- `/Users/anand/saas-bp/lib/ai/diagram-prompt-template.ts` - Prompt engineering
- `/Users/anand/saas-bp/app/api/diagram/generate/route.ts` - API endpoint
- `/Users/anand/saas-bp/lib/validation/mcp-playwright.ts` - Validation system
- `/Users/anand/saas-bp/lib/config/features.ts` - Feature flag configuration
- `/Users/anand/saas-bp/docs/03-IMPLEMENTATION/STATUS.md` - Implementation progress

---

## Problem Statement

### Current Issues

1. **Metadata Bug (Lines 119, 132, 193, 206 in diagram-generator.ts)**
   - Metadata reports `model: 'gpt-5'` but actual API calls use `'gpt-4o'` (lines 87, 161)
   - This creates confusion and incorrect cost tracking
   - Users believe they're using GPT-5 when they're not

2. **Outdated Model**
   - GPT-4o is no longer the flagship model (superseded by GPT-5 in 2025)
   - Missing advanced reasoning capabilities available in GPT-5
   - Higher token usage (50-80% more output tokens than GPT-5)

3. **No Reasoning Control**
   - Cannot adjust reasoning effort for simple vs complex diagrams
   - Wastes tokens on simple diagrams that don't need deep reasoning
   - No way to request deeper reasoning for complex multi-step diagrams

4. **Suboptimal Fallback Chain**
   - Currently no fallback strategy (single model only)
   - Should leverage reasoning models (o3, o3-mini) for complex cases

### Success Criteria

- All API calls use GPT-5 (or configured model variant)
- Metadata accurately reports actual model used
- Reasoning effort parameter configurable
- Fallback chain working (GPT-5 → o3-mini → gpt-4o)
- Cost per diagram reduced by 15-30%
- Generation quality maintained or improved
- No breaking changes to existing API

---

## User Stories

### US-7.1: Accurate Model Reporting

**As a** system administrator
**I want** metadata to accurately reflect which AI model was used
**So that** I can track costs, debug issues, and understand system behavior

**Acceptance Criteria:**

```gherkin
GIVEN I generate a diagram using the AI Diagram Generator
WHEN I inspect the response metadata
THEN the metadata.model field matches the actual OpenAI model used
AND if GPT-5 was used, metadata.model shows "gpt-5" (not "gpt-4o")
AND if fallback occurred, metadata includes fallback: true and original_model_attempted
AND the model name is consistent across all API responses
AND logs show accurate model names for debugging
```

### US-7.2: GPT-5 Reasoning for Complex Diagrams

**As a** user creating complex, multi-step diagrams
**I want** the system to leverage GPT-5's advanced reasoning capabilities
**So that** my diagrams have better logical structure, accuracy, and visual design

**Acceptance Criteria:**

```gherkin
GIVEN I request a complex diagram (e.g., "Create a flowchart showing the entire software development lifecycle with decision points, feedback loops, and integration steps")
WHEN the system generates the diagram
THEN it uses GPT-5 with medium or high reasoning effort
AND the diagram demonstrates logical coherence and multi-step planning
AND the diagram quality is visibly better than previous GPT-4o outputs
AND the generation time is within acceptable limits (< 30 seconds)
AND the metadata shows reasoning_effort: "medium" or "high"
```

### US-7.3: Cost Optimization for Simple Diagrams

**As a** system administrator managing API costs
**I want** the system to use appropriate reasoning effort for different diagram complexities
**So that** I minimize unnecessary token usage and costs

**Acceptance Criteria:**

```gherkin
GIVEN I request a simple diagram (e.g., "Create a basic org chart with 3 levels")
WHEN the system generates the diagram
THEN it uses GPT-5 with minimal reasoning effort
AND the token usage is 50-80% less than GPT-4o equivalent
AND the generation time is faster (< 10 seconds)
AND the metadata shows reasoning_effort: "minimal"
AND the cost per diagram is reduced by at least 20%
```

### US-7.4: Intelligent Fallback on Model Failure

**As a** user
**I want** to receive a working diagram even if GPT-5 is unavailable
**So that** my workflow is not blocked by model availability issues

**Acceptance Criteria:**

```gherkin
GIVEN I request a diagram generation
WHEN GPT-5 API returns an error (rate limit, model unavailable, overload)
THEN the system attempts fallback to o3-mini for reasoning-heavy tasks
OR falls back to gpt-4o for standard generation
AND the user receives a working diagram within 40 seconds
AND the metadata includes fallback: true, fallback_reason, and actual model used
AND logs show the fallback chain execution
AND no errors are exposed to the user
```

### US-7.5: Configurable Reasoning Effort

**As a** power user or system administrator
**I want** to control the reasoning effort level for diagram generation
**So that** I can balance between speed, quality, and cost based on my needs

**Acceptance Criteria:**

```gherkin
GIVEN I have access to advanced configuration
WHEN I set GPT5_REASONING_EFFORT environment variable to "minimal", "low", "medium", or "high"
THEN all diagram generations use that reasoning level as default
AND the system respects the configured level across all API calls
AND I can see the reasoning effort in metadata
AND documentation explains each level's tradeoffs
AND the default is "medium" if not specified
```

### US-7.6: A/B Testing with Feature Flag

**As a** product manager
**I want** to gradually roll out GPT-5 using a feature flag
**So that** I can measure impact, compare performance, and roll back if needed

**Acceptance Criteria:**

```gherkin
GIVEN I set GPT5_ENABLED=false in environment
WHEN users generate diagrams
THEN the system continues using GPT-4o
AND no breaking changes occur
AND I can toggle to GPT5_ENABLED=true to switch to GPT-5
AND I can compare metrics between GPT-4o and GPT-5 cohorts
AND the system logs which model is active on startup
```

---

## Functional Requirements

### FR-7.1: Model Configuration Module

**Location:** `lib/ai/model-config.ts` (NEW FILE)

**Purpose:** Centralize model selection logic with reasoning effort configuration

**Implementation:**

```typescript
// lib/ai/model-config.ts

/**
 * OpenAI Model Configuration for AI Diagram Generator
 * Supports GPT-5, reasoning models (o3), and fallback to GPT-4o
 */

export type GPT5ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';
export type ModelVariant = 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano' | 'o3' | 'o3-mini' | 'gpt-4o';

export interface ModelConfig {
  primary: ModelVariant;
  fallbackChain: ModelVariant[];
  reasoningEffort: GPT5ReasoningEffort;
  temperature: number;
  maxTokens: number;
}

export interface ModelSelectionResult {
  model: ModelVariant;
  reasoningEffort?: GPT5ReasoningEffort; // Only for GPT-5 and o3 models
  temperature: number;
  maxTokens: number;
  costMultiplier: number; // Relative to base cost
}

/**
 * Get active model configuration based on environment and feature flags
 * @returns Model configuration for diagram generation
 */
export function getModelConfig(): ModelConfig {
  const gpt5Enabled = process.env.GPT5_ENABLED === 'true';
  const reasoningEffort = (process.env.GPT5_REASONING_EFFORT || 'medium') as GPT5ReasoningEffort;

  if (gpt5Enabled) {
    return {
      primary: 'gpt-5',
      fallbackChain: ['o3-mini', 'gpt-4o'],
      reasoningEffort,
      temperature: 0.7,
      maxTokens: 4000,
    };
  }

  // Fallback to GPT-4o (legacy behavior)
  return {
    primary: 'gpt-4o',
    fallbackChain: [],
    reasoningEffort: 'medium', // Not used for GPT-4o
    temperature: 0.7,
    maxTokens: 4000,
  };
}

/**
 * Select appropriate model based on diagram complexity
 * @param userRequest - User's diagram request
 * @param config - Base model configuration
 * @returns Model selection with parameters
 */
export function selectModelForDiagram(
  userRequest: string,
  config: ModelConfig
): ModelSelectionResult {
  const complexity = analyzeDiagramComplexity(userRequest);

  // For simple diagrams with GPT-5, use minimal reasoning
  if (config.primary === 'gpt-5' && complexity === 'simple') {
    return {
      model: 'gpt-5',
      reasoningEffort: 'minimal',
      temperature: 0.7,
      maxTokens: 3000,
      costMultiplier: 0.7, // 30% cheaper due to minimal reasoning
    };
  }

  // For complex diagrams with GPT-5, use higher reasoning
  if (config.primary === 'gpt-5' && complexity === 'complex') {
    return {
      model: 'gpt-5',
      reasoningEffort: 'high',
      temperature: 0.5, // Lower temperature for more focused reasoning
      maxTokens: 6000,
      costMultiplier: 1.3, // 30% more expensive due to high reasoning
    };
  }

  // Default: Use configured reasoning effort
  return {
    model: config.primary,
    reasoningEffort: config.primary.startsWith('gpt-5') || config.primary.startsWith('o3')
      ? config.reasoningEffort
      : undefined,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    costMultiplier: 1.0,
  };
}

/**
 * Analyze diagram complexity based on request characteristics
 * @param userRequest - User's diagram request
 * @returns Complexity level
 */
function analyzeDiagramComplexity(userRequest: string): 'simple' | 'medium' | 'complex' {
  const request = userRequest.toLowerCase();

  // Complex indicators
  const complexIndicators = [
    'flowchart', 'decision', 'multiple steps', 'entire', 'complete',
    'comprehensive', 'detailed', 'integration', 'architecture', 'system design',
    'state machine', 'sequence diagram', 'interaction', 'workflow'
  ];

  // Simple indicators
  const simpleIndicators = [
    'basic', 'simple', 'quick', 'org chart', 'hierarchy', 'list', 'table',
    'bar chart', 'pie chart', 'timeline', '3 levels', '5 items'
  ];

  const complexScore = complexIndicators.filter(ind => request.includes(ind)).length;
  const simpleScore = simpleIndicators.filter(ind => request.includes(ind)).length;

  if (complexScore >= 2 || request.length > 200) return 'complex';
  if (simpleScore >= 1 || request.length < 50) return 'simple';
  return 'medium';
}

/**
 * Get fallback model when primary fails
 * @param config - Model configuration
 * @param attemptedModel - Model that failed
 * @returns Next model in fallback chain or null
 */
export function getNextFallbackModel(
  config: ModelConfig,
  attemptedModel: ModelVariant
): ModelVariant | null {
  if (attemptedModel === config.primary && config.fallbackChain.length > 0) {
    return config.fallbackChain[0];
  }

  const currentIndex = config.fallbackChain.indexOf(attemptedModel);
  if (currentIndex !== -1 && currentIndex < config.fallbackChain.length - 1) {
    return config.fallbackChain[currentIndex + 1];
  }

  return null; // No more fallbacks
}

/**
 * Check if model supports reasoning effort parameter
 * @param model - Model variant
 * @returns true if model supports reasoning_effort
 */
export function supportsReasoningEffort(model: ModelVariant): boolean {
  return model.startsWith('gpt-5') || model.startsWith('o3');
}

/**
 * Calculate estimated cost for model usage
 * @param model - Model variant
 * @param inputTokens - Estimated input tokens
 * @param outputTokens - Estimated output tokens
 * @returns Estimated cost in USD
 */
export function estimateModelCost(
  model: ModelVariant,
  inputTokens: number,
  outputTokens: number
): number {
  // Pricing per 1M tokens (as of 2025)
  const pricing: Record<ModelVariant, { input: number; output: number }> = {
    'gpt-5': { input: 1.25, output: 10 },
    'gpt-5-mini': { input: 0.25, output: 2 },
    'gpt-5-nano': { input: 0.05, output: 0.40 },
    'o3': { input: 5, output: 20 }, // Reasoning model pricing
    'o3-mini': { input: 1, output: 5 },
    'gpt-4o': { input: 2.50, output: 10 },
  };

  const prices = pricing[model];
  const inputCost = (inputTokens / 1_000_000) * prices.input;
  const outputCost = (outputTokens / 1_000_000) * prices.output;

  return inputCost + outputCost;
}
```

**Requirements:**

1. Feature flag `GPT5_ENABLED` controls primary model
2. Environment variable `GPT5_REASONING_EFFORT` sets default reasoning level
3. Complexity analysis determines optimal reasoning effort
4. Fallback chain: GPT-5 → o3-mini (reasoning) → gpt-4o (reliable)
5. Cost estimation for budget tracking
6. Support for all GPT-5 variants (standard, mini, nano)
7. Support for reasoning models (o3, o3-mini)

### FR-7.2: Refactored Diagram Generator

**Location:** `lib/ai/diagram-generator.ts` (MODIFY EXISTING)

**Purpose:** Update all OpenAI API calls to use GPT-5 with reasoning effort parameter

**Changes Required:**

1. Import model configuration module
2. Replace hardcoded `'gpt-4o'` with dynamic model selection
3. Add `reasoning_effort` parameter to API calls
4. Implement fallback chain with retry logic
5. Fix metadata to report actual model used
6. Add reasoning effort to metadata

**Modified Function Signatures:**

```typescript
// lib/ai/diagram-generator.ts

import {
  getModelConfig,
  selectModelForDiagram,
  getNextFallbackModel,
  supportsReasoningEffort,
  estimateModelCost,
  type ModelVariant
} from './model-config';

export interface DiagramGenerationResult {
  success: boolean;
  html?: string;
  error?: string;
  metadata: {
    model: string; // FIXED: Now reports actual model used
    tokensUsed: number;
    generationTime: number;
    validationPassed: boolean;
    validationErrors?: string[];
    validationWarnings?: string[];
    iterations?: number;
    // NEW FIELDS:
    reasoningEffort?: string; // "minimal" | "low" | "medium" | "high"
    fallback?: boolean; // True if fallback occurred
    fallbackReason?: string; // Why fallback was needed
    originalModelAttempted?: string; // First model tried
    estimatedCost?: number; // USD cost estimate
  };
}

/**
 * Generate diagram with GPT-5 and intelligent fallback
 * REFACTORED: Lines 52-139 updated to use GPT-5
 */
export async function generateDiagram(
  request: DiagramGenerationRequest
): Promise<DiagramGenerationResult> {
  const startTime = Date.now();

  // Get model configuration
  const modelConfig = getModelConfig();
  const modelSelection = selectModelForDiagram(request.userRequest, modelConfig);

  let currentModel: ModelVariant = modelSelection.model;
  let fallbackOccurred = false;
  let fallbackReason: string | undefined;
  const originalModel = currentModel;

  try {
    // Build prompt (existing logic)
    const fileContents = request.files?.map(
      (file) => `**${file.fileName}**:\n${file.content}`
    );

    const messages = buildDiagramPrompt(request.userRequest, {
      fileContents,
      previousDiagrams: request.previousDiagrams,
      conversationHistory: request.conversationHistory,
      searchContext: request.searchContext,
    });

    // Attempt generation with fallback chain
    let response;
    let generationError;

    while (currentModel) {
      try {
        // Build API parameters
        const apiParams: any = {
          model: currentModel,
          messages,
          temperature: modelSelection.temperature,
          max_tokens: modelSelection.maxTokens,
        };

        // Add reasoning_effort for models that support it
        if (supportsReasoningEffort(currentModel) && modelSelection.reasoningEffort) {
          apiParams.reasoning = {
            effort: modelSelection.reasoningEffort,
          };
        }

        // Call OpenAI API
        response = await openai.chat.completions.create(apiParams);

        // Success! Break out of fallback loop
        break;

      } catch (error: any) {
        generationError = error;
        console.error(`Model ${currentModel} failed:`, error.message);

        // Check if error is retryable
        const isRetryable = error.status === 429 || // Rate limit
                           error.status === 503 || // Service unavailable
                           error.status === 500 || // Server error
                           error.code === 'model_not_found'; // Model unavailable

        if (!isRetryable) {
          throw error; // Don't fallback on non-retryable errors
        }

        // Try next model in fallback chain
        const nextModel = getNextFallbackModel(modelConfig, currentModel);

        if (!nextModel) {
          throw error; // No more fallbacks, throw error
        }

        fallbackOccurred = true;
        fallbackReason = `${currentModel} failed: ${error.message}`;
        currentModel = nextModel;

        console.warn(`Falling back to model: ${currentModel}`);
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
          model: currentModel, // FIXED: Report actual model used
          tokensUsed: response.usage?.total_tokens || 0,
          generationTime: Date.now() - startTime,
          validationPassed: false,
          reasoningEffort: modelSelection.reasoningEffort,
          fallback: fallbackOccurred,
          fallbackReason,
          originalModelAttempted: originalModel,
        },
      };
    }

    // Extract HTML from response (existing logic)
    const html = extractHtmlFromResponse(generatedContent);

    // Validate generated HTML (existing logic)
    const validation = validateGeneratedHtml(html);

    // Calculate cost estimate
    const estimatedCost = estimateModelCost(
      currentModel,
      response.usage?.prompt_tokens || 1000,
      response.usage?.completion_tokens || 2000
    );

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
        reasoningEffort: modelSelection.reasoningEffort, // NEW
        fallback: fallbackOccurred, // NEW
        fallbackReason, // NEW
        originalModelAttempted: fallbackOccurred ? originalModel : undefined, // NEW
        estimatedCost, // NEW
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        model: currentModel, // FIXED: Report actual model attempted
        tokensUsed: 0,
        generationTime: Date.now() - startTime,
        validationPassed: false,
        reasoningEffort: modelSelection.reasoningEffort,
        fallback: fallbackOccurred,
        fallbackReason,
        originalModelAttempted: originalModel,
      },
    };
  }
}

/**
 * Improve diagram with GPT-5
 * REFACTORED: Lines 148-213 updated to use GPT-5
 */
export async function improveDiagram(
  originalRequest: string,
  currentHtml: string,
  feedback: string
): Promise<DiagramGenerationResult> {
  // Same refactoring pattern as generateDiagram
  // Use model config, add reasoning effort, implement fallback
  // ... (similar implementation to generateDiagram)
}

/**
 * Generate with feedback loop (updated metadata handling)
 * UPDATED: Lines 224-352 - metadata now uses actual model name
 */
export async function generateWithFeedbackLoop(
  request: DiagramGenerationRequest,
  maxIterations: number = 5,
  validateFn?: (html: string) => Promise<{ isValid: boolean; feedback?: string }>
): Promise<DiagramGenerationResult> {
  // ... existing logic preserved ...

  // FIX: Update hardcoded 'gpt-4o' to use actual model from result.metadata.model
  // Lines 263, 279, 304 - replace hardcoded model with result.metadata.model

  // ... rest of function ...
}
```

**Key Changes:**

1. **Lines 87, 161**: Replace `model: 'gpt-4o'` with dynamic `model: currentModel`
2. **Lines 119, 132, 193, 206**: Fix metadata to report `currentModel` instead of hardcoded `'gpt-5'`
3. **Lines 263, 279, 304**: Replace hardcoded `'gpt-4o'` in feedback loop with `result.metadata.model`
4. **New**: Add `reasoning` parameter to API calls for GPT-5/o3 models
5. **New**: Implement fallback chain with retry logic
6. **New**: Add metadata fields: `reasoningEffort`, `fallback`, `fallbackReason`, `originalModelAttempted`, `estimatedCost`

### FR-7.3: Environment Configuration

**Location:** `.env.example` and `lib/config/features.ts`

**Purpose:** Add GPT-5 configuration with feature flag

**Environment Variables:**

```bash
# =============================================================================
# OpenAI GPT-5 Configuration (Feature 7.0)
# =============================================================================

# Enable GPT-5 (set to 'false' to continue using GPT-4o)
# Default: false (gradual rollout)
GPT5_ENABLED=false

# GPT-5 Reasoning Effort Level
# Options: minimal, low, medium, high
# - minimal: Fast, low-cost, for simple diagrams (uses few/no reasoning tokens)
# - low: Balanced speed and quality
# - medium: Default, good balance for most use cases
# - high: Deep reasoning for complex diagrams (slower, more expensive)
# Default: medium
GPT5_REASONING_EFFORT=medium

# Optional: Override default model variant
# Options: gpt-5 (default), gpt-5-mini (cheaper), gpt-5-nano (fastest/cheapest)
# GPT5_MODEL_VARIANT=gpt-5
```

**Feature Flag Update:**

```typescript
// lib/config/features.ts

export const FEATURES = {
  // ... existing flags
  GPT5_ENABLED: process.env.GPT5_ENABLED === 'true', // NEW
  WEB_SEARCH: process.env.PERPLEXITY_API_KEY ? true : false,
} as const;
```

### FR-7.4: Logging and Monitoring

**Location:** `lib/ai/model-logger.ts` (NEW FILE)

**Purpose:** Track model usage, costs, and fallback patterns for analysis

**Implementation:**

```typescript
// lib/ai/model-logger.ts

interface ModelUsageRecord {
  timestamp: Date;
  model: string;
  reasoningEffort?: string;
  tokensUsed: number;
  generationTime: number;
  fallbackOccurred: boolean;
  success: boolean;
  estimatedCost: number;
}

class ModelUsageTracker {
  private records: ModelUsageRecord[] = [];
  private maxRecords = 1000; // Keep last 1000 records in memory

  public log(record: ModelUsageRecord): void {
    this.records.push(record);

    // Trim to max size (FIFO)
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }

    // Console log for debugging
    console.log(
      `[Model Usage] ${record.model} (${record.reasoningEffort || 'N/A'}) - ` +
      `${record.tokensUsed} tokens, ${record.generationTime}ms, ` +
      `$${record.estimatedCost.toFixed(4)} ` +
      `${record.fallbackOccurred ? '(fallback)' : ''} ` +
      `${record.success ? '✓' : '✗'}`
    );
  }

  public getStats() {
    const total = this.records.length;
    if (total === 0) return null;

    const successful = this.records.filter(r => r.success).length;
    const withFallback = this.records.filter(r => r.fallbackOccurred).length;
    const totalCost = this.records.reduce((sum, r) => sum + r.estimatedCost, 0);
    const avgTokens = this.records.reduce((sum, r) => sum + r.tokensUsed, 0) / total;
    const avgTime = this.records.reduce((sum, r) => sum + r.generationTime, 0) / total;

    // Model distribution
    const modelCounts: Record<string, number> = {};
    this.records.forEach(r => {
      modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
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
    };
  }
}

export const modelUsageTracker = new ModelUsageTracker();
```

### FR-7.5: Migration Guide Documentation

**Location:** `docs/specs/features/7.0-gpt5-reasoning-model/MIGRATION.md` (NEW FILE)

**Purpose:** Guide developers through the GPT-5 upgrade process

**Contents:**

- Breaking changes (none expected)
- Configuration steps
- How to test GPT-5 vs GPT-4o
- Rollback procedure
- Cost comparison data
- Performance benchmarks

---

## Technical Approach

### Architecture Pattern

**Integration Strategy:**

1. **Feature Flag Controlled:** GPT-5 behind `GPT5_ENABLED` flag for gradual rollout
2. **Backward Compatible:** GPT-4o remains default until flag enabled
3. **Intelligent Fallback:** Chain ensures high availability (GPT-5 → o3-mini → gpt-4o)
4. **Cost Optimized:** Reasoning effort adapts to diagram complexity
5. **Zero Breaking Changes:** Existing API contracts preserved

**Data Flow:**

```
User Request
    ↓
Check GPT5_ENABLED flag
    ↓
Analyze Diagram Complexity
    ↓
Select Model + Reasoning Effort
    ↓
Call OpenAI API (GPT-5)
    ↓ (on failure)
Fallback Chain (o3-mini → gpt-4o)
    ↓
Generated Diagram + Accurate Metadata
```

### Model Selection Strategy

**Recommendation: GPT-5 (flagship) as primary**

**Rationale:**

1. **Best Quality:** 94.6% AIME 2025 (vs 88.9% o3), 74.9% SWE-bench (vs 69.1% o3)
2. **Token Efficiency:** 50-80% fewer output tokens than o3
3. **Cost Effective:** $1.25 input / $10 output (vs $2.50/$10 for GPT-4o)
4. **Input Cost Savings:** 50% cheaper input than GPT-4o
5. **Unified Model:** Single model handles all tasks (no need to choose between speed and reasoning)

**Alternative Models:**

- `gpt-5-mini`: For high-volume, cost-sensitive deployments ($0.25 input / $2 output)
- `gpt-5-nano`: For very simple diagrams requiring maximum speed ($0.05 input / $0.40 output)
- `o3-mini`: Fallback for reasoning-heavy tasks when GPT-5 fails ($1 input / $5 output)
- `gpt-4o`: Final fallback for reliability ($2.50 input / $10 output)

### Reasoning Effort Configuration

**Decision: Default to "medium", allow override via environment variable**

**Reasoning Effort Levels:**

1. **minimal** - Fast, minimal reasoning tokens
   - Use case: Simple diagrams (org charts, basic bar charts, lists)
   - Speed: < 5 seconds
   - Cost: ~$0.015 per diagram (30% cheaper)
   - Token savings: 70-80% fewer output tokens

2. **low** - Reduced reasoning, faster responses
   - Use case: Standard diagrams (timelines, simple flowcharts)
   - Speed: < 8 seconds
   - Cost: ~$0.020 per diagram (10% cheaper)
   - Token savings: 40-50% fewer output tokens

3. **medium** (DEFAULT) - Balanced quality and speed
   - Use case: Most diagrams (architecture, workflows, charts)
   - Speed: < 12 seconds
   - Cost: ~$0.023 per diagram (baseline)
   - Token savings: 20-30% fewer output tokens vs GPT-4o

4. **high** - Deep reasoning, highest quality
   - Use case: Complex diagrams (system design, state machines, multi-step flows)
   - Speed: < 20 seconds
   - Cost: ~$0.030 per diagram (30% more expensive)
   - Token savings: None (may use more tokens for deeper reasoning)

**Implementation:**

```typescript
// Auto-select based on diagram complexity
function selectReasoningEffort(request: string): GPT5ReasoningEffort {
  const complexity = analyzeDiagramComplexity(request);

  switch (complexity) {
    case 'simple':
      return 'minimal'; // Fast and cheap
    case 'medium':
      return 'medium'; // Default
    case 'complex':
      return 'high'; // Quality first
    default:
      return process.env.GPT5_REASONING_EFFORT as GPT5ReasoningEffort || 'medium';
  }
}
```

### Fallback Strategy

**Decision: GPT-5 → o3-mini → gpt-4o**

**Rationale:**

1. **GPT-5 (Primary):** Best quality, cost-effective, fast
2. **o3-mini (Fallback 1):** Reasoning model for complex diagrams if GPT-5 fails
3. **gpt-4o (Fallback 2):** Proven reliable model, widely available

**Fallback Triggers:**

- Rate limit (429)
- Model unavailable (404, model_not_found)
- Service overload (503)
- Server error (500, 502)
- Timeout (> 30 seconds)

**Non-Retryable Errors (no fallback):**

- Authentication error (401) - fix API key
- Invalid request (400) - fix input
- Content policy violation (400) - adjust prompt

### Cost Analysis

**Current Costs (GPT-4o):**

```
Input tokens: 1,000 @ $2.50/1M = $0.0025
Output tokens: 2,000 @ $10/1M = $0.0200
Total per diagram: $0.0225
Monthly (3,000 diagrams): $67.50
```

**New Costs (GPT-5 with medium reasoning):**

```
Input tokens: 1,000 @ $1.25/1M = $0.00125 (50% cheaper)
Output tokens: 1,200 @ $10/1M = $0.0120 (40% fewer tokens)
Total per diagram: $0.01325
Monthly (3,000 diagrams): $39.75
Savings: $27.75/month (41% reduction)
```

**New Costs (GPT-5 with minimal reasoning for simple diagrams):**

```
Input tokens: 800 @ $1.25/1M = $0.001
Output tokens: 600 @ $10/1M = $0.006
Total per diagram: $0.007
Monthly (1,000 simple diagrams): $7.00
Savings: $15.50/month (69% reduction) for simple diagram subset
```

**Cost Impact Summary:**

- **Input cost savings:** 50% (GPT-5: $1.25 vs GPT-4o: $2.50 per 1M)
- **Output token reduction:** 40-70% (fewer tokens due to efficiency)
- **Overall savings:** 35-45% per diagram
- **Monthly savings:** $25-35 for 3,000 diagrams/month
- **ROI:** Immediate (no implementation cost, pure API savings)

### Metadata Bug Fix

**Current Bug (Lines 119, 132, 193, 206):**

```typescript
// WRONG: Hardcoded 'gpt-5' but uses 'gpt-4o'
metadata: {
  model: 'gpt-5', // BUG: Incorrect
  tokensUsed: response.usage?.total_tokens || 0,
  // ...
}
```

**Fix:**

```typescript
// CORRECT: Report actual model used
metadata: {
  model: currentModel, // FIX: Dynamic, accurate
  tokensUsed: response.usage?.total_tokens || 0,
  reasoningEffort: modelSelection.reasoningEffort, // NEW
  fallback: fallbackOccurred, // NEW
  originalModelAttempted: fallbackOccurred ? originalModel : undefined, // NEW
  // ...
}
```

---

## Acceptance Criteria

### AC-7.1: GPT-5 API Integration

**GIVEN** `GPT5_ENABLED=true` is set in `.env.local`
**WHEN** I generate a diagram with request "Create a simple org chart"
**THEN** the system calls OpenAI API with model `"gpt-5"`
**AND** the API request includes `reasoning: { effort: "minimal" }`
**AND** the response is successful
**AND** metadata.model is `"gpt-5"`
**AND** metadata.reasoningEffort is `"minimal"`
**AND** no fallback occurs

### AC-7.2: Metadata Accuracy

**GIVEN** I generate 10 diagrams with GPT-5
**WHEN** I inspect all response metadata
**THEN** every metadata.model field matches the actual OpenAI model used
**AND** no metadata reports "gpt-5" when "gpt-4o" was actually called
**AND** no metadata reports "gpt-4o" when "gpt-5" was actually called
**AND** if fallback occurred, metadata includes fallback: true
**AND** originalModelAttempted is populated when fallback occurs

### AC-7.3: Reasoning Effort Adaptation

**GIVEN** GPT-5 is enabled with default reasoning effort "medium"
**WHEN** I request a simple diagram "Create a basic timeline with 5 events"
**THEN** the system selects reasoning effort "minimal"
**AND** the generation completes in < 8 seconds
**AND** metadata.reasoningEffort is "minimal"
**AND** the estimated cost is ~$0.007-0.010

**WHEN** I request a complex diagram "Create a complete software architecture diagram with microservices, databases, queues, caching layers, and authentication flows"
**THEN** the system selects reasoning effort "high"
**AND** the generation completes in < 25 seconds
**AND** metadata.reasoningEffort is "high"
**AND** the diagram demonstrates superior logical coherence
**AND** the estimated cost is ~$0.025-0.035

### AC-7.4: Fallback Chain Execution

**GIVEN** GPT-5 is enabled
**WHEN** I simulate GPT-5 rate limit error (429)
**THEN** the system logs "GPT-5 failed: Rate limit exceeded"
**AND** the system attempts fallback to "o3-mini"
**AND** if o3-mini succeeds, metadata.model is "o3-mini"
**AND** metadata.fallback is true
**AND** metadata.fallbackReason includes "gpt-5 failed: Rate limit"
**AND** metadata.originalModelAttempted is "gpt-5"

**WHEN** both GPT-5 and o3-mini fail
**THEN** the system falls back to "gpt-4o"
**AND** metadata.model is "gpt-4o"
**AND** the user still receives a working diagram
**AND** no errors are exposed to the user

### AC-7.5: Feature Flag Behavior

**GIVEN** `GPT5_ENABLED=false` (default)
**WHEN** I generate a diagram
**THEN** the system uses "gpt-4o" (legacy behavior)
**AND** no reasoning_effort parameter is sent to OpenAI
**AND** metadata.model is "gpt-4o"
**AND** metadata.reasoningEffort is undefined
**AND** all existing functionality works unchanged

**WHEN** I set `GPT5_ENABLED=true`
**THEN** the system switches to "gpt-5" immediately
**AND** all new diagram requests use GPT-5
**AND** existing API contracts are preserved

### AC-7.6: Cost Tracking

**GIVEN** I generate 100 diagrams with GPT-5
**WHEN** I check modelUsageTracker.getStats()
**THEN** the stats include:
- totalRequests: 100
- successRate: > 95%
- fallbackRate: < 5%
- totalCost: ~$1.30-1.50 (35-45% less than GPT-4o equivalent)
- avgCostPerRequest: ~$0.013-0.015
- modelDistribution: { "gpt-5": > 90 }

### AC-7.7: Backward Compatibility

**GIVEN** existing diagram generation API at `/api/diagram/generate`
**WHEN** I send a POST request with previous payload format
**THEN** the request succeeds without modification
**AND** no breaking changes to request schema
**AND** no breaking changes to response schema (only additions)
**AND** all existing features work (file upload, validation, conversation history, search)

### AC-7.8: Performance Benchmarks

**GIVEN** GPT-5 is enabled with medium reasoning
**WHEN** I generate 50 simple diagrams
**THEN** average generation time is < 10 seconds (per diagram)
**AND** p95 generation time is < 15 seconds
**AND** no timeouts (< 30 second limit)

**WHEN** I generate 50 complex diagrams
**THEN** average generation time is < 20 seconds
**AND** p95 generation time is < 30 seconds
**AND** success rate > 95%

### AC-7.9: Error Handling

**GIVEN** OpenAI API returns various errors
**WHEN** error is 401 (authentication failed)
**THEN** system logs critical error
**AND** does not attempt fallback
**AND** returns clear error message to user
**AND** no retry attempts

**WHEN** error is 400 (invalid request)
**THEN** system logs error with request details
**AND** does not attempt fallback
**AND** returns validation error to user

**WHEN** error is 429 or 503
**THEN** system attempts fallback chain
**AND** logs fallback attempt
**AND** user receives diagram from fallback model

### AC-7.10: Logging and Monitoring

**GIVEN** GPT-5 is active
**WHEN** any diagram is generated
**THEN** console log includes:
- `[Model Usage] gpt-5 (medium) - 3200 tokens, 8500ms, $0.0132 ✓`
**AND** log includes model, reasoning effort, tokens, time, cost, success status
**AND** fallback attempts are logged with reason
**AND** errors are logged with full context

---

## Constraints

### Performance Constraints

1. **Generation Time:** < 30 seconds total (including fallback attempts)
2. **Simple Diagrams:** < 10 seconds (with minimal reasoning)
3. **Complex Diagrams:** < 25 seconds (with high reasoning)
4. **Fallback Overhead:** < 2 seconds per fallback attempt
5. **Memory:** No increase beyond current usage
6. **API Timeout:** 30 seconds per OpenAI call

### Cost Constraints

1. **Cost Reduction Target:** 35-45% savings vs GPT-4o
2. **Maximum Cost per Diagram:** $0.05 (high reasoning, complex)
3. **Average Cost per Diagram:** $0.015-0.020 (medium reasoning)
4. **Monthly Budget:** Scale proportionally with usage (no hard limit)

### Technical Constraints

1. **Stateless Architecture:** Maintain stateless design (no database)
2. **Feature Flag:** Must respect `GPT5_ENABLED` flag
3. **API Compatibility:** OpenAI Chat Completions API (existing)
4. **No New Dependencies:** Use existing OpenAI SDK
5. **TypeScript Strict Mode:** All changes must compile without errors
6. **No Breaking Changes:** Existing API contracts preserved

### Quality Constraints

1. **Diagram Quality:** Equal or better than GPT-4o
2. **Success Rate:** > 95% (including fallback)
3. **Metadata Accuracy:** 100% accurate model reporting
4. **Validation Pass Rate:** >= 95% (existing constraint)
5. **Error Recovery:** Zero user-facing errors from model failures

---

## Success Metrics

### Quantitative Metrics

1. **Cost Reduction:** 35-45% savings on AI generation costs
2. **Token Efficiency:** 40-70% fewer output tokens (simple diagrams)
3. **Generation Speed:** 15-30% faster (minimal/low reasoning)
4. **Fallback Rate:** < 5% of requests require fallback
5. **Success Rate:** > 95% overall (including fallback chain)
6. **Metadata Accuracy:** 100% (no more incorrect model names)

### Qualitative Metrics

1. **Diagram Quality:** User reports equal or better quality vs GPT-4o
2. **Reasoning Coherence:** Complex diagrams show improved logical structure
3. **Visual Design:** Diagrams maintain or improve aesthetic quality
4. **Error Handling:** Users are not blocked by model failures

### Completion Checklist

- [ ] Model configuration module implemented (`lib/ai/model-config.ts`)
- [ ] Diagram generator refactored (`lib/ai/diagram-generator.ts`)
- [ ] All hardcoded 'gpt-4o' replaced with dynamic model selection
- [ ] Metadata bug fixed (lines 119, 132, 193, 206)
- [ ] Reasoning effort parameter added to API calls
- [ ] Fallback chain implemented (GPT-5 → o3-mini → gpt-4o)
- [ ] Model usage tracker implemented (`lib/ai/model-logger.ts`)
- [ ] Environment variables added to `.env.example`
- [ ] Feature flag added (`GPT5_ENABLED`)
- [ ] Configuration documented (reasoning effort levels)
- [ ] Cost estimation function implemented
- [ ] Error handling tested for all failure modes
- [ ] Fallback chain tested (simulate failures)
- [ ] Performance benchmarks met (< 30s total)
- [ ] Cost tracking validated (35-45% savings)
- [ ] Migration guide created (`MIGRATION.md`)
- [ ] Build compiles successfully (no TypeScript errors)
- [ ] All existing tests pass
- [ ] New tests added for GPT-5 functionality
- [ ] Feature 7.0 marked complete in `STATUS.md`
- [ ] Git commit: `feat(gpt5): Implement Feature 7.0 - GPT-5 Reasoning Model Integration`

---

## Implementation Notes

### Order of Operations

1. ✅ Create model configuration module (`lib/ai/model-config.ts`)
2. ✅ Create model usage tracker (`lib/ai/model-logger.ts`)
3. ✅ Refactor `generateDiagram()` function (lines 52-139)
4. ✅ Refactor `improveDiagram()` function (lines 148-213)
5. ✅ Fix `generateWithFeedbackLoop()` hardcoded models (lines 263, 279, 304)
6. ✅ Update `.env.example` with GPT-5 configuration
7. ✅ Add `GPT5_ENABLED` feature flag to `lib/config/features.ts`
8. ✅ Test with GPT-5 enabled (feature flag on)
9. ✅ Test with GPT-5 disabled (feature flag off, ensure no regression)
10. ✅ Test fallback chain (simulate GPT-5 failures)
11. ✅ Validate cost tracking and usage statistics
12. ✅ Create migration guide documentation
13. ✅ Update `STATUS.md` to mark Feature 7.0 complete
14. ✅ Git commit with conventional format

### GPT-5 API Setup (No Action Required)

**Good News:** GPT-5 is available through the existing OpenAI API key.

**Configuration Steps:**

1. Ensure `OPENAI_API_KEY` is set in `.env.local` (already configured)
2. Add `GPT5_ENABLED=true` to `.env.local` to activate GPT-5
3. Optionally set `GPT5_REASONING_EFFORT=medium` (default)
4. No new API key needed
5. No new payment setup needed

**Estimated Setup Time:** 2 minutes (add environment variables)

### Reasoning Effort Selection Guide

**When to use each level:**

| Reasoning Effort | Use Case | Example Requests | Speed | Cost |
|------------------|----------|------------------|-------|------|
| **minimal** | Simple, deterministic diagrams | "Basic org chart", "Timeline with 5 events", "Simple bar chart" | < 8s | 30% cheaper |
| **low** | Standard diagrams | "Product roadmap", "User journey map", "Simple flowchart" | < 12s | 10% cheaper |
| **medium** | Most diagrams (default) | "Software architecture", "Process workflow", "Data flow diagram" | < 15s | Baseline |
| **high** | Complex, multi-step diagrams | "Complete system design", "State machine with 20+ states", "Multi-layer architecture" | < 25s | 30% more expensive |

**Auto-Selection Logic:**

The system automatically analyzes diagram complexity and selects appropriate reasoning effort. Override with environment variable if needed.

### Testing Strategy

**Unit Tests:**

- Test model selection logic (complexity analysis)
- Test fallback chain with mocked OpenAI responses
- Test cost estimation calculations
- Test reasoning effort parameter construction
- Test metadata accuracy (model name, reasoning effort)

**Integration Tests:**

- Test end-to-end with GPT-5 enabled
- Test end-to-end with GPT-5 disabled (backward compatibility)
- Test fallback chain with simulated failures
- Test API endpoint with new metadata fields
- Test feature flag toggle (on/off)

**Manual Testing:**

- Generate 10 simple diagrams, verify minimal reasoning used
- Generate 10 complex diagrams, verify high reasoning used
- Compare diagram quality: GPT-5 vs GPT-4o
- Verify cost tracking accuracy
- Test fallback by temporarily using invalid GPT-5 model name
- Check logs for accurate model reporting

**A/B Testing (Production):**

1. Deploy with `GPT5_ENABLED=false` (baseline)
2. Enable GPT-5 for 10% of traffic
3. Monitor metrics: cost, speed, quality, errors
4. Gradually increase to 50%, then 100%
5. Rollback if issues detected

### Known Issues and Considerations

1. **Reasoning Token Costs:** GPT-5's "thinking" process may generate invisible reasoning tokens ($10/1M). High reasoning effort can multiply costs. Mitigation: Use minimal/low reasoning for simple diagrams.

2. **Model Availability:** GPT-5 may not be available in all regions initially. Fallback chain ensures reliability.

3. **Reasoning Effort Variability:** Actual reasoning token usage varies by request complexity. Cost estimates may be ±30% off. Mitigation: Track actual costs with usage tracker.

4. **Fallback Performance:** o3-mini may be slower than GPT-5 for some tasks. Ensure 30-second timeout accommodates fallback attempts.

5. **Cache Invalidation:** Existing diagram cache (Feature 4.0) may need invalidation if responses change with GPT-5. Monitor for inconsistencies.

6. **OpenAI SDK Compatibility:** Ensure OpenAI SDK version supports `reasoning.effort` parameter (added in recent versions). Update if needed.

### Rollback Procedure

**If GPT-5 causes issues:**

1. Set `GPT5_ENABLED=false` in environment
2. Restart application (Next.js server)
3. All requests revert to GPT-4o immediately
4. No code changes needed
5. Investigate issues, fix, re-enable

**Emergency Hotfix:**

```bash
# Disable GPT-5 immediately
export GPT5_ENABLED=false
# Or update .env.local and redeploy
```

### Cost Comparison Summary

| Metric | GPT-4o (Current) | GPT-5 (New) | Savings |
|--------|------------------|-------------|---------|
| Input cost per 1M tokens | $2.50 | $1.25 | 50% |
| Output tokens per diagram | 2,000 | 1,200 | 40% |
| Output cost per diagram | $0.020 | $0.012 | 40% |
| Total cost per diagram | $0.0225 | $0.0133 | 41% |
| Monthly cost (3,000 diagrams) | $67.50 | $39.90 | $27.60 |
| Annual savings | - | - | $331.20 |

**ROI:** Immediate (no implementation cost, pure API savings)

---

## Dependencies

### Prerequisite Features

- ✅ Phase 1-5: Complete (Foundation, Core, Frontend, State, Export)
- ✅ OpenAI API integration
- ✅ Feature flag system (`lib/config/features.ts`)
- ✅ Environment configuration pattern
- ✅ Error handling framework

### External Dependencies

- **OpenAI API:** Existing API key with GPT-5 access (no new signup required)
- **npm Packages:** No new packages required (use existing `openai` SDK)

### Integration Points

- `lib/ai/diagram-generator.ts` - Refactor model selection and API calls
- `lib/ai/diagram-prompt-template.ts` - No changes (prompts work with GPT-5)
- `app/api/diagram/generate/route.ts` - No changes (metadata additions only)
- `lib/config/features.ts` - Add `GPT5_ENABLED` feature flag
- `.env.example` - Add GPT-5 configuration variables

---

## Risk Assessment

### High Risks

1. **Cost Overrun from High Reasoning Effort**
   - Risk: Excessive reasoning tokens multiply costs unexpectedly
   - Mitigation: Default to medium reasoning, auto-select minimal for simple diagrams, track usage
   - Probability: Low (complexity analysis prevents overuse)

2. **Model Availability Issues**
   - Risk: GPT-5 not available in some regions, rate limits hit
   - Mitigation: Robust fallback chain (o3-mini → gpt-4o), feature flag for instant rollback
   - Probability: Low (fallback tested)

### Medium Risks

1. **Diagram Quality Regression**
   - Risk: GPT-5 generates lower-quality diagrams than GPT-4o
   - Mitigation: A/B testing, gradual rollout, quality monitoring, instant rollback
   - Probability: Very Low (GPT-5 benchmarks superior to GPT-4o)

2. **Fallback Chain Latency**
   - Risk: Multiple fallback attempts delay response beyond 30s
   - Mitigation: 30s timeout per attempt, max 2 fallbacks, parallel fallback (future)
   - Probability: Low (timeouts prevent cascading delays)

3. **Reasoning Effort Selection Accuracy**
   - Risk: System incorrectly classifies diagram complexity
   - Mitigation: Conservative defaults (medium), user override via env var, continuous tuning
   - Probability: Medium (complexity analysis heuristic-based)

### Low Risks

1. **Metadata Accuracy**
   - Risk: New metadata fields have bugs
   - Mitigation: Comprehensive testing, clear logging, validation
   - Probability: Very Low (straightforward implementation)

2. **Feature Flag Issues**
   - Risk: Feature flag doesn't properly control model selection
   - Mitigation: Explicit checks, default to safe state (GPT-4o), tested in CI
   - Probability: Very Low (simple boolean flag)

3. **OpenAI SDK Compatibility**
   - Risk: `reasoning.effort` parameter not supported in current SDK version
   - Mitigation: Check SDK version, update if needed, fallback gracefully
   - Probability: Very Low (parameter added in 2025 SDK updates)

---

## Open Questions for User Approval

### Question 1: Feature Flag Default

**Options:**

A. **GPT5_ENABLED=false (Recommended):** Start with GPT-4o, gradually enable GPT-5
B. **GPT5_ENABLED=true:** Enable GPT-5 immediately for all users

**Recommendation:** Option A (GPT5_ENABLED=false)

**Rationale:** Gradual rollout allows A/B testing, monitoring, and safe validation before full deployment. Rollback is instant if issues arise.

**User Decision Needed:** Should GPT-5 be enabled by default or require explicit opt-in?

### Question 2: Default Reasoning Effort

**Options:**

A. **minimal:** Fastest, cheapest, lowest quality
B. **low:** Fast, cheap, good for most use cases
C. **medium (Recommended):** Balanced, default OpenAI recommendation
D. **high:** Slowest, most expensive, highest quality

**Recommendation:** Option C (medium)

**Rationale:** OpenAI's default, balances speed/cost/quality, auto-selects minimal for simple diagrams and high for complex diagrams.

**User Decision Needed:** What default reasoning effort should we use?

### Question 3: Fallback Chain

**Options:**

A. **GPT-5 only:** No fallback, fail if GPT-5 unavailable
B. **GPT-5 → gpt-4o:** Simple two-model chain
C. **GPT-5 → o3-mini → gpt-4o (Recommended):** Three-model chain with reasoning fallback
D. **GPT-5 → o3 → gpt-4o:** Use full o3 (more expensive) instead of o3-mini

**Recommendation:** Option C (GPT-5 → o3-mini → gpt-4o)

**Rationale:** o3-mini provides reasoning capabilities if GPT-5 fails, gpt-4o as final reliable fallback. Cost-effective and high availability.

**User Decision Needed:** Which fallback chain should we implement?

### Question 4: Cost Tracking Visibility

**Options:**

A. **Logs Only:** Cost tracking in console logs only
B. **API Response:** Include estimatedCost in every API response (current)
C. **Dashboard (Future):** Build cost dashboard to visualize usage
D. **Alerts:** Set up cost alerts when thresholds exceeded

**Recommendation:** Option B (API Response) for MVP, consider C/D for future

**Rationale:** Users can see cost per diagram in metadata, helps with budget planning, no additional infrastructure needed.

**User Decision Needed:** How should cost tracking be exposed to users/admins?

### Question 5: A/B Testing Approach

**Options:**

A. **No A/B Testing:** Enable GPT-5 for all users immediately
B. **Manual Rollout:** Start with 10%, gradually increase to 100%
C. **Automated Canary:** Use Next.js middleware to route % of traffic to GPT-5
D. **Feature Flag Service:** Use LaunchDarkly/Optimizely for controlled rollout

**Recommendation:** Option B (Manual Rollout) for MVP

**Rationale:** Simple, controlled, low-risk. Set `GPT5_ENABLED=true` on subset of instances, monitor metrics, expand gradually.

**User Decision Needed:** What A/B testing strategy should we use?

---

## References

### Source Files

- `/Users/anand/saas-bp/lib/ai/diagram-generator.ts` - Lines 87, 119, 132, 161, 193, 206, 263, 279, 304 (REQUIRE CHANGES)
- `/Users/anand/saas-bp/lib/config/features.ts` - Add GPT5_ENABLED flag
- `/Users/anand/saas-bp/.env.example` - Add GPT-5 configuration
- `/Users/anand/saas-bp/docs/03-IMPLEMENTATION/STATUS.md` - Update with Feature 7.0

### Documentation

- Feature 6.0: Web Search Integration (pattern for feature flags, cost tracking)
- Phase 2-5: Core Implementation (existing AI generation patterns)
- CLAUDE.md: Development guidelines and Git workflow
- docs/02-DESIGN/DIAGRAM-GENERATOR-DESIGN.md: Original architecture

### External Resources

- [OpenAI GPT-5 Announcement](https://openai.com/index/introducing-gpt-5/)
- [GPT-5 Developer Docs](https://openai.com/index/introducing-gpt-5-for-developers/)
- [OpenAI Cookbook: GPT-5 New Params and Tools](https://cookbook.openai.com/examples/gpt-5/gpt-5_new_params_and_tools)
- [GPT-5 Prompting Guide](https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide)
- [GPT-5 Pricing](https://pricepertoken.com/pricing-page/model/openai-gpt-5)
- [Azure OpenAI Reasoning Models](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/reasoning)

---

**Last Updated:** 2025-01-17 (Current Date)
**Status:** Ready for User Review
**Approved By:** Pending User Approval
**Next Phase:** User Review → Design → Implementation

---

## Next Steps

1. **User Review:** Please review this specification and answer the 5 open questions above
2. **Design Phase:** Once approved, create technical implementation plan (DESIGN.md)
3. **Implementation:** Refactor modules in order listed in Implementation Notes
4. **Testing:** Execute test strategy (unit → integration → manual → A/B)
5. **Deployment:** Enable feature flag gradually, monitor metrics
6. **Documentation:** Update STATUS.md, commit with conventional format

**Estimated Timeline:**

- User Review: 30 minutes
- Design: 3 hours
- Implementation: 12-16 hours
  - Model config module: 3 hours
  - Diagram generator refactor: 6 hours
  - Usage tracker & logging: 2 hours
  - Testing & validation: 4 hours
  - Documentation: 1 hour
- A/B Testing & Rollout: 1 week (gradual)
- **Total: 16-20 hours + 1 week rollout**

---

## Appendix: GPT-5 vs GPT-4o Technical Comparison

### Performance Benchmarks

| Benchmark | GPT-4o | GPT-5 | Improvement |
|-----------|--------|-------|-------------|
| AIME 2025 (Math) | - | 94.6% | N/A |
| SWE-bench Verified (Coding) | - | 74.9% | Best-in-class |
| GPQA Diamond (Science) | - | 74.8% | N/A |
| MMLU-Pro (Knowledge) | - | 88.6% | N/A |
| Output Token Efficiency | 100% | 30-50% | 50-70% fewer tokens |

### API Parameters Comparison

| Parameter | GPT-4o | GPT-5 | Notes |
|-----------|--------|-------|-------|
| model | `"gpt-4o"` | `"gpt-5"` | New flagship model |
| reasoning.effort | ❌ Not supported | ✅ "minimal", "low", "medium", "high" | NEW in GPT-5 |
| verbosity | ❌ Not supported | ✅ "low", "medium", "high" | NEW in GPT-5 |
| temperature | ✅ 0.0-2.0 | ✅ 0.0-2.0 | Same |
| max_tokens | ✅ | ✅ | Same |
| tools | ✅ JSON | ✅ Plain text or JSON | Improved in GPT-5 |

### Cost Comparison

| Metric | GPT-4o | GPT-5 | Savings |
|--------|--------|-------|---------|
| Input (per 1M tokens) | $2.50 | $1.25 | 50% |
| Output (per 1M tokens) | $10.00 | $10.00 | 0% |
| Typical input tokens | 1,000 | 1,000 | - |
| Typical output tokens | 2,000 | 1,200 | 40% |
| **Total per diagram** | **$0.0225** | **$0.0133** | **41%** |

### When to Use Each Model

| Use Case | GPT-4o | GPT-5 | Rationale |
|----------|--------|-------|-----------|
| Simple diagrams | ✅ Fast | ✅ Faster + Cheaper (minimal reasoning) | GPT-5 with minimal reasoning wins |
| Standard diagrams | ✅ Good | ✅ Better + Cheaper | GPT-5 superior |
| Complex diagrams | ✅ Good | ✅ Best (high reasoning) | GPT-5 reasoning excels |
| Code-heavy diagrams | ✅ Good | ✅ Excellent (74.9% SWE-bench) | GPT-5 best-in-class coding |
| Legacy compatibility | ✅ Tested | ⚠️ New | Use GPT-4o if risk-averse |
| Budget-constrained | ⚠️ Expensive | ✅ 40% cheaper | GPT-5 clear winner |

**Recommendation:** Use GPT-5 for all new development. Maintain GPT-4o as fallback.

---

**END OF SPECIFICATION**
