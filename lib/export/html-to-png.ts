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
 * Server-side HTML to PNG using MCP Playwright
 */
export async function htmlToPngServer(
  html: string,
  options: PngExportOptions = {}
): Promise<Buffer> {
  // Use MCP Playwright browser to render and screenshot
  const { chromium } = await import('playwright-core');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: {
      width: options.width || 1920,
      height: options.height || 1080,
    },
  });

  try {
    await page.setContent(html, { waitUntil: 'networkidle' });

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
      scale: options.scale === 1 ? 'css' : 'device',
    });

    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}
