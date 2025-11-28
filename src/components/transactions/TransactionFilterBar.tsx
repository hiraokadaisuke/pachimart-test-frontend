import React from "react";

type TransactionFilterBarProps = {
  statusFilter: "all" | "inProgress" | "completed";
  keyword: string;
  onStatusChange: (value: "all" | "inProgress" | "completed") => void;
  onKeywordChange: (value: string) => void;
};

export function TransactionFilterBar({
  statusFilter,
  keyword,
  onStatusChange,
  onKeywordChange,
}: TransactionFilterBarProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex gap-2">
        <select
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as TransactionFilterBarProps["statusFilter"])}
        >
          <option value="all">すべてのステータス</option>
          <option value="inProgress">進行中</option>
          <option value="completed">完了/キャンセル</option>
        </select>
      </div>

      <div>
        <input
          type="search"
          className="w-full rounded-md border border-slate-300 px-3 py-1 text-sm md:w-64"
          placeholder="物件名・相手先で検索"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
      </div>
    </div>
  );
}
