import type { DocFile } from "@/data/types";

type Props = { file: DocFile; onClose: () => void };

export default function PdfViewer({ file, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0a09]/95 backdrop-blur-sm">
      <header className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="font-display mr-auto text-sm text-[#f4ede0] sm:text-base">
          {file.title}
        </h2>
        <a
          href={file.src}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-[#e8dfc9] transition hover:border-[#d4af37]"
        >
          Open in new tab
        </a>
        <a
          href={file.src}
          download
          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-[#e8dfc9] transition hover:border-[#d4af37]"
        >
          Download
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-[#d4af37] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-black transition hover:bg-[#ffe08a]"
        >
          Close
        </button>
      </header>

      {/* the "document": a paper sheet on a dark desk */}
      <div className="flex-1 overflow-hidden p-2 sm:p-6">
        <iframe
          src={`${file.src}#view=FitH`}
          title={file.title}
          className="mx-auto h-full w-full max-w-4xl rounded-md bg-white shadow-2xl"
        />
      </div>
      <p className="px-4 pb-3 text-center text-[11px] text-[#8a7f66]">
        On some phones only the first page shows here. Use “Open in new tab” to
        read the whole thing.
      </p>
    </div>
  );
}
