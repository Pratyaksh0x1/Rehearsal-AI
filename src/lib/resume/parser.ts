import pdfParse from 'pdf-parse';

export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ResumeParseResult {
  text: string;
  url: string;
  wordCount: number;
}

/**
 * Extracts text from the uploaded PDF resume.
 * Security: Does not store raw PDFs in public web directories to protect candidate PII.
 */
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

  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

  return {
    text: extractedText,
    url: '', // Stop storing raw PDFs in public web directory; store extracted text only
    wordCount,
  };
}
