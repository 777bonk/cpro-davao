const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface Appointment {
  id: string;
  /** Raw "YYYY-MM-DD" — used for calendar filtering and date inputs */
  date: string;
  /** Raw "HH:MM" (24-hour) — used for sorting and time inputs */
  time: string;
  customerName: string;
  customerId: string;
  vehicle: string;
  service: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  totalAmount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse backend's scheduled_date (ISO string, always UTC from Prisma)
 * into separate YYYY-MM-DD and HH:MM parts — interpreted in UTC so
 * no timezone shift occurs regardless of the user's local clock.
 */
function parseScheduledDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    console.warn("parseScheduledDate: invalid ISO string →", iso);
    return { date: "", time: "" };
  }

  // Use UTC getters so a "2025-04-20T14:00:00.000Z" stored in the DB
  // always comes back as date="2025-04-20", time="14:00" regardless of
  // the browser's local timezone.
  const date = [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("-");

  const time = [
    String(d.getUTCHours()).padStart(2, "0"),
    String(d.getUTCMinutes()).padStart(2, "0"),
  ].join(":");

  return { date, time };
}

function mapAppointment(apt: any): Appointment {
  const { date, time } = parseScheduledDate(apt.scheduled_date);
  return {
    id:           apt.id,
    date,                                       // "YYYY-MM-DD"
    time,                                       // "HH:MM"
    customerName: apt.customer?.name    ?? "Unknown",
    customerId:   apt.customer_id,
    vehicle:      apt.customer?.vehicle ?? "N/A",
    service:      apt.service_type      ?? "N/A",
    status:       apt.status,
    totalAmount:  Number(apt.total_cost),
  };
}

// ── 1. GET ALL ────────────────────────────────────────────────────────────────

export async function getAppointments(): Promise<Appointment[]> {
  const res = await fetch(`${API_URL}/appointments`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to fetch appointments");
  }
  const data = await res.json();
  return data.map(mapAppointment);
}

// ── 2. GET ONE ────────────────────────────────────────────────────────────────

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const res = await fetch(`${API_URL}/appointments/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to fetch appointment");
  }
  return mapAppointment(await res.json());
}

// ── 3. CREATE ─────────────────────────────────────────────────────────────────

export async function createAppointment(data: {
  customerId: string;
  service: string;
  date: string;       // "YYYY-MM-DD"
  time: string;       // "HH:MM"
  totalAmount: number;
}): Promise<Appointment> {
  // Append "Z" so it's treated as UTC — no local-timezone shift.
  const scheduledDate = `${data.date}T${data.time}:00.000Z`;

  const res = await fetch(`${API_URL}/appointments`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id:    data.customerId,
      service_type:   data.service,
      scheduled_date: scheduledDate,
      total_cost:     data.totalAmount,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to create appointment");
  }

  // Map and return the created record so the UI can use it immediately.
  return mapAppointment(await res.json());
}

// ── 4. UPDATE STATUS ONLY ─────────────────────────────────────────────────────

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"],
): Promise<Appointment> {
  const res = await fetch(`${API_URL}/appointments/${id}/status`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to update status");
  }
  return mapAppointment(await res.json());
}

// ── 5. UPDATE FULL APPOINTMENT ────────────────────────────────────────────────

export async function updateAppointment(
  id: string,
  data: {
    customerId?:  string;
    service?:     string;
    date?:        string;   // "YYYY-MM-DD"
    time?:        string;   // "HH:MM"
    totalAmount?: number;
    status?:      Appointment["status"];
  },
): Promise<Appointment> {
  // Only build scheduled_date when BOTH parts are present.
  const scheduledDate =
    data.date && data.time
      ? `${data.date}T${data.time}:00.000Z`   // explicit UTC — no shift
      : undefined;

  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(data.customerId  !== undefined && { customer_id:    data.customerId  }),
      ...(data.service     !== undefined && { service_type:   data.service     }),
      ...(scheduledDate                  && { scheduled_date: scheduledDate    }),
      ...(data.totalAmount !== undefined && { total_cost:     data.totalAmount }),
      ...(data.status      !== undefined && { status:         data.status      }),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to update appointment");
  }
  return mapAppointment(await res.json());
}

// ── 6. DELETE ─────────────────────────────────────────────────────────────────

export async function deleteAppointment(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to delete appointment");
  }
}