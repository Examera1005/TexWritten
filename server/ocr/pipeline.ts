import type { ConvertRequest, OcrProvider, OcrResult } from "../../src/types/ocr";
import { cleanOcrResult } from "../../src/lib/latexCleaner";
import { runMathpixProvider } from "./providers/mathpixProvider";
import { runMockProvider } from "./providers/mockProvider";
import { runOpenAiVisionProvider } from "./providers/openaiVisionProvider";
import { runTesseractProvider } from "./providers/tesseractProvider";

export async function runServerOcrPipeline(input: ConvertRequest): Promise<OcrResult> {
  validateRequest(input);

  const provider = resolveProvider();
  const result = await runProvider(provider, input);

  return cleanOcrResult({
    ...result,
    provider,
    createdAt: new Date().toISOString()
  });
}

function resolveProvider(): OcrProvider {
  const raw = (process.env.OCR_PROVIDER ?? "mock").toLowerCase();

  if (raw === "openai" || raw === "mathpix" || raw === "tesseract" || raw === "mock") {
    return raw;
  }

  return "mock";
}

async function runProvider(provider: OcrProvider, input: ConvertRequest): Promise<OcrResult> {
  if (provider === "openai") {
    return runOpenAiVisionProvider(input);
  }

  if (provider === "mathpix") {
    return runMathpixProvider(input);
  }

  if (provider === "tesseract") {
    return runTesseractProvider(input);
  }

  return runMockProvider(input);
}

function validateRequest(input: ConvertRequest): void {
  if (!input || typeof input !== "object") {
    throw new Error("Requete invalide.");
  }

  if (!input.fileName || !input.mimeType || !input.dataUrl) {
    throw new Error("fileName, mimeType et dataUrl sont obligatoires.");
  }

  if (!input.dataUrl.startsWith("data:image/")) {
    throw new Error("Le backend attend une image pretraitee en data URL. Les PDF sont rendus en image cote client.");
  }
}
