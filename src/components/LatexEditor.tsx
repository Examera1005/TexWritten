import { AlertTriangle } from "lucide-react";
import { validateLatex } from "../lib/latexCleaner";

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function LatexEditor({ value, onChange }: LatexEditorProps) {
  const validation = validateLatex(value);

  return (
    <section className="flex min-h-[28rem] flex-col rounded-lg border border-ink/10 bg-white p-4 shadow-subtle">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-normal text-graphite">Éditeur LaTeX</h2>
        {validation.needsReview ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            À vérifier
          </span>
        ) : null}
      </div>

      <textarea
        className="latex-source min-h-[23rem] flex-1 resize-y rounded-lg border border-ink/10 bg-paper p-3 text-sm leading-6 outline-none ring-signal/20 transition focus:border-signal focus:ring-4"
        value={value}
        spellCheck={false}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="Le LaTeX converti apparaîtra ici."
      />

      {validation.warnings.length > 0 ? (
        <div className="mt-3 space-y-1 text-xs text-amber-800">
          {validation.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
