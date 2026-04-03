import { Laptop, RefreshCw, LogOut, Trash2, MapPin, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AuthActiveSession } from '@/services/api';

interface ActiveDevicesSectionProps {
  sessions: AuthActiveSession[];
  loading: boolean;
  error: string | null;
  revokingSessionSid: string | null;
  onRefresh: () => void;
  onSignOut: (sid: string, isCurrent: boolean) => void;
  onResetAll: () => void;
}

const glassCard = 'lumina-card p-6 shadow-2xl transition-all';

export function ActiveDevicesSection({
  sessions,
  loading,
  error,
  revokingSessionSid,
  onRefresh,
  onSignOut,
  onResetAll
}: ActiveDevicesSectionProps) {
  const formatSessionTime = (value?: number | null) => {
    if (!value) return 'Unknown';
    const d = new Date(value * 1000);
    if (Number.isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleString();
  };

  return (
    <section className={glassCard}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Laptop className="h-5 w-5 text-[#E2B485]" />
          <h3 className="text-lg font-bold text-slate-100">Active Devices</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
            disabled={loading}
          >
            <RefreshCw className={cn("mr-1 h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onResetAll}
            className="border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-[#E2B485]/10 hover:text-[#E2B485] hover:border-[#E2B485]/30"
            disabled={loading}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Reset All
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.length === 0 && !loading ? (
            <div className="py-8 text-center text-slate-500">No active sessions found.</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.sid}
                className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-400">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-100">
                        {session.user_agent?.summary || 'Unknown Device'}
                      </p>
                      {session.current && (
                        <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">Current</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatSessionTime(session.last_activity)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.ip || 'Unknown IP'}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:bg-rose-500/10 hover:text-rose-500"
                  onClick={() => onSignOut(session.sid, session.current || false)}
                  disabled={revokingSessionSid === session.sid}
                >
                  {revokingSessionSid === session.sid ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
