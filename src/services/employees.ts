import { supabase } from '../lib/supabase';

export interface Employee {
  id: string; // Supabase uses UUIDs (strings), not numbers
  name: string;
  position: string;
  department: string;
  salary: number;
  status: "Active" | "On Leave" | "Inactive";
  performance: "Excellent" | "Good" | "Average";
  availability: "Available" | "Busy";
  current_assignment: string; // Adjusted to match SQL snake_case
}

// READ
export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Employee[];
};

// CREATE
export const createEmployee = async (employeeData: Omit<Employee, 'id' | 'availability' | 'current_assignment'>) => {
  const { data, error } = await supabase
    .from('employees')
    .insert([{ ...employeeData, availability: 'Available', current_assignment: 'None' }])
    .select()
    .single();

  if (error) throw error;
  return data as Employee;
};

// UPDATE ASSIGNMENT (For the Assign Work / Mark Available buttons)
export const updateEmployeeAssignment = async (id: string, availability: string, current_assignment: string) => {
  const { data, error } = await supabase
    .from('employees')
    .update({ availability, current_assignment })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Employee;
};

export const updateEmployee = async (id: string, data: Partial<Employee>) => {
  const { data: updated, error } = await supabase
    .from("employees").update(data).eq("id", id).select().single();
  if (error) throw error;
  return updated;
};