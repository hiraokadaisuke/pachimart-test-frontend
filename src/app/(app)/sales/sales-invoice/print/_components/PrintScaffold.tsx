"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  pdfFileName?: string;
};

const printButtonClassName =
  "print-hidden mb-6 inline-flex items-center justify-center rounded-sm border border-yellow-600 bg-yellow-300 px-6 py-2 text-sm font-bold text-neutral-900 shadow-sm";
const pdfButtonClassName =
  "print-hidden mb-6 inline-flex items-center justify-center rounded-sm border border-slate-500 bg-slate-200 px-6 py-2 text-sm font-bold text-neutral-900 shadow-sm";

const handlePrint = () => {
  if (typeof window !== "undefined") {
    window.print();
  }
};

export function PrintScaffold({ children, pdfFileName }: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePdfDownload = useCallback(() => {
    if (!pdfFileName || !contentRef.current || isGeneratingPdf) return;
    if (typeof window === "undefined") return;
    const previousTitle = document.title;
    const sanitizedTitle = pdfFileName.replace(/\.pdf$/i, "");
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
      setIsGeneratingPdf(false);
    };
    setIsGeneratingPdf(true);
    document.title = sanitizedTitle;
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  }, [isGeneratingPdf, pdfFileName]);

  return (
    <div className="min-h-screen bg-white px-4 py-4 text-[12px] text-neutral-900">
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={handlePrint} className={printButtonClassName}>
          印刷
        </button>
        {pdfFileName && (
          <button
            type="button"
            onClick={handlePdfDownload}
            className={pdfButtonClassName}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? "PDF生成中..." : "PDFダウンロード"}
          </button>
        )}
      </div>
      <div ref={contentRef} className="mx-auto mt-4 max-w-5xl border border-black bg-white px-8 py-8">
        {children}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={handlePrint} className={printButtonClassName}>
          印刷
        </button>
        {pdfFileName && (
          <button
            type="button"
            onClick={handlePdfDownload}
            className={pdfButtonClassName}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? "PDF生成中..." : "PDFダウンロード"}
          </button>
        )}
      </div>
    </div>
  );
}
