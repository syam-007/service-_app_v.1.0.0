import { useQuery } from "@tanstack/react-query";
import api from "./axios";

export type DashboardResponse = {
  range: string;
  start: string;
  end: string;
  kpis: {
    total_callouts: number;
    active_sros: number;
    scheduled_sros: number;
    ready_for_scheduling: number;
    jobs_in_range: number;
    crew_utilization: number;
  };
  pipeline: Array<{ status: string; count: number }>;
  sros: Array<{
    id: number;
    number: string;
    client: string;
    rig: string;
    service: string;
    status: string;
    start: string;
    end: string;
  }>;
  activity: Array<{
    id: number;
    time: string;
    title: string;
    detail: string;
  }>;
};

export function useGetDashboard(params: { range: "today" | "week" | "custom"; start?: string; end?: string }) {
  return useQuery({
    queryKey: ["dashboard", params],
    queryFn: async () => {
      const res = await api.get<DashboardResponse>("/dashboard/", { params });
      return res.data;
    },
  });
}
