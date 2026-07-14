import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// โครง hook auth — Google Sign-in อย่างเดียว (deploy-plan.md sec.7)
// guard/onboarding routing เสียบเต็มใน ticket #09
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      // ต้องส่ง redirectTo เสมอ ไม่งั้นเด้งกลับ Site URL (localhost จะพัง) — deploy-plan.md sec.7
      options: { redirectTo: window.location.origin },
    });

  const signOut = () => supabase.auth.signOut();

  return { session, user: session?.user ?? null, loading, signInWithGoogle, signOut };
}
