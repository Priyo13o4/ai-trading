import React from 'react';
import { Bot } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-slate-700 bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Left Side: Logo and Copyright */}
          <div className="text-center sm:text-left">
            <a href="/" className="flex items-center justify-start gap-2 font-bold text-lg text-slate-200 mb-2">
              <Bot className="w-6 h-6 text-primary" />
              <span>Signal AI</span>
            </a>
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Signal AI. All rights reserved.</p>
          </div>

          {/* Right Side: Links */}
          <div className="flex items-center gap-6 text-sm text-slate-300">
            <a href="#privacy" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-primary transition-colors">Terms</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
        <div className="text-center mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-gray-500">Trading involves substantial risk and is not for every investor.</p>
        </div>
      </div>
    </footer>
  );
};
