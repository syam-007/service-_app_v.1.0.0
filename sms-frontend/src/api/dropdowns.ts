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
      const response = await api.post("/wells/", payload);
      return response.data;
    },
    onSuccess: () => {
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
      const response = await api.get("/field/");
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

// ----------------- CASING SIZES -----------------
export const useGetCasingSizes = () => {
  return useQuery({
    queryKey: ["casingSizes"],
    queryFn: async () => {
      const response = await api.get("/casing-sizes/");
      return response.data;
    },
  });
};

// ----------------- DRILLPIPE SIZES -----------------
export const useGetDrillpipeSizes = () => {
  return useQuery({
    queryKey: ["drillpipeSizes"],
    queryFn: async () => {
      const response = await api.get("/drillpipe-sizes/");
      return response.data;
    },
  });
};

// ----------------- MINIMUM ID SIZES -----------------
export const useGetMinimumIdSizes = () => {
  return useQuery({
    queryKey: ["minimumIdSizes"],
    queryFn: async () => {
      const response = await api.get("/minimum-id-sizes/");
      return response.data;
    },
  });
};

// ----------------- HOLE SECTION RELATIONSHIPS -----------------
export const useGetHoleSectionRelationships = () => {
  return useQuery({
    queryKey: ["holeSectionRelationships"],
    queryFn: async () => {
      const response = await api.get("/hole-section-relationships/");
      return response.data;
    },
  });
};

// Get pipe options for specific hole section
export const useGetPipeOptionsByHoleSection = (holeSectionId: number | null) => {
  return useQuery({
    queryKey: ["pipeOptions", holeSectionId],
    queryFn: async () => {
      if (!holeSectionId) return null;
      try {
        // ✅ Correct endpoint: /hole-sections/{id}/available-options/
        const response = await api.get(`/hole-sections/${holeSectionId}/available-options/`);
        return response.data;
      } catch (error) {
        console.warn("Could not fetch hole section specific options", error);
        return null;
      }
    },
    enabled: !!holeSectionId,
  });
};

// Get available options for a specific callout (for edit mode)
export const useGetCalloutOptions = (calloutId?: number | null) => {
  return useQuery({
    queryKey: ["calloutOptions", calloutId],
    queryFn: async () => {
      if (!calloutId) return null;
      const response = await api.get(`/callouts/${calloutId}/`);
      return response.data;
    },
    enabled: !!calloutId,
  });
};