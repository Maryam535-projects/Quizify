import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

export default function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: started } = await api.post(`/attempts/start/${quizId}`);
      setAttempt(started.attempt);
      const { data } = await api.get(`/quizzes/${quizId}`);
      setQuiz(data.quiz);
      setQuestions(data.questions);
    }
    init();
  }, [quizId]);

  // Lightweight academic-integrity signal capture: logs tab switches and paste
  // events to the backend, which feeds the anomaly score shown to teachers.
  useEffect(() => {
    if (!attempt) return;

    function logEvent(eventType, detail) {
      api.post(`/attempts/${attempt.id}/anomaly`, { eventType, detail }).catch(() => {});
    }
    function onVisibility() {
      if (document.hidden) logEvent('tab_blur', 'tab switched or minimized');
    }
    function onPaste() {
      logEvent('paste', 'paste detected in quiz window');
    }

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('paste', onPaste);
    };
  }, [attempt]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (attempt) {
      api.put(`/attempts/${attempt.id}/answers/${questionId}`, { answerText: value }).catch(() => {});
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post(`/attempts/${attempt.id}/submit`);
      navigate(`/results/${attempt.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!quiz) return <div className="text-ink/50 text-sm">Loading quiz…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <p className="text-ink/50 text-sm mt-1">{questions.length} questions · Answer to the best of your ability — your work is auto-saved.</p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="card">
            <p className="font-medium text-sm mb-3">{i + 1}. {q.question_text}</p>
            {q.question_type === 'objective' ? (
              <div className="space-y-2">
                {(q.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm rounded-lg border border-black/10 px-3 py-2 cursor-pointer hover:border-brand-300">
                    <input
                      type="radio" name={q.id} value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                      className="accent-brand-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="input min-h-[120px]"
                placeholder="Type your answer…"
                value={answers[q.id] || ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Submitting…' : 'Submit Quiz'}
      </button>
    </div>
  );
}
