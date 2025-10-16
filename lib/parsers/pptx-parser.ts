/**
 * PPTX Parser
 * Handles .pptx files
 *
 * Note: PPTX parsing is complex. This implementation extracts basic text content.
 * For full parsing with images and formatting, consider using a dedicated library.
 */

import type { ParsedFile } from './index';
import JSZip from 'jszip';

export async function parsePptx(file: File): Promise<ParsedFile> {
  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Load PPTX as ZIP
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Extract text from slides
  const slideTexts: string[] = [];
  const slideFiles = Object.keys(zip.files).filter((name) =>
    name.match(/ppt\/slides\/slide\d+\.xml/)
  );

  for (const slideFile of slideFiles.sort()) {
    const content = await zip.files[slideFile].async('string');

    // Extract text from XML (simple regex-based extraction)
    // Remove XML tags and get text content
    const text = content
      .replace(/<a:t>/g, '')
      .replace(/<\/a:t>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();

    if (text) {
      slideTexts.push(text);
    }
  }

  return {
    fileName: file.name,
    fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    content: slideTexts.join('\n\n--- Slide Break ---\n\n'),
    metadata: {
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      slideCount: slideTexts.length,
    },
  };
}
