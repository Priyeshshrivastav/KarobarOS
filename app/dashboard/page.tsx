'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { VoiceInput } from '@/components/voice-input';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  CheckSquare, 
  Users, 
  ArrowUpRight, 
  Plus, 
  Send,
  Loader2,
  Clock,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [sendingQuick, setSendingQuick] = useState(false);
  const router = useRouter();

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    // Redirect to AI Assistant with query pre-filled
    router.push(`/assistant?q=${encodeURIComponent(quickInput.trim())}`);
  };

  const handleVoiceTranscript = (text: string) => {
    setQuickInput(text);
    // Auto redirect to assistant with transcript
    setTimeout(() => {
      router.push(`/assistant?q=${encodeURIComponent(text)}`);
    }, 400);
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const m = data?.metrics || {
    todayRevenue: 0,
    todaySalesCount: 0,
    pendingUdhaar: 0,
    pendingPaymentsCount: 0,
    todayAppointmentsCount: 0,
    pendingTasksCount: 0,
    totalCustomers: 0,
  };

  return (
    <AppShell businessName={data?.business?.name || 'KarobarOS'}>
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading your business metrics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Quick Voice & AI Input Bar (Android / Mobile Hero Feature) */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-emerald-500/30 shadow-xl relative overflow-hidden bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Autonomous AI Assistant
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-3">
              Boliye ya type kijiye — &ldquo;Rahul ko customer add karo&rdquo;, &ldquo;₹800 haircut sale add karo&rdquo;, &ldquo;Kal 3 baje appointment cancel kardo&rdquo;
            </p>

            <form onSubmit={handleQuickSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Ask KarobarOS in English, Hindi, or Hinglish..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                />
              </div>

              {/* Voice Mic Button */}
              <VoiceInput onTranscript={handleVoiceTranscript} />

              <button
                type="submit"
                disabled={!quickInput.trim()}
                className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Today's Sales */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Today&apos;s Sales</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                ₹{m.todayRevenue.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1">
                {m.todaySalesCount} transaction{m.todaySalesCount === 1 ? '' : 's'} today
              </p>
            </div>

            {/* Pending Udhaar / Payments */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Pending Udhaar</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-400">
                ₹{m.pendingUdhaar.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {m.pendingPaymentsCount} unpaid sale{m.pendingPaymentsCount === 1 ? '' : 's'}
              </p>
            </div>

            {/* Today's Appointments */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Appointments</span>
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {m.todayAppointmentsCount}
              </div>
              <p className="text-[11px] text-teal-400/80 mt-1">
                Scheduled for today
              </p>
            </div>

            {/* Total Customers */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Total Customers</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {m.totalCustomers}
              </div>
              <p className="text-[11px] text-indigo-400/80 mt-1">
                Active customer ledger
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/sales?new=true"
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center gap-2.5 text-xs font-semibold text-slate-200"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <span>Record Sale</span>
            </Link>

            <Link
              href="/customers?new=true"
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center gap-2.5 text-xs font-semibold text-slate-200"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span>Add Customer</span>
            </Link>

            <Link
              href="/appointments?new=true"
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center gap-2.5 text-xs font-semibold text-slate-200"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span>Book Slot</span>
            </Link>

            <Link
              href="/tasks?new=true"
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center gap-2.5 text-xs font-semibold text-slate-200"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span>Add Task</span>
            </Link>
          </div>

          {/* Two Column Layout: Today's Appointments & Pending Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Appointments */}
            <div className="glass-panel p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Today&apos;s Appointments</h3>
                </div>
                <Link
                  href="/appointments"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {data?.todayAppointments?.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-slate-400 text-xs">
                  <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p>No appointments booked for today.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Try typing: &ldquo;Rahul ka kal 11 baje appointment book karo&rdquo; in AI chat.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data?.todayAppointments?.map((appt: any) => (
                    <div
                      key={appt.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{appt.title}</p>
                        <p className="text-xs text-slate-400">
                          {appt.customers?.name || 'Customer'} &middot;{' '}
                          <span className="text-emerald-400">
                            {new Date(appt.starts_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium capitalize">
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Tasks & Reminders */}
            <div className="glass-panel p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Pending Tasks &amp; Reminders</h3>
                </div>
                <Link
                  href="/tasks"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {data?.pendingTasks?.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-slate-400 text-xs">
                  <CheckSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p>All tasks are completed! No pending items.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Try typing: &ldquo;Call Priya regarding bridal booking tomorrow&rdquo;
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data?.pendingTasks?.map((task: any) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between group"
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="mt-0.5 w-4 h-4 rounded border border-slate-600 hover:border-emerald-400 flex items-center justify-center transition-colors"
                          title="Mark complete"
                        >
                          <span className="w-2 h-2 rounded-sm bg-transparent group-hover:bg-emerald-400 transition-colors" />
                        </button>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{task.title}</p>
                          {task.customers?.name && (
                            <p className="text-[10px] text-slate-400">
                              Customer: {task.customers.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {task.due_at && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.due_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
