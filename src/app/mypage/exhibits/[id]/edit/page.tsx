"use client";

import { useEffect, useMemo, useState } from "react";

import { ExhibitSubTabs } from "@/components/exhibits/ExhibitSubTabs";
import { SellForm } from "@/components/exhibits/SellForm";
import MyPageLayout from "@/components/layout/MyPageLayout";
import { fetchWithDevHeader } from "@/lib/api/fetchWithDevHeader";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import type { Exhibit } from "@/lib/exhibits/types";

type ExhibitType = "PACHINKO" | "SLOT";

export default function EditExhibitPage({ params }: { params: { id: string } }) {
  const currentUser = useCurrentDevUser();
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchExhibit = async () => {
      setLoading(true);
      try {
        const response = await fetchWithDevHeader(
          `/api/listings/${params.id}`,
          { cache: "no-store" },
          currentUser.id
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch listing: ${response.status}`);
        }

        const data = (await response.json()) as Exhibit;
        if (!isActive) return;
        setExhibit(data);
        setError(null);
      } catch (fetchError) {
        console.error("Failed to load listing", fetchError);
        if (!isActive) return;
        setError("出品情報の取得に失敗しました。");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchExhibit();

    return () => {
      isActive = false;
    };
  }, [currentUser.id, params.id]);

  const exhibitType = useMemo(() => {
    if (!exhibit) return null;
    return exhibit.type === "PACHINKO" || exhibit.type === "SLOT" ? (exhibit.type as ExhibitType) : null;
  }, [exhibit]);

  return (
    <MyPageLayout subTabs={<ExhibitSubTabs activeTab="active" />} compact>
      {loading ? (
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-neutral-700">読み込み中...</div>
      ) : error || !exhibit || !exhibitType ? (
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-rose-600">
          {error ?? "出品情報が見つかりませんでした。"}
        </div>
      ) : (
        <SellForm exhibitType={exhibitType} mode="edit" initialExhibit={exhibit} />
      )}
    </MyPageLayout>
  );
}
