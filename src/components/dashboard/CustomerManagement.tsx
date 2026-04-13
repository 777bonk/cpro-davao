import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, Customer } from '../../services/customer';
import { Button } from '../ui/button';

export default function Customers() {
  // 1. State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New Customer Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // 2. Fetch Data on Mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError('Failed to load customers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Creating a New Customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const newCustomer = await createCustomer({
        name: newCustomerName,
        email: newCustomerEmail,
        phone: null, // Update this if you add a phone input
        vehicle_details: {}, // Can store things like { make: "Honda", model: "Civic" }
      });

      // Update local state immediately so you don't have to refetch the whole list
      setCustomers([newCustomer, ...customers]);
      
      // Reset form
      setNewCustomerName('');
      setNewCustomerEmail('');
    } catch (err) {
      setError('Failed to add customer');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 text-white bg-[#000000] min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Customers</h1>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {/* Add New Customer Form */}
      <form onSubmit={handleAddCustomer} className="mb-8 bg-gray-900 p-6 rounded-lg border border-gray-800 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1">Name</label>
          <input
            type="text"
            required
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded focus:outline-none focus:border-gray-500"
            placeholder="John Doe"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            type="email"
            value={newCustomerEmail}
            onChange={(e) => setNewCustomerEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded focus:outline-none focus:border-gray-500"
            placeholder="john@example.com"
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="px-6 py-2">
          {isSubmitting ? 'Adding...' : 'Add Customer'}
        </Button>
      </form>

      {/* Customers List / Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No customers found. Add your first one above!</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Added On</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-4">{customer.name}</td>
                  <td className="p-4 text-gray-400">{customer.email || 'N/A'}</td>
                  <td className="p-4 text-gray-400">
                    {new Date(customer.created_at).toLocaleDateString()}
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