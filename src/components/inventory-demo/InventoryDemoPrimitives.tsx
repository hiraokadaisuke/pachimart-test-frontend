import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InventoryPlannedBadge({ label = "今後追加予定" }: { label?: string }) {
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{label}</span>;
}

export function InventorySectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-lg">{title}</CardTitle>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function InventorySummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

export function InventoryFlowSteps({ steps }: { steps: Array<{ title: string; description: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-lg border bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">STEP {index + 1}</p>
          <p className="mt-1 font-semibold">{step.title}</p>
          <p className="mt-2 text-sm text-slate-600">{step.description}</p>
          {index < steps.length - 1 ? <p className="mt-2 text-slate-400">↓</p> : null}
        </div>
      ))}
    </div>
  );
}

export function InventoryTimeline({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className="flex gap-3">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
          <p className={cn("text-sm", idx === 0 ? "font-semibold text-slate-900" : "text-slate-700")}>{item}</p>
        </li>
      ))}
    </ol>
  );
}
