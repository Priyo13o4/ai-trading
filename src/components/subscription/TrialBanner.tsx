import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const TrialBanner = () => {
  const { subscription, subscriptionStatus, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated || subscriptionStatus !== 'trial' || typeof subscription?.days_remaining !== 'number') {
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--beta-banner-offset', '0px');
      }
      return;
    }

    const updateOffset = () => {
      if (typeof document === 'undefined') return;
      const height = containerRef.current?.getBoundingClientRect().height ?? 0;
      const scrollY = window.scrollY || 0;
      const offset = Math.max(height - scrollY, 0);
      document.documentElement.style.setProperty('--beta-banner-offset', `${offset}px`);
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    window.addEventListener('scroll', updateOffset, { passive: true });
    
    return () => {
      window.removeEventListener('resize', updateOffset);
      window.removeEventListener('scroll', updateOffset);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--beta-banner-offset', '0px');
      }
    };
  }, [isAuthenticated, subscriptionStatus, subscription?.days_remaining]);

  if (!isAuthenticated || subscriptionStatus !== 'trial' || typeof subscription?.days_remaining !== 'number') {
    return null;
  }

  return (
    <div ref={containerRef} className="bg-amber-500/10 border-b border-amber-500/20 text-amber-200 px-4 py-3 text-sm flex justify-center items-center gap-4 z-50 relative">
      <span>
        You have <strong>{subscription.days_remaining} day{subscription.days_remaining === 1 ? '' : 's'}</strong> remaining in your free trial.
      </span>
      <button 
        onClick={() => navigate('/pricing')} 
        className="text-amber-500 hover:text-amber-400 font-medium underline underline-offset-2 transition-colors"
      >
        Subscribe Now
      </button>
    </div>
  );
};
