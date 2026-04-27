import type { OcrResult } from "./types.js";
import { buildTexDocument, buildMarkdownDocument } from "./formatter.js";

/**
 * Copy LaTeX to clipboard (browser only)
 */
export async function copyLatexToClipboard(latex: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(latex);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download LaTeX as .tex file (browser only)
 */
export function downloadLatexFile(latex: string, fileName = "document.tex"): void {
  const blob = new Blob([latex], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download full TeX document (browser only)
 */
export function downloadTexDocument(result: OcrResult, title = "Notes"): void {
  const fullDoc = buildTexDocument(result.full_latex, title);
  downloadLatexFile(fullDoc, `${title.replace(/\s+/g, "_")}.tex`);
}

/**
 * Download full Markdown document (browser only)
 */
export function downloadMarkdownDocument(result: OcrResult, title = "Notes"): void {
  const markdown = buildMarkdownDocument(result.full_latex);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/\s+/g, "_")}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}