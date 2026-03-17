import React from 'react';
import { Bot } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#111315] border-t border-[#C8935A]/10 text-[#9CA3AF]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-center md:justify-between">
          <div className="text-center md:text-left">
            <a href="/" className="mb-2 inline-flex items-center gap-2 text-lg font-bold text-[#E2B485] hover:text-[#C8935A] transition-colors">
              <img src="/pipfactor.svg" alt="PipFactor" className="h-10 w-10 brightness-0 invert opacity-80" style={{ filter: 'brightness(0) saturate(100%) invert(86%) sepia(21%) saturate(940%) hue-rotate(338deg) brightness(88%) contrast(92%)' }} />
              <span>PipFactor</span>
            </a>
            <p className="text-sm text-[#9CA3AF]">
              &copy; {new Date().getFullYear()} PipFactor. All rights reserved.
            </p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-[#9CA3AF]">
            <a href="#privacy" className="transition-colors hover:text-[#E2B485]">Privacy</a>
            <a href="#terms" className="transition-colors hover:text-[#E2B485]">Terms</a>
            <a href="#contact" className="transition-colors hover:text-[#E2B485]">Contact</a>
          </nav>
        </div>
        <div className="mt-8 w-full border-t border-[#C8935A]/10 pt-6 text-center">
          <p className="text-xs text-[#9CA3AF]/60">
            Trading involves substantial risk and is not for every investor.
          </p>
        </div>
      </div>
    </footer>
  );
};
