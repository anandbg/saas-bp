/**
 * HTML to PPTX Export
 * Converts HTML diagrams to PowerPoint presentations
 */

import pptxgen from 'pptxgenjs';
import { htmlToPngServer } from './html-to-png';

export interface PptxExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  slideWidth?: number;
  slideHeight?: number;
}

/**
 * Convert HTML diagram to PPTX
 * @param html - HTML content
 * @param options - Export options
 * @returns PPTX buffer
 */
export async function htmlToPptx(
  html: string,
  options: PptxExportOptions = {}
): Promise<Buffer> {
  // Create presentation
  const pptx = new pptxgen();

  // Set presentation properties
  pptx.title = options.title || 'AI Generated Diagram';
  pptx.author = options.author || 'AI Diagram Generator';
  pptx.subject = options.subject || 'Diagram';

  // Set slide layout (16:9 widescreen by default)
  pptx.layout = 'LAYOUT_WIDE';

  // First, convert HTML to PNG
  const pngBuffer = await htmlToPngServer(html, {
    width: options.slideWidth || 1920,
    height: options.slideHeight || 1080,
    scale: 2,
  });

  // Create slide
  const slide = pptx.addSlide();

  // Add the image to the slide
  const base64Image = `data:image/png;base64,${pngBuffer.toString('base64')}`;

  slide.addImage({
    data: base64Image,
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
    sizing: { type: 'contain', w: '100%', h: '100%' },
  });

  // Generate PPTX buffer
  const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

  return pptxBuffer;
}

/**
 * Convert multiple HTML diagrams to PPTX (one per slide)
 */
export async function htmlsToPptx(
  htmls: string[],
  options: PptxExportOptions = {}
): Promise<Buffer> {
  const pptx = new pptxgen();

  pptx.title = options.title || 'AI Generated Diagrams';
  pptx.author = options.author || 'AI Diagram Generator';
  pptx.subject = options.subject || 'Diagrams';
  pptx.layout = 'LAYOUT_WIDE';

  // Convert each HTML to a slide
  for (const html of htmls) {
    const pngBuffer = await htmlToPngServer(html, {
      width: options.slideWidth || 1920,
      height: options.slideHeight || 1080,
      scale: 2,
    });

    const slide = pptx.addSlide();
    const base64Image = `data:image/png;base64,${pngBuffer.toString('base64')}`;

    slide.addImage({
      data: base64Image,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      sizing: { type: 'contain', w: '100%', h: '100%' },
    });
  }

  const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

  return pptxBuffer;
}
