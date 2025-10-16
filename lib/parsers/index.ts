/**
 * File Parser Module
 *
 * Provides unified interface for parsing multiple file formats:
 * - Text files (.txt)
 * - PDF files (.pdf)
 * - Word documents (.docx)
 * - PowerPoint presentations (.pptx)
 * - Excel spreadsheets (.xlsx)
 * - CSV files (.csv)
 * - Images (.png, .jpg, .jpeg, .gif, .webp)
 */

import { parsePDF } from './pdf-parser';
import { parseDocx } from './docx-parser';
import { parsePptx } from './pptx-parser';
import { parseXlsx } from './xlsx-parser';
import { parseCsv } from './csv-parser';
import { parseImage } from './image-parser';
import { parseText } from './text-parser';

export interface ParsedFile {
  fileName: string;
  fileType: string;
  content: string;
  metadata?: Record<string, any>;
  images?: Array<{
    description: string;
    data: string; // base64 encoded
  }>;
}

export interface ParserError {
  fileName: string;
  error: string;
  details?: string;
}

/**
 * Parse a file based on its MIME type
 * @param file - File to parse
 * @returns Parsed content or error
 */
export async function parseFile(
  file: File
): Promise<ParsedFile | ParserError> {
  try {
    const fileType = file.type || getFileTypeFromName(file.name);

    // Route to appropriate parser based on file type
    if (fileType === 'application/pdf') {
      return await parsePDF(file);
    }

    if (
      fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      return await parseDocx(file);
    }

    if (
      fileType ===
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.name.endsWith('.pptx')
    ) {
      return await parsePptx(file);
    }

    if (
      fileType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.endsWith('.xlsx')
    ) {
      return await parseXlsx(file);
    }

    if (fileType === 'text/csv' || file.name.endsWith('.csv')) {
      return await parseCsv(file);
    }

    if (fileType.startsWith('image/')) {
      return await parseImage(file);
    }

    if (fileType === 'text/plain' || file.name.endsWith('.txt')) {
      return await parseText(file);
    }

    // Unsupported file type
    return {
      fileName: file.name,
      error: `Unsupported file type: ${fileType}`,
      details: 'Supported formats: PDF, DOCX, PPTX, XLSX, CSV, TXT, and images (PNG, JPG, GIF, WEBP)',
    };
  } catch (error) {
    return {
      fileName: file.name,
      error: 'Failed to parse file',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse multiple files concurrently
 * @param files - Array of files to parse
 * @returns Array of parsed results or errors
 */
export async function parseMultipleFiles(
  files: File[]
): Promise<Array<ParsedFile | ParserError>> {
  return await Promise.all(files.map((file) => parseFile(file)));
}

/**
 * Get file type from filename if MIME type is not available
 */
function getFileTypeFromName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const typeMap: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  };

  return typeMap[ext || ''] || 'application/octet-stream';
}

/**
 * Check if a file is valid for parsing
 * @param file - File to check
 * @param maxSize - Maximum file size in bytes (default: 10MB)
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSize: number = 10 * 1024 * 1024
): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Check file type
  const fileType = file.type || getFileTypeFromName(file.name);
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
  ];

  if (!supportedTypes.includes(fileType) && !fileType.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Unsupported file type',
    };
  }

  return { isValid: true };
}

export * from './pdf-parser';
export * from './docx-parser';
export * from './pptx-parser';
export * from './xlsx-parser';
export * from './csv-parser';
export * from './image-parser';
export * from './text-parser';
