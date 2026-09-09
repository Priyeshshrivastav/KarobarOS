'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  Receipt, 
  CheckSquare, 
  Calendar 
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'AI Assistant', href: '/assistant', icon: Sparkles, isPrimary: true },
    { name: 'Sales', href: '/sales', icon: Receipt },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0c1222]/90 backdrop-blur-lg border-t border-slate-800/80 safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative -top-4 flex flex-col items-center group"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform">
                  <div className="w-full h-full rounded-full bg-[#0c1222] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-emerald-400 mt-1">AI Assistant</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
