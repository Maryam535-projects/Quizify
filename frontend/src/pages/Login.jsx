import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not log in. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F6FC] to-brand-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Quizify" className="w-16 h-16 rounded-2xl object-cover shadow-card mb-3" />
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-ink/50 text-sm mt-1">Log in to your Quizify account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              type="email" required className="input" placeholder="you@school.edu"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password" required className="input" placeholder="••••••••"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-ink/50 mt-6">
          New to Quizify?{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
