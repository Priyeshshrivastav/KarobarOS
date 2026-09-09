'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  Receipt, 
  MessageSquare, 
  Loader2, 
  X,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCustomers = async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg('');

    try {
      const tagsArray = newTags ? newTags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          email: newEmail,
          tags: tagsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create customer');
        setCreating(false);
        return;
      }

      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewTags('');
      fetchCustomers(search);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleViewCustomer = async (cust: any) => {
    setSelectedCustomer(cust);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/customers/${cust.id}`);
      const data = await res.json();
      if (data.success) {
        setCustomerDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Customers &amp; Khata</span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage client records, contact history, and total spending
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or 10-digit phone number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              {search ? 'No matching customers found' : 'No customers in your directory yet'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tip: You can say &ldquo;Rahul Sharma 9876543210 ko add karo&rdquo; in the AI assistant, or click Add Customer above.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-emerald-400 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              Add First Customer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => handleViewCustomer(c)}
                className="glass-card p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] hover:border-emerald-500/40 relative group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{c.phone || 'No phone'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">
                      ₹{Number(c.total_spent || 0).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[10px] text-slate-500">Total Spent</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1 mt-3">
                  {c.tags && c.tags.length > 0 ? (
                    c.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-600">No tags</span>
                  )}
                </div>

                {/* WhatsApp Quick Link */}
                {c.phone && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Last visit: {c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString() : 'Never'}
                    </span>
                    <a
                      href={`https://wa.me/91${c.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Customer Detail Drawer / Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerDetails(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">{selectedCustomer.name}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                  <span>Phone: {selectedCustomer.phone}</span>
                  {selectedCustomer.email && <span>&middot; {selectedCustomer.email}</span>}
                </p>
                <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  Total Business: ₹{Number(selectedCustomer.total_spent || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {loadingDetails ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mx-auto mb-2" />
                  <span>Loading customer history...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recent Transactions */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Recent Sales &amp; Bills</span>
                    </h4>
                    {customerDetails?.sales?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No sales recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {customerDetails?.sales?.slice(0, 5).map((s: any) => (
                          <div
                            key={s.id}
                            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="text-white font-semibold">
                                ₹{Number(s.total_amount).toLocaleString('en-IN')}
                              </span>
                              <p className="text-[10px] text-slate-400">
                                {new Date(s.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                s.status === 'completed'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-amber-500/15 text-amber-400'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                    <Link
                      href={`/assistant?q=${encodeURIComponent(
                        `${selectedCustomer.name} ke liye appointment book karo`
                      )}`}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs text-center transition-colors"
                    >
                      Book via AI
                    </Link>
                    <a
                      href={`https://wa.me/91${selectedCustomer.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
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
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Add New Customer</span>
              </h2>

              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateCustomer} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    10-digit Phone Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="9876543210"
                      required
                      maxLength={10}
                      className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="VIP, Regular, Haircut"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Save Customer</span>
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
