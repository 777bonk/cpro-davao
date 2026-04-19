import { useState, useEffect } from "react";
import { Package, Plus, TrendingDown, AlertTriangle, BarChart3, X, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import { Progress } from "../dashboard-ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../dashboard-ui/table";
import { Label } from "../dashboard-ui/label";
import { getInventory, createInventoryItem, updateInventoryStock, InventoryItem } from "../../services/inventory";

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Form States
  const [newItem, setNewItem] = useState({
    name: "", category: "", stock: "", stockIn: "", stockOut: "", unit: "", reorderLevel: "", price: "",
  });

  const [reorderData, setReorderData] = useState({
    quantity: "", deliveryDate: "",
  });

  const [editData, setEditData] = useState({
    stockAdjustment: "", adjustmentType: "add" as "add" | "deduct",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getInventory();
      // Apply status calculations instantly
      const processedData = data.map(item => ({
        ...item,
        status: calculateStatus(item.stock, item.reorderLevel)
      }));
      setInventory(processedData);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatus = (stock: number, reorderLevel: number): "Good" | "Low" | "Critical" => {
    if (stock <= reorderLevel * 0.3) return "Critical";
    if (stock <= reorderLevel) return "Low";
    return "Good";
  };

  // HANDLERS
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.stock) {
      alert("Please fill in Name, Category, and Stock");
      return;
    }

    try {
      await createInventoryItem({
        name: newItem.name,
        category: newItem.category,
        stock: parseInt(newItem.stock),
        stockIn: parseInt(newItem.stockIn) || 0,
        stockOut: parseInt(newItem.stockOut) || 0,
        unit: newItem.unit || "pcs",
        reorderLevel: parseInt(newItem.reorderLevel) || 10,
        price: parseFloat(newItem.price) || 0,
      });

      fetchData(); // Refresh list from DB
      setAddItemOpen(false);
      setNewItem({ name: "", category: "", stock: "", stockIn: "", stockOut: "", unit: "", reorderLevel: "", price: "" });
    } catch (error: any) {
      alert(`Database Error: ${error.message}`);
    }
  };

  const handleReorder = async () => {
    if (!selectedItem || !reorderData.quantity) {
      alert("Please enter quantity to reorder");
      return;
    }

    const quantity = parseInt(reorderData.quantity);
    const newStock = selectedItem.stock + quantity;
    const newStockIn = selectedItem.stockIn + quantity;

    try {
      await updateInventoryStock(selectedItem.id, newStock, newStockIn, selectedItem.stockOut);
       
      // Update local state instantly
      setInventory(inventory.map(item =>
        item.id === selectedItem.id
          ? { ...item, stock: newStock, stockIn: newStockIn, status: calculateStatus(newStock, item.reorderLevel) }
          : item
      ));

      setReorderOpen(false);
      setReorderData({ quantity: "", deliveryDate: "" });
      setSelectedItem(null);
    } catch (error: any) {
      alert(`Database Error: ${error.message}`);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !editData.stockAdjustment) {
      alert("Please enter adjustment amount");
      return;
    }

    const adjustment = parseInt(editData.stockAdjustment);
    const newStock = editData.adjustmentType === "add" 
      ? selectedItem.stock + adjustment 
      : selectedItem.stock - adjustment;

    if (newStock < 0) {
      alert("Cannot deduct more than available stock");
      return;
    }

    const newStockIn = editData.adjustmentType === "add" ? selectedItem.stockIn + adjustment : selectedItem.stockIn;
    const newStockOut = editData.adjustmentType === "deduct" ? selectedItem.stockOut + adjustment : selectedItem.stockOut;

    try {
      await updateInventoryStock(selectedItem.id, newStock, newStockIn, newStockOut);
      
      setInventory(inventory.map(item =>
        item.id === selectedItem.id
          ? { ...item, stock: newStock, stockIn: newStockIn, stockOut: newStockOut, status: calculateStatus(newStock, item.reorderLevel) }
          : item
      ));

      setEditItemOpen(false);
      setEditData({ stockAdjustment: "", adjustmentType: "add" });
      setSelectedItem(null);
    } catch (error: any) {
      alert(`Database Error: ${error.message}`);
    }
  };

  const handleOpenReorder = (item: InventoryItem) => {
    setSelectedItem(item);
    setReorderOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditItemOpen(true);
  };

  const lowStockItems = inventory.filter(item => item.status !== "Good");
  const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.price), 0);

  return (
    <div className="inventory-page space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-3xl mb-2">Inventory Management</h1>
          <p className="text-white/60">Track and manage your supplies and materials</p>
        </div>
        <Button 
          className="bg-linear-to-r from-[#E41E6A] to-pink-600 hover:from-gray-600 text-white"
          onClick={() => setAddItemOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : inventory.length}</div>
            <p className="text-xs text-white/50 mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-orange-400 text-2xl">{isLoading ? '...' : lowStockItems.length}</div>
            <p className="text-xs text-white/50 mt-1">Needs reorder</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱{isLoading ? '...' : Math.round(totalValue / 1000)}K</div>
            <p className="text-xs text-white/50 mt-1">Current stock value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Stock Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : inventory.reduce((sum, item) => sum + item.stockOut, 0)}</div>
            <p className="text-xs text-white/50 mt-1">Items used</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white/5 rounded-lg border border-orange-500/20"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-medium truncate">{item.name}</p>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-white/50 text-sm mb-3 truncate">{item.category}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Stock: {item.stock} {item.unit}</span>
                      <span className="text-white/60">Reorder: {item.reorderLevel}</span>
                    </div>
                    <Progress
                      value={(item.stock / item.reorderLevel) * 100}
                      className="h-2 bg-white/10"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                    onClick={() => handleOpenReorder(item)}
                  >
                    Reorder Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Inventory List</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/5"
            onClick={() => setReportOpen(true)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-white/50 py-8">Loading inventory...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center text-white/50 py-8">No inventory items found.</div>
          ) : (
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Item Name</TableHead>
                  <TableHead className="text-white/70">Category</TableHead>
                  <TableHead className="text-white/70">Stock</TableHead>
                  <TableHead className="text-white/70">Stock In</TableHead>
                  <TableHead className="text-white/70">Stock Out</TableHead>
                  <TableHead className="text-white/70">Unit Price</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E41E6A] to-pink-600 flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-white truncate">{item.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/20 text-white/70">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-white">
                        {item.stock} {item.unit}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-green-400">{item.stockIn}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-red-400">{item.stockOut}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-white">₱{item.price.toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.status === "Good"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : item.status === "Low"
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          onClick={() => handleOpenReorder(item)}
                        >
                          Reorder
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* =========================================
          NATIVE TAILWIND OVERLAYS (MODALS)
          ========================================= */}

      {/* 1. Add Item Modal */}
      {addItemOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add New Item</h2>
              <button onClick={() => setAddItemOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-white/70">Item Name *</Label>
                <input
                  type="text"
                  placeholder="Item name"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Category *</Label>
                <input
                  type="text"
                  placeholder="Category"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Stock *</Label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Unit</Label>
                  <input
                    type="text"
                    placeholder="pcs, bottles, etc."
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Stock In</Label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                    value={newItem.stockIn}
                    onChange={(e) => setNewItem({ ...newItem, stockIn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Stock Out</Label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                    value={newItem.stockOut}
                    onChange={(e) => setNewItem({ ...newItem, stockOut: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Reorder Level</Label>
                  <input
                    type="number"
                    placeholder="10"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                    value={newItem.reorderLevel}
                    onChange={(e) => setNewItem({ ...newItem, reorderLevel: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Unit Price</Label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={() => setAddItemOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleAddItem}>Add Item</Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Reorder Modal */}
      {reorderOpen && selectedItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Reorder Item</h2>
              <button onClick={() => setReorderOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Item</p>
                <p className="text-white text-lg">{selectedItem.name}</p>
                <p className="text-white/50 text-sm mt-1">Current Stock: {selectedItem.stock} {selectedItem.unit}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Quantity to Reorder *</Label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={reorderData.quantity}
                  onChange={(e) => setReorderData({ ...reorderData, quantity: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Expected Delivery Date</Label>
                <input
                  type="date"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white [color-scheme:dark]"
                  value={reorderData.deliveryDate}
                  onChange={(e) => setReorderData({ ...reorderData, deliveryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={() => { setReorderOpen(false); setReorderData({ quantity: "", deliveryDate: "" }); }}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleReorder}>Confirm Reorder</Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Edit Item Modal */}
      {editItemOpen && selectedItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Stock</h2>
              <button onClick={() => setEditItemOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Item</p>
                <p className="text-white text-lg">{selectedItem.name}</p>
                <p className="text-white/50 text-sm mt-1">Current Stock: {selectedItem.stock} {selectedItem.unit}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Adjustment Type</Label>
                <select
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white appearance-none"
                  value={editData.adjustmentType}
                  onChange={(e) => setEditData({ ...editData, adjustmentType: e.target.value as "add" | "deduct" })}
                >
                  <option value="add" className="bg-[#0a0a0a]">Add Stock</option>
                  <option value="deduct" className="bg-[#0a0a0a]">Deduct Stock (Used Items)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Quantity *</Label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={editData.stockAdjustment}
                  onChange={(e) => setEditData({ ...editData, stockAdjustment: e.target.value })}
                />
              </div>
              
              {editData.stockAdjustment && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <p className="text-blue-400 text-sm">
                    New Stock: {editData.adjustmentType === "add" 
                      ? selectedItem.stock + parseInt(editData.stockAdjustment || "0")
                      : selectedItem.stock - parseInt(editData.stockAdjustment || "0")} {selectedItem.unit}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={() => { setEditItemOpen(false); setEditData({ stockAdjustment: "", adjustmentType: "add" }); }}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleEdit}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Inventory Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Inventory Report</h2>
              <button onClick={() => setReportOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Total Items</p>
                  <p className="text-white text-2xl">{inventory.length}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Total Stock In</p>
                  <p className="text-green-400 text-2xl">{inventory.reduce((sum, item) => sum + item.stockIn, 0)}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Total Stock Out</p>
                  <p className="text-red-400 text-2xl">{inventory.reduce((sum, item) => sum + item.stockOut, 0)}</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-white mb-3">Inventory Details</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">Item</TableHead>
                      <TableHead className="text-white/70">Stock</TableHead>
                      <TableHead className="text-white/70">In</TableHead>
                      <TableHead className="text-white/70">Out</TableHead>
                      <TableHead className="text-white/70">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id} className="border-white/10">
                        <TableCell className="text-white">{item.name}</TableCell>
                        <TableCell className="text-white">{item.stock} {item.unit}</TableCell>
                        <TableCell className="text-green-400">{item.stockIn}</TableCell>
                        <TableCell className="text-red-400">{item.stockOut}</TableCell>
                        <TableCell className="text-white">₱{(item.stock * item.price).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 bg-gradient-to-r from-[#E41E6A]/10 to-pink-600/10 rounded-lg border border-[#E41E6A]/30">
                <p className="text-white/60 text-sm">Total Inventory Value</p>
                <p className="text-[#E41E6A] text-3xl">₱{totalValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setReportOpen(false)}>Close</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={() => window.print()}>Print Report</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}