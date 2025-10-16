/**
 * Text File Parser
 * Handles .txt files
 */

import type { ParsedFile } from './index';

export async function parseText(file: File): Promise<ParsedFile> {
  const text = await file.text();

  return {
    fileName: file.name,
    fileType: 'text/plain',
    content: text,
    metadata: {
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      lineCount: text.split('\n').length,
      characterCount: text.length,
    },
  };
}
