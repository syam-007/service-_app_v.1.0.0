// src/api/assets.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./axios";

export type AssetImportResult = {
  created: number;
  updated: number;
  total_rows: number;
  errors: Array<{ row: number; asset_code?: string; error: string }>;
};

export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets/");
      return res.data;
    },
  });
}
export function useAssetsList() {
    return useQuery({
      queryKey: ["assets"],
      queryFn: async () => {
        const res = await api.get("/assets/");
        // if paginated, return res.data.results instead
        return res.data.results ?? res.data;
      },
    });
  }

export function useImportAssets() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);

      const res = await api.post("/assets/import/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data as AssetImportResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
