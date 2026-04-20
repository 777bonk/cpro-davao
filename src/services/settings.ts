// src/services/settings.ts
const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface ServicePackage {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
}

export interface ShopSettings {
  id?: string;
  business_name: string;
  contact_number: string;
  email: string;
  website: string;
  address: string;
}

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

// ─── SERVICES API ───
export const getServices = (): Promise<ServicePackage[]> => 
  request<ServicePackage[]>('/services');

export const createService = (data: Omit<ServicePackage, 'id'>): Promise<ServicePackage> => 
  request<ServicePackage>('/services', { method: 'POST', body: JSON.stringify(data) });

export const updateService = (id: string, data: Partial<ServicePackage>): Promise<ServicePackage> => 
  request<ServicePackage>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteService = (id: string): Promise<void> => 
  request<void>(`/services/${id}`, { method: 'DELETE' });

// ─── SHOP SETTINGS API ───
export const getShopSettings = (): Promise<ShopSettings> => 
  request<ShopSettings>('/shop-settings');

export const updateShopSettings = (data: Partial<ShopSettings>): Promise<ShopSettings> => 
  request<ShopSettings>('/shop-settings', { 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  });