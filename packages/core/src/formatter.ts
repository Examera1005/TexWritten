import type { OcrBlock } from "./types.js";
import { TODO_COMMENT, stripDisplayDelimiters } from "./cleaner.js";

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

\title{Notes converted with TexWritten}
\author{}
\date{\today}`;

export function formatBlockAsLatex(block: OcrBlock): string {
  const latex = block.latex.trim() || "[illegible]";

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

export function buildTexDocument(body: string, title = "Notes converted with TexWritten"): string {
  const preamble = RECOMMENDED_PREAMBLE.replace(
    "\\title{Notes converted with TexWritten}",
    `\\title{${escapeLatexText(title)}}`
  );

  return `${preamble}\n\n\\begin{document}\n\\maketitle\n\n${body.trim() || "% No content extracted."}\n\n\\end{document}\n`;
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