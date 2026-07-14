import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoginPage from '../components/LoginPage.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [status, setStatus] = useState('normal');

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleLogin = async () => {
    setStatus('loading');
    const { error } = await signInWithGoogle();
    // สำเร็จ: Supabase เด้งออกไปหน้า Google แล้วพากลับมาเองที่ redirectTo (window.location.origin)
    if (error) setStatus('error');
  };

  return <LoginPage showStateToggle={false} status={status} onLogin={handleLogin} />;
}
