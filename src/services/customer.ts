import { supabase } from '../lib/supabase';

export interface Customer {
  id: string;
  name: string;
  contact: string;
  vehicle: string;
  last_service: string;
  total_spent: number;
  status: "Active" | "Inactive";
  created_at?: string;
}

export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Customer[];
};

export const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
};