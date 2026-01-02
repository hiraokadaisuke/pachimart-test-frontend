"use client";

import { useState } from "react";

import { BuyerContact } from "@/lib/dealings/types";

type ContactSelectorProps = {
  contacts: BuyerContact[];
  value?: string;
  onChange: (value: string) => void;
  onAdd: (name: string) => void;
  disabled?: boolean;
};

export function ContactSelector({ contacts, value, onChange, onAdd, disabled }: ContactSelectorProps) {
  const [newContactName, setNewContactName] = useState("");

  const handleAdd = () => {
    const trimmed = newContactName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewContactName("");
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="statement-input w-full appearance-none bg-white pr-8 text-[12px] text-neutral-900"
        >
          <option value="">担当者を選択</option>
          {contacts.map((contact) => (
            <option key={contact.contactId} value={contact.name}>
              {contact.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500">
          ▼
        </span>
      </div>

      <div className="flex items-center gap-2 text-[12px]">
        <input
          type="text"
          value={newContactName}
          onChange={(e) => setNewContactName(e.target.value)}
          placeholder="担当者を追加"
          disabled={disabled}
          className="statement-input flex-1 bg-white"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !newContactName.trim()}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-neutral-400"
        >
          +追加
        </button>
      </div>
    </div>
  );
}
