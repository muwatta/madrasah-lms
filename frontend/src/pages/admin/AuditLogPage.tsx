import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { auditAPI } from '../../api';
import { SkeletonTable } from '../../components/Skeleton';

interface AuditLogEntry {
  id: string;
  actor_name: string;
  actor_email: string;
  action: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  reason: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ACTION_LABELS: Record<string, { en: string; ar: string }> = {
  create: { en: 'Created', ar: 'إنشاء' },
  update: { en: 'Updated', ar: 'تعديل' },
  delete: { en: 'Deleted', ar: 'حذف' },
  login: { en: 'Login', ar: 'تسجيل دخول' },
  publish: { en: 'Published', ar: 'نشر' },
  unpublish: { en: 'Unpublished', ar: 'إلغاء النشر' },
  approve: { en: 'Approved', ar: 'موافقة' },
  reject: { en: 'Rejected', ar: 'رفض' },
  submit: { en: 'Submitted', ar: 'تقديم' },
  grade: { en: 'Graded', ar: 'تصحيح' },
  comment: { en: 'Commented', ar: 'تعليق' },
  status_change: { en: 'Status Changed', ar: 'تغيير الحالة' },
  send: { en: 'Sent', ar: 'إرسال' },
};

const MODEL_LABELS: Record<string, { en: string; ar: string }> = {
  SubjectResult: { en: 'Subject Result', ar: 'نتيجة المادة' },
  TermResult: { en: 'Term Result', ar: 'نتيجة الفصل' },
  Attendance: { en: 'Attendance', ar: 'الحضور' },
  Fee: { en: 'Fee', ar: 'رسوم' },
  FeePayment: { en: 'Fee Payment', ar: 'دفع الرسوم' },
  User: { en: 'User', ar: 'مستخدم' },
  Announcement: { en: 'Announcement', ar: 'إعلان' },
  Enrollment: { en: 'Enrollment', ar: 'تسجيل' },
  Subject: { en: 'Subject', ar: 'مادة' },
  Quiz: { en: 'Quiz', ar: 'اختبار' },
  Question: { en: 'Question', ar: 'سؤال' },
};

function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    create: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    login: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    publish: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    approve: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    reject: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    grade: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  };
  const color = colorMap[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {action}
    </span>
  );
}

function DiffViewer({ previous_data, new_data }: { previous_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null }) {
  if (!previous_data && !new_data) return <span className="text-gray-400">—</span>;
  if (!previous_data && new_data) {
    return (
      <div className="text-xs space-y-1">
        {Object.entries(new_data).filter(([k]) => !k.startsWith('_')).map(([k, v]) => (
          <div key={k}>
            <span className="text-gray-500">{k}: </span>
            <span className="text-green-700 dark:text-green-400">{String(v ?? '')}</span>
          </div>
        ))}
      </div>
    );
  }
  if (previous_data && !new_data) {
    return (
      <div className="text-xs space-y-1">
        {Object.entries(previous_data).filter(([k]) => !k.startsWith('_')).map(([k, v]) => (
          <div key={k}>
            <span className="text-gray-500">{k}: </span>
            <span className="text-red-700 dark:text-red-400 line-through">{String(v ?? '')}</span>
          </div>
        ))}
      </div>
    );
  }
  const allKeys = new Set([...Object.keys(previous_data!), ...Object.keys(new_data!)]);
  const diffs: string[] = [];
  allKeys.forEach(k => {
    if (k.startsWith('_')) return;
    if (JSON.stringify(previous_data![k]) !== JSON.stringify(new_data![k])) diffs.push(k);
  });
  if (diffs.length === 0) return <span className="text-gray-400">—</span>;
  return (
    <div className="text-xs space-y-1">
      {diffs.slice(0, 5).map(k => (
        <div key={k}>
          <span className="text-gray-500">{k}: </span>
          <span className="text-red-600 dark:text-red-400 line-through">{String(previous_data![k] ?? '')}</span>
          <span className="text-gray-400 mx-1">→</span>
          <span className="text-green-600 dark:text-green-400">{String(new_data![k] ?? '')}</span>
        </div>
      ))}
      {diffs.length > 5 && <div className="text-gray-400">+{diffs.length - 5} more</div>}
    </div>
  );
}

