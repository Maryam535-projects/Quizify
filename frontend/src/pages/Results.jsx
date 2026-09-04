import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export default function Results() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/attempts/${attemptId}`).then(({ data }) => setData(data)).catch(() => {});
  }, [attemptId]);

  if (!data) return <div className="text-ink/50 text-sm">Loading results…</div>;
  const { attempt, answers } = data;
  const pct = attempt.max_score ? Math.round((attempt.score / attempt.max_score) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card text-center py-8">
        <p className="text-ink/50 text-sm">Your score</p>
        <p className="text-5xl font-bold text-brand-700 mt-2">{pct}%</p>
        <p className="text-ink/50 text-sm mt-1">{attempt.score} / {attempt.max_score} points</p>
      </div>

      <div className="space-y-4">
        {answers.map((ans, i) => (
          <div key={ans.id} className="card">
            <p className="font-medium text-sm mb-2">{i + 1}. {ans.question_text}</p>
            <p className="text-sm bg-[#F7F6FC] rounded-lg p-3">{ans.answer_text || '— no answer —'}</p>
            {ans.question_type === 'objective' ? (
              <span className={`pill mt-2 ${ans.is_correct ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                {ans.is_correct ? 'Correct' : `Incorrect — correct answer: ${ans.correct_answer}`}
              </span>
            ) : (
              <div className="mt-2 space-y-1">
                <span className="pill bg-brand-50 text-brand-700">
                  Grade: {ans.teacher_override_grade ?? ans.ai_grade ?? '—'} / {ans.points}
                </span>
                {ans.ai_feedback && <p className="text-xs text-ink/50 italic">{ans.ai_feedback}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <Link to="/quizzes" className="btn-secondary w-full justify-center">Back to quizzes</Link>
    </div>
  );
}
