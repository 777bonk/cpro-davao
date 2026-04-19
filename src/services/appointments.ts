import { supabase } from '../lib/supabase';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  customerName: string;
  vehicle: string;
  service: string;
  procedures: string;
  paymentInfo: string;
  totalAmount: number;
  status: "Scheduled" | "In Progress" | "Completed" | "Archived";
}

// TRANSLATOR 1: Database to UI
const formatStatusToUI = (dbStatus: string): "Completed" | "In Progress" | "Scheduled" => {
  if (dbStatus === 'completed') return "Completed";
  if (dbStatus === 'in_progress') return "In Progress";
  return "Scheduled"; // Treats 'pending' or anything else as Scheduled
};

// TRANSLATOR 2: UI to Database
const formatStatusToDB = (uiStatus: string): string => {
  if (uiStatus === 'Completed') return 'completed';
  if (uiStatus === 'In Progress') return 'in_progress';
  return 'pending'; // 'Scheduled' maps to 'pending' in the database
};

export const getAppointments = async () => {
  const { data, error } = await supabase.from('appointments').select('*');
  if (error) throw error;
  
  return data.map((d: any) => ({
    id: d.id,
    date: d.scheduled_date,
    time: d.scheduled_time || "N/A",
    customerName: d.customer_name || d.customers?.name || "Unknown",
    vehicle: d.vehicle || "N/A",
    service: d.service_type || "N/A",
    procedures: d.procedures || "None",
    paymentInfo: d.payment_info || "Pending",
    status: formatStatusToUI(d.status), // Translate here
    totalAmount: Number(d.total_cost || 0),
  })) as Appointment[];
};

export const createAppointment = async (appt: Omit<Appointment, 'id'>) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([{
      scheduled_date: appt.date,
      scheduled_time: appt.time,
      customer_name: appt.customerName,
      vehicle: appt.vehicle,
      service_type: appt.service,
      procedures: appt.procedures,
      payment_info: appt.paymentInfo,
      status: formatStatusToDB(appt.status), // Translate here
      total_cost: appt.totalAmount
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAppointmentStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from('appointments')
    .update({ status: formatStatusToDB(status) }) // Translate here
    .eq('id', id);

  if (error) throw error;
  return true;
};