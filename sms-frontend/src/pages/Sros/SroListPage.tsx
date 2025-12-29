// src/pages/Sros/SroListPage.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, RefreshCw, LayoutGrid, Rows3, CalendarDays } from "lucide-react";
import { useSros } from "../../api/sros";

export function SroListPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useSros();

  // -----------------------------
  // Local UI state: search / filters / sort / view
  // -----------------------------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_desc" | "created_asc" | "sro_asc" | "sro_desc">(
    "created_desc"
  );

  const [viewMode, setViewMode] = useState<"table" | "card" | "calendar">("table");

  // Date filters (YYYY-MM-DD strings)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Calendar month state
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  const goToPrevMonth = () => {
    setCalendarMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goToNextMonth = () => {
    setCalendarMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Enforce: toDate >= fromDate
  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (value && toDate && new Date(toDate) < new Date(value)) {
      setToDate(value);
    }
  };

  const handleToDateChange = (value: string) => {
    if (fromDate && value && new Date(value) < new Date(fromDate)) {
      setToDate(fromDate);
    } else {
      setToDate(value);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setStatusFilter("all");
    setSortBy("created_desc");
  };

  // TODO: replace with your real delete mutation
  const handleDelete = (id: number) => {
    console.log("DELETE SRO", id);
    // open confirmation OR call delete API
  };

  // -----------------------------
  // Base data (safe even when loading)
  // -----------------------------
  const sros = (data as any[]) ?? [];

  // Unique statuses for dropdown (based on current data)
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    sros.forEach((s) => {
      if (s.status) set.add(s.status);
    });
    return Array.from(set);
  }, [sros]);

  // -----------------------------
  // Derived data: filtered + sorted
  // -----------------------------
  const rows = useMemo(() => {
    let result = [...sros];

    // 🔍 Text search across several fields
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((sro) => {
        return (
          (sro.sro_number || "").toLowerCase().includes(q) ||
          (sro.customer_name || "").toLowerCase().includes(q) ||
          (sro.callout_number || sro.callout || "").toLowerCase().includes(q)
        );
      });
    }

    // 📅 Date filter (created_at)
    if (fromDate && !toDate) {
      // ➜ Only that exact day
      const target = fromDate; // "YYYY-MM-DD"
      result = result.filter((sro) => {
        if (!sro.created_at) return false;
        const created = new Date(sro.created_at);
        const createdDateStr = created.toISOString().slice(0, 10); // "YYYY-MM-DD"
        return createdDateStr === target;
      });
    } else {
      // Standard range behaviour
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        result = result.filter((sro) => {
          if (!sro.created_at) return false;
          const created = new Date(sro.created_at);
          return created.getTime() >= from.getTime();
        });
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        result = result.filter((sro) => {
          if (!sro.created_at) return false;
          const created = new Date(sro.created_at);
          return created.getTime() <= to.getTime();
        });
      }
    }

    // 🎯 Status filter
    if (statusFilter !== "all") {
      result = result.filter((sro) => sro.status === statusFilter);
    }

    // ↕️ Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "created_asc":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "created_desc":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "sro_asc":
          return (a.sro_number || "").localeCompare(b.sro_number || "");
        case "sro_desc":
          return (b.sro_number || "").localeCompare(a.sro_number || "");
        default:
          return 0;
      }
    });

    return result;
  }, [sros, search, fromDate, toDate, statusFilter, sortBy]);

  // -----------------------------
  // Events grouped by date for calendar view
  // -----------------------------
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof rows> = {};
    rows.forEach((sro) => {
      if (!sro.created_at) return;
      const d = new Date(sro.created_at);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!map[key]) map[key] = [];
      map[key].push(sro);
    });
    return map;
  }, [rows]);

  // -----------------------------
  // Loading / error states
  // -----------------------------
  if (isLoading) {
    return <div className="p-4 text-sm">Loading SROs…</div>;
  }

  if (error) {
    return <div className="p-4 text-sm">Failed to load SROs.</div>;
  }

  // -----------------------------
  // Calendar grid helpers
  // -----------------------------
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth(); // 0-11
  const startOfMonth = new Date(year, month, 1);

  const calendarStart = new Date(startOfMonth);
  const startDay = calendarStart.getDay(); // 0-6
  calendarStart.setDate(calendarStart.getDate() - startDay);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(calendarStart);
    d.setDate(calendarStart.getDate() + i);
    days.push(d);
  }

  const monthLabel = calendarMonth.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* HERO HEADER (soft gradient + glass effect) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-80" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* left */}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                SRO Management
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Browse, filter, and manage SRO records.
              </p>
            </div>

            {/* right */}
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
              {/* View mode buttons */}
              <div
                className="
                  inline-flex items-center gap-1
                  rounded-full border border-slate-200/70 bg-white/70 p-1 text-xs
                  dark:border-slate-700 dark:bg-slate-950/60
                  backdrop-blur
                "
              >
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`
                    inline-flex items-center rounded-full px-2 py-1
                    ${
                      viewMode === "table"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }
                  `}
                  title="Table view"
                >
                  <Rows3 className="h-3 w-3 mr-1" />
                  Table
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("card")}
                  className={`
                    inline-flex items-center rounded-full px-2 py-1
                    ${
                      viewMode === "card"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }
                  `}
                  title="Card view"
                >
                  <LayoutGrid className="h-3 w-3 mr-1" />
                  Card
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`
                    inline-flex items-center rounded-full px-2 py-1
                    ${
                      viewMode === "calendar"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }
                  `}
                  title="Calendar view"
                >
                  <CalendarDays className="h-3 w-3 mr-1" />
                  Calendar
                </button>
              </div>

              {/* Clear filters icon button */}
              <button
                type="button"
                onClick={handleClearFilters}
                title="Clear filters"
                className="
                  inline-flex items-center justify-center
                  rounded-full border border-slate-200/70 bg-white/70 p-2 text-xs
                  text-slate-500 hover:bg-white hover:text-slate-700
                  dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300
                  dark:hover:bg-slate-900 dark:hover:text-slate-100
                  backdrop-blur transition
                "
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Clear filters</span>
              </button>
            </div>
          </div>

          {/* Filters / search / sort bar (inside hero) */}
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between text-xs">
            <div className="w-full md:max-w-xs">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SRO #, customer, callout…"
                className="
                  w-full rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs
                  text-slate-900 placeholder:text-slate-400
                  focus:outline-none focus:ring-1 focus:ring-slate-500
                  dark:bg-slate-950/60 dark:border-slate-700 dark:text-slate-100
                  dark:placeholder:text-slate-500
                  backdrop-blur
                "
              />
            </div>

            <div className="w-full md:w-auto flex flex-wrap gap-2 justify-start md:justify-end">
              <div className="flex flex-1 min-w-[150px] items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                  className="
                    flex-1 rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5
                    dark:bg-slate-950/60 dark:border-slate-700 cursor-pointer
                    backdrop-blur
                  "
                />
              </div>

              <div className="flex flex-1 min-w-[150px] items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400">To:</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => handleToDateChange(e.target.value)}
                  className="
                    flex-1 rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5
                    dark:bg-slate-950/60 dark:border-slate-700 cursor-pointer
                    backdrop-blur
                  "
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="
                  min-w-[130px]
                  rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5
                  dark:bg-slate-950/60 dark:border-slate-700 cursor-pointer
                  backdrop-blur
                "
              >
                <option value="all">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {String(status).replace("_", " ")}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "created_desc" | "created_asc" | "sro_asc" | "sro_desc")
                }
                className="
                  min-w-[150px]
                  rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5
                  dark:bg-slate-950/60 dark:border-slate-700 cursor-pointer
                  backdrop-blur
                "
              >
                <option value="created_desc">Newest first</option>
                <option value="created_asc">Oldest first</option>
                <option value="sro_asc">SRO # A → Z</option>
                <option value="sro_desc">SRO # Z → A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT: table / card / calendar views */}
      {viewMode === "table" ? (
        <div className="rounded-2xl border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950/60 overflow-hidden">
          <div className="overflow-x-auto">
           <div className="max-h-[70vh] overflow-y-auto"
           >
           <table className="min-w-[900px] w-full divide-y divide-slate-200 dark:divide-slate-800">
           <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">SRO #</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Customer</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Callout</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Created at</th>
                  <th className="px-4 py-2 text-center font-medium text-slate-500">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((sro) => (
                  <tr key={sro.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">
                      {sro.sro_number}
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {sro.customer_name ?? "—"}
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {sro.callout_number ?? sro.callout ?? "—"}
                    </td>

                    {/* ✅ Styled status pill */}
                    <td className="px-4 py-2">
                      <StatusPill status={sro.status} />
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {sro.created_at ? new Date(sro.created_at).toLocaleString() : "—"}
                    </td>

                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/sros/${sro.id}`)}
                          className="
                            inline-flex items-center justify-center rounded-full p-1.5
                            bg-slate-100 text-slate-700
                            hover:bg-slate-800 hover:text-white
                            dark:bg-slate-900 dark:text-slate-100
                            dark:hover:bg-slate-100 dark:hover:text-slate-900
                            transition
                          "
                          title="View SRO"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(sro.id)}
                          className="
                            inline-flex items-center justify-center rounded-full p-1.5
                            bg-slate-100 text-slate-700
                            hover:bg-slate-800 hover:text-white
                            dark:bg-slate-900 dark:text-slate-100
                            dark:hover:bg-slate-100 dark:hover:text-slate-900
                            transition
                          "
                          title="Delete SRO"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400">
                      No SROs match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>

          <div className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">
            Tip: swipe left/right to see all columns.
          </div>
        </div>
      ) : viewMode === "card" ? (
        <div className="max-h-[70vh] overflow-y-auto">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((sro) => (
            <div
              key={sro.id}
              className="
                rounded-2xl border border-slate-200 bg-white p-3 text-xs
                shadow-sm hover:shadow-md transition
                dark:border-slate-700 dark:bg-slate-950/60
              "
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">SRO</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {sro.sro_number || `SRO_${sro.id}`}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Callout {sro.callout_number ?? sro.callout ?? "—"}
                  </div>
                </div>

                {/* ✅ Styled status pill */}
                <StatusPill status={sro.status} />
              </div>

              <div className="space-y-1 mb-3">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 truncate">
                    {sro.customer_name || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Status:</span>
                  <span className="text-slate-800 dark:text-slate-100 capitalize">
                    {String(sro.status || "—").replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Created at</div>
                  <div className="text-[10px] text-slate-700 dark:text-slate-200">
                    {sro.created_at ? new Date(sro.created_at).toLocaleString() : "—"}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate(`/sros/${sro.id}`)}
                    className="
                      inline-flex items-center justify-center
                      rounded-full p-1.5
                      bg-slate-100 text-slate-700
                      hover:bg-slate-800 hover:text-slate-50
                      dark:bg-slate-900 dark:text-slate-100
                      dark:hover:bg-slate-100 dark:hover:text-slate-900
                      transition
                    "
                    title="View"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(sro.id)}
                    className="
                      inline-flex items-center justify-center
                      rounded-full p-1.5
                      bg-slate-100 text-slate-700
                      hover:bg-slate-800 hover:text-slate-50
                      dark:bg-slate-900 dark:text-slate-100
                      dark:hover:bg-slate-100 dark:hover:text-slate-900
                      transition
                    "
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="col-span-full px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No SROs match your filters.
            </div>
          )}
        </div>
        </div>
      ) : (
        <div
          className="
            rounded-xl border shadow-sm
            bg-white dark:bg-slate-900
            border-slate-200 dark:border-slate-700 dark:bg-slate-950/60
            p-3 text-xs
          "
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="
                px-2 py-1 rounded border border-slate-200 text-slate-600 text-[11px]
                hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800
              "
            >
              ← Prev
            </button>
            <div className="font-semibold text-slate-800 dark:text-slate-100">{monthLabel}</div>
            <button
              type="button"
              onClick={goToNextMonth}
              className="
                px-2 py-1 rounded border border-slate-200 text-slate-600 text-[11px]
                hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800
              "
            >
              Next →
            </button>
          </div>

          <div className="grid grid-cols-7 text-[11px] font-medium text-center text-slate-500 dark:text-slate-400 mb-1">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayMonth = day.getMonth();
              const isCurrentMonth = dayMonth === month;
              const dateKey = day.toISOString().slice(0, 10);
              const dayEvents = eventsByDate[dateKey] || [];

              return (
                <div
                  key={dateKey}
                  className={`
                    min-h-[70px] rounded-lg border px-1.5 pt-1 pb-1
                    flex flex-col gap-1
                    ${
                      isCurrentMonth
                        ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        : "border-slate-100 bg-slate-50/60 text-slate-400 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-500"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold">{day.getDate()}</span>
                    {dayEvents.length > 0 && <span className="text-[10px] text-slate-400">{dayEvents.length}</span>}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((sro) => (
                      <button
                        key={sro.id}
                        type="button"
                        onClick={() => navigate(`/sros/${sro.id}`)}
                        className="
                          w-full text-left rounded-md px-1 py-0.5
                          text-[10px] truncate
                          bg-slate-100 text-slate-700 hover:bg-slate-200
                          dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700
                        "
                        title={sro.sro_number || ""}
                      >
                        {sro.sro_number || `SRO_${sro.id}`}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-slate-400">+ {dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {rows.length === 0 && (
            <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No SROs match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Status UI ---------------- */

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
