/**
 * Quick Pricing Table Component
 * Compact comparison table for embedding in other pages
 */

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PlanFeature {
  name: string;
  free: boolean;
  basic: boolean;
  premium: boolean;
}

export const QuickPricingTable = () => {
  const navigate = useNavigate();

  const features: PlanFeature[] = [
    { name: '3-day full access trial', free: true, basic: false, premium: false },
    { name: 'AI news analysis', free: true, basic: true, premium: true },
    { name: 'Trading pairs', free: true, basic: false, premium: true },
    { name: 'Email notifications', free: true, basic: true, premium: true },
    { name: 'Mobile app access', free: false, basic: true, premium: true },
    { name: 'All 5 trading pairs', free: false, basic: false, premium: true },
    { name: 'Advanced analytics', free: false, basic: false, premium: true },
    { name: 'Priority support', free: false, basic: false, premium: true },
    { name: 'API access', free: false, basic: false, premium: true },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left p-4 text-slate-400 font-semibold">Features</th>
            <th className="p-4 text-center">
              <div className="text-white font-bold text-lg mb-1">Free Trial</div>
              <div className="text-slate-400 text-sm mb-2">$0</div>
              <Button 
                size="sm" 
                onClick={() => navigate('/pricing')}
                className="bg-slate-700 hover:bg-slate-600 text-white"
              >
                Start Trial
              </Button>
            </th>
            <th className="p-4 text-center">
              <div className="text-white font-bold text-lg mb-1">Basic</div>
              <div className="text-slate-400 text-sm mb-2">$4.99/mo</div>
              <Button 
                size="sm" 
                onClick={() => navigate('/pricing')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </Button>
            </th>
            <th className="p-4 text-center bg-gradient-to-br from-[#D4AF37]/10 to-transparent">
              <div className="text-[#D4AF37] font-bold text-lg mb-1">Premium</div>
              <div className="text-slate-400 text-sm mb-2">$14.99/mo</div>
              <Button 
                size="sm" 
                onClick={() => navigate('/pricing')}
                className="bg-[#D4AF37] hover:bg-[#E5C158] text-slate-900"
              >
                Upgrade
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr 
              key={index} 
              className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
            >
              <td className="p-4 text-slate-300">{feature.name}</td>
              <td className="p-4 text-center">
                {feature.free ? (
                  <Check className="h-5 w-5 text-green-400 mx-auto" />
                ) : (
                  <X className="h-5 w-5 text-slate-600 mx-auto" />
                )}
              </td>
              <td className="p-4 text-center">
                {feature.basic ? (
                  <Check className="h-5 w-5 text-green-400 mx-auto" />
                ) : (
                  <X className="h-5 w-5 text-slate-600 mx-auto" />
                )}
              </td>
              <td className="p-4 text-center bg-gradient-to-br from-[#D4AF37]/5 to-transparent">
                {feature.premium ? (
                  <Check className="h-5 w-5 text-[#D4AF37] mx-auto" />
                ) : (
                  <X className="h-5 w-5 text-slate-600 mx-auto" />
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
