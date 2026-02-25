import { useState } from "react";
import { Package, Plus, TrendingDown, AlertTriangle, BarChart3, X, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Badge } from "../dashboard-ui/badge";
import { Progress } from "../dashboard-ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../dashboard-ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../dashboard-ui/dialog";
import { Label } from "../dashboard-ui/label";
import { Input } from "../dashboard-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../dashboard-ui/select";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  stock: number;
  stockIn: number;
  stockOut: number;
  unit: string;
  reorderLevel: number;
  price: number;
  status: "Good" | "Low" | "Critical";
  deliveryDate?: string;
  deliveryStatus?: "Incoming" | "Delivered";
}

const initialInventory: InventoryItem[] = [
  { id: 1, name: "Ceramic Coating 9H", category: "Coating", stock: 15, stockIn: 20, stockOut: 5, unit: "bottles", reorderLevel: 10, price: 3500, status: "Good" },
  { id: 2, name: "PPF Roll - Clear", category: "PPF", stock: 3, stockIn: 8, stockOut: 5, unit: "rolls", reorderLevel: 5, price: 25000, status: "Low" },
  { id: 3, name: "Microfiber Towels", category: "Supplies", stock: 45, stockIn: 60, stockOut: 15, unit: "pcs", reorderLevel: 30, price: 150, status: "Good" },
  { id: 4, name: "Polishing Compound", category: "Detailing", stock: 8, stockIn: 20, stockOut: 12, unit: "bottles", reorderLevel: 15, price: 1200, status: "Low" },
  { id: 5, name: "Window Tint Film", category: "Tinting", stock: 12, stockIn: 15, stockOut: 3, unit: "rolls", reorderLevel: 8, price: 5000, status: "Good" },
  { id: 6, name: "Tire Shine", category: "Detailing", stock: 2, stockIn: 12, stockOut: 10, unit: "bottles", reorderLevel: 10, price: 450, status: "Critical" },
];

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    stock: "",
    stockIn: "",
    stockOut: "",
    unit: "",
    reorderLevel: "",
    price: "",
  });

  const [reorderData, setReorderData] = useState({
    quantity: "",
    deliveryDate: "",
  });

  const [editData, setEditData] = useState({
    stockAdjustment: "",
    adjustmentType: "add" as "add" | "deduct",
  });

  const calculateStatus = (stock: number, reorderLevel: number): "Good" | "Low" | "Critical" => {
    if (stock <= reorderLevel * 0.3) return "Critical";
    if (stock <= reorderLevel) return "Low";
    return "Good";
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || !newItem.stock) {
      alert("Please fill in all required fields");
      return;
    }

    const stockNum = parseInt(newItem.stock);
    const reorderNum = parseInt(newItem.reorderLevel) || 10;
    
    const item: InventoryItem = {
      id: inventory.length + 1,
      name: newItem.name,
      category: newItem.category,
      stock: stockNum,
      stockIn: parseInt(newItem.stockIn) || 0,
      stockOut: parseInt(newItem.stockOut) || 0,
      unit: newItem.unit || "pcs",
      reorderLevel: reorderNum,
      price: parseFloat(newItem.price) || 0,
      status: calculateStatus(stockNum, reorderNum),
    };

    setInventory([...inventory, item]);
    setAddItemOpen(false);
    
    // Reset form
    setNewItem({
      name: "",
      category: "",
      stock: "",
      stockIn: "",
      stockOut: "",
      unit: "",
      reorderLevel: "",
      price: "",
    });
  };

  const handleReorder = () => {
    if (!selectedItem || !reorderData.quantity) {
      alert("Please enter quantity to reorder");
      return;
    }

    const quantity = parseInt(reorderData.quantity);
    setInventory(inventory.map(item =>
      item.id === selectedItem.id
        ? {
            ...item,
            stock: item.stock + quantity,
            stockIn: item.stockIn + quantity,
            status: calculateStatus(item.stock + quantity, item.reorderLevel),
          }
        : item
    ));

    setReorderOpen(false);
    setReorderData({ quantity: "", deliveryDate: "" });
    setSelectedItem(null);
  };

  const handleEdit = () => {
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

    setInventory(inventory.map(item =>
      item.id === selectedItem.id
        ? {
            ...item,
            stock: newStock,
            stockIn: editData.adjustmentType === "add" ? item.stockIn + adjustment : item.stockIn,
            stockOut: editData.adjustmentType === "deduct" ? item.stockOut + adjustment : item.stockOut,
            status: calculateStatus(newStock, item.reorderLevel),
          }
        : item
    ));

    setEditItemOpen(false);
    setEditData({ stockAdjustment: "", adjustmentType: "add" });
    setSelectedItem(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-3xl mb-2">Inventory Management</h1>
          <p className="text-white/60">Track and manage your supplies and materials</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
          onClick={() => setAddItemOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{inventory.length}</div>
            <p className="text-xs text-white/50 mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-orange-400 text-2xl">{lowStockItems.length}</div>
            <p className="text-xs text-white/50 mt-1">Needs reorder</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">₱{Math.round(totalValue / 1000)}K</div>
            <p className="text-xs text-white/50 mt-1">Current stock value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Stock Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{inventory.reduce((sum, item) => sum + item.stockOut, 0)}</div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white/5 rounded-lg border border-orange-500/20"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white">{item.name}</p>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-white/50 text-sm mb-3">{item.category}</p>
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
          <Table>
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
                      <p className="text-white">{item.name}</p>
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
        </CardContent>
      </Card>

      {/* Add Item Modal */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add New Item</DialogTitle>
            <DialogDescription className="sr-only">
              Add a new inventory item by filling out the form with item details, stock levels, and pricing information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Item Name *</Label>
              <Input
                id="name"
                placeholder="Item name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category" className="text-white/70">Category *</Label>
              <Input
                id="category"
                placeholder="Category"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-white/70">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-white/70">Unit</Label>
                <Input
                  id="unit"
                  placeholder="pcs, bottles, etc."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockIn" className="text-white/70">Stock In</Label>
                <Input
                  id="stockIn"
                  type="number"
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  value={newItem.stockIn}
                  onChange={(e) => setNewItem({ ...newItem, stockIn: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stockOut" className="text-white/70">Stock Out</Label>
                <Input
                  id="stockOut"
                  type="number"
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  value={newItem.stockOut}
                  onChange={(e) => setNewItem({ ...newItem, stockOut: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorderLevel" className="text-white/70">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  placeholder="10"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  value={newItem.reorderLevel}
                  onChange={(e) => setNewItem({ ...newItem, reorderLevel: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price" className="text-white/70">Unit Price</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setAddItemOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Modal */}
      <Dialog open={reorderOpen} onOpenChange={setReorderOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Reorder Item</DialogTitle>
            <DialogDescription className="sr-only">
              Reorder inventory item by specifying quantity and delivery date
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Item</p>
                <p className="text-white text-lg">{selectedItem.name}</p>
                <p className="text-white/50 text-sm mt-1">Current Stock: {selectedItem.stock} {selectedItem.unit}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-white/70">Quantity to Reorder *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  value={reorderData.quantity}
                  onChange={(e) => setReorderData({ ...reorderData, quantity: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryDate" className="text-white/70">Expected Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  className="bg-white/5 border-white/10 text-white"
                  value={reorderData.deliveryDate}
                  onChange={(e) => setReorderData({ ...reorderData, deliveryDate: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => {
                setReorderOpen(false);
                setReorderData({ quantity: "", deliveryDate: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
              onClick={handleReorder}
            >
              Confirm Reorder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Edit Stock</DialogTitle>
            <DialogDescription className="sr-only">
              Manually adjust stock levels by adding or deducting quantities
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Item</p>
                <p className="text-white text-lg">{selectedItem.name}</p>
                <p className="text-white/50 text-sm mt-1">Current Stock: {selectedItem.stock} {selectedItem.unit}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adjustmentType" className="text-white/70">Adjustment Type</Label>
                <Select
                  value={editData.adjustmentType}
                  onValueChange={(value: "add" | "deduct") => setEditData({ ...editData, adjustmentType: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    <SelectItem value="add" className="text-white">Add Stock</SelectItem>
                    <SelectItem value="deduct" className="text-white">Deduct Stock (Used Items)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stockAdjustment" className="text-white/70">Quantity *</Label>
                <Input
                  id="stockAdjustment"
                  type="number"
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
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
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => {
                setEditItemOpen(false);
                setEditData({ stockAdjustment: "", adjustmentType: "add" });
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
              onClick={handleEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inventory Report Modal */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Inventory Report</DialogTitle>
            <DialogDescription className="sr-only">
              View comprehensive inventory report with stock levels, movements, and total value
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setReportOpen(false)}
            >
              Close
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
              onClick={() => window.print()}
            >
              Print Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}