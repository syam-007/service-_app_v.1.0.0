// src/pages/Schedules/ScheduleDetailPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, List, ShieldAlert, Wrench, Package } from "lucide-react";
import { useSchedule } from "../../api/schedules";

export function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: schedule, isLoading, error } = useSchedule(id);

  if (isLoading) return <div className="p-4 text-sm">Loading schedule…</div>;
  if (error || !schedule) return <div className="p-4 text-sm">Failed to load schedule.</div>;

  const sroId = schedule.sro;
  const statusPill = getStatusPillClass(schedule.status);

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 space-y-5">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur shadow-sm">
        {/* subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-80" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* left */}
            <div className="flex items-start gap-3">
              {/* Back to SRO */}
              <IconButton title="Back to SRO" onClick={() => sroId && navigate(`/sros/${sroId}`)}>
                <ArrowLeft className="h-4 w-4" />
              </IconButton>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    {schedule.schedule_number}
                  </h1>

                  <span
                    className={`
                      inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]
                      font-medium capitalize
                      ${statusPill}
                    `}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current/70" />
                    {String(schedule.status || "—").replaceAll("_", " ")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    SRO:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {schedule.sro_number ?? `SRO_${schedule.sro}`}
                    </span>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>
                    Created:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {schedule.created_at ? new Date(schedule.created_at).toLocaleString() : "—"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* right buttons */}
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <PrimaryButton onClick={() => navigate("/schedules")} title="Back to Schedule list">
                <List className="h-4 w-4" />
                Schedule List
              </PrimaryButton>

              <GhostButton onClick={() => alert("TODO: implement edit page")} title="Edit schedule">
                <Edit3 className="h-4 w-4" />
                Edit
              </GhostButton>
            </div>
          </div>
        </div>
      </div>

      {/* PRIORITY */}
      <section className="space-y-3">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Priority</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Scores are out of 5.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricRingCard label="Finance" value={schedule.finance_priority} />
          <MetricRingCard label="Operations" value={schedule.operations_priority} />
          <MetricRingCard label="Q / A" value={schedule.qa_priority} />
          <MetricRingCard label="Average" value={schedule.average_priority} emphasize />
        </div>
      </section>

      {/* DETAILS */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <ModernCard
          title="Complexity"
          subtitle="Risk flags & difficulty"
          icon={<ShieldAlert className="h-4 w-4" />}
        >
          <InfoRow
            label="High temp"
            value={
              <span className={riskValueClass(schedule.high_temp)}>
                {schedule.high_temp === null ? "—" : schedule.high_temp ? "Yes" : "No"}
              </span>
            }
          />
          <InfoRow
            label="Pressure risk"
            value={
              <span className={riskValueClass(schedule.pressure_risk)}>
                {schedule.pressure_risk === null ? "—" : schedule.pressure_risk ? "Yes" : "No"}
              </span>
            }
          />
          <InfoRow
            label="HSE risk"
            value={
              <span className={riskValueClass(schedule.hse_risk)}>
                {schedule.hse_risk === null ? "—" : schedule.hse_risk ? "Yes" : "No"}
              </span>
            }
          />
          <InfoRow
            label="Difficulty"
            value={
              <span className={difficultyValueClass(schedule.difficulty_score)}>
                {schedule.difficulty_score ?? "—"}
              </span>
            }
          />
        </ModernCard>

        <ModernCard
          title="Equipment"
          subtitle="Type & resource"
          icon={<Wrench className="h-4 w-4" />}
        >
          <InfoRow label="Type of equipment" value={schedule.type_of_equipment || "—"} />
          <InfoRow label="Resource" value={schedule.resource || "—"} />
        </ModernCard>

        <ModernCard title="Meta" subtitle="Record details" icon={<Package className="h-4 w-4" />}>
          <InfoRow
            label="Status"
            value={<span className="capitalize">{String(schedule.status || "—")}</span>}
          />
          <InfoRow
            label="Created"
            value={schedule.created_at ? new Date(schedule.created_at).toLocaleString() : "—"}
          />
        </ModernCard>
      </div>
    </div>
  );
}

