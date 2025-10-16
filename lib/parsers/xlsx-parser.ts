/**
 * XLSX Parser
 * Handles .xlsx files using xlsx library
 */

import * as XLSX from 'xlsx';
import type { ParsedFile } from './index';

export async function parseXlsx(file: File): Promise<ParsedFile> {
  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Read workbook
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Extract data from all sheets
  const sheets: Array<{
    name: string;
    data: string;
  }> = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to CSV format for easier text representation
    const csvData = XLSX.utils.sheet_to_csv(sheet);

    // Convert to formatted table
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const formattedData = formatTableData(jsonData as any[][]);

    sheets.push({
      name: sheetName,
      data: formattedData || csvData,
    });
  }

  // Combine all sheets into single content
  const content = sheets
    .map((sheet) => `## Sheet: ${sheet.name}\n\n${sheet.data}`)
    .join('\n\n');

  return {
    fileName: file.name,
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content,
    metadata: {
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      sheetCount: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames,
    },
  };
}

/**
 * Format table data as markdown table for better readability
 */
function formatTableData(data: any[][]): string {
  if (!data || data.length === 0) return '';

  // Get headers (first row)
  const headers = data[0].map((h) => String(h || '').trim());

  // Get max width for each column
  const columnWidths = headers.map((header, colIndex) => {
    const maxDataWidth = Math.max(
      ...data.slice(1).map((row) => String(row[colIndex] || '').length)
    );
    return Math.max(header.length, maxDataWidth);
  });

  // Build markdown table
  const lines: string[] = [];

  // Header row
  lines.push(
    '| ' +
      headers
        .map((h, i) => h.padEnd(columnWidths[i]))
        .join(' | ') +
      ' |'
  );

  // Separator row
  lines.push(
    '| ' +
      columnWidths.map((w) => '-'.repeat(w)).join(' | ') +
      ' |'
  );

  // Data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    lines.push(
      '| ' +
        row
          .map((cell, colIndex) =>
            String(cell || '').padEnd(columnWidths[colIndex])
          )
          .join(' | ') +
        ' |'
    );
  }

  return lines.join('\n');
}
