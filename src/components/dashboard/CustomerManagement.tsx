import { useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Input } from "../dashboard-ui/input";
import { Badge } from "../dashboard-ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../dashboard-ui/select";

interface Customer {
  id: number;
  name: string;
  contact: string;
  vehicle: string;
  lastService: string;
  totalSpent: number;
  status: "Active" | "Inactive";
}

const initialCustomers: Customer[] = [
  { id: 1, name: "John Doe", contact: "+63 912 345 6789", vehicle: "BMW M3 2023", lastService: "2024-10-15", totalSpent: 125000, status: "Active" },
  { id: 2, name: "Jane Smith", contact: "+63 923 456 7890", vehicle: "Mercedes C-Class", lastService: "2024-10-18", totalSpent: 98000, status: "Active" },
  { id: 3, name: "Mike Johnson", contact: "+63 934 567 8901", vehicle: "Audi RS5", lastService: "2024-09-22", totalSpent: 156000, status: "Inactive" },
  { id: 4, name: "Sarah Wilson", contact: "+63 945 678 9012", vehicle: "Porsche 911", lastService: "2024-10-20", totalSpent: 245000, status: "Active" },
  { id: 5, name: "Robert Brown", contact: "+63 956 789 0123", vehicle: "Tesla Model S", lastService: "2024-10-12", totalSpent: 87000, status: "Active" },
];

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form state for new customer
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    vehicle: "",
    lastService: "",
    totalSpent: "",
    status: "Active" as "Active" | "Inactive",
  });

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewDetailsOpen(true);
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.contact || !newCustomer.vehicle) {
      alert("Please fill in all required fields");
      return;
    }

    const customer: Customer = {
      id: customers.length + 1,
      name: newCustomer.name,
      contact: newCustomer.contact,
      vehicle: newCustomer.vehicle,
      lastService: newCustomer.lastService || new Date().toISOString().split('T')[0],
      totalSpent: parseFloat(newCustomer.totalSpent) || 0,
      status: newCustomer.status,
    };

    setCustomers([...customers, customer]);
    setAddCustomerOpen(false);
    
    // Reset form
    setNewCustomer({
      name: "",
      contact: "",
      vehicle: "",
      lastService: "",
      totalSpent: "",
      status: "Active",
    });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const newThisMonth = customers.filter(c => {
    const lastService = new Date(c.lastService);
    const now = new Date();
    return lastService.getMonth() === now.getMonth() && lastService.getFullYear() === now.getFullYear();
  }).length;

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
            <div className="text-white text-2xl">{customers.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">VIP Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{customers.filter(c => c.totalSpent > 150000).length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{activeCustomers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white text-2xl">{newThisMonth}</div>
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
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table - ONLY NAME */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Customer List</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <p className="text-white">{customer.name}</p>
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
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center justify-between">
              Customer Details
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewDetailsOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="sr-only">
              View complete customer information including contact details and service history
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Name</p>
                <p className="text-white text-lg">{selectedCustomer.name}</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Contact</p>
                <p className="text-white">{selectedCustomer.contact}</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 text-sm">Vehicle</p>
                <p className="text-white">{selectedCustomer.vehicle}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Last Service</p>
                  <p className="text-white">{selectedCustomer.lastService}</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm">Total Spent</p>
                  <p className="text-white">₱{selectedCustomer.totalSpent.toLocaleString()}</p>
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
                  {selectedCustomer.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Customer Modal */}
      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add New Customer</DialogTitle>
            <DialogDescription className="sr-only">
              Fill out the form to add a new customer to the database
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Name *</Label>
              <Input
                id="name"
                placeholder="Customer name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact" className="text-white/70">Contact *</Label>
              <Input
                id="contact"
                placeholder="+63 XXX XXX XXXX"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newCustomer.contact}
                onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-white/70">Vehicle *</Label>
              <Input
                id="vehicle"
                placeholder="Vehicle model"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newCustomer.vehicle}
                onChange={(e) => setNewCustomer({ ...newCustomer, vehicle: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastService" className="text-white/70">Last Service</Label>
              <Input
                id="lastService"
                type="date"
                className="bg-white/5 border-white/10 text-white"
                value={newCustomer.lastService}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastService: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalSpent" className="text-white/70">Total Spent</Label>
              <Input
                id="totalSpent"
                type="number"
                placeholder="0"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                value={newCustomer.totalSpent}
                onChange={(e) => setNewCustomer({ ...newCustomer, totalSpent: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="text-white/70">Status</Label>
              <Select
                value={newCustomer.status}
                onValueChange={(value: "Active" | "Inactive") => setNewCustomer({ ...newCustomer, status: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="Active" className="text-white">Active</SelectItem>
                  <SelectItem value="Inactive" className="text-white">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setAddCustomerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
              onClick={handleAddCustomer}
            >
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}