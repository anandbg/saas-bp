/**
 * HTML Export Utility
 * Creates self-contained HTML files for diagram export
 */

export interface HtmlExportOptions {
  title?: string;
  includeAttribution?: boolean;
  includeTailwindCDN?: boolean;
  includeLucideCDN?: boolean;
  includeChartJS?: boolean;
}

/**
 * Wrap HTML content in a complete self-contained HTML document
 * @param html - HTML content (diagram HTML)
 * @param options - Export options
 * @returns Complete HTML document as string
 */
export function createStandaloneHtml(
  html: string,
  options: HtmlExportOptions = {}
): string {
  const {
    title = 'AI Generated Diagram',
    includeAttribution = true,
    includeTailwindCDN = true,
    includeLucideCDN = true,
    includeChartJS = false,
  } = options;

  // Build CDN links
  const cdnLinks: string[] = [];

  if (includeTailwindCDN) {
    cdnLinks.push('<script src="https://cdn.tailwindcss.com"></script>');
  }

  if (includeLucideCDN) {
    cdnLinks.push(
      '<script src="https://unpkg.com/lucide@latest"></script>',
      '<script>lucide.createIcons();</script>'
    );
  }

  if (includeChartJS) {
    cdnLinks.push(
      '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>'
    );
  }

  // Build attribution comment
  const attribution = includeAttribution
    ? `<!--
  AI Generated Diagram
  Created by: AI Diagram Generator
  Generated: ${new Date().toISOString()}

  This is a self-contained HTML file with all necessary dependencies included via CDN.
-->\n`
    : '';

  // Build complete HTML document
  const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="AI Diagram Generator">
  <title>${escapeHtml(title)}</title>
  ${cdnLinks.join('\n  ')}
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f9fafb;
    }
    .diagram-container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
${attribution}  <div class="diagram-container">
${indentHtml(html, 4)}
  </div>
</body>
</html>`;

  return completeHtml;
}

/**
 * Export HTML with minimal wrapper (for embedding)
 */
export function createMinimalHtml(html: string, title?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || 'Diagram')}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${indentHtml(html, 2)}
</body>
</html>`;
}

/**
 * Detect if HTML contains charts (for conditional Chart.js inclusion)
 */
export function containsCharts(html: string): boolean {
  return html.includes('<canvas') || html.includes('chart');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Indent HTML content
 */
function indentHtml(html: string, spaces: number): string {
  const indent = ' '.repeat(spaces);
  return html
    .split('\n')
    .map((line) => (line.trim() ? indent + line : line))
    .join('\n');
}

/**
 * Validate HTML size before export
 */
export function validateHtmlSize(
  html: string,
  maxSizeBytes: number = 2 * 1024 * 1024 // 2MB default
): { valid: boolean; size: number; error?: string } {
  const size = Buffer.byteLength(html, 'utf8');

  if (size > maxSizeBytes) {
    return {
      valid: false,
      size,
      error: `HTML size (${formatBytes(size)}) exceeds maximum (${formatBytes(maxSizeBytes)})`,
    };
  }

  return { valid: true, size };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
