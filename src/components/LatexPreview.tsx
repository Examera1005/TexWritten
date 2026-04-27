import type { ReactNode } from "react";
import katex from "katex";
import { TODO_COMMENT } from "../lib/latexCleaner";

interface LatexPreviewProps {
  value: string;
}

export function LatexPreview({ value }: LatexPreviewProps) {
  return (
    <section className="min-h-[28rem] rounded-lg border border-ink/10 bg-white p-4 shadow-subtle">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-normal text-graphite">Rendu</h2>
      <div className="prose prose-sm max-w-none text-ink">
        {value.trim() ? renderLatexDocument(value) : <p className="text-graphite">Aucun rendu disponible.</p>}
      </div>
    </section>
  );
}

function renderLatexDocument(source: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const displayRegex = /(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = displayRegex.exec(source))) {
    const before = source.slice(cursor, match.index);
    if (before.trim()) {
      nodes.push(<TextBlock key={`text-${cursor}`} text={before} />);
    }

    nodes.push(<MathBlock key={`math-${match.index}`} source={match[0]} display />);
    cursor = match.index + match[0].length;
  }

  const rest = source.slice(cursor);
  if (rest.trim()) {
    nodes.push(<TextBlock key={`text-${cursor}`} text={rest} />);
  }

  return nodes;
}

function TextBlock({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .filter((part) => part.trim())
        .map((part, index) => (
          <p key={`${part.slice(0, 16)}-${index}`} className="whitespace-pre-wrap leading-7">
            {renderInlineMath(part)}
          </p>
        ))}
    </>
  );
}

function renderInlineMath(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const inlineRegex = /(\\\([\s\S]*?\\\)|\$[^$\n]+\$)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text))) {
    const before = text.slice(cursor, match.index);
    if (before) {
      nodes.push(before);
    }

    nodes.push(<MathBlock key={`inline-${match.index}`} source={match[0]} />);
    cursor = match.index + match[0].length;
  }

  const rest = text.slice(cursor);
  if (rest) {
    nodes.push(rest);
  }

  return nodes;
}

function MathBlock({ source, display = false }: { source: string; display?: boolean }) {
  const { todo, body } = stripMathSource(source);

  return (
    <span className={display ? "my-3 block" : "inline-block align-baseline"}>
      {todo ? <code className="latex-source mb-2 block text-xs text-amber-800">{TODO_COMMENT}</code> : null}
      <span
        dangerouslySetInnerHTML={{
          __html: renderMath(body, display)
        }}
      />
    </span>
  );
}

function stripMathSource(source: string): { todo: boolean; body: string } {
  const todo = source.includes(TODO_COMMENT);
  const body = source
    .replace(TODO_COMMENT, "")
    .replace(/^\\\[/, "")
    .replace(/\\\]$/, "")
    .replace(/^\\\(/, "")
    .replace(/\\\)$/, "")
    .replace(/^\$\$/, "")
    .replace(/\$\$$/, "")
    .replace(/^\$/, "")
    .replace(/\$$/, "")
    .trim();

  return { todo, body };
}

function renderMath(source: string, display: boolean): string {
  try {
    return katex.renderToString(source || "\\text{[illisible]}", {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      trust: false
    });
  } catch {
    return `<code class="latex-source text-red-700">${escapeHtml(source)}</code>`;
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
