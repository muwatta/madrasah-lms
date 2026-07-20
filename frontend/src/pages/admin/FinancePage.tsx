import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { feeAPI, feeStructureAPI, userAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';
import { useLanguage } from '../../context/LanguageContext';

interface Fee {
  id: number;
  student: number;
  student_name: string;
  amount: string;
  paid: string;
  balance: string;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  due_date: string;
  description: string;
  created_at: string;
}

interface FeeAnalytics {
  total_fees: number;
  total_collected: string;
  total_outstanding: string;
  overdue_count: number;
  recent_payments: { id: number; student_name: string; amount: string; paid_at: string; payment_method: string }[];
  monthly_data: { month: string; collected: number; outstanding: number }[];
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 border border-green-200',
  partial: 'bg-amber-100 text-amber-700 border border-amber-200',
  pending: 'bg-blue-100 text-blue-700 border border-blue-200',
  overdue: 'bg-red-100 text-red-700 border border-red-200',
};

const STATUS_OPTIONS = ['pending', 'paid', 'partial', 'overdue'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'mobile_money', 'card', 'other'];

export default function FinancePage() {
  const { t, language } = useLanguage();

  const [fees, setFees] = useState<Fee[]>([]);
  const [analytics, setAnalytics] = useState<FeeAnalytics | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ student: '', amount: '', due_date: '', description: '', status: 'pending' });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFee, setPaymentFee] = useState<Fee | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'cash' });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [bulkForm, setBulkForm] = useState({
    fee_structure: '',
    amount: '',
    due_date: '',
    description: '',
    assign_all: true,
    selected_students: [] as number[],
  });
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statusLabels: Record<string, string> = {
    pending: t('finance.pending'),
    paid: t('finance.paid'),
    partial: t('finance.partial'),
    overdue: t('finance.overdue'),
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: t('finance.cash'),
    bank_transfer: t('finance.bankTransfer'),
    mobile_money: t('finance.mobileMoney'),
    card: t('finance.card'),
    other: t('finance.other'),
  };

  const loadFees = () => {
    setLoading(true);
    feeAPI.list()
      .then((res) => setFees(res.data.results ?? res.data))
      .catch((err) => setError(err.response?.data?.detail || t('finance.loadFailed')))
      .finally(() => setLoading(false));
  };

  const loadAnalytics = () => {
    feeAPI.analytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      userAPI.list({ role: 'student' }).then((r) => setStudents(r.data.results ?? r.data)),
      feeStructureAPI.list().then((r) => setFeeStructures(r.data.results ?? r.data)),
    ]).catch(() => {});
    loadFees();
    loadAnalytics();
  }, []);

  const filteredFees = useMemo(() => {
    let result = fees;
    if (statusFilter) result = result.filter((f) => f.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.student_name.toLowerCase().includes(q));
    }
    return result;
  }, [fees, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / pageSize));
  const pagedFees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFees.slice(start, start + pageSize);
  }, [filteredFees, page]);

  const stats = useMemo(() => {
    const total = fees.length;
    const collected = fees.reduce((sum, f) => sum + parseFloat(f.paid || '0'), 0);
    const outstanding = fees.reduce((sum, f) => sum + parseFloat(f.balance || '0'), 0);
    const overdue = fees.filter((f) => f.status === 'overdue').length;
    return { total, collected: collected.toFixed(2), outstanding: outstanding.toFixed(2), overdue };
  }, [fees]);

  const chartData = useMemo(() => {
    if (analytics?.monthly_data?.length) return analytics.monthly_data;
    return [
      { month: t('finance.collected'), collected: parseFloat(stats.collected), outstanding: parseFloat(stats.outstanding) },
    ];
  }, [analytics, stats, t]);

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateFieldErrors({});
    setCreateSaving(true);
    try {
      await feeAPI.create({
        student: Number(createForm.student),
        amount: createForm.amount,
        due_date: createForm.due_date,
        description: createForm.description,
        status: createForm.status,
      });
      setShowCreateForm(false);
      setCreateForm({ student: '', amount: '', due_date: '', description: '', status: 'pending' });
      loadFees();
      loadAnalytics();
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const fields: Record<string, string> = {};
        for (const [key, val] of Object.entries(data)) {
          fields[key] = Array.isArray(val) ? val.join(', ') : String(val);
        }
        setCreateFieldErrors(fields);
        const nonField = Object.keys(fields).filter(k => k === 'non_field_errors' || k === 'detail');
        if (nonField.length) {
          setCreateError(fields[nonField[0]]);
        } else if (!Object.keys(fields).length) {
          setCreateError(t('finance.createFailed'));
        }
      } else {
        setCreateError(typeof data === 'string' ? data : t('finance.createFailed'));
      }
    } finally {
      setCreateSaving(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentFee) return;
    setPaymentError(null);
    setPaymentSaving(true);
    try {
      await feeAPI.pay(paymentFee.id, {
        amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
      });
      setShowPaymentModal(false);
      setPaymentFee(null);
      setPaymentForm({ amount: '', payment_method: 'cash' });
      loadFees();
      loadAnalytics();
    } catch (err: any) {
      setPaymentError(err.response?.data?.detail || err.response?.data?.amount?.[0] || t('finance.paymentFailed'));
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await feeAPI.delete(id);
      setDeleteConfirmId(null);
      loadFees();
      loadAnalytics();
    } catch (err: any) {
      setError(err.response?.data?.detail || t('finance.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    setBulkSuccess(null);
    setBulkSaving(true);
    try {
      const payload: any = {
        due_date: bulkForm.due_date,
        description: bulkForm.description,
      };
      if (bulkForm.fee_structure) {
        payload.fee_structure = Number(bulkForm.fee_structure);
      } else {
        payload.amount = bulkForm.amount;
      }
      if (!bulkForm.assign_all && bulkForm.selected_students.length > 0) {
        payload.student_ids = bulkForm.selected_students;
      }
      const res = await feeAPI.bulkCreate(payload);
      setBulkSuccess(`${t('finance.bulkCreateSuccess')} (${res.data.created} ${t('finance.fees')})`);
      setBulkForm({ fee_structure: '', amount: '', due_date: '', description: '', assign_all: true, selected_students: [] });
      loadFees();
      loadAnalytics();
    } catch (err: any) {
      setBulkError(err.response?.data?.error || err.response?.data?.detail || t('finance.bulkCreateFailed'));
    } finally {
      setBulkSaving(false);
    }
  };

  const selectCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';
  const inputCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

  return (
    <div className="page-enter space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 p-6 text-white shadow-lg shadow-primary-500/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t('finance.title')}</h1>
            <p className="mt-1 text-sm text-primary-100">{t('guides.finance')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setBulkForm({ fee_structure: '', amount: '', due_date: '', description: '', assign_all: true, selected_students: [] });
                setBulkError(null);
                setBulkSuccess(null);
                setShowBulkModal(true);
              }}
              className="btn-press inline-flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              {t('finance.bulkCreate')}
            </button>
            <button
              onClick={() => {
                setCreateForm({ student: '', amount: '', due_date: '', description: '', status: 'pending' });
                setCreateError(null);
                setCreateFieldErrors({});
                setShowCreateForm(true);
              }}
              className="btn-press inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {t('finance.addFee')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title={t('finance.totalFees')}
          value={stats.total}
          color="bg-blue-500"
          delay={0}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          title={t('finance.collected')}
          value={`${stats.collected}`}
          color="bg-green-500"
          delay={50}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title={t('finance.outstanding')}
          value={`${stats.outstanding}`}
          color="bg-amber-500"
          delay={100}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title={t('finance.overdue')}
          value={stats.overdue}
          color="bg-red-500"
          delay={150}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
        />
      </div>

      {chartData.length > 0 && (
        <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="mb-4 text-sm font-semibold text-gray-700">{t('finance.financialOverview')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="collected" name={t('finance.collected')} fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outstanding" name={t('finance.outstanding')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {analytics?.recent_payments && analytics.recent_payments.length > 0 && (
        <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">{t('finance.recentPayments')}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-end text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2 ps-4">{t('finance.student')}</th>
                  <th className="pb-2 ps-4">{t('finance.amount')}</th>
                  <th className="pb-2 ps-4">{t('finance.paymentMethod')}</th>
                  <th className="pb-2">{t('fields.date')}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recent_payments.slice(0, 5).map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 ps-4 font-medium text-gray-900">{p.student_name}</td>
                    <td className="py-2.5 ps-4 text-green-600 font-semibold">{p.amount}</td>
                    <td className="py-2.5 ps-4 text-gray-500 capitalize">{paymentMethodLabels[p.payment_method] || p.payment_method?.replace('_', ' ')}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{new Date(p.paid_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[160px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.searchStudent') || (language === 'ar' ? 'بحث عن طالب' : 'Search student')}</label>
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder={language === 'ar' ? 'ابحث بالاسم...' : 'Search by name...'}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 ps-9 pe-3 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.filterByStatus')}</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectCls}>
              <option value="">{t('finance.allStatuses')}</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{statusLabels[s] || s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          {(statusFilter || searchQuery) && (
            <button
              onClick={() => { setStatusFilter(''); setSearchQuery(''); setPage(1); }}
              className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              {language === 'ar' ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="animate-slide-down rounded-xl border border-primary-100 bg-white p-6 shadow-md shadow-primary-500/5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{t('finance.createNewFee')}</h2>
          </div>
          {createError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              {createError}
            </div>
          )}
          <form onSubmit={handleCreateFee} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.student')}</label>
              <select
                required
                value={createForm.student}
                onChange={(e) => { setCreateForm({ ...createForm, student: e.target.value }); setCreateFieldErrors(fe => { const n = { ...fe }; delete n.student; return n; }); }}
                className={`${selectCls} ${createFieldErrors.student ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
              >
                <option value="">{t('filters.chooseStudent')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              {createFieldErrors.student && <p className="mt-1 text-xs text-red-500">{createFieldErrors.student}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.amount')}</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={createForm.amount}
                onChange={(e) => { setCreateForm({ ...createForm, amount: e.target.value }); setCreateFieldErrors(fe => { const n = { ...fe }; delete n.amount; return n; }); }}
                className={`${inputCls} ${createFieldErrors.amount ? 'border-red-300' : ''}`}
                placeholder="0.00"
              />
              {createFieldErrors.amount && <p className="mt-1 text-xs text-red-500">{createFieldErrors.amount}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.dueDate')}</label>
              <input
                required
                type="date"
                value={createForm.due_date}
                onChange={(e) => { setCreateForm({ ...createForm, due_date: e.target.value }); setCreateFieldErrors(fe => { const n = { ...fe }; delete n.due_date; return n; }); }}
                className={`${inputCls} ${createFieldErrors.due_date ? 'border-red-300' : ''}`}
              />
              {createFieldErrors.due_date && <p className="mt-1 text-xs text-red-500">{createFieldErrors.due_date}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.description')}</label>
              <input
                type="text"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className={inputCls}
                placeholder={language === 'ar' ? 'رسوم الفصل الدراسي...' : 'Tuition fees...'}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('fields.status')}</label>
              <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })} className={selectCls}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{statusLabels[s] || s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
              <button type="submit" disabled={createSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                {createSaving ? (
                  <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                ) : (
                  <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('finance.createFee')}</>
                )}
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {showPaymentModal && paymentFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('finance.recordPayment')}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">{t('finance.student')}: <span className="font-medium text-gray-900">{paymentFee.student_name}</span></p>
              <p className="text-sm text-gray-600">{t('finance.balance')}: <span className="font-medium text-amber-600">{paymentFee.balance}</span></p>
            </div>
            {paymentError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                {paymentError}
              </div>
            )}
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.paymentAmount')}</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentFee.balance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className={inputCls}
                  placeholder={paymentFee.balance}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.paymentMethod')}</label>
                <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} className={selectCls}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{paymentMethodLabels[m] || m.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={paymentSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50">
                  {paymentSaving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('finance.recordPayment')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowBulkModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('finance.bulkCreateFees')}</h3>
              <button onClick={() => setShowBulkModal(false)} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {bulkError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                {bulkError}
              </div>
            )}
            {bulkSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {bulkSuccess}
              </div>
            )}
            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.feeStructure')}</label>
                <select
                  value={bulkForm.fee_structure}
                  onChange={(e) => {
                    const fsId = e.target.value;
                    const fs = feeStructures.find((f: any) => String(f.id) === fsId);
                    setBulkForm({
                      ...bulkForm,
                      fee_structure: fsId,
                      amount: fs ? fs.amount : bulkForm.amount,
                      description: fs ? fs.name : bulkForm.description,
                    });
                  }}
                  className={selectCls}
                >
                  <option value="">{t('finance.selectFeeStructure')}</option>
                  {feeStructures.map((fs: any) => (
                    <option key={fs.id} value={fs.id}>{fs.name} - {fs.amount}</option>
                  ))}
                </select>
              </div>
              {!bulkForm.fee_structure && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.manualAmount')}</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkForm.amount}
                    onChange={(e) => setBulkForm({ ...bulkForm, amount: e.target.value })}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.dueDate')}</label>
                <input
                  required
                  type="date"
                  value={bulkForm.due_date}
                  onChange={(e) => setBulkForm({ ...bulkForm, due_date: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.description')}</label>
                <input
                  type="text"
                  value={bulkForm.description}
                  onChange={(e) => setBulkForm({ ...bulkForm, description: e.target.value })}
                  className={inputCls}
                  placeholder={language === 'ar' ? 'رسوم الفصل الدراسي...' : 'Tuition fees...'}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={bulkForm.assign_all}
                    onChange={(e) => setBulkForm({ ...bulkForm, assign_all: e.target.checked, selected_students: [] })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {t('finance.assignToAllStudents')}
                </label>
              </div>
              {!bulkForm.assign_all && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.selectStudents')}</label>
                  <select
                    multiple
                    value={bulkForm.selected_students.map(String)}
                    onChange={(e) => setBulkForm({
                      ...bulkForm,
                      selected_students: Array.from(e.target.selectedOptions, (o) => Number(o.value)),
                    })}
                    className={`${selectCls} h-32`}
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={bulkSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {bulkSaving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.creating')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>{t('finance.bulkCreate')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowBulkModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      ) : pagedFees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{t('finance.noFees')}</p>
          <p className="mt-1 text-xs text-gray-400">{language === 'ar' ? 'ابدأ بإضافة رسوم للطلاب' : 'Start by adding fees for students'}</p>
        </div>
      ) : (
        <div className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-end text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">{t('finance.student')}</th>
                  <th className="px-4 py-3">{t('finance.amount')}</th>
                  <th className="px-4 py-3">{t('finance.paid')}</th>
                  <th className="px-4 py-3">{t('finance.balance')}</th>
                  <th className="px-4 py-3">{t('fields.status')}</th>
                  <th className="px-4 py-3">{t('finance.dueDate')}</th>
                  <th className="px-4 py-3 text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredFees.map((fee) => (
                  <tr key={fee.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-medium text-gray-900">{fee.student_name}</span>
                      {fee.description && <p className="text-xs text-gray-400 mt-0.5">{fee.description}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{fee.amount}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-green-600 font-medium">{fee.paid}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-amber-600 font-medium">{fee.balance}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[fee.status] || ''}`}>
                        {statusLabels[fee.status] || fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">{new Date(fee.due_date).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {fee.status !== 'paid' && (
                          <button
                            onClick={() => { setPaymentFee(fee); setPaymentForm({ amount: fee.balance, payment_method: 'cash' }); setPaymentError(null); setShowPaymentModal(true); }}
                            className="btn-press inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                            title={t('finance.recordPayment')}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {language === 'ar' ? 'دفع' : 'Pay'}
                          </button>
                        )}
                        {deleteConfirmId === fee.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => handleDelete(fee.id)} disabled={deleting} className="btn-press rounded-lg bg-red-600 px-2 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                              {language === 'ar' ? 'نعم' : 'Yes'}
                            </button>
                            <button onClick={() => setDeleteConfirmId(null)} className="btn-press rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
                              {language === 'ar' ? 'لا' : 'No'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(fee.id)}
                            className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                            title={t('common.delete')}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="block md:hidden space-y-3 p-4">
            {pagedFees.map((fee) => (
              <div key={fee.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{fee.student_name}</span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[fee.status] || ''}`}>
                    {statusLabels[fee.status]}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">{t('finance.amount')}</p>
                    <p className="font-medium text-gray-900">{fee.amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t('finance.paid')}</p>
                    <p className="font-medium text-green-600">{fee.paid}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t('finance.balance')}</p>
                    <p className="font-medium text-amber-600">{fee.balance}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {t('finance.dueDate')}: {new Date(fee.due_date).toLocaleDateString()}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-gray-50 pt-3">
                  {fee.status !== 'paid' && (
                    <button
                      onClick={() => { setPaymentFee(fee); setPaymentForm({ amount: fee.balance, payment_method: 'cash' }); setPaymentError(null); setShowPaymentModal(true); }}
                      className="btn-press inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                    >
                      {t('finance.recordPayment')}
                    </button>
                  )}
                  {deleteConfirmId === fee.id ? (
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => handleDelete(fee.id)} disabled={deleting} className="btn-press rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">
                        {language === 'ar' ? 'نعم' : 'Yes'}
                      </button>
                      <button onClick={() => setDeleteConfirmId(null)} className="btn-press rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600">
                        {language === 'ar' ? 'لا' : 'No'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(fee.id)}
                      className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">
                {language === 'ar' ? `إجمالي ${filteredFees.length}` : `${filteredFees.length} total`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-press inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  <svg className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  {language === 'ar' ? 'السابق' : 'Prev'}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="inline-flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-xs text-gray-400">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`btn-press inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          page === p
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-press inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                  <svg className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
