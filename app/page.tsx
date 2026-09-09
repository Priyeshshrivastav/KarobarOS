import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  Users, 
  Receipt, 
  Calendar, 
  ShieldCheck, 
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-emerald-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-teal-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <header className="relative z-10 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-600/30">
            K
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            Karobar<span className="text-emerald-400">OS</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            Open App
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-16 pb-20 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Made for Indian SMBs &middot; Hindi &bull; Hinglish &bull; English</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 leading-tight mb-6">
          The AI Operating System for Your Business
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed mb-8">
          Aap boliye, KarobarOS sambhal lega. Manage customers, record sales, book appointments, and track udhaar by simply talking or typing to AI.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/25 hover:opacity-95 transition-all active:scale-95"
          >
            <span>Launch KarobarOS Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/assistant"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Try Hinglish AI Demo</span>
          </Link>
        </div>

        {/* Indian SMB Voice Interactive Showcase Mock */}
        <div className="w-full max-w-3xl glass-panel rounded-2xl p-6 sm:p-8 text-left shadow-2xl border border-slate-700/60 relative overflow-hidden mb-16">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-400 ml-2 font-mono">KarobarOS Voice Assistant</span>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> Android App Ready
            </span>
          </div>

          <div className="space-y-4">
            {/* User Speech */}
            <div className="flex justify-end">
              <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-medium max-w-md shadow-md">
                &ldquo;Rahul Sharma ka 500 rupay ka haircut add kardo aur kal subah 11 baje appointment book kardo&rdquo;
              </div>
            </div>

            {/* AI Action Execution */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl rounded-tl-sm text-sm text-slate-200 max-w-lg space-y-2">
                <p className="font-semibold text-emerald-400">
                  Haanji! Dono kaam ho gaye:
                </p>
                <div className="bg-slate-900/90 rounded-lg p-2.5 space-y-1.5 text-xs text-slate-300 font-mono">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sale Recorded: ₹500 (Haircut) for Rahul</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Appointment Booked: Tomorrow 11:00 AM</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Customer ledger and appointments dashboard have been updated.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="glass-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Zero UI Learning Curve</h3>
            <p className="text-sm text-slate-400">
              Speak or type in Hinglish or Hindi. The AI executes tools directly on your database.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Sales & Udhaar Khata</h3>
            <p className="text-sm text-slate-400">
              Record sales instantly, track pending payments, and send courteous payment reminders.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Safe Confirmation Cards</h3>
            <p className="text-sm text-slate-400">
              Destructive actions like cancelling bookings or sending SMS require your explicit confirmation tap.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} KarobarOS &middot; AI Operating System for Indian SMBs &middot; Android &amp; Web Ready
      </footer>
    </div>
  );
}
