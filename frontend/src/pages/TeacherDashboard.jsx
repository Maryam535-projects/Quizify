import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, AlertTriangle, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/analytics/overview').then(({ data }) => setOverview(data)).catch(() => {});
    api.get('/quizzes').then(({ data }) => setQuizzes(data.quizzes.slice(0, 5))).catch(() => {});
    api.get('/classes').then(({ data }) => setClasses(data.classes)).catch(() => {});
  }, []);

  const stats = [
    { label: 'Average Score', value: overview ? `${overview.avgScore}%` : '—', icon: CheckCircle2, color: 'text-success' },
    { label: 'Students Enrolled', value: overview?.enrolled ?? '—', icon: FileText, color: 'text-brand-600' },
    { label: 'Active This Week', value: overview?.active ?? '—', icon: Sparkles, color: 'text-brand-600' },
    { label: 'Integrity Score', value: overview ? `${overview.integrityScore}%` : '—', icon: AlertTriangle, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-ink/50 text-sm mt-1">Here's what's happening across your classes today.</p>
        </div>
        <Link to="/ai-lab" className="btn-primary">
          <Sparkles size={16} /> Generate Quiz with AI
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center ${color} mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-ink/50 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">Recent Quizzes</h2>
            <Link to="/quizzes" className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {quizzes.length === 0 ? (
            <p className="text-sm text-ink/40 py-8 text-center">No quizzes yet — generate your first one with AI.</p>
          ) : (
            <div className="divide-y divide-black/5">
              {quizzes.map((q) => (
                <div key={q.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{q.title}</p>
                    <p className="text-xs text-ink/40">{q.class_name} · {q.total_questions} questions</p>
                  </div>
                  <span className={`pill ${q.status === 'published' ? 'bg-green-50 text-success' : 'bg-amber-50 text-warning'}`}>
                    {q.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-base mb-4">My Classes</h2>
          {classes.length === 0 ? (
            <p className="text-sm text-ink/40 text-center py-8">No classes yet.</p>
          ) : (
            <div className="space-y-2">
              {classes.map((c) => (
                <Link to="/classes" key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-brand-50 transition">
                  <span className="text-sm font-medium">{c.name} {c.section ? `· ${c.section}` : ''}</span>
                  <span className="text-xs text-ink/40">{c.student_count} students</span>
                </Link>
              ))}
            </div>
          )}
          <Link to="/classes" className="btn-secondary w-full justify-center mt-4">+ New Class</Link>
        </div>
      </div>
    </div>
  );
}
