import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Quest from './pages/Quest.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Profile from './pages/Profile.jsx';
import Stats from './pages/Stats.jsx';

// โครง route ตาม deploy-plan.md — หน้าจริงจะมาจาก components ของเพื่อน (design-brief-ui.md)
// การเสียบ auth guard / state / API ทำใน ticket #09 (integrate-ui)
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/quest" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/quest" element={<Quest />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/stats/:handle" element={<Stats />} />
      <Route path="*" element={<Navigate to="/quest" replace />} />
    </Routes>
  );
}
