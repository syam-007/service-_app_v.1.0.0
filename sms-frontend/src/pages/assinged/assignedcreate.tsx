// src/pages/assinged/assignedcreate.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Save,
  RefreshCw,
  Search,
  X,
  ClipboardList,
  User,
  BadgeCheck,
  Boxes,
  Package,
  AlertTriangle,
} from "lucide-react";
import api from "../../api/axios";

type AssignedServiceStatus = "pending" | "assigned" | "completed" | "cancelled";

type Schedule = {
  id: number;
  schedule_number: string;
  scheduled_date: string;
  status: string;
  sro_number?: string;
};

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

export function AssignedServiceCreatePage() {
  const navigate = useNavigate();

  // approved schedules
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | "">("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // ✅ form
  const [status, setStatus] = useState<AssignedServiceStatus>("assigned");
  const [note, setNote] = useState("");

  // ✅ NEW: required date/time fields
  const [equipmentRequiredAt, setEquipmentRequiredAt] = useState("");
  const [crewRequiredAt, setCrewRequiredAt] = useState("");

  // ✅ NEW: multi-employee selection
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  // cost centers
  const [allCostCenters, setAllCostCenters] = useState<string[]>([]);
  const [selectedCostCenters, setSelectedCostCenters] = useState<string[]>([]);
  const [costCenterSearch, setCostCenterSearch] = useState("");

  // assets
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [assetSearch, setAssetSearch] = useState("");

  // ui
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // prevent stale requests
  const requestIdRef = useRef(0);

  // load approved schedules
  useEffect(() => {
    (async () => {
      setSchedulesLoading(true);
      setSchedulesError(null);
      try {
        const res = await api.get("/assigned-services/approved-schedules/");
        setSchedules(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setSchedules([]);
        setSchedulesError(
          err?.response?.data?.detail ||
            "Failed to load approved schedules. Check /assigned-services/approved-schedules/ endpoint."
        );
      } finally {
        setSchedulesLoading(false);
      }
    })();
  }, []);

  // load employees
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

  // green cost centers
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

  const filteredCostCenters = useMemo(() => {
    const q = costCenterSearch.trim().toLowerCase();
    if (!q) return allCostCenters;
    return allCostCenters.filter((cc) => cc.toLowerCase().includes(q));
  }, [allCostCenters, costCenterSearch]);

  // auto load assets when CC changes
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

        const data: Asset[] = res.data ?? [];
        setAssets(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (myReqId !== requestIdRef.current) return;

        setAssets([]);
        setAssetsError(
          err?.response?.data?.detail ||
            "Failed to load assets for selected cost centers."
        );
      } finally {
        if (myReqId === requestIdRef.current) setAssetsLoading(false);
      }
    };

    loadAssets();
  }, [selectedCostCenters]);

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

  const clearAllCostCenters = () => {
    setSelectedCostCenters([]);
    setAssets([]);
    setAssetsError(null);
    setAssetSearch("");
  };

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

  // ✅ employee filtering + toggling
  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name = (e.name ?? "").toLowerCase();
      const emp = (e.emp_number ?? "").toLowerCase();
      return name.includes(q) || emp.includes(q) || String(e.id).includes(q);
    });
  }, [employees, employeeSearch]);

  const toggleEmployee = (id: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearEmployees = () => setSelectedEmployeeIds([]);

  // ✅ helper: datetime-local -> ISO string (or null)
  const toIsoOrNull = (v: string) => (v ? new Date(v).toISOString() : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedScheduleId) return setError("Approved Schedule is required.");
    if (selectedEmployeeIds.length === 0) return setError("Select at least one employee.");
    if (!status) return setError("Assigned service status is required.");
    if (selectedCostCenters.length === 0) return setError("Select at least one cost center.");

    setLoading(true);
    try {
      await api.post("/assigned-services/", {
        schedule: selectedScheduleId,

        // ✅ NEW: employees array for backend serializer
        employees: selectedEmployeeIds,

        status,
        cost_centers: selectedCostCenters,
        note: note || undefined,

        equipment_required_at: toIsoOrNull(equipmentRequiredAt),
        crew_required_at: toIsoOrNull(crewRequiredAt),
      });

      navigate("/assigned-services");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || {}) ||
        "Failed to create assigned service";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 space-y-5">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-80" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <IconButton title="Back" onClick={() => navigate("/assigned-services")}>
                <ArrowLeft className="h-4 w-4" />
              </IconButton>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Assigned Service
                  </h1>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
                    <Plus className="h-3.5 w-3.5" />
                    Create
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pick an approved schedule, select employees & cost centers, then submit.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <PrimaryButton onClick={() => navigate("/assigned-services")} title="Back to list">
                <ClipboardList className="h-4 w-4" />
                List
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div className="whitespace-pre-wrap">{error}</div>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-3 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-3 lg:col-span-1">
          <ModernCard
            title="Basic info"
            subtitle="Schedule, employees, status, required times"
            icon={<BadgeCheck className="h-4 w-4" />}
          >
            {/* Approved schedule */}
            <Field label="Approved Scheduled Service" required>
              <select
                value={selectedScheduleId}
                onChange={(e) =>
                  setSelectedScheduleId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={schedulesLoading}
                className={inputClassName}
              >
                <option value="">
                  {schedulesLoading ? "Loading schedules..." : "Select approved schedule"}
                </option>

                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.schedule_number} — {new Date(s.scheduled_date).toLocaleString()}
                    {s.sro_number ? ` — SRO: ${s.sro_number}` : ""}
                  </option>
                ))}
              </select>

              {schedulesError && <InlineError>{schedulesError}</InlineError>}
            </Field>

            {/* ✅ NEW: Employees (multi) */}
            <Field label="Employees" required>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search employee by name / emp# / id..."
                    className={`${inputClassName} pl-10`}
                  />
                </div>

                <button type="button" onClick={clearEmployees} className={miniButton} title="Clear employees">
                  Clear
                </button>

                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Selected: <span className="font-semibold">{selectedEmployeeIds.length}</span>
                </span>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white/60 dark:bg-slate-950/40 dark:border-slate-800 overflow-hidden">
                <div className="max-h-[220px] overflow-auto p-2">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-2 text-xs text-slate-500 dark:text-slate-400">
                      No employees found.
                    </div>
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
            </Field>

            {/* Status */}
            <Field label="Assigned Service Status" required>
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

              <div className="pt-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${statusPill(status)}`}>
                  {String(status).replaceAll("_", " ")}
                </span>
              </div>
            </Field>

            {/* required times */}
            <Field label="Equipment required date & time">
              <input
                type="datetime-local"
                value={equipmentRequiredAt}
                onChange={(e) => setEquipmentRequiredAt(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Crew required date & time">
              <input
                type="datetime-local"
                value={crewRequiredAt}
                onChange={(e) => setCrewRequiredAt(e.target.value)}
                className={inputClassName}
              />
            </Field>
          </ModernCard>

          <ModernCard title="Note" subtitle="Optional" icon={<User className="h-4 w-4" />}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Optional note…"
              className={`${inputClassName} resize-none`}
            />
          </ModernCard>

          <div className="flex flex-wrap gap-2">
            <PrimaryButton type="submit" disabled={loading} title="Create Assigned Service">
              <Save className="h-4 w-4" />
              {loading ? "Creating..." : "Create"}
            </PrimaryButton>

            <GhostButton type="button" onClick={() => navigate("/assigned-services")} title="Cancel">
              <X className="h-4 w-4" />
              Cancel
            </GhostButton>
          </div>
        </div>

        {/* MIDDLE COLUMN: COST CENTERS */}
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

              <button type="button" onClick={clearAllCostCenters} className={miniButton}>
                Clear
              </button>

              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Selected: <span className="font-semibold">{selectedCostCenters.length}</span>
              </span>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white/60 dark:bg-slate-950/40 dark:border-slate-800 overflow-hidden">
              <div className="max-h-[320px] overflow-auto p-2">
                {filteredCostCenters.length === 0 ? (
                  <div className="p-2 text-xs text-slate-500 dark:text-slate-400">
                    No GREEN cost centers found.
                  </div>
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

            <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Assets will load automatically when you select cost centers.
            </div>
          </ModernCard>
        </div>

        {/* RIGHT COLUMN: ASSETS */}
        <div className="space-y-3 lg:col-span-1">
          <ModernCard title="Assets" subtitle={`In selected cost centers (${assets.length})`} icon={<Package className="h-4 w-4" />}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
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

              <button
                type="button"
                onClick={loadAssetsManually}
                className={miniIconButton}
                title="Reload assets"
                disabled={selectedCostCenters.length === 0 || assetsLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {assetsLoading && <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">Loading assets…</div>}
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
                          <td className="px-4 py-2">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${assetStatusPill(a.status)}`}>
                              {String(a.status || "—").replaceAll("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {filteredAssets.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            {assets.length === 0 ? "Select a cost center to see assets." : "No assets match your search."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </ModernCard>

          <ModernCard title="Summary" subtitle="What will be saved" icon={<BadgeCheck className="h-4 w-4" />}>
            <SummaryRow label="Schedule" value={selectedScheduleId ? `#${selectedScheduleId}` : "—"} />
            <SummaryRow label="Employees" value={selectedEmployeeIds.length ? selectedEmployeeIds.length : "—"} />
            <SummaryRow label="Status" value={<span className="capitalize">{status}</span>} />
            <SummaryRow label="Cost centers" value={selectedCostCenters.length ? selectedCostCenters.length : "—"} />
            <SummaryRow
              label="Equipment required"
              value={equipmentRequiredAt ? new Date(equipmentRequiredAt).toLocaleString() : "—"}
            />
            <SummaryRow
              label="Crew required"
              value={crewRequiredAt ? new Date(crewRequiredAt).toLocaleString() : "—"}
            />
          </ModernCard>
        </div>
      </form>
    </div>
  );

  // manual reload
  async function loadAssetsManually() {
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

      const data: Asset[] = res.data ?? [];
      setAssets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (myReqId !== requestIdRef.current) return;

      setAssets([]);
      setAssetsError(err?.response?.data?.detail || "Failed to load assets for selected cost centers.");
    } finally {
      if (myReqId === requestIdRef.current) setAssetsLoading(false);
    }
  }
}

/* ---------------- UI pieces ---------------- */

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

const miniIconButton = `
  inline-flex items-center justify-center rounded-xl
  border border-slate-200 bg-white p-2 text-slate-600
  hover:bg-slate-100
  disabled:opacity-60 disabled:cursor-not-allowed
  dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
  dark:hover:bg-slate-800
  transition
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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
      </div>

      <div className="text-xs space-y-3">{children}</div>
    </section>
  );
}

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

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-50 text-right">{value}</span>
    </div>
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
