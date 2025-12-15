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

  // Animate from 0 → value for numeric stats
  useEffect(() => {
    if (!animated || typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    let frameId: number;
    const duration = 800; // ms
    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const current = Math.round(value * progress);
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
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
        {trend && (
          <span className={`text-[11px] font-medium ${trendColor}`}>
            <TrendingUp size={12} className="inline-block mr-1 -mt-0.5" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

type Status = "created" | "scheduled" | "assigned" | "active" | "executed" | "qc";

function statusPill(status: Status) {
  const map: Record<
    Status,
    { label: string; className: string }
  > = {
    created: {
      label: "Created",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    scheduled: {
      label: "Scheduled",
      className: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    },
    assigned: {
      label: "Assigned",
      className:
        "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    },
    active: {
      label: "Active",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    executed: {
      label: "Executed",
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
    qc: {
      label: "QC Review",
      className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    },
  };

  return map[status];
}

// Mock data – later you’ll replace these with real API data
const mockTodayPipeline = [
  { status: "created" as Status, count: 3 },
  { status: "scheduled" as Status, count: 4 },
  { status: "assigned" as Status, count: 5 },
  { status: "active" as Status, count: 2 },
  { status: "executed" as Status, count: 1 },
  { status: "qc" as Status, count: 1 },
];

const mockSrosToday = [
  {
    id: 1,
    number: "SRO-2025-0012",
    client: "Client A",
    rig: "Rig-21",
    service: "Wireline Logging",
    status: "active" as Status,
    start: "09:00",
    end: "14:30",
  },
  {
    id: 2,
    number: "SRO-2025-0013",
    client: "Client B",
    rig: "Rig-07",
    service: "Pressure Testing",
    status: "scheduled" as Status,
    start: "15:00",
    end: "18:00",
  },
  {
    id: 3,
    number: "SRO-2025-0014",
    client: "Client C",
    rig: "Rig-03",
    service: "Tool Maintenance",
    status: "created" as Status,
    start: "-",
    end: "-",
  },
];

const mockActivity = [
  {
    id: 1,
    time: "08:15",
    title: "Callout created",
    detail: "Callout #45 for Rig-21 (Client A)",
  },
  {
    id: 2,
    time: "09:05",
    title: "SRO scheduled",
    detail: "SRO-2025-0012 scheduled for 09:00–14:30",
  },
  {
    id: 3,
    time: "10:20",
    title: "Execution log added",
    detail: "Pressure test completed on Rig-21",
  },
  {
    id: 4,
    time: "10:45",
    title: "Asset override with justification",
    detail: "Non-preferred pump assigned for Job JB-2025-0099",
  },
];

export function DashboardPage() {
  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    []
  );

  const totalPipeline = mockTodayPipeline.reduce((sum, s) => sum + s.count, 0);

  // For now, mock total callouts; later, replace with real API count
  const totalCallouts = 128;

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
          <p className="text-xs text-slate-500 dark:text-slate-400">{today}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <CalendarRange size={14} />
            Today
          </button>
          <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            This week
          </button>
          <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            Custom
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total callouts – animated counter */}
        <StatCard
          label="Total Callouts"
          value={totalCallouts}
          icon={Activity}
          trend="+12% vs last month"
          tone="positive"
          animated
        />

        <StatCard
          label="Active / Scheduled SROs"
          value="9 / 16"
          icon={Wrench}
          trend="3 ready for scheduling"
          tone="neutral"
        />
        <StatCard
          label="Jobs today"
          value={6}
          icon={Clock}
          trend="1 running now"
          tone="neutral"
          animated
        />
        <StatCard
          label="Crew utilization"
          value={82}
          suffix="%"
          icon={UsersIcon}
          trend="-3% vs target"
          tone="negative"
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
                  Today&apos;s SRO pipeline
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {totalPipeline} SROs across lifecycle stages
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              {mockTodayPipeline.map((stage) => {
                const pill = statusPill(stage.status);
                const percentage = totalPipeline
                  ? Math.round((stage.count / totalPipeline) * 100)
                  : 0;
                return (
                  <div key={stage.status} className="flex items-center gap-3">
                    <span
                      className={`inline-flex min-w-[80px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold ${pill.className}`}
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
              })}
            </div>
          </div>

          {/* Utilization & risk compact */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Crew utilization
                </span>
                <span className="text-[11px] text-rose-500">-3% vs target</span>
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                82%
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full w-[82%] rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                2 crews overbooked · 1 crew underutilized
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Risk & alerts
                </span>
                <AlertTriangle
                  size={16}
                  className="text-amber-500 dark:text-amber-400"
                />
              </div>
              <ul className="mt-3 space-y-2 text-[11px] text-slate-500 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CircleDot size={10} className="mt-0.5 text-amber-500" />
                  1 SRO with asset override awaiting approval
                </li>
                <li className="flex items-start gap-2">
                  <CircleDot size={10} className="mt-0.5 text-rose-500" />
                  2 assets close to inspection expiry
                </li>
                <li className="flex items-start gap-2">
                  <CircleDot size={10} className="mt-0.5 text-sky-500" />
                  3 jobs have KPI variance flags
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
                Today&apos;s SROs & Jobs
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live view of work scheduled or in progress
              </p>
            </div>
            <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
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
                  <th className="px-3 py-2 text-left font-medium">Planned</th>
                  <th className="px-3 py-2 text-left font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockSrosToday.map((sro, idx) => {
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
                        <div className="font-medium">{sro.client}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {sro.rig}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-600 dark:text-slate-200">
                        {sro.service}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${pill.className}`}
                        >
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-600 dark:text-slate-200">
                        {sro.start} – {sro.end}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                          Open
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
            {mockActivity.map((item, idx) => (
              <li key={item.id} className="relative pl-6">
                {/* vertical line */}
                {idx !== mockActivity.length - 1 && (
                  <span className="absolute left-1.5 top-3 h-full w-px bg-slate-200 dark:bg-slate-700" />
                )}
                {/* dot */}
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
            ))}
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
            <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <span className="inline-flex items-center gap-2">
                <CircleDot size={14} />
                New callout
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
            <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <span className="inline-flex items-center gap-2">
                <CalendarRange size={14} />
                Open scheduling board
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
            <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
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
