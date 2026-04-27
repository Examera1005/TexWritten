import type { OcrBlock, OcrResult, LatexValidation } from "./types.js";
import { clampConfidence, averageConfidence } from "./confidence.js";

export const TODO_COMMENT = "% TODO: verify this formula";

const MATH_TYPES = new Set(["inline_math", "display_math", "system", "matrix", "unknown"]);

export function normalizeLatex(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/≈/g, "\\approx ")
    .replace(/∞/g, "\\infty ")
    .replace(/∑/g, "\\sum ")
    .replace(/∫/g, "\\int ")
    .replace(/√\s*\(([^()]*)\)/g, "\\sqrt{$1}")
    .replace(/sqrt\s*\(([^()]*)\)/gi, "\\sqrt{$1}")
    .replace(/\\dfrac/g, "\\frac")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripDisplayDelimiters(input: string): string {
  return input
    .trim()
    .replace(/^\\\[/, "")
    .replace(/\\\]$/, "")
    .replace(/^\$\$/, "")
    .replace(/\$\$$/, "")
    .trim();
}

export function ensureTodoComment(latex: string): string {
  const clean = latex.trim();
  if (clean.startsWith(TODO_COMMENT)) {
    return clean;
  }

  return `${TODO_COMMENT}\n${clean || "[illegible]"}`;
}

export function hasBalancedBraces(latex: string): boolean {
  let depth = 0;
  let escaped = false;

  for (const char of latex) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }

  return depth === 0;
}

export function findEnvironmentWarnings(latex: string): string[] {
  const warnings: string[] = [];
  const beginMatches = Array.from(latex.matchAll(/\\begin\{([^}]+)\}/g)).map((match) => match[1]);
  const endMatches = Array.from(latex.matchAll(/\\end\{([^}]+)\}/g)).map((match) => match[1]);

  for (const env of beginMatches) {
    const starts = beginMatches.filter((value) => value === env).length;
    const ends = endMatches.filter((value) => value === env).length;
    if (starts !== ends) {
      warnings.push(`Environment ${env} unbalanced.`);
    }
  }

  for (const env of endMatches) {
    if (!beginMatches.includes(env)) {
      warnings.push(`End environment ${env} without begin.`);
    }
  }

  return warnings;
}

export function validateLatex(latex: string): LatexValidation {
  const balancedBraces = hasBalancedBraces(latex);
  const environmentWarnings = findEnvironmentWarnings(latex);
  const warnings = [
    ...(balancedBraces ? [] : ["Unbalanced braces."]),
    ...environmentWarnings
  ];

  return {
    balancedBraces,
    environmentWarnings,
    warnings,
    needsReview: warnings.length > 0 || latex.includes("[illegible]") || latex.includes(TODO_COMMENT)
  };
}

export function cleanBlockLatex(block: OcrBlock): OcrBlock {
  const confidence = clampConfidence(block.confidence);
  const raw = normalizeLatex(block.raw_text || "");
  let latex = normalizeLatex(block.latex || raw || "[illegible]");
  const isMath = MATH_TYPES.has(block.type);

  if (isMath && block.type !== "inline_math") {
    latex = stripDisplayDelimiters(latex);
  }

  const validation = validateLatex(latex);
  const needsReview =
    block.needs_review ||
    confidence < 0.75 ||
    validation.needsReview ||
    latex.includes("[illegible]");

  if (isMath && needsReview) {
    latex = ensureTodoComment(latex);
  }

  return {
    ...block,
    raw_text: raw,
    latex,
    confidence,
    needs_review: needsReview,
    warnings: [...(block.warnings ?? []), ...validation.warnings]
  };
}

export function cleanOcrResult(result: OcrResult): OcrResult {
  const blocks = result.blocks.map((block, index) => cleanBlockLatex({ ...block, id: block.id ?? `block-${index + 1}` }));
  const fullLatex = normalizeLatex(joinBlocksAsLatex(blocks));
  const warnings = Array.from(
    new Set([
      ...result.warnings,
      ...blocks.flatMap((block) => block.warnings ?? []),
      ...(blocks.some((block) => block.needs_review) ? ["Some blocks need manual verification."] : [])
    ])
  );

  return {
    ...result,
    blocks,
    full_latex: fullLatex,
    warnings,
    confidence: averageConfidence(blocks),
    createdAt: result.createdAt ?? new Date().toISOString()
  };
}

function joinBlocksAsLatex(blocks: OcrBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "text") {
        return block.raw_text || block.latex;
      }

      if (block.type === "inline_math") {
        return `\\(${stripDisplayDelimiters(block.latex.replace(TODO_COMMENT, "").trim())}\\)`;
      }

      const todo = block.latex.includes(TODO_COMMENT) ? `${TODO_COMMENT}\n` : "";
      const body = stripDisplayDelimiters(block.latex.replace(TODO_COMMENT, "").trim());

      if (block.type === "system" && !body.includes("\\begin{")) {
        return `${todo}\\[\n\\begin{aligned}\n${body}\n\\end{aligned}\n\\]`;
      }

      return `${todo}\\[\n${body}\n\\]`;
    })
    .join("\n\n")
    .trim();
}