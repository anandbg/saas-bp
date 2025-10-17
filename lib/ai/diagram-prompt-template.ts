/**
 * Diagram Generation Prompt Template
 *
 * Contains all prompt engineering rules for generating HTML/Tailwind diagrams and illustrations.
 * These rules ensure consistent, high-quality output that matches user requirements.
 */

/**
 * System prompt containing all diagram generation rules
 * CRITICAL: These rules come directly from user requirements and must be followed exactly
 */
export const DIAGRAM_GENERATION_SYSTEM_PROMPT = `You are an expert at creating beautiful, professional diagrams and illustrations using HTML and Tailwind CSS.

CRITICAL RULES - FOLLOW EXACTLY:

1. OUTPUT FORMAT:
   - Only code in HTML/Tailwind in a single code block
   - Use inline CSS styles in the style attribute only - no separate <style> tags
   - Always include proper HTML structure with html, head, and body tags
   - Include required scripts in head section

2. REQUIRED SCRIPTS (MUST BE INCLUDED):
   <script src="https://cdn.tailwindcss.com"></script>
   <script src="https://unpkg.com/lucide@latest"></script>

3. ICONS:
   - Use Lucide icons exclusively
   - Always use strokeWidth: 1.5 for all icons
   - Initialize icons with: <script>lucide.createIcons();</script> at end of body

4. DESIGN STYLE:
   - Design in the style of Linear, Stripe, Vercel, and Tailwind UI (DO NOT mention these names in output)
   - Modern, clean, minimalist aesthetic
   - Professional and polished look

5. TYPOGRAPHY:
   - Be extremely accurate with font weights - use one level thinner than you think
   - For titles larger than 20px, always use tracking-tight
   - Use system font stack or Inter font

6. RESPONSIVENESS:
   - Make everything fully responsive
   - Use Tailwind responsive classes (sm:, md:, lg:, xl:, 2xl:)
   - Test layouts work on mobile, tablet, and desktop

7. CSS STRUCTURE:
   - Use Tailwind utility classes directly in HTML tags
   - NO Tailwind classes in the <html> tag itself - use <body> tags instead
   - All styling must be inline via Tailwind classes or style attribute

8. VISUAL ELEMENTS:
   - Use subtle dividers and outlines (1px, light colors)
   - Maintain subtle contrast - avoid harsh blacks and whites
   - Use tight tracking for logos and brand elements
   - Prefer modern, clean spacing

9. IMAGES:
   - If no images are specified, use Unsplash images with descriptive URLs
   - Example: https://images.unsplash.com/photo-[relevant-id]
   - Always include proper alt text for accessibility

10. INTERACTIVITY:
    - NO JavaScript animations - use Tailwind CSS animations only
    - Include hover interactions using Tailwind hover: classes
    - Use transitions for smooth effects (transition-colors, transition-transform, etc.)

11. CHARTS (if needed):
    - Use Chart.js for charts: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    - IMPORTANT: To avoid Chart.js animation bugs, always set: animation: false in chart config
    - Place chart canvas in responsive container

12. COLOR MODES:
    - Tech/futuristic themes: Use dark mode (dark backgrounds, light text)
    - Professional/business themes: Use light mode (light backgrounds, dark text)
    - Choose based on context and content

13. BUTTONS:
    - DO NOT create floating DOWNLOAD buttons
    - If download functionality is needed, integrate naturally into the design

14. LAYOUT:
    - Use flexbox and grid layouts appropriately
    - Ensure proper spacing with Tailwind spacing utilities
    - Center content when appropriate

15. ACCESSIBILITY:
    - Include proper semantic HTML
    - Add ARIA labels where needed
    - Ensure sufficient color contrast
    - Include alt text for all images

REMEMBER:
- Output ONLY the HTML code block - no explanations before or after
- Follow ALL rules exactly as specified
- Generate clean, production-ready code
- Test that all Tailwind classes are valid
- Ensure the output is complete and can be rendered immediately`;

/**
 * Search context from Perplexity API
 */
export interface SearchContext {
  answer: string;
  citations: Array<{
    url: string;
    title: string;
  }>;
}

/**
 * Build the complete prompt for diagram generation
 * @param userRequest - The user's description of what they want to create
 * @param context - Optional context from uploaded files or previous conversation
 * @returns Complete prompt for OpenAI API
 */
