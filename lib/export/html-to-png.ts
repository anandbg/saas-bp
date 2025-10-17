/**
 * HTML to PNG Export
 * Uses html2canvas to convert HTML diagrams to PNG images
 */

import html2canvas from 'html2canvas';

export interface PngExportOptions {
  backgroundColor?: string;
  scale?: number;
  width?: number;
  height?: number;
}

/**
 * Convert HTML to PNG buffer
 * @param _html - HTML content (unused in stub)
 * @param _options - Export options (unused in stub)
 * @returns PNG buffer
 */
export async function htmlToPng(
  _html: string,
  _options: PngExportOptions = {}
): Promise<Buffer> {
  // This function needs to run in a browser environment
  // We'll use puppeteer/playwright via MCP for server-side rendering
  throw new Error('htmlToPng must be called from browser context or use server-side rendering');
}

/**
 * Browser-side HTML to PNG conversion
 * This runs on the client side
 */
export async function htmlToPngClient(
  element: HTMLElement,
  options: PngExportOptions = {}
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    backgroundColor: options.backgroundColor || '#ffffff',
    scale: options.scale || 2,
    width: options.width,
    height: options.height,
    useCORS: true,
    allowTaint: true,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Server-side HTML to PNG using Playwright
 * Launches headless Chromium browser to render HTML and capture screenshot
 */
export async function htmlToPngServer(
  html: string,
  options: PngExportOptions = {}
): Promise<Buffer> {
  const { chromium } = await import('playwright-core');

  let browser;
  try {
    // Launch headless Chromium
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Create new page with viewport
    const page = await browser.newPage({
      viewport: {
        width: options.width || 1920,
        height: options.height || 1080,
      },
      deviceScaleFactor: options.scale || 2, // Retina display support
    });

    // Set content and wait for network idle (all resources loaded)
    await page.setContent(html, {
      waitUntil: 'networkidle',
      timeout: 30000, // 30 second timeout
    });

    // Wait for any dynamic content to render
    await page.waitForTimeout(500);

    // Take full-page screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    return Buffer.from(screenshot);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PNG generation failed: ${errorMessage}`);
  } finally {
    // Always close browser to prevent memory leaks
    if (browser) {
      await browser.close();
    }
  }
}
