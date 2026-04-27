import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageSelectorProps {
  pageCount: number;
  activePageIndex: number;
  onPageSelect: (index: number) => void;
}

export function PageSelector({ pageCount, activePageIndex, onPageSelect }: PageSelectorProps) {
  if (pageCount <= 1) {
    return null;
  }

  const canGoBack = activePageIndex > 0;
  const canGoForward = activePageIndex < pageCount - 1;

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        className="rounded-md border border-ink/10 p-2 text-graphite transition hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:text-graphite/40"
        disabled={!canGoBack}
        onClick={() => onPageSelect(activePageIndex - 1)}
        title="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-md border border-ink/10 bg-paper p-1">
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            className={`min-w-[2.5rem] rounded px-2 py-1 text-xs font-semibold transition ${
              index === activePageIndex ? "bg-ink text-white" : "text-graphite hover:bg-white hover:text-signal"
            }`}
            onClick={() => onPageSelect(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="rounded-md border border-ink/10 p-2 text-graphite transition hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:text-graphite/40"
        disabled={!canGoForward}
        onClick={() => onPageSelect(activePageIndex + 1)}
        title="Page suivante"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
