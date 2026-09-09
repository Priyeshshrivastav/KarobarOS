'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Phone, 
  Loader2, 
  X, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filter, setFilter] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments);
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
    fetchAppointments();
    fetchCustomers();
  }, [filter]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          title,
          starts_at: new Date(datetime).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to book slot');
        setSaving(false);
        return;
      }

      setShowAddModal(false);
      setTitle('');
      setCustomerId('');
      setDatetime('');
      fetchAppointments();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (status === 'cancelled' && !confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <span>Appointments &amp; Slots</span>
            </h1>
            <p className="text-xs text-slate-400">
              Schedule bookings without time conflicts and manage cancellations
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          {['upcoming', 'today', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                filter === tab
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading appointments...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel text-center text-slate-400 space-y-3">
            <CalendarIcon className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No appointments found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tip: You can book appointments directly via voice: &ldquo;Priya ka kal 11 baje hair spa book karo&rdquo;.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-emerald-400 border border-slate-700 hover:bg-slate-700"
            >
              Book Slot
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-emerald-500/30"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      appt.status === 'scheduled'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : appt.status === 'completed'
                        ? 'bg-teal-500/10 text-teal-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{appt.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{appt.customers?.name || 'Customer'}</span>
                      {appt.customers?.phone && (
                        <>
                          <span>&middot;</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{appt.customers.phone}</span>
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-emerald-400 font-semibold mt-1">
                      {new Date(appt.starts_at).toLocaleString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                      appt.status === 'scheduled'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : appt.status === 'completed'
                        ? 'bg-teal-500/15 text-teal-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {appt.status}
                  </span>

                  {appt.status === 'scheduled' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'completed')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1"
                        title="Mark Done"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Done</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1"
                        title="Cancel Booking"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Book Appointment Modal */}
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
                <CalendarIcon className="w-5 h-5 text-emerald-400" />
                <span>Book New Appointment</span>
              </h2>

              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateAppointment} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Customer *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Service / Purpose *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Haircut &amp; Beard Trim / Dental Checkup"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date &amp; Time Slot *
                  </label>
                  <input
                    type="datetime-local"
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Conflict checker automatically prevents double-booking within &plusmn;30 minutes.
                  </p>
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
                      <span>Schedule Booking</span>
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
