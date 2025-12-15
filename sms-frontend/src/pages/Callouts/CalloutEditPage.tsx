// src/pages/Callouts/CalloutEditPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCallout, useUpdateCallout } from "../../api/callout";
import {
  useGetCustomers,
  useGetWells,
  useGetHoleSections,
  useCreateWell,
} from "../../api/dropdowns";

type FormState = {
  // core refs
  rig_number: string;
  customer: string; // customer id
  field_name: string;
  well: string; // well id
  hole_section: string; // hole section id

  // service category & toggles
  service_category: string;
  wireline_casing_survey: boolean;
  wireline_orientation_survey: boolean;
  wireline_drillpipe_survey: boolean;
  wireline_pumpdown_survey: boolean;
  wireline_orientation_multishot_survey: boolean;
  memory_casing_slickline: boolean;
  memory_drillpipe_slickline: boolean;
  memory_pumpdown_survey: boolean;
  drop_gyro_lt_20: boolean;
  drop_gyro_gt_20: boolean;
  dry_hole_drop_gyro_system: boolean;

  // coordinates
  well_center_lat_deg: string;
  well_center_lat_min: string;
  well_center_lat_sec: string;
  well_center_lng_deg: string;
  well_center_lng_min: string;
  well_center_lng_sec: string;
  utm_northing: string;
  utm_easting: string;

  // well info
  casing_size_inch: string;
  drillpipe_size_inch: string;
  minimum_id_inch: string;
  ground_elevation_m: string;
  rig_floor_elevation_m: string;
  maximum_inclination_deg: string;
  well_profile: string;
  max_downhole_temp_c: string;
  h2s_level: string;

  // survey info
  survey_start_depth_m: string;
  survey_end_depth_m: string;
  whipstock_orientation_depth_m: string;
  motor_orientation_depth_m: string;
  ubho_sub_size: string;
  ubho_sub_connection_size: string;
  ubho_sub_date_required: string;
  side_entry_sub_size: string;
  side_entry_sub_connection_size: string;
  side_entry_sub_date_required: string;

  equipment_required_date: string;
  equipment_required_time: string;
  crew_required_date: string;
  crew_required_time: string;

  // contact & comments
  notes: string;
  callout_completed_by: string;
  completed_by_designation: string;
  contact_number: string;
  authorization: string;
};

