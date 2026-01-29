import { Suspense } from "react";

import ProfitManagementClient from "@/app/(app)/sales/profit/ProfitManagementClient";

export default function ProfitManagementPage() {
  return (
    <Suspense fallback={<div className="h-12 border border-gray-300 bg-white" />}>
      <ProfitManagementClient />
    </Suspense>
  );
}
