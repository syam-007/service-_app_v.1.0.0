// src/api/dropdowns.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./axios";

// ----------------- CLIENTS -----------------
export const useGetClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await api.get("/clients/");
      return response.data;
    },
  });
};

// ----------------- RIGS -----------------
export const useGetRigs = (clientId?: number) => {
  return useQuery({
    // include clientId in key if you ever filter by it
    queryKey: ["rigs", clientId],
    queryFn: async () => {
      const response = await api.get("/rigs/");
      return response.data;
    },
  });
};

// ----------------- SERVICE TYPES -----------------
export const useGetServiceTypes = () => {
  return useQuery({
    queryKey: ["serviceTypes"],
    queryFn: async () => {
      const response = await api.get("/service-types/");
      return response.data;
    },
  });
};

// ----------------- CUSTOMERS -----------------
export const useGetCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await api.get("/customers/");
      return response.data;
    },
  });
};

// ----------------- WELLS -----------------
export const useGetWells = () => {
  return useQuery({
    queryKey: ["wells"],
    queryFn: async () => {
      const response = await api.get("/wells/");
      return response.data;
    },
  });
};

// ----------------- HOLE SECTIONS -----------------
export const useGetHoleSections = () => {
  return useQuery({
    queryKey: ["holeSections"],
    queryFn: async () => {
      const response = await api.get("/hole-sections/");
      return response.data;
    },
  });
};

// ----------------- CREATE WELL -----------------
export function useCreateWell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      // ✅ use the same api instance you already use above
      const response = await api.post("/wells/", payload);
      return response.data;
    },
    onSuccess: () => {
      // optional: auto-refetch wells anywhere in the app
      queryClient.invalidateQueries({ queryKey: ["wells"] });
    },
  });
}


export function useCreateRig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await api.post("rigs/", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rigs"] });
    },
  });
}

// ----------------- FIELDS -----------------
export const useGetFields = () => {
  return useQuery({
    queryKey: ["fields"],
    queryFn: async () => {
      const response = await api.get("/field/"); // or "/fields/" if you rename router
      return response.data;
    },
  });
};

export function useCreateField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/field/", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fields"] });
    },
  });
}