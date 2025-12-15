// src/api/callout.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export type Callout = {
  id: number;
  client: number;
  rig: number;
  service_type: number;
  created_at: string;
  status: string;
  notes: string;
  created_by_username?: string;
};

export function useCallouts() {
  return useQuery<Callout[]>({
    queryKey: ["callouts"],
    queryFn: async () => {
      const res = await api.get("callouts/"); // ✅ uses api instance
      return res.data;
    },
  });
}

export type CreateCalloutInput = {
  client: number;
  rig: number;
  service_type: number;
  status: string;
  notes: string;
};

export function useCallout(id: string | number | undefined) {
  return useQuery<Callout>({
    queryKey: ["callout", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`callouts/${id}/`); // ✅ detail
      return res.data;
    },
  });
}

export function useGenerateSro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (calloutId: number | string) => {
      const res = await api.post(`/callouts/${calloutId}/generate-sro/`);
      return res.data;
    },
    onSuccess: (_data, calloutId) => {
      // refresh callout detail + list so status updates to "SRO Activated"
      queryClient.invalidateQueries({
        queryKey: ["callouts", String(calloutId)],
      });
      queryClient.invalidateQueries({ queryKey: ["callouts"] });
      queryClient.invalidateQueries({ queryKey: ["sros"] });
    },
  });
}

export function useCreateCallout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCalloutInput) => {
      const res = await api.post("callouts/", payload);
      return res.data as Callout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callouts"] });
    },
  });
}

export function useUpdateCallout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: Record<string, any>;
    }) => {
      // 🔹 use the SAME api instance & path style as useCallout
      const res = await api.patch(`callouts/${id}/`, payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["callouts"] });
      queryClient.invalidateQueries({
        queryKey: ["callout", String(variables.id)],
      });
    },
  });
}
