import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const TrialBanner = () => {
  const { subscription, subscriptionStatus, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || subscriptionStatus !== 'trial' || typeof subscription?.days_remaining !== 'number') {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-200 px-4 py-3 text-sm flex justify-center items-center gap-4 z-50 relative">
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
