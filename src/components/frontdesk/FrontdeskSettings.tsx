import { useState } from "react";
import {
  User, Lock, Eye, EyeOff, X, Save,
  Bell, CheckCircle, Shield, Phone, Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Label } from "../dashboard-ui/label";
import { Switch } from "../dashboard-ui/switch";
import { Separator } from "../dashboard-ui/separator";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

function SuccessBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5">
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-emerald-400/60 hover:text-emerald-400">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
      <X className="w-4 h-4 flex-shrink-0" />{message}
    </div>
  );
}

// ─── PASSWORD INPUT ───────────────────────────────────────────────────────────

function PasswordInput({ label, value, onChange, show, onToggle, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/70 text-sm">{label}</Label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••••"}
          className={inputClass + " pr-11"}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function FrontDeskSettings() {
  const { profile } = useAuth();

  // ── Account info state ─────────────────────────────────────────────────────
  const [displayName,    setDisplayName]    = useState(profile?.full_name  ?? "");
  const [contactNumber,  setContactNumber]  = useState("");
  const [isSavingInfo,   setIsSavingInfo]   = useState(false);
  const [infoSuccess,    setInfoSuccess]    = useState("");
  const [infoError,      setInfoError]      = useState("");

  // ── Username state ─────────────────────────────────────────────────────────
  const [newUsername,     setNewUsername]     = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [isSavingUsername,setIsSavingUsername]= useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [usernameError,   setUsernameError]   = useState("");

  // ── Password state ─────────────────────────────────────────────────────────
  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showCurrent,      setShowCurrent]      = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess,  setPasswordSuccess]  = useState("");
  const [passwordError,    setPasswordError]    = useState("");

  // ── Notifications state ────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    newAppointments: true,
    jobAssignments:  true,
    lowStock:        true,
    emailAlerts:     false,
  });
  const [notifSuccess, setNotifSuccess] = useState("");

  const showSuccess = (setter: (s: string) => void, msg: string) => {
    setter(msg);
    setTimeout(() => setter(""), 3500);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveInfo = async () => {
    if (!displayName.trim()) { setInfoError("Display name cannot be empty."); return; }
    setIsSavingInfo(true);
    setInfoError("");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: displayName.trim() })
        .eq("id", profile?.id ?? "");
      if (error) throw error;
      showSuccess(setInfoSuccess, "Profile information saved.");
    } catch (error: any) {
      setInfoError(error?.message ?? "Failed to save profile.");
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleChangeUsername = async () => {
    setUsernameError("");
    if (!newUsername.trim())                         { setUsernameError("New username cannot be empty.");            return; }
    if (newUsername !== confirmUsername)             { setUsernameError("Usernames do not match.");                  return; }
    if (newUsername.trim() === profile?.full_name)  { setUsernameError("New username must be different from the current one."); return; }

    setIsSavingUsername(true);
    try {
      // Update display name in profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: newUsername.trim() })
        .eq("id", profile?.id ?? "");
      if (error) throw error;
      setNewUsername("");
      setConfirmUsername("");
      showSuccess(setUsernameSuccess, "Username updated successfully.");
    } catch (error: any) {
      setUsernameError(error?.message ?? "Failed to update username.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword)        { setPasswordError("Please enter your current password."); return; }
    if (newPassword.length < 8)  { setPasswordError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }

    setIsSavingPassword(true);
    try {
      // Re-authenticate first by signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No user email found.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    user.email,
        password: currentPassword,
      });
      if (signInError) { setPasswordError("Current password is incorrect."); return; }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSuccess(setPasswordSuccess, "Password updated successfully.");
    } catch (error: any) {
      setPasswordError(error?.message ?? "Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveNotifs = () => {
    // Wire to your notifications service when ready
    showSuccess(setNotifSuccess, "Notification preferences saved.");
  };

  // ── Password strength ──────────────────────────────────────────────────────
  const strength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"];
  const strengthColor = ["", "bg-red-500", "bg-amber-400", "bg-emerald-500"];

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div>
        <h1 className="text-white text-3xl font-bold mb-1">Settings</h1>
        <p className="text-white/60 text-sm">Manage your account preferences</p>
      </div>

      {/* ── Current Account Info (read-only) ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Account Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: <User  className="w-4 h-4 text-[#E41E6A]" />, label: "Full Name", value: profile?.full_name ?? "—" },
              { icon: <Mail  className="w-4 h-4 text-[#E41E6A]" />, label: "Email",     value: profile?.email     ?? "—" },
              { icon: <Shield className="w-4 h-4 text-[#E41E6A]"/>, label: "Role",      value: profile?.role      ?? "front desk" },
            ].map(r => (
              <div key={r.label} className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">{r.icon}</div>
                <div>
                  <p className="text-white/50 text-xs">{r.label}</p>
                  <p className="text-white text-sm font-medium mt-0.5 truncate">{r.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Profile Information ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Profile Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {infoSuccess && <SuccessBanner message={infoSuccess} onDismiss={() => setInfoSuccess("")} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />Display Name
              </Label>
              <input
                className={inputClass}
                placeholder="Your full name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />Contact Number
              </Label>
              <input
                className={inputClass}
                placeholder="09XX-XXX-XXXX"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
              />
            </div>
          </div>

          {infoError && <ErrorBanner message={infoError} />}

          <div className="pt-1 flex justify-end">
            <Button
              onClick={handleSaveInfo}
              disabled={isSavingInfo}
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white border-none flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSavingInfo ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Change Username ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Change Username</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {usernameSuccess && <SuccessBanner message={usernameSuccess} onDismiss={() => setUsernameSuccess("")} />}

          {/* Current username read-only */}
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Current Username</Label>
            <input
              disabled
              value={profile?.full_name ?? "—"}
              className={inputClass + " cursor-not-allowed opacity-40"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">New Username</Label>
              <input
                className={inputClass}
                placeholder="Enter new username"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">Confirm New Username</Label>
              <input
                className={inputClass}
                placeholder="Re-enter new username"
                value={confirmUsername}
                onChange={e => setConfirmUsername(e.target.value)}
              />
            </div>
          </div>

          {usernameError && <ErrorBanner message={usernameError} />}

          <div className="pt-1 flex justify-end">
            <Button
              onClick={handleChangeUsername}
              disabled={isSavingUsername}
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white border-none"
            >
              {isSavingUsername ? "Saving..." : "Update Username"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Change Password ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordSuccess && <SuccessBanner message={passwordSuccess} onDismiss={() => setPasswordSuccess("")} />}

          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent(v => !v)}
            placeholder="Enter current password"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(v => !v)}
              placeholder="Min. 8 characters"
            />
            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              placeholder="Re-enter new password"
            />
          </div>

          {/* Password strength */}
          {newPassword.length > 0 && (
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColor[strength] : "bg-white/10"}`} />
              ))}
              <span className="text-xs text-white/40 w-12 flex-shrink-0">{strengthLabel[strength]}</span>
            </div>
          )}

          {passwordError && <ErrorBanner message={passwordError} />}

          <div className="pt-1 flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={isSavingPassword}
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white border-none"
            >
              {isSavingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Notification Preferences ── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Notification Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {notifSuccess && <div className="mb-4"><SuccessBanner message={notifSuccess} onDismiss={() => setNotifSuccess("")} /></div>}

          <div className="divide-y divide-white/10">
            {[
              { key: "newAppointments", label: "New Appointments",   desc: "Get notified when a new appointment is booked"        },
              { key: "jobAssignments",  label: "Job Assignments",    desc: "Get notified when a job is assigned to you"            },
              { key: "lowStock",        label: "Low Stock Alerts",   desc: "Get notified when inventory drops below minimum level" },
              { key: "emailAlerts",     label: "Email Notifications", desc: "Receive alerts via email in addition to in-app"       },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="text-white text-sm font-medium">{n.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{n.desc}</p>
                </div>
                <Switch
                  checked={notifs[n.key as keyof typeof notifs]}
                  onCheckedChange={val => setNotifs(prev => ({ ...prev, [n.key]: val }))}
                />
              </div>
            ))}
          </div>

          <div className="pt-5 border-t border-white/10 mt-4 flex justify-end">
            <Button
              onClick={handleSaveNotifs}
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white border-none flex items-center gap-2"
            >
              <Save className="w-4 h-4" />Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default FrontDeskSettings;