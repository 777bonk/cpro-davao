import { useState } from "react";
import { User, Lock, Eye, EyeOff, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../dashboard-ui/card";
import { Button } from "../dashboard-ui/button";
import { Label } from "../dashboard-ui/label";

export function CustomerSettings() {
  // ── Username state ──────────────────────────────────────────────
  const [username, setUsername]           = useState("juan.delacruz");
  const [newUsername, setNewUsername]     = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameSuccess, setUsernameSuccess]   = useState(false);

  // ── Password state ──────────────────────────────────────────────
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess]   = useState(false);

  // ── Error state ─────────────────────────────────────────────────
  const [usernameError, setUsernameError]   = useState("");
  const [passwordError, setPasswordError]   = useState("");

  // ── Handlers ────────────────────────────────────────────────────
  const handleChangeUsername = async () => {
    setUsernameError("");
    setUsernameSuccess(false);

    if (!newUsername.trim()) {
      setUsernameError("New username cannot be empty."); return;
    }
    if (newUsername.trim() === username) {
      setUsernameError("New username must be different from your current one."); return;
    }
    if (newUsername !== confirmUsername) {
      setUsernameError("Usernames do not match."); return;
    }

    setIsSavingUsername(true);
    // TODO: replace with real API call
    await new Promise(r => setTimeout(r, 800));
    setUsername(newUsername.trim());
    setNewUsername("");
    setConfirmUsername("");
    setIsSavingUsername(false);
    setUsernameSuccess(true);
    setTimeout(() => setUsernameSuccess(false), 3000);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Please enter your current password."); return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters."); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match."); return;
    }

    setIsSavingPassword(true);
    // TODO: replace with real API call (e.g. supabase.auth.updateUser)
    await new Promise(r => setTimeout(r, 800));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSavingPassword(false);
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  // ── Reusable password input ──────────────────────────────────────
  const PasswordInput = ({
    label, value, onChange, show, onToggle, placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder?: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-white/70 text-sm">{label}</Label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••••"}
          className="w-full px-4 pr-11 h-10 border border-white/10 bg-white/5 rounded-md text-white placeholder:text-white/20 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-white text-3xl font-bold mb-2">Settings</h1>
        <p className="text-white/60">Manage your account credentials</p>
      </div>

      {/* ── Change Username ─────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Change Username</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Current username (read-only) */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">Current Username</Label>
            <input
              type="text"
              disabled
              value={username}
              className="w-full px-4 h-10 border border-white/10 bg-white/[0.03] rounded-md text-white/40 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">New Username</Label>
              <input
                type="text"
                placeholder="Enter new username"
                className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md text-white placeholder:text-white/20 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Confirm New Username</Label>
              <input
                type="text"
                placeholder="Re-enter new username"
                className="w-full px-4 h-10 border border-white/10 bg-white/5 rounded-md text-white placeholder:text-white/20 focus:outline-none focus:border-[#E41E6A] focus:ring-1 focus:ring-[#E41E6A]/30 transition-colors"
                value={confirmUsername}
                onChange={e => setConfirmUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Error */}
          {usernameError && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <X className="w-4 h-4 flex-shrink-0" />
              {usernameError}
            </div>
          )}

          {/* Success */}
          {usernameSuccess && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              ✓ Username updated successfully.
            </div>
          )}

          <div className="pt-1">
            <Button
              onClick={handleChangeUsername}
              disabled={isSavingUsername}
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white border-none"
            >
              {isSavingUsername ? "Saving..." : "Update Username"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Change Password ─────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#E41E6A]" />
            <CardTitle className="text-white">Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent(v => !v)}
            placeholder="Enter current password"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Password strength hint */}
          {newPassword.length > 0 && (
            <div className="flex items-center gap-2">
              {[1,2,3,4].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    newPassword.length >= i * 3
                      ? newPassword.length >= 12 ? "bg-emerald-500"
                        : newPassword.length >= 8  ? "bg-amber-400"
                        : "bg-red-500"
                      : "bg-white/10"
                  }`}
                />
              ))}
              <span className="text-xs text-white/40 ml-1 w-12">
                {newPassword.length < 8 ? "Weak" : newPassword.length < 12 ? "Fair" : "Strong"}
              </span>
            </div>
          )}

          {/* Error */}
          {passwordError && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <X className="w-4 h-4 flex-shrink-0" />
              {passwordError}
            </div>
          )}

          {/* Success */}
          {passwordSuccess && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              ✓ Password updated successfully.
            </div>
          )}

          <div className="pt-1">
            <Button
              onClick={handleChangePassword}
              disabled={isSavingPassword}
              className="bg-gradient-to-r from-[#E41E6A] to-pink-600 hover:from-[#E41E6A]/90 hover:to-pink-600/90 text-white border-none"
            >
              {isSavingPassword ? "Saving..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}