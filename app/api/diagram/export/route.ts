/**
 * Diagram Export API Endpoint
 *
 * POST /api/diagram/export
 * Exports diagrams in various formats (PPTX, PDF, PNG, HTML)
 *
 * Request body:
 * {
 *   html: string,
 *   format: 'pptx' | 'pdf' | 'png' | 'html'
 * }
 *
 * Returns the exported file with appropriate headers
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  htmlToPptx,
  htmlToPdf,
  htmlToPngServer,
  createStandaloneHtml,
  validateHtmlSize,
  containsCharts,
} from '@/lib/export';

// File size limits (from CONSTRAINTS.md)
const FILE_SIZE_LIMITS = {
  pptx: 25 * 1024 * 1024, // 25MB
  pdf: 10 * 1024 * 1024, // 10MB
  png: 5 * 1024 * 1024, // 5MB
  html: 2 * 1024 * 1024, // 2MB
};

// MIME types for each format
const MIME_TYPES = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
  png: 'image/png',
  html: 'text/html',
};

// Allowed export formats
type ExportFormat = 'pptx' | 'pdf' | 'png' | 'html';

// Request body schema
interface ExportRequest {
  html: string;
  format: ExportFormat;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as ExportRequest;
    const { html, format } = body;

    // Validate input
    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    if (!format || !['pptx', 'pdf', 'png', 'html'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be one of: pptx, pdf, png, html' },
        { status: 400 }
      );
    }

    // Validate HTML size
    const sizeValidation = validateHtmlSize(html, FILE_SIZE_LIMITS.html);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 413 } // Payload Too Large
      );
    }

    // Generate timestamp for filename
    const timestamp = Date.now();
    const filename = `diagram-${timestamp}.${format}`;

    // Route to appropriate export function
    let buffer: Buffer;
    let mimeType: string;

    switch (format) {
      case 'pptx':
        buffer = await exportToPPTX(html);
        mimeType = MIME_TYPES.pptx;
        break;

      case 'pdf':
        buffer = await exportToPDF(html);
        mimeType = MIME_TYPES.pdf;
        break;

      case 'png':
        buffer = await exportToPNG(html);
        mimeType = MIME_TYPES.png;
        break;

      case 'html':
        buffer = await exportToHTML(html);
        mimeType = MIME_TYPES.html;
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }

    // Check file size limit
    if (buffer.length > FILE_SIZE_LIMITS[format]) {
      return NextResponse.json(
        {
          error: `Generated file exceeds ${format.toUpperCase()} size limit of ${formatBytes(FILE_SIZE_LIMITS[format])}`,
        },
        { status: 413 }
      );
    }

    // Return file with appropriate headers
    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Export error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Export failed';

    return NextResponse.json(
      { error: `Export failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Export to PowerPoint (PPTX)
 */
async function exportToPPTX(html: string): Promise<Buffer> {
  try {
    const buffer = await htmlToPptx(html, {
      title: 'AI Generated Diagram',
      author: 'AI Diagram Generator',
      subject: 'Diagram',
    });

    return buffer;
  } catch (error) {
    throw new Error(`PPTX export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export to PDF
 */
async function exportToPDF(html: string): Promise<Buffer> {
  try {
    const buffer = await htmlToPdf(html, {
      format: 'A4',
      printBackground: true,
      scale: 1,
      margin: {
        top: '0.4in',
        right: '0.4in',
        bottom: '0.4in',
        left: '0.4in',
      },
    });

    return buffer;
  } catch (error) {
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export to PNG
 */
async function exportToPNG(html: string): Promise<Buffer> {
  try {
    const buffer = await htmlToPngServer(html, {
      width: 1920,
      height: 1080,
      scale: 2,
    });

    return buffer;
  } catch (error) {
    throw new Error(`PNG export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export to HTML (standalone file)
 */
function exportToHTML(html: string): Buffer {
  try {
    const includeChartJS = containsCharts(html);

    const standaloneHtml = createStandaloneHtml(html, {
      title: 'AI Generated Diagram',
      includeAttribution: true,
      includeTailwindCDN: true,
      includeLucideCDN: true,
      includeChartJS,
    });

    return Buffer.from(standaloneHtml, 'utf8');
  } catch (error) {
    throw new Error(`HTML export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
