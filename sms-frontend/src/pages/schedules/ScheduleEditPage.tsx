// src/pages/Schedules/ScheduleEditPage.tsx
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSros } from "../../api/sros";
import {
  useEquipmentTypes,
  useResources,
  useSchedule,
  useUpdateSchedule,
} from "../../api/schedules";

export function ScheduleEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: sros } = useSros();

  // ✅ load schedule
  const { data: schedule, isLoading, error } = useSchedule(id);

  // ✅ update mutation
  const updateMutation = useUpdateSchedule(id || "");

  // ✅ dropdown data (FK tables)
  const { data: equipmentTypes = [] } = useEquipmentTypes();
  const { data: resources = [] } = useResources();

  // -------------------------
  // form state
  // -------------------------
  const [sroId, setSroId] = useState<string>("");

  const [financePriority, setFinancePriority] = useState<string>("");
  const [operationsPriority, setOperationsPriority] = useState<string>("");
  const [qaPriority, setQaPriority] = useState<string>("");

  const [highTemp, setHighTemp] = useState<"yes" | "no" | "">("");
  const [pressureRisk, setPressureRisk] = useState<"yes" | "no" | "">("");
  const [hseRisk, setHseRisk] = useState<"yes" | "no" | "">("");
  const [difficultyScore, setDifficultyScore] = useState<string>("");

  // ✅ FK ids (string state)
  const [equipmentTypeId, setEquipmentTypeId] = useState<string>("");
  const [resourceId, setResourceId] = useState<string>("");

  // ✅ date (use <input type="datetime-local">)
  const [scheduledDate, setScheduledDate] = useState<string>("");

  const [status, setStatus] = useState<"draft" | "planned" | "approved" | "cancelled">(
    "draft"
  );

  // Only show SROs with status = approved (same logic as create)
  const selectableSros = useMemo(() => {
    const list = (sros as any[] | undefined) ?? [];
    return list.filter((sro) => String(sro.status).toLowerCase() === "approved");
  }, [sros]);

  // -------------------------
  // Prefill when schedule loads
  // -------------------------
  useEffect(() => {
    if (!schedule) return;

    setSroId(schedule.sro ? String(schedule.sro) : "");

    setFinancePriority(schedule.finance_priority == null ? "" : String(schedule.finance_priority));
    setOperationsPriority(
      schedule.operations_priority == null ? "" : String(schedule.operations_priority)
    );
    setQaPriority(schedule.qa_priority == null ? "" : String(schedule.qa_priority));

    setHighTemp(schedule.high_temp == null ? "" : schedule.high_temp ? "yes" : "no");
    setPressureRisk(schedule.pressure_risk == null ? "" : schedule.pressure_risk ? "yes" : "no");
    setHseRisk(schedule.hse_risk == null ? "" : schedule.hse_risk ? "yes" : "no");

    setDifficultyScore(schedule.difficulty_score == null ? "" : String(schedule.difficulty_score));

    // FK ids
    setEquipmentTypeId(schedule.type_of_equipment == null ? "" : String(schedule.type_of_equipment));
    setResourceId(schedule.resource == null ? "" : String(schedule.resource));

    // scheduled_date -> datetime-local expects "YYYY-MM-DDTHH:mm"
    // if backend sends ISO like "2025-01-10T12:34:56Z"
    if (schedule.scheduled_date) {
      const d = new Date(schedule.scheduled_date);
      const pad = (n: number) => String(n).padStart(2, "0");
      const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
      setScheduledDate(local);
    } else {
      setScheduledDate("");
    }

    setStatus((schedule.status as any) || "draft");
  }, [schedule]);

  // If SRO is not in selectable list, still allow showing it (editing existing schedule)
  const canShowCurrentSro =
    !!sroId && !selectableSros.some((sro: any) => String(sro.id) === String(sroId));

  const priorityOptions = [1, 2, 3, 4, 5];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!id) return;

    // IMPORTANT: FK values must be number OR null (never "")
    updateMutation.mutate(
      {
        // Usually you DO NOT want to change sro on edit because OneToOne.
        // If you want to allow it, keep it. If not, you can remove this line and disable the dropdown.
        sro: sroId ? Number(sroId) : undefined,

        finance_priority: financePriority ? Number(financePriority) : null,
        operations_priority: operationsPriority ? Number(operationsPriority) : null,
        qa_priority: qaPriority ? Number(qaPriority) : null,

        high_temp: highTemp === "" ? null : highTemp === "yes",
        pressure_risk: pressureRisk === "" ? null : pressureRisk === "yes",
        hse_risk: hseRisk === "" ? null : hseRisk === "yes",

        difficulty_score: difficultyScore ? Number(difficultyScore) : null,

        type_of_equipment: equipmentTypeId ? Number(equipmentTypeId) : null,
        resource: resourceId ? Number(resourceId) : null,

        // scheduled_date: send ISO string or null
        // datetime-local gives "YYYY-MM-DDTHH:mm" (local). Convert to ISO.
        scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,

        status,
      },
      {
        onSuccess: () => {
          navigate(`/schedules/${id}`);
        },
      }
    );
  };

  if (isLoading) return <div className="p-4 text-sm">Loading schedule…</div>;
  if (error || !schedule) return <div className="p-4 text-sm">Failed to load schedule.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
        Edit Schedule
      </h1>

      <form
        onSubmit={handleSubmit}
        className="
          rounded-2xl border border-slate-200 bg-white p-4 text-xs
          shadow-sm dark:border-slate-800 dark:bg-slate-900
          space-y-4
        "
      >
        {/* SRO selection */}
        <div>
          <label className="block mb-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            SRO
          </label>

          <select
            value={sroId}
            onChange={(e) => setSroId(e.target.value)}
            // Recommended: lock SRO in edit since OneToOne
            disabled
            className="
              w-full rounded-xl border border-slate-300 bg-white px-3 py-2
              text-xs text-slate-900
              dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100
              disabled:opacity-70 disabled:cursor-not-allowed
            "
          >
            <option value="">Select an SRO…</option>

            {/* If current schedule's SRO isn't in selectableSros, still show it */}
            {canShowCurrentSro && (
              <option value={sroId}>
                {schedule.sro_number ?? `SRO_${schedule.sro}`} (current)
              </option>
            )}

            {selectableSros.map((sro: any) => (
              <option key={sro.id} value={sro.id}>
                {sro.sro_number} – {sro.callout_number}
              </option>
            ))}
          </select>

          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            SRO is locked during edit (One-to-One schedule).
          </div>
        </div>

        {/* scheduled date */}
        <div>
          <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
            Scheduled date
          </label>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Priority section */}
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Priority (1–5)
            </div>
          </div>

          <div>
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Finance
            </label>
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
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Operations
            </label>
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
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Q/A
            </label>
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

        {/* Complexity section */}
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Complexity
            </div>
          </div>

          <div>
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              High Temp
            </label>
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
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Pressure Risk
            </label>
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
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              HSE Risk
            </label>
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

        {/* Difficulty + status */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Difficulty score (1–5)
            </label>
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
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "planned" | "approved" | "cancelled")
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="draft">Draft</option>
              <option value="planned">Planned</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* EquipmentType & Resource (FK dropdowns) */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Type of equipment
            </label>
            <select
              value={equipmentTypeId}
              onChange={(e) => setEquipmentTypeId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="">—</option>
              {equipmentTypes.map((et: any) => (
                <option key={et.id} value={et.id}>
                  {et.equipment_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Resource
            </label>
            <select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="">—</option>
              {resources.map((r: any) => (
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
            onClick={() => navigate(-1)}
            className="
              px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-600
              hover:bg-slate-100 hover:text-slate-800
              dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
              dark:hover:bg-slate-800 dark:hover:text-slate-50
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="
              px-3 py-2 rounded-xl text-xs
              bg-slate-900 text-white
              hover:bg-slate-800
              disabled:opacity-60 disabled:cursor-not-allowed
              dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200
            "
          >
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
