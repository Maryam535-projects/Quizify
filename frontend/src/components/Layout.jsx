import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileQuestion, BarChart3, Users,
  LogOut, Sparkles, ClipboardCheck, GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

const teacherNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/classes', label: 'My Classes', icon: BookOpen },
  { to: '/quizzes', label: 'Quizzes', icon: FileQuestion },
  { to: '/ai-lab', label: 'AI Lab', icon: Sparkles },
  { to: '/evaluations', label: 'Evaluations', icon: ClipboardCheck },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const studentNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/quizzes', label: 'My Quizzes', icon: FileQuestion },
  { to: '/performance', label: 'Performance', icon: BarChart3 },
  { to: '/classes', label: 'My Classes', icon: GraduationCap },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === 'teacher' ? teacherNav : studentNav;

  return (
    <div className="min-h-screen flex bg-[#F7F6FC]">
      <aside className="w-64 shrink-0 bg-white border-r border-black/5 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-black/5">
          <img src={logo} alt="Quizify" className="w-9 h-9 rounded-lg object-cover" />
          <span className="font-display font-bold text-lg bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
            Quizify
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-card'
                    : 'text-ink/60 hover:bg-brand-50 hover:text-brand-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {user?.role === 'student' && (
          <div className="px-3 pb-3">
            <button onClick={() => navigate('/take-ai-quiz')} className="btn-primary w-full">
              <Sparkles size={16} /> Start AI Quiz
            </button>
          </div>
        )}

        <div className="px-3 pb-4 border-t border-black/5 pt-3">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-ink/50 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="mt-1 flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-ink/60 hover:bg-red-50 hover:text-danger transition"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
    </div>
  );
}
