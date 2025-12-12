import React from "react";

export type DocumentStatus = {
  inspection: boolean;
  removal: boolean;
  confirmation: boolean;
  other: boolean;
};

type Props = {
  status: DocumentStatus;
  onUploadClick?: () => void;
};

const badgeStyle = {
  uploaded: "bg-[#142B5E] text-white border border-[#142B5E]",
  empty: "bg-white text-[#142B5E] border border-[#142B5E]",
};

const badges: Array<{ key: keyof DocumentStatus; label: string }> = [
  { key: "inspection", label: "検" },
  { key: "removal", label: "撤" },
  { key: "confirmation", label: "確" },
  { key: "other", label: "他" },
];

export function DocumentBadges({ status, onUploadClick }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="rounded-md border border-[#142B5E] px-3 py-1 text-[11px] font-semibold text-[#142B5E] transition hover:bg-[#142B5E] hover:text-white"
        onClick={(e) => {
          e.stopPropagation();
          onUploadClick?.();
        }}
      >
        アップ
      </button>
      <div className="flex items-center gap-1.5">
        {badges.map((badge) => {
          const isUploaded = status[badge.key];
          return (
            <span
              key={badge.key}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${isUploaded ? badgeStyle.uploaded : badgeStyle.empty}`}
            >
              {badge.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
