import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../lib/api';

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [flagged, setFlagged] = useState([]);

  useEffect(() => {
    api.get('/analytics/overview').then(({ data }) => setOverview(data)).catch(() => {});
    api.get('/analytics/performance-by-class').then(({ data }) => setPerformance(data.performance)).catch(() => {});
    api.get('/analytics/cheating').then(({ data }) => setFlagged(data.flagged)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
        <p className="text-ink/50 text-sm mt-1">Performance trends and academic-integrity signals across your classes.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-ink/50">Global Avg. Score</p>
          <p className="text-2xl font-bold mt-1">{overview ? `${overview.avgScore}%` : '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-ink/50">Students Active</p>
          <p className="text-2xl font-bold mt-1">{overview ? `${overview.active} / ${overview.enrolled}` : '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-ink/50">Integrity Score</p>
          <p className="text-2xl font-bold mt-1 text-success">{overview ? `${overview.integrityScore}%` : '—'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Performance by Class</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE9FB" />
              <XAxis dataKey="className" tick={{ fontSize: 12 }} stroke="#9991B5" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9991B5" domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #EEE9FB' }} />
              <Bar dataKey="avgScore" fill="#6739C9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Cheating Analytics — Flagged Attempts</h2>
          {flagged.length === 0 ? (
            <p className="text-sm text-ink/40 text-center py-16">No anomalies detected. Great academic integrity!</p>
          ) : (
            <div className="divide-y divide-black/5 max-h-64 overflow-y-auto">
              {flagged.map((f) => (
                <div key={`${f.id}-${f.quiz_title}`} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs text-ink/40">{f.quiz_title}</p>
                  </div>
                  <span className={`pill ${f.anomaly_score > 40 ? 'bg-red-50 text-danger' : 'bg-amber-50 text-warning'}`}>
                    {f.anomaly_score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
