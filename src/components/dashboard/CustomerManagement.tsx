import { useState, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Input } from "../dashboard-ui/input";
import { Badge } from "../dashboard-ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../dashboard-ui/table";
import { Label } from "../dashboard-ui/label";
import { getCustomers, createCustomer, Customer } from "../../services/customer";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal States
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form state for new customer
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    vehicle: "",
    last_service: "",
    total_spent: "",
    status: "Active" as "Active" | "Inactive",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewDetailsOpen(true);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.contact || !newCustomer.vehicle) {
      alert("Please fill in Name, Contact, and Vehicle");
      return;
    }

    try {
      const addedCust = await createCustomer({
        name: newCustomer.name,
        contact: newCustomer.contact,
        vehicle: newCustomer.vehicle,
        last_service: newCustomer.last_service || new Date().toISOString().split('T')[0],
        total_spent: parseFloat(newCustomer.total_spent) || 0,
        status: newCustomer.status,
      });

      setCustomers([...customers, addedCust].sort((a, b) => a.name.localeCompare(b.name)));
      setAddCustomerOpen(false);
      
      // Reset form
      setNewCustomer({
        name: "", contact: "", vehicle: "", last_service: "", total_spent: "", status: "Active",
      });
    } catch (error: any) {
      console.error("Failed to add customer", error);
      alert(`Database Error: ${error?.message || 'Failed to add customer to database.'}`);
    }
  };

  // Filter and Stats Logic
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCustomers = customers.filter(c => c.status === "Active").length;
  
  const newThisMonth = customers.filter(c => {
    if (!c.created_at) return false;
    const createdDate = new Date(c.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  const vipCount = customers.filter(c => Number(c.total_spent) > 150000).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-3xl mb-2">Customer Management</h1>
          <p className="text-white/60">Manage your customer database and vehicle information</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
          onClick={() => setAddCustomerOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : customers.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">VIP Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : vipCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : activeCustomers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{isLoading ? '...' : newThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Search customers by name..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-white/50">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-white/50">No customers found. Add your first customer!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Customer Name</TableHead>
                  <TableHead className="text-white/70 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <p className="text-white font-medium">{customer.name}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                        onClick={() => handleViewDetails(customer)}
                      >
                        View Details
                      </Button>
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

      {/* View Details Modal */}
      {viewDetailsOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Customer Details</h2>
              <button onClick={() => setViewDetailsOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Name</p>
                <p className="text-white text-lg font-medium">{selectedCustomer.name}</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Contact</p>
                <p className="text-white">{selectedCustomer.contact || 'N/A'}</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Vehicle</p>
                <p className="text-white">{selectedCustomer.vehicle || 'N/A'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Last Service</p>
                  <p className="text-white">{selectedCustomer.last_service ? new Date(selectedCustomer.last_service).toLocaleDateString() : 'N/A'}</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Total Spent</p>
                  <p className="text-white">₱{Number(selectedCustomer.total_spent || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm mb-2">Status</p>
                <Badge
                  className={
                    selectedCustomer.status === "Active"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  }
                >
                  {selectedCustomer.status || 'Active'}
                </Badge>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setViewDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {addCustomerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add New Customer</h2>
              <button onClick={() => setAddCustomerOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-white/70">Name *</Label>
                <input
                  type="text"
                  placeholder="Customer name"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Contact *</Label>
                <input
                  type="text"
                  placeholder="+63 XXX XXX XXXX"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newCustomer.contact}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Vehicle *</Label>
                <input
                  type="text"
                  placeholder="Vehicle model"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newCustomer.vehicle}
                  onChange={(e) => setNewCustomer({ ...newCustomer, vehicle: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Last Service Date</Label>
                <input
                  type="date"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white [color-scheme:dark]"
                  value={newCustomer.last_service}
                  onChange={(e) => setNewCustomer({ ...newCustomer, last_service: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Total Spent (₱)</Label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white"
                  value={newCustomer.total_spent}
                  onChange={(e) => setNewCustomer({ ...newCustomer, total_spent: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/70">Status</Label>
                <select
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white appearance-none"
                  value={newCustomer.status}
                  onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value as "Active" | "Inactive" })}
                >
                  <option value="Active" className="bg-[#0a0a0a]">Active</option>
                  <option value="Inactive" className="bg-[#0a0a0a]">Inactive</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setAddCustomerOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleAddCustomer}>
                Add Customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}