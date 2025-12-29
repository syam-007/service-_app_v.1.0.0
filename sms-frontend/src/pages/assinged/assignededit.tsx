// ✅ UPDATED + ALIGNED: src/pages/assinged/assignededit.tsx
// Changes:
// - Cleaner 3-column layout + consistent heights
// - Schedule + Status together in first column
// - Employees in second column
// - Cost Centers in third column
// - Required Times + Note moved to bottom of third column
// - Assets preview full width at bottom

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  X,
  Search,
  RefreshCw,
  BadgeCheck,
  Users,
  Boxes,
  CalendarClock,
  AlertTriangle,
  Package,
} from "lucide-react";
import api from "../../api/axios";

type AssignedServiceStatus = "pending" | "assigned" | "completed" | "cancelled";

type Employee = {
  id: number;
  emp_number?: string;
  name?: string;
};

type Asset = {
  id: number;
  asset_code: string;
  status: string;
  cost_center?: string | null;
};

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
};

export function AssignedServiceEditPage() {
  const { id } = useParams();
  const assignedId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<AssignedServiceDetail | null>(null);

  // employees (multi)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  // cost centers (multi)
  const [allCostCenters, setAllCostCenters] = useState<string[]>([]);
  const [costCenterSearch, setCostCenterSearch] = useState("");
  const [selectedCostCenters, setSelectedCostCenters] = useState<string[]>([]);

  // assets preview
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [assetSearch, setAssetSearch] = useState("");

  // editable fields
  const [status, setStatus] = useState<AssignedServiceStatus>("assigned");
  const [note, setNote] = useState("");
  const [equipmentRequiredAt, setEquipmentRequiredAt] = useState("");
  const [crewRequiredAt, setCrewRequiredAt] = useState("");

  const requestIdRef = useRef(0);

  const load = async () => {
    if (!assignedId) return;
    setPageLoading(true);
    setError(null);
    try {
      const res = await api.get(`/assigned-services/${assignedId}/`);
      const d: AssignedServiceDetail = res.data ?? null;
      setData(d);

      setStatus(d?.status ?? "assigned");
      setNote(d?.note ?? "");
      setSelectedEmployeeIds(d?.employee_ids ?? []);
      setSelectedCostCenters(d?.cost_centers ?? []);

      setEquipmentRequiredAt(toDatetimeLocal(d?.equipment_required_at));
      setCrewRequiredAt(toDatetimeLocal(d?.crew_required_at));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load assigned service");
      setData(null);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/employees/");
        setEmployees(res.data?.results ?? res.data ?? []);
      } catch {
        setEmployees([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/assets/green-cost-centers/");
        const list: string[] = (res.data ?? []).filter(Boolean);
        setAllCostCenters(list);
      } catch {
        setAllCostCenters([]);
      }
    })();
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name = (e.name ?? "").toLowerCase();
      const emp = (e.emp_number ?? "").toLowerCase();
      return name.includes(q) || emp.includes(q) || String(e.id).includes(q);
    });
  }, [employees, employeeSearch]);

  const filteredCostCenters = useMemo(() => {
    const q = costCenterSearch.trim().toLowerCase();
    if (!q) return allCostCenters;
    return allCostCenters.filter((cc) => cc.toLowerCase().includes(q));
  }, [allCostCenters, costCenterSearch]);

  const toggleEmployee = (empId: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((x) => x !== empId) : [...prev, empId]
    );
  };

  const toggleCostCenter = (cc: string) => {
    setSelectedCostCenters((prev) =>
      prev.includes(cc) ? prev.filter((x) => x !== cc) : [...prev, cc]
    );
  };

  const selectAllFilteredCostCenters = () => {
    setSelectedCostCenters((prev) => {
      const set = new Set(prev);
      filteredCostCenters.forEach((cc) => set.add(cc));
      return Array.from(set);
    });
  };

  const clearCostCenters = () => {
    setSelectedCostCenters([]);
    setAssets([]);
    setAssetsError(null);
    setAssetSearch("");
  };

  // auto load assets preview
  useEffect(() => {
    const loadAssets = async () => {
      setAssetsError(null);

      if (selectedCostCenters.length === 0) {
        setAssets([]);
        return;
      }

      setAssetsLoading(true);
      const myReqId = ++requestIdRef.current;

      try {
        const res = await api.get("/assets/by-cost-centers/", {
          params: { cost_centers: selectedCostCenters.join(",") },
        });

        if (myReqId !== requestIdRef.current) return;

        const list: Asset[] = res.data ?? [];
        setAssets(Array.isArray(list) ? list : []);
      } catch (err: any) {
        if (myReqId !== requestIdRef.current) return;

        setAssets([]);
        setAssetsError(
          err?.response?.data?.detail || "Failed to load assets for selected cost centers."
        );
      } finally {
        if (myReqId === requestIdRef.current) setAssetsLoading(false);
      }
    };

    loadAssets();
  }, [selectedCostCenters]);

  const filteredAssets = useMemo(() => {
    const q = assetSearch.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => {
      const code = (a.asset_code ?? "").toLowerCase();
      const cc = (a.cost_center ?? "").toLowerCase();
      const st = (a.status ?? "").toLowerCase();
      return code.includes(q) || cc.includes(q) || st.includes(q);
    });
  }, [assets, assetSearch]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!assignedId) return setError("Invalid assigned service id.");
    if (selectedEmployeeIds.length === 0) return setError("Select at least one employee.");
    if (selectedCostCenters.length === 0) return setError("Select at least one cost center.");
    if (!status) return setError("Status is required.");

    setLoading(true);
    const myReqId = ++requestIdRef.current;

    try {
      await api.patch(`/assigned-services/${assignedId}/`, {
        employees: selectedEmployeeIds,
        cost_centers: selectedCostCenters,
        status,
        note: note || null,
        equipment_required_at: toIsoOrNull(equipmentRequiredAt),
        crew_required_at: toIsoOrNull(crewRequiredAt),
      });

      if (myReqId !== requestIdRef.current) return;
      navigate(`/assigned-services/${assignedId}`);
    } catch (err: any) {
      if (myReqId !== requestIdRef.current) return;
      const msg =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || {}) ||
        "Failed to update assigned service";
      setError(msg);
    } finally {
      if (myReqId === requestIdRef.current) setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-80" />
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <IconButton title="Back" onClick={() => navigate(`/assigned-services/${assignedId}`)}>
                <ArrowLeft className="h-4 w-4" />
              </IconButton>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Edit Assigned Service #{assignedId}
                  </h1>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${statusPill(status)}`}>
                    {String(status).replaceAll("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update employees, cost centers, status, note and required times.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GhostButton onClick={load} title="Refresh" disabled={pageLoading}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </GhostButton>
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

      {pageLoading ? (
        <div className="p-4 text-sm">Loading…</div>
      ) : !data ? (
        <div className="p-4 text-sm text-slate-600 dark:text-slate-300">No data.</div>
      ) : (
        <>
          <form onSubmit={submit} className="grid gap-3 lg:grid-cols-3 items-start">
            {/* ✅ Column 1: Schedule + Status TOGETHER */}
            <div className="space-y-3 lg:col-span-1">
              <ModernCard title="Schedule" subtitle="Read only" icon={<BadgeCheck className="h-4 w-4" />}>
                <InfoRow label="Schedule ID" value={data.schedule ?? "—"} />
                <InfoRow label="Schedule #" value={data.schedule_number ?? "—"} />
              </ModernCard>

              <ModernCard title="Status" subtitle="Update status" icon={<BadgeCheck className="h-4 w-4" />}>
                <Field label="Status" required>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AssignedServiceStatus)}
                    className={inputClassName}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </Field>
              </ModernCard>
            </div>

            {/* ✅ Column 2: Employees */}
            <div className="space-y-3 lg:col-span-1">
              <ModernCard title="Employees" subtitle="Select one or more" icon={<Users className="h-4 w-4" />}>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      placeholder="Search employee..."
                      className={`${inputClassName} pl-10`}
                    />
                  </div>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Selected: <span className="font-semibold">{selectedEmployeeIds.length}</span>
                  </span>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-white/60 dark:bg-slate-950/40 dark:border-slate-800 overflow-hidden">
                  <div className="max-h-[360px] overflow-auto p-2">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-2 text-xs text-slate-500 dark:text-slate-400">No employees found.</div>
                    ) : (
                      <div className="space-y-1">
                        {filteredEmployees.map((emp) => {
                          const checked = selectedEmployeeIds.includes(emp.id);
                          const label =
                            (emp.emp_number ? `${emp.emp_number} - ` : "") +
                            (emp.name ?? `Employee #${emp.id}`);
                          return (
                            <label
                              key={emp.id}
                              className={`
                                flex items-center gap-2 rounded-xl px-2 py-2 cursor-pointer
                                ${checked ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "hover:bg-slate-100 dark:hover:bg-slate-900"}
                                transition
                              `}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleEmployee(emp.id)}
                                className="h-4 w-4 accent-slate-900 dark:accent-white"
                              />
                              <span className="text-xs font-medium truncate">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </ModernCard>
            </div>

            {/* ✅ Column 3: Cost centers + Required times + Note */}
            <div className="space-y-3 lg:col-span-1">
              <ModernCard title="Cost centers" subtitle="Only those having GREEN assets" icon={<Boxes className="h-4 w-4" />}>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[220px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      value={costCenterSearch}
                      onChange={(e) => setCostCenterSearch(e.target.value)}
                      placeholder="Search cost center..."
                      className={`${inputClassName} pl-10`}
                    />
                  </div>

                  <button type="button" onClick={selectAllFilteredCostCenters} className={miniButton}>
                    Select all
                  </button>

                  <button type="button" onClick={clearCostCenters} className={miniButton}>
                    Clear
                  </button>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Selected: <span className="font-semibold">{selectedCostCenters.length}</span>
                  </span>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-white/60 dark:bg-slate-950/40 dark:border-slate-800 overflow-hidden">
                  <div className="max-h-[220px] overflow-auto p-2">
                    {filteredCostCenters.length === 0 ? (
                      <div className="p-2 text-xs text-slate-500 dark:text-slate-400">No GREEN cost centers found.</div>
                    ) : (
                      <div className="space-y-1">
                        {filteredCostCenters.map((cc) => {
                          const checked = selectedCostCenters.includes(cc);
                          return (
                            <label
                              key={cc}
                              className={`
                                flex items-center gap-2 rounded-xl px-2 py-2 cursor-pointer
                                ${checked ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "hover:bg-slate-100 dark:hover:bg-slate-900"}
                                transition
                              `}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCostCenter(cc)}
                                className="h-4 w-4 accent-slate-900 dark:accent-white"
                              />
                              <span className="text-xs font-medium truncate">{cc}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </ModernCard>
            </div>

            {/* ✅ Required times + Note section (placed below all columns) */}
            <div className="lg:col-span-3">
              <ModernCard title="Required times & Note" subtitle="Crew / Equipment + notes" icon={<CalendarClock className="h-4 w-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Field label="Crew required date & time">
                      <input
                        type="datetime-local"
                        value={crewRequiredAt}
                        onChange={(e) => setCrewRequiredAt(e.target.value)}
                        className={inputClassName}
                      />
                    </Field>
                    
                    <Field label="Equipment required date & time">
                      <input
                        type="datetime-local"
                        value={equipmentRequiredAt}
                        onChange={(e) => setEquipmentRequiredAt(e.target.value)}
                        className={inputClassName}
                      />
                    </Field>
                  </div>
                  
                  <div>
                    <Field label="Note">
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={6}
                        placeholder="Optional note…"
                        className={`${inputClassName} resize-none`}
                      />
                    </Field>
                  </div>
                </div>
              </ModernCard>
            </div>

            {/* ✅ Assets preview full width */}
            <div className="lg:col-span-3">
              <ModernCard
                title="Assets preview"
                subtitle={`Assets in selected cost centers (${assets.length})`}
                icon={<Package className="h-4 w-4" />}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[240px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      placeholder="Search asset / status / cost center..."
                      disabled={assets.length === 0}
                      className={`${inputClassName} pl-10 disabled:opacity-60`}
                    />
                  </div>

                  <button type="button" onClick={() => setAssetSearch("")} className={miniButton} disabled={!assetSearch}>
                    Clear
                  </button>
                </div>

                {assetsLoading && (
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">Loading assets…</div>
                )}
                {assetsError && <InlineError className="mt-3">{assetsError}</InlineError>}

                {!assetsLoading && !assetsError && (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
                    <div className="max-h-[360px] overflow-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-slate-500">Asset Code</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500">Cost Center</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {filteredAssets.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                              <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">{a.asset_code}</td>
                              <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{a.cost_center ?? "—"}</td>
                              <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{a.status ?? "—"}</td>
                            </tr>
                          ))}

                          {filteredAssets.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                                {assets.length === 0 ? "Select cost centers to see assets." : "No assets match your search."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </ModernCard>
            </div>

            {/* ✅ spacer to avoid sticky bar covering last content */}
            <div className="lg:col-span-3 h-16" />
          </form>

          {/* ✅ Sticky bottom-right actions */}
          <div className="fixed bottom-4 right-4 z-50">
            <div
              className="
                flex items-center gap-2
                rounded-2xl border border-slate-200/70 bg-white/80 px-2.5 py-2
                shadow-lg backdrop-blur
                dark:border-slate-800 dark:bg-slate-950/70
              "
            >
              <GhostButton
                type="button"
                onClick={() => navigate(`/assigned-services/${assignedId}`)}
                title="Cancel"
                disabled={loading}
              >
                <X className="h-4 w-4" />
                Cancel
              </GhostButton>

              <PrimaryButton 
                type="button" 
                onClick={() => {
                  const form = document.querySelector("form") as HTMLFormElement | null;
                  if (form) form.requestSubmit();
                }} 
                disabled={loading} 
                title="Save changes"
              >
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : "Save"}
              </PrimaryButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- date helpers ---------- */
function toIsoOrNull(v: string) {
  return v ? new Date(v).toISOString() : null;
}

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/* ---------- UI helpers ---------- */

const inputClassName = `
  w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs
  text-slate-900 placeholder:text-slate-400
  focus:outline-none focus:ring-1 focus:ring-slate-500
  dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100
  dark:placeholder:text-slate-500
`;

const miniButton = `
  rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs
  text-slate-600 hover:bg-slate-100
  dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
  dark:hover:bg-slate-800
  transition
`;

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function InlineError({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800
        dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200
        ${className}
      `}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-50 text-right">{value}</span>
    </div>
  );
}

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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
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