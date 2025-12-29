// src/pages/Config/Wells/WellsPage.tsx
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast"; // Added Toast imports
import { useCreateWellConfig, useGetWellsConfig } from "../../api/wells";

function toNumberOrNull(v: string): number | null {
  if (!v?.trim()) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export default function WellsPage() {
  const { data: wells = [], isLoading, isError } = useGetWellsConfig();
  const createWell = useCreateWellConfig();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
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
  });

  const sortedWells = useMemo(() => {
    return [...wells].sort((a, b) =>
      `${a.name}`.localeCompare(`${b.name}`, undefined, { sensitivity: "base", numeric: true })
    );
  }, [wells]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setForm({
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
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.well_id.trim()) {
        toast.error("Please fill in the required fields.");
        return;
    }

    createWell.mutate(
      {
        name: form.name.trim(),
        well_id: form.well_id.trim(),
        well_center_lat_deg: toNumberOrNull(form.well_center_lat_deg),
        well_center_lat_min: toNumberOrNull(form.well_center_lat_min),
        well_center_lat_sec: toNumberOrNull(form.well_center_lat_sec),
        well_center_lng_deg: toNumberOrNull(form.well_center_lng_deg),
        well_center_lng_min: toNumberOrNull(form.well_center_lng_min),
        well_center_lng_sec: toNumberOrNull(form.well_center_lng_sec),
        utm_northing: form.utm_northing || "",
        utm_easting: form.utm_easting || "",
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
          // ✅ Success Notification
          toast.success("Well created successfully!", {
            style: {
              fontSize: '12px',
              borderRadius: '12px',
              background: '#333',
              color: '#fff',
            },
          });
        },
        onError: () => {
          // ❌ Error Notification
          toast.error("Can't create the well. Name or ID might be taken.", {
            style: {
              fontSize: '12px',
              borderRadius: '12px',
            },
          });
        }
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Toast Container - Place this anywhere in the JSX */}
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Wells</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage wells used across callouts.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-transform hover:scale-105 active:scale-95 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          + Create Well
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="text-xs text-slate-500 dark:text-slate-300">Loading wells…</div>
        ) : isError ? (
          <div className="text-xs text-rose-600 dark:text-rose-400">Failed to load wells.</div>
        ) : sortedWells.length === 0 ? (
          <div className="text-xs text-slate-500 dark:text-slate-300">No wells yet. Create your first one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-3 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                  <th className="py-2 pr-3 font-semibold text-slate-600 dark:text-slate-300">Well ID</th>
                  <th className="py-2 pr-3 font-semibold text-slate-600 dark:text-slate-300">Lat (D/M/S)</th>
                  <th className="py-2 pr-3 font-semibold text-slate-600 dark:text-slate-300">Lng (D/M/S)</th>
                  <th className="py-2 pr-3 font-semibold text-slate-600 dark:text-slate-300">UTM Northing</th>
                  <th className="py-2 pr-3 font-semibold text-slate-600 dark:text-slate-300">UTM Easting</th>
                </tr>
              </thead>
              <tbody>
                {sortedWells.map((w) => (
                  <tr key={w.id} className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pr-3 text-slate-900 dark:text-slate-50 font-medium">{w.name}</td>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">{w.well_id}</td>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">
                      {w.well_center_lat_deg ?? "—"}° {w.well_center_lat_min ?? "—"} ' {" "}
                      {w.well_center_lat_sec ?? "—"}"
                    </td>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">
                      {w.well_center_lng_deg ?? "—"}° {w.well_center_lng_min ?? "—"} '{" "}
                      {w.well_center_lng_sec ?? "—"}"
                    </td>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">{w.utm_northing || "—"}</td>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">{w.utm_easting || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Animated Modal Section */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Create Well</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (!createWell.isPending) resetForm();
                  }}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form className="space-y-4" onSubmit={submit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Well Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="e.g. Well Alpha-1"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Well ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="well_id"
                      value={form.well_id}
                      onChange={onChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="e.g. W-102"
                      required
                    />
                  </div>
                </div>

                {/* Latitude inputs... (same as before) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Latitude (deg / min / sec)</label>
                  <div className="flex gap-2">
                    <input name="well_center_lat_deg" value={form.well_center_lat_deg} onChange={onChange} placeholder="Deg" type="number" className="w-1/3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
                    <input name="well_center_lat_min" value={form.well_center_lat_min} onChange={onChange} placeholder="Min" type="number" className="w-1/3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
                    <input name="well_center_lat_sec" value={form.well_center_lat_sec} onChange={onChange} placeholder="Sec" type="number" step="0.001" className="w-1/3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
                  </div>
                </div>

                {/* Longitude inputs... (same as before) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Longitude (deg / min / sec)</label>
                  <div className="flex gap-2">
                    <input name="well_center_lng_deg" value={form.well_center_lng_deg} onChange={onChange} placeholder="Deg" type="number" className="w-1/3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
                    <input name="well_center_lng_min" value={form.well_center_lng_min} onChange={onChange} placeholder="Min" type="number" className="w-1/3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
                    <input name="well_center_lng_sec" value={form.well_center_lng_sec} onChange={onChange} placeholder="Sec" type="number" step="0.001" className="w-1/3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">UTM Northing</label>
                    <input name="utm_northing" value={form.utm_northing} onChange={onChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">UTM Easting</label>
                    <input name="utm_easting" value={form.utm_easting} onChange={onChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      if (!createWell.isPending) resetForm();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createWell.isPending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createWell.isPending ? "Creating..." : "Create Well"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}