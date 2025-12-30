"use client";

import { useParams, useRouter } from "next/navigation";

import SerialInputPanel from "@/app/inventory/purchase-invoice/_components/SerialInputPanel";
import {
  clearSerialDraft,
  nextInventoryId,
  saveSerialDraft,
  saveSerialInput,
  type SerialInputPayload,
} from "@/lib/serialInputStorage";

export default function SerialInputPage() {
  const params = useParams<{ inventoryId: string }>();
  const router = useRouter();
  const inventoryId = params?.inventoryId ?? "";

  const handleRegister = (payload: SerialInputPayload) => {
    saveSerialInput(payload);
    clearSerialDraft(payload.inventoryId);
    router.push("/inventory/purchase-invoice/create");
  };

  const handlePrev = (payload: SerialInputPayload) => {
    saveSerialDraft(payload);
    router.push("/inventory/purchase-invoice/create");
  };

  const handleBack = () => {
    router.push("/inventory/purchase-invoice/create");
  };

  const handleNext = (payload: SerialInputPayload) => {
    saveSerialDraft(payload);
    const nextId = nextInventoryId(payload.inventoryId);
    if (!nextId) {
      alert("次の在庫が見つかりませんでした");
      return;
    }
    router.push(`/inventory/purchase-invoice/serial-input/${nextId}`);
  };

  return (
    <SerialInputPanel
      inventoryId={inventoryId}
      onRegister={handleRegister}
      onPrev={handlePrev}
      onBack={handleBack}
      onNext={handleNext}
    />
  );
}
