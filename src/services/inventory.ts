const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  stockIn: number;
  stockOut: number;
  unit: string;
  reorderLevel: number;
  price: number;
  status?: "Good" | "Low" | "Critical";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// The backend already maps DB columns to these camelCase field names,
// so no additional transformation is needed on the frontend.

// ── 1. GET ALL ────────────────────────────────────────────────────────────────

export async function getInventory(): Promise<InventoryItem[]> {
  const res = await fetch(`${API_URL}/inventory`);
  return handleResponse<InventoryItem[]>(res);
}

// ── 2. CREATE ─────────────────────────────────────────────────────────────────

export async function createInventoryItem(
  item: Omit<InventoryItem, 'id' | 'status'>,
): Promise<InventoryItem> {
  const res = await fetch(`${API_URL}/inventory`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(item),   // field names match the DTO directly
  });
  return handleResponse<InventoryItem>(res);
}

// ── 3. UPDATE STOCK (add / deduct, reorder) ───────────────────────────────────
// Calls the dedicated PATCH /inventory/:id/stock endpoint.

export async function updateInventoryStock(
  id: string,
  stock: number,
  stockIn: number,
  stockOut: number,
): Promise<InventoryItem> {
  const res = await fetch(`${API_URL}/inventory/${id}/stock`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ stock, stockIn, stockOut }),
  });
  return handleResponse<InventoryItem>(res);
}

// ── 4. FULL UPDATE ────────────────────────────────────────────────────────────

export async function updateInventoryItem(
  id: string,
  item: Partial<Omit<InventoryItem, 'id' | 'status'>>,
): Promise<InventoryItem> {
  const res = await fetch(`${API_URL}/inventory/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(item),
  });
  return handleResponse<InventoryItem>(res);
}

// ── 5. DELETE ─────────────────────────────────────────────────────────────────

export async function deleteInventoryItem(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/inventory/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<void>(res);
}