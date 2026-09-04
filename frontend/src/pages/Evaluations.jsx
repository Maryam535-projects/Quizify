import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Evaluations() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [openAttempt, setOpenAttempt] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get('/quizzes').then(({ data }) => setQuizzes(data.quizzes)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedQuiz) { setAttempts([]); return; }
    api.get(`/attempts/quiz/${selectedQuiz}`).then(({ data }) => setAttempts(data.attempts)).catch(() => {});
  }, [selectedQuiz]);

  async function openDetail(attemptId) {
    setOpenAttempt(attemptId);
    const { data } = await api.get(`/attempts/${attemptId}`);
    setDetail(data);
  }

  async function override(answerId, grade) {
    await api.patch(`/attempts/answers/${answerId}/override`, { grade });
    const { data } = await api.get(`/attempts/${openAttempt}`);
    setDetail(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Evaluations</h1>
        <p className="text-ink/50 text-sm mt-1">Review AI-suggested grades for subjective answers and override where needed.</p>
      </div>

      <div className="card">
        <label className="label">Quiz</label>
        <select className="input max-w-md" value={selectedQuiz} onChange={(e) => setSelectedQuiz(e.target.value)}>
          <option value="">Select a quiz</option>
          {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title} · {q.class_name}</option>)}
        </select>
      </div>

      {selectedQuiz && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/40 border-b border-black/5">
                <th className="py-2 pr-4 font-medium">Student</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Score</th>
                <th className="py-2 pr-4 font-medium">Integrity</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{a.student_name}</p>
                    <p className="text-xs text-ink/40">{a.student_email}</p>
                  </td>
                  <td className="py-3 pr-4 capitalize">{a.status}</td>
                  <td className="py-3 pr-4">{a.score != null ? `${a.score} / ${a.max_score}` : '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={`pill ${a.anomaly_score > 40 ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>
                      {a.anomaly_score > 40 ? 'Flagged' : 'Clean'} · {a.anomaly_score}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => openDetail(a.id)} className="text-brand-600 font-semibold text-sm hover:underline">View detail</button>
                  </td>
                </tr>
              ))}
              {attempts.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-ink/40">No attempts yet for this quiz.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Answer review</h2>
            <button onClick={() => setDetail(null)} className="text-sm text-ink/40 hover:text-ink">Close</button>
          </div>
          {detail.answers.map((ans) => (
            <div key={ans.id} className="border border-black/5 rounded-lg p-4 space-y-2">
              <p className="font-medium text-sm">{ans.question_text}</p>
              <p className="text-sm text-ink/70 bg-[#F7F6FC] rounded-lg p-3">{ans.answer_text || '— no answer submitted —'}</p>
              {ans.question_type === 'subjective' && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="pill bg-brand-50 text-brand-700">AI suggested: {ans.ai_grade ?? '—'} / {ans.points}</span>
                    {ans.teacher_override_grade != null && (
                      <span className="pill bg-amber-50 text-warning">Override: {ans.teacher_override_grade}</span>
                    )}
                  </div>
                  {ans.ai_feedback && <p className="text-xs text-ink/50 italic">"{ans.ai_feedback}"</p>}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number" min={0} max={ans.points} step="0.5" placeholder="Override grade"
                      className="input max-w-[140px]"
                      onKeyDown={(e) => { if (e.key === 'Enter') override(ans.id, e.target.value); }}
                      id={`grade-${ans.id}`}
                    />
                    <button
                      onClick={() => override(ans.id, document.getElementById(`grade-${ans.id}`).value)}
                      className="btn-secondary"
                    >
                      Save override
                    </button>
                  </div>
                </>
              )}
              {ans.question_type === 'objective' && (
                <span className={`pill ${ans.is_correct ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                  {ans.is_correct ? 'Correct' : 'Incorrect'} — correct answer: {ans.correct_answer}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
