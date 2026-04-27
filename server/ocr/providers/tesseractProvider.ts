import type { ConvertRequest, OcrResult } from "../../../src/types/ocr";
import { buildHeuristicResult } from "../heuristics";

export async function runTesseractProvider(input: ConvertRequest): Promise<OcrResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng+fra");

  try {
    const buffer = dataUrlToBuffer(input.dataUrl);
    const result = await worker.recognize(buffer);
    const confidence = Math.max(0, Math.min(1, (result.data.confidence ?? 0) / 100));

    return buildHeuristicResult(result.data.text ?? "", confidence, [
      "Fallback Tesseract: fiable pour texte simple, limite pour LaTeX manuscrit."
    ]);
  } finally {
    await worker.terminate();
  }
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const [, base64] = dataUrl.split(",");
  return Buffer.from(base64 ?? "", "base64");
}
