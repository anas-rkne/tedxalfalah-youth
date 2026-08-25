"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Eye,
  FileText,
  Loader2,
  SearchX,
  Square,
  Trash2,
} from "lucide-react";
import { useRTL } from "@/hooks/useRTL";
import {
  ApplicationRecord,
  StatusValue,
  formatTimestamp,
} from "./types";

type SortKey = "fullName" | "email" | "age" | "schoolName" | "timestamp";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50];

const statusSelectClasses: Record<StatusValue, string> = {
  pending: "border-amber-300 text-amber-700",
  accepted: "border-emerald-300 text-emerald-700",
  rejected: "border-red-300 text-red-700",
};

const trackBadgeClasses: Record<string, string> = {
  "young-speaker": "bg-blue-50 text-blue-700 border-blue-200",
  expert: "bg-purple-50 text-purple-700 border-purple-200",
};

function timestampMs(value: string): number {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: SortableHeaderProps) {
  const isActive = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1.5 uppercase tracking-wide cursor-pointer hover:text-foreground transition-colors"
      aria-label={label}
    >
      {label}
      {isActive ? (
        dir === "asc" ? (
          <ArrowUp size={13} />
        ) : (
          <ArrowDown size={13} />
        )
      ) : (
        <ArrowUpDown size={13} className="opacity-40" />
      )}
    </button>
  );
}

