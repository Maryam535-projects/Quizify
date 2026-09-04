import { useEffect, useRef, useState } from 'react';
import { Sparkles, UploadCloud, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

export default function AiLab() {
  const fileInput = useRef(null);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [fileName, setFileName] = useState('');
  const [materialId, setMaterialId] = useState(null);
  const [questionTypes, setQuestionTypes] = useState({ objective: true, subjective: false });
  const [difficulty, setDifficulty] = useState(5);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [status, setStatus] = useState('idle'); // idle | uploading | generating | done | error
  const [message, setMessage] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    api.get('/classes').then(({ data }) => setClasses(data.classes)).catch(() => {});
    api.get('/quizzes').then(({ data }) => {
      setRecentActivity(data.quizzes.slice(0, 4).map((q) => ({
        title: `Quiz "${q.title}" generated`,
        meta: `${q.total_questions} questions · ${q.class_name}`,
      })));
    }).catch(() => {});
  }, []);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStatus('uploading');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (classId) formData.append('classId', classId);
      const { data } = await api.post('/quizzes/source-material', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMaterialId(data.materialId);
      setStatus('idle');
      setMessage(`Indexed ${data.chunkCount} source chunks for retrieval.`);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Could not process the file. Try a plain .txt export of your notes.');
    }
  }

  async function handleGenerate() {
    if (!title || !classId || !materialId) {
      setMessage('Add a quiz title, choose a class, and upload source material first.');
      return;
    }
    setStatus('generating');
    setMessage('');
    try {
      const { data } = await api.post('/quizzes/generate', {
        title, classId, materialId, totalQuestions, difficulty, questionTypes,
      });
      setStatus('done');
      setMessage(`"${data.quiz.title}" created as a draft with ${data.questionCount} questions. Publish it from the Quizzes page.`);
      setRecentActivity((prev) => [{ title: `Quiz "${data.quiz.title}" generated`, meta: `${data.questionCount} questions` }, ...prev].slice(0, 4));
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'AI generation failed. Check your Anthropic API key is configured on the server.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="text-brand-600" size={22} /> AI-Powered Quiz Generator</h1>
        <p className="text-ink/50 text-sm mt-1">Retrieval-augmented generation — questions are grounded in your uploaded source material.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 space-y-5">
          <h2 className="font-semibold">New Quiz</h2>

          <div>
            <label className="label">Quiz title</label>
            <input className="input" placeholder='e.g. "Modern Europe" Midterm'
              value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="label">Class</label>
            <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select a class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section ? `· ${c.section}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Source material</label>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 hover:bg-brand-50 transition py-8 flex flex-col items-center gap-2 text-brand-700"
            >
              <UploadCloud size={26} />
              <span className="text-sm font-semibold">{fileName || 'Drag & drop or click to upload (.txt)'}</span>
              {materialId && <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 size={14} /> Ready for generation</span>}
            </button>
            <input ref={fileInput} type="file" accept=".txt,text/plain" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Question types</label>
              <div className="flex gap-3">
                {['objective', 'subjective'].map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm capitalize">
                    <input
                      type="checkbox" checked={questionTypes[t]}
                      onChange={(e) => setQuestionTypes({ ...questionTypes, [t]: e.target.checked })}
                      className="accent-brand-600 w-4 h-4"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Difficulty (1–10)</label>
              <input type="number" min={1} max={10} className="input" value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Total questions</label>
            <input type="number" min={1} max={50} className="input" value={totalQuestions}
              onChange={(e) => setTotalQuestions(e.target.value)} />
          </div>

          {message && (
            <div className={`text-sm rounded-lg px-3 py-2 ${status === 'error' ? 'bg-red-50 text-danger' : 'bg-brand-50 text-brand-700'}`}>
              {message}
            </div>
          )}

          <button onClick={handleGenerate} disabled={status === 'generating' || status === 'uploading'} className="btn-primary w-full">
            <Sparkles size={16} /> {status === 'generating' ? 'Generating…' : 'Generate with AI'}
          </button>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-ink/40 text-center py-8">Nothing yet — generate your first quiz.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-ink/40">{a.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
