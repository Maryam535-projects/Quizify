import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AiLab from './pages/AiLab';
import Evaluations from './pages/Evaluations';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Analytics from './pages/Analytics';
import Quizzes from './pages/Quizzes';
import TakeQuiz from './pages/TakeQuiz';
import Results from './pages/Results';

function DashboardRouter() {
  const { user } = useAuth();
  return user?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
}

function withLayout(element) {
  return <ProtectedRoute><Layout>{element}</Layout></ProtectedRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={withLayout(<DashboardRouter />)} />
      <Route path="/classes" element={withLayout(<Classes />)} />
      <Route path="/quizzes" element={withLayout(<Quizzes />)} />
      <Route path="/take-quiz/:quizId" element={withLayout(<TakeQuiz />)} />
      <Route path="/results/:attemptId" element={withLayout(<Results />)} />
      <Route path="/performance" element={withLayout(<Analytics />)} />

      <Route path="/ai-lab" element={<ProtectedRoute role="teacher"><Layout><AiLab /></Layout></ProtectedRoute>} />
      <Route path="/evaluations" element={<ProtectedRoute role="teacher"><Layout><Evaluations /></Layout></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute role="teacher"><Layout><Students /></Layout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute role="teacher"><Layout><Analytics /></Layout></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
