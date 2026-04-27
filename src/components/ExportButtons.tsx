import { useState } from "react";
import { Check, Clipboard, FileDown, FileText, ImageDown } from "lucide-react";
import type { OcrBlock } from "../types/ocr";
import { copyToClipboard, exportAnnotatedImage, exportLatexDocument, exportMarkdown } from "../lib/exportTex";

interface ExportButtonsProps {
  latex: string;
  fileName?: string;
  previewUrl?: string;
  blocks?: OcrBlock[];
}

export function ExportButtons({ latex, fileName = "notes", previewUrl, blocks = [] }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyToClipboard(latex);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-subtle">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-normal text-graphite">Export</h2>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-graphite disabled:cursor-not-allowed disabled:bg-graphite/40"
          disabled={!latex.trim()}
          onClick={handleCopy}
          title="Copier le LaTeX"
        >
          {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
          Copier
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-ink/10 px-3 py-2 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:text-graphite/40"
          disabled={!latex.trim()}
          onClick={() => exportLatexDocument(fileName, latex)}
          title="Exporter un fichier .tex"
        >
          <FileDown className="h-4 w-4" />
          .tex
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-ink/10 px-3 py-2 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:text-graphite/40"
          disabled={!latex.trim()}
          onClick={() => exportMarkdown(fileName, latex)}
          title="Exporter un fichier .md"
        >
          <FileText className="h-4 w-4" />
          .md
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-ink/10 px-3 py-2 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:text-graphite/40"
          disabled={!previewUrl}
          onClick={() => previewUrl && exportAnnotatedImage(fileName, previewUrl, blocks)}
          title="Exporter l'image annotée"
        >
          <ImageDown className="h-4 w-4" />
          Image
        </button>
      </div>
    </section>
  );
}
