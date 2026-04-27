# TexWritten Webapp Upgrade Plan

Comprehensive enhancement roadmap for the handwritten-to-LaTeX converter.

---

## Current State

- **Single-page PDF**: Only first page rendered via pdfjs-dist
- **One image**: Single image upload at a time
- **Export**: `.tex`, `.md`, annotated PNG only
- **OCR Providers**: OpenAI Vision, Mathpix, Tesseract, Mock
- **Stack**: React 19, Vite, Express, Tailwind
- **Known limits**: First page only, no batch, no multi-format export

---

## Feature Wishlist (Ranked by Value)

### Tier 1: High-Impact, Low Effort

| Feature | Value | Complexity | Dependencies | Effort |
|---------|------|------------|--------------|--------|
| **1.1 Multi-page PDF** | High | Low | pdfjs-dist already installed | ~4h |
| **1.2 Drag-drop zone** | High | Low | Add dropzone lib | ~2h |
| **1.3 Progress bar** | Medium | Low | React state | ~1h |

### Tier 2: Medium Effort, High Value

| Feature | Value | Complexity | Dependencies | Effort |
|---------|------|------------|--------------|--------|
| **2.1 Batch images** | High | Medium | Queue system, state | ~8h |
| **2.2 PDF export (Puppeteer)** | High | Medium | puppeteer pkg | ~6h |
| **2.3 DOCX export** | Medium | Medium | docx lib or pandoc | ~6h |

### Tier 3: New OCR Providers

| Feature | Value | Complexity | Dependencies | Effort |
|---------|------|------------|--------------|--------|
| **3.1 LlamaParse provider** | High | Medium | llama-cloud SDK | ~4h |
| **3.2 Google Cloud Vision** | Medium | Medium | @google-cloud/vision | ~6h |
| **3.3 Azure AI Vision** | Low | Medium | @azure/ai-vision | ~6h |

### Tier 4: UX Polish

| Feature | Value | Complexity | Dependencies | Effort |
|---------|------|------------|--------------|--------|
| **4.1 Error recovery** | Medium | Low | State management | ~3h |
| **4.2 Retry UI** | Medium | Low | UI components | ~2h |
| **4.3 File queue sidebar** | Medium | Medium | State + list | ~5h |

### Tier 5: Cloud Deployment

| Feature | Value | Complexity | Dependencies | Effort |
|---------|------|------------|--------------|--------|
| **5.1 Vercel deployment** | High | Low | Vercel CLI | ~2h |
| **5.2 Serverless API** | Medium | Medium | Vercel Functions | ~4h |
| **5.3 Docker** | Medium | Medium | Dockerfile | ~3h |

---

## Implementation Plan

### Phase 1: Quick Wins (Multi-page + UX)

```
Tasks:
- Extract all pages from PDF (pdfjs-dist getAllPages)
- Add page selector UI (dropdown or carousel)
- Add global progress indicator
- Drag-drop enhancement (react-dropzone)
```

### Phase 2: Batch Processing

```
Tasks:
- Create file queue state
- Implement sequential OCR queue
- Add batch results panel
- Error aggregation per-file
```

### Phase 3: Export Formats

```
Tasks:
- Add Puppeteer server route /api/export/pdf
- Add docx generation via docx.js
- Update ExportButtons with new options
```

### Phase 4: New OCR Providers

```
Tasks:
- Create provider interface
- Add LlamaParse provider
- Add Google Vision provider  
- Add Azure Vision provider
- Update .env.example
```

### Phase 5: Deployment

```
Tasks:
- Add Vercel config
- Dockerize
- Set up CI/CD
```

---

## OCR Provider Comparison

| Provider | Strengths | Weaknesses | Cost/Page |
|-----------|-----------|------------|-----------|
| **OpenAI Vision** | Best math reasoning | Rate limits | ~$0.001 |
| **Mathpix** | Purpose-built math | Slow, expensive | ~$0.005 |
| **LlamaParse** | Structure, tables | LLM post-proc needed | ~$0.002 |
| **Google Cloud** | Fast, reliable | Unclear on math | $0.0015 |
| **Azure** | Enterprise ready | Complex setup | $0.0015 |
| **Tesseract** | Free | Bad at math | $0 |

**Recommendation**: OpenAI remains primary. Add LlamaParse as secondary for structure-heavy docs.

---

## Required Dependencies

```json
{
  "add": [
    "react-dropzone",
    "puppeteer",
    "docx",
    "@llamaindex/llamaparse",
    "@google-cloud/vision",
    "@azure/ai-vision"
  ]
}
```

---

## UI/UX Enhancements

### Current Pain Points

1. **No multi-page** → Page selector needed
2. **No batch** → Queue sidebar needed
3. **No progress** → Global + per-file indicators
4. **Silent failures** → Toast notifications + retry buttons

### Recommended Components

- `PageSelector`: Dropdown/tabs for PDF pages
- `FileQueue`: Sidebar list of files with status
- `ProgressRing`: Per-file OCR progress
- `ErrorBanner`: Collapsible error + retry
- `ExportMenu`: Dropdown for format selection

---

## Cloud Deployment Options

| Platform | Pros | Cons | Est. Cost |
|----------|------|------|-----------|
| **Vercel** | Zero config, edge functions | Cold starts | $0-20/mo |
| **Railway** | Full Node, persistent | No free tier | $5+/mo |
| **Render** | Free tier available | Slow deploys | $0-25/mo |
| **Docker + VPS** | Full control | Ops overhead | $5+/mo |

**Recommendation**: Start with Vercel (easiest), add Dockerfile for portability.

---

## Next Steps

1. **Confirm priorities** → Which features ship first?
2. **API keys** → Which providers to add?
3. **Deployment target** → Vercel vs custom?

---

*生成: 2026-04-27*