# TexWritten

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)

Web application that extracts LaTeX from handwritten scientific notes or images. Convert photos of math notes to clean, editable LaTeX with live KaTeX preview and export to `.tex`, `.md`, or annotated images.

## Stack

- Frontend: React, Vite, TypeScript
- Styling: Tailwind CSS
- Rendu math: KaTeX
- PDF: rendu de la première page via `pdfjs-dist`
- Backend: API Node/Express
- OCR modulaire:
  - `openai`: vision model via Responses API avec Structured Outputs
  - `mathpix`: API Mathpix `/v3/text`
  - `tesseract`: fallback OCR texte simple
  - `mock`: données de démo sans clé API

## Lancer le projet

```bash
pnpm install
cp .env.example .env
pnpm dev
```

URLs par défaut:

- Web: `http://localhost:5173`
- API: `http://localhost:5174/api/health`

Build:

```bash
pnpm build
```

## Configuration OCR

Dans `.env`:

```bash
OCR_PROVIDER=mock
```

Options:

```bash
# OpenAI
OCR_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini

# Mathpix
OCR_PROVIDER=mathpix
MATHPIX_APP_ID=...
MATHPIX_APP_KEY=...

# Fallback texte simple
OCR_PROVIDER=tesseract
```

Le provider OpenAI utilise la Responses API avec image en data URL et sortie JSON structurée. Le provider Mathpix utilise l'endpoint image OCR `/v3/text` avec `formats: ["text", "data", "html"]`.

Références utiles:

- OpenAI vision inputs: https://developers.openai.com/api/docs/guides/images-vision
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Mathpix image OCR: https://docs.mathpix.com/reference/post-v3-text

## Architecture

```text
/src
  /components
    UploadBox.tsx
    ImagePreview.tsx
    LatexEditor.tsx
    LatexPreview.tsx
    ResultPanel.tsx
    ExportButtons.tsx
    HistoryPanel.tsx
  /lib
    ocrPipeline.ts
    latexCleaner.ts
    latexFormatter.ts
    confidenceScorer.ts
    exportTex.ts
    localHistory.ts
  /prompts
    systemPrompt.ts
    latexCorrectionPrompt.ts
  /types
    ocr.ts
  App.tsx
  main.tsx
/server
  /ocr
    pipeline.ts
    schema.ts
    heuristics.ts
    /providers
      openaiVisionProvider.ts
      mathpixProvider.ts
      tesseractProvider.ts
      mockProvider.ts
```

## Pipeline

1. Upload image/PDF.
2. Prétraitement navigateur:
   - rendu première page PDF si nécessaire,
   - resize,
   - grayscale,
   - amélioration de contraste.
3. Envoi à `/api/convert`.
4. Provider OCR sélectionné par `OCR_PROVIDER`.
5. Sortie JSON structurée:

```json
{
  "detected_language": "fr/en/mixed",
  "content_type": "math_notes",
  "blocks": [
    {
      "type": "text",
      "raw_text": "...",
      "latex": "...",
      "confidence": 0.8,
      "needs_review": false
    }
  ],
  "full_latex": "...",
  "warnings": []
}
```

6. Nettoyage LaTeX:
   - normalisation commandes,
   - validation accolades,
   - validation environnements,
   - ajout de `% TODO: vérifier cette formule` si confiance faible.
7. Édition, rendu KaTeX, export, historique local.

## Préambule LaTeX recommandé

```tex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[french,english]{babel}
\usepackage{amsmath,amssymb,mathtools}
\usepackage{bm}
\usepackage{siunitx}
\usepackage{geometry}
\geometry{margin=2.5cm}
\sisetup{locale=FR, per-mode=symbol}
```

## Snippets rapport

```tex
% Equation numerotee
\begin{equation}
  E = mc^2
\end{equation}

% Systeme aligne
\[
\begin{aligned}
  ax + by &= c \\
  dx + ey &= f
\end{aligned}
\]

% Matrice
\[
A = \begin{bmatrix}
  1 & 0 \\
  0 & 1
\end{bmatrix}
\]

% Grandeur avec unite SI
\[
v = \SI{3.2}{\meter\per\second}
\]
```

## Limites connues

- Le MVP convertit seulement la première page d'un PDF.
- Tesseract est un fallback texte; il ne reconnaît pas correctement la plupart des maths manuscrites.
- Les providers vision peuvent confondre `1/l`, `0/O`, `x/χ`, indices, exposants et bornes d'intégrales si l'écriture est floue.
- Les matrices et systèmes manuscrits sans alignement clair demandent souvent correction.
- Les zones illisibles doivent rester `[illisible]` ou `% TODO: vérifier cette formule`; il ne faut pas inventer de symboles.
- Les bounding boxes ne sont disponibles que si le provider en fournit ou si un mapping est ajouté.
- La correction de rotation est légère: pour de fortes rotations, il faut recadrer ou tourner l'image avant upload.
