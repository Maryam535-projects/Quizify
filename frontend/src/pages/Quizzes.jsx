import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Quizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);

  function load() {
    api.get('/quizzes').then(({ data }) => setQuizzes(data.quizzes)).catch(() => {});
  }
  useEffect(load, []);

  async function publish(id) {
    await api.patch(`/quizzes/${id}/publish`);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{user?.role === 'teacher' ? 'My Quizzes' : 'My Quizzes'}</h1>
        <p className="text-ink/50 text-sm mt-1">
          {user?.role === 'teacher' ? 'Manage drafts and publish quizzes to your classes.' : 'Take assigned quizzes and review your results.'}
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/40 border-b border-black/5">
              <th className="py-2 pr-4 font-medium">Quiz</th>
              <th className="py-2 pr-4 font-medium">Class</th>
              <th className="py-2 pr-4 font-medium">Questions</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={q.id} className="border-b border-black/5 last:border-0">
                <td className="py-3 pr-4 font-medium">{q.title}</td>
                <td className="py-3 pr-4 text-ink/50">{q.class_name}</td>
                <td className="py-3 pr-4">{q.total_questions}</td>
                <td className="py-3 pr-4">
                  <span className={`pill ${q.status === 'published' ? 'bg-green-50 text-success' : 'bg-amber-50 text-warning'}`}>{q.status}</span>
                </td>
                <td className="py-3 text-right space-x-2">
                  {user?.role === 'teacher' && q.status === 'draft' && (
                    <button onClick={() => publish(q.id)} className="btn-secondary !px-3 !py-1.5 text-xs">Publish</button>
                  )}
                  {user?.role === 'teacher' && (
                    <button onClick={() => navigate('/evaluations')} className="text-brand-600 font-semibold text-xs hover:underline">Evaluations</button>
                  )}
                  {user?.role === 'student' && (
                    q.attempt_status === 'graded'
                      ? <button onClick={() => navigate(`/results/${q.attempt_id}`)} className="btn-secondary !px-3 !py-1.5 text-xs">View results</button>
                      : <button onClick={() => navigate(`/take-quiz/${q.id}`)} className="btn-primary !px-3 !py-1.5 text-xs">Take quiz</button>
                  )}
                </td>
              </tr>
            ))}
            {quizzes.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-ink/40">No quizzes yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
