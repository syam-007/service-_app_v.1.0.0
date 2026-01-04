// src/pages/Callouts/CalloutListPage.tsx
import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCallouts, useGenerateSro } from "../../api/callout";
import { useSros } from "../../api/sros";
import { useCreateSchedule, useEquipmentTypes, useResources } from "../../api/schedules";
import api from "../../api/axios";
import {
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  LayoutGrid,
  Rows3,
  CalendarDays,
  X,
  Search,
  AlertTriangle,
  Save,
  ExternalLink,
} from "lucide-react";

/* ---------------- Status styles ---------------- */

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
        pulse: "animate-pulse",
      };
    case "assigned":
      return {
        badge:
          base +
          " border-purple-200/70 text-purple-800 " +
          "bg-gradient-to-r from-purple-50/80 to-white/60 " +
          "dark:border-purple-900/50 dark:text-purple-200 dark:from-purple-950/40 dark:to-slate-950/40",
        dot: dotBase + " bg-purple-500",
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

/* ---------------- Page ---------------- */

export function CalloutListPage() {
  const navigate = useNavigate();

  // ✅ Callouts list (refetch is used after creating SRO / Schedule / Assign)
  const { data, isLoading, error, refetch } = useCallouts() as any;

  // ✅ Generate SRO mutation
  const { mutate: generateSro, isPending: isGeneratingAny } = useGenerateSro();
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  // ✅ Schedule modal state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleSroId, setScheduleSroId] = useState<number | null>(null);

  // ✅ Assign modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignScheduleId, setAssignScheduleId] = useState<number | null>(null);

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "locked" | "sro_activated" | "scheduled" | "assigned"
  >("all");
  const [serviceFilter, setServiceFilter] = useState<"all" | "wireline_gyro" | "memory_gyro">("all");
  const [sortBy, setSortBy] = useState<"created_desc" | "created_asc" | "callout_asc" | "callout_desc">(
    "created_desc"
  );
  const [viewMode, setViewMode] = useState<"table" | "card" | "calendar">("table");

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
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
    if (value && toDate && new Date(toDate) < new Date(value)) setToDate(value);
  };

  const handleToDateChange = (value: string) => {
    if (fromDate && value && new Date(value) < new Date(fromDate)) {
      setToDate(fromDate);
    } else setToDate(value);
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

  // ----- Callout SRO + Schedule helpers -----
  const getSroIdFromCallout = (c: any): number | null => c?.sro_id ?? (c?.sro && c.sro.id) ?? null;

  const getScheduleIdFromCallout = (c: any): number | null =>
    c?.schedule_id ??
    (c?.schedule && c.schedule.id) ??
    (c?.sro && c.sro.schedule_id) ??
    (c?.sro && c.sro.schedule && c.sro.schedule.id) ??
    null;

  const hasSro = (c: any) => !!getSroIdFromCallout(c) || !!c?.has_sro || !!c?.sro_number || !!c?.sro;

  const handleCreateSroFromList = (calloutId: number) => {
    setGeneratingId(calloutId);

    generateSro(calloutId, {
      onSuccess: async (created: any) => {
        const newSroId = created?.id ?? created?.sro_id ?? created?.sro?.id ?? null;

        if (typeof refetch === "function") {
          try {
            await refetch();
          } catch {
            // ignore
          }
        }

        if (newSroId) navigate(`/sros/${newSroId}`);
      },
      onSettled: () => setGeneratingId(null),
    });
  };

  const openSchedulePopup = (callout: any) => {
    const sroId = getSroIdFromCallout(callout);
    if (!sroId) return;
    setScheduleSroId(sroId);
    setScheduleOpen(true);
  };

  const openAssignPopup = (callout: any) => {
    const scheduleId = getScheduleIdFromCallout(callout);
    if (!scheduleId) return;
    setAssignScheduleId(scheduleId);
    setAssignOpen(true);
  };

  // ✅ NEW: Handle Generate Job button
  const handleGenerateJob = (callout: any) => {
    // Open survey website in new tab
    window.open("https://survey.task.energy/login", "_blank");
    
    // Optional: You could update the callout status to "job_generated"
    // You would need to create an API endpoint for this
    // handleUpdateCalloutStatus(callout.id, "job_generated");
  };

  // base rows (support paginated or raw array)
  const callouts: any[] = Array.isArray((data as any)?.results)
    ? (data as any).results
    : Array.isArray(data)
    ? (data as any)
    : [];

  const rows = useMemo(() => {
    let result = [...callouts];

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

    if (fromDate && !toDate) {
      const target = fromDate;
      result = result.filter((c) => {
        if (!c.created_at) return false;
        const created = new Date(c.created_at);
        return created.toISOString().slice(0, 10) === target;
      });
    } else {
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        result = result.filter((c) => {
          if (!c.created_at) return false;
          return new Date(c.created_at).getTime() >= from.getTime();
        });
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        result = result.filter((c) => {
          if (!c.created_at) return false;
          return new Date(c.created_at).getTime() <= to.getTime();
        });
      }
    }

    if (statusFilter !== "all") result = result.filter((c) => c.status === statusFilter);
    if (serviceFilter !== "all") result = result.filter((c) => c.service_category === serviceFilter);

    result.sort((a, b) => {
      switch (sortBy) {
        case "created_asc":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "created_desc":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "callout_asc":
          return (a.callout_number || "").localeCompare(b.callout_number || "");
        case "callout_desc":
          return (b.callout_number || "").localeCompare(a.callout_number || "");
        default:
          return 0;
      }
    });

    return result;
  }, [callouts, search, fromDate, toDate, statusFilter, serviceFilter, sortBy]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof rows> = {};
    rows.forEach((c: any) => {
      if (!c.created_at) return;
      const d = new Date(c.created_at);
      const key = d.toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [rows]);

  if (isLoading) return <div className="p-4 text-sm">Loading callouts…</div>;
  if (error) return <div className="p-4 text-sm">Failed to load callouts</div>;

  // calendar helpers
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
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

  const monthLabel = calendarMonth.toLocaleDateString(undefined, { year: "numeric", month: "long" });

  return (
    <>
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
                  Callout Management
                </h1>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Browse, filter, and manage callout records.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                {/* View toggle */}
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/70 p-1 text-xs dark:border-slate-700 dark:bg-slate-950/60 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`inline-flex items-center rounded-full px-2 py-1 ${
                      viewMode === "table"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                    title="Table view"
                  >
                    <Rows3 className="h-3 w-3 mr-1" />
                    Table
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className={`inline-flex items-center rounded-full px-2 py-1 ${
                      viewMode === "card"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                    title="Card view"
                  >
                    <LayoutGrid className="h-3 w-3 mr-1" />
                    Card
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("calendar")}
                    className={`inline-flex items-center rounded-full px-2 py-1 ${
                      viewMode === "calendar"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
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
                  className="inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-white/70 p-2 text-xs text-slate-500 hover:bg-white hover:text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100 backdrop-blur transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Clear filters</span>
                </button>

                {/* Create */}
                <button
                  onClick={() => navigate("/callouts/new")}
                  className="px-3 py-2 rounded-full text-xs font-medium bg-slate-900 text-white shadow-sm hover:shadow hover:bg-slate-800 active:scale-[0.99] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
                >
                  + Create Callout
                </button>
              </div>
            </div>

            {/* FILTERS */}
            <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between text-xs">
              <div className="w-full md:max-w-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by callout, rig, well, field, user…"
                  className="w-full rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-950/60 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 backdrop-blur"
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
                    className="flex-1 rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5 dark:bg-slate-950/60 dark:border-slate-700 cursor-pointer backdrop-blur"
                  />
                </div>

                <div className="flex flex-1 min-w-[150px] items-center gap-1">
                  <span className="text-slate-500 dark:text-slate-400">To:</span>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5 dark:bg-slate-950/60 dark:border-slate-700 cursor-pointer backdrop-blur"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "draft" | "locked" | "sro_activated" | "scheduled" | "assigned"
                    )
                  }
                  className="min-w-[150px] rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5 dark:bg-slate-950/60 dark:border-slate-700 cursor-pointer backdrop-blur"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="locked">Locked</option>
                  <option value="sro_activated">SRO Activated</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="assigned">Assigned</option>
                </select>

                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value as "all" | "wireline_gyro" | "memory_gyro")}
                  className="min-w-[160px] rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5 dark:bg-slate-950/60 dark:border-slate-700 cursor-pointer backdrop-blur"
                >
                  <option value="all">All Services</option>
                  <option value="wireline_gyro">Wireline gyro</option>
                  <option value="memory_gyro">Memory gyro</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "created_desc" | "created_asc" | "callout_asc" | "callout_desc")
                  }
                  className="min-w-[160px] rounded-xl border border-slate-200/70 bg-white/70 px-2 py-1.5 dark:bg-slate-950/60 dark:border-slate-700 cursor-pointer backdrop-blur"
                >
                  <option value="created_desc">Newest first</option>
                  <option value="created_asc">Oldest first</option>
                  <option value="callout_asc">Callout A → Z</option>
                  <option value="callout_desc">Callout Z → A</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {viewMode === "table" ? (
          <div className="rounded-2xl border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950/60 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="max-h-[70vh] overflow-y-auto">
                <table className="min-w-[1250px] w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-slate-500 text-center">Customer</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Well Name</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Rig Number</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Service Type</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Field</th>

                      {/* ✅ SERVICE COLUMN */}
                      <th className="px-4 py-2 text-center font-medium text-slate-500">Service</th>

                      <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                      <th className="px-4 py-2 text-center font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {rows.map((c: any) => {
                      const st = getStatusStyles(c.status);
                      const sroId = getSroIdFromCallout(c);
                      const scheduleId = getScheduleIdFromCallout(c);
                      const rowIsGenerating = generatingId === c.id;

                      const statusLower = String(c.status || "").toLowerCase();
                      const isSroActivated = statusLower === "sro_activated" && !!sroId;
                      const isScheduled = statusLower === "scheduled" && !!scheduleId;
                      const isAssigned = statusLower === "assigned";

                      return (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="px-4 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap text-center">
                            {c.customer_name ?? `CALL_OUT_${c.id}`}
                          </td>

                          <td className="px-4 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {c.well_name_display || "—"}
                          </td>

                          <td className="px-4 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              {c.rig_number_display || "—"}
                          </td>

                          <td className="px-4 py-2 capitalize text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {c.service_category ? c.service_category.replace("_", " ") : "—"}
                          </td>

                          <td className="px-4 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {c.field_name_display || "—"}
                          </td>

                          {/* ✅ SERVICE BUTTON COLUMN */}
                          <td className="px-4 py-2 text-center whitespace-nowrap">
                            {/* 1) No SRO yet -> Create SRO */}
                            {!hasSro(c) ? (
                              <button
                                type="button"
                                onClick={() => handleCreateSroFromList(Number(c.id))}
                                disabled={rowIsGenerating || isGeneratingAny}
                                className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                                title="Create SRO"
                              >
                                {rowIsGenerating ? "Creating…" : "Create SRO"}
                              </button>
                            ) : isSroActivated ? (
                              /* 2) SRO Activated -> Schedule Service (popup) */
                              <button
                                type="button"
                                onClick={() => openSchedulePopup(c)}
                                className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 transition"
                                title="Schedule the service"
                              >
                                Schedule Service
                              </button>
                            ) : isScheduled ? (
                              /* 3) Scheduled -> Assign Service (popup) */
                              <button
                                type="button"
                                onClick={() => openAssignPopup(c)}
                                className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition"
                                title="Assign service"
                              >
                                Assign Service
                              </button>
                            ) : isAssigned ? (
                              /* ✅ 4) NEW: Assigned -> Generate Job (opens survey website) */
                              <button
                                type="button"
                                onClick={() => handleGenerateJob(c)}
                                className="inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium border border-purple-600 bg-purple-600 text-white hover:bg-purple-700 dark:border-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400 transition"
                                title="Generate Job and open survey portal"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Generate Job
                              </button>
                            ) : (
                              /* 5) Otherwise -> Go to SRO */
                              <button
                                type="button"
                                onClick={() => sroId && navigate(`/sros/${sroId}`)}
                                className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
                                title="Go to SRO"
                                disabled={!sroId}
                              >
                                Go to SRO →
                              </button>
                            )}
                          </td>

                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={st.badge}>
                              <span className={`${st.dot} ${st.pulse}`} />
                              <span className="capitalize">{prettyStatus(c.status)}</span>
                            </span>
                          </td>

                          <td className="px-4 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <IconAction title="View" onClick={() => navigate(`/service/callouts/${c.id}`)}>
                                <Eye className="h-4 w-4" />
                              </IconAction>

                              <IconAction title="Edit" onClick={() => navigate(`/service/callouts/${c.id}/edit`)}>
                                <Pencil className="h-4 w-4" />
                              </IconAction>

                              <IconAction title="Delete" onClick={() => handleDelete(c.id)}>
                                <Trash2 className="h-4 w-4" />
                              </IconAction>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                        >
                          No callouts match your filters.
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
              {rows.map((c: any) => {
                const st = getStatusStyles(c.status);
                const sroId = getSroIdFromCallout(c);
                const scheduleId = getScheduleIdFromCallout(c);
                const rowIsGenerating = generatingId === c.id;

                const statusLower = String(c.status || "").toLowerCase();
                const isSroActivated = statusLower === "sro_activated" && !!sroId;
                const isScheduled = statusLower === "scheduled" && !!scheduleId;
                const isAssigned = statusLower === "assigned";

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm hover:shadow-md transition dark:border-slate-700 dark:bg-slate-950/60"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Callout</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {c.callout_number ?? `CALL_OUT_${c.id}`}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Rig {c.rig_number || "—"}
                        </div>
                      </div>

                      <span className={st.badge}>
                        <span className={`${st.dot} ${st.pulse}`} />
                        <span className="capitalize">{prettyStatus(c.status)}</span>
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      <Row label="Well" value={c.well_name_display || "—"} />
                      <Row label="Field" value={c.field_name || "—"} />
                      <Row
                        label="Service"
                        value={c.service_category ? c.service_category.replace("_", " ") : "—"}
                        capitalize
                      />
                    </div>

                    {/* ✅ CARD: same Service button logic */}
                    <div className="mb-3 flex justify-end">
                      {!hasSro(c) ? (
                        <button
                          type="button"
                          onClick={() => handleCreateSroFromList(Number(c.id))}
                          disabled={rowIsGenerating || isGeneratingAny}
                          className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          {rowIsGenerating ? "Creating…" : "Create SRO"}
                        </button>
                      ) : isSroActivated ? (
                        <button
                          type="button"
                          onClick={() => openSchedulePopup(c)}
                          className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 transition"
                        >
                          Schedule Service
                        </button>
                      ) : isScheduled ? (
                        <button
                          type="button"
                          onClick={() => openAssignPopup(c)}
                          className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition"
                        >
                          Assign Service
                        </button>
                      ) : isAssigned ? (
                        <button
                          type="button"
                          onClick={() => handleGenerateJob(c)}
                          className="inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium border border-purple-600 bg-purple-600 text-white hover:bg-purple-700 dark:border-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Generate Job
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sroId && navigate(`/sros/${sroId}`)}
                          className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
                          disabled={!sroId}
                        >
                          Go to SRO →
                        </button>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Created by</div>
                        <div className="text-[11px] text-slate-800 dark:text-slate-100">
                          {c.created_by_username || "—"}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {c.created_at ? new Date(c.created_at).toLocaleString() : "—"}
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2">
                        <IconAction title="View" onClick={() => navigate(`/service/callouts/${c.id}`)}>
                          <Eye className="h-4 w-4" />
                        </IconAction>
                        <IconAction title="Edit" onClick={() => navigate(`/service/callouts/${c.id}/edit`)}>
                          <Pencil className="h-4 w-4" />
                        </IconAction>
                        <IconAction title="Delete" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </IconAction>
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
          </div>
        ) : (
          /* calendar view unchanged */
          <div className="rounded-xl border shadow-sm bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-700 p-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="px-2 py-1 rounded border border-slate-200 text-slate-600 text-[11px] hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                ← Prev
              </button>
              <div className="font-semibold text-slate-800 dark:text-slate-100">{monthLabel}</div>
              <button
                type="button"
                onClick={goToNextMonth}
                className="px-2 py-1 rounded border border-slate-200 text-slate-600 text-[11px] hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
                    className={`min-h-[70px] rounded-lg border px-1.5 pt-1 pb-1 flex flex-col gap-1 ${
                      isCurrentMonth
                        ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        : "border-slate-100 bg-slate-50/60 text-slate-400 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold">{day.getDate()}</span>
                      {dayEvents.length > 0 && <span className="text-[10px] text-slate-400">{dayEvents.length}</span>}
                    </div>

                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((c: any) => {
                        const st = getStatusStyles(c.status);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => navigate(`/service/callouts/${c.id}`)}
                            className="w-full text-left rounded-md px-1 py-0.5 text-[10px] truncate bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                            title={c.callout_number || ""}
                          >
                            {c.callout_number ?? `CALL_OUT_${c.id}`}
                            <span className={`ml-2 inline-block ${st.dot} ${st.pulse}`} />
                          </button>
                        );
                      })}

                      {dayEvents.length > 3 && <div className="text-[10px] text-slate-400">+ {dayEvents.length - 3} more</div>}
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

      {/* ✅ POPUP MODAL: Schedule Service */}
      <ScheduleServiceModal
        open={scheduleOpen}
        sroId={scheduleSroId}
        onClose={() => {
          setScheduleOpen(false);
          setScheduleSroId(null);
        }}
        onCreated={async (scheduleId) => {
          if (typeof refetch === "function") {
            try {
              await refetch();
            } catch {}
          }
          setScheduleOpen(false);
          setScheduleSroId(null);
        }}
      />

      {/* ✅ POPUP MODAL: Assign Service */}
      <AssignServiceModal
        open={assignOpen}
        scheduleId={assignScheduleId}
        onClose={() => {
          setAssignOpen(false);
          setAssignScheduleId(null);
        }}
        onCreated={async () => {
          if (typeof refetch === "function") {
            try {
              await refetch();
            } catch {}
          }
          setAssignOpen(false);
          setAssignScheduleId(null);
        }}
      />
    </>
  );
}

/* ---------------- Modal: Schedule Service ---------------- */

function ScheduleServiceModal({
  open,
  sroId,
  onClose,
  onCreated,
}: {
  open: boolean;
  sroId: number | null;
  onClose: () => void;
  onCreated: (scheduleId: number) => void;
}) {
  const { data: sros } = useSros();
  const createMutation = useCreateSchedule();
  const { data: equipmentTypes = [] } = useEquipmentTypes();
  const { data: resources = [] } = useResources();

  const initialSroId = sroId ? String(sroId) : "";
  const [sroIdState, setSroIdState] = useState<string>(initialSroId);

  const [financePriority, setFinancePriority] = useState<string>("");
  const [operationsPriority, setOperationsPriority] = useState<string>("");
  const [qaPriority, setQaPriority] = useState<string>("");

  const [highTemp, setHighTemp] = useState<"yes" | "no" | "">("");
  const [pressureRisk, setPressureRisk] = useState<"yes" | "no" | "">("");
  const [hseRisk, setHseRisk] = useState<"yes" | "no" | "">("");
  const [difficultyScore, setDifficultyScore] = useState<string>("");

  const [equipmentTypeId, setEquipmentTypeId] = useState<string>("");
  const [resourceId, setResourceId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");

  const [status, setStatus] = useState<"draft" | "planned" | "approved" | "cancelled">("draft");

  useEffect(() => {
    setSroIdState(initialSroId);
  }, [initialSroId, open]);

  const selectableSros = useMemo(() => {
    const list = (sros as any[] | undefined) ?? [];
    return list.filter((sro) => String(sro.status).toLowerCase() === "approved");
  }, [sros]);

  useEffect(() => {
    if (!initialSroId) return;
    const exists = selectableSros.some((sro) => String(sro.id) === initialSroId);
    if (!exists) setSroIdState("");
  }, [initialSroId, selectableSros]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sroIdState) return alert("Please select an SRO");

    createMutation.mutate(
      {
        sro: Number(sroIdState),
        finance_priority: financePriority ? Number(financePriority) : null,
        operations_priority: operationsPriority ? Number(operationsPriority) : null,
        qa_priority: qaPriority ? Number(qaPriority) : null,
        high_temp: highTemp === "" ? null : highTemp === "yes",
        pressure_risk: pressureRisk === "" ? null : pressureRisk === "yes",
        hse_risk: hseRisk === "" ? null : hseRisk === "yes",
        difficulty_score: difficultyScore ? Number(difficultyScore) : null,
        type_of_equipment: equipmentTypeId ? Number(equipmentTypeId) : null,
        resource: resourceId ? Number(resourceId) : null,
        scheduled_date: scheduledDate || null,
        status,
      } as any,
      {
        onSuccess: (created: any) => {
          const id = created?.id;
          if (id) onCreated(Number(id));
          else onClose();
        },
      }
    );
  };

  const priorityOptions = [1, 2, 3, 4, 5];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" aria-modal="true" role="dialog">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-[min(920px,calc(100vw-24px))] max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-70" />

        <div className="relative flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">Schedule Service</h2>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Create a schedule for this SRO.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-2 border border-slate-200/70 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100 transition"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-72px)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-4 backdrop-blur"
          >
            <div>
              <label className="block mb-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">SRO</label>
              <select
                value={sroIdState}
                onChange={(e) => setSroIdState(e.target.value)}
                disabled={!!initialSroId}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              >
                <option value="">Select an SRO…</option>
                {selectableSros.map((sro: any) => (
                  <option key={sro.id} value={sro.id}>
                    {sro.sro_number} – {sro.callout_number}
                  </option>
                ))}
              </select>

              {!!initialSroId && !sroIdState && (
                <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-300">
                  This SRO is not approved, so it can't be scheduled.
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">Scheduled date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Priority (1–5)
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">Finance</label>
                <select
                  value={financePriority}
                  onChange={(e) => setFinancePriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">—</option>
                  {priorityOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">Operations</label>
                <select
                  value={operationsPriority}
                  onChange={(e) => setOperationsPriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">—</option>
                  {priorityOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">Q/A</label>
                <select
                  value={qaPriority}
                  onChange={(e) => setQaPriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">—</option>
                  {priorityOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Complexity
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">High Temp</label>
                <select
                  value={highTemp}
                  onChange={(e) => setHighTemp(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">Pressure Risk</label>
                <select
                  value={pressureRisk}
                  onChange={(e) => setPressureRisk(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">HSE Risk</label>
                <select
                  value={hseRisk}
                  onChange={(e) => setHseRisk(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">Difficulty score (1–5)</label>
                <select
                  value={difficultyScore}
                  onChange={(e) => setDifficultyScore(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">—</option>
                  {priorityOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="draft">Draft</option>
                  <option value="planned">Planned</option>
                  <option value="approved">Approved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">Type of equipment</label>
                <select
                  value={equipmentTypeId}
                  onChange={(e) => setEquipmentTypeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">—</option>
                  {(equipmentTypes as any[]).map((et: any) => (
                    <option key={et.id} value={et.id}>
                      {et.equipment_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">Resource</label>
                <select
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">—</option>
                  {(resources as any[]).map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.resource_name ?? r.resouce_name ?? r.name ?? `Resource ${r.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createMutation.isPending || !sroIdState}
                className="px-3 py-2 rounded-xl text-xs bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {createMutation.isPending ? "Creating…" : "Create Schedule"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Modal: Assign Service ---------------- */

type AssignedServiceStatus = "pending" | "assigned" | "completed" | "cancelled";
type Employee = { id: number; emp_number?: string; name?: string };
type Asset = { id: number; asset_code: string; status: string; cost_center?: string | null };
type Schedule = { id: number; schedule_number: string; scheduled_date: string; status: string; sro_number?: string };

function AssignServiceModal({
  open,
  scheduleId,
  onClose,
  onCreated,
}: {
  open: boolean;
  scheduleId: number | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  // ✅ form
  const [status, setStatus] = useState<AssignedServiceStatus>("assigned");
  const [note, setNote] = useState("");

  // ✅ required date/time fields
  const [equipmentRequiredAt, setEquipmentRequiredAt] = useState("");
  const [crewRequiredAt, setCrewRequiredAt] = useState("");

  // ✅ multi-employee selection
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  // ✅ schedule info
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

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

  // ✅ helper function to load the specific schedule
  const loadSelectedSchedule = async () => {
    if (!scheduleId) return;
    
    setSchedulesLoading(true);
    setSchedulesError(null);
    try {
      // Try to fetch just this schedule
      const res = await api.get(`/schedules/${scheduleId}/`);
      const scheduleData = res.data;
      
      if (scheduleData) {
        setSchedules([{
          id: scheduleData.id,
          schedule_number: scheduleData.schedule_number || `Schedule ${scheduleData.id}`,
          scheduled_date: scheduleData.scheduled_date || new Date().toISOString(),
          status: scheduleData.status || 'approved',
          sro_number: scheduleData.sro_number
        }]);
      }
    } catch (err: any) {
      // Fallback: try the approved-schedules endpoint
      try {
        const res = await api.get("/assigned-services/approved-schedules/");
        const allSchedules = Array.isArray(res.data) ? res.data : [];
        const filteredSchedule = allSchedules.find(s => s.id === scheduleId);
        
        if (filteredSchedule) {
          setSchedules([filteredSchedule]);
        } else {
          // Last fallback: create a minimal schedule object
          setSchedules([{
            id: scheduleId,
            schedule_number: `Schedule ${scheduleId}`,
            scheduled_date: new Date().toISOString(),
            status: 'approved',
            sro_number: null
          }]);
        }
      } catch (fallbackErr: any) {
        // Even if both fail, create a minimal schedule object
        setSchedules([{
          id: scheduleId,
          schedule_number: `Schedule ${scheduleId}`,
          scheduled_date: new Date().toISOString(),
          status: 'approved',
          sro_number: null
        }]);
        setSchedulesError("Could not load schedule details, but you can still proceed.");
      }
    } finally {
      setSchedulesLoading(false);
    }
  };

  // reset when open changes
  useEffect(() => {
    if (!open) return;
    
    // Reset all form fields
    setSelectedEmployeeIds([]);
    setStatus("assigned");
    setNote("");
    setEquipmentRequiredAt("");
    setCrewRequiredAt("");
    setSelectedCostCenters([]);
    setCostCenterSearch("");
    setAssets([]);
    setAssetsError(null);
    setAssetSearch("");
    setError(null);
    
    // Load the specific schedule
    loadSelectedSchedule();
    
    // Load employees
    (async () => {
      try {
        const res = await api.get("/employees/");
        setEmployees(res.data?.results ?? res.data ?? []);
      } catch {
        setEmployees([]);
      }
    })();

    // Load green cost centers
    (async () => {
      try {
        const res = await api.get("/assets/green-cost-centers/");
        const list: string[] = (res.data ?? []).filter(Boolean);
        setAllCostCenters(list);
      } catch {
        setAllCostCenters([]);
      }
    })();
  }, [open, scheduleId]);

  const filteredCostCenters = useMemo(() => {
    const q = costCenterSearch.trim().toLowerCase();
    if (!q) return allCostCenters;
    return allCostCenters.filter((cc) => cc.toLowerCase().includes(q));
  }, [allCostCenters, costCenterSearch]);

  // auto load assets when CC changes
  useEffect(() => {
    if (!open) return;

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
        setAssetsError(err?.response?.data?.detail || "Failed to load assets for selected cost centers.");
      } finally {
        if (myReqId === requestIdRef.current) setAssetsLoading(false);
      }
    };

    loadAssets();
  }, [open, selectedCostCenters]);

  const toggleCostCenter = (cc: string) => {
    setSelectedCostCenters((prev) => (prev.includes(cc) ? prev.filter((x) => x !== cc) : [...prev, cc]));
  };

  const selectAllFiltered = () => {
    setSelectedCostCenters((prev) => {
      const set = new Set(prev);
      filteredCostCenters.forEach((cc) => set.add(cc));
      return Array.from(set);
    });
  };

  const clearAll = () => {
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

  // ✅ helper: manually reload assets
  const loadAssetsManually = async () => {
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
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!scheduleId) return setError("Schedule is missing.");
    if (selectedEmployeeIds.length === 0) return setError("Select at least one employee.");
    if (!status) return setError("Assigned service status is required.");
    if (selectedCostCenters.length === 0) return setError("Select at least one cost center.");

    setLoading(true);
    try {
      await api.post("/assigned-services/", {
        schedule: scheduleId,
        // ✅ NEW: employees array for backend serializer
        employees: selectedEmployeeIds,
        status,
        cost_centers: selectedCostCenters,
        note: note || undefined,
        // ✅ NEW: required times
        equipment_required_at: toIsoOrNull(equipmentRequiredAt),
        crew_required_at: toIsoOrNull(crewRequiredAt),
      });

      onCreated();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || JSON.stringify(err?.response?.data || {}) || "Failed to create assigned service";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" aria-modal="true" role="dialog">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-[min(1200px,calc(100vw-24px))] max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-70" />

        <div className="relative flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">Assign Service</h2>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Pick an approved schedule, select employees & cost centers, then submit.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-2 border border-slate-200/70 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100 transition"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-72px)]">
          {error && (
            <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div className="whitespace-pre-wrap">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="grid gap-3 lg:grid-cols-3">
            {/* LEFT COLUMN - Basic Info */}
            <div className="space-y-3 lg:col-span-1">
              <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 backdrop-blur shadow-sm">
                <div className="space-y-3 text-xs">
                  {/* Approved schedule - Auto-selected */}
                  <div>
                    <label className="block mb-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Approved Scheduled Service <span className="text-rose-500">*</span>
                    </label>
                    
                    {schedulesLoading ? (
                      <div className={`${inputClassName} flex items-center justify-center`}>
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span className="text-slate-400">Loading schedule #{scheduleId}...</span>
                        </div>
                      </div>
                    ) : schedules.length > 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700">
                        {schedules.map((s) => (
                          <div key={s.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-slate-900 dark:text-slate-50">
                                Schedule #{s.schedule_number}
                              </div>
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                                s.status === 'approved' 
                                  ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200'
                                  : s.status === 'planned'
                                  ? 'border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-800/60 dark:bg-blue-900/30 dark:text-blue-200'
                                  : 'border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-200'
                              }`}>
                                {String(s.status).replaceAll('_', ' ')}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="space-y-0.5">
                                <div className="text-slate-500 dark:text-slate-400">Scheduled Date</div>
                                <div className="font-medium text-slate-700 dark:text-slate-200">
                                  {new Date(s.scheduled_date).toLocaleDateString()}
                                </div>
                              </div>
                              
                              <div className="space-y-0.5">
                                <div className="text-slate-500 dark:text-slate-400">Time</div>
                                <div className="font-medium text-slate-700 dark:text-slate-200">
                                  {new Date(s.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                            
                            {s.sro_number && (
                              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Linked SRO</div>
                                <div className="font-medium text-slate-700 dark:text-slate-200">
                                  {s.sro_number}
                                </div>
                              </div>
                            )}
                            
                            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 italic">
                              Auto-selected from callout
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : scheduleId ? (
                      <div className={`${inputClassName} flex items-center justify-center`}>
                        <div className="text-center space-y-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-50">
                            Schedule #{scheduleId}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                            (Schedule details not available)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`${inputClassName} flex items-center justify-center`}>
                        <span className="text-slate-400">No schedule selected</span>
                      </div>
                    )}

                    {schedulesError && !schedulesLoading && (
                      <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
                        ⚠️ {schedulesError}
                      </div>
                    )}
                  </div>

                  {/* Employees (multi) */}
                  <div>
                    <label className="block mb-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Employees <span className="text-rose-500">*</span>
                    </label>
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
                      <div className="max-h-[180px] overflow-auto p-2">
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
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block mb-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Assigned Service Status <span className="text-rose-500">*</span>
                    </label>
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
                        {String(status).replaceAll('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Required times */}
                  <div>
                    <label className="block mb-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Equipment required date & time
                    </label>
                    <input
                      type="datetime-local"
                      value={equipmentRequiredAt}
                      onChange={(e) => setEquipmentRequiredAt(e.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                      Crew required date & time
                    </label>
                    <input
                      type="datetime-local"
                      value={crewRequiredAt}
                      onChange={(e) => setCrewRequiredAt(e.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block mb-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">Note</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      placeholder="Optional note…"
                      className={`${inputClassName} resize-none`}
                    />
                  </div>
                </div>
              </section>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium bg-slate-900 text-white shadow-sm hover:shadow hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Creating..." : "Create Assigned Service"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium border border-slate-200/70 bg-white/70 text-slate-700 hover:bg-white hover:shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-slate-900 transition"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>

            {/* MIDDLE COLUMN: COST CENTERS */}
            <div className="space-y-3 lg:col-span-1">
              <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 backdrop-blur shadow-sm">
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

                  <button type="button" onClick={selectAllFiltered} className={miniButton}>
                    Select all
                  </button>

                  <button type="button" onClick={clearAll} className={miniButton}>
                    Clear
                  </button>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Selected: <span className="font-semibold">{selectedCostCenters.length}</span>
                  </span>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-white/60 dark:bg-slate-950/40 dark:border-slate-800 overflow-hidden">
                  <div className="max-h-[320px] overflow-auto p-2">
                    {filteredCostCenters.length === 0 ? (
                      <div className="p-2 text-xs text-slate-500 dark:text-slate-400">No GREEN cost centers found.</div>
                    ) : (
                      <div className="space-y-1">
                        {filteredCostCenters.map((cc) => {
                          const checked = selectedCostCenters.includes(cc);
                          return (
                            <label
                              key={cc}
                              className={`flex items-center gap-2 rounded-xl px-2 py-2 cursor-pointer ${
                                checked
                                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-900"
                              } transition`}
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
              </section>
            </div>

            {/* RIGHT COLUMN: ASSETS */}
            <div className="space-y-3 lg:col-span-1">
              <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 backdrop-blur shadow-sm">
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
                {assetsError && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
                    {assetsError}
                  </div>
                )}

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
              </section>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Helper Functions for AssignServiceModal ---------------- */

const miniIconButton = `
  inline-flex items-center justify-center rounded-xl
  border border-slate-200 bg-white p-2 text-slate-600
  hover:bg-slate-100
  disabled:opacity-60 disabled:cursor-not-allowed
  dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
  dark:hover:bg-slate-800
  transition
`;

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

/* ---------------- Small UI helpers ---------------- */

function IconAction({
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
      className="inline-flex items-center justify-center rounded-full p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-100 dark:hover:text-slate-900 transition"
    >
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400">{label}:</span>
      <span className={`font-medium text-slate-800 dark:text-slate-100 truncate ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}

/* ---------------- Shared classes ---------------- */

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