// src/api/sro.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export function useSros() {
  return useQuery({
    queryKey: ["sros"],
    queryFn: async () => {
      const res = await api.get("/sros/");
      return res.data;
    },
  });
}

export function useSro(id?: string) {
  return useQuery({
    queryKey: ["sros", id],
    queryFn: async () => {
      const res = await api.get(`/sros/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
}

// ✅ APPROVE SRO (POST /sros/<id>/approve/)
async function approveSroApiCall(id: number) {
  const res = await api.post(`/sros/${id}/approve/`);
  return res.data;
}

export function useApproveSroToSchedule() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => approveSroApiCall(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["sros"] });
      qc.invalidateQueries({ queryKey: ["sros", String(id)] }); 
    },
  });
}
