// src/pages/Sros/SroDetailPage.tsx
import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  ArrowLeft,
  ClipboardCheck,
  List,
  ShieldCheck,
  FileText, // ✅ NEW
} from "lucide-react";
import { useSro , useApproveSroToSchedule} from "../../api/sros";

import { useCallout } from "../../api/callout";

export function SroDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  

  const { data, isLoading, error } = useSro(id);
  const approveMutation = useApproveSroToSchedule();

  const sro = (data as any) ?? null;

  // Linked callout id (for fetching full callout)
  const calloutId = sro?.callout_id ?? sro?.callout?.id ?? null;

  // Fetch full callout details (so SRO page can render full callout info)
  const {
    data: calloutData,
    isLoading: isCalloutLoading,
    error: calloutError,
  } = useCallout(calloutId ? String(calloutId) : undefined);

  const callout = (calloutData as any) ?? null;

  // schedule link
  const scheduleId = useMemo(() => {
    return sro?.schedule_id ?? sro?.schedule?.id ?? null;
  }, [sro]);

  const scheduleNumber = useMemo(() => {
    return sro?.schedule_number ?? sro?.schedule?.schedule_number ?? null;
  }, [sro]);

  const hasSchedule = !!scheduleId;

  const handleApproveOrGo = () => {
    if (!id) return;
  
    // If schedule exists, go to schedule detail (keep this if you want)
    if (hasSchedule) {
      navigate(`/schedules/${scheduleId}`);
      return;
    }
  
    approveMutation.mutate(Number(id), {
      onSuccess: () => {
        toast.success("SRO approved");
        navigate(`/callouts`);
      },
      onError: () => {
        toast.error("Failed to approve SRO");
      },
    });
  };
  const isApproved = String(sro?.status || "").toLowerCase() === "approved";

  if (isLoading) return <div className="p-4 text-sm">Loading SRO…</div>;

  if (error || !sro) {
    return (
      <div className="p-4 text-sm">
        Failed to load SRO.
        <button onClick={() => navigate("/sros")} className="ml-2 text-slate-600 underline">
          Back to list
        </button>
      </div>
    );
  }

  // ---------------------------
  // Callout derived flags (only if callout exists)
  // ---------------------------
  const canRenderCallout = !!callout && !calloutError;

  const hasWhipstock =
    callout?.whipstock_orientation_depth_m !== null &&
    callout?.whipstock_orientation_depth_m !== undefined;

  const hasMotor =
    callout?.motor_orientation_depth_m !== null && callout?.motor_orientation_depth_m !== undefined;

  const hasOrientation = hasWhipstock || hasMotor;

  const hasUbhoSize =
    typeof callout?.ubho_sub_size === "string" && callout.ubho_sub_size.trim() !== "";
  const hasUbhoConnSize =
    typeof callout?.ubho_sub_connection_size === "string" &&
    callout.ubho_sub_connection_size.trim() !== "";
  const hasUbhoDate = !!callout?.ubho_sub_date_required;
  const hasUbho = hasUbhoSize || hasUbhoConnSize || hasUbhoDate;

  const hasSideEntrySize =
    typeof callout?.side_entry_sub_size === "string" && callout.side_entry_sub_size.trim() !== "";
  const hasSideEntryConnSize =
    typeof callout?.side_entry_sub_connection_size === "string" &&
    callout.side_entry_sub_connection_size.trim() !== "";
  const hasSideEntryDate = !!callout?.side_entry_sub_date_required;
  const hasSideEntry = hasSideEntrySize || hasSideEntryConnSize || hasSideEntryDate;

  const hasEquipDate = !!callout?.equipment_required_date;
  const hasEquipTime =
    typeof callout?.equipment_required_time === "string" &&
    callout.equipment_required_time.trim() !== "";
  const hasCrewDate = !!callout?.crew_required_date;
  const hasCrewTime =
    typeof callout?.crew_required_time === "string" && callout.crew_required_time.trim() !== "";
  const hasScheduleFields = hasEquipDate || hasEquipTime || hasCrewDate || hasCrewTime;

  const hasSubsOrEquipment = hasOrientation || hasUbho || hasSideEntry || hasScheduleFields;

  return (
    // ✅ FULL WIDTH + RESPONSIVE PADDING
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 space-y-5 py-4">
      {/* HERO HEADER (soft gradient + glass) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur shadow-sm">
        {/* soft gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 opacity-80" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-slate-200/40 dark:bg-slate-800/40 blur-3xl" />

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* left */}
            <div className="flex items-start gap-3">
              <IconButton title="Back to SRO list" onClick={() => navigate("/sros")}>
                <ArrowLeft className="h-4 w-4" />
              </IconButton>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* ✅ NEW modern page icon */}
                  <div
                    className="
                      grid place-items-center h-10 w-10 rounded-2xl
                      border border-slate-200/70 bg-white/70 text-slate-700
                      shadow-sm
                      dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200
                      backdrop-blur
                    "
                    title="SRO Record"
                  >
                    <FileText className="h-5 w-5" />
                  </div>

                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    {sro.sro_number}
                  </h1>

                  <span
                    className={`
                      inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]
                      font-medium capitalize
                      ${getSroStatusPillClass(sro.status)}
                    `}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current/70" />
                    {String(sro.status || "—").replaceAll("_", " ")}
                  </span>

                  {hasSchedule && (
                    <span
                      className="
                        inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]
                        bg-blue-50/70 text-blue-700 border-blue-200
                        dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60
                      "
                      title="Linked schedule"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current/70" />
                      Linked Schedule
                      <span className="font-semibold">{scheduleNumber || "—"}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    SRO Detail
                  </span>
                  {calloutId && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        Callout:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {callout?.callout_number ?? `#${calloutId}`}
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* right buttons */}
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              {/* Approve / Go schedule */}
              <PrimaryButton
                onClick={handleApproveOrGo}
                title={isApproved ? "SRO Approved" : hasSchedule ? "Go to Schedule" : "Approve SRO"}
                disabled={approveMutation.isLoading || isApproved}
              >
                <ClipboardCheck className="h-4 w-4" />
                {approveMutation.isLoading
                  ? "Processing…"
                  : isApproved
                  ? "SRO Approved"
                  : hasSchedule
                  ? "Go to Schedule"
                  : "Approve SRO"}
              </PrimaryButton>

              {/* Back to Callout */}
              {calloutId && (
                <GhostButton onClick={() => navigate(`/callouts/${calloutId}`)} title="Back to Callout">
                  Back to Callout
                </GhostButton>
              )}

              {/* Back to SRO list */}
              <GhostButton onClick={() => navigate("/sros")} title="Back to SRO list">
                <List className="h-4 w-4" />
                SRO List
              </GhostButton>
            </div>
          </div>
        </div>
      </div>

      {/* CALLOUT LOADING / ERROR */}
      {isCalloutLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
          Loading linked callout…
        </div>
      )}

      {calloutError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          Failed to load linked callout details.
        </div>
      )}

      {/* ✅ FULL CALL OUT DETAILS (LIKE CALLOUT DETAIL PAGE) */}
      {canRenderCallout && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ">
          {/* GENERAL INFORMATION */}
          <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-950/60">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Callout - General Information
            </h2>

            <dl className="space-y-2">
              <InfoRow label="Callout number" value={callout.callout_number || "—"} />
              <InfoRow label="Customer" value={callout.customer_name || "—"} />
              <InfoRow label="Rig number" value={callout.rig_number || "—"} />
              <InfoRow label="Field name" value={callout.field_name || "—"} />
              <InfoRow label="Well" value={callout.well_name_display || "—"} />
              <InfoRow label="Well ID" value={callout.well_id_display || "—"} />
              <InfoRow label="Hole section" value={callout.hole_section_display || "—"} />
              <InfoRow
                label="Created at"
                value={callout.created_at ? new Date(callout.created_at).toLocaleString() : "—"}
              />
              <InfoRow label="Status" value={String(callout.status || "—").replace("_", " ")} />
            </dl>
          </section>

          {/* SERVICE INFORMATION */}
          <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-950/60">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Type of Service
            </h2>

            <dl className="space-y-2 mb-3">
              <InfoRow
                label="Service category"
                value={callout.service_category ? callout.service_category.replace("_", " ") : "—"}
              />
            </dl>

            <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Wireline gyro
                </p>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-200">
                  <BoolRow label="Casing survey" value={!!callout.wireline_casing_survey} />
                  <BoolRow label="Orientation survey" value={!!callout.wireline_orientation_survey} />
                  <BoolRow label="Drillpipe survey" value={!!callout.wireline_drillpipe_survey} />
                  <BoolRow label="Pump down survey" value={!!callout.wireline_pumpdown_survey} />
                  <BoolRow label="Orientation / multishot" value={!!callout.wireline_orientation_multishot_survey} />
                </ul>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Memory gyro
                </p>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-200">
                  <BoolRow label="Casing (slickline / memory)" value={!!callout.memory_casing_slickline} />
                  <BoolRow label="Drillpipe (slickline / memory)" value={!!callout.memory_drillpipe_slickline} />
                  <BoolRow label="Pump down survey" value={!!callout.memory_pumpdown_survey} />
                  <BoolRow label="Drop gyro < 20" value={!!callout.drop_gyro_lt_20} />
                  <BoolRow label="Drop gyro > 20" value={!!callout.drop_gyro_gt_20} />
                  <BoolRow label="Dry hole drop system" value={!!callout.dry_hole_drop_gyro_system} />
                </ul>
              </div>
            </div>
          </section>

          {/* WELL & SURVEY */}
          <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-950/60">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Well &amp; Survey
            </h2>

            <div className="space-y-3">
              <div>
                <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Coordinates
                </h3>
                <dl className="space-y-1">
                  <InfoRow
                    label="Latitude (D/M/S)"
                    value={`${callout.well_center_lat_deg ?? "—"}° ${callout.well_center_lat_min ?? "—"}′ ${callout.well_center_lat_sec ?? "—"}″`}
                  />
                  <InfoRow
                    label="Longitude (D/M/S)"
                    value={`${callout.well_center_lng_deg ?? "—"}° ${callout.well_center_lng_min ?? "—"}′ ${callout.well_center_lng_sec ?? "—"}″`}
                  />
                  <InfoRow
                    label="UTM northing / easting"
                    value={`${callout.utm_northing || "—"} / ${callout.utm_easting || "—"}`}
                  />
                </dl>
              </div>

              <div>
                <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Well geometry
                </h3>
                <dl className="space-y-1">
                  <InfoRow label="Casing size (in)" value={callout.casing_size_inch ?? "—"} />
                  <InfoRow label="Drillpipe size (in)" value={callout.drillpipe_size_inch ?? "—"} />
                  <InfoRow label="Minimum ID (in)" value={callout.minimum_id_inch ?? "—"} />
                </dl>
              </div>

              <div>
                <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Survey
                </h3>
                <dl className="space-y-1">
                  <InfoRow label="Start depth (m)" value={callout.survey_start_depth_m ?? "—"} />
                  <InfoRow label="End depth (m)" value={callout.survey_end_depth_m ?? "—"} />
                  <InfoRow label="Interval (m)" value={callout.survey_interval_m ?? "—"} />
                </dl>
              </div>
            </div>
          </section>

          {/* SUBS & EQUIPMENT – ONLY IF ANYTHING ENTERED */}
          {hasSubsOrEquipment && (
            <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-950/60">
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Subs &amp; Equipment
              </h2>

              <div className="space-y-3">
                {hasOrientation && (
                  <div>
                    <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Orientation
                    </h3>
                    <dl className="space-y-1">
                      {hasWhipstock && (
                        <InfoRow
                          label="Whipstock orientation depth (m)"
                          value={callout.whipstock_orientation_depth_m}
                        />
                      )}
                      {hasMotor && (
                        <InfoRow label="Motor orientation depth (m)" value={callout.motor_orientation_depth_m} />
                      )}
                    </dl>
                  </div>
                )}

                {hasUbho && (
                  <div>
                    <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      UBHO sub
                    </h3>
                    <dl className="space-y-1">
                      {hasUbhoSize && <InfoRow label="UBHO sub size" value={callout.ubho_sub_size} />}
                      {hasUbhoConnSize && (
                        <InfoRow label="UBHO connection size" value={callout.ubho_sub_connection_size} />
                      )}
                      {hasUbhoDate && (
                        <InfoRow
                          label="UBHO date required"
                          value={new Date(callout.ubho_sub_date_required).toLocaleDateString()}
                        />
                      )}
                    </dl>
                  </div>
                )}

                {hasSideEntry && (
                  <div>
                    <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Side-entry sub
                    </h3>
                    <dl className="space-y-1">
                      {hasSideEntrySize && <InfoRow label="Side-entry sub size" value={callout.side_entry_sub_size} />}
                      {hasSideEntryConnSize && (
                        <InfoRow label="Side-entry connection size" value={callout.side_entry_sub_connection_size} />
                      )}
                      {hasSideEntryDate && (
                        <InfoRow
                          label="Side-entry date required"
                          value={new Date(callout.side_entry_sub_date_required).toLocaleDateString()}
                        />
                      )}
                    </dl>
                  </div>
                )}

                {hasScheduleFields && (
                  <div>
                    <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Schedule requirements
                    </h3>
                    <dl className="space-y-1">
                      {hasEquipDate && (
                        <InfoRow
                          label="Equipment required (date)"
                          value={new Date(callout.equipment_required_date).toLocaleDateString()}
                        />
                      )}
                      {hasEquipTime && (
                        <InfoRow label="Equipment required (time)" value={callout.equipment_required_time} />
                      )}
                      {hasCrewDate && (
                        <InfoRow
                          label="Crew required (date)"
                          value={new Date(callout.crew_required_date).toLocaleDateString()}
                        />
                      )}
                      {hasCrewTime && <InfoRow label="Crew required (time)" value={callout.crew_required_time} />}
                    </dl>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* CONTACT & NOTES */}
          <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-950/60">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Contact &amp; Comments
            </h2>

            <dl className="space-y-2 mb-4">
              <InfoRow label="Completed by" value={callout.callout_completed_by || "—"} />
              <InfoRow label="Designation" value={callout.completed_by_designation || "—"} />
              <InfoRow label="Contact number" value={callout.contact_number || "—"} />
              <InfoRow label="Authorization" value={callout.authorization || "—"} />
            </dl>

            <div className="space-y-1">
              <h3 className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Notes</h3>
              <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-[11px] leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                {callout.notes || "No comments provided."}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/** Small helper components */

type InfoRowProps = {
  label: string;
  value: React.ReactNode;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[11px] text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-[11px] font-medium text-slate-900 dark:text-slate-50 text-right">
        {value}
      </dd>
    </div>
  );
}

type BoolRowProps = {
  label: string;
  value: boolean;
};

function BoolRow({ label, value }: BoolRowProps) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span
        className={`
          inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium
          ${
            value
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
              : "bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-300"
          }
        `}
      >
        {value ? "Yes" : "No"}
      </span>
    </li>
  );
}

/* ---------------- Hero Header UI bits ---------------- */

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
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
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

function getSroStatusPillClass(status: any) {
  const s = String(status || "").toLowerCase();

  if (s === "approved")
    return "bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/60";
  if (s === "pending" || s === "submitted")
    return "bg-amber-50/80 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800/60";
  if (s === "rejected" || s === "cancelled")
    return "bg-rose-50/80 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800/60";

  return "bg-slate-50/80 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700";
}
