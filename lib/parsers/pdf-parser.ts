/**
 * PDF Parser
 * Handles .pdf files using pdf-parse
 */

// @ts-ignore - pdf-parse doesn't have TypeScript definitions
import pdf from 'pdf-parse/lib/pdf-parse.js';
import type { ParsedFile } from './index';

export async function parsePDF(file: File): Promise<ParsedFile> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Parse PDF
  const data = await pdf(buffer);

  return {
    fileName: file.name,
    fileType: 'application/pdf',
    content: data.text,
    metadata: {
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version,
      size: file.size,
    },
  };
}
