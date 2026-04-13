import { supabase } from '../lib/supabase';

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

// --- SERVICES ---
export const getServices = async () => {
  const { data, error } = await supabase.from('services').select('*').order('name');
  if (error) throw error;
  return data as ServicePackage[];
};

export const createService = async (serviceData: Omit<ServicePackage, 'id'>) => {
  const { data, error } = await supabase.from('services').insert([serviceData]).select().single();
  if (error) throw error;
  return data as ServicePackage;
};

// --- SHOP SETTINGS ---
export const getShopSettings = async () => {
  const { data, error } = await supabase.from('shop_settings').select('*').limit(1).single();
  if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows returned" error
  return data as ShopSettings | null;
};

export const updateShopSettings = async (settingsData: ShopSettings) => {
  // If we have an ID, update the existing row. Otherwise, insert a new one.
  const query = settingsData.id 
    ? supabase.from('shop_settings').update(settingsData).eq('id', settingsData.id)
    : supabase.from('shop_settings').insert([settingsData]);

  const { error } = await query;
  if (error) throw error;
  return true;
};