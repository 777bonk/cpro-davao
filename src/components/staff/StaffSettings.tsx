import { useState } from "react";
import { User, Lock, Eye, EyeOff, X, Save, CheckCircle, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Label } from "../dashboard-ui/label";
import { Switch } from "../dashboard-ui/switch";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

const inputClass = "w-full px-4 h-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors text-sm";

function SuccessBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5">
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-emerald-400/60 hover:text-emerald-400"><X className="w-3.5 h-3.5" /></button>
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

function PasswordInput({ label, value, onChange, show, onToggle, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/70 text-sm">{label}</Label>
      <div className="relative">
        <input type={show ? "text" : "password"} placeholder={placeholder ?? "••••••••"}
          className={inputClass + " pr-11"} value={value} onChange={e => onChange(e.target.value)} />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function StaffSettings() {
  const { profile } = useAuth();

  const [newUsername,      setNewUsername]      = useState("");
  const [confirmUsername,  setConfirmUsername]  = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameSuccess,  setUsernameSuccess]  = useState("");
  const [usernameError,    setUsernameError]    = useState("");

  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showCurrent,      setShowCurrent]      = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess,  setPasswordSuccess]  = useState("");
  const [passwordError,    setPasswordError]    = useState("");

  const [notifs, setNotifs] = useState({ jobAssigned: true, statusUpdates: true, emailAlerts: false });
  const [notifSuccess, setNotifSuccess] = useState("");

  const showSuccess = (setter: (s: string) => void, msg: string) => {
    setter(msg); setTimeout(() => setter(""), 3500);
  };

  const handleChangeUsername = async () => {
    setUsernameError("");
    if (!newUsername.trim())              { setUsernameError("New username cannot be empty.");   return; }
    if (newUsername !== confirmUsername)  { setUsernameError("Usernames do not match.");         return; }
    setIsSavingUsername(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: newUsername.trim() }).eq("id", profile?.id ?? "");
      if (error) throw error;
      setNewUsername(""); setConfirmUsername("");
      showSuccess(setUsernameSuccess, "Username updated successfully.");
    } catch (e: any) {
      setUsernameError(e?.message ?? "Failed to update username.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword)       { setPasswordError("Please enter your current password."); return; }
    if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    setIsSavingPassword(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No user email found.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (signInError) { setPasswordError("Current password is incorrect."); return; }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showSuccess(setPasswordSuccess, "Password updated successfully.");
    } catch (e: any) {
      setPasswordError(e?.message ?? "Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const strength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 10 ? 2 : 3;
  const strengthColor = ["", "bg-red-500", "bg-amber-400", "bg-emerald-500"];
  const strengthLabel = ["", "Weak", "Fair", "Strong"];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-white text-3xl font-bold mb-1">Settings</h1>
        <p className="text-white/60 text-sm">Manage your account credentials</p>
      </div>

      {/* Account overview */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Account Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Full Name", value: profile?.full_name ?? "—" },
            { label: "Email",     value: profile?.email     ?? "—" },
            { label: "Role",      value: profile?.role      ?? "Staff" },
          ].map(r => (
            <div key={r.label} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/50 text-xs">{r.label}</p>
              <p className="text-white text-sm font-medium mt-0.5">{r.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Change username */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Change Username</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {usernameSuccess && <SuccessBanner message={usernameSuccess} onDismiss={() => setUsernameSuccess("")} />}
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Current Username</Label>
            <input disabled value={profile?.full_name ?? "—"} className={inputClass + " opacity-40 cursor-not-allowed"} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">New Username</Label>
              <input className={inputClass} placeholder="Enter new username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">Confirm Username</Label>
              <input className={inputClass} placeholder="Re-enter username" value={confirmUsername} onChange={e => setConfirmUsername(e.target.value)} />
            </div>
          </div>
          {usernameError && <ErrorBanner message={usernameError} />}
          <div className="flex justify-end">
            <Button onClick={handleChangeUsername} disabled={isSavingUsername} className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white border-none">
              {isSavingUsername ? "Saving..." : "Update Username"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordSuccess && <SuccessBanner message={passwordSuccess} onDismiss={() => setPasswordSuccess("")} />}
          <PasswordInput label="Current Password" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} placeholder="Enter current password" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordInput label="New Password"     value={newPassword}     onChange={setNewPassword}     show={showNew}     onToggle={() => setShowNew(v => !v)}     placeholder="Min. 8 characters" />
            <PasswordInput label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} placeholder="Re-enter password" />
          </div>
          {newPassword.length > 0 && (
            <div className="flex items-center gap-2">
              {[1,2,3].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor[strength] : "bg-white/10"}`} />)}
              <span className="text-xs text-white/40 w-12 flex-shrink-0">{strengthLabel[strength]}</span>
            </div>
          )}
          {passwordError && <ErrorBanner message={passwordError} />}
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={isSavingPassword} className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white border-none">
              {isSavingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {notifSuccess && <div className="mb-4"><SuccessBanner message={notifSuccess} onDismiss={() => setNotifSuccess("")} /></div>}
          <div className="divide-y divide-white/10">
            {[
              { key: "jobAssigned",   label: "Job Assigned",    desc: "Notify when a new job is assigned to me"   },
              { key: "statusUpdates", label: "Status Updates",  desc: "Notify when my job status changes"         },
              { key: "emailAlerts",   label: "Email Alerts",    desc: "Receive job alerts via email"              },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="text-white text-sm font-medium">{n.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{n.desc}</p>
                </div>
                <Switch checked={notifs[n.key as keyof typeof notifs]} onCheckedChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
              </div>
            ))}
          </div>
          <div className="pt-5 border-t border-white/10 mt-4 flex justify-end">
            <Button onClick={() => showSuccess(setNotifSuccess, "Notification preferences saved.")} className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#c41559] text-white border-none flex items-center gap-2">
              <Save className="w-4 h-4" />Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StaffSettings;