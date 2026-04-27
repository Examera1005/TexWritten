// Re-export from @texwritten/core
import { 
  TODO_COMMENT, 
  normalizeLatex, 
  stripDisplayDelimiters, 
  hasBalancedBraces, 
  findEnvironmentWarnings, 
  validateLatex, 
  cleanBlockLatex, 
  cleanOcrResult 
} from "../../packages/core/src/cleaner.js";

export { 
  TODO_COMMENT, 
  normalizeLatex, 
  stripDisplayDelimiters, 
  hasBalancedBraces, 
  findEnvironmentWarnings, 
  validateLatex, 
  cleanBlockLatex, 
  cleanOcrResult 
};

// Re-export confidence functions used by cleaner
export { clampConfidence, averageConfidence } from "./confidenceScorer";