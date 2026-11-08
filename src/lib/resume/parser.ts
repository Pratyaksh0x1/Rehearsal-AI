import pdfParse from 'pdf-parse';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ResumeParseResult {
  text: string;
  url: string;
  wordCount: number;
}

export async function parseAndSaveResume(
  fileBuffer: Buffer,
  fileName: string,
  userId: string
): Promise<ResumeParseResult> {
  // 1. Validate file size
  if (fileBuffer.byteLength > MAX_RESUME_SIZE_BYTES) {
    throw new Error('Resume file exceeds maximum allowed size of 5 MB.');
  }

  // 2. Validate PDF signature (magic bytes %PDF)
  const isPdf =
    fileBuffer.subarray(0, 4).toString() === '%PDF' ||
    fileBuffer.subarray(0, 5).toString().includes('%PDF');

  if (!isPdf) {
    throw new Error('Invalid file format. Only PDF files are supported.');
  }

  // 3. Extract text using pdf-parse
  let extractedText = '';
  try {
    const pdfData = await pdfParse(fileBuffer);
    extractedText = pdfData.text?.trim() || '';
  } catch (err: any) {
    console.error('PDF parsing error:', err);
    throw new Error('Unable to extract text from PDF. The document may be encrypted or image-only.');
  }

  // 4. Save file to storage (local uploads directory or object storage)
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resumes');
  await mkdir(uploadsDir, { recursive: true });

  const safeName = `${userId}_${Date.now()}.pdf`;
  const filePath = join(uploadsDir, safeName);
  await writeFile(filePath, fileBuffer);

  const publicUrl = `/uploads/resumes/${safeName}`;

  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

  return {
    text: extractedText,
    url: publicUrl,
    wordCount,
  };
}

