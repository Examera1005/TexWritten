import type { OcrBlock } from "../types/ocr";
import { TODO_COMMENT, stripDisplayDelimiters } from "./latexCleaner";

export const RECOMMENDED_PREAMBLE = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[french,english]{babel}
\usepackage{amsmath,amssymb,mathtools}
\usepackage{bm}
\usepackage{siunitx}
\usepackage{geometry}
\geometry{margin=2.5cm}
\sisetup{locale=FR, per-mode=symbol}

\title{Notes converties avec TexWritten}
\author{}
\date{\today}`;

export const REPORT_SNIPPETS = String.raw`% Equation numerotee
\begin{equation}
  E = mc^2
\end{equation}

% Systeme aligne
\[
\begin{aligned}
  ax + by &= c \\
  dx + ey &= f
\end{aligned}
\]

% Matrice
\[
A = \begin{bmatrix}
  1 & 0 \\
  0 & 1
\end{bmatrix}
\]

% Grandeur avec unite SI
\[
v = \SI{3.2}{\meter\per\second}
\]`;

export function formatBlockAsLatex(block: OcrBlock): string {
  const latex = block.latex.trim() || "[illisible]";

  if (block.type === "text") {
    return block.raw_text.trim() || latex;
  }

  if (block.type === "inline_math") {
    const body = stripDisplayDelimiters(latex.replace(TODO_COMMENT, "").trim());
    const todo = latex.includes(TODO_COMMENT) ? `${TODO_COMMENT}\n` : "";
    return `${todo}\\(${body}\\)`;
  }

  const body = stripDisplayDelimiters(latex.replace(TODO_COMMENT, "").trim());
  const todo = latex.includes(TODO_COMMENT) ? `${TODO_COMMENT}\n` : "";

  if (block.type === "system" && !body.includes("\\begin{")) {
    return `${todo}\\[\n\\begin{aligned}\n${body}\n\\end{aligned}\n\\]`;
  }

  return `${todo}\\[\n${body}\n\\]`;
}

export function buildFullLatex(blocks: OcrBlock[]): string {
  return blocks.map(formatBlockAsLatex).filter(Boolean).join("\n\n").trim();
}

export function buildTexDocument(body: string, title = "Notes converties avec TexWritten"): string {
  const preamble = RECOMMENDED_PREAMBLE.replace(
    "\\title{Notes converties avec TexWritten}",
    `\\title{${escapeLatexText(title)}}`
  );

  return `${preamble}\n\n\\begin{document}\n\\maketitle\n\n${body.trim() || "% Aucun contenu extrait."}\n\n\\end{document}\n`;
}

export function buildMarkdownDocument(body: string): string {
  return body
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .trim()
    .concat("\n");
}

export function escapeLatexText(input: string): string {
  return input
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}
