"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import InventoryFormRow from "@/components/inventory/InventoryFormRow";
import InventoryPanel from "@/components/inventory/InventoryPanel";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createItemManual, type ManualItemPayload } from "@/lib/inventory/mock";

const emptyForm: ManualItemPayload = {
  maker: "",
  model: "",
  storageHub: "",
  storageLocation: "",
  stockedAt: "",
  partner: "",
};

export default function InventoryImportManualPage() {
  const router = useRouter();
  const [form, setForm] = useState<ManualItemPayload>(emptyForm);

  const handleSubmit = () => {
    if (!form.maker || !form.model || !form.storageHub || !form.storageLocation) return;
    createItemManual(form);
    router.push("/inventory/items?type=stock");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <InventoryToolbar
        title="手入力で登録（確定）"
        description="PCから手入力で在庫物件を確定登録します。"
        actions={
          <Button
            onClick={handleSubmit}
            className="h-8 rounded-none px-4 text-xs"
            disabled={!form.maker || !form.model || !form.storageHub || !form.storageLocation}
          >
            登録
          </Button>
        }
      />

      <div className="mt-4">
        <InventoryPanel title="在庫登録フォーム" description="ラベル左・入力右の業務フォームです。">
          <InventoryFormRow label="メーカー">
            <Input
              value={form.maker}
              onChange={(event) => setForm({ ...form, maker: event.target.value })}
              className="h-8 rounded-none"
              placeholder="メーカー名"
            />
          </InventoryFormRow>
          <InventoryFormRow label="機種名">
            <Input
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
              className="h-8 rounded-none"
              placeholder="機種名"
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
          <InventoryFormRow label="取込日（任意）">
            <Input
              value={form.stockedAt}
              onChange={(event) => setForm({ ...form, stockedAt: event.target.value })}
              className="h-8 rounded-none"
              placeholder="2024-08-01"
            />
          </InventoryFormRow>
          <InventoryFormRow label="取引元（任意）">
            <Input
              value={form.partner}
              onChange={(event) => setForm({ ...form, partner: event.target.value })}
              className="h-8 rounded-none"
              placeholder="仕入先・取引元"
            />
          </InventoryFormRow>
        </InventoryPanel>
      </div>
    </div>
  );
}
