import type { DetectedLanguage, OcrBlock, OcrResult } from "../../src/types/ocr";
import { buildFullLatex } from "../../src/lib/latexFormatter";

const MATH_HINT = /([=+\-*/^_]|\\frac|\\sqrt|\\int|\\sum|[∫∑√≤≥≈∞]|d\/d|partial|alpha|beta|gamma|theta|lambda|mu|sigma|omega)/i;

export function buildHeuristicResult(rawText: string, confidence: number, warnings: string[]): OcrResult {
  const normalized = rawText.trim();

  if (!normalized) {
    const blocks: OcrBlock[] = [
      {
        type: "unknown",
        raw_text: "[illisible]",
        latex: "% TODO: vérifier cette formule\n[illisible]",
        confidence: 0,
        needs_review: true
      }
    ];

    return {
      detected_language: "unknown",
      content_type: "unknown",
      blocks,
      full_latex: buildFullLatex(blocks),
      warnings: ["Aucun texte lisible extrait.", ...warnings]
    };
  }

  const blocks = normalized
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index): OcrBlock => {
      const mathLike = MATH_HINT.test(line);
      const type = mathLike ? inferMathType(line) : "text";
      const latex = mathLike ? plainMathToLatex(line) : line;

      return {
        id: `heuristic-${index + 1}`,
        type,
        raw_text: line,
        latex,
        confidence: mathLike ? Math.min(confidence, 0.62) : confidence,
        needs_review: mathLike || confidence < 0.75
      };
    });

  return {
    detected_language: detectLanguage(normalized),
    content_type: blocks.some((block) => block.type !== "text") ? "math_notes" : "text_notes",
    blocks,
    full_latex: buildFullLatex(blocks),
    warnings
  };
}

export function plainMathToLatex(input: string): string {
  return input
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/≈/g, "\\approx ")
    .replace(/∞/g, "\\infty ")
    .replace(/∑/g, "\\sum ")
    .replace(/∫/g, "\\int ")
    .replace(/√\s*\(([^()]*)\)/g, "\\sqrt{$1}")
    .replace(/sqrt\s*\(([^()]*)\)/gi, "\\sqrt{$1}")
    .replace(/\b([A-Za-z0-9]+)\s*\/\s*([A-Za-z0-9]+)\b/g, "\\frac{$1}{$2}")
    .replace(/\balpha\b/gi, "\\alpha")
    .replace(/\bbeta\b/gi, "\\beta")
    .replace(/\bgamma\b/gi, "\\gamma")
    .replace(/\btheta\b/gi, "\\theta")
    .replace(/\blambda\b/gi, "\\lambda")
    .replace(/\bsigma\b/gi, "\\sigma")
    .trim();
}

function inferMathType(line: string): OcrBlock["type"] {
  if (/[{[(]\s*[^)\]}]+[;,]\s*[^)\]}]+[)\]}]/.test(line) || line.includes("\\begin{matrix}")) {
    return "matrix";
  }

  if ((line.match(/=/g) ?? []).length > 1 || line.includes("\\\\")) {
    return "system";
  }

  if (line.length < 48 && /[A-Za-z0-9)]\s*=\s*/.test(line)) {
    return "display_math";
  }

  return "inline_math";
}

function detectLanguage(text: string): DetectedLanguage {
  const frenchHints = /\b(le|la|les|des|donc|avec|pour|fonction|equation|derivee|vitesse)\b/i.test(text);
  const englishHints = /\b(the|and|with|for|function|equation|derivative|velocity)\b/i.test(text);

  if (frenchHints && englishHints) {
    return "mixed";
  }

  if (frenchHints) {
    return "fr";
  }

  if (englishHints) {
    return "en";
  }

  return "unknown";
}