export default function ApplicationsTable({
  applications,
  onView,
  onUpdate,
  sending,
}: {
  applications: ApplicationRecord[];
  onView: (app: ApplicationRecord) => void;
  onUpdate: (items: { rowNumber: number; status?: StatusValue; notes?: string }[]) => Promise<boolean>;
  sending: boolean;
}) {
  const t = useTranslations("admin");
  const { isRTL } = useRTL();

  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [updatingRow, setUpdatingRow] = useState<number | null>(null);

  const sorted = useMemo(() => {
    const direction = sortDir === "asc" ? 1 : -1;
    return [...applications].sort((a, b) => {
      if (sortKey === "age") return ((Number(a.age) || 0) - (Number(b.age) || 0)) * direction;
      if (sortKey === "timestamp") return (timestampMs(a.timestamp) - timestampMs(b.timestamp)) * direction;
      return (a[sortKey] || "").localeCompare(b[sortKey] || "", isRTL ? "ar" : "en") * direction;
    });
  }, [applications, sortKey, sortDir, isRTL]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "timestamp" ? "desc" : "asc");
    }
  };

  const allSelected = paged.length > 0 && paged.every((a) => selected.has(a._rowNumber));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((a) => a._rowNumber)));
    }
  };

  const toggleOne = (rowNumber: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const handleQuickStatus = useCallback(
    async (rowNumber: number, status: StatusValue) => {
      setUpdatingRow(rowNumber);
      await onUpdate([{ rowNumber, status }]);
      setUpdatingRow(null);
    },
    [onUpdate]
  );

  const handleBulkStatus = useCallback(
    async (status: StatusValue) => {
      const items = Array.from(selected).map((rowNumber) => ({ rowNumber, status }));
      setSelected(new Set());
      await onUpdate(items);
    },
    [selected, onUpdate]
  );

  if (!applications.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-zinc-300 bg-white py-20 text-muted-foreground">
        <SearchX size={30} />
        <p className="text-sm">{t("dashboard.noResults")}</p>
      </div>
    );
  }

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-tedx-red/20 bg-tedx-red/5 px-5 py-3">
          <span className="text-sm font-medium text-foreground">
            {t("bulk.selected", { count: selected.size })}
          </span>
          <button
            type="button"
            disabled={sending}
            onClick={() => handleBulkStatus("accepted")}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white cursor-pointer transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {t("bulk.accept")}
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => handleBulkStatus("rejected")}
            className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white cursor-pointer transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {t("bulk.reject")}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-600 cursor-pointer transition-colors hover:bg-zinc-50"
          >
            <Trash2 size={12} /> {t("bulk.clear")}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-[24px] border border-border bg-card">
        <table className="w-full min-w-[1050px] text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 py-3.5 w-10">
                <button type="button" onClick={toggleAll} className="cursor-pointer" aria-label="select all">
                  {allSelected
                    ? <CheckSquare size={15} className="text-tedx-red" />
                    : <Square size={15} className="opacity-40" />
                  }
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 text-start">
                <SortableHeader label={t("table.name")} sortKey="fullName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th scope="col" className="px-4 py-3.5 text-start">
                <SortableHeader label={t("table.email")} sortKey="email" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th scope="col" className="px-4 py-3.5 text-start">
                <SortableHeader label={t("tableExtra.school")} sortKey="schoolName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th scope="col" className="px-4 py-3.5 text-start">
                {t("table.track")}
              </th>
              <th scope="col" className="px-4 py-3.5 text-start">
                <SortableHeader label={t("table.age")} sortKey="age" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th scope="col" className="px-4 py-3.5 text-start">
                {t("table.status")}
              </th>
              <th scope="col" className="px-4 py-3.5 text-start">
                <SortableHeader label={t("table.date")} sortKey="timestamp" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th scope="col" className="px-4 py-3.5 text-end">
                {t("table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((app) => (
              <tr
                key={app._rowNumber}
                className={`border-b border-border/60 transition-colors last:border-0 hover:bg-zinc-50/60 ${
                  selected.has(app._rowNumber) ? "bg-tedx-red/[0.03]" : ""
                }`}
              >
                <td className="px-4 py-3.5 w-10">
                  <button type="button" onClick={() => toggleOne(app._rowNumber)} className="cursor-pointer" aria-label="select row">
                    {selected.has(app._rowNumber)
                      ? <CheckSquare size={15} className="text-tedx-red" />
                      : <Square size={15} className="opacity-40" />
                    }
                  </button>
                </td>
                <td className="max-w-[160px] truncate px-4 py-3.5 font-medium text-zinc-900">
                  {app.fullName || "—"}
                </td>
                <td className="max-w-[180px] truncate px-4 py-3.5 text-zinc-600">
                  {app.email || "—"}
                </td>
                <td className="max-w-[160px] truncate px-4 py-3.5 text-zinc-600">
                  {app.schoolName || "—"}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      trackBadgeClasses[app.track] ?? "bg-zinc-50 text-zinc-600 border-zinc-200"
                    }`}
                  >
                    {app.track === "expert"
                      ? t("tracks.expert")
                      : app.track === "young-speaker"
                        ? t("tracks.young-speaker")
                        : app.track || "—"}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center text-zinc-600">
                  {app.age || "—"}
                </td>
                <td className="px-4 py-3.5">
                  <div className="relative">
                    {updatingRow === app._rowNumber ? (
                      <Loader2 size={14} className="animate-spin text-tedx-red" />
                    ) : (
                      <select
                        value={app.status}
                        onChange={(e) => handleQuickStatus(app._rowNumber, e.target.value as StatusValue)}
                        aria-label={`${t("table.status")} — ${app.fullName}`}
                        className={`appearance-none cursor-pointer rounded-full border bg-white px-2.5 py-0.5 pr-5 text-xs font-medium outline-none transition-colors ${statusSelectClasses[app.status]}`}
                        style={{
                          backgroundImage:
                            'url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E")',
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: isRTL ? "left 4px center" : "right 4px center",
                          backgroundSize: "12px",
                        }}
                      >
                        {(["pending", "accepted", "rejected"] as StatusValue[]).map((s) => (
                          <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-zinc-600">
                  {formatTimestamp(app.timestamp, isRTL ? "ar" : "en")}
                </td>
                <td className="px-4 py-3.5 text-end">
                  <button
                    type="button"
                    onClick={() => onView(app)}
                    aria-label={`${t("table.viewDetails")} — ${app.fullName}`}
                    title={t("table.viewDetails")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors cursor-pointer hover:border-tedx-red/50 hover:text-tedx-red"
                  >
                    {app.notes ? <FileText size={14} /> : <Eye size={15} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <label htmlFor="admin-page-size">{t("table.pageSize")}</label>
          <select
            id="admin-page-size"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none cursor-pointer focus:border-red-500"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage <= 1}
            aria-label={t("table.prev")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white transition-colors cursor-pointer hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <PrevIcon size={16} />
          </button>
          <span>
            {t("table.pageInfo", { current: safePage, total: totalPages })}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
            aria-label={t("table.next")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white transition-colors cursor-pointer hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40"
          >
            <NextIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
