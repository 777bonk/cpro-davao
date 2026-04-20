import { supabase } from '../lib/supabase';

export const authService = {
  // 1. Email & Password Registration
  async register(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // This triggers your SQL function above!
      },
    });
    if (error) throw error;
    return email;
  },

  // 2. Email & Password Login
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return email;
  },

  // 3. Social Login (Google & Facebook)
  // 3. Social Login (Google & Facebook)
  async loginWithProvider(provider: 'google' | 'facebook') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Send everyone to the traffic controller first!
        redirectTo: `${window.location.origin}/dashboard`, 
      }
    });
    if (error) throw error;
    return data;
  },

  // 4. Secure Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};