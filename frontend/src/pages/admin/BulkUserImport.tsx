import { useState, useRef } from 'react';
import { userAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';

interface ImportResult {
  created: number;
  errors: { row: number; error: string }[];
}

export default function BulkUserImport({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['email', 'first_name', 'last_name', 'role', 'password'];
    const sample = [
      ['ahmed@madrasah.com', 'أحمد', 'محمد', 'ustaadh', ''],
      ['sara@madrasah.com', 'سارة', 'أحمد', 'student', ''],
      ['khalid@madrasah.com', 'خالد', 'عمر', 'parent', ''],
    ];
    const csv = [headers.join(','), ...sample.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await userAPI.bulkImport(file);
      setResult(res.data);
      onComplete();
    } catch (err: any) {
      const data = err.response?.data;
      setResult({
        created: 0,
        errors: data?.errors || [{ row: 0, error: data?.error || 'Upload failed' }],
      });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="rounded-xl border border-dashed border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <svg className="h-4 w-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('bulkImport.title')}</h3>
        </div>
        <button onClick={downloadTemplate} className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/30">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {t('bulkImport.downloadTemplate')}
        </button>
      </div>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">{t('bulkImport.templateHint')}</p>

      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragging ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:bg-primary-900/20'
        }`}>
        <input ref={inputRef} type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
        {uploading ? (
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 animate-spin text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('bulkImport.uploading')}</p>
          </div>
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('bulkUpload.dragDrop')}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">CSV</p>
          </div>
        )}
      </div>

      {result && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${result.errors.length === 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
          {result.created > 0 && <p className="font-medium">{result.created} {t('bulkImport.created')}</p>}
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-red-600 dark:text-red-400">{result.errors.length} {t('bulkUpload.errors')}</p>
              <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-xs">
                {result.errors.map((e, i) => <li key={i} className="text-red-600 dark:text-red-400">Row {e.row}: {e.error}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