export default function AuditLogPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const loadLogs = (url?: string) => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (!url) {
      if (actionFilter) params.action = actionFilter;
      if (modelFilter) params.model_name = modelFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (search) params.search = search;
      params.page = String(page);
    }
    auditAPI
      .list(url ? { url } : params)
      .then((res) => {
        setLogs(res.data.results ?? res.data);
        setCount(res.data.count ?? 0);
        setNextPage(res.data.next ?? null);
        setPrevPage(res.data.previous ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(); }, [page, actionFilter, modelFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const modelOptions = Object.keys(MODEL_LABELS).sort();
  const actionOptions = Object.keys(ACTION_LABELS).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('audit.title') || 'Audit Trail'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('audit.subtitle') || 'Track all system changes and user actions'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-secondary rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder={t('audit.searchPlaceholder') || 'Search actions, users...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-dark-tertiary text-gray-900 dark:text-gray-100"
          />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-dark-tertiary text-gray-900 dark:text-gray-100"
          >
            <option value="">{t('audit.allActions') || 'All Actions'}</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a]?.en || a}</option>
            ))}
          </select>
          <select
            value={modelFilter}
            onChange={(e) => { setModelFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-dark-tertiary text-gray-900 dark:text-gray-100"
          >
            <option value="">{t('audit.allModels') || 'All Models'}</option>
            {modelOptions.map((m) => (
              <option key={m} value={m}>{MODEL_LABELS[m]?.en || m}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-dark-tertiary text-gray-900 dark:text-gray-100"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-dark-tertiary text-gray-900 dark:text-gray-100"
          />
        </form>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            {t('audit.applyFilters') || 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-secondary rounded-lg shadow overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            {t('audit.noLogs') || 'No audit logs found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-dark-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('audit.timestamp') || 'Timestamp'}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('audit.user') || 'User'}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('audit.action') || 'Action'}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('audit.model') || 'Model'}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('audit.target') || 'Target'}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('audit.changes') || 'Changes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => {
                  const isExpanded = expandedRow === log.id;
                  return (
                    <>
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-tertiary cursor-pointer transition-colors"
                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{log.actor_name || 'System'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{log.actor_email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {MODEL_LABELS[log.model_name]?.en || log.model_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                          {log.object_repr || log.object_id || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {log.previous_data || log.new_data ? (
                            <span className="text-indigo-600 dark:text-indigo-400 hover:underline">
                              {isExpanded ? '▾' : '▸'} {t('audit.viewChanges') || 'View changes'}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${log.id}-detail`}>
                          <td colSpan={6} className="px-4 py-3 bg-gray-50 dark:bg-dark-tertiary border-t border-gray-100 dark:border-gray-800">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{t('audit.diff') || 'Changes'}:</span>
                                <div className="mt-1">
                                  <DiffViewer previous_data={log.previous_data} new_data={log.new_data} />
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{t('audit.reason') || 'Reason'}:</span>
                                <div className="mt-1 text-gray-600 dark:text-gray-400">{log.reason || '—'}</div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{t('audit.meta') || 'Metadata'}:</span>
                                <div className="mt-1 text-gray-600 dark:text-gray-400 space-y-1">
                                  <div><span className="text-gray-500">IP: </span>{log.ip_address || '—'}</div>
                                  <div className="truncate" title={log.user_agent}><span className="text-gray-500">UA: </span>{log.user_agent || '—'}</div>
                                  <div><span className="text-gray-500">ID: </span>{log.object_id || '—'}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(prevPage || nextPage) && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {count > 0 && `${count} ${t('audit.totalEntries') || 'total entries'}`}
            </span>
            <div className="flex gap-2">
              <button
                disabled={!prevPage}
                onClick={() => { if (prevPage) { setPage(p => p - 1); loadLogs(prevPage); } }}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
              >
                {t('common.previous') || 'Previous'}
              </button>
              <button
                disabled={!nextPage}
                onClick={() => { if (nextPage) { setPage(p => p + 1); loadLogs(nextPage); } }}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
              >
                {t('common.next') || 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
