const API_URL = import.meta.env.VITE_API_URL;

export interface JobOrder {
  id: string;
  order_no:       string;
  customer:       string;
  vehicle:        string;
  service:        string;
  assigned_staff: string;
  staff_id?:      string;
  scheduled_date: string;
  estimated_time: string;
  status:         'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority:       'Normal' | 'Urgent';
  notes?:         string;
  created_at:     string;
}

export interface CreateJobOrderPayload {
  customer:        string;
  vehicle:         string;
  service:         string;
  assigned_staff:  string;
  staff_id?:       string;
  scheduled_date:  string;
  estimated_time?: string;
  priority?:       string;
  notes?:          string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const jobOrdersService = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: JobOrder[]; total: number; page: number; totalPages: number }>(
      `/job-orders${qs}`
    );
  },

  getById: (id: string) =>
    request<JobOrder>(`/job-orders/${id}`),

  create: (payload: CreateJobOrderPayload) =>
    request<JobOrder>('/job-orders', {
      method: 'POST',
      body:   JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<CreateJobOrderPayload> & { status?: string }) =>
    request<JobOrder>(`/job-orders/${id}`, {
      method: 'PATCH',
      body:   JSON.stringify(payload),
    }),

  remove: (id: string) =>
    request<{ message: string }>(`/job-orders/${id}`, { method: 'DELETE' }),
};