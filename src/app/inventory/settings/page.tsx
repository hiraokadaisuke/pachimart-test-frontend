"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_MASTER_DATA,
  loadMasterData,
  saveMasterData,
  type MasterData,
} from "@/lib/demo-data/demoMasterData";

const createEmptyInputs = () => ({ suppliers: "", buyerStaffs: "", warehouses: "" });

type MasterKey = keyof MasterData;

type InputState = Record<MasterKey, string>;

const LABELS: Record<MasterKey, string> = {
  suppliers: "仕入れ先 (会社名)",
  buyerStaffs: "仕入れ担当者",
  warehouses: "保管先 (倉庫)",
};

export default function InventorySettingsPage() {
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [inputs, setInputs] = useState<InputState>(createEmptyInputs());

  useEffect(() => {
    setMasterData(loadMasterData());
  }, []);

  const updateStorage = (next: MasterData) => {
    setMasterData(next);
    saveMasterData(next);
  };

  const handleAdd = (key: MasterKey) => {
    const value = inputs[key].trim();
    if (!value) return;
    if (masterData[key].includes(value)) {
      setInputs((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const next = { ...masterData, [key]: [...masterData[key], value] };
    updateStorage(next);
    setInputs((prev) => ({ ...prev, [key]: "" }));
  };

  const handleDelete = (key: MasterKey, value: string) => {
    const next = { ...masterData, [key]: masterData[key].filter((item) => item !== value) };
    updateStorage(next);
  };

  const handleInputChange = (key: MasterKey, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const renderSection = (key: MasterKey) => (
    <section key={key} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 whitespace-nowrap">{LABELS[key]}</h2>
        <div className="flex items-center gap-2">
          <input
            value={inputs[key]}
            onChange={(event) => handleInputChange(key, event.target.value)}
            placeholder="新しい項目を入力"
            className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleAdd(key)}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
          >
            追加
          </button>
        </div>
      </div>

      {masterData[key].length === 0 ? (
        <p className="text-sm text-neutral-600">まだ登録がありません。</p>
      ) : (
        <ul className="space-y-2">
          {masterData[key].map((item) => (
            <li key={item} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-neutral-800" title={item}>
                {item}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(key, item)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">詳細設定</h1>
        <p className="text-sm text-neutral-600">仕入れ先、仕入れ担当、保管先の候補を追加・削除できます。</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {renderSection("suppliers")}
        {renderSection("buyerStaffs")}
        {renderSection("warehouses")}
      </div>
    </div>
  );
}
