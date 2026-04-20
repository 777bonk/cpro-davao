// src/services/employees.ts

const API_URL = import.meta.env.VITE_API_BASE_URL;

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Department  = "Technical" | "Operations" | "Admin" | "Sales";
export type EmpStatus   = "Active" | "On Leave";
export type Availability = "Available" | "Busy";
export type Performance = "Excellent" | "Good" | "Average";

export interface Employee {
  id:                 string;
  name:               string;
  position:           string;
  department:         Department;
  salary:             number;        // always a number, never a string
  status:             EmpStatus;
  performance:        Performance;
  availability:       Availability;
  current_assignment: string;
}

export type CreateEmployeePayload = Omit<
  Employee,
  "id" | "availability" | "current_assignment"
>;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Centralised fetch wrapper — throws a typed Error with the server message
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    // Try to read a JSON error body (NestJS default shape)
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {
      // non-JSON body — keep default message
    }
    throw new Error(message);
  }

  // 204 No Content (DELETE) has no body
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── API CALLS ────────────────────────────────────────────────────────────────

/** GET /employees */
export const getEmployees = (): Promise<Employee[]> =>
  request<Employee[]>("/employees");

/** POST /employees */
export const createEmployee = (
  payload: CreateEmployeePayload
): Promise<Employee> =>
  request<Employee>("/employees", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      // Ensure salary is always stored as a real number
      salary: Number(payload.salary) || 0,
      
      // We removed availability and current_assignment from here!
      // The backend handles those defaults automatically now.
    }),
  });

/** PATCH /employees/:id  — generic partial update */
export const updateEmployee = (
  id: string,
  data: Partial<Employee>
): Promise<Employee> =>
  request<Employee>(`/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

/** PATCH /employees/:id  — dedicated assignment helper */
export const updateEmployeeAssignment = (
  id: string,
  availability: Availability,
  current_assignment: string
): Promise<Employee> =>
  updateEmployee(id, { availability, current_assignment });

/** DELETE /employees/:id */
export const deleteEmployee = (id: string): Promise<void> =>
  request<void>(`/employees/${id}`, { method: "DELETE" });