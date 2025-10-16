/**
 * DOCX Parser
 * Handles .docx files using mammoth
 */

import mammoth from 'mammoth';
import type { ParsedFile } from './index';

export async function parseDocx(file: File): Promise<ParsedFile> {
  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Parse DOCX to extract text and images
  const result = await mammoth.extractRawText({ arrayBuffer });

  // Extract images if available
  const imagesResult = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const buffer = await image.read();
        const base64 = buffer.toString('base64');
        const contentType = image.contentType;
        return {
          src: `data:${contentType};base64,${base64}`,
        };
      }),
    }
  );

  // Extract image tags from HTML
  const imageMatches = imagesResult.value.matchAll(/<img[^>]+src="([^"]+)"/g);
  const images = Array.from(imageMatches).map((match, index) => ({
    description: `Image ${index + 1} from ${file.name}`,
    data: match[1],
  }));

  return {
    fileName: file.name,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    content: result.value,
    metadata: {
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      hasImages: images.length > 0,
      imageCount: images.length,
    },
    images: images.length > 0 ? images : undefined,
  };
}
