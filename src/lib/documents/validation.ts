import {
  ALLOWED_MIME_TYPES,
  DOCUMENT_MAX_BYTES,
  resolveMimeType,
} from "@/lib/documents/constants";

export type UploadValidationErrorCode =
  | "missing_file"
  | "too_large"
  | "unsupported_type";

export interface UploadValidationError {
  code: UploadValidationErrorCode;
  message: string;
  status: 400 | 413 | 415;
}

export interface ValidatedUploadFile {
  file: File;
  mimeType: string;
}

export function validateUploadFile(
  file: File | null
): UploadValidationError | ValidatedUploadFile {
  if (!file || file.size === 0) {
    return {
      code: "missing_file",
      message: "A non-empty file is required.",
      status: 400,
    };
  }

  if (file.size > DOCUMENT_MAX_BYTES) {
    return {
      code: "too_large",
      message: `File exceeds the ${DOCUMENT_MAX_BYTES / (1024 * 1024)}MB limit.`,
      status: 413,
    };
  }

  const mimeType = resolveMimeType(file.name, file.type);

  if (!(mimeType && ALLOWED_MIME_TYPES.has(mimeType))) {
    return {
      code: "unsupported_type",
      message: "Only PDF, Markdown, and plain text files are supported.",
      status: 415,
    };
  }

  return { file, mimeType };
}
