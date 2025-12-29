// src/pages/Config/RigsPage.tsx
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

type Rig = {
  id: number;
  rig_number: string;
};

type CreateRigPayload = {
  rig_number: string;
};

async function fetchRigs(): Promise<Rig[]> {
  const res = await api.get<Rig[]>("/rigs/");
  return res.data;
}

async function postRig(payload: CreateRigPayload): Promise<Rig> {
  const res = await api.post<Rig>("/rigs/", payload);
  return res.data;
}

function useGetRigsConfig() {
  return useQuery({
    queryKey: ["config", "rigs"],
    queryFn: fetchRigs,
  });
}

function useCreateRigConfig() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: postRig,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["config", "rigs"] });
    },
  });
}

export default function RigsPage() {
  const { data: rigs = [], isLoading, isError } = useGetRigsConfig();
  const createRig = useCreateRigConfig();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ rig_number: "" });

  const sortedRigs = useMemo(() => {
    return [...rigs].sort((a, b) =>
      `${a.rig_number}`.localeCompare(`${b.rig_number}`, undefined, {
        sensitivity: "base",
        numeric: true,
      })
    );
  }, [rigs]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => setForm({ rig_number: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.rig_number.trim()) {
      toast.error("Please fill in the required fields.");
      return;
    }

    createRig.mutate(
      { rig_number: form.rig_number.trim() },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
          toast.success("Rig created successfully!", {
            style: {
              fontSize: "12px",
              borderRadius: "12px",
              background: "#333",
              color: "#fff",
            },
          });
        },
        onError: () => {
          toast.error("Can't create the rig. Rig number might be taken.", {
            style: {
              fontSize: "12px",
              borderRadius: "12px",
            },
          });
        },
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Rigs</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage rigs used across callouts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-transform hover:scale-105 active:scale-95 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          + Create Rig
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="text-xs text-slate-500 dark:text-slate-300">Loading rigs…</div>
        ) : isError ? (
          <div className="text-xs text-rose-600 dark:text-rose-400">Failed to load rigs.</div>
        ) : sortedRigs.length === 0 ? (
          <div className="text-xs text-slate-500 dark:text-slate-300">
            No rigs yet. Create your first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-3 font-semibold text-slate-600 dark:text-slate-300">
                    #
                  </th>
                  <th className="py-2 pr-3 font-semibold text-slate-600 dark:text-slate-300">
                    Rig Number
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRigs.map((r, idx) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 pr-3 text-slate-900 dark:text-slate-50 font-medium">
                      {r.rig_number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Create Rig
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (!createRig.isPending) resetForm();
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
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Rig Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="rig_number"
                    value={form.rig_number}
                    onChange={onChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                    placeholder="e.g. RIG-001"
                    required
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      if (!createRig.isPending) resetForm();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createRig.isPending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createRig.isPending ? "Creating..." : "Create Rig"}
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
