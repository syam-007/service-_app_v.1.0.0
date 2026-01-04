// src/api/auth.ts
import api from "./axios";

export type LoginResponse = {
  access: string;
  refresh: string;
};

export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/token/", {
    username,
    password,
  });

  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);

  return res.data;
}
