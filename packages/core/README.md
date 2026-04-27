# @texwritten/core

Reusable LaTeX processing utilities for converting handwritten math to LaTeX.

## Installation

```bash
npm install @texwritten/core
```

## Usage

```typescript
import { cleanOcrResult, buildTexDocument, confidenceLabel } from "@texwritten/core";

// Clean OCR result
const cleaned = cleanOcrResult(ocrResult);

// Build LaTeX document
const latex = buildTexDocument(cleaned.full_latex, "My Notes");

// Check confidence
console.log(confidenceLabel(cleaned.confidence));
```

## API

### Types

- `OcrBlock` - Single block of OCR output
- `OcrResult` - Complete OCR result with blocks
- `DetectedLanguage` - Language detection result

### Cleaner

- `normalizeLatex()` - Normalize unicode characters to LaTeX
- `stripDisplayDelimiters()` - Remove display math delimiters
- `hasBalancedBraces()` - Check brace balance
- `validateLatex()` - Full validation with warnings
- `cleanBlockLatex()` - Clean single block
- `cleanOcrResult()` - Clean full result

### Formatter

- `buildTexDocument()` - Wrap in full TeX document
- `buildMarkdownDocument()` - Convert to Markdown
- `escapeLatexText()` - Escape special characters

### Heuristics

- `buildHeuristicResult()` - Build result from raw text
- `plainMathToLatex()` - Convert plain math to LaTeX

### Confidence

- `clampConfidence()` - Clamp value to [0, 1]
- `averageConfidence()` - Average across blocks
- `resultConfidence()` - Get result confidence
- `confidenceLabel()` - Get "low" / "medium" / "good" label