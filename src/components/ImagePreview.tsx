import type { OcrBlock } from "../types/ocr";

interface ImagePreviewProps {
  previewUrl?: string;
  fileName?: string;
  pageCount?: number;
  blocks?: OcrBlock[];
}

export function ImagePreview({ previewUrl, fileName, pageCount, blocks = [] }: ImagePreviewProps) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-subtle">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-normal text-graphite">Prévisualisation</h2>
        {pageCount ? <span className="text-xs text-graphite">{pageCount} page(s)</span> : null}
      </div>

      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-paper">
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={fileName ?? "Document à convertir"} className="h-full w-full object-contain" />
            {blocks.map((block, index) =>
              block.bbox ? (
                <span
                  key={block.id ?? index}
                  className={`absolute border-2 ${
                    block.needs_review ? "border-amberline bg-amber-400/10" : "border-signal bg-teal-400/10"
                  }`}
                  style={{
                    left: `${block.bbox.x * 100}%`,
                    top: `${block.bbox.y * 100}%`,
                    width: `${block.bbox.width * 100}%`,
                    height: `${block.bbox.height * 100}%`
                  }}
                  title={`${index + 1}. ${block.type}`}
                />
              ) : null
            )}
          </>
        ) : (
          <span className="text-sm text-graphite">Aucun fichier sélectionné</span>
        )}
      </div>
    </section>
  );
}
