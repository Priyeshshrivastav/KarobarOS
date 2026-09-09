'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  Receipt, 
  Calendar, 
  CheckSquare, 
  Settings,
  Store,
  LogOut
} from 'lucide-react';

export function Sidebar({ businessName }: { businessName?: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Assistant', href: '/assistant', icon: Sparkles, badge: 'Hinglish AI' },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Sales & Khata', href: '/sales', icon: Receipt },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Tasks & Follow-ups', href: '/tasks', icon: CheckSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#0c1222] border-r border-slate-800/80 p-4 z-40">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-emerald-600/30">
          K
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-1.5">
            Karobar<span className="text-emerald-400">OS</span>
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Store className="w-3 h-3 text-emerald-400" />
            <span className="truncate max-w-[130px]">{businessName || 'My Business'}</span>
          </p>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Quick Info */}
      <div className="pt-4 border-t border-slate-800">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-2">
          <p className="text-xs text-slate-400">Owner Access</p>
          <p className="text-xs font-medium text-emerald-400 truncate">Online · Active Tenant</p>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Account / Logout</span>
        </Link>
      </div>
    </aside>
  );
}
