/**
 * Image Parser
 * Handles image files (.png, .jpg, .jpeg, .gif, .webp)
 *
 * For diagram generation, we'll use GPT-4V (Vision) to describe the image
 * This allows users to upload reference images and have them described for the diagram
 */

import type { ParsedFile } from './index';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseImage(file: File): Promise<ParsedFile> {
  // Convert image to base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const mimeType = file.type;

  const dataUrl = `data:${mimeType};base64,${base64}`;

  // Use GPT-4V to describe the image if OpenAI API key is available
  let description = 'Image uploaded for diagram reference';

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this image in detail. Focus on:\n' +
                  '1. What the image shows\n' +
                  '2. Key visual elements (colors, shapes, layout)\n' +
                  '3. Any text or labels visible\n' +
                  '4. The overall style and design\n' +
                  '5. Any diagrams, charts, or illustrations present\n\n' +
                  'Be specific and thorough, as this description will be used to generate a new diagram.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      description = response.choices[0]?.message?.content || description;
    } catch (error) {
      console.error('Failed to analyze image with GPT-4V:', error);
      // Continue with default description if API fails
    }
  }

  return {
    fileName: file.name,
    fileType: mimeType,
    content: description,
    metadata: {
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      width: 'unknown', // Would need browser Image API to get dimensions
      height: 'unknown',
      format: file.type.split('/')[1],
    },
    images: [
      {
        description: file.name,
        data: dataUrl,
      },
    ],
  };
}
