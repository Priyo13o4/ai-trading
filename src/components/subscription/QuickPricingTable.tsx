import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPlanTier } from '@/components/subscription/planCatalog';

interface PlanFeature {
  name: string;
  starter: boolean;
  professional: boolean;
  elite: boolean;
}

const FEATURES: PlanFeature[] = [
  { name: 'AI-powered news analysis', starter: true, professional: true, elite: true },
  { name: 'Trading pairs access', starter: true, professional: true, elite: true },
  { name: 'Email notifications', starter: true, professional: true, elite: true },
  { name: 'Mobile app access', starter: true, professional: true, elite: true },
  { name: 'Advanced analytics dashboard', starter: false, professional: true, elite: true },
  { name: 'API automation access', starter: false, professional: true, elite: true },
  { name: 'Priority support', starter: false, professional: false, elite: true },
  { name: 'All supported trading pairs', starter: false, professional: false, elite: true },
];

const plans = [
  { key: 'starter', price: '$5/mo', buttonLabel: 'Choose Core', btnClass: 'sa-btn-neutral', popular: false },
  {
    key: 'professional',
    price: '$8/mo',
    buttonLabel: 'Choose Professional',
    btnClass: 'sa-btn-neutral',
    popular: false,
  },
  { key: 'elite', price: '$12/mo', buttonLabel: 'Choose Elite', btnClass: 'sa-btn-accent', popular: true },
] as const;

export const QuickPricingTable = () => {
  const navigate = useNavigate();

  return (
    <div className="sa-scope w-full overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-950/40">
      <table className="w-full min-w-[820px] border-collapse text-sm text-slate-200">
        <thead>
          <tr className="border-b border-slate-700/60">
            <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide sa-muted">Feature</th>
            {plans.map((plan) => {
              const tier = getPlanTier(plan.key);
              return (
                <th key={plan.key} className="p-4 text-center">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <span
                      className={
                        plan.key === 'elite' ? 'sa-accent text-lg font-bold' : 'text-lg font-bold text-white'
                      }
                    >
                      {tier.displayName}
                    </span>
                    {plan.popular && <Badge className="sa-badge-accent">Popular</Badge>}
                  </div>
                  <div className="mb-3 text-xs sa-muted">{plan.price}</div>
                  <Button size="sm" className={plan.btnClass} onClick={() => navigate('/pricing')}>
                    {plan.buttonLabel}
                  </Button>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {FEATURES.map((feature) => (
            <tr key={feature.name} className="border-b border-slate-800/70 hover:bg-slate-900/50">
              <td className="p-4 text-slate-200">{feature.name}</td>
              <td className="p-4 text-center">
                {feature.starter ? (
                  <Check className="mx-auto h-5 w-5 text-emerald-300" />
                ) : (
                  <X className="mx-auto h-5 w-5 text-slate-500" />
                )}
              </td>
              <td className="p-4 text-center">
                {feature.professional ? (
                  <Check className="mx-auto h-5 w-5 text-emerald-300" />
                ) : (
                  <X className="mx-auto h-5 w-5 text-slate-500" />
                )}
              </td>
              <td className="p-4 text-center">
                {feature.elite ? (
                  <Check className="mx-auto h-5 w-5 sa-accent" />
                ) : (
                  <X className="mx-auto h-5 w-5 text-slate-500" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuickPricingTable;
