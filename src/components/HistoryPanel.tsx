import { RotateCcw, Trash2 } from "lucide-react";
import type { ConversionHistoryItem } from "../types/ocr";

interface HistoryPanelProps {
  items: ConversionHistoryItem[];
  onRestore: (item: ConversionHistoryItem) => void;
  onRemove: (id: string) => void;
}

export function HistoryPanel({ items, onRestore, onRemove }: HistoryPanelProps) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-subtle">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-normal text-graphite">Historique</h2>
      {items.length === 0 ? (
        <p className="rounded-lg border border-ink/10 bg-paper p-3 text-sm text-graphite">Aucune conversion locale.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-ink/10 p-2">
              <img src={item.previewDataUrl} alt="" className="h-12 w-10 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{item.fileName}</p>
                <p className="text-xs text-graphite">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                className="rounded-md p-2 text-graphite transition hover:bg-paper hover:text-signal"
                onClick={() => onRestore(item)}
                title="Restaurer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="rounded-md p-2 text-graphite transition hover:bg-red-50 hover:text-red-700"
                onClick={() => onRemove(item.id)}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