// helper to match CreateCalloutPage behaviour
function toNumberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function CalloutEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useCallout(id);
  const {
    mutate: updateCallout,
    isPending: isSaving,
    error: saveError,
  } = useUpdateCallout();

  // dropdown data
  const { data: customers = [] } = useGetCustomers();
  const {
    data: wells = [],
    refetch: refetchWells,
  } = useGetWells();
  const { data: holeSections = [] } = useGetHoleSections();

  const [form, setForm] = useState<FormState | null>(null);

  // --- Create Well modal state ---
  const [isWellModalOpen, setIsWellModalOpen] = useState(false);
  const [newWell, setNewWell] = useState({
    name: "",
    well_id: "",
    well_center_lat_deg: "",
    well_center_lat_min: "",
    well_center_lat_sec: "",
    well_center_lng_deg: "",
    well_center_lng_min: "",
    well_center_lng_sec: "",
    utm_northing: "",
    utm_easting: "",
    ground_elevation_m: "",
  });

  const {
    mutate: createWell,
    isPending: isCreatingWell,
  } = useCreateWell();

  // Populate form once callout is loaded
  useEffect(() => {
    if (!data) return;

    const c = data as any;

    setForm({
      // core
      rig_number: c.rig_number ? String(c.rig_number) : "",
      customer: c.customer ? String(c.customer) : "",
      field_name: c.field_name || "",
      well: c.well ? String(c.well) : "",
      hole_section: c.hole_section ? String(c.hole_section) : "",

      // service category & toggles
      service_category: c.service_category || "",
      wireline_casing_survey: !!c.wireline_casing_survey,
      wireline_orientation_survey: !!c.wireline_orientation_survey,
      wireline_drillpipe_survey: !!c.wireline_drillpipe_survey,
      wireline_pumpdown_survey: !!c.wireline_pumpdown_survey,
      wireline_orientation_multishot_survey:
        !!c.wireline_orientation_multishot_survey,
      memory_casing_slickline: !!c.memory_casing_slickline,
      memory_drillpipe_slickline: !!c.memory_drillpipe_slickline,
      memory_pumpdown_survey: !!c.memory_pumpdown_survey,
      drop_gyro_lt_20: !!c.drop_gyro_lt_20,
      drop_gyro_gt_20: !!c.drop_gyro_gt_20,
      dry_hole_drop_gyro_system: !!c.dry_hole_drop_gyro_system,

      // coordinates
      well_center_lat_deg:
        c.well_center_lat_deg !== null && c.well_center_lat_deg !== undefined
          ? String(c.well_center_lat_deg)
          : "",
      well_center_lat_min:
        c.well_center_lat_min !== null && c.well_center_lat_min !== undefined
          ? String(c.well_center_lat_min)
          : "",
      well_center_lat_sec:
        c.well_center_lat_sec !== null && c.well_center_lat_sec !== undefined
          ? String(c.well_center_lat_sec)
          : "",
      well_center_lng_deg:
        c.well_center_lng_deg !== null && c.well_center_lng_deg !== undefined
          ? String(c.well_center_lng_deg)
          : "",
      well_center_lng_min:
        c.well_center_lng_min !== null && c.well_center_lng_min !== undefined
          ? String(c.well_center_lng_min)
          : "",
      well_center_lng_sec:
        c.well_center_lng_sec !== null && c.well_center_lng_sec !== undefined
          ? String(c.well_center_lng_sec)
          : "",
      utm_northing: c.utm_northing || "",
      utm_easting: c.utm_easting || "",

      // well info
      casing_size_inch:
        c.casing_size_inch !== null && c.casing_size_inch !== undefined
          ? String(c.casing_size_inch)
          : "",
      drillpipe_size_inch:
        c.drillpipe_size_inch !== null && c.drillpipe_size_inch !== undefined
          ? String(c.drillpipe_size_inch)
          : "",
      minimum_id_inch:
        c.minimum_id_inch !== null && c.minimum_id_inch !== undefined
          ? String(c.minimum_id_inch)
          : "",
      ground_elevation_m:
        c.ground_elevation_m !== null && c.ground_elevation_m !== undefined
          ? String(c.ground_elevation_m)
          : "",
      rig_floor_elevation_m:
        c.rig_floor_elevation_m !== null && c.rig_floor_elevation_m !== undefined
          ? String(c.rig_floor_elevation_m)
          : "",
      maximum_inclination_deg:
        c.maximum_inclination_deg !== null &&
        c.maximum_inclination_deg !== undefined
          ? String(c.maximum_inclination_deg)
          : "",
      well_profile: c.well_profile || "",
      max_downhole_temp_c:
        c.max_downhole_temp_c !== null && c.max_downhole_temp_c !== undefined
          ? String(c.max_downhole_temp_c)
          : "",
      h2s_level: c.h2s_level || "",

      // survey info
      survey_start_depth_m:
        c.survey_start_depth_m !== null &&
        c.survey_start_depth_m !== undefined
          ? String(c.survey_start_depth_m)
          : "",
      survey_end_depth_m:
        c.survey_end_depth_m !== null && c.survey_end_depth_m !== undefined
          ? String(c.survey_end_depth_m)
          : "",
      whipstock_orientation_depth_m:
        c.whipstock_orientation_depth_m !== null &&
        c.whipstock_orientation_depth_m !== undefined
          ? String(c.whipstock_orientation_depth_m)
          : "",
      motor_orientation_depth_m:
        c.motor_orientation_depth_m !== null &&
        c.motor_orientation_depth_m !== undefined
          ? String(c.motor_orientation_depth_m)
          : "",
      ubho_sub_size: c.ubho_sub_size || "",
      ubho_sub_connection_size: c.ubho_sub_connection_size || "",
      ubho_sub_date_required: c.ubho_sub_date_required || "",
      side_entry_sub_size: c.side_entry_sub_size || "",
      side_entry_sub_connection_size: c.side_entry_sub_connection_size || "",
      side_entry_sub_date_required: c.side_entry_sub_date_required || "",

      equipment_required_date: c.equipment_required_date || "",
      equipment_required_time: c.equipment_required_time || "",
      crew_required_date: c.crew_required_date || "",
      crew_required_time: c.crew_required_time || "",

      // contact & comments
      notes: c.notes || "",
      callout_completed_by: c.callout_completed_by || "",
      completed_by_designation: c.completed_by_designation || "",
      contact_number: c.contact_number || "",
      authorization: c.authorization || "",
    });
  }, [data]);

  const surveyInterval = useMemo(() => {
    if (!form) return "";
    const start = Number(form.survey_start_depth_m) || 0;
    const end = Number(form.survey_end_depth_m) || 0;
    if (!form.survey_start_depth_m.trim() || !form.survey_end_depth_m.trim()) {
      return "";
    }
    return String(end - start);
  }, [form]);

  if (isLoading || !form) {
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
          className="text-xs text-slate-700 underline dark:text-slate-200"
        >
          Back to list
        </button>
      </div>
    );
  }

  const callout = data as any;

  // Only editable when status === "draft"
  const canEdit = callout.status === "draft";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, type } = target;
    const value =
      type === "checkbox" ? (target as HTMLInputElement).checked : target.value;

    setForm((prev) => (prev ? { ...prev, [name]: value as any } : prev));
  };

  // --- create well modal handlers ---
  const handleNewWellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewWell((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateWellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWell.name || !newWell.well_id) return;

    createWell(
      {
        name: newWell.name,
        well_id: newWell.well_id,
        well_center_lat_deg: toNumberOrNull(newWell.well_center_lat_deg),
        well_center_lat_min: toNumberOrNull(newWell.well_center_lat_min),
        well_center_lat_sec: toNumberOrNull(newWell.well_center_lat_sec),
        well_center_lng_deg: toNumberOrNull(newWell.well_center_lng_deg),
        well_center_lng_min: toNumberOrNull(newWell.well_center_lng_min),
        well_center_lng_sec: toNumberOrNull(newWell.well_center_lng_sec),
        utm_northing: newWell.utm_northing,
        utm_easting: newWell.utm_easting,
        ground_elevation_m: toNumberOrNull(newWell.ground_elevation_m),
      } as any,
      {
        onSuccess: (created: any) => {
          // refresh wells so the new one appears in dropdown
          refetchWells();

          // select new well in form
          setForm((prev) =>
            prev ? { ...prev, well: String(created.id) } : prev
          );

          // close modal & reset
          setIsWellModalOpen(false);
          setNewWell({
            name: "",
            well_id: "",
            well_center_lat_deg: "",
            well_center_lat_min: "",
            well_center_lat_sec: "",
            well_center_lng_deg: "",
            well_center_lng_min: "",
            well_center_lng_sec: "",
            utm_northing: "",
            utm_easting: "",
            ground_elevation_m: "",
          });
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form || !canEdit) return;

    const payload: Record<string, any> = {
      // core references
      rig_number: toNumberOrNull(form.rig_number),
      customer: form.customer ? Number(form.customer) : null,
      field_name: form.field_name,
      well: form.well ? Number(form.well) : null,
      hole_section: form.hole_section ? Number(form.hole_section) : null,

      // service required
      service_category: form.service_category || null,
      wireline_casing_survey: form.wireline_casing_survey,
      wireline_orientation_survey: form.wireline_orientation_survey,
      wireline_drillpipe_survey: form.wireline_drillpipe_survey,
      wireline_pumpdown_survey: form.wireline_pumpdown_survey,
      wireline_orientation_multishot_survey:
        form.wireline_orientation_multishot_survey,
      memory_casing_slickline: form.memory_casing_slickline,
      memory_drillpipe_slickline: form.memory_drillpipe_slickline,
      memory_pumpdown_survey: form.memory_pumpdown_survey,
      drop_gyro_lt_20: form.drop_gyro_lt_20,
      drop_gyro_gt_20: form.drop_gyro_gt_20,
      dry_hole_drop_gyro_system: form.dry_hole_drop_gyro_system,

      // coordinates
      well_center_lat_deg: toNumberOrNull(form.well_center_lat_deg),
      well_center_lat_min: toNumberOrNull(form.well_center_lat_min),
      well_center_lat_sec: toNumberOrNull(form.well_center_lat_sec),
      well_center_lng_deg: toNumberOrNull(form.well_center_lng_deg),
      well_center_lng_min: toNumberOrNull(form.well_center_lng_min),
      well_center_lng_sec: toNumberOrNull(form.well_center_lng_sec),
      utm_northing: form.utm_northing,
      utm_easting: form.utm_easting,

      // well info
      casing_size_inch: toNumberOrNull(form.casing_size_inch),
      drillpipe_size_inch: toNumberOrNull(form.drillpipe_size_inch),
      minimum_id_inch: toNumberOrNull(form.minimum_id_inch),
      ground_elevation_m: toNumberOrNull(form.ground_elevation_m),
      rig_floor_elevation_m: toNumberOrNull(form.rig_floor_elevation_m),
      maximum_inclination_deg: toNumberOrNull(form.maximum_inclination_deg),
      well_profile: form.well_profile,
      max_downhole_temp_c: toNumberOrNull(form.max_downhole_temp_c),
      h2s_level: form.h2s_level,

      // survey info
      survey_start_depth_m: toNumberOrNull(form.survey_start_depth_m),
      survey_end_depth_m: toNumberOrNull(form.survey_end_depth_m),
      survey_interval_m: toNumberOrNull(surveyInterval),
      whipstock_orientation_depth_m: toNumberOrNull(
        form.whipstock_orientation_depth_m
      ),
      motor_orientation_depth_m: toNumberOrNull(
        form.motor_orientation_depth_m
      ),
      ubho_sub_size: form.ubho_sub_size,
      ubho_sub_connection_size: form.ubho_sub_connection_size,
      ubho_sub_date_required: form.ubho_sub_date_required || null,
      side_entry_sub_size: form.side_entry_sub_size,
      side_entry_sub_connection_size: form.side_entry_sub_connection_size,
      side_entry_sub_date_required: form.side_entry_sub_date_required || null,
      equipment_required_date: form.equipment_required_date || null,
      equipment_required_time: form.equipment_required_time || null,
      crew_required_date: form.crew_required_date || null,
      crew_required_time: form.crew_required_time || null,

      // contact & comments
      notes: form.notes,
      callout_completed_by: form.callout_completed_by,
      completed_by_designation: form.completed_by_designation,
      contact_number: form.contact_number,
      authorization: form.authorization,
    };

    updateCallout(
      { id: Number(id), payload },
      {
        onSuccess: () => {
          navigate(`/callouts/${id}`);
        },
      }
    );
  };

  if (!canEdit) {
    // Safety guard: if user tries to open edit page when not draft
    return (
      <div className="space-y-4 p-6">
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          This callout is <span className="font-semibold">{callout.status}</span>.
          Only callouts in <span className="font-semibold">Draft</span> status can be edited.
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/callouts/${id}`)}
            className="text-xs rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Back to Callout Detail
          </button>
          <button
            onClick={() => navigate("/callouts")}
            className="text-xs rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Back to Callout List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Edit Callout
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {callout.callout_number}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/callouts/${id}`)}
            className="text-xs rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          Failed to save changes. Please try again.
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {/* GENERAL */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            General Information
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Customer */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Customer <span className="text-rose-500">*</span>
              </label>
              <select
                name="customer"
                value={form.customer}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rig number */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Rig number <span className="text-rose-500">*</span>
              </label>
              <input
                name="rig_number"
                value={form.rig_number}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                required
              />
            </div>

            {/* Well */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] text-slate-500">
                  Well Name
                </label>
                <button
                  type="button"
                  onClick={() => setIsWellModalOpen(true)}
                  className="text-[10px] rounded-full border border-slate-300 px-2 py-0.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  + Create Well
                </button>
              </div>
              <select
                name="well"
                value={form.well}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select Well</option>
                {wells.map((well: any) => (
                  <option key={well.id} value={well.id}>
                    {well.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hole section */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Hole Section
              </label>
              <select
                name="hole_section"
                value={form.hole_section}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select Hole Section</option>
                {holeSections.map((section: any) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field name */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Field name
              </label>
              <input
                name="field_name"
                value={form.field_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            {/* Service category */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Service category
              </label>
              <select
                name="service_category"
                value={form.service_category}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">—</option>
                <option value="wireline_gyro">Wireline Gyro Surveys</option>
                <option value="memory_gyro">Memory Gyro Surveys</option>
              </select>
            </div>
          </div>
        </section>

        {/* TYPE OF SERVICE */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Type of Service Required
          </h2>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <input
                type="radio"
                className="h-3 w-3"
                name="service_category_radio_wireline"
                checked={form.service_category === "wireline_gyro"}
                onChange={() =>
                  setForm((prev) =>
                    prev ? { ...prev, service_category: "wireline_gyro" } : prev
                  )
                }
              />
              Wireline gyro survey
            </label>
            <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <input
                type="radio"
                className="h-3 w-3"
                name="service_category_radio_memory"
                checked={form.service_category === "memory_gyro"}
                onChange={() =>
                  setForm((prev) =>
                    prev ? { ...prev, service_category: "memory_gyro" } : prev
                  )
                }
              />
              Memory gyro survey
            </label>
          </div>

          {/* wireline options */}
          {form.service_category === "wireline_gyro" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] dark:border-slate-700 dark:bg-slate-900/40">
              <p className="mb-2 font-medium text-slate-600 dark:text-slate-300">
                Wireline gyro services
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="wireline_casing_survey"
                    checked={form.wireline_casing_survey}
                    onChange={handleChange}
                  />
                  Casing gyro survey
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="wireline_orientation_survey"
                    checked={form.wireline_orientation_survey}
                    onChange={handleChange}
                  />
                  Orientation survey
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="wireline_drillpipe_survey"
                    checked={form.wireline_drillpipe_survey}
                    onChange={handleChange}
                  />
                  Drillpipe survey
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="wireline_pumpdown_survey"
                    checked={form.wireline_pumpdown_survey}
                    onChange={handleChange}
                  />
                  Pump down survey
                </label>
                <label className="inline-flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    name="wireline_orientation_multishot_survey"
                    checked={form.wireline_orientation_multishot_survey}
                    onChange={handleChange}
                  />
                  Orientation / multishot survey
                </label>
              </div>
            </div>
          )}

          {/* memory options */}
          {form.service_category === "memory_gyro" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] dark:border-slate-700 dark:bg-slate-900/40">
              <p className="mb-2 font-medium text-slate-600 dark:text-slate-300">
                Memory gyro services
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="memory_casing_slickline"
                    checked={form.memory_casing_slickline}
                    onChange={handleChange}
                  />
                  Casing (slickline / memory)
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="memory_drillpipe_slickline"
                    checked={form.memory_drillpipe_slickline}
                    onChange={handleChange}
                  />
                  Drillpipe (slickline / memory)
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="memory_pumpdown_survey"
                    checked={form.memory_pumpdown_survey}
                    onChange={handleChange}
                  />
                  Pump down survey
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="drop_gyro_lt_20"
                    checked={form.drop_gyro_lt_20}
                    onChange={handleChange}
                  />
                  Drop gyro &lt; 20"
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="drop_gyro_gt_20"
                    checked={form.drop_gyro_gt_20}
                    onChange={handleChange}
                  />
                  Drop gyro &gt; 20"
                </label>
                <label className="inline-flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    name="dry_hole_drop_gyro_system"
                    checked={form.dry_hole_drop_gyro_system}
                    onChange={handleChange}
                  />
                  Dry hole drop gyro system
                </label>
              </div>
            </div>
          )}
        </section>

        {/* WELL INFORMATION */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Additional Well Information
          </h2>

          {/* Coordinates */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Latitude (deg / min / sec)
              </label>
              <div className="flex gap-2">
                <input
                  name="well_center_lat_deg"
                  value={form.well_center_lat_deg}
                  onChange={handleChange}
                  placeholder="deg"
                  className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  name="well_center_lat_min"
                  value={form.well_center_lat_min}
                  onChange={handleChange}
                  placeholder="min"
                  className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  name="well_center_lat_sec"
                  value={form.well_center_lat_sec}
                  onChange={handleChange}
                  placeholder="sec"
                  className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Longitude (deg / min / sec)
              </label>
              <div className="flex gap-2">
                <input
                  name="well_center_lng_deg"
                  value={form.well_center_lng_deg}
                  onChange={handleChange}
                  placeholder="deg"
                  className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  name="well_center_lng_min"
                  value={form.well_center_lng_min}
                  onChange={handleChange}
                  placeholder="min"
                  className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  name="well_center_lng_sec"
                  value={form.well_center_lng_sec}
                  onChange={handleChange}
                  placeholder="sec"
                  className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* UTM */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                UTM northing
              </label>
              <input
                name="utm_northing"
                value={form.utm_northing}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                UTM easting
              </label>
              <input
                name="utm_easting"
                value={form.utm_easting}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          {/* sizes */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Casing size (in)
              </label>
              <input
                name="casing_size_inch"
                value={form.casing_size_inch}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Drillpipe size (in)
              </label>
              <input
                name="drillpipe_size_inch"
                value={form.drillpipe_size_inch}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Minimum ID (in)
              </label>
              <input
                name="minimum_id_inch"
                value={form.minimum_id_inch}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          {/* elevations & profile */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Ground elevation (m)
              </label>
              <input
                name="ground_elevation_m"
                value={form.ground_elevation_m}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Rig floor elevation (m)
              </label>
              <input
                name="rig_floor_elevation_m"
                value={form.rig_floor_elevation_m}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Max inclination (°)
              </label>
              <input
                name="maximum_inclination_deg"
                value={form.maximum_inclination_deg}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Well profile
              </label>
              <input
                name="well_profile"
                value={form.well_profile}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Max downhole temp (°C)
              </label>
              <input
                name="max_downhole_temp_c"
                value={form.max_downhole_temp_c}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                H₂S level
              </label>
              <input
                name="h2s_level"
                value={form.h2s_level}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
        </section>

        {/* SURVEY INFORMATION */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Survey Information
          </h2>

          {/* depths */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Start depth (m)
              </label>
              <input
                name="survey_start_depth_m"
                value={form.survey_start_depth_m}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                End depth (m)
              </label>
              <input
                name="survey_end_depth_m"
                value={form.survey_end_depth_m}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Survey interval (m)
              </label>
              <input
                value={surveyInterval}
                readOnly
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              />
            </div>
          </div>

          {/* whipstock & motor */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Whipstock orientation depth (m)
              </label>
              <input
                name="whipstock_orientation_depth_m"
                value={form.whipstock_orientation_depth_m}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Motor orientation depth (m)
              </label>
              <input
                name="motor_orientation_depth_m"
                value={form.motor_orientation_depth_m}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          {/* UBHO sub */}
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-500">
              UBHO sub
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                name="ubho_sub_size"
                placeholder="UBHO sub size"
                value={form.ubho_sub_size}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                name="ubho_sub_connection_size"
                placeholder="UBHO connection size"
                value={form.ubho_sub_connection_size}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                type="date"
                name="ubho_sub_date_required"
                value={form.ubho_sub_date_required}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Side-entry sub */}
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-500">
              Side-entry sub
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                name="side_entry_sub_size"
                placeholder="Side-entry sub size"
                value={form.side_entry_sub_size}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                name="side_entry_sub_connection_size"
                placeholder="Side-entry connection size"
                value={form.side_entry_sub_connection_size}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                type="date"
                name="side_entry_sub_date_required"
                value={form.side_entry_sub_date_required}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Equipment / Crew */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Equipment required (date / time)
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="equipment_required_date"
                  value={form.equipment_required_date}
                  onChange={handleChange}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  type="time"
                  name="equipment_required_time"
                  value={form.equipment_required_time}
                  onChange={handleChange}
                  className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Crew required (date / time)
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="crew_required_date"
                  value={form.crew_required_date}
                  onChange={handleChange}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  type="time"
                  name="crew_required_time"
                  value={form.crew_required_time}
                  onChange={handleChange}
                  className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT + NOTES */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Contact & Comments
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Completed by
              </label>
              <input
                name="callout_completed_by"
                value={form.callout_completed_by}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Designation
              </label>
              <input
                name="completed_by_designation"
                value={form.completed_by_designation}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Contact number
              </label>
              <input
                name="contact_number"
                value={form.contact_number}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-500">
                Authorization
              </label>
              <input
                name="authorization"
                value={form.authorization}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] text-slate-500">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-2 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate(`/callouts/${id}`)}
            className="text-xs rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="text-xs rounded-full border border-emerald-500 bg-emerald-500 px-3 py-1.5 font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* CREATE WELL MODAL */}
      {isWellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Create Well
              </h2>
              <button
                type="button"
                onClick={() => setIsWellModalOpen(false)}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleCreateWellSubmit}>
              {/* Name & Well ID */}
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">
                  Well Name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  value={newWell.name}
                  onChange={handleNewWellChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">
                  Well ID <span className="text-rose-500">*</span>
                </label>
                <input
                  name="well_id"
                  value={newWell.well_id}
                  onChange={handleNewWellChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  required
                />
              </div>

              {/* Coordinates */}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">
                    Latitude (deg / min / sec)
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="well_center_lat_deg"
                      value={newWell.well_center_lat_deg}
                      onChange={handleNewWellChange}
                      placeholder="deg"
                      type="number"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      name="well_center_lat_min"
                      value={newWell.well_center_lat_min}
                      onChange={handleNewWellChange}
                      placeholder="min"
                      type="number"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      name="well_center_lat_sec"
                      value={newWell.well_center_lat_sec}
                      onChange={handleNewWellChange}
                      placeholder="sec"
                      type="number"
                      step="0.001"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">
                    Longitude (deg / min / sec)
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="well_center_lng_deg"
                      value={newWell.well_center_lng_deg}
                      onChange={handleNewWellChange}
                      placeholder="deg"
                      type="number"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      name="well_center_lng_min"
                      value={newWell.well_center_lng_min}
                      onChange={handleNewWellChange}
                      placeholder="min"
                      type="number"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      name="well_center_lng_sec"
                      value={newWell.well_center_lng_sec}
                      onChange={handleNewWellChange}
                      placeholder="sec"
                      type="number"
                      step="0.001"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* UTM & elevation */}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">
                    UTM northing
                  </label>
                  <input
                    name="utm_northing"
                    value={newWell.utm_northing}
                    onChange={handleNewWellChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">
                    UTM easting
                  </label>
                  <input
                    name="utm_easting"
                    value={newWell.utm_easting}
                    onChange={handleNewWellChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">
                  Ground elevation (m)
                </label>
                <input
                  name="ground_elevation_m"
                  value={newWell.ground_elevation_m}
                  onChange={handleNewWellChange}
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              {/* Actions */}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWellModalOpen(false)}
                  className="text-xs rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWell}
                  className="text-xs rounded-full border border-emerald-500 bg-emerald-500 px-3 py-1.5 font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingWell ? "Creating…" : "Create Well"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
