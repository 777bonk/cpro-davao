// src/services/finance.ts
const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface Transaction {
  id?: string;
  type: string; // 'income' or 'expense' (or 'Income'/'Expense')
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at?: string;
}

// Reuse the brilliant fetch wrapper from the Employees module
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message ?? message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// GET TRANSACTIONS
export const getTransactions = async (): Promise<Transaction[]> => {
  return request<Transaction[]>('/transaction');
};

// CREATE TRANSACTION (With Smart Mapping)
export const createTransaction = async (payload: Omit<Transaction, "id" | "created_at">): Promise<Transaction> => {
  
  // Map UI categories to backend DTO categories
  let mappedCategory = 'Other';
  if (payload.category === "Service Revenue") mappedCategory = 'Service';
  else if (payload.category === "Salaries") mappedCategory = 'Payroll';
  else if (payload.category === "Parts & Supplies" || payload.category === "Equipment") mappedCategory = 'Inventory';

  return request<Transaction>('/transaction', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      // We removed mappedType! Just pass the raw lowercase payload.type
      type: payload.type, 
      category: mappedCategory,
      amount: Number(payload.amount),
    }),
  });
};