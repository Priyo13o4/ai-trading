import { useAuth } from '@/hooks/useAuth';
import { AuthDialogManager } from '@/components/auth/AuthDialogManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut, Crown } from 'lucide-react';
import { toast } from 'sonner';

export function UserProfileCard() {
  const { user, profile, isAuthenticated, signOut, isFreeUser } = useAuth();

  if (!isAuthenticated) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-white font-medium">Guest User</p>
                <p className="text-xs text-slate-400">XAUUSD signals only</p>
              </div>
            </div>
            <AuthDialogManager 
              trigger={
                <Button variant="outline" size="sm" className="border-slate-600 hover:bg-slate-700">
                  Sign In
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <User className="w-8 h-8 text-slate-400" />
              {!isFreeUser && <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />}
            </div>
            <div>
              <p className="text-white font-medium flex items-center gap-2">
                {profile?.full_name || user?.email || 'User'}
                {!isFreeUser && <span className="text-xs bg-yellow-600 px-1.5 py-0.5 rounded text-yellow-100">PRO</span>}
              </p>
              <p className="text-xs text-slate-400">
                {isFreeUser && profile ? (
                  `${profile.free_signals_used}/${profile.free_signals_limit} free signals used today`
                ) : (
                  'Premium access • All pairs'
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
