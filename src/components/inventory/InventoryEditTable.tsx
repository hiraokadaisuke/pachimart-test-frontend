import type { InventoryRecord } from "@/lib/demo-data/demoInventory";
import type { ListingStatusOption } from "@/lib/demo-data/demoInventory";
import { buildEditForm, STATUS_OPTIONS } from "@/lib/inventory/editUtils";

type InventoryEditTableProps = {
  groups: Array<[string, InventoryRecord[]]>;
  bulkEditForms: Record<string, Partial<InventoryRecord>>;
  onChange: <K extends keyof InventoryRecord>(id: string, key: K, value: InventoryRecord[K]) => void;
};

const InventoryEditTable = ({ groups, bulkEditForms, onChange }: InventoryEditTableProps) => (
  <>
    {groups.map(([supplier, items]) => (
      <div key={supplier} className="border-2 border-gray-300">
        <div className="bg-[#e8f5e9] px-2 py-1 text-xs font-semibold">仕入先: {supplier}</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-slate-600 text-left text-white font-bold">
              <tr>
                <th className="border border-gray-300 px-2 py-1">在庫ID</th>
                <th className="border border-gray-300 px-2 py-1">種別</th>
                <th className="border border-gray-300 px-2 py-1">メーカー</th>
                <th className="border border-gray-300 px-2 py-1">機種名</th>
                <th className="border border-gray-300 px-2 py-1">仕入数</th>
                <th className="border border-gray-300 px-2 py-1">仕入単価</th>
                <th className="border border-gray-300 px-2 py-1">販売単価</th>
                <th className="border border-gray-300 px-2 py-1">入庫日</th>
                <th className="border border-gray-300 px-2 py-1">撤去日</th>
                <th className="border border-gray-300 px-2 py-1">保管先</th>
                <th className="border border-gray-300 px-2 py-1">担当者</th>
                <th className="border border-gray-300 px-2 py-1">状況</th>
                <th className="border border-gray-300 px-2 py-1">表示</th>
                <th className="border border-gray-300 px-2 py-1">備考</th>
              </tr>
            </thead>
            <tbody>
              {items.map((record) => {
                const form = bulkEditForms[record.id] ?? buildEditForm(record);
                return (
                  <tr key={record.id} className="odd:bg-white even:bg-[#f8fafc]">
                    <td className="border border-gray-300 px-2 py-1">{record.id}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      <select
                        value={form.kind ?? ""}
                        onChange={(event) =>
                          onChange(record.id, "kind", event.target.value as InventoryRecord["kind"])
                        }
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      >
                        <option value="">-</option>
                        <option value="P">P</option>
                        <option value="S">S</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        value={form.maker ?? ""}
                        onChange={(event) => onChange(record.id, "maker", event.target.value)}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        value={form.model ?? ""}
                        onChange={(event) => onChange(record.id, "model", event.target.value)}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        value={form.quantity ?? 0}
                        onChange={(event) => onChange(record.id, "quantity", Number(event.target.value))}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5 text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        value={form.unitPrice ?? 0}
                        onChange={(event) => onChange(record.id, "unitPrice", Number(event.target.value))}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5 text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        value={form.saleUnitPrice ?? 0}
                        onChange={(event) => onChange(record.id, "saleUnitPrice", Number(event.target.value))}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5 text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="date"
                        value={form.stockInDate ?? ""}
                        onChange={(event) => onChange(record.id, "stockInDate", event.target.value)}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="date"
                        value={form.removeDate ?? ""}
                        onChange={(event) => onChange(record.id, "removeDate", event.target.value)}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        value={form.warehouse ?? ""}
                        onChange={(event) => onChange(record.id, "warehouse", event.target.value)}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        value={form.staff ?? ""}
                        onChange={(event) => onChange(record.id, "staff", event.target.value)}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <select
                        value={(form.listingStatus as ListingStatusOption) ?? "not_listing"}
                        onChange={(event) =>
                          onChange(record.id, "listingStatus", event.target.value as ListingStatusOption)
                        }
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <select
                        value={form.isVisible === false ? "0" : "1"}
                        onChange={(event) => onChange(record.id, "isVisible", event.target.value === "1")}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      >
                        <option value="1">する</option>
                        <option value="0">しない</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        value={form.note ?? ""}
                        onChange={(event) => onChange(record.id, "note", event.target.value)}
                        className="w-full border border-[#c98200] bg-[#fff4d6] px-1 py-0.5"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ))}
  </>
);

export default InventoryEditTable;
