import { useEffect, useState, useCallback } from 'react';
import { attendanceAPI, schoolClassAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

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
  const { user } = useAuth();
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

  const loadClasses = useCallback(async () => {
    try {
      const res = await schoolClassAPI.list();
      const list = unwrapPaginated<SchoolClass>(res.data);
      setClasses(list);
    } catch {
      // classes may not be available
    } finally {
      setLoading(false);
    }
  }, []);

  const loadScans = useCallback(async () => {
    try {
      const res = await attendanceAPI.scans();
      const list = unwrapPaginated<ScanRecord>(res.data);
      setScans(list);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadScans(); }, [loadScans]);

  useEffect(() => {
    if (expiresAt <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setQrImage(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const generateQR = async () => {
    if (!selectedClass) return;
    setQrLoading(true);
    setError(null);
    try {
      const res = await attendanceAPI.qrClass(selectedClass);
      setQrImage(res.data.qr_data_url);
      setExpiresAt(Date.now() + (res.data.expires_in_seconds || 300) * 1000);
    } catch {
      setError('Failed to generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleManualScan = async () => {
    if (!manualInput.trim()) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        qr_data: manualInput.trim(),
        scanner_location: manualLocation.trim() || undefined,
      };
      const res = await attendanceAPI.scan(payload);
      setSuccessMsg(`${res.data.student} - ${res.data.attendance_status}`);
      setManualInput('');
      loadScans();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Scan failed');
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">QR Attendance</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">Generate QR codes for students to scan, or enter scan data manually.</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="me-2 underline">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="me-2 underline">Dismiss</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Class QR</h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ar} - {c.name_en}</option>
              ))}
            </select>
            <button
              onClick={generateQR}
              disabled={!selectedClass || qrLoading}
              className="btn-press rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {qrLoading ? 'Generating...' : 'Generate QR'}
            </button>
          </div>

          {qrImage && (
            <div className="flex flex-col items-center gap-3">
              <img src={qrImage} alt="Attendance QR Code" className="w-64 h-64" />
              <p className="text-xs text-gray-500">
                Expires in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </p>
              <button
                onClick={generateQR}
                className="btn-press text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Refresh QR
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Entry</h2>

          <div className="flex flex-col gap-3">
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder='Paste QR JSON data here...'
              rows={4}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
            />
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="Scanner location (optional)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              onClick={handleManualScan}
              disabled={!manualInput.trim()}
              className="btn-press rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Submit Scan
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Today's Scans</h3>
        </div>
        {scans.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No scans today</div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] bg-gray-50 px-6 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              <span>Student</span>
              <span>Time</span>
              <span>Method</span>
              <span>Status</span>
            </div>
            {scans.map((scan) => (
              <div key={scan.id} className="flex flex-col gap-1 sm:grid sm:grid-cols-[1fr_auto_auto_auto] px-6 py-3 hover:bg-gray-50/50">
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
