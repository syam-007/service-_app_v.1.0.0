// src/api/schedules.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./axios";

/* =========================
   TYPES
========================= */

export type EquipmentType = {
  id: number;
  equipment_name: string;
};

export type Resource = {
  id: number;
  // ⚠️ use the EXACT key your backend serializer sends:
  // if your backend field is "resouce_name" (typo), change this accordingly.
  resource_name: string;
};

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

  // ✅ now ForeignKeys (IDs)
  type_of_equipment: number | null;
  resource: number | null;

  type_of_equipment_name?: string;
  resource_name?: string;


  // ✅ new field
  scheduled_date: string | null; // "YYYY-MM-DD"

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

  type_of_equipment?: number | null;
  resource?: number | null;
  scheduled_date?: string | null;

  status?: string;
};

export type ScheduleUpdatePayload = Partial<ScheduleCreatePayload>;

/* =========================
   DROPDOWNS (FK TABLES)
   kept inside this file ✅
========================= */

// Equipment Types
export function useEquipmentTypes() {
  return useQuery<EquipmentType[]>({
    queryKey: ["equipment-types"],
    queryFn: async () => {
      const res = await api.get("/equipment-type/"); // from router.register("equipment-type", ...)
      return res.data;
    },
  });
}

// Resources
export function useResources() {
  return useQuery<Resource[]>({
    queryKey: ["resources"],
    queryFn: async () => {
      const res = await api.get("/resources/"); // make sure your router has this path
      return res.data;
    },
  });
}

/* =========================
   SCHEDULE CRUD
========================= */

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
