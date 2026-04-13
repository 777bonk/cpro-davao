import React, { useState, useEffect } from 'react';
import { getAppointments, createAppointment, Appointment, updateAppointmentStatus } from '../../services/appointments';
import { getCustomers, Customer } from '../../services/customer';
import { Button } from '../dashboard-ui/button';

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [totalCost, setTotalCost] = useState('');

  // Fetch both customers and appointments on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Promise.all fetches both at the same time for maximum speed
      const [apptsData, custsData] = await Promise.all([
        getAppointments(),
        getCustomers()
      ]);
      setAppointments(apptsData);
      setCustomers(custsData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError("Please select a customer.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const newAppt = await createAppointment({
        customer_id: selectedCustomerId,
        service_type: serviceType,
        scheduled_date: new Date(scheduledDate).toISOString(),
        total_cost: totalCost ? parseFloat(totalCost) : null,
      });

      setAppointments([...appointments, newAppt]);
      
      // Reset Form
      setSelectedCustomerId('');
      setServiceType('');
      setScheduledDate('');
      setTotalCost('');
    } catch (err) {
      setError('Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      // Update local state to reflect change without refreshing
      setAppointments(appointments.map(appt => 
        appt.id === id ? { ...appt, status: newStatus } : appt
      ));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="p-6 text-white min-h-screen flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Appointments & Job Orders</h1>

      {error && <p className="text-red-400">{error}</p>}

      {/* Standardized Glass Form */}
      <form 
        onSubmit={handleAddAppointment} 
        className="bg-black/40 p-6 rounded-lg border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-6 items-end"
      >
        <div className="md:col-span-3">
          <label className="block text-sm text-white/70 mb-2">Customer</label>
          <select
            required
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-4 h-10 border border-white/10 bg-[#0a0a0a] rounded-md focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A] text-white transition-all appearance-none"
          >
            <option value="" disabled>Select a customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm text-white/70 mb-2">Service (e.g., Ceramic Coating)</label>
          <input
            type="text"
            required
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A] text-white transition-all"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm text-white/70 mb-2">Date & Time</label>
          <input
            type="datetime-local"
            required
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A] text-white transition-all [color-scheme:dark]"
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm text-white/70 mb-2">Cost (₱)</label>
          <input
            type="number"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A] text-white transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" disabled={isSubmitting} className="w-full h-10 bg-[#E41E6A] hover:bg-pink-600 text-white transition-colors">
            {isSubmitting ? 'Booking...' : 'Book Job'}
          </Button>
        </div>
      </form>

      {/* Standardized Glass Table */}
      <div className="bg-black/40 rounded-lg border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-white/50">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-white/50">No appointments scheduled.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 font-medium text-white/70">Date</th>
                <th className="p-4 font-medium text-white/70">Customer</th>
                <th className="p-4 font-medium text-white/70">Service</th>
                <th className="p-4 font-medium text-white/70">Cost</th>
                <th className="p-4 font-medium text-white/70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white">
                    {new Date(appt.scheduled_date).toLocaleString()}
                  </td>
                  {/* Notice how we safely access the joined customer name! */}
                  <td className="p-4 text-white font-medium">{appt.customers?.name || 'Unknown'}</td>
                  <td className="p-4 text-white/70">{appt.service_type}</td>
                  <td className="p-4 text-white/70">₱{appt.total_cost || '0.00'}</td>
                  <td className="p-4">
                    <select
                      value={appt.status}
                      onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded outline-none border border-white/10 ${
                        appt.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        appt.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-white/10 text-white/70'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}