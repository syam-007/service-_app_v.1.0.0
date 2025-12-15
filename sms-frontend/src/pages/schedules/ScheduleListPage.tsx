// src/pages/Schedules/ScheduleListPage.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Eye,
  Trash2,
  LayoutGrid,
  Rows3,
  CalendarDays,
} from "lucide-react";
import { useSchedules, useDeleteSchedule } from "../../api/schedules";

export function ScheduleListPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useSchedules();
  const deleteMutation = useDeleteSchedule();

  // -----------------------------
  // Local UI state: search / filters / view
  // -----------------------------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [viewMode, setViewMode] = useState<"table" | "card" | "calendar">(
    "table"
  );

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
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this schedule?")) {
      deleteMutation.mutate(id);
    }
  };

  // ✅ Safe handling for paginated or plain-array responses
  const schedules: any[] = Array.isArray((data as any)?.results)
    ? (data as any).results
    : Array.isArray(data)
    ? (data as any)
    : [];

  const statusOptions = useMemo(() => {
    return Array.from(new Set(schedules.map((s) => s.status))).filter(Boolean);
  }, [schedules]);

  // -----------------------------
  // Derived data: filtered + sorted
  // -----------------------------
  const rows = useMemo(() => {
    let result = [...schedules];

    // 🔍 search by schedule number / SRO / resource / equipment
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((sch) => {
        return (
          (sch.schedule_number || "").toLowerCase().includes(q) ||
          (sch.sro_number || "").toLowerCase().includes(q) ||
          (sch.resource || "").toLowerCase().includes(q) ||
          (sch.type_of_equipment || "").toLowerCase().includes(q)
        );
      });
    }

    // 📅 date filter (created_at)
    if (fromDate && !toDate) {
      // exact day
      const target = fromDate;
      result = result.filter((sch) => {
        if (!sch.created_at) return false;
        const created = new Date(sch.created_at);
        const createdStr = created.toISOString().slice(0, 10);
        return createdStr === target;
      });
    } else {
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        result = result.filter((sch) => {
          if (!sch.created_at) return false;
          const d = new Date(sch.created_at);
          return d.getTime() >= from.getTime();
        });
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        result = result.filter((sch) => {
          if (!sch.created_at) return false;
          const d = new Date(sch.created_at);
          return d.getTime() <= to.getTime();
        });
      }
    }

    // 🎯 status filter
    if (statusFilter !== "all") {
      result = result.filter((sch) => sch.status === statusFilter);
    }

    // ↕️ newest first
    result.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );

    return result;
  }, [schedules, search, fromDate, toDate, statusFilter]);

  // -----------------------------
  // Calendar: group by date (created_at)
  // -----------------------------
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    rows.forEach((sch) => {
      if (!sch.created_at) return;
      const d = new Date(sch.created_at);
      const key = d.toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(sch);
    });
    return map;
  }, [rows]);

  // -----------------------------
  // Loading / error
  // -----------------------------
  if (isLoading) return <div className="p-4 text-sm">Loading schedules…</div>;
  if (error) return <div className="p-4 text-sm">Failed to load schedules.</div>;

  // -----------------------------
  // Calendar grid helpers
  // -----------------------------
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth(); // 0-11
  const startOfMonth = new Date(year, month, 1);

  const calendarStart = new Date(startOfMonth);
  const startDay = calendarStart.getDay();
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
    // ✅ FULL WIDTH + RESPONSIVE PADDING
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
      {/* Header row */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Schedules
        </h1>

        <div className="flex items-center justify-end gap-2">
          {/* View toggle */}
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
              title="List view"
            >
              <LayoutGrid className="h-3 w-3 mr-1" />
              List
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

          {/* Clear filters */}
          <button
            type="button"
            onClick={handleClearFilters}
            title="Clear filters"
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
            <span className="sr-only">Clear filters</span>
          </button>

          <button
            onClick={() => navigate("/schedules/new")}
            className="
              px-3 py-2 rounded text-sm
              bg-slate-900 text-white
              dark:bg-white dark:text-slate-900
              transition
            "
          >
            + Create Schedule
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between text-xs">
        {/* Search */}
        {/* ✅ fixed invalid md:w-100 */}
        <div className="w-full md:max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by schedule #, SRO #, resource, equipment…"
            className="
              w-full rounded-xl border border-slate-400 bg-white px-3 py-2 text-xs
              text-slate-900 placeholder:text-slate-400
              focus:outline-none focus:ring-1 focus:ring-slate-500
              dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100
              dark:placeholder:text-slate-500
            "
          />
        </div>

        {/* Right filters */}
        <div className="w-full md:w-auto flex flex-wrap gap-2 justify-start md:justify-end">
          {/* From date */}
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

          {/* To date */}
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

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="
              min-w-[140px]
              rounded-xl border border-slate-200 bg-white px-2 py-1.5
              dark:bg-slate-900 dark:border-slate-700 cursor-pointer
            "
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {String(st).replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENT */}
      {viewMode === "table" ? (
        // -----------------------------
        // TABLE VIEW
        // -----------------------------
        <div className="rounded-2xl border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">
                    Schedule #
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">
                    SRO #
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">
                    Priority
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">
                    Difficulty
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">
                    Created at
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((sch: any) => (
                  <tr
                    key={sch.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">
                      {sch.schedule_number}
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {sch.sro_number ?? `SRO_${sch.sro}`}
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {sch.average_priority ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {sch.difficulty_score ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {String(sch.status || "—").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {sch.created_at
                        ? new Date(sch.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/schedules/${sch.id}`)}
                          className="
                            inline-flex items-center justify-center rounded-full p-1.5
                            bg-slate-100 text-slate-700
                            hover:bg-slate-800 hover:text-white
                            dark:bg-slate-900 dark:text-slate-100
                            dark:hover:bg-slate-100 dark:hover:text-slate-900
                            transition
                          "
                          title="View Schedule"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(sch.id)}
                          className="
                            inline-flex items-center justify-center rounded-full p-1.5
                            bg-slate-100 text-slate-700
                            hover:bg-slate-800 hover:text-white
                            dark:bg-slate-900 dark:text-slate-100
                            dark:hover:bg-slate-100 dark:hover:text-slate-900
                            transition
                          "
                          title="Delete Schedule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-4 text-center text-slate-500 dark:text-slate-400"
                    >
                      No schedules match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "card" ? (
        // -----------------------------
        // LIST / CARD VIEW
        // -----------------------------
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((sch: any) => (
            <div
              key={sch.id}
              className="
                rounded-2xl border border-slate-200 bg-white p-3 text-xs
                shadow-sm hover:shadow-md transition
                dark:border-slate-700 dark:bg-slate-900
              "
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Schedule
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {sch.schedule_number || `SCH_${sch.id}`}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    SRO {sch.sro_number ?? `SRO_${sch.sro}`}
                  </div>
                </div>

                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {String(sch.status || "—").replace("_", " ")}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Avg Priority:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {sch.average_priority ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Difficulty:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {sch.difficulty_score ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Resource:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 truncate">
                    {sch.resource ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Equipment:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 truncate">
                    {sch.type_of_equipment ?? "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Created at
                  </div>
                  <div className="text-[10px] text-slate-700 dark:text-slate-200">
                    {sch.created_at ? new Date(sch.created_at).toLocaleString() : "—"}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate(`/schedules/${sch.id}`)}
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
                    onClick={() => handleDelete(sch.id)}
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
          ))}

          {rows.length === 0 && (
            <div className="col-span-full px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No schedules match your filters.
            </div>
          )}
        </div>
      ) : (
        // -----------------------------
        // CALENDAR VIEW
        // -----------------------------
        <div
          className="
            rounded-xl border shadow-sm
            bg-white dark:bg-slate-900
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
              const isCurrentMonth = day.getMonth() === month;
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
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((sch: any) => (
                      <button
                        key={sch.id}
                        type="button"
                        onClick={() => navigate(`/schedules/${sch.id}`)}
                        className="
                          w-full text-left rounded-md px-1 py-0.5
                          text-[10px] truncate
                          bg-slate-100 text-slate-700 hover:bg-slate-200
                          dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700
                        "
                        title={sch.schedule_number || ""}
                      >
                        {sch.schedule_number || `SCH_${sch.id}`}
                      </button>
                    ))}

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
              No schedules match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
