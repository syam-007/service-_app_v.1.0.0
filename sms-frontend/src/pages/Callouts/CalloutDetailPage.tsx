// src/pages/Callouts/CalloutDetailPage.tsx
import React, { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCallout, useGenerateSro } from "../../api/callout";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export function CalloutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useCallout(id);
  const {
    mutate: generateSro,
    isPending: isGenerating,
    error: generateError,
  } = useGenerateSro();

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-slate-500 dark:text-slate-300">
        Loading callout…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-sm space-y-3">
        <p className="text-slate-600 dark:text-slate-300">
          Failed to load callout.
        </p>
        <button
          onClick={() => navigate("/callouts")}
          className="
            inline-flex items-center text-xs font-medium
            text-slate-700 hover:text-slate-900
            dark:text-slate-200 dark:hover:text-white
          "
        >
          <span className="mr-1">←</span>
          Back to list
        </button>
      </div>
    );
  }

  const callout = data as any;

  // ✅ Draft-only editing
  const canEdit = callout.status === "draft";

  // 🔹 When generate SRO succeeds, go to that SRO's detail page
  const handleGenerateSro = () => {
    if (!id) return;

    generateSro(Number(id), {
      onSuccess: (created: any) => {
        const newSroId =
          created?.id ?? created?.sro_id ?? created?.sro?.id ?? null;

        if (newSroId) {
          navigate(`/sros/${newSroId}`);
        } else {
          console.warn("SRO created but no id found in response:", created);
        }
      },
    });
  };

  // ✅ Prefer explicit IDs from serializer
  const sroId: number | null =
    callout?.sro_id ?? (callout?.sro && callout.sro.id) ?? null;

  const scheduleId: number | null =
    callout?.schedule_id ??
    (callout?.schedule && callout.schedule.id) ??
    (callout?.sro && callout.sro.schedule_id) ??
    (callout?.sro && callout.sro.schedule && callout.sro.schedule.id) ??
    null;

  const scheduleNumber: string | null =
    callout?.schedule_number ??
    (callout?.schedule && callout.schedule.schedule_number) ??
    (callout?.sro && callout.sro.schedule_number) ??
    (callout?.sro &&
      callout.sro.schedule &&
      callout.sro.schedule.schedule_number) ??
    null;

  const hasSro =
    !!sroId || callout.has_sro || !!callout.sro_number || !!callout.sro;

  // ✅ states
  const isSroActivated = callout.status === "sro_activated" && !!sroId;
  const isScheduled = callout.status === "scheduled";

  // Status color mapping (✅ includes scheduled)
  const statusColorClasses =
    callout.status === "draft"
      ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800/60"
      : callout.status === "locked"
      ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800/60"
      : callout.status === "sro_activated"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/60"
      : callout.status === "scheduled"
      ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60"
      : "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700";

  // ---------------------------
  // Equipment visibility
  // ---------------------------
  const hasWhipstock =
    callout.whipstock_orientation_depth_m !== null &&
    callout.whipstock_orientation_depth_m !== undefined;

  const hasMotor =
    callout.motor_orientation_depth_m !== null &&
    callout.motor_orientation_depth_m !== undefined;

  const hasOrientation = hasWhipstock || hasMotor;

  const hasUbhoSize =
    typeof callout.ubho_sub_size === "string" &&
    callout.ubho_sub_size.trim() !== "";
  const hasUbhoConnSize =
    typeof callout.ubho_sub_connection_size === "string" &&
    callout.ubho_sub_connection_size.trim() !== "";
  const hasUbhoDate = !!callout.ubho_sub_date_required;
  const hasUbho = hasUbhoSize || hasUbhoConnSize || hasUbhoDate;

  const hasSideEntrySize =
    typeof callout.side_entry_sub_size === "string" &&
    callout.side_entry_sub_size.trim() !== "";
  const hasSideEntryConnSize =
    typeof callout.side_entry_sub_connection_size === "string" &&
    callout.side_entry_sub_connection_size.trim() !== "";
  const hasSideEntryDate = !!callout.side_entry_sub_date_required;
  const hasSideEntry =
    hasSideEntrySize || hasSideEntryConnSize || hasSideEntryDate;

  const hasEquipDate = !!callout.equipment_required_date;
  const hasEquipTime =
    typeof callout.equipment_required_time === "string" &&
    callout.equipment_required_time.trim() !== "";
  const hasCrewDate = !!callout.crew_required_date;
  const hasCrewTime =
    typeof callout.crew_required_time === "string" &&
    callout.crew_required_time.trim() !== "";
  const hasScheduleBlock =
    hasEquipDate || hasEquipTime || hasCrewDate || hasCrewTime;

  const hasSubsOrEquipment =
    hasOrientation || hasUbho || hasSideEntry || hasScheduleBlock;

  // Selected surveys (only show what user selected)
  const selectedSurveys = getSelectedSurveys(callout);

  // Convert DMS to decimal for map
  const decimalLat = dmsToDecimal(
    callout.well_center_lat_deg,
    callout.well_center_lat_min,
    callout.well_center_lat_sec
  );
  const decimalLng = dmsToDecimal(
    callout.well_center_lng_deg,
    callout.well_center_lng_min,
    callout.well_center_lng_sec
  );

  return (
    <div className="w-full space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Title / meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {callout.callout_number}
            </h1>

            {/* Status pill */}
            <span
              className={`
                inline-flex items-center gap-1 rounded-full border px-3 py-1
                text-xs font-medium capitalize
                ${statusColorClasses}
              `}
            >
              <span className="h-2 w-2 rounded-full bg-green-300 dark:bg-blue-200" />
              <span className="h-1.5 w-1.5 rounded-full bg-current/70" />
              <span>{String(callout.status || "n/a").replace("_", " ")}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Created:{" "}
              {callout.created_at
                ? new Date(callout.created_at).toLocaleString()
                : "—"}
            </span>

            {callout.sro_number && (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-300 dark:bg-green-200" />
                <span className="uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400">
                  Linked SRO
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-100">
                  {callout.sro_number}
                </span>
              </span>
            )}

            {scheduleId && (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-300 dark:bg-blue-200" />
                <span className="uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400">
                  Linked Schedule
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-100">
                  {scheduleNumber}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={() => canEdit && navigate(`/service/callouts/${callout.id}/edit`)}
            disabled={!canEdit}
            className="
              group inline-flex items-center gap-1.5
              rounded-full border border-slate-200 bg-white px-3 py-1.5
              text-xs font-medium text-slate-700 hover:bg-slate-50
              dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
              dark:hover:bg-slate-800
              disabled:opacity-40 disabled:cursor-not-allowed
            "
            title={canEdit ? "Edit callout" : "Only draft callouts can be edited"}
          >
            <span>Edit</span>
          </button>

          {isScheduled && sroId && (
            <button
              type="button"
              title="Go to SRO"
              onClick={() => navigate(`/sros/${sroId}`)}
              className="
                group inline-flex items-center gap-1.5
                rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5
                text-xs font-medium text-slate-50
                hover:bg-slate-800
                dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900
                dark:hover:bg-slate-200
                transition-colors
              "
            >
              <span>Go to SRO</span>
              <span
                className="
                  opacity-0 translate-x-0
                  group-hover:opacity-100 group-hover:translate-x-1
                  transition-all duration-150
                "
              >
                →
              </span>
            </button>
          )}

          {isScheduled && scheduleId && (
            <button
              type="button"
              title="Go to Schedule"
              onClick={() => navigate(`/schedules/${scheduleId}`)}
              className="
                group inline-flex items-center gap-1.5
                rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5
                text-xs font-medium text-white
                hover:bg-blue-700
                dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400
                transition-colors
              "
            >
              <span>Go to Schedule</span>
              <span
                className="
                  opacity-0 translate-x-0
                  group-hover:opacity-100 group-hover:translate-x-1
                  transition-all duration-150
                "
              >
                →
              </span>
            </button>
          )}

          {!isScheduled && isSroActivated && sroId && (
            <button
              type="button"
              title="Go to SRO"
              onClick={() => navigate(`/sros/${sroId}`)}
              className="
                group inline-flex items-center gap-1.5
                rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5
                text-xs font-medium text-slate-50
                hover:bg-slate-800
                dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900
                dark:hover:bg-slate-200
                transition-colors
              "
            >
              <span>Go to SRO</span>
              <span
                className="
                  opacity-0 translate-x-0
                  group-hover:opacity-100 group-hover:translate-x-1
                  transition-all duration-150
                "
              >
                →
              </span>
            </button>
          )}

          {!hasSro && (
            <button
              type="button"
              onClick={handleGenerateSro}
              disabled={isGenerating}
              className="
                inline-flex items-center rounded-full border border-emerald-500
                bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white
                hover:bg-emerald-600 disabled:opacity-60
                transition-colors
              "
            >
              {isGenerating ? "Generating SRO…" : "Generate SRO"}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/callouts")}
            className="
              group inline-flex items-center gap-1.5
              rounded-full border border-slate-200 bg-white px-3 py-1.5
              text-xs font-medium text-slate-700 hover:bg-slate-50
              dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
              dark:hover:bg-slate-800
              transition-colors
            "
          >
            <span
              className="
                opacity-0 -translate-x-1
                group-hover:opacity-100 group-hover:translate-x-0
                transition-all duration-150
              "
            >
              ←
            </span>
            <span>Back to list</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {generateError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          Failed to generate SRO. Please try again.
        </div>
      )}

      {/* CONTENT GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1) GENERAL INFORMATION */}
        <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            General Information
          </h2>

          <dl className="space-y-2">
            <InfoRow
              label="Customer"
              value={callout.customer_name || callout.customer || "—"}
            />
            <InfoRow
              label="Client"
              value={callout.client_name || "—"}
            />
            <InfoRow label="Rig number" value={callout.rig_number_display || "—"} />
            <InfoRow label="Field name" value={callout.field_name_display || "—"} />
            <InfoRow label="Well" value={callout.well_name_display || "—"} />
            <InfoRow label="Well ID" value={callout.well_id_display || "—"} />
          </dl>
        </section>

        {/* 2) WELL LOCATION */}
        <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Well Location
          </h2>

          <div className="space-y-3">
            <div>
              <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Coordinates
              </h3>
              <dl className="space-y-1">
                <InfoRow
                  label="Latitude (DMS)"
                  value={`${callout.well_center_lat_deg ?? "—"}° ${callout.well_center_lat_min ?? "—"}′ ${callout.well_center_lat_sec ?? "—"}″`}
                />
                <InfoRow
                  label="Longitude (DMS)"
                  value={`${callout.well_center_lng_deg ?? "—"}° ${callout.well_center_lng_min ?? "—"}′ ${callout.well_center_lng_sec ?? "—"}″`}
                />
                <InfoRow
                  label="UTM (N / E)"
                  value={
                    <div className="flex gap-1">
                      <span>{callout.utm_northing || "—"}</span>
                      <span className="text-red-500">N</span>
                      <span>/</span>
                      <span>{callout.utm_easting || "—"}</span>
                      <span className="text-green-500">E</span>
                    </div>
                  }
                />
              </dl>
            </div>

            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Survey Depths
              </h3>
              <dl className="space-y-1">
                <InfoRow label="Start depth (m)" value={callout.survey_start_depth_m ?? "—"} />
                <InfoRow label="End depth (m)" value={callout.survey_end_depth_m ?? "—"} />
                <InfoRow label="Interval (m)" value={callout.survey_interval_m ?? "—"} />
              </dl>
            </div>
          </div>
        </section>

        {/* 3) TYPE OF SERVICE */}
        <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Type of Service
          </h2>

          <dl className="space-y-2 mb-3">
            <InfoRow label="Service category" value={callout.service_category || "—"} />
          </dl>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/30">
            <h3 className="mb-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Selected surveys
            </h3>

            {selectedSurveys.length > 0 ? (
              <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-200">
                {selectedSurveys.map((label) => (
                  <li key={label} className="flex items-center justify-between gap-3">
                    <span className="truncate">{label}</span>
                   
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No surveys selected.
              </p>
            )}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Well geometry
            </h3>

            <dl className="space-y-1">
              <InfoRow label="Hole section" value={callout.hole_section_display ?? "—"} />

              {callout.pipe_selection_type === "casing" ? (
                <InfoRow label="Casing size (in)" value={callout.casing_size_display ?? "—"} />
              ) : callout.pipe_selection_type === "drillpipe" ? (
                <InfoRow label="Drillpipe size (in)" value={callout.drillpipe_size_display ?? "—"} />
              ) : null}

              <InfoRow label="Minimum ID (in)" value={callout.minimum_id_display ?? "—"} />
            </dl>
          </div>
        </section>

        {/* 4) EQUIPMENT */}
        {hasSubsOrEquipment && (
          <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-900/80">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Equipment
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
                      <InfoRow
                        label="Motor orientation depth (m)"
                        value={callout.motor_orientation_depth_m}
                      />
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
                    {hasUbhoSize && (
                      <InfoRow label="UBHO sub size" value={callout.ubho_sub_size} />
                    )}
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
                    {hasSideEntrySize && (
                      <InfoRow label="Side-entry sub size" value={callout.side_entry_sub_size} />
                    )}
                    {hasSideEntryConnSize && (
                      <InfoRow
                        label="Side-entry connection size"
                        value={callout.side_entry_sub_connection_size}
                      />
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

              {hasScheduleBlock && (
                <div>
                  <h3 className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Schedule
                  </h3>
                  <dl className="space-y-1">
                  {hasEquipDate && (
                      <InfoRow
                        label="Equipment required (date)"
                        value={formatDateDDMonYYYY(callout.equipment_required_date)}
                      />
                    )}
                    {hasEquipTime && (
                      <InfoRow
                        label="Equipment required (time)"
                        value={formatTimeAMPM(callout.equipment_required_time)}
                      />
                    )}
                    {hasCrewDate && (
                      <InfoRow
                        label="Crew required (date)"
                        value={formatDateDDMonYYYY(callout.crew_required_date)}
                      />
                    )}
                    {hasCrewTime && (
                      <InfoRow
                        label="Crew required (time)"
                        value={formatTimeAMPM(callout.crew_required_time)}
                      />
                    )}
                  </dl>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5) CONTACT */}
        <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Contact
          </h2>

          <dl className="space-y-2 mb-4">
            <InfoRow label="Completed by" value={callout.callout_completed_by || "—"} />
            <InfoRow label="Designation" value={callout.completed_by_designation || "—"} />
            <InfoRow label="Contact number" value={callout.contact_number || "—"} />
            <InfoRow label="Authorization" value={callout.authorization || "—"} />
          </dl>

          <div className="space-y-1">
            <h3 className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Notes
            </h3>
            <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-[11px] leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {callout.notes || "No comments provided."}
            </p>
          </div>
        </section>

        {/* 6) MAP (after Contact, same card size) */}
        <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs shadow-sm h-full dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Location Map (Oman)
          </h2>

          <div className="h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <OmanMap lat={decimalLat} lng={decimalLng} />
          </div>
        </section>
      </div>
    </div>
  );
}

/** Small helper components to keep layout clean & consistent */
type InfoRowProps = { label: string; value: React.ReactNode };

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

/** DMS → decimal helper */
function dmsToDecimal(
  deg?: number | string | null,
  min?: number | string | null,
  sec?: number | string | null
): number | null {
  if (deg === null || deg === undefined) return null;
  if (min === null || min === undefined) return null;
  if (sec === null || sec === undefined) return null;

  const d = Number(deg);
  const m = Number(min);
  const s = Number(sec);
  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(s)) return null;

  const sign = d < 0 ? -1 : 1;
  const absDeg = Math.abs(d);
  const value = absDeg + m / 60 + s / 3600;
  return sign * value;
}

/** Leaflet map centered on Oman / well location */
type OmanMapProps = { lat: number | null; lng: number | null };

function OmanMap({ lat, lng }: OmanMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const fallbackCenter: [number, number] = [21.5, 57.0]; // Oman center
    const center: [number, number] =
      lat !== null && lng !== null ? [lat, lng] : fallbackCenter;

    const map = L.map(mapContainerRef.current).setView(center, 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    if (lat !== null && lng !== null) {
      L.marker(center).addTo(map);
    }

    return () => {
      map.remove();
    };
  }, [lat, lng]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}

/** Only show what user selected (example: "Memory gyro • Pump down survey") */
function getSelectedSurveys(callout: any): string[] {
  const cat = String(callout?.service_category ?? "").toLowerCase();

  const wireline = [
    { key: "wireline_casing_survey", label: "Wireline gyro • Casing survey" },
    { key: "wireline_orientation_survey", label: "Wireline gyro • Orientation survey" },
    { key: "wireline_drillpipe_survey", label: "Wireline gyro • Drillpipe survey" },
    { key: "wireline_pumpdown_survey", label: "Wireline gyro • Pump down survey" },
    { key: "wireline_orientation_multishot_survey", label: "Wireline gyro • Orientation / multishot" },
  ];

  const memory = [
    { key: "memory_casing_slickline", label: "Memory gyro • Casing (slickline / memory)" },
    { key: "memory_drillpipe_slickline", label: "Memory gyro • Drillpipe (slickline / memory)" },
    { key: "memory_pumpdown_survey", label: "Memory gyro • Pump down survey" },
    { key: "drop_gyro_lt_20", label: "Drop gyro • < 20" },
    { key: "drop_gyro_gt_20", label: "Drop gyro • > 20" },
    { key: "dry_hole_drop_gyro_system", label: "Dry hole • Drop gyro system" },
  ];

  const list =
    cat.includes("wireline")
      ? wireline
      : cat.includes("memory")
      ? memory
      : [...wireline, ...memory];

  return list.filter((x) => !!callout?.[x.key]).map((x) => x.label);
}
function formatDateDDMonYYYY(input?: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";

  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-GB", { month: "short" }).toUpperCase(); // jan, feb...
  const year = d.getFullYear();

  return `${day}-${mon}-${year}`; // 05-jan-2026
}

function formatTimeAMPM(time?: string | null): string {
  if (!time) return "—";

  // expected format: HH:mm or HH:mm:ss
  const [h, m] = time.split(":");
  const hour24 = Number(h);

  if (Number.isNaN(hour24)) return "—";

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${m} ${period}`; // e.g. 5:08 PM
}
