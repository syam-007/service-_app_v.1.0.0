// src/pages/Callouts/CalloutListPage.tsx
import { useState, useMemo } from "react";
import { useCallouts } from "../../api/callout";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  LayoutGrid,
  Rows3,
  CalendarDays,
} from "lucide-react";

// Helper to style status (badge + dot) based on value
// ✅ Modern status chip styles (badge + dot + optional ring/pulse)
const getStatusStyles = (statusRaw: string) => {
  const status = String(statusRaw || "").toLowerCase();

  const base =
    "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold " +
    "shadow-sm backdrop-blur transition " +
    "bg-white/70 dark:bg-slate-950/50";

  const dotBase =
    "h-2 w-2 rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.7)] dark:shadow-[0_0_0_2px_rgba(2,6,23,0.6)]";

  switch (status) {
    case "draft":
      return {
        badge:
          base +
          " border-amber-200/70 text-amber-800 " +
          "bg-gradient-to-r from-amber-50/80 to-white/60 " +
          "dark:border-amber-900/50 dark:text-amber-200 dark:from-amber-950/40 dark:to-slate-950/40",
        dot: dotBase + " bg-amber-500",
        pulse: "",
      };

    case "locked":
      return {
        badge:
          base +
          " border-rose-200/70 text-rose-700 " +
          "bg-gradient-to-r from-rose-50/80 to-white/60 " +
          "dark:border-rose-900/50 dark:text-rose-200 dark:from-rose-950/40 dark:to-slate-950/40",
        dot: dotBase + " bg-rose-500",
        pulse: "",
      };

    case "sro_activated":
      return {
        badge:
          base +
          " border-orange-200/70 text-orange-800 " +
          "bg-gradient-to-r from-orange-50/80 to-white/60 " +
          "dark:border-orange-900/50 dark:text-orange-200 dark:from-orange-950/40 dark:to-slate-950/40",
        dot: dotBase + " bg-orange-500",
        // subtle activity cue
        pulse: "animate-pulse",
      };

    case "scheduled":
      return {
        badge:
          base +
          " border-sky-200/70 text-sky-800 " +
          "bg-gradient-to-r from-sky-50/80 to-white/60 " +
          "dark:border-sky-900/50 dark:text-sky-200 dark:from-sky-950/40 dark:to-slate-950/40",
        dot: dotBase + " bg-sky-500",
        // subtle activity cue
        pulse: "animate-pulse",
      };

    default:
      return {
        badge:
          base +
          " border-slate-200/70 text-slate-700 " +
          "bg-gradient-to-r from-slate-50/80 to-white/60 " +
          "dark:border-slate-800 dark:text-slate-200 dark:from-slate-950/40 dark:to-slate-950/40",
        dot: dotBase + " bg-slate-400",
        pulse: "",
      };
  }
};

const prettyStatus = (s: any) => String(s || "—").replaceAll("_", " ");


