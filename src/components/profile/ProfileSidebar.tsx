import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSidebarProps {
  activeSection: 'account' | 'referral';
  setActiveSection: (section: 'account' | 'referral') => void;
}

export function ProfileSidebar({ activeSection, setActiveSection }: ProfileSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-32 lg:w-[229px]">
      <div className="flex flex-col gap-5">
        <button 
          onClick={() => setActiveSection('account')}
          className={cn(
            "group relative flex items-center justify-between text-left font-black tracking-tight transition-all duration-300 outline-none",
            activeSection === 'account' ? "text-2xl text-white sm:text-3xl" : "text-base text-slate-500 hover:text-slate-300"
          )}
        >
          <span>Account</span>
          <ChevronRight className={cn("h-5 w-5 text-[#E2B485] transition-all duration-300", activeSection === 'account' ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0")} />
        </button>
        
        <button 
          onClick={() => setActiveSection('referral')}
          className={cn(
            "group relative flex items-center justify-between text-left font-black tracking-tight transition-all duration-300 outline-none",
            activeSection === 'referral' ? "text-2xl text-white sm:text-3xl" : "text-base text-slate-500 hover:text-slate-300"
          )}
        >
          <span>Referral Program</span>
          <ChevronRight className={cn("h-5 w-5 text-[#E2B485] transition-all duration-300", activeSection === 'referral' ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0")} />
        </button>
      </div>
    </aside>
  );
}
