"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import MainContainer from "@/components/layout/MainContainer";
import { useDummyNavi } from "@/lib/useDummyNavi";

export default function TransactionNaviCompletedPage() {
  const params = useParams<{ transactionId?: string }>();
  const transactionId = Array.isArray(params?.transactionId)
    ? params?.transactionId[0]
    : params?.transactionId ?? "dummy-1";
  const { confirmBreadcrumbItems, propertyInfo } = useDummyNavi(transactionId);
  const completedBreadcrumbItems = [...confirmBreadcrumbItems, "成立"];

  return (
    <MainContainer variant="wide">
      <div className="flex flex-col gap-8 py-10">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-6">
          <nav className="text-xs text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              {completedBreadcrumbItems.map((item, index) => (
                <li key={item} className="flex items-center gap-2">
                  <span>{item}</span>
                  {index < completedBreadcrumbItems.length - 1 && (
                    <span className="text-slate-400">›</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
                ✓
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">取引が成立しました</h1>
                <p className="text-sm text-slate-600">取引ID: {transactionId}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              成立
            </span>
          </div>

          <p className="text-sm text-slate-700">
            {propertyInfo.modelName}（{propertyInfo.maker}）の取引が承認されました。引き続き発送や精算などの
            オペレーションを進めてください。
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">買手への送信が完了し、承認されました。</p>
          <p className="mt-2 text-sm text-slate-600">取引Navi上の条件を控え、必要な対応を進めましょう。</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/transactions/navi/${transactionId}`}
              className="rounded border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
            >
              取引内容を確認する
            </Link>
            <Link
              href="/mypage/exhibits"
              className="rounded bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
            >
              出品一覧に戻る
            </Link>
          </div>
        </section>
      </div>
    </MainContainer>
  );
}
