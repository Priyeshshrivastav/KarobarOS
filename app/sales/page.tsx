'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { 
  Receipt, 
  Plus, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  Loader2, 
  X, 
  User,
  CheckCircle2
} from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [customerId, setCustomerId] = useState('');
  const [itemName, setItemName] = useState('Standard Service / Product');
  const [itemPrice, setItemPrice] = useState('500');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [saleStatus, setSaleStatus] = useState<'completed' | 'pending'>('completed');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' ? '/api/sales' : `/api/sales?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSales(data.sales);
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
    fetchSales();
    fetchCustomers();
  }, [statusFilter]);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    const total = Number(itemPrice) * Number(itemQuantity);
    if (isNaN(total) || total <= 0) {
      setErrorMsg('Please enter a valid price and quantity');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId || undefined,
          amount: total,
          status: saleStatus,
          items: [
            {
              name: itemName,
              price: Number(itemPrice),
              quantity: Number(itemQuantity),
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to record sale');
        setSaving(false);
        return;
      }

      setShowAddModal(false);
      setItemName('Standard Service / Product');
      setItemPrice('500');
      setItemQuantity('1');
      fetchSales();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalCompleted = sales
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

  const totalPending = sales
    .filter((s) => s.status === 'pending')
    .reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>Sales &amp; Billing (Khata)</span>
            </h1>
            <p className="text-xs text-slate-400">
              Track paid revenue and pending customer balances (udhaar)
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Sale</span>
          </button>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Collected Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">
              ₹{totalCompleted.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Pending Udhaar</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400">
              ₹{totalPending.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          {['all', 'completed', 'pending'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                statusFilter === tab
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? 'All Transactions' : tab === 'completed' ? 'Paid' : 'Pending (Udhaar)'}
            </button>
          ))}
        </div>

        {/* Sales Table / List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading sales ledger...</span>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel text-center text-slate-400 space-y-3">
            <Receipt className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No sales recorded under this filter</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tip: Say &ldquo;₹500 haircut sale add kardo&rdquo; in AI chat to record instant bills.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-emerald-400 border border-slate-700 hover:bg-slate-700"
            >
              Record First Sale
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((s) => (
              <div
                key={s.id}
                className="glass-card p-4 rounded-2xl flex items-center justify-between transition-all hover:border-emerald-500/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      s.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {s.customers?.name || 'Walk-in Customer'}
                      </span>
                      {s.customers?.phone && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          ({s.customers.phone})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {s.sale_items?.length > 0
                        ? s.sale_items.map((it: any) => `${it.name} (x${it.quantity})`).join(', ')
                        : 'General Service'} &middot;{' '}
                      <span className="text-[11px] text-slate-500">
                        {new Date(s.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-base text-white">
                    ₹{Number(s.total_amount).toLocaleString('en-IN')}
                  </span>
                  <div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mt-0.5 ${
                        s.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {s.status === 'completed' ? 'Paid' : 'Pending Udhaar'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Sale Modal */}
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
                <Receipt className="w-5 h-5 text-emerald-400" />
                <span>Record New Sale</span>
              </h2>

              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateSale} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Customer
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Walk-in / Guest Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Service / Item Name
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Price (₹ INR) *
                    </label>
                    <input
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      required
                      min="1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      required
                      min="1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSaleStatus('completed')}
                      className={`py-2 rounded-xl text-xs font-semibold transition-colors border ${
                        saleStatus === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Paid in Full
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaleStatus('pending')}
                      className={`py-2 rounded-xl text-xs font-semibold transition-colors border ${
                        saleStatus === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Pending (Udhaar)
                    </button>
                  </div>
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
                      <span>
                        Record ₹{(Number(itemPrice) * Number(itemQuantity)).toLocaleString('en-IN')} Sale
                      </span>
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