/* ---------------- Modern UI pieces ---------------- */

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
        inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium
        bg-slate-900 text-white shadow-sm hover:shadow
        hover:bg-slate-800 active:scale-[0.99]
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
        inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium
        border border-slate-200/70 bg-white/70 text-slate-700
        hover:bg-white hover:shadow-sm active:scale-[0.99]
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
        <div>
          <div className="flex items-center gap-2">
            <div className="grid place-items-center h-8 w-8 rounded-2xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
              {subtitle && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-50 text-right">{value}</span>
    </div>
  );
}

/* ---------------- Priority cards ---------------- */

function MetricRingCard({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number | string | null;
  emphasize?: boolean;
}) {
  const numeric = normalizeScore(value);
  const percent = numeric === null ? 0 : (numeric / 5) * 100;

  const ringClass = getRingColorClass(numeric);
  const pillClass = pillForScore(numeric);
  const level = scoreLabel(numeric);

  return (
    <div
      className={`
        group relative overflow-hidden rounded-3xl p-4
        border bg-white/70 backdrop-blur
        dark:bg-slate-950/50
        ${
          emphasize
            ? "border-slate-300/70 dark:border-slate-700"
            : "border-slate-200/70 dark:border-slate-800"
        }
        shadow-sm hover:shadow-md transition
      `}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent dark:from-slate-900/40" />
      </div>

      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">{level}</div>
        </div>

        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border ${pillClass}`}>
          {numeric === null ? "—" : `${numeric}/5`}
        </span>
      </div>

      <div className="relative mt-4 flex items-center justify-center">
        <CircleProgress value={percent} centerText={numeric ?? "—"} ringClassName={ringClass} />
      </div>
    </div>
  );
}

function CircleProgress({
  value,
  centerText,
  ringClassName,
}: {
  value: number;
  centerText: string | number;
  ringClassName: string;
}) {
  const size = 92;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          className="text-slate-200/90 dark:text-slate-800"
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className={ringClassName}
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 leading-none">
            {centerText}
          </div>
          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">/ 5</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Utils ---------------- */

function getStatusPillClass(status: any) {
  const s = String(status || "").toLowerCase();
  if (s === "approved")
    return "bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/60";
  if (s === "planned")
    return "bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60";
  if (s === "cancelled")
    return "bg-rose-50/80 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800/60";
  return "bg-slate-50/80 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700";
}

function normalizeScore(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(5, Math.round(n * 10) / 10));
}

function scoreLabel(score: number | null) {
  if (score === null) return "Not set";
  if (score < 2.5) return "Low";
  if (score < 4) return "Medium";
  return "High";
}

function getRingColorClass(score: number | null) {
  if (score === null) return "text-slate-400 dark:text-slate-600";
  if (score < 2.5) return "text-rose-600 dark:text-rose-300";
  if (score < 4) return "text-amber-600 dark:text-amber-300";
  return "text-emerald-600 dark:text-emerald-300";
}

function pillForScore(score: number | null) {
  if (score === null)
    return "border-slate-200 bg-slate-50/80 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200";
  if (score < 2.5)
    return "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-200";
  if (score < 4)
    return "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-200";
  return "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200";
}

/* ---------------- NEW: Risk / Difficulty coloring ---------------- */

// Yes => red, No => green, null => neutral
function riskValueClass(isRisk: boolean | null) {
  if (isRisk === null) return "text-slate-400 dark:text-slate-500";
  return isRisk
    ? "text-rose-600 dark:text-rose-300"
    : "text-emerald-600 dark:text-emerald-300";
}

// Difficulty High (>= 4) => red, else => green, null => neutral
function difficultyValueClass(score: number | string | null | undefined) {
  const n = normalizeScore(score);
  if (n === null) return "text-slate-400 dark:text-slate-500";
  return n >= 4 ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300";
}
