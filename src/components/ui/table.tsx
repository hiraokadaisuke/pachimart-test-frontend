import * as React from "react";

import { cn } from "@/lib/utils";

type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

type TableSectionProps = React.HTMLAttributes<HTMLTableSectionElement>;

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-sm text-slate-700", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: TableSectionProps) {
  return (
    <thead
      className={cn("border-b border-slate-200 bg-slate-50 text-xs font-semibold", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: TableSectionProps) {
  return <tbody className={cn("divide-y divide-slate-200", className)} {...props} />;
}

export function TableRow({ className, ...props }: TableRowProps) {
  return <tr className={cn("transition hover:bg-slate-50", className)} {...props} />;
}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn("px-4 py-3 text-left font-semibold text-slate-600", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TableCellProps) {
  return <td className={cn("px-4 py-3", className)} {...props} />;
}

export function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      className={cn("mt-4 text-left text-sm text-slate-500", className)}
      {...props}
    />
  );
}
