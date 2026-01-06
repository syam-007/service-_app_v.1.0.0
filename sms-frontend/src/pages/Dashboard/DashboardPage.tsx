// src/pages/Dashboard/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  LayoutDashboard,
  TrendingUp,
  Wrench,
  Users,
} from "lucide-react";

import { useGetDashboard } from "../../api/dashboards";

/** -----------------------------
 * Types
 * ------------------------------ */
type RangeType = "today" | "week" | "custom";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; className?: string }>;
  trend?: string;
  tone?: "positive" | "negative" | "neutral";
  animated?: boolean;
  suffix?: string; // e.g. "%" for utilization
};

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "neutral",
  animated = false,
  suffix,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<string | number>(value);

  useEffect(() => {
    if (!animated || typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    let frameId: number;
    const duration = 800;
    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const current = Math.round(value * progress);
      setDisplayValue(current);

      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, animated]);

  const trendColor =
    tone === "positive"
      ? "text-emerald-500"
      : tone === "negative"
      ? "text-rose-500"
      : "text-slate-500";

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon size={16} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          {typeof displayValue === "number"
            ? `${displayValue}${suffix ?? ""}`
            : displayValue}
        </span>
        {trend ? (
          <span className={`text-[11px] font-medium ${trendColor}`}>
            <TrendingUp size={12} className="inline-block mr-1 -mt-0.5" />
            {trend}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** -----------------------------
 * Status pill mapping (supports all backend statuses)
 * ------------------------------ */
function statusPill(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    // SRO statuses (from your model)
    created: {
      label: "Created",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    approved: {
      label: "Approved",
      className: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    },
    ready_for_scheduling: {
      label: "Ready",
      className: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    },
    scheduled: {
      label: "Scheduled",
      className: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    },
    assigned: {
      label: "Assigned",
      className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    },
    active: {
      label: "Active",
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    executed: {
      label: "Executed",
      className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
    qc_approved: {
      label: "QC Approved",
      className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    },
    closed: {
      label: "Closed",
      className: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    },

    // Your old dashboard mock statuses (kept as aliases)
    qc: {
      label: "QC Review",
      className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    },
  };

  return (
    map[status] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    }
  );
}

/** -----------------------------
 * Page
 * ------------------------------ */
export function DashboardPage() {
  const [range, setRange] = useState<RangeType>("today");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  // Display date text (UI only)
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    []
  );

  const dashboardQuery = useGetDashboard({
    range,
    start: range === "custom" ? customStart : undefined,
    end: range === "custom" ? customEnd : undefined,
  });

  const data = dashboardQuery.data;

  const totalPipeline = useMemo(() => {
    return (data?.pipeline ?? []).reduce((sum, s) => sum + (s.count ?? 0), 0);
  }, [data?.pipeline]);

  // Simple “trend” strings — replace once you add real “last month” comparisons in backend
  const totalCalloutsTrend = ""; // e.g. "+12% vs last month" (backend can return this later)

  if (dashboardQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading dashboard…
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
        Failed to load dashboard. Please check your API and authentication.
      </div>
    );
  }

  // Safe fallbacks
  const kpis = data?.kpis ?? {
    total_callouts: 0,
    active_sros: 0,
    scheduled_sros: 0,
    ready_for_scheduling: 0,
    jobs_in_range: 0,
    crew_utilization: 0,
  };

  const pipeline = data?.pipeline ?? [];
  const srosToday = data?.sros ?? [];
  const activity = data?.activity ?? [];

  // OPTIONAL: if your backend returns range dates, show them
  const rangeLabel =
    data?.start && data?.end ? `${data.start} → ${data.end}` : todayLabel;

  return (
    <div className="space-y-6">
      {/* Top row: title + quick filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
            <LayoutDashboard size={12} />
            Operations overview
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {range === "custom" ? rangeLabel : todayLabel}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setRange("today")}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                range === "today"
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
            >
              <CalendarRange size={14} />
              Today
            </button>

            <button
              type="button"
              onClick={() => setRange("week")}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                range === "week"
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
            >
              This week
            </button>

            <button
              type="button"
              onClick={() => setRange("custom")}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                range === "custom"
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
            >
              Custom
              <ChevronRight size={14} />
            </button>
          </div>

          {range === "custom" && (
            <div className="flex flex-wrap gap-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => dashboardQuery.refetch()}
                disabled={!customStart || !customEnd}
                className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Callouts"
          value={kpis.total_callouts}
          icon={Activity}
          trend={totalCalloutsTrend}
          tone="neutral"
          animated
        />

        <StatCard
          label="Active / Scheduled SROs"
          value={`${kpis.active_sros} / ${kpis.scheduled_sros}`}
          icon={Wrench}
          trend={`${kpis.ready_for_scheduling} ready for scheduling`}
          tone="neutral"
        />

        <StatCard
          label={range === "today" ? "Jobs today" : "Jobs in range"}
          value={kpis.jobs_in_range}
          icon={Clock}
          trend=""
          tone="neutral"
          animated
        />

        <StatCard
          label="Crew utilization"
          value={kpis.crew_utilization}
          suffix="%"
          icon={UsersIcon}
          trend=""
          tone="neutral"
          animated
        />
      </div>

      {/* Middle: pipeline + SROs/Jobs table */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pipeline + workload */}
        <div className="space-y-4 lg:col-span-1 dark:bg-slate-900/80">
          {/* Pipeline */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {range === "today" ? "Today's SRO pipeline" : "SRO pipeline"}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {totalPipeline} SRO(s) across lifecycle stages
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              {pipeline.length === 0 ? (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  No data for this range.
                </div>
              ) : (
                pipeline.map((stage) => {
                  const pill = statusPill(stage.status);
                  const percentage = totalPipeline
                    ? Math.round((stage.count / totalPipeline) * 100)
                    : 0;

                  return (
                    <div key={stage.status} className="flex items-center gap-3">
                      <span
                        className={`inline-flex min-w-[96px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold ${pill.className}`}
                      >
                        {pill.label}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {stage.count} SRO(s)
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {percentage}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-slate-900 dark:bg-slate-100"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Utilization & risk compact */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Crew utilization
                </span>
                {/* trend placeholder - make dynamic later */}
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  —
                </span>
              </div>

              <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {kpis.crew_utilization}%
              </div>

              <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(0, Math.min(100, kpis.crew_utilization))}%` }}
                />
              </div>

              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Connect crew planning to make this fully dynamic.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Risk & alerts
                </span>
                <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400" />
              </div>

              <ul className="mt-3 space-y-2 text-[11px] text-slate-500 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CircleDot size={10} className="mt-0.5 text-slate-500" />
                  Hook real alerts when you add rules (assets expiry, overrides, KPI flags).
                </li>
                <li className="flex items-start gap-2">
                  <CircleDot size={10} className="mt-0.5 text-slate-500" />
                  For now, this section is informational.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main table: SROs & jobs today */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {range === "today" ? "Today's SROs & Jobs" : "SROs & Jobs"}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live view of work scheduled or in progress
              </p>
            </div>

            <button
              type="button"
              onClick={() => (window.location.href = "/sros")}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              View all SROs
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-[11px] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">SRO</th>
                  <th className="px-3 py-2 text-left font-medium">Client / Rig</th>
                  <th className="px-3 py-2 text-left font-medium">Service</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  
                  <th className="px-3 py-2 text-left font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {srosToday.length === 0 ? (
                  <tr className="border-t border-slate-100 dark:border-slate-800">
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-[11px] text-slate-500 dark:text-slate-400"
                    >
                      No SROs found for this range.
                    </td>
                  </tr>
                ) : (
                  srosToday.map((sro, idx) => {
                    const pill = statusPill(sro.status);
                    return (
                      <tr
                        key={sro.id}
                        className={`border-t border-slate-100 dark:border-slate-800 ${
                          idx % 2 === 1
                            ? "bg-slate-50/40 dark:bg-slate-900/40"
                            : "bg-transparent"
                        }`}
                      >
                        <td className="px-3 py-2 text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                          {sro.number}
                        </td>

                        <td className="px-3 py-2 text-[11px] text-slate-600 dark:text-slate-200">
                          <div className="font-medium">{sro.client || "—"}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {sro.rig || "—"}
                          </div>
                        </td>

                        <td className="px-3 py-2 text-[11px] text-slate-600 dark:text-slate-200">
                          {sro.service || "—"}
                        </td>

                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${pill.className}`}
                          >
                            {pill.label}
                          </span>
                        </td>

                        

                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => (window.location.href = `/service/sros/${sro.id}`)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Open
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom row: activity + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Latest activity
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Recent changes across callouts, SROs, jobs and assets
              </p>
            </div>
          </div>

          <ol className="mt-4 space-y-3 text-xs">
            {activity.length === 0 ? (
              <li className="text-[11px] text-slate-500 dark:text-slate-400">
                No activity yet.
              </li>
            ) : (
              activity.map((item, idx) => (
                <li key={item.id} className="relative pl-6">
                  {idx !== activity.length - 1 && (
                    <span className="absolute left-1.5 top-3 h-full w-px bg-slate-200 dark:bg-slate-700" />
                  )}
                  <span className="absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-slate-900 text-[8px] text-slate-50 dark:bg-slate-100 dark:text-slate-900">
                    <Clock size={9} />
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">
                    {item.detail}
                  </p>
                </li>
              ))
            )}
          </ol>
        </div>

        {/* Quick actions / shortcuts */}
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Quick actions
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Common actions to keep operations moving
          </p>

          <div className="mt-2 space-y-2 text-xs">
            <button
              type="button"
              onClick={() => (window.location.href = "/service/callouts/new")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="inline-flex items-center gap-2">
                <CircleDot size={14} />
                New callout
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = "/schedules")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="inline-flex items-center gap-2">
                <CalendarRange size={14} />
                Open scheduling board
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = "/sros?status=qc_approved")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={14} />
                Review pending QC
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** simple Users icon wrapper so we don't conflict with types */
function UsersIcon(props: { size?: number; className?: string }) {
  return <Users {...props} />;
}
