"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
export function RequestTabContent() {
  const router = useRouter();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    router.replace(`/transactions/navi/new/edit`);
  }, [router]);

  return (
    <section className="p-4 text-sm text-slate-800">
      <p>新しい取引Naviの編集画面に移動しています…</p>
    </section>
  );
}
