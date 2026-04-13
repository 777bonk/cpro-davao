import { supabase } from '../lib/supabase';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  low_stock_threshold: number;
  created_at: string;
}

// READ
export const getInventory = async () => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as InventoryItem[];
};

// CREATE
export const createInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([itemData])
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
};

// UPDATE QUANTITY (Useful for when supplies arrive or are used)
export const updateStockLevel = async (id: string, newQuantity: number) => {
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
};