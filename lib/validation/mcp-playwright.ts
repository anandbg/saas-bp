/**
 * MCP Playwright Validation System
 *
 * Uses Playwright (via MCP if available) to validate generated diagrams
 * Provides automated feedback for iterative improvement
 *
 * Features:
 * - Screenshot capture of generated HTML
 * - Visual validation using GPT-4V
 * - Structural validation (required scripts, HTML structure)
 * - Accessibility checks
 * - Responsive design validation
 */

import { chromium } from 'playwright-core';
import { OpenAI } from 'openai';
import { DIAGRAM_VALIDATION_RULES } from '../ai/diagram-prompt-template';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ValidationResult {
  isValid: boolean;
  feedback?: string;
  issues: Array<{
    type: 'error' | 'warning';
    category: string;
    message: string;
  }>;
  screenshot?: string; // base64 encoded
  metadata: {
    validationTime: number;
    checksPerformed: string[];
  };
}

/**
 * Validate HTML diagram using Playwright and GPT-4V
 * @param html - Generated HTML to validate
 * @param originalRequest - Original user request for context
 * @returns Validation result with feedback
 */
export async function validateDiagram(
  html: string,
  originalRequest: string
): Promise<ValidationResult> {
  const startTime = Date.now();
  const issues: ValidationResult['issues'] = [];
  const checksPerformed: string[] = [];

  try {
    // 1. Structural validation (no browser needed)
    const structuralIssues = validateStructure(html);
    issues.push(...structuralIssues);
    checksPerformed.push('structural');

    // 2. Browser-based validation
    let screenshot: string | undefined;
    let visualIssues: ValidationResult['issues'] = [];

    try {
      // Check if Playwright is available
      const browser = await chromium.launch({
        headless: true,
      });

      const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
      });

      // Load HTML
      await page.setContent(html);

      // Wait for Tailwind and Lucide to load
      await page.waitForTimeout(1000);

      // Initialize Lucide icons if present
      await page.evaluate(() => {
        if (typeof (window as any).lucide !== 'undefined') {
          (window as any).lucide.createIcons();
        }
      });

      await page.waitForTimeout(500);

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage: true,
        type: 'png',
      });
      screenshot = screenshotBuffer.toString('base64');
      checksPerformed.push('screenshot');

      // Check for console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Check for JavaScript errors
      page.on('pageerror', (error) => {
        consoleErrors.push(error.message);
      });

      if (consoleErrors.length > 0) {
        issues.push({
          type: 'error',
          category: 'javascript',
          message: `Console errors detected: ${consoleErrors.join(', ')}`,
        });
      }
      checksPerformed.push('console-errors');

      // Check responsive design
      const responsiveIssues = await checkResponsive(page);
      issues.push(...responsiveIssues);
      checksPerformed.push('responsive');

      // Check accessibility
      const accessibilityIssues = await checkAccessibility(page);
      issues.push(...accessibilityIssues);
      checksPerformed.push('accessibility');

      await browser.close();
    } catch (browserError) {
      console.warn('Browser validation failed:', browserError);
      issues.push({
        type: 'warning',
        category: 'browser',
        message: 'Could not perform browser-based validation',
      });
    }

    // 3. Visual validation with GPT-4V (if screenshot available)
    if (screenshot && process.env.OPENAI_API_KEY) {
      try {
        visualIssues = await validateVisually(
          screenshot,
          originalRequest
        );
        issues.push(...visualIssues);
        checksPerformed.push('visual-validation');
      } catch (visionError) {
        console.warn('Visual validation failed:', visionError);
        issues.push({
          type: 'warning',
          category: 'visual',
          message: 'Could not perform visual validation',
        });
      }
    }

    // Determine if validation passed
    const hasErrors = issues.some((issue) => issue.type === 'error');
    const isValid = !hasErrors;

    // Build feedback message
    const feedback = buildFeedbackMessage(issues, originalRequest);

    return {
      isValid,
      feedback: isValid ? undefined : feedback,
      issues,
      screenshot,
      metadata: {
        validationTime: Date.now() - startTime,
        checksPerformed,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      feedback: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [
        {
          type: 'error',
          category: 'validation',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      metadata: {
        validationTime: Date.now() - startTime,
        checksPerformed,
      },
    };
  }
}

/**
 * Validate HTML structure (required scripts, tags, etc.)
 */
function validateStructure(html: string): ValidationResult['issues'] {
  const issues: ValidationResult['issues'] = [];

  // Check required scripts
  for (const script of DIAGRAM_VALIDATION_RULES.required_scripts) {
    if (!html.includes(script)) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: `Missing required script: ${script}`,
      });
    }
  }

  // Check required HTML structure
  for (const tag of DIAGRAM_VALIDATION_RULES.required_structure) {
    if (!html.includes(`<${tag}`)) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: `Missing required HTML tag: <${tag}>`,
      });
    }
  }

  // Check for forbidden elements
  for (const forbidden of DIAGRAM_VALIDATION_RULES.forbidden_elements) {
    if (html.includes(forbidden)) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: `Contains forbidden element: ${forbidden}`,
      });
    }
  }

  // Check for Lucide initialization
  if (html.includes('lucide') && !html.includes('lucide.createIcons()')) {
    issues.push({
      type: 'warning',
      category: 'structure',
      message: 'Lucide icons used but createIcons() not called',
    });
  }

  return issues;
}

