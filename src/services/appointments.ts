// src/services/appointments.ts

const API = import.meta.env.VITE_API_BASE_URL;

// ── CREATE APPOINTMENT (multipart/form-data — required for file upload) ───────
export async function createAppointment(payload: {
  customerId: string;
  fullName: string;
  mobileNumber: string;
  service: string;
  addons: string[];
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string | number;
  vehicleClass: string;
  vehiclePlateNumber: string;
  date: string;
  time: string;
  paymentMethod: string;
  paymentType: string;
  totalAmount: number;
  deposit: number;
  remainingBalance: number;
  notes?: string;
  proofFile: File;
}) {
  const form = new FormData();

  form.append("customerId",         payload.customerId);
  form.append("fullName",           payload.fullName);
  form.append("mobileNumber",       payload.mobileNumber);
  form.append("service",            payload.service);
  form.append("addons",             JSON.stringify(payload.addons ?? []));
  form.append("vehicleMake",        payload.vehicleMake);
  form.append("vehicleModel",       payload.vehicleModel);
  form.append("vehicleYear",        String(payload.vehicleYear));
  form.append("vehicleClass",       payload.vehicleClass);
  form.append("vehiclePlateNumber", payload.vehiclePlateNumber);
  form.append("date",               payload.date);
  form.append("time",               payload.time);
  form.append("paymentMethod",      payload.paymentMethod);
  form.append("paymentType",        payload.paymentType);
  form.append("totalAmount",        String(payload.totalAmount));
  form.append("deposit",            String(payload.deposit));
  form.append("remainingBalance",   String(payload.remainingBalance));
  form.append("notes",              payload.notes ?? "");
  form.append("proofFile",          payload.proofFile);

  const res = await fetch(`${API}/appointments`, {
    method: "POST",
    // ⚠️ Do NOT set Content-Type — browser sets it automatically with multipart boundary
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? `Server error ${res.status}`);
  }

  return res.json();
}

// ── GET ALL APPOINTMENTS (admin) ──────────────────────────────────────────────
export async function getAllAppointments() {
  const res = await fetch(`${API}/appointments`);
  if (!res.ok) throw new Error("Failed to fetch appointments");
  return res.json();
}

// ── GET APPOINTMENTS BY CUSTOMER ──────────────────────────────────────────────
export async function getCustomerAppointments(customerId: string) {
  const res = await fetch(`${API}/appointments/customer/${customerId}`);
  if (!res.ok) throw new Error("Failed to fetch appointments");
  return res.json();
}

// ── GET SINGLE APPOINTMENT ────────────────────────────────────────────────────
export async function getAppointment(id: string) {
  const res = await fetch(`${API}/appointments/${id}`);
  if (!res.ok) throw new Error("Failed to fetch appointment");
  return res.json();
}

// ── GET PENDING VERIFICATION QUEUE (admin/frontdesk) ─────────────────────────
export async function getPendingVerificationAppointments() {
  const res = await fetch(`${API}/appointments/admin/pending`);
  if (!res.ok) throw new Error("Failed to fetch pending appointments");
  return res.json();
}

// ── FULL UPDATE ───────────────────────────────────────────────────────────────
export async function updateAppointment(id: string, data: Record<string, any>) {
  const res = await fetch(`${API}/appointments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update appointment");
  return res.json();
}

// ── UPDATE STATUS ─────────────────────────────────────────────────────────────
export async function updateAppointmentStatus(id: string, status: string) {
  const res = await fetch(`${API}/appointments/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

// ── APPROVE BOOKING (admin/frontdesk) ─────────────────────────────────────────
export async function approveAppointment(id: string, remarks?: string) {
  const res = await fetch(`${API}/appointments/${id}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remarks }),
  });
  if (!res.ok) throw new Error("Failed to approve appointment");
  return res.json();
}

// ── REJECT BOOKING (admin/frontdesk) ──────────────────────────────────────────
export async function rejectAppointment(id: string, remarks?: string) {
  const res = await fetch(`${API}/appointments/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remarks }),
  });
  if (!res.ok) throw new Error("Failed to reject appointment");
  return res.json();
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function deleteAppointment(id: string) {
  const res = await fetch(`${API}/appointments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete appointment");
  return res.json();
}

// ── BACKWARD-COMPATIBLE ALIASES ───────────────────────────────────────────────
// Matches names used across existing components — do not remove
export const getAppointments = getAllAppointments;