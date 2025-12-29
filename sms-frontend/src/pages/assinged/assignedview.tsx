// ✅ UPDATED: src/pages/assinged/assignedview.tsx
// Changes:
// 1) No longer shows "Assets" card with all assets.
// 2) Shows cost centers as clickable pills. When you click a cost center, it loads assets for that cost center only.
// 3) Layout grouped as requested:
//    - Employees + Cost centers together
//    - Required times + Note together

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  RefreshCw,
  BadgeCheck,
  Users,
  Boxes,
  Package,
  CalendarClock,
  FileText,
  AlertTriangle,
  Search,
} from "lucide-react";
import api from "../../api/axios";

type AssignedServiceStatus = "pending" | "assigned" | "completed" | "cancelled";

type AssignedServiceDetail = {
  id: number;
  schedule?: number;
  schedule_number?: string;

  employee_ids?: number[];
  employee_names?: string[];

  status: AssignedServiceStatus;
  cost_centers?: string[];

  note?: string | null;

  equipment_required_at?: string | null;
  crew_required_at?: string | null;

  assigned_at?: string;
  created_at?: string;
};

type Asset = {
  id: number;
  asset_code: string;
  status: string;
  cost_center?: string | null;
};

export function AssignedServiceViewPage() {
  const { id } = useParams();
  const assignedId = Number(id);
  const navigate = useNavigate();

  const [data, setData] = useState<AssignedServiceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ cost center -> assets
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [assetSearch, setAssetSearch] = useState("");

  const load = async () => {
    if (!assignedId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/assigned-services/${assignedId}/`);
      const d: AssignedServiceDetail | null = res.data ?? null;
      setData(d);

      // ✅ default pick first cost center and auto-load assets
      const firstCC = d?.cost_centers?.[0] ?? "";
      setSelectedCostCenter(firstCC);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load assigned service");
      setData(null);
      setSelectedCostCenter("");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedId]);

  const employeesText = useMemo(() => {
    if (!data) return "—";
    if (data.employee_names?.length) return data.employee_names.join(", ");
    if (data.employee_ids?.length) return data.employee_ids.join(", ");
    return "—";
  }, [data]);

  // ✅ load assets whenever selected cost center changes
  useEffect(() => {
    const fetchAssets = async () => {
      setAssetsError(null);

      if (!selectedCostCenter) {
        setAssets([]);
        return;
      }

      setAssetsLoading(true);
      try {
        // uses your existing endpoint
        const res = await api.get("/assets/by-cost-centers/", {
          params: { cost_centers: selectedCostCenter },
        });
        const list: Asset[] = res.data ?? [];
        setAssets(Array.isArray(list) ? list : []);
      } catch (err: any) {
        setAssets([]);
        setAssetsError(
          err?.response?.data?.detail || "Failed to load assets for this cost center."
        );
      } finally {
        setAssetsLoading(false);
      }
    };

    fetchAssets();
  }, [selectedCostCenter]);

  const filteredAssets = useMemo(() => {
    const q = assetSearch.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => {
      const code = (a.asset_code ?? "").toLowerCase();
      const st = (a.status ?? "").toLowerCase();
      const cc = (a.cost_center ?? "").toLowerCase();
      return code.includes(q) || st.includes(q) || cc.includes(q);
    });
  }, [assets, assetSearch]);

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-80" />
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <IconButton title="Back" onClick={() => navigate("/assigned-services")}>
                <ArrowLeft className="h-4 w-4" />
              </IconButton>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Assigned Service #{assignedId}
                  </h1>
                  {data?.status ? (
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${statusPill(
                        data.status
                      )}`}
                    >
                      {String(data.status).replaceAll("_", " ")}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  View details of this assigned service.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GhostButton onClick={load} title="Refresh" disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </GhostButton>

              <PrimaryButton
                onClick={() => navigate(`/assigned-services/${assignedId}/edit`)}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div className="whitespace-pre-wrap">{error}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-4 text-sm">Loading…</div>
      ) : !data ? (
        <div className="p-4 text-sm text-slate-600 dark:text-slate-300">No data.</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {/* ✅ Schedule (keep separate) */}
          <ModernCard
            title="Schedule"
            subtitle="Linked schedule info"
            icon={<BadgeCheck className="h-4 w-4" />}
          >
            <InfoRow label="Schedule ID" value={data.schedule ?? "—"} />
            <InfoRow label="Schedule #" value={data.schedule_number ?? "—"} />
            <InfoRow
              label="Assigned at"
              value={data.assigned_at ? new Date(data.assigned_at).toLocaleString() : "—"}
            />
            <InfoRow
              label="Created at"
              value={data.created_at ? new Date(data.created_at).toLocaleString() : "—"}
            />
          </ModernCard>

          {/* ✅ Employees + Cost centers together */}
          <ModernCard
            title="Employees & Cost centers"
            subtitle="Click a cost center to view its assets"
            icon={<Users className="h-4 w-4" />}
          >
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-slate-400" />
                <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {employeesText}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Boxes className="h-4 w-4 mt-0.5 text-slate-400" />
                <div className="flex flex-wrap gap-2">
                  {(data.cost_centers ?? []).length ? (
                    (data.cost_centers ?? []).map((cc) => {
                      const active = cc === selectedCostCenter;
                      return (
                        <button
                          key={cc}
                          type="button"
                          onClick={() => setSelectedCostCenter(cc)}
                          className={`
                            inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium border
                            ${
                              active
                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-900"
                            }
                            transition
                          `}
                          title={`Show assets in ${cc}`}
                        >
                          {cc}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">—</span>
                  )}
                </div>
              </div>
            </div>
          </ModernCard>

          {/* ✅ Required times + Note together */}
          <ModernCard
            title="Required times & Note"
            subtitle="Crew / equipment requirement and notes"
            icon={<CalendarClock className="h-4 w-4" />}
          >
            <InfoRow
              label="Crew required"
              value={
                data.crew_required_at ? new Date(data.crew_required_at).toLocaleString() : "—"
              }
            />
            <InfoRow
              label="Equipment required"
              value={
                data.equipment_required_at
                  ? new Date(data.equipment_required_at).toLocaleString()
                  : "—"
              }
            />

            <div className="pt-2 flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 text-slate-400" />
              <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {data.note || "—"}
              </div>
            </div>
          </ModernCard>

          {/* ✅ Assets section (interactive by selected cost center) */}
          <div className="lg:col-span-3">
            <ModernCard
              title="Assets"
              subtitle={
                selectedCostCenter
                  ? `Assets in cost center: ${selectedCostCenter}`
                  : "Select a cost center to view assets"
              }
              icon={<Package className="h-4 w-4" />}
            >
              {!selectedCostCenter ? (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  No cost center selected.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[260px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        placeholder="Search asset code / status..."
                        className={`${inputClassName} pl-10`}
                      />
                    </div>

                    <GhostButton
                      type="button"
                      onClick={() => setAssetSearch("")}
                      title="Clear asset search"
                    >
                      Clear
                    </GhostButton>
                  </div>

                  {assetsLoading && (
                    <div className="pt-3 text-xs text-slate-600 dark:text-slate-300">
                      Loading assets…
                    </div>
                  )}

                  {assetsError && (
                    <div className="pt-3">
                      <InlineError>{assetsError}</InlineError>
                    </div>
                  )}

                  {!assetsLoading && !assetsError && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
                      <div className="max-h-[360px] overflow-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-slate-500">
                                Asset Code
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-slate-500">
                                Cost Center
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-slate-500">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredAssets.map((a) => (
                              <tr
                                key={a.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              >
                                <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">
                                  {a.asset_code}
                                </td>
                                <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                                  {a.cost_center ?? "—"}
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${assetStatusPill(
                                      a.status
                                    )}`}
                                  >
                                    {String(a.status || "—").replaceAll("_", " ")}
                                  </span>
                                </td>
                              </tr>
                            ))}

                            {filteredAssets.length === 0 && (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                                >
                                  {assets.length === 0
                                    ? "No assets found for this cost center."
                                    : "No assets match your search."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </ModernCard>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI helpers ---------- */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-50 text-right">
        {value}
      </span>
    </div>
  );
}

function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800
        dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200
      "
    >
      {children}
    </div>
  );
}

const inputClassName = `
  w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs
  text-slate-900 placeholder:text-slate-400
  focus:outline-none focus:ring-1 focus:ring-slate-500
  dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100
  dark:placeholder:text-slate-500
`;

function IconButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="
        inline-flex h-9 w-9 items-center justify-center rounded-full
        border border-slate-200/70 bg-white/80 text-slate-700
        hover:bg-white hover:shadow-sm
        dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200
        dark:hover:bg-slate-900
        transition
      "
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  title,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="
        inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium
        bg-slate-900 text-white shadow-sm hover:shadow
        hover:bg-slate-800 active:scale-[0.99]
        disabled:opacity-60 disabled:cursor-not-allowed
        dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200
        transition
      "
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  title,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="
        inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium
        border border-slate-200/70 bg-white/70 text-slate-700
        hover:bg-white hover:shadow-sm active:scale-[0.99]
        disabled:opacity-60 disabled:cursor-not-allowed
        dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200
        dark:hover:bg-slate-900
        transition
      "
    >
      {children}
    </button>
  );
}

function ModernCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        rounded-3xl border border-slate-200/70 bg-white/70 p-4
        dark:border-slate-800 dark:bg-slate-950/50
        backdrop-blur shadow-sm hover:shadow-md transition
      "
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center h-8 w-8 rounded-2xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs space-y-3">{children}</div>
    </section>
  );
}

function statusPill(status: AssignedServiceStatus) {
  const s = String(status || "").toLowerCase();
  if (s === "assigned")
    return "border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-800/60 dark:bg-blue-900/30 dark:text-blue-200";
  if (s === "completed")
    return "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200";
  if (s === "cancelled")
    return "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-200";
  return "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-200";
}

function assetStatusPill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s.includes("green"))
    return "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200";
  if (s.includes("red"))
    return "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-200";
  if (s.includes("amber") || s.includes("yellow"))
    return "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-200";
  return "border-slate-200 bg-slate-50/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200";
}
