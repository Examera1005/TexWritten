# Library Extraction Plan: @texwritten/core

## Goal

Extract TexWritten's reusable LaTeX processing logic into an npm package developers can use in their own projects.

---

## 1. What Is Actually Reusable?

| Module | Reusable? | Reason |
|--------|-----------|--------|
| `latexCleaner.ts` | **YES** | Pure functions: normalize, validate, clean |
| `latexFormatter.ts` | **YES** | Pure functions: build documents, escape text |
| `heuristics.ts` | **YES** | Pure functions: parse plain text -> LaTeX |
| `confidenceScorer.ts` | **YES** | Pure functions: scoring |
| `exportTex.ts` | **PARTIAL** | Uses DOM APIs (clipboard, blob) |
| OcrPipeline | **NO** | Ties providers to HTTP |
| Providers | **NO** | Require external APIs |
| UI Components | **NO** | React-specific |
| Server | **NO** | Express-specific |

**Core extraction:** 4 modules (~450 lines of pure logic)

---

## 2. API Surface Design

### 2.1 Named Exports

```typescript
// Core cleaning/validation
export function normalizeLatex(input: string): string;
export function stripDisplayDelimiters(input: string): string;
export function hasBalancedBraces(latex: string): boolean;
export function findEnvironmentWarnings(latex: string): string[];
export function validateLatex(latex: string): LatexValidation;

// Document building
export function buildTexDocument(body: string, title?: string): string;
export function buildMarkdownDocument(body: string): string;
export function formatBlockAsLatex(block: OcrBlock): string;
export function buildFullLatex(blocks: OcrBlock[]): string;
export function escapeLatexText(input: string): string;

// Heuristics
export function plainMathToLatex(input: string): string;
export function buildHeuristicResult(
  rawText: string, 
  confidence: number, 
  warnings?: string[]
): OcrResult;

// Confidence
export function clampConfidence(value: number | undefined): number;
export function averageConfidence(blocks: OcrBlock[]): number;
export function confidenceLabel(value: number): "low" | "medium" | "high";
```

### 2.2 API Usage Examples

**Simple cleaning:**
```typescript
import { normalizeLatex, validateLatex } from "@texwritten/core";

const raw = "x^2 + y^2 = z^2";
const cleaned = normalizeLatex(raw);

const validation = validateLatex(cleaned);
if (validation.needsReview) {
  console.warn("Fix this LaTeX:", validation.warnings);
}
```

**Build document from blocks:**
```typescript
import { buildTexDocument, OcrBlock } from "@texwritten/core";

const blocks: OcrBlock[] = [
  { type: "text", raw_text: "Solution:", latex: "Solution:", confidence: 1, needs_review: false },
  { type: "display_math", raw_text: "E=mc^2", latex: "E=mc^2", confidence: 0.9, needs_review: false }
];

const doc = buildTexDocument(blocks.map(b => b.latex).join("\n\n"), "Physics Notes");
// -> \documentclass... \begin{document} ...
```

**Heuristic OCR fallback:**
```typescript
import { buildHeuristicResult, plainMathToLatex } from "@texwritten/core";

// When no OCR provider available, use heuristics
const result = buildHeuristicResult("alpha + beta = gamma", 0.7);
// Returns OcrResult with inferred block types
```

---

## 3. File Structure for Published Package

```
@texwritten/core/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Main entry, re-exports all
│   ├── types.ts             # All type exports
│   ├── cleaner.ts          # LaTeX cleaning
│   ├── formatter.ts        # Document formatting  
│   ├── heuristics.ts       # Text-to-LaTeX heuristics
│   ├── confidence.ts        # Confidence scoring
│   └── index.browser.ts    # Browser-specific helpers
├── dist/                   # Compiled output
│   ├── index.js             # ESM
│   ├── index.js.map
│   ├── index.d.ts           # Types
│   ├── index.browser.js    # Browser build
│   └── ...
└── README.md
```

---

## 4. Provider Abstraction (Extensibility)

Design pattern for future provider plugin system:

```typescript
// Plugin interface (not in v1, but design for it)
export interface LatexProcessor {
  name: string;
  process(input: string): Promise<OcrResult>;
  validate(input: OcrResult): ValidationResult;
}

// Example extension point
export function createPipeline(processor: LatexProcessor) {
  return async (input: ImageData) => {
    const raw = await processor.process(input);
    return cleanOcrResult(raw);
  };
}
```