export function buildDiagramPrompt(
  userRequest: string,
  context?: {
    fileContents?: string[];
    previousDiagrams?: string[];
    conversationHistory?: Array<{ role: string; content: string }>;
    searchContext?: SearchContext;
  }
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: DIAGRAM_GENERATION_SYSTEM_PROMPT,
    },
  ];

  // Add conversation history if provided
  if (context?.conversationHistory && context.conversationHistory.length > 0) {
    messages.push(...context.conversationHistory as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>);
  }

  // Build user message with all context
  let userMessage = userRequest;

  // Add web search context if provided (Feature 6.0)
  if (context?.searchContext) {
    const citationsText = context.searchContext.citations
      .map((c, i) => `[${i + 1}] ${c.title} - ${c.url}`)
      .join('\n');

    const searchSection = `**Web Research Context:**

${context.searchContext.answer}

**Sources:**
${citationsText}

**Instructions:** Use the above research to inform your diagram. Include a small citation footer referencing the sources by number [1], [2], etc.

---

`;
    userMessage = searchSection + userMessage;
  }

  // Add file contents if provided
  if (context?.fileContents && context.fileContents.length > 0) {
    userMessage = `${userMessage}\n\n**Context from uploaded files:**\n${context.fileContents.join('\n\n---\n\n')}`;
  }

  // Add reference to previous diagrams if this is an iteration
  if (context?.previousDiagrams && context.previousDiagrams.length > 0) {
    userMessage = `${userMessage}\n\n**This is an iteration. Previous version:**\n${context.previousDiagrams[context.previousDiagrams.length - 1]}`;
  }

  messages.push({
    role: 'user',
    content: userMessage,
  });

  return messages;
}

/**
 * Build feedback prompt for iteration improvements
 * @param originalRequest - The original user request
 * @param currentDiagram - The current diagram HTML
 * @param validationFeedback - Feedback from MCP Playwright validation
 * @returns Prompt for improving the diagram based on feedback
 */
export function buildFeedbackPrompt(
  originalRequest: string,
  currentDiagram: string,
  validationFeedback: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    {
      role: 'system',
      content: DIAGRAM_GENERATION_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: originalRequest,
    },
    {
      role: 'assistant',
      content: `\`\`\`html\n${currentDiagram}\n\`\`\``,
    },
    {
      role: 'user',
      content: `The diagram has the following issues that need to be fixed:\n\n${validationFeedback}\n\nPlease generate an improved version that addresses all these issues while maintaining the original intent.`,
    },
  ];
}

/**
 * Validation rules for diagram output
 * Used by MCP Playwright to validate generated diagrams
 */
export const DIAGRAM_VALIDATION_RULES = {
  required_scripts: [
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest',
  ],
  required_structure: ['html', 'head', 'body'],
  forbidden_elements: ['<style>', '<link rel="stylesheet"'],
  accessibility: {
    check_alt_text: true,
    check_semantic_html: true,
    check_aria_labels: true,
  },
  responsive: {
    check_responsive_classes: true,
    min_breakpoints: ['sm', 'md'],
  },
} as const;

/**
 * Extract HTML code from OpenAI response
 * Handles various response formats (with or without markdown code blocks)
 */
export function extractHtmlFromResponse(response: string): string {
  // Remove markdown code block if present
  const codeBlockMatch = response.match(/```html\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Remove generic code block
  const genericBlockMatch = response.match(/```\n([\s\S]*?)\n```/);
  if (genericBlockMatch) {
    return genericBlockMatch[1].trim();
  }

  // Return as-is if no code block found (assume it's already HTML)
  return response.trim();
}

/**
 * Validate that generated HTML follows all rules
 * Basic client-side validation before MCP Playwright validation
 */
export function validateGeneratedHtml(html: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required scripts
  if (!html.includes('cdn.tailwindcss.com')) {
    errors.push('Missing required Tailwind CSS CDN script');
  }
  if (!html.includes('unpkg.com/lucide')) {
    errors.push('Missing required Lucide icons script');
  }

  // Check for required structure
  if (!html.includes('<html')) {
    errors.push('Missing <html> tag');
  }
  if (!html.includes('<head')) {
    errors.push('Missing <head> tag');
  }
  if (!html.includes('<body')) {
    errors.push('Missing <body> tag');
  }

  // Check for forbidden elements
  if (html.includes('<style>') || html.includes('<style ')) {
    errors.push('Contains forbidden <style> tag - use inline styles only');
  }
  if (html.includes('<link rel="stylesheet"')) {
    errors.push('Contains forbidden <link> stylesheet - use Tailwind CDN only');
  }

  // Check for Tailwind classes in html tag (warning only)
  const htmlTagMatch = html.match(/<html[^>]*class=/);
  if (htmlTagMatch) {
    warnings.push('Tailwind classes found in <html> tag - should use <body> instead');
  }

  // Check for Lucide icon initialization
  if (html.includes('lucide') && !html.includes('lucide.createIcons()')) {
    warnings.push('Lucide icons used but createIcons() not called');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
