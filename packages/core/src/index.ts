// Types
export type { OcrBlock, OcrResult, LatexValidation, OcrBlockType, DetectedLanguage, OcrProvider, SourceType, BoundingBox } from "./types.js";

// Cleaner
export {
  TODO_COMMENT,
  normalizeLatex,
  stripDisplayDelimiters,
  ensureTodoComment,
  hasBalancedBraces,
  findEnvironmentWarnings,
  validateLatex,
  cleanBlockLatex,
  cleanOcrResult
} from "./cleaner.js";

// Formatter
export {
  RECOMMENDED_PREAMBLE,
  formatBlockAsLatex,
  buildFullLatex,
  buildTexDocument,
  buildMarkdownDocument,
  escapeLatexText
} from "./formatter.js";

// Heuristics
export {
  buildHeuristicResult,
  plainMathToLatex
} from "./heuristics.js";

// Confidence
export {
  clampConfidence,
  averageConfidence,
  resultConfidence,
  confidenceLabel
} from "./confidence.js";

// Browser helpers (only usable in browser environment)
export {
  copyLatexToClipboard,
  downloadLatexFile,
  downloadTexDocument,
  downloadMarkdownDocument
} from "./index.browser.js";