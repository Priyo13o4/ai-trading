import React from 'react';
import { Bot } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-center md:justify-between">
          <div className="text-center md:text-left">
            <a href="/" className="mb-2 inline-flex items-center gap-2 text-lg font-bold text-slate-200">
              <Bot className="h-6 w-6 text-primary" />
              <span>PipFactor</span>
            </a>
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} PipFactor. All rights reserved.
            </p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <a href="#privacy" className="transition-colors hover:text-primary">Privacy</a>
            <a href="#terms" className="transition-colors hover:text-primary">Terms</a>
            <a href="#contact" className="transition-colors hover:text-primary">Contact</a>
          </nav>
        </div>
        <div className="mt-8 w-full border-t border-slate-800 pt-6 text-center">
          <p className="text-xs text-slate-500">
            Trading involves substantial risk and is not for every investor.
          </p>
        </div>
      </div>
    </footer>
  );
};
