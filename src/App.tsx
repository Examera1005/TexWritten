import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { ExportButtons } from "./components/ExportButtons";
import { HistoryPanel } from "./components/HistoryPanel";
import { ImagePreview } from "./components/ImagePreview";
import { LatexEditor } from "./components/LatexEditor";
import { LatexPreview } from "./components/LatexPreview";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { ResultPanel } from "./components/ResultPanel";
import { UploadBox } from "./components/UploadBox";
import { addHistoryItem, loadHistory, removeHistoryItem } from "./lib/localHistory";
import { combineOcrResults, prepareUpload, runOcrPages } from "./lib/ocrPipeline";
import type { ConversionHistoryItem, OcrProgress, OcrResult, ProcessedUpload } from "./types/ocr";

const IDLE_PROGRESS: OcrProgress = {
  stage: "idle",
  current: 0,
  total: 1,
  percent: 0,
  message: ""
};

export default function App() {
  const [upload, setUpload] = useState<ProcessedUpload | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [pagePreviews, setPagePreviews] = useState<string[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [fileName, setFileName] = useState<string>();
  const [pageCount, setPageCount] = useState<number>();
  const [result, setResult] = useState<OcrResult>();
  const [pageResults, setPageResults] = useState<OcrResult[]>([]);
  const [editedLatex, setEditedLatex] = useState("");
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OcrProgress>(IDLE_PROGRESS);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const canConvert = Boolean(upload);
  const selectedResult = pageResults[activePageIndex] ?? result;
  const selectedPreviewUrl = pagePreviews[activePageIndex] ?? previewUrl;
  const blocks = selectedResult?.blocks ?? [];

  const activeLatex = useMemo(() => editedLatex || result?.full_latex || "", [editedLatex, result]);

  async function handleFileSelect(file: File) {
    setError(undefined);
    setIsPreparing(true);
    setProgress({ stage: "preparing", current: 0, total: 1, percent: 0, message: "Préparation du fichier..." });

    try {
      const prepared = await prepareUpload(file, setProgress);
      setUpload(prepared);
      setPreviewUrl(prepared.previewUrl);
      setPagePreviews(prepared.pages.map((page) => page.previewUrl));
      setActivePageIndex(0);
      setFileName(prepared.fileName);
      setPageCount(prepared.pageCount);
      setResult(undefined);
      setPageResults([]);
      setEditedLatex("");
      setProgress({
        stage: "complete",
        current: prepared.pages.length,
        total: prepared.pages.length,
        percent: 100,
        message: prepared.pages.length > 1 ? `${prepared.pages.length} pages prêtes.` : "Fichier prêt."
      });
    } catch (issue) {
      const message = issue instanceof Error ? issue.message : "Impossible de préparer ce fichier.";
      setError(message);
      setProgress({ stage: "error", current: 0, total: 1, percent: 0, message });
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
    setProgress({
      stage: "processing",
      current: 0,
      total: upload.pages.length,
      percent: 0,
      message: `OCR de ${upload.pages.length} page(s)...`
    });

    try {
      const convertedPages = await runOcrPages(upload, setProgress);
      const converted = combineOcrResults(convertedPages) ?? convertedPages[0];
      setPageResults(convertedPages);
      setResult(converted);
      setEditedLatex(converted.full_latex);

      const item: ConversionHistoryItem = {
        id: crypto.randomUUID?.() ?? `${Date.now()}`,
        fileName: upload.fileName,
        previewDataUrl: upload.previewUrl,
        pagePreviews: upload.pages.map((page) => page.previewUrl),
        result: converted,
        results: convertedPages,
        editedLatex: converted.full_latex,
        createdAt: new Date().toISOString()
      };

      setHistory(addHistoryItem(item));
      setProgress({
        stage: "complete",
        current: convertedPages.length,
        total: convertedPages.length,
        percent: 100,
        message: "Conversion terminée."
      });
    } catch (issue) {
      const message = issue instanceof Error ? issue.message : "La conversion a échoué.";
      setError(message);
      setProgress({ stage: "error", current: 0, total: upload.pages.length, percent: 0, message });
    } finally {
      setIsProcessing(false);
    }
  }

  function restoreHistory(item: ConversionHistoryItem) {
    setUpload(null);
    setPreviewUrl(item.pagePreviews?.[0] ?? item.previewDataUrl);
    setPagePreviews(item.pagePreviews ?? [item.previewDataUrl]);
    setActivePageIndex(0);
    setFileName(item.fileName);
    setPageCount(item.pagePreviews?.length ?? item.results?.length ?? 1);
    setResult(item.result);
    setPageResults(item.results ?? []);
    setEditedLatex(item.editedLatex);
    setError(undefined);
    setProgress(IDLE_PROGRESS);
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
            onUploadError={setError}
            onConvert={handleConvert}
          />

          {error ? (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}

          <ProgressIndicator progress={progress} />
          <ImagePreview
            previewUrl={selectedPreviewUrl}
            fileName={fileName}
            pageCount={pageCount}
            activePageIndex={activePageIndex}
            blocks={blocks}
            onPageSelect={setActivePageIndex}
          />
          <ExportButtons latex={activeLatex} fileName={fileName} previewUrl={selectedPreviewUrl} blocks={blocks} />
          <HistoryPanel items={history} onRestore={restoreHistory} onRemove={deleteHistoryItem} />
        </aside>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <ResultPanel result={selectedResult} fileName={fileName} editedLatex={activeLatex} onUseLatex={setEditedLatex} />
            <LatexEditor value={activeLatex} onChange={setEditedLatex} />
          </div>
          <LatexPreview value={activeLatex} />
        </div>
      </div>
    </main>
  );
}
