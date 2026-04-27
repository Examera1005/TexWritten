import type { ConvertRequest, OcrBlock, OcrResult } from "../../../src/types/ocr";
import { buildFullLatex } from "../../../src/lib/latexFormatter";
import { buildHeuristicResult } from "../heuristics";

interface MathpixLineData {
  type?: string;
  value?: string;
  latex?: string;
  text?: string;
  confidence?: number;
}

export async function runMathpixProvider(input: ConvertRequest): Promise<OcrResult> {
  const appId = process.env.MATHPIX_APP_ID;
  const appKey = process.env.MATHPIX_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("MATHPIX_APP_ID et MATHPIX_APP_KEY sont requis pour OCR_PROVIDER=mathpix.");
  }

  const response = await fetch("https://api.mathpix.com/v3/text", {
    method: "POST",
    headers: {
      app_id: appId,
      app_key: appKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      src: input.dataUrl,
      formats: ["text", "data", "html"],
      data_options: {
        include_latex: true,
        include_asciimath: true
      },
      ocr: ["math", "text"],
      rm_spaces: true
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error ?? payload?.error_info?.message ?? "Erreur Mathpix.");
  }

  const blocks = parseMathpixBlocks(payload);
  if (blocks.length > 0) {
    return {
      detected_language: "mixed",
      content_type: "math_notes",
      blocks,
      full_latex: buildFullLatex(blocks),
      warnings: payload?.confidence_rate && payload.confidence_rate < 0.75 ? ["Confidence Mathpix faible."] : []
    };
  }

  return buildHeuristicResult(payload?.text ?? payload?.latex_styled ?? "", 0.72, [
    "Mathpix n'a pas renvoye de blocs detailles; segmentation heuristique appliquee."
  ]);
}

function parseMathpixBlocks(payload: { data?: MathpixLineData[]; text?: string; latex_styled?: string }): OcrBlock[] {
  if (!Array.isArray(payload.data)) {
    return [];
  }

  return payload.data
    .map((item, index): OcrBlock | null => {
      const value = item.value ?? item.latex ?? item.text ?? "";
      if (!value.trim()) {
        return null;
      }

      const isMath = item.type?.includes("math") || /\\\(|\\\[|\\frac|\\int|\\sum|=/.test(value);
      const confidence = typeof item.confidence === "number" ? item.confidence : 0.8;

      return {
        id: `mathpix-${index + 1}`,
        type: isMath ? "display_math" : "text",
        raw_text: item.text ?? value,
        latex: value,
        confidence,
        needs_review: confidence < 0.75
      };
    })
    .filter((block): block is OcrBlock => Boolean(block));
}
