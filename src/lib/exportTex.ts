import type { OcrBlock } from "../types/ocr";
import { buildMarkdownDocument, buildTexDocument } from "./latexFormatter";

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function downloadTextFile(fileName: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportLatexDocument(fileName: string, latexBody: string): void {
  downloadTextFile(safeExportName(fileName, "tex"), buildTexDocument(latexBody, fileName), "application/x-tex");
}

export function exportMarkdown(fileName: string, latexBody: string): void {
  downloadTextFile(safeExportName(fileName, "md"), buildMarkdownDocument(latexBody), "text/markdown");
}

export async function exportAnnotatedImage(fileName: string, previewDataUrl: string, blocks: OcrBlock[]): Promise<void> {
  const image = await loadImage(previewDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.drawImage(image, 0, 0);
  ctx.lineWidth = Math.max(3, Math.round(canvas.width / 360));
  ctx.font = `${Math.max(18, Math.round(canvas.width / 50))}px sans-serif`;
  ctx.textBaseline = "top";

  blocks.forEach((block, index) => {
    if (!block.bbox) {
      return;
    }

    const x = block.bbox.x * canvas.width;
    const y = block.bbox.y * canvas.height;
    const width = block.bbox.width * canvas.width;
    const height = block.bbox.height * canvas.height;

    ctx.strokeStyle = block.needs_review ? "#b7791f" : "#0f766e";
    ctx.fillStyle = block.needs_review ? "rgba(183, 121, 31, 0.16)" : "rgba(15, 118, 110, 0.14)";
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = block.needs_review ? "#7c2d12" : "#064e3b";
    ctx.fillText(`${index + 1}. ${block.type}`, x + 6, y + 6);
  });

  if (!blocks.some((block) => block.bbox)) {
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fillRect(16, 16, canvas.width - 32, 54);
    ctx.fillStyle = "#17202a";
    ctx.fillText("Aucune zone OCR avec coordonnees disponible pour ce provider.", 28, 30);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeExportName(fileName, "annotated.png");
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeExportName(fileName: string, extension: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "texwritten"}.${extension}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger l'image annotee."));
    image.src = src;
  });
}
