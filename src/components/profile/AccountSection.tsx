import { useState, useEffect } from 'react';
import { User, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { toSafeUserErrorMessage } from '@/services/api';

const glassCard = 'lumina-card p-6 shadow-2xl transition-all';
const inputStyle = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-100 focus:ring-1 focus:ring-[#E2B485] outline-none';

export function AccountSection() {
  const { 
    user, 
    profile, 
    updateProfile, 
    updatePassword, 
    isLoading: authLoading 
  } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setEditedName(profile.full_name || '');
      setEditedEmail(profile.email || '');
    }
  }, [profile]);

  const memberSinceLabel = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString() 
    : 'Not available';

  const handleProfileUpdate = async () => {
    if (!editedName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setIsLoading(true);
    try {
      await updateProfile(editedName);
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (err) {
      toast.error(toSafeUserErrorMessage(err instanceof Error ? err.message : undefined, undefined, 'Failed to update profile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (err) {
      toast.error(toSafeUserErrorMessage(err instanceof Error ? err.message : undefined, undefined, 'Failed to update password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Details */}
      <section className={glassCard}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-[#E2B485]" />
            <h3 className="text-lg font-bold text-slate-100">Personal Details</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
          >
            {isEditingProfile ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</Label>
            {isEditingProfile ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className={inputStyle}
                placeholder="Your name"
              />
            ) : (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-slate-200">
                {profile?.full_name || 'Not set'}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</Label>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-slate-400">
              {profile?.email || user?.email}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Member Since</Label>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-slate-400">
              {memberSinceLabel}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account ID</Label>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 font-mono text-xs text-slate-500">
              {user?.id?.slice(0, 8)}...
            </div>
          </div>
        </div>

        {isEditingProfile && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleProfileUpdate}
              className="lumina-button px-8"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        )}
      </section>

      {/* Security */}
      <section className={glassCard}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#E2B485]" />
            <h3 className="text-lg font-bold text-slate-100">Security</h3>
          </div>
        </div>

        {isChangingPassword ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputStyle}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputStyle}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputStyle}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => {
                  setIsChangingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                className="lumina-button px-8"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Password
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <p className="text-sm font-medium text-slate-100">Password</p>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              onClick={() => setIsChangingPassword(true)}
            >
              Update
            </Button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-800/40 opacity-40 transition-opacity duration-300 hover:opacity-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Account Termination</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">Permanently delete your account and all associated data.</p>
            <DeleteAccountDialog userEmail={profile?.email || user?.email || ''} />
          </div>
        </div>
      </section>
    </div>
  );
}
