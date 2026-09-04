import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/quizzes').then(({ data }) => setQuizzes(data.quizzes)).catch(() => {});
    api.get('/classes').then(({ data }) => setClasses(data.classes)).catch(() => {});
  }, []);

  const graded = quizzes.filter((q) => q.score != null);
  const avg = graded.length
    ? Math.round(graded.reduce((s, q) => s + (q.score / q.max_score) * 100, 0) / graded.length)
    : null;
  const trend = graded.map((q, i) => ({ name: `Q${i + 1}`, score: Math.round((q.score / q.max_score) * 100) }));
  const upcoming = quizzes.filter((q) => !q.attempt_id || q.attempt_status !== 'graded');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hi {user?.name?.split(' ')[0]}, ready to boost your knowledge?</h1>
        <p className="text-ink/50 text-sm mt-1">Pick a focus area and let AI generate a fresh practice quiz.</p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 bg-gradient-to-r from-brand-50 to-white">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Choose your focus area</label>
          <select className="input">
            {classes.map((c) => <option key={c.id}>{c.name}</option>)}
            {classes.length === 0 && <option>Join a class to get started</option>}
          </select>
        </div>
        <button onClick={() => navigate('/quizzes')} className="btn-primary">
          <Sparkles size={16} /> AI Generated Quiz
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="font-semibold mb-4">Upcoming Quizzes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/40 border-b border-black/5">
                <th className="py-2 font-medium">Quiz</th>
                <th className="py-2 font-medium">Class</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((q) => (
                <tr key={q.id} className="border-b border-black/5 last:border-0">
                  <td className="py-3">{q.title}</td>
                  <td className="py-3 text-ink/50">{q.class_name}</td>
                  <td className="py-3"><span className="pill bg-brand-50 text-brand-700">Ready</span></td>
                  <td className="py-3 text-right">
                    <button onClick={() => navigate(`/take-quiz/${q.id}`)} className="btn-secondary !px-3 !py-1.5 text-xs">Take Quiz</button>
                  </td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-ink/40">No quizzes assigned right now.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Performance Overview</h2>
            <span className="text-2xl font-bold text-brand-700">{avg != null ? `${avg}%` : '—'}</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trend}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9991B5" />
              <YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #EEE9FB' }} />
              <Line type="monotone" dataKey="score" stroke="#6739C9" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Subjective Feedback Hub</h2>
          {graded.filter((q) => q.attempt_status === 'graded').length === 0 ? (
            <p className="text-sm text-ink/40 text-center py-8">No graded feedback yet.</p>
          ) : (
            <div className="space-y-3">
              {graded.slice(0, 3).map((q) => (
                <div key={q.id} className="border border-black/5 rounded-lg p-3">
                  <p className="text-sm font-medium">{q.title}</p>
                  <p className="text-xs text-ink/50 mt-1">Score: {q.score} / {q.max_score}</p>
                  <button onClick={() => navigate(`/results/${q.attempt_id}`)} className="text-xs text-brand-600 font-semibold mt-1 hover:underline">View detail</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">My Classes & Sections</h2>
          <div className="space-y-2">
            {classes.map((c) => (
              <div key={c.id} className="rounded-lg px-3 py-2.5 bg-[#F7F6FC] text-sm font-medium">{c.name} {c.section ? `· ${c.section}` : ''}</div>
            ))}
            {classes.length === 0 && <p className="text-sm text-ink/40 text-center py-8">Ask your teacher to enroll you.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
