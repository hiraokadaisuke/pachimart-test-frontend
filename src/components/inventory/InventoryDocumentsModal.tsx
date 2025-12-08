import React, { useRef } from "react";

import type {
  InventoryDocumentKind,
  InventoryDocumentMeta,
} from "@/types/inventory";
import { INVENTORY_DOCUMENT_LABELS } from "@/types/inventory";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId: number | null;
  itemTitle?: string;
  documents: InventoryDocumentMeta[];
  onUpload: (kind: InventoryDocumentKind, file: File) => void;
};

const KINDS: InventoryDocumentKind[] = [
  "kentei_notice",
  "tekkyo_meisai",
  "chuko_kakunin",
];

export function InventoryDocumentsModal({
  isOpen,
  onClose,
  itemId,
  itemTitle,
  documents,
  onUpload,
}: Props) {
  const fileInputRefs = useRef<
    Record<InventoryDocumentKind, HTMLInputElement | null>
  >({
    kentei_notice: null,
    tekkyo_meisai: null,
    chuko_kakunin: null,
  });

  if (!isOpen || itemId == null) return null;

  const handleFileChange = (
    kind: InventoryDocumentKind,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(kind, file);
    e.target.value = "";
  };

  const getDoc = (kind: InventoryDocumentKind) =>
    documents.find((doc) => doc.kind === kind);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">書類の管理</h2>
            {itemTitle && (
              <p className="mt-1 text-xs text-neutral-700">対象台：{itemTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-neutral-700 hover:text-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[360px] space-y-2 overflow-y-auto px-4 py-3 text-xs">
          {KINDS.map((kind) => {
            const doc = getDoc(kind);
            return (
              <div
                key={kind}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div>
                  <div className="font-medium">
                    {INVENTORY_DOCUMENT_LABELS[kind]}
                  </div>
                  {doc ? (
                    <div className="mt-1 text-[11px] text-neutral-800">
                      <div>ファイル名：{doc.fileName}</div>
                      <div>
                        サイズ：{Math.round(doc.size / 1024)} KB ／
                        アップロード：{new Date(doc.uploadedAt).toLocaleString("ja-JP")}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-[11px] text-neutral-700">
                      まだアップロードされていません。
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[kind]?.click()}
                    className="rounded border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-100"
                  >
                    アップロード
                  </button>
                  {doc && (
                    <a
                      href={doc.objectUrl}
                      download={doc.fileName}
                      className="rounded border border-blue-500 px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50"
                    >
                      ダウンロード
                    </a>
                  )}
                  <input
                    ref={(el) => {
                      fileInputRefs.current[kind] = el;
                    }}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(kind, e)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end border-t px-4 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
