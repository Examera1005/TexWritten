import { useRef, useState } from "react";
import { FileUp, Loader2, Wand2 } from "lucide-react";

interface UploadBoxProps {
  fileName?: string;
  isPreparing: boolean;
  isProcessing: boolean;
  canConvert: boolean;
  onFileSelect: (file: File) => void;
  onConvert: () => void;
}

export function UploadBox({
  fileName,
  isPreparing,
  isProcessing,
  canConvert,
  onFileSelect,
  onConvert
}: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-subtle">
      <div
        className={`flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition ${
          dragActive ? "border-signal bg-teal-50" : "border-graphite/30 bg-paper"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <FileUp className="mb-3 h-9 w-9 text-signal" aria-hidden="true" />
        <button
          type="button"
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-graphite"
          onClick={() => inputRef.current?.click()}
        >
          Choisir une image ou un PDF
        </button>
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => handleFiles(event.currentTarget.files)}
        />
        <p className="mt-3 max-w-60 text-sm text-graphite">
          {fileName ?? "PNG, JPEG, WebP ou PDF"}
        </p>
      </div>

      <button
        type="button"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-graphite/40"
        disabled={!canConvert || isPreparing || isProcessing}
        onClick={onConvert}
      >
        {isProcessing || isPreparing ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Wand2 className="h-4 w-4" aria-hidden="true" />
        )}
        {isPreparing ? "Préparation..." : isProcessing ? "Conversion..." : "Convertir en LaTeX"}
      </button>
    </section>
  );
}
