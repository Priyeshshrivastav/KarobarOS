'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { 
  Settings, 
  Store, 
  Clock, 
  MapPin, 
  Coins, 
  ShieldCheck, 
  Smartphone, 
  Database,
  ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBusiness(d.business);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell businessName={business?.name}>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Business Settings</span>
          </h1>
          <p className="text-xs text-slate-400">
            Configure your business profile, operating hours, and Android packaging
          </p>
        </div>

        {/* Business Profile */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Business Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Business Name</span>
              <p className="font-semibold text-white mt-0.5">{business?.name || 'My Karobar'}</p>
            </div>
            <div>
              <span className="text-slate-400">Currency</span>
              <p className="font-semibold text-white mt-0.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>INR (₹ - Indian Rupee)</span>
              </p>
            </div>
            <div>
              <span className="text-slate-400">Timezone</span>
              <p className="font-semibold text-white mt-0.5">Asia/Kolkata (IST)</p>
            </div>
            <div>
              <span className="text-slate-400">Standard Working Hours</span>
              <p className="font-semibold text-white mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>09:00 AM &ndash; 09:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Android App Package Information */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Android App &amp; APK Packaging</span>
            </h3>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-mono">
              Capacitor v6
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            KarobarOS is built with an Android-first architecture. It features full support for native Android builds via Capacitor:
          </p>

          <div className="bg-slate-900/90 rounded-xl p-3 text-xs font-mono text-emerald-300 space-y-1.5 border border-slate-800">
            <p>App ID: <span className="text-white">com.karobaros.app</span></p>
            <p>Build Command: <span className="text-white">npm run cap:build</span></p>
            <p>Open Android Studio: <span className="text-white">npx cap open android</span></p>
          </div>

          <p className="text-[11px] text-slate-400">
            Refer to <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">ANDROID_BUILD_GUIDE.md</code> in the repository root for step-by-step instructions on generating the production APK.
          </p>
        </div>

        {/* Security & Database Status */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Database &amp; Multi-Tenant Isolation</span>
          </h3>

          <div className="space-y-2 text-xs text-slate-300">
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Row Level Security (RLS) enabled across all 13 tenant tables</span>
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Destructive AI tool executions gated by confirmation cards</span>
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full audit logging active in <code className="text-emerald-400">audit_logs</code> table</span>
            </p>
          </div>

          <div className="pt-2">
            <a
              href="https://supabase.com/dashboard/project/nccwxblawpovrkkevubj/sql"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-medium"
            >
              <span>Open Supabase SQL Editor to verify migration</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
