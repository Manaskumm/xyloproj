const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 75_000;

const SUPPORTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

export function validateUpload(file: File) {
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new Error("Upload a PDF, DOCX, or TXT lease document.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Upload must be 8 MB or smaller.");
  }
}

export async function extractTextFromUpload(file: File) {
  validateUpload(file);

  if (file.type === "text/plain") {
    return limitExtractedText(await file.text());
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return limitExtractedText(result.text);
  }

  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return limitExtractedText(result.value);
}

function limitExtractedText(text: string) {
  const normalized = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();

  if (normalized.length < 500) {
    throw new Error("The document did not contain enough readable text to analyze.");
  }

  return normalized.slice(0, MAX_EXTRACTED_CHARS);
}
