"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { ColumnSetting } from "@/lib/demo-data/demoInventory";

const SortableItem = ({
  column,
  onToggle,
}: {
  column: ColumnSetting;
  onToggle: (key: string, next: boolean) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 py-2 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700"
        >
          ↕
        </button>
        <div>
          <div className="text-sm font-semibold text-neutral-900">{column.label}</div>
          {column.isCustom && <div className="text-xs text-slate-500">カスタム</div>}
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-800">
        <input
          type="checkbox"
          checked={column.visible}
          onChange={(event) => onToggle(column.key, event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        表示
      </label>
    </div>
  );
};

export type ColumnSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  columns: ColumnSetting[];
  onSave: (columns: ColumnSetting[]) => void;
};

export function ColumnSettingsModal({ open, onClose, columns, onSave }: ColumnSettingsModalProps) {
  const [localColumns, setLocalColumns] = useState<ColumnSetting[]>(columns);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (open) {
      setLocalColumns(columns);
    }
  }, [columns, open]);

  const sortedColumns = useMemo(
    () => [...localColumns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [localColumns],
  );

  if (!open) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalColumns((prev) => {
      const ordered = [...prev].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const oldIndex = ordered.findIndex((col) => col.key === active.id);
      const newIndex = ordered.findIndex((col) => col.key === over.id);
      const moved = arrayMove(ordered, oldIndex, newIndex);
      return moved.map((col, index) => ({ ...col, order: index }));
    });
  };

  const handleToggle = (key: string, next: boolean) => {
    setLocalColumns((prev) => prev.map((col) => (col.key === key ? { ...col, visible: next } : col)));
  };

  const handleAddCustom = () => {
    const label = newLabel.trim();
    if (!label) return;
    const next: ColumnSetting = {
      key: `custom-${Date.now()}`,
      label,
      width: 140,
      minWidth: 100,
      visible: true,
      order: localColumns.length,
      isCustom: true,
    };
    setLocalColumns((prev) => [...prev, next]);
    setNewLabel("");
  };

  const handleSave = () => {
    onSave(localColumns.map((col, index) => ({ ...col, order: index })));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">表示項目設定</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>

        <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-3">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedColumns.map((col) => col.key)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {sortedColumns.map((column) => (
                  <SortableItem key={column.key} column={column} onToggle={handleToggle} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="項目名を入力して追加"
            className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
          >
            項目追加
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
          >
            更新
          </button>
        </div>
      </div>
    </div>
  );
}
