"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import InventoryFormRow from "@/components/inventory/InventoryFormRow";
import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  confirmImport,
  listImports,
  type ConfirmImportPayload,
  type InventoryImportRead,
} from "@/lib/inventory/mock";

const presets = [
  { id: "preset-a", name: "プリセットA", description: "東東京倉庫 / A系ラベル" },
  { id: "preset-b", name: "プリセットB", description: "西東京倉庫 / B系ラベル" },
  { id: "preset-c", name: "プリセットC", description: "埼玉倉庫 / C系ラベル" },
];

const emptyForm: ConfirmImportPayload = {
  maker: "",
  model: "",
  manufacturedAt: "",
  certificationNumber: "",
  certificationDate: "",
  storageHub: "",
  storageLocation: "",
};

export default function InventoryImportReviewPage() {
  const [imports, setImports] = useState<InventoryImportRead[]>(listImports());
  const [selectedId, setSelectedId] = useState<string | null>(imports[0]?.id ?? null);
  const [form, setForm] = useState<ConfirmImportPayload>(emptyForm);
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null);

  const selectedImport = useMemo(
    () => imports.find((entry) => entry.id === selectedId) ?? null,
    [imports, selectedId],
  );

  useEffect(() => {
    if (!selectedId || !imports.some((entry) => entry.id === selectedId)) {
      setSelectedId(imports[0]?.id ?? null);
    }
  }, [imports, selectedId]);

  useEffect(() => {
    if (!selectedImport) {
      setForm(emptyForm);
      return;
    }

    setForm({
      maker: selectedImport.maker ?? "",
      model: selectedImport.model ?? "",
      manufacturedAt: "",
      certificationNumber: "",
      certificationDate: "",
      storageHub: selectedImport.storageHub ?? "",
      storageLocation: selectedImport.storageLocation ?? "",
    });
  }, [selectedImport]);

  const handleConfirm = () => {
    if (!selectedImport) return;
    const item = confirmImport(selectedImport.id, form);
    setImports(listImports());
    setLastConfirmed(item?.id ?? null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <InventoryToolbar
        title="仮登録の補完・確定"
        description="仮登録データに必要項目を補完し、在庫として確定登録します。"
        actions={
          <Link
            href="/inventory/items?type=stock"
            className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            在庫一覧へ
          </Link>
        }
      />

      {lastConfirmed ? (
        <div className="mt-4 border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-700">
          {lastConfirmed} を在庫として登録しました。続けて補完できます。
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <InventoryPanel title="プリセット一覧" description="取込元に応じて参照します。">
            <ul className="space-y-2 text-xs">
              {presets.map((preset) => (
                <li key={preset.id} className="border border-slate-200 bg-white px-3 py-2">
                  <p className="font-semibold text-slate-800">{preset.name}</p>
                  <p className="text-slate-600">{preset.description}</p>
                  <p className="text-slate-400">最終同期: 今日</p>
                </li>
              ))}
            </ul>
          </InventoryPanel>

          <InventoryPanel title="読取済みデータ（仮登録）">
            <InventoryTable
              headers={["読取日時", "取引元", "メーカー", "機種", "保管拠点", "保管場所"]}
              emptyMessage={imports.length === 0 ? "仮登録データはありません。" : undefined}
              emptyColSpan={6}
            >
              {imports.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={
                    entry.id === selectedId
                      ? "bg-blue-50"
                      : index % 2 === 0
                        ? "bg-white"
                        : "bg-slate-50"
                  }
                  onClick={() => setSelectedId(entry.id)}
                >
                  <td className="border border-slate-200 px-2 py-1">{entry.readAt}</td>
                  <td className="border border-slate-200 px-2 py-1">{entry.source}</td>
                  <td className="border border-slate-200 px-2 py-1">{entry.maker ?? "-"}</td>
                  <td className="border border-slate-200 px-2 py-1">{entry.model ?? "-"}</td>
                  <td className="border border-slate-200 px-2 py-1">{entry.storageHub ?? "-"}</td>
                  <td className="border border-slate-200 px-2 py-1">{entry.storageLocation ?? "-"}</td>
                </tr>
              ))}
            </InventoryTable>
          </InventoryPanel>
        </div>

        <InventoryPanel
          title="補完フォーム"
          description="選択した仮登録に不足情報を入力します。"
          actions={
            <Button
              onClick={handleConfirm}
              className="h-8 rounded-none px-4 text-xs"
              disabled={!selectedImport || !form.maker || !form.model}
            >
              確定登録
            </Button>
          }
        >
          <InventoryFormRow label="メーカー">
            <Input
              value={form.maker}
              onChange={(event) => setForm({ ...form, maker: event.target.value })}
              className="h-8 rounded-none"
              placeholder="メーカー名"
            />
          </InventoryFormRow>
          <InventoryFormRow label="機種">
            <Input
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
              className="h-8 rounded-none"
              placeholder="機種名"
            />
          </InventoryFormRow>
          <InventoryFormRow label="製造年月（任意）">
            <Input
              value={form.manufacturedAt}
              onChange={(event) => setForm({ ...form, manufacturedAt: event.target.value })}
              className="h-8 rounded-none"
              placeholder="2022-03"
            />
          </InventoryFormRow>
          <InventoryFormRow label="検定番号（任意）">
            <Input
              value={form.certificationNumber}
              onChange={(event) => setForm({ ...form, certificationNumber: event.target.value })}
              className="h-8 rounded-none"
              placeholder="P12345"
            />
          </InventoryFormRow>
          <InventoryFormRow label="検定日（任意）">
            <Input
              value={form.certificationDate}
              onChange={(event) => setForm({ ...form, certificationDate: event.target.value })}
              className="h-8 rounded-none"
              placeholder="2024-04-01"
            />
          </InventoryFormRow>
          <InventoryFormRow label="保管拠点（倉庫）">
            <Input
              value={form.storageHub}
              onChange={(event) => setForm({ ...form, storageHub: event.target.value })}
              className="h-8 rounded-none"
              placeholder="東東京倉庫"
            />
          </InventoryFormRow>
          <InventoryFormRow label="保管場所（棚）">
            <Input
              value={form.storageLocation}
              onChange={(event) => setForm({ ...form, storageLocation: event.target.value })}
              className="h-8 rounded-none"
              placeholder="A-01"
            />
          </InventoryFormRow>
        </InventoryPanel>
      </div>
    </div>
  );
}
