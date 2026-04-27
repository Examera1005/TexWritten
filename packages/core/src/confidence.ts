import type { OcrBlock, OcrResult } from "./types.js";

export function clampConfidence(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function averageConfidence(blocks: OcrBlock[]): number {
  if (blocks.length === 0) {
    return 0;
  }

  const total = blocks.reduce((sum, block) => sum + clampConfidence(block.confidence), 0);
  return Number((total / blocks.length).toFixed(2));
}

export function resultConfidence(result: OcrResult): number {
  return typeof result.confidence === "number" ? clampConfidence(result.confidence) : averageConfidence(result.blocks);
}

export function confidenceLabel(value: number): "low" | "medium" | "good" {
  if (value < 0.55) {
    return "low";
  }

  if (value < 0.8) {
    return "medium";
  }

  return "good";
}

export function confidenceClassName(value: number): string {
  if (value < 0.55) {
    return "bg-red-100 text-red-700 ring-red-200";
  }

  if (value < 0.8) {
    return "bg-amber-100 text-amber-800 ring-amber-200";
  }

  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
}