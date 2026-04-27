export type OcrBlockType =
  | "text"
  | "inline_math"
  | "display_math"
  | "system"
  | "matrix"
  | "unknown";

export type DetectedLanguage = "fr" | "en" | "mixed" | "unknown";

export type OcrProvider = "openai" | "mathpix" | "tesseract" | "mock";

export type SourceType = "image" | "pdf";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrBlock {
  id?: string;
  type: OcrBlockType;
  raw_text: string;
  latex: string;
  confidence: number;
  needs_review: boolean;
  bbox?: BoundingBox;
  warnings?: string[];
}

export interface OcrResult {
  detected_language: DetectedLanguage;
  content_type: "math_notes" | "text_notes" | "unknown";
  blocks: OcrBlock[];
  full_latex: string;
  warnings: string[];
  provider?: OcrProvider;
  confidence?: number;
  createdAt?: string;
}

export interface LatexValidation {
  balancedBraces: boolean;
  environmentWarnings: string[];
  warnings: string[];
  needsReview: boolean;
}