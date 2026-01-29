"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  confirmImport,
  listImportedReads,
  type ConfirmImportPayload,
  type InventoryImportRead,
} from "@/lib/inventory/mock";

const presets = [
  { id: "preset-a", name: "プリセットA", description: "東東京倉庫 / A系ラベル" },
  { id: "preset-b", name: "プリセットB", description: "西東京倉庫 / B系ラベル" },
  { id: "preset-c", name: "プリセットC", description: "埼玉倉庫 / C系ラベル" },
];

const emptyForm: ConfirmImportPayload = {
  maker: "",
  model: "",
  manufacturedAt: "",
  certificationNumber: "",
  certificationDate: "",
  storageHub: "",
  storageLocation: "",
};

export default function InventoryImportPage() {
  const [reads, setReads] = useState<InventoryImportRead[]>(listImportedReads());
  const [selectedId, setSelectedId] = useState<string | null>(reads[0]?.id ?? null);
  const [form, setForm] = useState<ConfirmImportPayload>(emptyForm);
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null);

  const selectedRead = useMemo(
    () => reads.find((read) => read.id === selectedId) ?? null,
    [reads, selectedId],
  );

  useEffect(() => {
    if (!selectedId || !reads.some((read) => read.id === selectedId)) {
      setSelectedId(reads[0]?.id ?? null);
    }
  }, [reads, selectedId]);

  useEffect(() => {
    if (!selectedRead) {
      setForm(emptyForm);
      return;
    }

    setForm({
      maker: selectedRead.maker ?? "",
      model: selectedRead.model ?? "",
      manufacturedAt: "",
      certificationNumber: "",
      certificationDate: "",
      storageHub: selectedRead.storageHub ?? "",
      storageLocation: selectedRead.storageLocation ?? "",
    });
  }, [selectedRead]);

  const handleConfirm = () => {
    if (!selectedRead) return;
    const item = confirmImport(selectedRead.id, form);
    setReads(listImportedReads());
    setLastConfirmed(item?.id ?? null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">取込データ設定</h1>
          <p className="mt-2 text-sm text-slate-600">
            読取済みデータを補完し、登録確定したものは在庫一覧に反映されます。
          </p>
        </div>
        <Link href="/inventory/items?type=stock">
          <Button variant="outline">在庫一覧へ</Button>
        </Link>
      </div>

      {lastConfirmed ? (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {lastConfirmed} を在庫として登録しました。
              </p>
              <p className="text-xs text-slate-600">
                続けて別の仮登録データを選択できます。
              </p>
            </div>
            <Link href="/inventory/items?type=stock">
              <Button>在庫一覧を確認</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>プリセット一覧</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {presets.map((preset) => (
              <div key={preset.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{preset.name}</p>
                <p className="mt-1 text-xs text-slate-600">{preset.description}</p>
                <p className="mt-2 text-xs text-slate-400">最終同期: 今日</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>読取済みデータ（仮登録）</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>読取日時</TableHead>
                  <TableHead>取引元</TableHead>
                  <TableHead>メーカー</TableHead>
                  <TableHead>機種</TableHead>
                  <TableHead>保管拠点</TableHead>
                  <TableHead>保管場所</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                      仮登録データはありません。
                    </TableCell>
                  </TableRow>
                ) : null}
                {reads.map((read) => {
                  const isActive = read.id === selectedId;
                  return (
                    <TableRow
                      key={read.id}
                      className={isActive ? "bg-blue-50" : ""}
                      onClick={() => setSelectedId(read.id)}
                    >
                      <TableCell>{read.readAt}</TableCell>
                      <TableCell>{read.source}</TableCell>
                      <TableCell>{read.maker ?? "-"}</TableCell>
                      <TableCell>{read.model ?? "-"}</TableCell>
                      <TableCell>{read.storageHub ?? "-"}</TableCell>
                      <TableCell>{read.storageLocation ?? "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-sm font-semibold text-slate-900">補完フォーム</h3>
              <p className="mt-1 text-xs text-slate-500">
                選択した仮登録データに必要情報を追加入力してください。
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">メーカー</label>
                  <Input
                    value={form.maker}
                    onChange={(event) => setForm({ ...form, maker: event.target.value })}
                    placeholder="メーカー名"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">機種</label>
                  <Input
                    value={form.model}
                    onChange={(event) => setForm({ ...form, model: event.target.value })}
                    placeholder="機種名"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">製造年月（任意）</label>
                  <Input
                    value={form.manufacturedAt}
                    onChange={(event) =>
                      setForm({ ...form, manufacturedAt: event.target.value })
                    }
                    placeholder="2022-03"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">検定番号（任意）</label>
                  <Input
                    value={form.certificationNumber}
                    onChange={(event) =>
                      setForm({ ...form, certificationNumber: event.target.value })
                    }
                    placeholder="P12345"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">検定日（任意）</label>
                  <Input
                    value={form.certificationDate}
                    onChange={(event) =>
                      setForm({ ...form, certificationDate: event.target.value })
                    }
                    placeholder="2024-04-01"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">保管拠点（倉庫）</label>
                  <Input
                    value={form.storageHub}
                    onChange={(event) =>
                      setForm({ ...form, storageHub: event.target.value })
                    }
                    placeholder="東東京倉庫"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">保管場所（棚）</label>
                  <Input
                    value={form.storageLocation}
                    onChange={(event) =>
                      setForm({ ...form, storageLocation: event.target.value })
                    }
                    placeholder="A-01"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setForm(emptyForm)}>
                  クリア
                </Button>
                <Button onClick={handleConfirm} disabled={!selectedRead || !form.maker || !form.model}>
                  登録確定
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
