import { supabase } from '../lib/supabase';

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

export const getInventory = async () => {
  const { data, error } = await supabase.from('inventory_items').select('*').order('name');
  if (error) throw error;
  
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    category: d.category || "General",
    stock: Number(d.quantity || 0),
    stockIn: Number(d.stock_in || 0),
    stockOut: Number(d.stock_out || 0),
    unit: d.unit || "pcs",
    reorderLevel: Number(d.low_stock_threshold || 10),
    price: Number(d.price || 0),
  })) as InventoryItem[];
};

export const createInventoryItem = async (item: Omit<InventoryItem, 'id' | 'status'>) => {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([{
      name: item.name,
      category: item.category,
      quantity: item.stock,
      stock_in: item.stockIn,
      stock_out: item.stockOut,
      unit: item.unit,
      low_stock_threshold: item.reorderLevel,
      price: item.price
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInventoryStock = async (id: string, stock: number, stockIn: number, stockOut: number) => {
  const { error } = await supabase
    .from('inventory_items')
    .update({ 
      quantity: stock,
      stock_in: stockIn,
      stock_out: stockOut
    })
    .eq('id', id);

  if (error) throw error;
  return true;
};