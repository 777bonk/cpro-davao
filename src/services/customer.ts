// src/services/customer.ts

const API = import.meta.env.VITE_API_BASE_URL;

export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  vehicle: string;
  last_service: string | null;
  lastService: string | null;
  total_spent: number;
  totalSpent: number;
  status: string;
  created_at: string;
}

function normalize(c: any): Customer {
  const contact    = c.contact    ?? c.phone       ?? "";
  const lastSvc    = c.last_service ?? c.lastService ?? null;
  const totalSpent = Number(c.total_spent ?? c.totalSpent ?? 0);
  return {
    id:           c.id,
    name:         c.name       ?? "—",
    contact,
    phone:        contact,
    email:        c.email      ?? "",
    vehicle:      c.vehicle    ?? "",
    last_service: lastSvc,
    lastService:  lastSvc,
    total_spent:  totalSpent,
    totalSpent,
    status:       c.status     ?? "Active",
    created_at:   c.created_at ?? "",
  };
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    const res = await fetch(`${API}/customers`);
    if (!res.ok) throw new Error("Failed to fetch customers");
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalize) : [];
  } catch (err) {
    console.error("getCustomers error:", err);
    return [];
  }
}

export async function getCustomer(id: string): Promise<Customer> {
  const res = await fetch(`${API}/customers/${id}`);
  if (!res.ok) throw new Error("Failed to fetch customer");
  return normalize(await res.json());
}

export async function createCustomer(data: {
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  vehicle?: string;
  status?: string;
}): Promise<Customer> {
  const payload: any = {
    name:    data.name,
    contact: data.contact ?? data.phone ?? "",
    phone:   data.contact ?? data.phone ?? "",
    vehicle: data.vehicle ?? "",
    status:  data.status  ?? "Active",
  };
  // Only include email if it's a non-empty string
  if (data.email && data.email.trim() !== "") {
    payload.email = data.email.trim();
  }

  console.log("UPDATE PAYLOAD:", JSON.stringify(payload));

  const res = await fetch(`${API}/customers`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create customer");
  return normalize(await res.json());
}

export async function updateCustomer(id: string, data: {
  name?: string;
  contact?: string;
  email?: string;
  vehicle?: string;
  last_service?: string | null;
  total_spent?: number;
  status?: string;
}): Promise<Customer> {
  const payload: any = {};

  if (data.name    !== undefined) payload.name    = data.name;
  if (data.contact !== undefined) {
    payload.contact = data.contact;
    payload.phone   = data.contact;
  }
  if (data.vehicle      !== undefined) payload.vehicle      = data.vehicle;
  if (data.last_service !== undefined) payload.last_service = data.last_service;
  if (data.total_spent  !== undefined) payload.total_spent  = data.total_spent;
  if (data.status       !== undefined) payload.status       = data.status;

  // ── KEY FIX: only include email if it's a real non-empty value ──
  // Empty string fails @IsEmail() validation on the backend
  if (data.email !== undefined && data.email !== null && data.email.trim() !== "") {
    payload.email = data.email.trim();
  }

  const res = await fetch(`${API}/customers/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Failed to update customer (${res.status})`);
  }
  return normalize(await res.json());
}

export async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`${API}/customers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete customer");
}