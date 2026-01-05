// ✅ UPDATE: src/pages/assinged/assignedlist.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Plus, Search, ExternalLink, Eye, Pencil } from "lucide-react";
import api from "../../api/axios";

type AssignedServiceRow = {
  id: number;
  schedule?: number;
  schedule_number?: string;

  employee_ids?: number[];
  employee_names?: string[];

  status: string;
  cost_centers?: string[];
  asset_codes?: string[];
  note?: string | null;
  assigned_at?: string;
  created_at?: string;

  equipment_required_at?: string;
  crew_required_at?: string;
};

export function AssignedServiceListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<AssignedServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/assigned-services/");
      const data = res.data?.results ?? res.data ?? [];
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load assigned services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.status))).filter(Boolean);
  }, [rows]);

  const handleGenerateJob = (assignedServiceId: number) => {
    window.open("https://survey.task.energy/login", "_blank");
  };

  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => {
        const employeesText = (r.employee_names ?? []).join(", ").toLowerCase();
        const employeeIdsText = (r.employee_ids ?? []).map(String).join(",").toLowerCase();
        const cost = (r.cost_centers ?? []).join(",").toLowerCase();
        const assets = (r.asset_codes ?? []).join(",").toLowerCase();
        const status = String(r.status ?? "").toLowerCase();
        const id = String(r.id);

        return (
          id.includes(q) ||
          employeesText.includes(q) ||
          employeeIdsText.includes(q) ||
          cost.includes(q) ||
          assets.includes(q) ||
          status.includes(q)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    result.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return result;
  }, [rows, search, statusFilter]);

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Assigned Services
        </h1>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={load}
            title="Refresh"
            className="
              inline-flex items-center justify-center
              rounded-full border border-slate-200 bg-white p-2 text-xs
              text-slate-500 hover:bg-slate-100 hover:text-slate-700
              dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300
              dark:hover:bg-slate-800 dark:hover:text-slate-100
              transition
            "
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/assigned-services/new")}
            className="
              inline-flex items-center gap-2
              px-3 py-2 rounded text-sm
              bg-slate-900 text-white
              dark:bg-white dark:text-slate-900
              transition
            "
          >
            <Plus className="h-4 w-4" />
            New Assigned Service
          </button>
        </div>
      </div>

      {error && (
        <div
          className="
            mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800
            dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200
          "
        >
          {error}
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between text-xs">
        <div className="w-full md:max-w-xs relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, employees, status, cost center, asset…"
            className="
              w-full rounded-xl border border-slate-400 bg-white pl-10 pr-3 py-2 text-xs
              text-slate-900 placeholder:text-slate-400
              focus:outline-none focus:ring-1 focus:ring-slate-500
              dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100
              dark:placeholder:text-slate-500
            "
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap gap-2 justify-start md:justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="
              min-w-[160px]
              rounded-xl border border-slate-200 bg-white px-2 py-2
              dark:bg-slate-900 dark:border-slate-700 cursor-pointer
            "
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {String(st).replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="
              rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs
              text-slate-600 hover:bg-slate-100
              dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
              dark:hover:bg-slate-800
              transition
            "
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm">Loading assigned services…</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Employees</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Cost Centers</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Assets</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Crew required</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Equipment required</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {r.employee_names?.length ? (
                        <>
                          {r.employee_names.slice(0, 2).join(", ")}
                          {r.employee_names.length > 2 ? ` (+${r.employee_names.length - 2})` : ""}
                        </>
                      ) : r.employee_ids?.length ? (
                        <>
                          {r.employee_ids.slice(0, 2).join(", ")}
                          {r.employee_ids.length > 2 ? ` (+${r.employee_ids.length - 2})` : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {String(r.status || "—").replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {r.cost_centers?.length ? r.cost_centers.join(", ") : "—"}
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {r.asset_codes?.length ? r.asset_codes.slice(0, 4).join(", ") : "—"}
                      {r.asset_codes && r.asset_codes.length > 4 ? ` (+${r.asset_codes.length - 4})` : ""}
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {r.crew_required_at ? new Date(r.crew_required_at).toLocaleString() : "—"}
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {r.equipment_required_at ? new Date(r.equipment_required_at).toLocaleString() : "—"}
                    </td>

                    {/* ✅ Actions: View + Edit + Generate Job */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/service/assigned-services/${r.id}`)}
                          className="
                            inline-flex items-center justify-center
                            rounded-full p-2
                            border border-slate-200 bg-white text-slate-700
                            hover:bg-slate-100
                            dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
                            dark:hover:bg-slate-800
                            transition
                          "
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/service/assigned-services/${r.id}/edit`)}
                          className="
                            inline-flex items-center justify-center
                            rounded-full p-2
                            border border-slate-200 bg-white text-slate-700
                            hover:bg-slate-100
                            dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
                            dark:hover:bg-slate-800
                            transition
                          "
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGenerateJob(r.id)}
                          className="
                            inline-flex items-center justify-center gap-1
                            rounded-full px-3 py-1.5 text-[11px] font-medium
                            border border-blue-500 bg-blue-500 text-white
                            hover:bg-blue-600 hover:border-blue-600
                            transition-colors
                            dark:border-blue-400 dark:bg-blue-400 dark:text-blue-900
                            dark:hover:bg-blue-300 dark:hover:border-blue-300
                          "
                          title="Generate Job and open survey portal"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Generate Job
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      No assigned services match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 p-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium">{filteredRows.length}</span> of{" "}
              <span className="font-medium">{rows.length}</span>
            </div>

            <button
              type="button"
              onClick={load}
              className="
                rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs
                text-slate-600 hover:bg-slate-100
                dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
                dark:hover:bg-slate-800
                transition
              "
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
