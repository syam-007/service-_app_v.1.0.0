import api from "./axios";

export type Rig = {
  id: number;
  rig_number: string;
};

export type CreateRigPayload = {
  rig_number: string;
};

export async function listRigs(): Promise<Rig[]> {
  const res = await api.get<Rig[]>("/rigs/");
  return res.data;
}

export async function createRig(payload: CreateRigPayload): Promise<Rig> {
  const res = await api.post<Rig>("/rigs/", payload);
  return res.data;
}
