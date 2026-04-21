import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Profile = {
  id:         string;
  customerId: string;
  full_name:  string;
  name:       string;   // ← add this, used in CustomerSettings
  role:       string;
  avatar_url: string | null;
  email:      string;
  provider:   string;
  created_at: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession]   = useState<Session | null>(null);
  const [user,    setUser]      = useState<User | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

 const fetchProfile = async (supabaseUser: User) => {
  try {
    const email = supabaseUser.email ?? '';
    const API = import.meta.env.VITE_API_BASE_URL;

    // Use NestJS instead of direct Supabase — bypasses RLS entirely
    const res = await fetch(`${API}/customers/by-email/${encodeURIComponent(email)}`);
    const customerData = res.ok ? await res.json() : null;

    // Auto-create customers row for OAuth/new users
    if (!customerData) {
      const createRes = await fetch(`${API}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:   supabaseUser.user_metadata?.full_name ?? email,
          email:  email,
          status: 'Active',
        }),
      });
      const newCustomer = createRes.ok ? await createRes.json() : null;

      setProfile({
        id:         supabaseUser.id,
        customerId: newCustomer?.id ?? supabaseUser.id,
        full_name:  newCustomer?.name ?? supabaseUser.user_metadata?.full_name ?? '',
        name:       newCustomer?.name ?? supabaseUser.user_metadata?.full_name ?? '',
        role:       'customer',
        avatar_url: supabaseUser.user_metadata?.avatar_url ?? null,
        email:      email,
        provider:   supabaseUser.app_metadata?.provider ?? '',
        created_at: supabaseUser.created_at,
      });
      return;
    }

    setProfile({
      id:         supabaseUser.id,
      customerId: customerData?.id ?? supabaseUser.id,
      full_name:  customerData?.name ?? '',
      name:       customerData?.name ?? '',
      role:       'customer',
      avatar_url: supabaseUser.user_metadata?.avatar_url ?? null,
      email:      email,
      provider:   supabaseUser.app_metadata?.provider ?? '',
      created_at: supabaseUser.created_at,
    });
  } catch (err) {
    console.error('fetchProfile threw:', err);
    // Fallback to auth metadata so UI never stays blank
    setProfile({
      id:         supabaseUser.id,
      customerId: supabaseUser.id,
      full_name:  supabaseUser.user_metadata?.full_name ?? '',
      name:       supabaseUser.user_metadata?.full_name ?? '',
      role:       'customer',
      avatar_url: null,
      email:      supabaseUser.email ?? '',
      provider:   supabaseUser.app_metadata?.provider ?? '',
      created_at: supabaseUser.created_at,
    });
  }
};
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);