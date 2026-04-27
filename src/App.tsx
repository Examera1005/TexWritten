import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { ExportButtons } from "./components/ExportButtons";
import { HistoryPanel } from "./components/HistoryPanel";
import { ImagePreview } from "./components/ImagePreview";
import { LatexEditor } from "./components/LatexEditor";
import { LatexPreview } from "./components/LatexPreview";
import { ResultPanel } from "./components/ResultPanel";
import { UploadBox } from "./components/UploadBox";
import { addHistoryItem, loadHistory, removeHistoryItem } from "./lib/localHistory";
import { prepareUpload, runOcrPipeline } from "./lib/ocrPipeline";
import type { ConversionHistoryItem, OcrResult, ProcessedUpload } from "./types/ocr";

export default function App() {
  const [upload, setUpload] = useState<ProcessedUpload | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [pageCount, setPageCount] = useState<number>();
  const [result, setResult] = useState<OcrResult>();
  const [editedLatex, setEditedLatex] = useState("");
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const canConvert = Boolean(upload);
  const blocks = result?.blocks ?? [];

  const activeLatex = useMemo(() => editedLatex || result?.full_latex || "", [editedLatex, result]);

  async function handleFileSelect(file: File) {
    setError(undefined);
    setIsPreparing(true);

    try {
      const prepared = await prepareUpload(file);
      setUpload(prepared);
      setPreviewUrl(prepared.previewUrl);
      setFileName(prepared.fileName);
      setPageCount(prepared.pageCount);
      setResult(undefined);
      setEditedLatex("");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Impossible de préparer ce fichier.");
    } finally {
      setIsPreparing(false);
    }
  }

  async function handleConvert() {
    if (!upload) {
      return;
    }

    setError(undefined);
    setIsProcessing(true);

    try {
      const converted = await runOcrPipeline(upload);
      setResult(converted);
      setEditedLatex(converted.full_latex);

      const item: ConversionHistoryItem = {
        id: crypto.randomUUID?.() ?? `${Date.now()}`,
        fileName: upload.fileName,
        previewDataUrl: upload.previewUrl,
        result: converted,
        editedLatex: converted.full_latex,
        createdAt: new Date().toISOString()
      };

      setHistory(addHistoryItem(item));
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "La conversion a échoué.");
    } finally {
      setIsProcessing(false);
    }
  }

  function restoreHistory(item: ConversionHistoryItem) {
    setUpload(null);
    setPreviewUrl(item.previewDataUrl);
    setFileName(item.fileName);
    setPageCount(undefined);
    setResult(item.result);
    setEditedLatex(item.editedLatex);
    setError(undefined);
  }

  function deleteHistoryItem(id: string) {
    setHistory(removeHistoryItem(id));
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div>
            <h1 className="text-3xl font-bold text-ink">TexWritten</h1>
            <p className="mt-1 text-sm text-graphite">Notes manuscrites scientifiques vers LaTeX propre.</p>
          </div>

          <UploadBox
            fileName={fileName}
            isPreparing={isPreparing}
            isProcessing={isProcessing}
            canConvert={canConvert}
            onFileSelect={handleFileSelect}
            onConvert={handleConvert}
          />

          {error ? (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}

          <ImagePreview previewUrl={previewUrl} fileName={fileName} pageCount={pageCount} blocks={blocks} />
          <ExportButtons latex={activeLatex} fileName={fileName} previewUrl={previewUrl} blocks={blocks} />
          <HistoryPanel items={history} onRestore={restoreHistory} onRemove={deleteHistoryItem} />
        </aside>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <ResultPanel result={result} fileName={fileName} editedLatex={activeLatex} onUseLatex={setEditedLatex} />
            <LatexEditor value={activeLatex} onChange={setEditedLatex} />
          </div>
          <LatexPreview value={activeLatex} />
        </div>
      </div>
    </main>
  );
}
