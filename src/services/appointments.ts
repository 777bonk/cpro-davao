// src/services/appointments.ts

const API = import.meta.env.VITE_API_BASE_URL;

// ── TYPE ──────────────────────────────────────────────────────────────────────
export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  vehicle: string;
  service: string;
  date: string;
  time: string;
  totalAmount: number;
  deposit: number;
  remainingBalance: number;
  status: "Pending Verification" | "Confirmed" | "Pending" | "In Progress" | "Completed" | "Cancelled" | "Rejected";
  notes: string;
  // new booking-flow fields
  fullName?: string;
  mobileNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleClass?: string;
  vehiclePlateNumber?: string;
  paymentMethod?: string;
  paymentType?: string;
  proofOfPayment?: string;
  adminRemarks?: string;
  addons?: any[];
}

// ── NORMALIZE ─────────────────────────────────────────────────────────────────
// Converts raw backend response to a consistent Appointment shape
// used by ALL components (admin, frontdesk, customer)
function normalize(a: any): Appointment {
  const d = new Date(a.scheduled_date || a.date || new Date());
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  const timeStr = a.appointment_time ?? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const vehicle = a.vehicle_make
    ? [a.vehicle_make, a.vehicle_model, a.vehicle_class].filter(Boolean).join(" ")
    : (a.customer?.vehicle ?? a.vehicle ?? "—");

  return {
    id:               a.id,
    customerId:       a.customer_id ?? a.customerId ?? "",
    customerName:     a.full_name ?? a.customer?.name ?? a.customerName ?? "—",
    vehicle,
    service:          a.service_type ?? a.service ?? "—",
    date:             dateStr,
    time:             timeStr,
    totalAmount:      Number(a.total_amount ?? a.total_cost ?? 0),
    deposit:          Number(a.deposit ?? 0),
    remainingBalance: Number(a.remaining_balance ?? 0),
    status:           (a.status ?? "Pending") as Appointment["status"],
    notes:            a.notes ?? "",
    fullName:         a.full_name,
    mobileNumber:     a.mobile_number,
    vehicleMake:      a.vehicle_make,
    vehicleModel:     a.vehicle_model,
    vehicleYear:      a.vehicle_year,
    vehicleClass:     a.vehicle_class,
    vehiclePlateNumber: a.vehicle_plate_number,
    paymentMethod:    a.payment_method,
    paymentType:      a.payment_type,
    proofOfPayment:   a.proof_of_payment,
    adminRemarks:     a.admin_remarks,
    addons:           a.addons ?? [],
  };
}

// ── CREATE APPOINTMENT (multipart/form-data — required for file upload) ───────
// ── CREATE APPOINTMENT (multipart/form-data — required for file upload) ───────
export async function createAppointment(payload: {
  customerId: string;
  fullName?: string;
  mobileNumber?: string;
  service: string;
  addons?: string[];
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string | number;
  vehicleClass?: string;
  vehiclePlateNumber?: string;
  date: string;
  time: string;
  paymentMethod?: string;
  paymentType?: string;
  totalAmount: number;
  deposit: number;
  remainingBalance: number;
  notes?: string;
  proofFile?: File | null;
}): Promise<Appointment> {
  const form = new FormData();

  // ONLY append if the value is truthy, to prevent sending literal "undefined" strings
  if (payload.customerId) form.append("customerId", payload.customerId);
  if (payload.fullName) form.append("fullName", payload.fullName);
  if (payload.mobileNumber) form.append("mobileNumber", payload.mobileNumber);
  
  form.append("service", payload.service);
  form.append("addons", JSON.stringify(payload.addons ?? []));
  
  if (payload.vehicleMake) form.append("vehicleMake", payload.vehicleMake);
  if (payload.vehicleModel) form.append("vehicleModel", payload.vehicleModel);
  if (payload.vehicleYear) form.append("vehicleYear", String(payload.vehicleYear));
  if (payload.vehicleClass) form.append("vehicleClass", payload.vehicleClass);
  if (payload.vehiclePlateNumber) form.append("vehiclePlateNumber", payload.vehiclePlateNumber);
  
  form.append("date", payload.date);
  form.append("time", payload.time);
  
  if (payload.paymentMethod) form.append("paymentMethod", payload.paymentMethod);
  if (payload.paymentType) form.append("paymentType", payload.paymentType);
  
  form.append("totalAmount", String(payload.totalAmount || 0));
  form.append("deposit", String(payload.deposit || 0));
  form.append("remainingBalance", String(payload.remainingBalance || 0));
  
  if (payload.notes) form.append("notes", payload.notes);
  if (payload.proofFile) form.append("proofFile", payload.proofFile);

  const res = await fetch(`${API}/appointments`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? `Server error ${res.status}`);
  }

  return normalize(await res.json());
}

// ── GET ALL APPOINTMENTS (admin) ──────────────────────────────────────────────
export async function getAllAppointments() {
  const res = await fetch(`${API}/appointments?t=${Date.now()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) throw new Error("Failed to fetch appointments");
  return res.json();
}

// ── GET APPOINTMENTS BY CUSTOMER ──────────────────────────────────────────────
export async function getCustomerAppointments(customerId: string): Promise<Appointment[]> {
  const res = await fetch(`${API}/appointments/customer/${customerId}`);
  if (!res.ok) throw new Error("Failed to fetch appointments");
  const data = await res.json();
  return Array.isArray(data) ? data.map(normalize) : [];
}

// ── GET SINGLE APPOINTMENT ────────────────────────────────────────────────────
export async function getAppointment(id: string): Promise<Appointment> {
  const res = await fetch(`${API}/appointments/${id}`);
  if (!res.ok) throw new Error("Failed to fetch appointment");
  return normalize(await res.json());
}

// ── GET PENDING VERIFICATION QUEUE (admin/frontdesk) ─────────────────────────
export async function getPendingVerificationAppointments() {
  const res = await fetch(`${API}/appointments/admin/pending?t=${Date.now()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) throw new Error("Failed to fetch pending appointments");
  return res.json();
}

// ── FULL UPDATE ───────────────────────────────────────────────────────────────
export async function updateAppointment(id: string, data: Record<string, any>): Promise<Appointment> {
  const res = await fetch(`${API}/appointments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update appointment");
  return normalize(await res.json());
}

// ── UPDATE STATUS ─────────────────────────────────────────────────────────────
export async function updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
  const res = await fetch(`${API}/appointments/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return normalize(await res.json());
}

// ── APPROVE BOOKING (admin/frontdesk) ─────────────────────────────────────────
export async function approveAppointment(id: string, remarks?: string): Promise<Appointment> {
  const res = await fetch(`${API}/appointments/${id}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remarks }),
  });
  if (!res.ok) throw new Error("Failed to approve appointment");
  return normalize(await res.json());
}

// ── REJECT BOOKING (admin/frontdesk) ──────────────────────────────────────────
export async function rejectAppointment(id: string, remarks?: string): Promise<Appointment> {
  const res = await fetch(`${API}/appointments/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remarks }),
  });
  if (!res.ok) throw new Error("Failed to reject appointment");
  return normalize(await res.json());
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
export const getAppointments = getAllAppointments;