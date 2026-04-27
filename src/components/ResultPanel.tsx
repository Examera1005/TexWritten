import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Braces, FileCode, FileText } from "lucide-react";
import { buildTexDocument } from "../lib/latexFormatter";
import { confidenceClassName, confidenceLabel, resultConfidence } from "../lib/confidenceScorer";
import type { OcrResult } from "../types/ocr";

interface ResultPanelProps {
  result?: OcrResult;
  fileName?: string;
  editedLatex: string;
  onUseLatex: (value: string) => void;
}

type Tab = "raw" | "clean" | "document";

export function ResultPanel({ result, fileName = "notes", editedLatex, onUseLatex }: ResultPanelProps) {
  const [tab, setTab] = useState<Tab>("clean");
  const rawText = useMemo(() => result?.blocks.map((block) => block.raw_text).join("\n\n") ?? "", [result]);
  const cleanLatex = result?.full_latex ?? "";
  const documentLatex = buildTexDocument(editedLatex || cleanLatex, fileName);
  const output = tab === "raw" ? rawText : tab === "document" ? documentLatex : cleanLatex;

  if (!result) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-subtle">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-normal text-graphite">Résultat OCR</h2>
        <div className="rounded-lg border border-ink/10 bg-paper p-4 text-sm text-graphite">
          Le JSON OCR et les versions LaTeX apparaîtront après conversion.
        </div>
      </section>
    );
  }

  const confidence = resultConfidence(result);

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-subtle">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-normal text-graphite">Résultat OCR</h2>
        <span
          className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${confidenceClassName(confidence)}`}
          title={`Confidence estimee: ${Math.round(confidence * 100)}%`}
        >
          {confidenceLabel(confidence)} · {Math.round(confidence * 100)}%
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-lg border border-ink/10">
        <TabButton active={tab === "raw"} icon={<FileText className="h-4 w-4" />} onClick={() => setTab("raw")}>
          Brut
        </TabButton>
        <TabButton active={tab === "clean"} icon={<Braces className="h-4 w-4" />} onClick={() => setTab("clean")}>
          LaTeX
        </TabButton>
        <TabButton active={tab === "document"} icon={<FileCode className="h-4 w-4" />} onClick={() => setTab("document")}>
          Document
        </TabButton>
      </div>

      <pre className="latex-source max-h-72 overflow-auto rounded-lg border border-ink/10 bg-paper p-3 text-xs leading-5 text-ink">
        {output || "[vide]"}
      </pre>

      <button
        type="button"
        className="mt-3 inline-flex items-center gap-2 rounded-md border border-ink/10 px-3 py-2 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal"
        onClick={() => onUseLatex(output)}
      >
        <Braces className="h-4 w-4" aria-hidden="true" />
        Utiliser dans l’éditeur
      </button>

      {result.warnings.length > 0 ? (
        <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {result.warnings.map((warning) => (
            <p key={warning} className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{warning}</span>
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 overflow-auto rounded-lg border border-ink/10">
        <table className="w-full min-w-[28rem] text-left text-xs">
          <thead className="bg-paper text-graphite">
            <tr>
              <th className="px-3 py-2 font-semibold">Bloc</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Confidence</th>
              <th className="px-3 py-2 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {result.blocks.map((block, index) => (
              <tr key={block.id ?? index} className="border-t border-ink/10">
                <td className="px-3 py-2">{index + 1}</td>
                <td className="px-3 py-2">{block.type}</td>
                <td className="px-3 py-2">{Math.round(block.confidence * 100)}%</td>
                <td className="px-3 py-2">{block.needs_review ? "à vérifier" : "ok"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TabButton({
  active,
  icon,
  children,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-2 py-2 text-sm font-semibold transition ${
        active ? "bg-ink text-white" : "bg-white text-graphite hover:bg-paper"
      }`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
