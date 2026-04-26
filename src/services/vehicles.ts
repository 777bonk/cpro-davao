const API = import.meta.env.VITE_API_BASE_URL;

export interface Vehicle {
  id:           string;
  user_id:      string;
  name?:        string;
  brand:        string;
  model:        string;
  year:         string;
  plate_number?: string;
  color?:       string;
  vehicle_class?: string;
  created_at?:  string;
}

export async function getVehicles(userId: string): Promise<Vehicle[]> {
  const res = await fetch(`${API}/vehicles?userId=${userId}&t=${Date.now()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createVehicle(userId: string, data: Omit<Vehicle, 'id' | 'user_id' | 'created_at'>): Promise<Vehicle> {
  const res = await fetch(`${API}/vehicles`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId, ...data }),
  });
  if (!res.ok) throw new Error("Failed to create vehicle");
  return res.json();
}

export async function updateVehicle(id: string, userId: string, data: Partial<Vehicle>): Promise<Vehicle> {
  const res = await fetch(`${API}/vehicles/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId, ...data }),
  });
  if (!res.ok) throw new Error("Failed to update vehicle");
  return res.json();
}

export async function deleteVehicle(id: string, userId: string): Promise<void> {
  const res = await fetch(`${API}/vehicles/${id}`, {
    method:  "DELETE",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to delete vehicle");
}