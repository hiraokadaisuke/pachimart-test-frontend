"use client";

import { useState } from "react";

import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addImport, listImports, type InventoryImportRead } from "@/lib/inventory/mock";

export default function InventoryImportQrPage() {
  const [payload, setPayload] = useState("");
  const [imports, setImports] = useState<InventoryImportRead[]>(listImports());

  const handleRegister = () => {
    if (!payload.trim()) return;
    addImport(payload.trim());
    setPayload("");
    setImports(listImports());
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <InventoryToolbar
        title="QR仮登録（スマホ）"
        description="QR文字列を仮登録として記録します。カメラ起動は不要です。"
        actions={
          <Button
            onClick={handleRegister}
            className="h-8 rounded-none px-4 text-xs"
            disabled={!payload.trim()}
          >
            仮登録
          </Button>
        }
      />

      <div className="mt-4 space-y-4">
        <InventoryPanel title="QR文字列入力" description="QR読み取り結果を貼り付けてください。">
          <Input
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            className="h-8 rounded-none"
            placeholder="QR文字列を入力"
          />
        </InventoryPanel>

        <InventoryPanel title="直近の仮登録ログ">
          <InventoryTable
            headers={["読取日時", "区分", "QR文字列"]}
            emptyMessage={imports.length === 0 ? "仮登録ログはありません。" : undefined}
          >
            {imports.map((entry, index) => (
              <tr
                key={entry.id}
                className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                <td className="border border-slate-200 px-2 py-1">{entry.readAt}</td>
                <td className="border border-slate-200 px-2 py-1">{entry.source}</td>
                <td className="border border-slate-200 px-2 py-1 text-slate-600">
                  {entry.qrPayload ?? "-"}
                </td>
              </tr>
            ))}
          </InventoryTable>
        </InventoryPanel>
      </div>
    </div>
  );
}