**Decision:** Skip for v1. Keep it simple. Add later if demand.

---

## 5. TypeScript Types to Export

```typescript
// All re-exported from single types.ts

export type OcrBlockType = "text" | "inline_math" | "display_math" | "system" | "matrix" | "unknown";
export type DetectedLanguage = "fr" | "en" | "mixed" | "unknown";
export type ContentType = "math_notes" | "text_notes" | "unknown";

export interface BoundingBox { x: number; y: number; width: number; height: number; }

export interface OcrBlock {
  id?: string;
  type: OcrBlockType;
  raw_text: string;
  latex: string;
  confidence: number;
  needs_review: boolean;
  bbox?: BoundingBox;
  warnings?: string[];
}

export interface OcrResult {
  detected_language: DetectedLanguage;
  content_type: ContentType;
  blocks: OcrBlock[];
  full_latex: string;
  warnings: string[];
  confidence?: number;
  createdAt?: string;
}

export interface LatexValidation {
  balancedBraces: boolean;
  environmentWarnings: string[];
  warnings: string[];
  needsReview: boolean;
}
```

---

## 6. Browser vs Node.js Support

| Module | Browser | Node.js | Notes |
|--------|---------|-------|-------|
| cleaner.ts | ✅ | ✅ | Pure functions |
| formatter.ts | ✅ | ✅ | Pure functions |
| heuristics.ts | ✅ | ✅ | Pure functions |
| confidence.ts | ✅ | ✅ | Pure functions |
| index.browser.ts | ✅ | ❌ | clipboard API |

**Approach:** Single package, dual build.

- `main` / `module` → ESM for bundlers
- `types` → `.d.ts` files
- Browser-specific code in separate entry: `@texwritten/core/browser`

```typescript
// package.json exports
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./browser": {
      "types": "./dist/index.browser.d.ts", 
      "default": "./dist/index.browser.js"
    }
  }
}
```

---

## 7. Packaging (exports field, types, ESM/CJS)

### package.json Design

```json
{
  "name": "@texwritten/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./browser": {
      "types": "./dist/index.browser.d.ts",
      "import": "./dist/index.browser.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc && tsc --project tsconfig.browser.json",
    "prepublishOnly": "npm run build"
  }
}
```

### Build Targets

1. **ESM** (default): `dist/index.js` - for bundlers
2. **CJS fallback**: `dist/index.cjs` - for Node
3. **Browser**: `dist/index.browser.js` - excludes Node code

---

## 8. Execution Plan

### Phase 1: Refactor (~1 hour)

| Task | Files | Action |
|------|-------|--------|
| Create `packages/core/` directory | - | New folder structure |
| Copy reusable modules | cleaner.ts, formatter.ts, heuristics.ts, confidence.ts | Move to package |
| Create `src/index.ts` | index.ts | Re-export everything |
| Create `src/types.ts` | types.ts | Consolidate types |
| Adapt imports | All moved files fix relative paths |

### Phase 2: Package Config (~30 min)

| Task | Files | Action |
|------|-------|--------|
| Create `package.json` | package.json | Per design above |
| Create `tsconfig.json` | tsconfig.json | Library build |
| Create build scripts | package.json | tsc commands |

### Phase 3: Browser Entry (~15 min)

| Task | Files | Action |
|------|-------|--------|
| Create browser-specific helpers | index.browser.ts | Clipboard, downloads |
| Create browser exports | package.json | ./browser entry |

### Phase 4: Test & Publish (~30 min)

| Task | Files | Action |
|------|-------|--------|
| Build package | - | Run tsc |
| Verify types | - | `tsc --noEmit` |
| Test in app | - | Import from package |
| Publish to npm (optional) | - | `npm publish` or GitHub packages |

---

## 9. Summary

**Extracted Package:** `@texwritten/core`

| Metric | Value |
|--------|-------|
| Modules | 4 |
| Lines of code | ~450 |
| External deps | 0 |
| TypeScript | ✅ |
| ESM + CJS | ✅ |
| Browser | ✅ |
| Node.js | ✅ |

**API:** Clean named exports. Developers import what they need.

**Next:** Execute phase above to create package structure.