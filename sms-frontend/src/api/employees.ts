// src/api/employees.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./axios";

// GET http://localhost:8000/api/employees/
export function useEmployeesList() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees/");
      return res.data?.results ?? res.data;
    },
  });
}

// POST http://localhost:8000/api/employees/bulk-upload/
export function useImportEmployees() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);

      // IMPORTANT: don't force JSON content-type for multipart
      const res = await api.post("/employees/bulk-upload/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  });
}
