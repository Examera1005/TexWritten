import type { ConvertRequest, OcrResult, ProcessedUpload } from "../types/ocr";
import { cleanOcrResult } from "./latexCleaner";

const MAX_IMAGE_SIDE = 1800;

export async function prepareUpload(file: File): Promise<ProcessedUpload> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const rendered = await renderFirstPdfPage(file);
    return {
      originalFile: file,
      fileName: file.name,
      mimeType: "image/png",
      dataUrl: rendered.dataUrl,
      previewUrl: rendered.dataUrl,
      sourceType: "pdf",
      pageCount: rendered.pageCount
    };
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Format non supporte. Utilise une image ou un PDF.");
  }

  const dataUrl = await preprocessImage(file);
  return {
    originalFile: file,
    fileName: file.name,
    mimeType: "image/jpeg",
    dataUrl,
    previewUrl: dataUrl,
    sourceType: "image"
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

async function preprocessImage(file: File): Promise<string> {
  const image = await loadImage(URL.createObjectURL(file));
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas indisponible pour le pretraitement.");
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(image.src);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const enhanced = Math.max(0, Math.min(255, (gray - 128) * 1.18 + 128));
    data[index] = enhanced;
    data[index + 1] = enhanced;
    data[index + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderFirstPdfPage(file: File): Promise<{ dataUrl: string; pageCount: number }> {
  const [{ getDocument, GlobalWorkerOptions }, { default: pdfWorker }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.mjs?url")
  ]);

  GlobalWorkerOptions.workerSrc = pdfWorker;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas indisponible pour le rendu PDF.");
  }

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return { dataUrl: canvas.toDataURL("image/png"), pageCount: pdf.numPages };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de lire l'image."));
    image.src = src;
  });
}
