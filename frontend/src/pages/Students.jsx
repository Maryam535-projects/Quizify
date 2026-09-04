import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import api from '../lib/api';

export default function Students() {
  const fileInput = useRef(null);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/classes').then(({ data }) => setClasses(data.classes)).catch(() => {});
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (classId) formData.append('classId', classId);
      const { data } = await api.post('/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not process the CSV file.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Student Management</h1>
        <p className="text-ink/50 text-sm mt-1">Upload a CSV with <code className="bg-brand-50 px-1.5 py-0.5 rounded text-brand-700 text-xs">name</code> and <code className="bg-brand-50 px-1.5 py-0.5 rounded text-brand-700 text-xs">email</code> columns to create accounts and enroll students at once.</p>
      </div>

      <div className="card max-w-xl space-y-4">
        <div>
          <label className="label">Enroll into class (optional)</label>
          <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Don't enroll — just create accounts</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section ? `· ${c.section}` : ''}</option>)}
          </select>
        </div>

        <button
          type="button" onClick={() => fileInput.current?.click()} disabled={busy}
          className="w-full rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 hover:bg-brand-50 transition py-10 flex flex-col items-center gap-2 text-brand-700"
        >
          <UploadCloud size={28} />
          <span className="text-sm font-semibold">{busy ? 'Processing…' : 'Drag & drop CSV, or click to upload'}</span>
        </button>
        <input ref={fileInput} type="file" accept=".csv" className="hidden" onChange={handleUpload} />

        {error && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        {result && (
          <div className="text-sm space-y-2">
            <p className="font-semibold text-success">{result.message}</p>
            {result.createdAccounts.length > 0 && (
              <div className="bg-[#F7F6FC] rounded-lg p-3 max-h-56 overflow-y-auto">
                <p className="text-xs text-ink/50 mb-2">New accounts created (share temporary passwords securely):</p>
                {result.createdAccounts.map((a, i) => (
                  <p key={i} className="text-xs font-mono">{a.email} — {a.tempPassword}</p>
                ))}
              </div>
            )}
            {result.skipped.length > 0 && (
              <p className="text-xs text-warning">{result.skipped.length} row(s) skipped (missing name or email).</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
