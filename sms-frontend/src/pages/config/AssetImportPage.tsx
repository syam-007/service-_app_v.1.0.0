// src/pages/Config/AssetImportPage.tsx
import { useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
  FileUp,
  Loader2,
} from "lucide-react";
import { useImportAssets, useAssetsList } from "../../api/assets";

type ImportError = { row: number; asset_code?: string | null; error: string };

type ImportResult = {
  total_rows: number;
  created: number;
  updated: number;
  errors?: ImportError[];
  preview?: any[];
};

type AssetRow = {
  id?: number | string;
  asset_code: string;
  cost_center?: string | null;
  department?: string | null;
  asset_group?: string | null;
  status?: string | null;
  asset_main_category?: string | null;
  asset_sub_category?: string | null;
  asset_description?: string | null;
  serial_no?: string | null;
};

function norm(v: unknown) {
  return String(v ?? "").toLowerCase().trim();
}

function isAllowed(file: File) {
  const name = (file.name || "").toLowerCase();
  return name.endsWith(".csv") || name.endsWith(".xlsx");
}

function humanBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/* ---------------- Skeletons (Shimmer) ----------------
   ✅ Requires global CSS once (put in src/index.css):
   @keyframes shimmer{0%{transform:translateX(-60%)}100%{transform:translateX(60%)}}
   .skeleton{position:relative;overflow:hidden;border-radius:.75rem;background:rgba(148,163,184,.18)}
   .dark .skeleton{background:rgba(148,163,184,.10)}
   .skeleton::after{content:"";position:absolute;inset:0;transform:translateX(-60%);
     background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);
     animation:shimmer 1.2s ease-in-out infinite}
   .dark .skeleton::after{background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)}
------------------------------------------------------ */

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 p-4 shadow-sm">
      <div className="skeleton h-3 w-28" />
      <div className="mt-3 skeleton h-8 w-16" />
    </div>
  );
}

