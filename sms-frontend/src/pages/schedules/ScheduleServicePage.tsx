import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSros } from "../../api/sros";
import { useCreateSchedule } from "../../api/schedules";

export function ScheduleServicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: sros } = useSros();
  const createMutation = useCreateSchedule();

  // SRO coming from URL, e.g. /schedules/new?sro=5
  const initialSroIdFromUrl = searchParams.get("sro") ?? "";

  const [sroId, setSroId] = useState<string>(initialSroIdFromUrl);
  const [financePriority, setFinancePriority] = useState<string>("");
  const [operationsPriority, setOperationsPriority] = useState<string>("");
  const [qaPriority, setQaPriority] = useState<string>("");
  const [highTemp, setHighTemp] = useState<"yes" | "no" | "">("");
  const [pressureRisk, setPressureRisk] = useState<"yes" | "no" | "">("");
  const [hseRisk, setHseRisk] = useState<"yes" | "no" | "">("");
  const [difficultyScore, setDifficultyScore] = useState<string>("");
  const [equipment, setEquipment] = useState("");
  const [resource, setResource] = useState("");
  const [status, setStatus] = useState<
    "draft" | "planned" | "approved" | "cancelled"
  >("draft");

  // Only show SROs with a "scheduled" status
  const selectableSros = useMemo(() => {
    const list = (sros as any[] | undefined) ?? [];
    return list.filter((sro) => String(sro.status).toLowerCase() === "approved");
  }, [sros]);

  // If URL had sro param but that SRO is not "scheduled", clear it
  // If URL had sro param but that SRO is not "approved", clear it
useEffect(() => {
  if (!initialSroIdFromUrl) return;
  const exists = selectableSros.some(
    (sro) => String(sro.id) === initialSroIdFromUrl
  );
  if (!exists) setSroId("");
}, [initialSroIdFromUrl, selectableSros]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sroId) {
      alert("Please select an SRO");
      return;
    }

    createMutation.mutate(
      {
        sro: Number(sroId),
        finance_priority: financePriority ? Number(financePriority) : null,
        operations_priority: operationsPriority
          ? Number(operationsPriority)
          : null,
        qa_priority: qaPriority ? Number(qaPriority) : null,
        high_temp: highTemp === "" ? null : highTemp === "yes",
        pressure_risk: pressureRisk === "" ? null : pressureRisk === "yes",
        hse_risk: hseRisk === "" ? null : hseRisk === "yes",
        difficulty_score: difficultyScore ? Number(difficultyScore) : null,
        type_of_equipment: equipment,
        resource,
        status,
      },
      {
        onSuccess: (created) => {
          // After create, go to Schedule detail (where auto schedule_number is visible)
          navigate(`/schedules/${created.id}`);
        },
      }
    );
  };

  const priorityOptions = [1, 2, 3, 4, 5];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
        Create Schedule
      </h1>

      <form
        onSubmit={handleSubmit}
        className="
          rounded-2xl border border-slate-200 bg-white p-4 text-xs
          shadow-sm dark:border-slate-800 dark:bg-slate-900
          space-y-4
        "
      >
        {/* SRO selection – only 'scheduled' SROs */}
        <div>
          <label className="block mb-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            SRO
          </label>
          <select
            value={sroId}
            onChange={(e) => setSroId(e.target.value)}
            disabled={!!initialSroIdFromUrl} // 🔒 lock SRO if coming from /schedules/new?sro=...
            className="
              w-full rounded-xl border border-slate-300 bg-white px-3 py-2
              text-xs text-slate-900
              dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100
            "
          >
            <option value="">Select an SRO…</option>
            {selectableSros.map((sro: any) => (
              <option key={sro.id} value={sro.id}>
                {sro.sro_number} – {sro.callout_number}
              </option>
            ))}
          </select>
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
                setStatus(
                  e.target.value as "draft" | "planned" | "approved" | "cancelled"
                )
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

        {/* Equipment & Resource */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Type of equipment
            </label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              Resource
            </label>
            <input
              type="text"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
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
            disabled={createMutation.isPending}
            className="
              px-3 py-2 rounded-xl text-xs
              bg-slate-900 text-white
              hover:bg-slate-800
              disabled:opacity-60 disabled:cursor-not-allowed
              dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200
            "
          >
            {createMutation.isPending ? "Creating…" : "Create Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}
