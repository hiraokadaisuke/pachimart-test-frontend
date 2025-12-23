"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const printButtonClassName =
  "print-hidden mb-6 inline-flex items-center justify-center rounded-sm border border-yellow-600 bg-yellow-300 px-6 py-2 text-sm font-bold text-neutral-900 shadow-sm";

const handlePrint = () => {
  if (typeof window !== "undefined") {
    window.print();
  }
};

export function PrintScaffold({ children }: Props) {
  return (
    <div className="min-h-screen bg-white px-4 py-4 text-[12px] text-neutral-900">
      <div className="flex justify-center">
        <button type="button" onClick={handlePrint} className={printButtonClassName}>
          印刷
        </button>
      </div>
      <div className="mx-auto mt-4 max-w-5xl border border-black bg-white px-8 py-8">{children}</div>
      <div className="mt-6 flex justify-center">
        <button type="button" onClick={handlePrint} className={printButtonClassName}>
          印刷
        </button>
      </div>
    </div>
  );
}
