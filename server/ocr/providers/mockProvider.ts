import type { ConvertRequest, OcrResult } from "../../../src/types/ocr";
import { buildFullLatex } from "../../../src/lib/latexFormatter";

export async function runMockProvider(input: ConvertRequest): Promise<OcrResult> {
  const blocks = [
    {
      id: "mock-1",
      type: "text" as const,
      raw_text: `Exemple de conversion pour ${input.fileName}`,
      latex: `Exemple de conversion pour ${input.fileName}`,
      confidence: 0.93,
      needs_review: false
    },
    {
      id: "mock-2",
      type: "display_math" as const,
      raw_text: "F = m a",
      latex: "F = ma",
      confidence: 0.89,
      needs_review: false,
      bbox: { x: 0.16, y: 0.24, width: 0.58, height: 0.12 }
    },
    {
      id: "mock-3",
      type: "system" as const,
      raw_text: "x + y = 1; x - y = 0",
      latex: "x + y &= 1 \\\\\nx - y &= 0",
      confidence: 0.69,
      needs_review: true,
      bbox: { x: 0.14, y: 0.42, width: 0.68, height: 0.2 }
    }
  ];

  return {
    detected_language: "fr",
    content_type: "math_notes",
    blocks,
    full_latex: buildFullLatex(blocks),
    warnings: [
      "Provider mock actif. Configure OCR_PROVIDER=openai, mathpix ou tesseract pour traiter de vraies images.",
      input.sourceType === "pdf" ? "Seule la premiere page du PDF est convertie dans ce MVP." : ""
    ].filter(Boolean)
  };
}
