import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

// Fetch all transactions from the singular 'transaction' table
export const getTransactions = async () => {
  const { data, error } = await supabase
    .from('transaction')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data as Transaction[];
};