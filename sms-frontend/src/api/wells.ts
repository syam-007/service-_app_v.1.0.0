// src/api/wells.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./axios";

export type Well = {
  id: number;
  name: string;
  well_id: string;

  well_center_lat_deg: number | null;
  well_center_lat_min: number | null;
  well_center_lat_sec: number | null;

  well_center_lng_deg: number | null;
  well_center_lng_min: number | null;
  well_center_lng_sec: number | null;

  utm_northing: string;
  utm_easting: string;
};

export type CreateWellPayload = {
  name: string;
  well_id: string;
  well_center_lat_deg?: number | null;
  well_center_lat_min?: number | null;
  well_center_lat_sec?: number | null;
  well_center_lng_deg?: number | null;
  well_center_lng_min?: number | null;
  well_center_lng_sec?: number | null;
  utm_northing?: string;
  utm_easting?: string;
};

export function useGetWellsConfig() {
  return useQuery({
    queryKey: ["wells"],
    queryFn: async () => {
      const res = await api.get<Well[]>("/wells/");
      return res.data;
    },
  });
}

export function useCreateWellConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateWellPayload) => {
      const res = await api.post<Well>("/wells/", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wells"] });
    },
  });
}
