import { useEffect, useState, useMemo } from 'react';
import { feeAPI, dashboardAPI } from '../../api';
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

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 border border-green-200',
  partial: 'bg-amber-100 text-amber-700 border border-amber-200',
  pending: 'bg-blue-100 text-blue-700 border border-blue-200',
  overdue: 'bg-red-100 text-red-700 border border-red-200',
};

const STATUS_OPTIONS = ['pending', 'paid', 'partial', 'overdue'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'mobile_money', 'card', 'other'];

export default function FeeStatusPage() {
  const { t, language } = useLanguage();

  const [fees, setFees] = useState<Fee[]>([]);
  const [children, setChildren] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFee, setPaymentFee] = useState<Fee | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'cash' });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  const loadData = () => {
    setLoading(true);
    Promise.all([
      feeAPI.list().then((r) => setFees(r.data.results ?? r.data)),
      dashboardAPI.parent().then((r) => {
        const kids = (r.data?.children ?? []).map((c: any) => ({ id: c.id, name: c.name }));
        setChildren(kids);
      }),
    ])
      .catch((err) => setError(err.response?.data?.detail || t('finance.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filteredFees = useMemo(() => {
    if (!statusFilter) return fees;
    return fees.filter((f) => f.status === statusFilter);
  }, [fees, statusFilter]);

  const stats = useMemo(() => {
    const totalDue = fees
      .filter((f) => f.status !== 'paid')
      .reduce((sum, f) => sum + parseFloat(f.balance || '0'), 0);
    const overdue = fees.filter((f) => f.status === 'overdue').length;
    return { totalDue: totalDue.toFixed(2), overdue };
  }, [fees]);

  const childNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    children.forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [children]);

  const groupedFees = useMemo(() => {
    const groups: Record<string, Fee[]> = {};
    for (const fee of filteredFees) {
      const label = childNameMap[fee.student] || t('fields.student') + ' ' + fee.student;
      if (!groups[label]) groups[label] = [];
      groups[label].push(fee);
    }
    return groups;
  }, [filteredFees, childNameMap, t]);

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
      loadData();
    } catch (err: any) {
      setPaymentError(err.response?.data?.detail || err.response?.data?.amount?.[0] || t('finance.paymentFailed'));
    } finally {
      setPaymentSaving(false);
    }
  };

  const selectCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';
  const inputCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 flex items-center gap-3">
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {error}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 p-6 text-white shadow-lg shadow-primary-500/20 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('finance.feeStatus')}</h1>
        <p className="mt-1 text-sm text-primary-100">{t('guides.feeStatus')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title={t('finance.totalDue')}
          value={stats.totalDue}
          color="bg-amber-500"
          delay={0}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title={t('finance.overdue')}
          value={stats.overdue}
          color="bg-red-500"
          delay={50}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
        />
        <StatCard
          title={t('finance.paid')}
          value={fees.filter((f) => f.status === 'paid').length}
          color="bg-green-500"
          delay={100}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title={t('finance.totalFees')}
          value={fees.length}
          color="bg-blue-500"
          delay={150}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
        />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('finance.filterByStatus')}</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
              <option value="">{t('finance.allStatuses')}</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{statusLabels[s] || s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              {language === 'ar' ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {fees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{t('finance.noFeesRecorded')}</p>
          <p className="mt-1 text-xs text-gray-400">{language === 'ar' ? 'سيظهر هنا أي رسوم مخصصة لأبنائك' : 'Any fees assigned to your children will appear here'}</p>
        </div>
      ) : filteredFees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">{t('finance.noFeesWithStatus')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedFees).map(([studentName, studentFees], groupIdx) => (
            <div key={studentName} className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: `${200 + groupIdx * 80}ms` }}>
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {studentName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{studentName}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-end text-xs font-medium uppercase text-gray-500">
                      <th className="px-5 py-2.5">{t('finance.description')}</th>
                      <th className="px-5 py-2.5">{t('finance.amount')}</th>
                      <th className="px-5 py-2.5">{t('finance.paid')}</th>
                      <th className="px-5 py-2.5">{t('finance.balance')}</th>
                      <th className="px-5 py-2.5">{t('fields.status')}</th>
                      <th className="px-5 py-2.5">{t('finance.dueDate')}</th>
                      <th className="px-5 py-2.5 text-center">{language === 'ar' ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {studentFees.map((fee) => (
                      <tr key={fee.id} className="transition-colors hover:bg-gray-50/60">
                        <td className="whitespace-nowrap px-5 py-3 text-gray-700">{fee.description || '—'}</td>
                        <td className="whitespace-nowrap px-5 py-3 font-medium text-gray-900">{fee.amount}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-green-600 font-medium">{fee.paid}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-amber-600 font-medium">{fee.balance}</td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[fee.status] || ''}`}>
                            {statusLabels[fee.status] || fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-gray-500 text-xs">{new Date(fee.due_date).toLocaleDateString()}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-center">
                          {fee.status !== 'paid' && (
                            <button
                              onClick={() => { setPaymentFee(fee); setPaymentForm({ amount: fee.balance, payment_method: 'cash' }); setPaymentError(null); setShowPaymentModal(true); }}
                              className="btn-press inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {language === 'ar' ? 'ادفع' : 'Pay'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
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
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('finance.confirmPayment')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
