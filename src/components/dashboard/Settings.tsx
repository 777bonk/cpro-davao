import { Settings as SettingsIcon, Package, Shield, Database, Users, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Input } from "../dashboard-ui/input";
import { Label } from "../dashboard-ui/label";
import { Switch } from "../dashboard-ui/switch";
import { Separator } from "../dashboard-ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../dashboard-ui/table";

const servicePackages = [
  { id: 1, name: "Ceramic Coating 9H", duration: "3-4 hours", price: 35000, category: "Coating" },
  { id: 2, name: "PPF Full Body", duration: "2 days", price: 85000, category: "PPF" },
  { id: 3, name: "Full Detailing Package", duration: "5-6 hours", price: 15000, category: "Detailing" },
  { id: 4, name: "Window Tinting", duration: "2-3 hours", price: 12000, category: "Tinting" },
];

const userRoles = [
  { id: 1, name: "Admin", permissions: "Full Access", users: 2 },
  { id: 2, name: "Manager", permissions: "Edit, View Reports", users: 3 },
  { id: 3, name: "Technician", permissions: "View, Update Status", users: 8 },
  { id: 4, name: "Receptionist", permissions: "View, Add Appointments", users: 2 },
];

export function Settings() {
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
            className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
          >
            Add Package
          </Button>
        </CardHeader>
        <CardContent>
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
              {servicePackages.map((service) => (
                <TableRow key={service.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white">{service.name}</TableCell>
                  <TableCell className="text-white/70">{service.category}</TableCell>
                  <TableCell className="text-white/70">{service.duration}</TableCell>
                  <TableCell className="text-white">₱{service.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white"
          >
            Add Role
          </Button>
        </CardHeader>
        <CardContent>
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
              {userRoles.map((role) => (
                <TableRow key={role.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#E41E6A]" />
                      <span className="text-white">{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70">{role.permissions}</TableCell>
                  <TableCell className="text-white">{role.users} users</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#E41E6A]/30 text-[#E41E6A] hover:bg-[#E41E6A]/10"
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              <Label htmlFor="backup-frequency" className="text-white">
                Backup Frequency
              </Label>
              <Input
                id="backup-frequency"
                value="Daily at 2:00 AM"
                className="mt-2 bg-white/5 border-white/10 text-white"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="last-backup" className="text-white">
                Last Backup
              </Label>
              <Input
                id="last-backup"
                value="October 23, 2024 - 2:00 AM"
                className="mt-2 bg-white/5 border-white/10 text-white"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="backup-size" className="text-white">
                Backup Size
              </Label>
              <Input
                id="backup-size"
                value="2.4 GB"
                className="mt-2 bg-white/5 border-white/10 text-white"
                disabled
              />
            </div>
            <Button className="w-full bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white">
              <Database className="w-4 h-4 mr-2" />
              Backup Now
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
              <Label htmlFor="business-name" className="text-white">
                Business Name
              </Label>
              <Input
                id="business-name"
                defaultValue="Ceramic Pro Davao"
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="contact-number" className="text-white">
                Contact Number
              </Label>
              <Input
                id="contact-number"
                defaultValue="+63 912 345 6789"
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                defaultValue="info@ceramicprodavao.com"
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-white">
                Website
              </Label>
              <Input
                id="website"
                defaultValue="www.ceramicprodavao.com"
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-white">
                Business Address
              </Label>
              <Input
                id="address"
                defaultValue="123 Automotive St, Davao City, Philippines"
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <Button className="mt-6 bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