function AssetsTableSkeleton({ rowsCount = 15 }: { rowsCount?: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="max-h-[70vh] overflow-y-auto">
        <table className="min-w-[900px] w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Asset Code</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Cost Center</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Main Category</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Sub Category</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Discription</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Serial No.</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {Array.from({ length: rowsCount }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-32" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-24" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-40" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-36" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-[22rem]" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-4 w-28" />
                </td>
                <td className="px-4 py-2">
                  <div className="skeleton h-6 w-24 rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AssetImportPage() {
  const importMutation = useImportAssets();
  const assetsQuery = useAssetsList();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const result = importMutation.data as ImportResult | undefined;
  const hasErrors = (result?.errors?.length ?? 0) > 0;

  const assets: AssetRow[] = (assetsQuery.data ?? []) as any;

  // ✅ KPIs (persisted, from assets list)
  const totalAssets = assets.length;

  const totalDepartments = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      const v = norm(a.department);
      if (v) set.add(v);
    });
    return set.size;
  }, [assets]);

  const totalAssetGroups = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      const v = norm(a.asset_group);
      if (v) set.add(v);
    });
    return set.size;
  }, [assets]);

  // Filtered rows for table
  const rows = useMemo(() => {
    let out = [...assets];
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((a) => {
        return (
          (a.asset_code || "").toLowerCase().includes(q) ||
          (a.cost_center || "").toLowerCase().includes(q) ||
          (a.department || "").toLowerCase().includes(q) ||
          (a.asset_group || "").toLowerCase().includes(q) ||
          (a.status || "").toLowerCase().includes(q)
        );
      });
    }
    return out;
  }, [assets, search]);

  const successText = useMemo(() => {
    if (!result) return "";
    const parts = [];
    if ((result.created ?? 0) > 0) parts.push(`${result.created} created`);
    if ((result.updated ?? 0) > 0) parts.push(`${result.updated} updated`);
    if (parts.length === 0) parts.push("No changes");
    return parts.join(" • ");
  }, [result]);

  const openModal = () => {
    setOpen(true);
    setDragOver(false);
  };

  const closeModal = () => {
    if (importMutation.isPending) return;
    setOpen(false);
    setDragOver(false);
  };

  const pickFile = () => fileInputRef.current?.click();

  const handleFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!isAllowed(f)) {
      alert("Only .csv or .xlsx files are supported");
      return;
    }
    setFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    handleFile(dropped);
  };

  const onUpload = () => {
    if (!file) return;
    importMutation.mutate(file, {
      onSuccess: async () => {
        await assetsQuery.refetch();
        setOpen(false);
      },
    });
  };

  const showInitialLoading = assetsQuery.isLoading && !assetsQuery.data;

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-80" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Asset Import
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
              <button
                type="button"
                onClick={openModal}
                className="
                  inline-flex items-center gap-2 rounded-full
                  bg-slate-900 px-3 py-2 text-xs font-medium text-white
                  hover:bg-slate-800
                  dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200
                  transition
                "
              >
                <UploadCloud className="h-4 w-4" />
                Import Assets
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between text-xs">
            <div className="w-full md:max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, cost center, department, group, status…"
                className="
                  w-full rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 pl-9 text-xs
                  text-slate-900 placeholder:text-slate-400
                  focus:outline-none focus:ring-1 focus:ring-slate-500
                  dark:bg-slate-950/60 dark:border-slate-700 dark:text-slate-100
                  dark:placeholder:text-slate-500
                  backdrop-blur
                "
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Clear search input"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>
                Showing{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">{rows.length}</span> /{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">{assets.length}</span>
              </span>
              {assetsQuery.isFetching && !showInitialLoading && <span>• Refreshing…</span>}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs (with skeleton) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {showInitialLoading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <Kpi title="Total Assets" value={totalAssets} />
            <Kpi title="Total Departments" value={totalDepartments} />
            <Kpi title="Total Asset Groups" value={totalAssetGroups} />
          </>
        )}
      </div>

      {/* Import result KPIs */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi title="Imported Rows" value={result.total_rows ?? 0} />
          <Kpi title="Created" value={result.created ?? 0} tone="ok" />
          <Kpi title="Updated" value={result.updated ?? 0} />
          <Kpi
            title="Errors"
            value={result.errors?.length ?? 0}
            tone={(result.errors?.length ?? 0) > 0 ? "warn" : "neutral"}
          />
        </div>
      )}

      {/* Success banner */}
      {importMutation.isSuccess && result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Import completed</span>
            <span className="opacity-80">• {successText}</span>
          </div>
        </div>
      )}

      {/* Error table */}
      {hasErrors && result && (
        <div className="rounded-2xl border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950/60 overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Import errors (showing up to 200)
          </div>

          <div className="overflow-x-auto">
            <div className="max-h-[40vh] overflow-y-auto">
              <table className="min-w-[700px] w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Row</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Asset Code</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {result.errors?.map((e, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.row}</td>
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">
                        {e.asset_code ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{e.error}</td>
                    </tr>
                  ))}

                  {(result.errors?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">
                        No errors.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assets table (with shimmer skeleton) */}
      <div className="rounded-2xl border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950/60 overflow-hidden">
        {showInitialLoading ? (
          <AssetsTableSkeleton rowsCount={10} />
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="min-w-[900px] w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Asset Code</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Cost Center</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Main Category</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Sub Category</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Discription</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Serial No.</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((a, idx) => (
                    <tr
                      key={a.id ?? a.asset_code ?? idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">{a.asset_code}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{a.cost_center ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{a.asset_main_category ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{a.asset_sub_category ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{a.asset_description ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{a.serial_no ?? "—"}</td>
                      <td className="px-4 py-2">
                        <StatusPill status={a.status} />
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                        {search ? "No assets match your search." : "No assets found. Click “Import Assets” to upload."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">
          Tip: swipe left/right to see all columns.
        </div>
      </div>

      {/* Import Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeModal} />

          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur shadow-2xl">
            {/* Header */}
            <div className="relative p-4 sm:p-5 border-b border-slate-200/70 dark:border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-70" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-white/70 grid place-items-center dark:border-slate-800 dark:bg-slate-900/60">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Import Assets</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Drag & drop a .csv/.xlsx, or browse to upload.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={importMutation.isPending}
                  className="
                    inline-flex items-center justify-center rounded-full p-2
                    bg-white/70 text-slate-600 hover:bg-white hover:text-slate-800
                    dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900
                    transition
                  "
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {/* Dropzone */}
              <div
                className={[
                  "rounded-2xl border-2 border-dashed p-6 transition",
                  dragOver
                    ? "border-slate-400 bg-slate-50 dark:bg-slate-800/40"
                    : "border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/40",
                ].join(" ")}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(false);
                }}
                onDrop={onDrop}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-700 grid place-items-center dark:bg-slate-900 dark:text-slate-100">
                    <FileUp className="h-6 w-6" />
                  </div>

                  <div className="text-sm font-medium text-slate-900 dark:text-slate-50">Drop your file here</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Supported: .csv, .xlsx</div>

                  <button
                    type="button"
                    onClick={pickFile}
                    className="
                      mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium
                      bg-slate-900 text-white hover:bg-slate-800
                      dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200
                      transition
                    "
                  >
                    <UploadCloud className="h-4 w-4" />
                    Browse file
                  </button>
                </div>
              </div>

              {/* Selected file card */}
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Selected file</div>
                    <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                      {file ? file.name : "—"}
                    </div>
                    {file && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{humanBytes(file.size)}</div>
                    )}
                  </div>

                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      disabled={importMutation.isPending}
                      className="
                        inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium
                        border border-slate-200 bg-white/70 hover:bg-white
                        dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900
                        transition disabled:opacity-60
                      "
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {importMutation.isError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                  Failed to import. Check file format / headers.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={importMutation.isPending}
                className="
                  inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium
                  border border-slate-200 bg-white/70 hover:bg-white
                  dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900
                  transition disabled:opacity-60
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onUpload}
                disabled={!file || importMutation.isPending}
                className="
                  inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium
                  bg-slate-900 text-white hover:bg-slate-800
                  dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200
                  transition disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Kpi({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: number;
  tone?: "neutral" | "ok" | "warn";
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-50/70 text-emerald-900 border-emerald-200/70 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800/60"
      : tone === "warn"
      ? "bg-amber-50/70 text-amber-900 border-amber-200/70 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-800/60"
      : "bg-white/70 text-slate-900 border-slate-200/70 dark:bg-slate-950/60 dark:text-slate-50 dark:border-slate-800";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${cls}`}>
      <div className="text-[11px] opacity-70">{title}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: any }) {
  const label = String(status || "—").replaceAll("_", " ");
  const cls = getStatusPillClass(status);

  return (
    <span
      className={`
        inline-flex items-center gap-2 rounded-full border px-2.5 py-1
        text-[11px] font-medium capitalize whitespace-nowrap
        shadow-[0_1px_0_rgba(0,0,0,0.02)]
        ${cls}
      `}
    >
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-current/35 [animation:ping_1.4s_ease-in-out_infinite]" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current/85 ring-2 ring-current/15" />
      </span>
      <span className="tracking-wide">{label}</span>
    </span>
  );
}

function getStatusPillClass(status: any) {
  const s = String(status || "").toLowerCase();

  if (s === "active")
    return "bg-emerald-50/80 text-emerald-700 border-emerald-200/70 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-800/60";
  if (s === "approved")
    return "bg-sky-50/80 text-sky-700 border-sky-200/70 dark:bg-sky-900/25 dark:text-sky-200 dark:border-sky-800/60";
  if (s === "pending" || s === "submitted")
    return "bg-amber-50/80 text-amber-700 border-amber-200/70 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-800/60";
  if (s === "rejected")
    return "bg-rose-50/80 text-rose-700 border-rose-200/70 dark:bg-rose-900/25 dark:text-rose-200 dark:border-rose-800/60";
  if (s === "cancelled" || s === "canceled")
    return "bg-slate-100/80 text-slate-700 border-slate-200/70 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700";

  return "bg-slate-50/80 text-slate-700 border-slate-200/70 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700";
}
