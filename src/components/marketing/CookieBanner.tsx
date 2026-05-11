import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('cookieConsent');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0e10] border-t border-[#C8935A]/20 p-4 shadow-2xl transform transition-transform duration-500 ease-in-out">
      <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-[#9CA3AF] flex-1">
          <p>
            By continuing to use PipFactor's services, you agree to our use of cookies to enhance your browsing experience, analyze site traffic, and serve targeted advertisements. It is not optional to opt-out if you wish to use our platform. For more details, please review our{' '}
            <a href="/cookie-policy" className="text-[#E2B485] hover:underline font-medium">
              Cookie Policy
            </a>
            .
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3">
          <Button 
            onClick={handleAccept}
            className="bg-[#C8935A] hover:bg-[#E2B485] text-black font-semibold px-6"
          >
            I Agree
          </Button>
          <button 
            onClick={handleAccept} 
            className="text-[#9CA3AF] hover:text-white transition-colors p-2"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
