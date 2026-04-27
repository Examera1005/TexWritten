import cors from "cors";
import express from "express";
import { runServerOcrPipeline } from "./ocr/pipeline";

const app = express();
const port = Number(process.env.PORT ?? 5174);

app.use(cors());
app.use(express.json({ limit: "28mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    provider: process.env.OCR_PROVIDER ?? "mock"
  });
});

app.post("/api/convert", async (request, response) => {
  try {
    const result = await runServerOcrPipeline(request.body);
    response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur OCR inconnue.";
    response.status(400).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`TexWritten API listening on http://localhost:${port}`);
});