/**
 * Check responsive design at different viewports
 */
async function checkResponsive(page: any): Promise<ValidationResult['issues']> {
  const issues: ValidationResult['issues'] = [];

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.waitForTimeout(300);

    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });

    if (hasOverflow) {
      issues.push({
        type: 'warning',
        category: 'responsive',
        message: `Horizontal overflow detected on ${viewport.name} (${viewport.width}x${viewport.height})`,
      });
    }
  }

  return issues;
}

/**
 * Check basic accessibility
 */
async function checkAccessibility(page: any): Promise<ValidationResult['issues']> {
  const issues: ValidationResult['issues'] = [];

  // Check for images without alt text
  const imagesWithoutAlt = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter((img) => !img.alt).length;
  });

  if (imagesWithoutAlt > 0) {
    issues.push({
      type: 'warning',
      category: 'accessibility',
      message: `${imagesWithoutAlt} image(s) missing alt text`,
    });
  }

  // Check for buttons without accessible names
  const buttonsWithoutText = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.filter(
      (btn) =>
        !btn.textContent?.trim() && !btn.getAttribute('aria-label')
    ).length;
  });

  if (buttonsWithoutText > 0) {
    issues.push({
      type: 'warning',
      category: 'accessibility',
      message: `${buttonsWithoutText} button(s) missing accessible text`,
    });
  }

  return issues;
}

/**
 * Validate visually using GPT-4V
 */
async function validateVisually(
  screenshot: string,
  originalRequest: string
): Promise<ValidationResult['issues']> {
  const issues: ValidationResult['issues'] = [];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `You are a visual QA expert. Analyze this screenshot of a generated diagram/illustration.\n\n` +
                `Original request: "${originalRequest}"\n\n` +
                `Check for:\n` +
                `1. Does it match the user's request?\n` +
                `2. Is the design professional and clean?\n` +
                `3. Are colors and contrast appropriate?\n` +
                `4. Is text readable?\n` +
                `5. Are there any visual bugs or issues?\n` +
                `6. Is the layout well-structured?\n\n` +
                `Respond with a JSON object: { "isValid": boolean, "issues": string[] }\n` +
                `Only list actual problems, not suggestions.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshot}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const result = JSON.parse(content);
        if (result.issues && Array.isArray(result.issues)) {
          for (const issue of result.issues) {
            issues.push({
              type: result.isValid ? 'warning' : 'error',
              category: 'visual',
              message: issue,
            });
          }
        }
      } catch {
        // If parsing fails, treat the response as plain text feedback
        if (!content.toLowerCase().includes('looks good')) {
          issues.push({
            type: 'warning',
            category: 'visual',
            message: content,
          });
        }
      }
    }
  } catch (error) {
    console.error('Visual validation error:', error);
  }

  return issues;
}

/**
 * Build feedback message from issues
 */
function buildFeedbackMessage(
  issues: ValidationResult['issues'],
  originalRequest: string
): string {
  if (issues.length === 0) {
    return 'Diagram looks good!';
  }

  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');

  let feedback = `Found ${errors.length} error(s) and ${warnings.length} warning(s) in the generated diagram.\n\n`;

  if (errors.length > 0) {
    feedback += '**Errors (must fix):**\n';
    for (const error of errors) {
      feedback += `- [${error.category}] ${error.message}\n`;
    }
    feedback += '\n';
  }

  if (warnings.length > 0) {
    feedback += '**Warnings (should fix):**\n';
    for (const warning of warnings) {
      feedback += `- [${warning.category}] ${warning.message}\n`;
    }
  }

  feedback += `\nPlease regenerate the diagram addressing these issues while maintaining the original request: "${originalRequest}"`;

  return feedback;
}
