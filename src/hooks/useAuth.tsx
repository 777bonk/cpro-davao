import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Profile = {
  id:         string;
  customerId: string;
  full_name:  string;
  name:       string;
  role:       string;
  avatar_url: string | null;
  email:      string;
  provider:   string;
  created_at: string;
};

type AuthContextType = {
  session:   Session | null;
  user:      User | null;
  profile:   Profile | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session:   null,
  user:      null,
  profile:   null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session,   setSession]   = useState<Session | null>(null);
  const [user,      setUser]      = useState<User | null>(null);
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

const fetchProfile = async (supabaseUser: User) => {
  try {
    const API = import.meta.env.VITE_API_BASE_URL;

    // Fetch profile first to get role
    const profileRes  = await fetch(`${API}/profiles/by-email/${encodeURIComponent(supabaseUser.email ?? '')}`);
    const profileData = profileRes.ok ? await profileRes.json() : null;
    const role        = profileData?.role ?? 'customer';

    // Only fetch/create customer data if role is customer
    let customerData = null;
    if (role === 'customer') {
      // Try to find existing customer record
      const res = await fetch(`${API}/customers/by-email/${encodeURIComponent(supabaseUser.email ?? '')}`);
      if (res.ok) {
        const text = await res.text();
        customerData = text ? JSON.parse(text) : null;
      }

      // ── AUTO-CREATE customer record if it doesn't exist ──────────────────
      if (!customerData || !customerData.id) {
        const fullName =
          profileData?.full_name ??
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.user_metadata?.name ??
          supabaseUser.email?.split('@')[0] ??
          'Customer';

        const createRes = await fetch(`${API}/customers`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:   fullName,
            email:  supabaseUser.email,
            status: 'Active',
          }),
        });

        if (createRes.ok) {
          customerData = await createRes.json();
          console.log('Auto-created customer record:', customerData.id);
        }
      }
    }

    localStorage.setItem("supabase_profile_role", role);

    setProfile({
      id:         supabaseUser.id,
      customerId: customerData?.id ?? supabaseUser.id,
      full_name:  profileData?.full_name ?? supabaseUser.user_metadata?.full_name ?? '',
      name:       profileData?.full_name ?? supabaseUser.user_metadata?.full_name ?? '',
      role,
      avatar_url: profileData?.avatar_url ?? null,
      email:      supabaseUser.email ?? '',
      provider:   supabaseUser.app_metadata?.provider ?? '',
      created_at: supabaseUser.created_at,
    });
  } catch (err) {
    console.error('fetchProfile threw:', err);
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
          localStorage.removeItem("supabase_profile_role");
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