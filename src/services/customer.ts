import { supabase } from '../lib/supabase';

// Define the shape of your customer based on our database schema
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  vehicle_details: any; // We can refine this later (e.g., { make: string, model: string, plate: string })
  created_at: string;
}

// CREATE
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
};

// READ
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false }); // Newest first

  if (error) throw error;
  return data as Customer[];
};

// UPDATE
export const updateCustomer = async (id: string, updates: Partial<Customer>) => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
};

// DELETE
export const deleteCustomer = async (id: string) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};