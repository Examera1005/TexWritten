export const ocrResultJsonSchema = {
  type: "object",
  properties: {
    detected_language: {
      type: "string",
      enum: ["fr", "en", "mixed", "unknown"]
    },
    content_type: {
      type: "string",
      enum: ["math_notes", "text_notes", "unknown"]
    },
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["text", "inline_math", "display_math", "system", "matrix", "unknown"]
          },
          raw_text: { type: "string" },
          latex: { type: "string" },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          needs_review: { type: "boolean" }
        },
        required: ["type", "raw_text", "latex", "confidence", "needs_review"],
        additionalProperties: false
      }
    },
    full_latex: { type: "string" },
    warnings: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["detected_language", "content_type", "blocks", "full_latex", "warnings"],
  additionalProperties: false
} as const;
