/**
 * HTML to PDF Export
 * Uses Playwright to convert HTML diagrams to PDF documents
 */

export interface PdfExportOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  width?: string; // e.g., '8.5in', '210mm'
  height?: string; // e.g., '11in', '297mm'
  printBackground?: boolean;
  scale?: number;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  landscape?: boolean;
}

/**
 * Convert HTML to PDF buffer using Playwright
 * @param html - HTML content to convert
 * @param options - PDF export options
 * @returns PDF buffer
 */
export async function htmlToPdf(
  html: string,
  options: PdfExportOptions = {}
): Promise<Buffer> {
  const { chromium } = await import('playwright-core');

  let browser;
  try {
    // Launch headless Chromium
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Create new page
    const page = await browser.newPage();

    // Set content and wait for network idle
    await page.setContent(html, {
      waitUntil: 'networkidle',
      timeout: 30000, // 30 second timeout
    });

    // Wait for any dynamic content to render
    await page.waitForTimeout(500);

    // Generate PDF
    const pdf = await page.pdf({
      format: options.format || 'A4',
      width: options.width,
      height: options.height,
      printBackground: options.printBackground !== false, // Default true
      scale: options.scale || 1,
      margin: {
        top: options.margin?.top || '0.4in',
        right: options.margin?.right || '0.4in',
        bottom: options.margin?.bottom || '0.4in',
        left: options.margin?.left || '0.4in',
      },
      landscape: options.landscape || false,
      preferCSSPageSize: false, // Use our format settings
    });

    return Buffer.from(pdf);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF generation failed: ${errorMessage}`);
  } finally {
    // Always close browser to prevent memory leaks
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Convert HTML to PDF with custom page size
 */
export async function htmlToPdfCustomSize(
  html: string,
  width: string,
  height: string,
  options: Omit<PdfExportOptions, 'format' | 'width' | 'height'> = {}
): Promise<Buffer> {
  return htmlToPdf(html, {
    ...options,
    width,
    height,
  });
}

/**
 * Convert HTML to landscape PDF
 */
export async function htmlToPdfLandscape(
  html: string,
  options: Omit<PdfExportOptions, 'landscape'> = {}
): Promise<Buffer> {
  return htmlToPdf(html, {
    ...options,
    landscape: true,
  });
}
