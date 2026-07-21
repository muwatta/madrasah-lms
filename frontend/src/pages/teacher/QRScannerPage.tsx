import { useEffect, useState, useCallback, useRef } from 'react';
import { attendanceAPI, schoolClassAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

declare global {
  interface Window {
    Html5Qrcode: new (elementId: string) => {
      start: (config: { facingMode: string }, options: { fps: number; qrbox: { width: number; height: number } }, onScan: (text: string) => void, onError: () => void) => Promise<void>;
      stop: () => Promise<void>;
    };
  }
}

interface SchoolClass {
  id: number;
  name_ar: string;
  name_en: string;
}

interface ScanRecord {
  id: number;
  student: number;
  student_name: string;
  scanned_at: string;
  scanner_location: string;
  method: string;
  attendance_status: string | null;
}

export default function QRScannerPage() {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [countdown, setCountdown] = useState(0);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scanMode, setScanMode] = useState<'generate' | 'camera' | 'manual'>('generate');
  const [libLoaded, setLibLoaded] = useState(false);
  const scannerRef = useRef<any>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  const loadClasses = useCallback(async () => {
    try {
      const res = await schoolClassAPI.list();
      const list = unwrapPaginated<SchoolClass>(res.data);
      setClasses(list);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const loadScans = useCallback(async () => {
    try {
      const res = await attendanceAPI.scans();
      const list = unwrapPaginated<ScanRecord>(res.data);
      setScans(list);
    } catch {}
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadScans(); }, [loadScans]);

  useEffect(() => {
    if (expiresAt <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) { setQrImage(null); clearInterval(interval); }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Dynamic script load
  useEffect(() => {
    if (typeof window.Html5Qrcode !== 'undefined') {
      setLibLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    script.async = true;
    script.onload = () => setLibLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const generateQR = async () => {
    if (!selectedClass) return;
    setQrLoading(true);
    setError(null);
    try {
      const res = await attendanceAPI.qrClass(selectedClass);
      setQrImage(res.data.qr_data_url);
      setExpiresAt(Date.now() + (res.data.expires_in_seconds || 300) * 1000);
    } catch {
      setError(t('qrScanner.generateFailed'));
    } finally {
      setQrLoading(false);
    }
  };

  const handleScanResult = async (decodedText: string) => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
    }
    setScannerActive(false);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = { qr_data: decodedText, scanner_location: manualLocation.trim() || 'camera' };
      const res = await attendanceAPI.scan(payload);
      setSuccessMsg(`${res.data.student} - ${res.data.attendance_status}`);
      loadScans();
    } catch (err: any) {
      setError(err.response?.data?.error || t('qrScanner.scanFailed'));
    }
  };

  const startCamera = async () => {
    if (!libLoaded) { setError(t('qrScanner.libraryNotLoaded')); return; }
    setError(null);
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
      }

      const Html5QrcodeClass = window.Html5Qrcode;
      const html5QrCode = new Html5QrcodeClass('qr-reader');
      scannerRef.current = html5QrCode;
      setScannerActive(true);

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanResult,
        () => {},
      );
    } catch (err: any) {
      setScannerActive(false);
      setError(err?.message || t('qrScanner.cameraDenied'));
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  const handleManualScan = async () => {
    if (!manualInput.trim()) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await attendanceAPI.scan({
        qr_data: manualInput.trim(),
        scanner_location: manualLocation.trim() || undefined,
      });
      setSuccessMsg(`${res.data.student} - ${res.data.attendance_status}`);
      setManualInput('');
      loadScans();
    } catch (err: any) {
      setError(err.response?.data?.error || t('qrScanner.scanFailed'));
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{t('qrScanner.title')}</h1>
      </div>
      <p className="mb-6 text-sm text-gray-500">{t('qrScanner.subtitle')}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ms-2 underline">{t('common.dismiss')}</button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ms-2 underline">{t('common.dismiss')}</button>
        </div>
      )}

      <div className="mb-4 flex gap-2 border-b">
        {(['generate', 'camera', 'manual'] as const).map(mode => (
          <button key={mode} onClick={() => { setScanMode(mode); if (mode !== 'camera') stopCamera(); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              scanMode === mode ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {mode === 'generate' ? t('qrScanner.generateQR') : mode === 'camera' ? t('qrScanner.cameraScan') : t('qrScanner.manualEntry')}
          </button>
        ))}
      </div>

      {scanMode === 'generate' && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select value={selectedClass || ''} onChange={e => setSelectedClass(Number(e.target.value) || null)}
              className="input-field">
              <option value="">{t('qrScanner.selectClass')}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name_ar} - {c.name_en}</option>)}
            </select>
            <button onClick={generateQR} disabled={!selectedClass || qrLoading}
              className="btn-press rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {qrLoading ? t('common.loading') : t('qrScanner.generateQR')}
            </button>
          </div>
          {qrImage && (
            <div className="flex flex-col items-center gap-3">
              <img src={qrImage} alt="Attendance QR Code" className="h-64 w-64" />
              <p className="text-xs text-gray-500">
                {t('qrScanner.expiresIn')} {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </p>
              <button onClick={generateQR} className="text-sm text-primary-600 underline hover:text-primary-700">{t('qrScanner.refreshQR')}</button>
            </div>
          )}
        </div>
      )}

      {scanMode === 'camera' && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <input type="text" value={manualLocation} onChange={e => setManualLocation(e.target.value)}
              placeholder={t('qrScanner.scannerLocation')} className="input-field" />
          </div>
          <div id="qr-reader" ref={readerRef} className="mx-auto max-w-md overflow-hidden rounded-lg" />
          <div className="mt-4 flex justify-center gap-3">
            {!scannerActive ? (
              <button onClick={startCamera}
                className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700">
                {t('qrScanner.startCamera')}
              </button>
            ) : (
              <button onClick={stopCamera}
                className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700">
                {t('qrScanner.stopCamera')}
              </button>
            )}
          </div>
          {scannerActive && <p className="mt-3 text-center text-xs text-gray-500">{t('qrScanner.pointCamera')}</p>}
          {!libLoaded && <p className="mt-2 text-center text-xs text-amber-600">{t('qrScanner.loadingLibrary')}</p>}
        </div>
      )}

      {scanMode === 'manual' && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <textarea value={manualInput} onChange={e => setManualInput(e.target.value)}
              placeholder={t('qrScanner.pasteData')} rows={4} className="input-field font-mono" />
            <input type="text" value={manualLocation} onChange={e => setManualLocation(e.target.value)}
              placeholder={t('qrScanner.scannerLocation')} className="input-field" />
            <button onClick={handleManualScan} disabled={!manualInput.trim()}
              className="btn-press rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {t('qrScanner.submitScan')}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-gray-50 px-6 py-3">
          <h3 className="text-sm font-semibold text-gray-900">{t('qrScanner.todaysScans')}</h3>
        </div>
        {scans.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">{t('qrScanner.noScans')}</div>
        ) : (
          <div className="divide-y">
            <div className="hidden grid-cols-[1fr_auto_auto_auto] bg-gray-50 px-6 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 sm:grid">
              <span>{t('fields.student')}</span><span>{t('qrScanner.time')}</span><span>{t('qrScanner.method')}</span><span>{t('fields.status')}</span>
            </div>
            {scans.map(scan => (
              <div key={scan.id} className="flex flex-col gap-1 px-6 py-3 hover:bg-gray-50/50 sm:grid sm:grid-cols-[1fr_auto_auto_auto]">
                <span className="text-sm font-medium text-gray-900">{scan.student_name}</span>
                <span className="text-sm text-gray-500">{formatTime(scan.scanned_at)}</span>
                <span className="text-xs text-gray-400 uppercase">{scan.method}</span>
                <span className={`text-xs font-medium ${scan.attendance_status === 'present' ? 'text-emerald-600' : scan.attendance_status === 'late' ? 'text-amber-600' : 'text-gray-600'}`}>
                  {scan.attendance_status || '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
