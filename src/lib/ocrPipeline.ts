import type { ConvertRequest, OcrProgress, OcrResult, ProcessedPage, ProcessedUpload } from "../types/ocr";
import { averageConfidence } from "./confidenceScorer";
import { cleanOcrResult } from "./latexCleaner";

const MAX_IMAGE_SIDE = 1800;

type ProgressCallback = (progress: OcrProgress) => void;

export async function prepareUpload(file: File, onProgress?: ProgressCallback): Promise<ProcessedUpload> {
  emitProgress(onProgress, "preparing", 0, 1, "Préparation du fichier...");

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const rendered = await renderPdfPages(file, onProgress);
    const firstPage = rendered.pages[0];

    return {
      originalFile: file,
      fileName: file.name,
      mimeType: firstPage.mimeType,
      dataUrl: firstPage.dataUrl,
      previewUrl: firstPage.previewUrl,
      sourceType: "pdf",
      pageCount: rendered.pageCount,
      pageNumber: 1,
      totalPages: rendered.pageCount,
      pages: rendered.pages
    };
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Format non supporte. Utilise une image ou un PDF.");
  }

  const dataUrl = await preprocessImage(file);
  emitProgress(onProgress, "preparing", 1, 1, "Image prête.");
  const page: ProcessedPage = {
    fileName: file.name,
    mimeType: "image/jpeg",
    dataUrl,
    previewUrl: dataUrl,
    sourceType: "image",
    pageCount: 1,
    pageNumber: 1,
    totalPages: 1
  };

  return {
    originalFile: file,
    fileName: file.name,
    mimeType: page.mimeType,
    dataUrl: page.dataUrl,
    previewUrl: page.previewUrl,
    sourceType: "image",
    pageCount: 1,
    pageNumber: 1,
    totalPages: 1,
    pages: [page]
  };
}

export async function runOcrPipeline(upload: ConvertRequest): Promise<OcrResult> {
  const response = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(upload)
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "La conversion OCR a echoue.");
  }

  return cleanOcrResult(payload as OcrResult);
}

export async function runOcrPages(upload: ProcessedUpload, onProgress?: ProgressCallback): Promise<OcrResult[]> {
  const pages = upload.pages.length > 0 ? upload.pages : [upload];
  const results: OcrResult[] = [];

  for (const [index, page] of pages.entries()) {
    emitProgress(onProgress, "processing", index, pages.length, `OCR page ${index + 1} / ${pages.length}...`);
    results.push(await runOcrPipeline(page));
    emitProgress(onProgress, "processing", index + 1, pages.length, `Page ${index + 1} convertie.`);
  }

  return results;
}

export function combineOcrResults(results: OcrResult[]): OcrResult | undefined {
  if (results.length === 0) {
    return undefined;
  }

  if (results.length === 1) {
    return results[0];
  }

  const blocks = results.flatMap((result, pageIndex) =>
    result.blocks.map((block, blockIndex) => ({
      ...block,
      id: `page-${pageIndex + 1}-${block.id ?? blockIndex + 1}`,
      warnings: [`Page ${pageIndex + 1}`, ...(block.warnings ?? [])]
    }))
  );
  const languages = new Set(results.map((result) => result.detected_language));
  const providers = new Set(results.map((result) => result.provider).filter(Boolean));
  const warnings = results.flatMap((result, index) =>
    result.warnings.map((warning) => `Page ${index + 1}: ${warning}`)
  );

  return {
    detected_language: languages.size === 1 ? results[0].detected_language : "mixed",
    content_type: results.some((result) => result.content_type === "math_notes") ? "math_notes" : results[0].content_type,
    blocks,
    full_latex: results
      .map((result, index) => `% Page ${index + 1}\n${result.full_latex.trim() || "% No LaTeX extracted."}`)
      .join("\n\n")
      .trim(),
    warnings,
    provider: providers.size === 1 ? results[0].provider : undefined,
    confidence: averageConfidence(blocks),
    createdAt: new Date().toISOString()
  };
}

async function preprocessImage(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);
  const image = await loadImage(imageUrl);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas indisponible pour le pretraitement.");
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(imageUrl);
  enhanceCanvas(ctx, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderPdfPages(file: File, onProgress?: ProgressCallback): Promise<{ pages: ProcessedPage[]; pageCount: number }> {
  const [{ getDocument, GlobalWorkerOptions }, { default: pdfWorker }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.mjs?url")
  ]);

  GlobalWorkerOptions.workerSrc = pdfWorker;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data: bytes }).promise;
  const pages: ProcessedPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    emitProgress(onProgress, "preparing", pageNumber - 1, pdf.numPages, `Rendu PDF page ${pageNumber} / ${pdf.numPages}...`);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Canvas indisponible pour le rendu PDF.");
    }

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    enhanceCanvas(ctx, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    pages.push({
      fileName: `${file.name} - page ${pageNumber}`,
      mimeType: "image/png",
      dataUrl,
      previewUrl: dataUrl,
      sourceType: "pdf",
      pageCount: pdf.numPages,
      pageNumber,
      totalPages: pdf.numPages
    });
    emitProgress(onProgress, "preparing", pageNumber, pdf.numPages, `Page ${pageNumber} prête.`);
  }

  return { pages, pageCount: pdf.numPages };
}

function emitProgress(
  onProgress: ProgressCallback | undefined,
  stage: OcrProgress["stage"],
  current: number,
  total: number,
  message: string
): void {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(safeTotal, Math.max(0, current));
  onProgress?.({
    stage,
    current: safeCurrent,
    total: safeTotal,
    percent: Math.round((safeCurrent / safeTotal) * 100),
    message
  });
}

function enhanceCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const enhanced = Math.max(0, Math.min(255, (gray - 128) * 1.18 + 128));
    data[index] = enhanced;
    data[index + 1] = enhanced;
    data[index + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de lire l'image."));
    image.src = src;
  });
}
