const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface Customer {
  id: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  vehicle?: string | null;
  last_service?: string | null;
  total_spent?: number | string | null;
  status?: string | null;
  created_at?: string | null;
}

// GET ALL CUSTOMERS
export async function getCustomers(): Promise<Customer[]> {
  try {
    const res = await fetch(`${API_URL}/customers`);
    if (!res.ok) throw new Error("Failed to fetch customers");
    return await res.json();
  } catch (err) {
    console.error("getCustomers error:", err);
    return [];
  }
}

// CREATE CUSTOMER
export async function createCustomer(data: Omit<Customer, "id" | "created_at">): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create customer");
  return await res.json();
}