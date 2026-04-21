const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Department   = "Technical" | "Operations" | "Admin" | "Sales";
export type EmpStatus    = "Active" | "On Leave";
export type Availability = "Available" | "Busy";

export interface Employee {
  id:                 string;
  name:               string;
  position:           string;
  department:         string;
  salary:             number;
  status:             string;
  availability:       string;
  current_assignment: string;
  created_at?:        string;
  hire_date?:         string | null;
  duration?:          string;
  totalMonths?:       number;
  isNew?:             boolean;
}

// This must come AFTER the Employee interface
export type CreateEmployeePayload = Omit<
  Employee,
  "id" | "availability" | "current_assignment" | "duration" | "totalMonths" | "isNew"
>;

// ─── REQUEST HELPER ───────────────────────────────────────────────────────────

async function request<T>(
  path:          string,
  init?:         RequestInit,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
      ...(init?.headers as Record<string, string> ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = Array.isArray(body?.message)
        ? body.message.join(". ")
        : (body?.message ?? message);
    } catch {
      // non-JSON body — keep default message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── API CALLS ────────────────────────────────────────────────────────────────

/** GET /employees */
export const getEmployees = (): Promise<Employee[]> =>
  request<Employee[]>("/employees");

/** POST /employees */
export const createEmployee = (
  payload: CreateEmployeePayload,
): Promise<Employee> =>
  request<Employee>("/employees", {
    method: "POST",
    body:   JSON.stringify({
      ...payload,
      salary: Number(payload.salary) || 0,
    }),
  });

/** PATCH /employees/:id */
export const updateEmployee = (
  id:       string,
  data:     Partial<Employee>,
  userRole: string = "",
): Promise<Employee> =>
  request<Employee>(
    `/employees/${id}`,
    {
      method: "PATCH",
      body:   JSON.stringify(data),
    },
    { "x-user-role": userRole },
  );

/** PATCH /employees/:id — dedicated assignment helper */
export const updateEmployeeAssignment = (
  id:                 string,
  availability:       Availability,
  current_assignment: string,
  userRole:           string = "",
): Promise<Employee> =>
  updateEmployee(id, { availability, current_assignment }, userRole);

/** DELETE /employees/:id */
export const deleteEmployee = (id: string): Promise<void> =>
  request<void>(`/employees/${id}`, { method: "DELETE" });