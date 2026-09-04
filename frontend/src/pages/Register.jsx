import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F6FC] to-brand-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Quizify" className="w-16 h-16 rounded-2xl object-cover shadow-card mb-3" />
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-ink/50 text-sm mt-1">Set up Quizify for your class</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          <div>
            <label className="label">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {['student', 'teacher'].map((r) => (
                <button
                  type="button" key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold capitalize transition ${
                    form.role === r ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-black/10 text-ink/60 hover:border-brand-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Full name</label>
            <input required className="input" placeholder="Alex Johnson"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" placeholder="you@school.edu"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={6} className="input" placeholder="At least 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink/50 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
