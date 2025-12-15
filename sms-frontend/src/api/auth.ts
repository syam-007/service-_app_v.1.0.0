// src/api/auth.ts
import axios from "axios";

const AUTH_BASE = "http://localhost:8000/api/auth/";

export type LoginResponse = {
  access: string;
  refresh: string;
};

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const res = await axios.post(`${AUTH_BASE}token/`, {
    username,
    password,
  });
  
  // Store the token in localStorage
  localStorage.setItem('access_token', res.data.access);
  localStorage.setItem('refresh_token', res.data.refresh);
  
  return res.data;
}
