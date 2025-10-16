/**
 * CSV Parser
 * Handles .csv files using csv-parse
 */

import { parse } from 'csv-parse/sync';
import type { ParsedFile } from './index';

export async function parseCsv(file: File): Promise<ParsedFile> {
  // Read file as text
  const text = await file.text();

  // Parse CSV
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Format as markdown table
  const formattedTable = formatCsvAsTable(records);

  return {
    fileName: file.name,
    fileType: 'text/csv',
    content: formattedTable,
    metadata: {
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      rowCount: records.length,
      columnCount: records.length > 0 ? Object.keys(records[0]).length : 0,
      columns: records.length > 0 ? Object.keys(records[0]) : [],
    },
  };
}

/**
 * Format CSV data as markdown table
 */
function formatCsvAsTable(records: Record<string, any>[]): string {
  if (records.length === 0) return 'Empty CSV file';

  const headers = Object.keys(records[0]);

  // Calculate column widths
  const columnWidths = headers.map((header) => {
    const maxDataWidth = Math.max(
      ...records.map((row) => String(row[header] || '').length)
    );
    return Math.max(header.length, maxDataWidth);
  });

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
  for (const record of records) {
    lines.push(
      '| ' +
        headers
          .map((h, i) =>
            String(record[h] || '').padEnd(columnWidths[i])
          )
          .join(' | ') +
        ' |'
    );
  }

  return lines.join('\n');
}
