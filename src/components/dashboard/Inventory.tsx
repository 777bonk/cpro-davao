import React, { useState, useEffect } from 'react';
import { getInventory, createInventoryItem, updateStockLevel, InventoryItem } from '../../services/inventory';
import { Button } from '../dashboard-ui/button';

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [threshold, setThreshold] = useState('5'); // Default warning at 5 items

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const data = await getInventory();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const newItem = await createInventoryItem({
        name,
        category,
        quantity: parseInt(quantity),
        unit_price: parseFloat(unitPrice),
        low_stock_threshold: parseInt(threshold),
      });

      // Update UI without refreshing
      setItems([newItem, ...items].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Reset Form
      setName('');
      setCategory('');
      setQuantity('');
      setUnitPrice('');
    } catch (err: any) {
      setError(err.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStockUpdate = async (id: string, currentQty: number, change: number) => {
    const newQty = Math.max(0, currentQty + change); // Prevent negative stock
    try {
      await updateStockLevel(id, newQty);
      setItems(items.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    } catch (err) {
      console.error("Failed to update stock");
    }
  };

  return (
    <div className="p-6 text-white min-h-screen flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Inventory Management</h1>

      {error && <p className="text-red-400">{error}</p>}

      {/* Standardized Glass Form */}
      <form 
        onSubmit={handleAddItem} 
        className="bg-black/40 p-6 rounded-lg border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-6 items-end"
      >
        <div className="md:col-span-3">
          <label className="block text-sm text-white/70 mb-2">Item Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A] text-white transition-all"
            placeholder="e.g., 9H Ceramic Coating"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm text-white/70 mb-2">Category</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 h-10 border border-white/10 bg-[#0a0a0a] rounded-md focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A] text-white transition-all appearance-none"
          >
            <option value="" disabled>Select category...</option>
            <option value="Coatings">Coatings</option>
            <option value="Polishes">Polishes & Compounds</option>
            <option value="Pads">Pads & Towels</option>
            <option value="Cleaners">Cleaners & Degreasers</option>
            <option value="Misc">Miscellaneous</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-white/70 mb-2">Initial Qty</label>
          <input
            type="number"
            required
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A] text-white transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-white/70 mb-2">Cost/Unit (₱)</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A] text-white transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" disabled={isSubmitting} className="w-full h-10 bg-[#E41E6A] hover:bg-pink-600 text-white transition-colors">
            {isSubmitting ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      </form>

      {/* Standardized Glass Table */}
      <div className="bg-black/40 rounded-lg border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-white/50">Loading inventory...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-white/50">No items in inventory.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 font-medium text-white/70">Item Name</th>
                <th className="p-4 font-medium text-white/70">Category</th>
                <th className="p-4 font-medium text-white/70">Stock Level</th>
                <th className="p-4 font-medium text-white/70">Unit Cost</th>
                <th className="p-4 font-medium text-white/70 text-right">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((item) => {
                const isLowStock = item.quantity <= item.low_stock_threshold;
                
                return (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-medium">{item.name}</td>
                    <td className="p-4 text-white/70">
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4">
                      {/* Low Stock Warning Logic */}
                      <span className={`font-bold ${isLowStock ? 'text-red-400' : 'text-green-400'}`}>
                        {item.quantity}
                      </span>
                      {isLowStock && <span className="text-red-400/70 text-xs ml-2">(Low Stock)</span>}
                    </td>
                    <td className="p-4 text-white/70">₱{item.unit_price}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleQuickStockUpdate(item.id, item.quantity, -1)}
                        className="w-8 h-8 rounded bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                        title="Use 1 item"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => handleQuickStockUpdate(item.id, item.quantity, 1)}
                        className="w-8 h-8 rounded bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                        title="Add 1 item"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}