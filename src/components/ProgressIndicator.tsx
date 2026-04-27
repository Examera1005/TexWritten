import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { OcrProgress } from "../types/ocr";

interface ProgressIndicatorProps {
  progress: OcrProgress;
}

export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  if (progress.stage === "idle") {
    return null;
  }

  const isError = progress.stage === "error";
  const isComplete = progress.stage === "complete";
  const Icon = isError ? AlertCircle : isComplete ? CheckCircle2 : Loader2;

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-subtle">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            className={`h-4 w-4 shrink-0 ${
              isError ? "text-red-700" : isComplete ? "text-emerald-700" : "animate-spin text-signal"
            }`}
            aria-hidden="true"
          />
          <p className="truncate text-sm font-semibold text-ink">{progress.message}</p>
        </div>
        <span className="text-xs font-semibold text-graphite">{progress.percent}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-paper">
        <div
          className={`h-full rounded-full transition-all ${
            isError ? "bg-red-600" : isComplete ? "bg-emerald-600" : "bg-signal"
          }`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {progress.total > 1 ? (
        <p className="mt-2 text-xs text-graphite">
          {progress.current} / {progress.total}
        </p>
      ) : null}
    </section>
  );
}
