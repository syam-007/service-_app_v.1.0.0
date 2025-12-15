// src/api/sro.ts
import { useQuery } from "@tanstack/react-query";
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
