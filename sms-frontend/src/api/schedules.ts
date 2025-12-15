import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./axios";

export interface Schedule {
  id: number;
  schedule_number: string;
  schedule_sequence: number;
  sro: number;
  sro_number?: string;
  finance_priority: number | null;
  operations_priority: number | null;
  qa_priority: number | null;
  average_priority: string | null;
  high_temp: boolean | null;
  pressure_risk: boolean | null;
  difficulty_score: number | null;
  hse_risk: boolean | null;
  type_of_equipment: string;
  resource: string;
  created_by: number | null;
  created_at: string;
  status: "draft" | "planned" | "approved" | "cancelled" | string;
}

export type ScheduleCreatePayload = {
  sro: number;
  finance_priority?: number | null;
  operations_priority?: number | null;
  qa_priority?: number | null;
  high_temp?: boolean | null;
  pressure_risk?: boolean | null;
  difficulty_score?: number | null;
  hse_risk?: boolean | null;
  type_of_equipment?: string;
  resource?: string;
  status?: string;
};

export type ScheduleUpdatePayload = Partial<ScheduleCreatePayload>;

// LIST
export function useSchedules() {
  return useQuery<Schedule[]>({
    queryKey: ["schedules"],
    queryFn: async () => {
      const res = await api.get("/schedules/");
      return res.data;
    },
  });
}

// DETAIL
export function useSchedule(id?: number | string) {
  return useQuery<Schedule>({
    queryKey: ["schedules", id],
    queryFn: async () => {
      const res = await api.get(`/schedules/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
}

// CREATE
export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ScheduleCreatePayload) => {
      const res = await api.post("/schedules/", payload);
      return res.data as Schedule;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

// UPDATE
export function useUpdateSchedule(id: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ScheduleUpdatePayload) => {
      const res = await api.patch(`/schedules/${id}/`, payload);
      return res.data as Schedule;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["schedules", id] });
    },
  });
}

// DELETE
export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`/schedules/${id}/`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

// ✅ APPROVE SRO (POST /sros/<id>/approve/)
// This marks the SRO as "scheduled" and returns the updated SRO object.
export function useApproveSroToSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sroId: number) => {
      const res = await api.post(`/sros/${sroId}/approve/`);
      return res.data; // SRO object
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sros"] });
    },
  });
}
