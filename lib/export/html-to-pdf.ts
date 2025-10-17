/**
 * HTML to PDF Export
 * Uses Playwright to convert HTML diagrams to PDF documents
 */

import type { Page } from 'playwright-core';

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
  preserveAspectRatio?: boolean; // If true, calculates PDF size from content dimensions
}

/**
 * Calculate actual content dimensions from rendered HTML
 * @param page - Playwright page instance
 * @param html - HTML content to measure
 * @returns Content dimensions in pixels
 */
async function getContentDimensions(
  page: Page,
  html: string
): Promise<{ width: number; height: number }> {
  await page.setContent(html, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait for dynamic content to render
  await page.waitForTimeout(500);

  // Measure actual content dimensions
  const dimensions = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;

    const width = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth
    );

    const height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    return { width, height };
  });

  return dimensions;
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

    // Prepare PDF options
    let pdfOptions: any = {
      printBackground: options.printBackground !== false, // Default true
      scale: options.scale || 1,
      margin: {
        top: options.margin?.top || '0.4in',
        right: options.margin?.right || '0.4in',
        bottom: options.margin?.bottom || '0.4in',
        left: options.margin?.left || '0.4in',
      },
    };

    if (options.preserveAspectRatio) {
      // Calculate actual content dimensions
      const dimensions = await getContentDimensions(page, html);

      // Convert pixels to inches (96 DPI standard for web)
      const widthInches = dimensions.width / 96;
      const heightInches = dimensions.height / 96;

      // Set custom page size matching content aspect ratio
      pdfOptions.width = `${widthInches}in`;
      pdfOptions.height = `${heightInches}in`;
      pdfOptions.preferCSSPageSize = false;
    } else {
      // Use traditional format-based export
      pdfOptions.format = options.format || 'A4';
      pdfOptions.width = options.width;
      pdfOptions.height = options.height;
      pdfOptions.landscape = options.landscape || false;
      pdfOptions.preferCSSPageSize = false;
    }

    // Set content (again if dimensions were calculated, fresh if not)
    await page.setContent(html, {
      waitUntil: 'networkidle',
      timeout: 30000, // 30 second timeout
    });

    // Wait for any dynamic content to render
    await page.waitForTimeout(500);

    // Generate PDF with calculated or specified options
    const pdf = await page.pdf(pdfOptions);

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
