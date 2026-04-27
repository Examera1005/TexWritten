import type { ConvertRequest, OcrResult } from "../../../src/types/ocr";
import { OCR_SYSTEM_PROMPT, OCR_USER_INSTRUCTION } from "../../../src/prompts/systemPrompt";
import { ocrResultJsonSchema } from "../schema";

export async function runOpenAiVisionProvider(input: ConvertRequest): Promise<OcrResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY manquant pour OCR_PROVIDER=openai.");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: OCR_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `${OCR_USER_INSTRUCTION}\n\nFichier: ${input.fileName}\nSource: ${input.sourceType}${
                input.pageCount ? `, ${input.pageCount} page(s), premiere page rendue en image.` : ""
              }`
            },
            {
              type: "input_image",
              image_url: input.dataUrl
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "math_notes_ocr",
          schema: ocrResultJsonSchema,
          strict: true
        }
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Erreur OpenAI Responses API.");
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("La reponse OpenAI ne contient pas de JSON exploitable.");
  }

  return JSON.parse(outputText) as OcrResult;
}

function extractOutputText(payload: unknown): string {
  if (isRecord(payload) && typeof payload.output_text === "string") {
    return payload.output_text;
  }

  if (!isRecord(payload) || !Array.isArray(payload.output)) {
    return "";
  }

  for (const item of payload.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (isRecord(content) && content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
