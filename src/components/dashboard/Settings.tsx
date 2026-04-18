import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Package, Shield, Database, Users, Bell, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Input } from "../dashboard-ui/input";
import { Label } from "../dashboard-ui/label";
import { Switch } from "../dashboard-ui/switch";
import { Separator } from "../dashboard-ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../dashboard-ui/table";
import { getServices, createService, updateService, getShopSettings, updateShopSettings, ServicePackage, ShopSettings } from "../../services/settings";
import { Badge } from "../dashboard-ui/badge";

const initialUserRoles = [
  { id: 1, name: "Admin", permissions: "Full Access", users: 2 },
  { id: 2, name: "Manager", permissions: "Edit, View Reports", users: 3 },
  { id: 3, name: "Technician", permissions: "View, Update Status", users: 8 },
  { id: 4, name: "Receptionist", permissions: "View, Add Appointments", users: 2 },
];

export function Settings() {
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- MODAL STATES ---
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isManageRoleOpen, setIsManageRoleOpen] = useState(false); 

  // --- FORM STATES ---
  const [newService, setNewService] = useState({
    name: "",
    category: "",
    duration: "",
    price: "",
  });
  
  const [editingService, setEditingService] = useState<ServicePackage | null>(null);

  const [roles, setRoles] = useState(initialUserRoles);
  const [newRole, setNewRole] = useState({
    name: "",
    permissions: "",
  });
  
  const [editingRole, setEditingRole] = useState<{id: number, name: string, permissions: string, users: number} | null>(null);

  const [businessInfo, setBusinessInfo] = useState<ShopSettings>({
    business_name: "",
    contact_number: "",
    email: "",
    website: "",
    address: "",
  });
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [servicesData, settingsData] = await Promise.all([
        getServices(),
        getShopSettings()
      ]);
      setServices(servicesData);
      if (settingsData) {
        setBusinessInfo(settingsData);
      }
    } catch (error) {
      console.error("Failed to load settings data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLERS FOR SERVICES ---
  const handleAddService = async () => {
    if (!newService.name || !newService.category || !newService.price) {
      alert("Please fill in Name, Category, and Price");
      return;
    }

    try {
      const addedService = await createService({
        name: newService.name,
        category: newService.category,
        duration: newService.duration || "N/A",
        price: parseFloat(newService.price),
      });

      setServices([...services, addedService].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddServiceOpen(false);
      setNewService({ name: "", category: "", duration: "", price: "" });
    } catch (error: any) {
      alert(`Database Error: ${error.message}`);
    }
  };

  const handleOpenEditService = (service: ServicePackage) => {
    setEditingService(service);
    setIsEditServiceOpen(true);
  };

  const handleSaveEditedService = async () => {
    if (!editingService || !editingService.name || !editingService.category || !editingService.price) {
      alert("Please fill in Name, Category, and Price");
      return;
    }

    try {
      const updated = await updateService(editingService.id, {
        name: editingService.name,
        category: editingService.category,
        duration: editingService.duration,
        price: parseFloat(editingService.price.toString()),
      });

      setServices(services.map(s => s.id === updated.id ? updated : s).sort((a, b) => a.name.localeCompare(b.name)));
      setIsEditServiceOpen(false);
      setEditingService(null);
    } catch (error: any) {
      alert(`Database Error: ${error.message}`);
    }
  };

  // --- HANDLERS FOR ROLES ---
  const handleAddRole = () => {
    if (!newRole.name || !newRole.permissions) {
      alert("Please fill in Role Name and Permissions");
      return;
    }

    const roleToAdd = {
      id: roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1,
      name: newRole.name,
      permissions: newRole.permissions,
      users: 0,
    };

    setRoles([...roles, roleToAdd]);
    setIsAddRoleOpen(false);
    setNewRole({ name: "", permissions: "" });
  };

  const handleSaveManagedRole = () => {
    if (!editingRole) return;
    setRoles(roles.map(r => r.id === editingRole.id ? editingRole : r));
    setIsManageRoleOpen(false);
    setEditingRole(null);
  };

  const handleDeleteRole = (id: number) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  const handleSaveBusinessInfo = async () => {
    setIsSavingInfo(true);
    try {
      await updateShopSettings(businessInfo);
      alert("Business Information saved successfully!");
    } catch (error: any) {
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSavingInfo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-3xl mb-2">System Settings</h1>
        <p className="text-white/60">Configure your system preferences and settings</p>
      </div>

      {/* Service Packages */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Service Packages</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddServiceOpen(true)}
            className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
          >
            Add Package
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-white/50 py-4 text-center">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="text-white/50 py-4 text-center">No service packages found. Add one above!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Service Name</TableHead>
                  <TableHead className="text-white/70">Category</TableHead>
                  <TableHead className="text-white/70">Duration</TableHead>
                  <TableHead className="text-white/70">Price</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white font-medium">{service.name}</TableCell>
                    <TableCell className="text-white/70">
                      <Badge variant="outline" className="border-white/20 text-white/70">{service.category}</Badge>
                    </TableCell>
                    <TableCell className="text-white/70">{service.duration}</TableCell>
                    <TableCell className="text-white">₱{Number(service.price).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10" 
                        onClick={() => handleOpenEditService(service)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Roles & Permissions */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">User Roles & Permissions</CardTitle>
          </div>
          <Button 
            size="sm" 
            onClick={() => setIsAddRoleOpen(true)}
            className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
          >
            Add Role
          </Button>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-white/50 py-4 text-center">No user roles found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Role Name</TableHead>
                  <TableHead className="text-white/70">Permissions</TableHead>
                  <TableHead className="text-white/70">Users</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#E41E6A]" />
                        <span className="text-white font-medium">{role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/70">{role.permissions}</TableCell>
                    <TableCell className="text-white">{role.users} users</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                          onClick={() => {
                            setEditingRole(role);
                            setIsManageRoleOpen(true);
                          }}
                        >
                          Manage
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* System Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notification Settings */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#E41E6A]" />
              <CardTitle className="text-white">Notification Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Email Notifications</p>
                <p className="text-white/50 text-xs">Receive email alerts for important events</p>
              </div>
              <Switch />
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Low Stock Alerts</p>
                <p className="text-white/50 text-xs">Get notified when inventory is low</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Appointment Reminders</p>
                <p className="text-white/50 text-xs">Send reminders to customers</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Payment Notifications</p>
                <p className="text-white/50 text-xs">Alerts for pending payments</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* System Backup */}
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#E41E6A]" />
              <CardTitle className="text-white">System Backup</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Backup Frequency</Label>
              <Input value="Daily at 2:00 AM" className="mt-2 bg-white/5 border-white/10 text-white" disabled />
            </div>
            <div>
              <Label className="text-white">Last Backup</Label>
              <Input value="October 23, 2024 - 2:00 AM" className="mt-2 bg-white/5 border-white/10 text-white" disabled />
            </div>
            <div>
              <Label className="text-white">Backup Size</Label>
              <Input value="2.4 GB" className="mt-2 bg-white/5 border-white/10 text-white" disabled />
            </div>
            <Button className="w-full bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white" onClick={() => alert("Initiating manual backup to cloud...")}>
              <Database className="w-4 h-4 mr-2" /> Backup Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Business Information */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Business Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Business Name</Label>
              <Input 
                className="mt-2 bg-white/5 border-white/10 text-white" 
                value={businessInfo.business_name}
                onChange={(e) => setBusinessInfo({...businessInfo, business_name: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-white">Contact Number</Label>
              <Input 
                className="mt-2 bg-white/5 border-white/10 text-white" 
                value={businessInfo.contact_number}
                onChange={(e) => setBusinessInfo({...businessInfo, contact_number: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-white">Email Address</Label>
              <Input 
                className="mt-2 bg-white/5 border-white/10 text-white" 
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-white">Website</Label>
              <Input 
                className="mt-2 bg-white/5 border-white/10 text-white" 
                value={businessInfo.website}
                onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-white">Business Address</Label>
              <Input 
                className="mt-2 bg-white/5 border-white/10 text-white" 
                value={businessInfo.address}
                onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
              />
            </div>
          </div>
          <Button 
            className="mt-6 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
            onClick={handleSaveBusinessInfo}
            disabled={isSavingInfo}
          >
            {isSavingInfo ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* =========================================
          1. ADD SERVICE PACKAGE MODAL
          ========================================= */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add Service Package</h2>
              <button onClick={() => setIsAddServiceOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Service Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g., 9H Ceramic Coating" 
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" 
                  value={newService.name} 
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Category *</label>
                  <select 
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white appearance-none" 
                    value={newService.category} 
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  >
                    <option value="" disabled className="bg-[#0a0a0a]">Select category...</option>
                    <option value="Coating" className="bg-[#0a0a0a]">Coating</option>
                    <option value="PPF" className="bg-[#0a0a0a]">PPF</option>
                    <option value="Detailing" className="bg-[#0a0a0a]">Detailing</option>
                    <option value="Tinting" className="bg-[#0a0a0a]">Tinting</option>
                    <option value="Wash" className="bg-[#0a0a0a]">Wash</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Base Price (₱) *</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" 
                    value={newService.price} 
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Estimated Duration</label>
                <input 
                  type="text" 
                  placeholder="e.g., 3-4 hours" 
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" 
                  value={newService.duration} 
                  onChange={(e) => setNewService({ ...newService, duration: e.target.value })} 
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setIsAddServiceOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleAddService}>Save Package</Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          2. EDIT SERVICE PACKAGE MODAL
          ========================================= */}
      {isEditServiceOpen && editingService && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Service Package</h2>
              <button onClick={() => { setIsEditServiceOpen(false); setEditingService(null); }} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Service Name *</label>
                <input 
                  type="text" 
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" 
                  value={editingService.name} 
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Category *</label>
                  <select 
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white appearance-none" 
                    value={editingService.category} 
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  >
                    <option value="" disabled className="bg-[#0a0a0a]">Select category...</option>
                    <option value="Coating" className="bg-[#0a0a0a]">Coating</option>
                    <option value="PPF" className="bg-[#0a0a0a]">PPF</option>
                    <option value="Detailing" className="bg-[#0a0a0a]">Detailing</option>
                    <option value="Tinting" className="bg-[#0a0a0a]">Tinting</option>
                    <option value="Wash" className="bg-[#0a0a0a]">Wash</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Base Price (₱) *</label>
                  <input 
                    type="number" 
                    className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" 
                    value={editingService.price} 
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Estimated Duration</label>
                <input 
                  type="text" 
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" 
                  value={editingService.duration} 
                  onChange={(e) => setEditingService({ ...editingService, duration: e.target.value })} 
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => { setIsEditServiceOpen(false); setEditingService(null); }}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleSaveEditedService}>Update Package</Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          3. ADD USER ROLE MODAL 
          ========================================= */}
      {isAddRoleOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add User Role</h2>
              <button onClick={() => setIsAddRoleOpen(false)} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Role Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Lead Detailer, Cashier" 
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" 
                  value={newRole.name} 
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Permissions *</label>
                <select 
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white appearance-none" 
                  value={newRole.permissions} 
                  onChange={(e) => setNewRole({ ...newRole, permissions: e.target.value })}
                >
                  <option value="" disabled className="bg-[#0a0a0a]">Select permissions level...</option>
                  <option value="Full Access" className="bg-[#0a0a0a]">Full Access</option>
                  <option value="Edit, View Reports" className="bg-[#0a0a0a]">Edit, View Reports</option>
                  <option value="View, Update Status" className="bg-[#0a0a0a]">View, Update Status</option>
                  <option value="View Only" className="bg-[#0a0a0a]">View Only</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => setIsAddRoleOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleAddRole}>Save Role</Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          4. MANAGE (EDIT) USER ROLE MODAL 
          ========================================= */}
      {isManageRoleOpen && editingRole && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Manage Role: {editingRole.name}</h2>
              <button onClick={() => { setIsManageRoleOpen(false); setEditingRole(null); }} className="text-white/50 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Edit Role Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white" 
                  value={editingRole.name} 
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Update Permissions</label>
                <select 
                  className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md focus:outline-none focus:border-[#E41E6A] text-white appearance-none" 
                  value={editingRole.permissions} 
                  onChange={(e) => setEditingRole({ ...editingRole, permissions: e.target.value })}
                >
                  <option value="Full Access" className="bg-[#0a0a0a]">Full Access</option>
                  <option value="Edit, View Reports" className="bg-[#0a0a0a]">Edit, View Reports</option>
                  <option value="View, Update Status" className="bg-[#0a0a0a]">View, Update Status</option>
                  <option value="View Only" className="bg-[#0a0a0a]">View Only</option>
                </select>
              </div>
              <div className="pt-2">
                <p className="text-sm text-white/50">
                  Currently assigned to <span className="text-white font-bold">{editingRole.users}</span> users.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => { setIsManageRoleOpen(false); setEditingRole(null); }}>Cancel</Button>
              <Button className="bg-gradient-to-r from-[#E41E6A] to-pink-600 text-white border-none hover:opacity-90" onClick={handleSaveManagedRole}>Update Role</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}