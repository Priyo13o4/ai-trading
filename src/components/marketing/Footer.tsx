import React from 'react';
import { Link } from 'react-router-dom';
import { FaTelegramPlane } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Newspaper } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#111315] border-t border-[#C8935A]/10 text-[#9CA3AF] relative z-10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
          {/* Logo & Copyright */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-[#E2B485] hover:text-[#C8935A] transition-colors">
              <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center">
                <img src="https://cdn.pipfactor.com/website-assets/pipfactor.svg" alt="PipFactor" className="h-full w-full object-contain brightness-0 invert opacity-80" style={{ filter: 'brightness(0) saturate(100%) invert(86%) sepia(21%) saturate(940%) hue-rotate(338deg) brightness(88%) contrast(92%)' }} />
              </div>
              <span>PipFactor</span>
            </Link>
            <p className="text-sm text-[#9CA3AF]">
              &copy; {new Date().getFullYear()} PipFactor. All rights reserved.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-[#E2B485] transition-colors">Home</Link></li>
              <li><Link to="/pricing" className="hover:text-[#E2B485] transition-colors">Pricing</Link></li>
              <li><Link to="/signal" className="hover:text-[#E2B485] transition-colors">Signals</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-[#E2B485] transition-colors">About</Link></li>
              <li><Link to="/blog" className="hover:text-[#E2B485] transition-colors">Blog</Link></li>
              <li><a href="mailto:support@pipfactor.com" className="hover:text-[#E2B485] transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="https://t.me/PipFactorCommunity" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#E2B485] transition-colors"><FaTelegramPlane className="h-4 w-4" /> Telegram</a></li>
              <li><a href="https://x.com/PipFactorAI" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#E2B485] transition-colors"><FaXTwitter className="h-4 w-4" /> X (Twitter)</a></li>
              <li><Link to="/blog" className="flex items-center gap-2 hover:text-[#E2B485] transition-colors"><Newspaper className="h-4 w-4" /> Blog & Insights</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/disclaimer" className="hover:text-[#E2B485] transition-colors">Risk Disclaimer</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-[#E2B485] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-[#E2B485] transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-[#E2B485] transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 w-full border-t border-[#C8935A]/10 pt-6 text-center">
          <p className="text-xs text-[#9CA3AF]/60">
            © {new Date().getFullYear()} PipFactor. Built in India. Signals are for informational purposes only — not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
};