export function CalloutListPage() {
  const { data, isLoading, error } = useCallouts();
  const navigate = useNavigate();

  // -----------------------------
  // Local UI state: search / filters / sort / view
  // -----------------------------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "locked" | "sro_activated" | "scheduled" // ✅ NEW
  >("all");
  const [serviceFilter, setServiceFilter] = useState<
    "all" | "wireline_gyro" | "memory_gyro"
  >("all");
  const [sortBy, setSortBy] = useState<
    "created_desc" | "created_asc" | "callout_asc" | "callout_desc"
  >("created_desc");

  const [viewMode, setViewMode] = useState<"table" | "card" | "calendar">(
    "table"
  );

  // Date filters (YYYY-MM-DD strings)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Calendar current month
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
    setServiceFilter("all");
    setSortBy("created_desc");
  };

  const handleDelete = (id: number) => {
    console.log("Delete callout", id);
  };

  // -----------------------------
  // Derived data: filtered + sorted
  // -----------------------------
  const rows = useMemo(() => {
    if (!data) return [];

    let result = [...(data as any[])];

    // 🔍 Text search across several fields
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        return (
          (c.callout_number || "").toLowerCase().includes(q) ||
          (c.rig_number || "").toLowerCase().includes(q) ||
          (c.well_name_display || "").toLowerCase().includes(q) ||
          (c.field_name || "").toLowerCase().includes(q) ||
          (c.created_by_username || "").toLowerCase().includes(q)
        );
      });
    }

    // 📅 Date range filter (created_at)
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      result = result.filter((c) => {
        const created = new Date(c.created_at);
        return created.getTime() >= from.getTime();
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((c) => {
        const created = new Date(c.created_at);
        return created.getTime() <= to.getTime();
      });
    }

    // 🎯 Status filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // 🎯 Service type filter
    if (serviceFilter !== "all") {
      result = result.filter((c) => c.service_category === serviceFilter);
    }

    // ↕️ Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "created_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "created_desc":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "callout_asc":
          return (a.callout_number || "").localeCompare(b.callout_number || "");
        case "callout_desc":
          return (b.callout_number || "").localeCompare(a.callout_number || "");
        default:
          return 0;
      }
    });

    return result;
  }, [data, search, fromDate, toDate, statusFilter, serviceFilter, sortBy]);

  // Group filtered rows by date for calendar view
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof rows> = {};
    rows.forEach((c: any) => {
      if (!c.created_at) return;
      const d = new Date(c.created_at);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [rows]);

  // -----------------------------
  // Loading / error states
  // -----------------------------
  if (isLoading) return <div className="p-4 text-sm">Loading callouts…</div>;
  if (error) return <div className="p-4 text-sm">Failed to load callouts</div>;

  // -----------------------------
  // Calendar grid helpers
  // -----------------------------
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth(); // 0-11
  const startOfMonth = new Date(year, month, 1);

  // Start from Sunday of the first week that includes the 1st
  const calendarStart = new Date(startOfMonth);
  const startDay = calendarStart.getDay(); // 0 (Sun) - 6 (Sat)
  calendarStart.setDate(calendarStart.getDate() - startDay);

  // 6 weeks * 7 days = 42 cells
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
    // ✅ FULL WIDTH + RESPONSIVE PADDING (matches SRO page)
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
      {/* Header row: title + view toggle + clear filters + create button */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Callouts
        </h1>

        <div className="flex items-center justify-end gap-2">
          {/* View mode buttons */}
          <div
            className="
              inline-flex items-center gap-1
              rounded-full border border-slate-200 bg-white p-1 text-xs
              dark:border-slate-700 dark:bg-slate-900
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
              rounded-full border border-slate-200 bg-white p-2
              text-slate-500 hover:bg-slate-100 hover:text-slate-700
              dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300
              dark:hover:bg-slate-800 dark:hover:text-slate-100
              transition
            "
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Clear filters</span>
          </button>

          {/* Create Callout button */}
          <button
            onClick={() => navigate("/callouts/new")}
            className="
              px-3 py-2 rounded text-sm
              bg-slate-900 text-white
              dark:bg-white dark:text-slate-900
              transition
            "
          >
            + Create Callout
          </button>
        </div>
      </div>

      {/* Filters / search / sort bar */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        {/* ✅ fixed invalid md:w-100 */}
        <div className="w-full md:max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by callout, rig, well, field, user…"
            className="
              w-full rounded-xl border border-slate-400 bg-white px-3 py-2 text-xs
              text-slate-900 placeholder:text-slate-400
              focus:outline-none focus:ring-1 focus:ring-slate-500
              dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100
              dark:placeholder:text-slate-500
            "
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap gap-2 justify-start md:justify-end text-xs">
          <div className="flex flex-1 min-w-[150px] items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400">From:</span>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className="
                flex-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5
                dark:bg-slate-900 dark:border-slate-700 cursor-pointer
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
                flex-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5
                dark:bg-slate-900 dark:border-slate-700 cursor-pointer
              "
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as
                  | "all"
                  | "draft"
                  | "locked"
                  | "sro_activated"
                  | "scheduled"
              )
            }
            className="
              min-w-[140px]
              rounded-xl border border-slate-200 bg-white px-2 py-1.5
              dark:bg-slate-900 dark:border-slate-700 cursor-pointer
            "
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="locked">Locked</option>
            <option value="sro_activated">SRO Activated</option>
            <option value="scheduled">Scheduled</option> {/* ✅ NEW */}
          </select>

          <select
            value={serviceFilter}
            onChange={(e) =>
              setServiceFilter(
                e.target.value as "all" | "wireline_gyro" | "memory_gyro"
              )
            }
            className="
              min-w-[140px]
              rounded-xl border border-slate-200 bg-white px-2 py-1.5
              dark:bg-slate-900 dark:border-slate-700 cursor-pointer
            "
          >
            <option value="all">All Services</option>
            <option value="wireline_gyro">Wireline gyro</option>
            <option value="memory_gyro">Memory gyro</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as
                  | "created_desc"
                  | "created_asc"
                  | "callout_asc"
                  | "callout_desc"
              )
            }
            className="
              min-w-[150px]
              rounded-xl border border-slate-200 bg-white px-2 py-1.5
              dark:bg-slate-900 dark:border-slate-700 cursor-pointer
            "
          >
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="callout_asc">Callout A → Z</option>
            <option value="callout_desc">Callout Z → A</option>
          </select>
        </div>
      </div>

      {/* CONTENT: table / card / calendar view */}
      {viewMode === "table" ? (
        <div className="rounded-2xl border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Callout Number
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Rig Number
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Well Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Field
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Service Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Created By
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Created At
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((c: any) => {
                  const statusStyles = getStatusStyles(c.status);

                  return (
                    <tr
                      key={c.id}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {c.callout_number ?? `CALL_OUT_${c.id}`}
                      </td>

                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {c.rig_number || "—"}
                      </td>

                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {c.well_name_display || "—"}
                      </td>

                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {c.field_name || "—"}
                      </td>

                      <td className="px-3 py-2 capitalize text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {c.service_category ? c.service_category.replace("_", " ") : "—"}
                      </td>

                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {c.created_by_username || "—"}
                      </td>

                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleString()}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        {(() => {
                          const st = getStatusStyles(c.status);
                          return (
                            <span className={st.badge}>
                              <span className={`${st.dot} ${st.pulse}`} />
                              <span className="capitalize">{prettyStatus(c.status)}</span>
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/callouts/${c.id}`)}
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
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/callouts/${c.id}/edit`)}
                            className="
                              inline-flex items-center justify-center
                              rounded-full p-1.5
                              bg-slate-100 text-slate-700
                              hover:bg-slate-800 hover:text-slate-50
                              dark:bg-slate-900 dark:text-slate-100
                              dark:hover:bg-slate-100 dark:hover:text-slate-900
                              transition
                            "
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
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
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                    >
                      No callouts match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c: any) => {
            const statusStyles = getStatusStyles(c.status);

            return (
              <div
                key={c.id}
                className="
                  rounded-2xl border border-slate-200 bg-white p-3 text-xs
                  shadow-sm hover:shadow-md transition
                  dark:border-slate-700 dark:bg-slate-950/60
                "
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Callout
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {c.callout_number ?? `CALL_OUT_${c.id}`}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Rig {c.rig_number || "—"}
                    </div>
                  </div>

                  <span
                    className={`
                      inline-flex items-center gap-1
                      px-2 py-1 rounded-full text-[10px] font-medium capitalize
                      ${statusStyles.badge}
                    `}
                  >
                    <span className={`h-2 w-2 rounded-full ${statusStyles.dot}`} />
                    <span>{String(c.status).replace("_", " ")}</span>
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400">Well:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {c.well_name_display || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400">Field:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {c.field_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400">Service:</span>
                    <span className="capitalize text-slate-800 dark:text-slate-100">
                      {c.service_category ? c.service_category.replace("_", " ") : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Created by
                    </div>
                    <div className="text-[11px] text-slate-800 dark:text-slate-100">
                      {c.created_by_username || "—"}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/callouts/${c.id}`)}
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
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/callouts/${c.id}/edit`)}
                      className="
                        inline-flex items-center justify-center
                        rounded-full p-1.5
                        bg-slate-100 text-slate-700
                        hover:bg-slate-800 hover:text-slate-50
                        dark:bg-slate-900 dark:text-slate-100
                        dark:hover:bg-slate-100 dark:hover:text-slate-900
                        transition
                      "
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
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
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="col-span-full px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No callouts match your filters.
            </div>
          )}
        </div>
      ) : (
        <div
          className="
            rounded-xl border shadow-sm
            bg-white dark:bg-slate-950/60
            border-slate-200 dark:border-slate-700
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
            <div className="font-semibold text-slate-800 dark:text-slate-100">
              {monthLabel}
            </div>
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
                    <span className="text-[11px] font-semibold">
                      {day.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((c: any) => {
                      const st = getStatusStyles(c.status);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => navigate(`/callouts/${c.id}`)}
                          className="
                            w-full text-left rounded-md px-1 py-0.5
                            text-[10px] truncate
                            bg-slate-100 text-slate-700 hover:bg-slate-200
                            dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700
                          "
                          title={c.callout_number || ""}
                        >
                          {c.callout_number ?? `CALL_OUT_${c.id}`}
                          <span className={`ml-2 inline-block ${st.dot} ${st.pulse}`} />
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-slate-400">
                        + {dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {rows.length === 0 && (
            <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No callouts match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
