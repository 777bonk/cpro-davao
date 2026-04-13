import { supabase } from '../lib/supabase';

export type AppointmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  customer_id: string;
  service_type: string;
  status: AppointmentStatus;
  scheduled_date: string;
  total_cost: number | null;
  created_at: string;
  // This nested object comes from our Supabase relation!
  customers?: { 
    name: string;
    vehicle_details?: any;
  }; 
}

// READ
export const getAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customers ( name, vehicle_details ) 
    `)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data as Appointment[];
};

// CREATE
export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'customers' | 'status'>) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([{ ...appointmentData, status: 'pending' }])
    .select(`*, customers ( name )`)
    .single();

  if (error) throw error;
  return data as Appointment;
};

// UPDATE STATUS
export const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Appointment;
};