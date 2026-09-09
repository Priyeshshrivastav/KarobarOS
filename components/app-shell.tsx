'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import Link from 'next/link';
import { Sparkles, Bell } from 'lucide-react';

export function AppShell({
  children,
  businessName = 'My Karobar',
}: {
  children: ReactNode;
  businessName?: string;
}) {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar businessName={businessName} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-[#0c1222]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-emerald-500/30">
              K
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">
                Karobar<span className="text-emerald-400">OS</span>
              </span>
              <p className="text-[11px] text-slate-400 truncate max-w-[150px] leading-tight">
                {businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/assistant"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Chat</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}
