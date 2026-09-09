'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  X, 
  User,
  Square
} from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?status=${tab}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchCustomers();
  }, [tab]);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          due_at: dueDate || undefined,
          customer_id: customerId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create task');
        setSaving(false);
        return;
      }

      setShowAddModal(false);
      setTitle('');
      setDueDate('');
      setCustomerId('');
      fetchTasks();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <span>Tasks &amp; Follow-ups</span>
            </h1>
            <p className="text-xs text-slate-400">
              Never forget to call back a client or order inventory
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setTab('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tab === 'pending'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tab === 'completed'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel text-center text-slate-400 space-y-3">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              {tab === 'pending' ? 'No pending tasks!' : 'No completed tasks.'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tip: Tell AI &ldquo;Create a reminder to restock supplies by Friday&rdquo; to add tasks anytime.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="glass-card p-3.5 rounded-2xl flex items-center justify-between transition-all hover:border-emerald-500/30"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleTask(t.id, t.status)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      t.status === 'completed'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-600 hover:border-emerald-400 text-transparent hover:text-emerald-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div>
                    <p
                      className={`text-sm font-medium ${
                        t.status === 'completed'
                          ? 'line-through text-slate-500'
                          : 'text-white'
                      }`}
                    >
                      {t.title}
                    </p>
                    {t.customers?.name && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Client: {t.customers.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {t.due_at && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(t.due_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Task Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <span>Create New Task</span>
              </h2>

              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Task Title / Reminder *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Call Rahul regarding payment"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Related Customer (Optional)
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- None --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Create Task</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
