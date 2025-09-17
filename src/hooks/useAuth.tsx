import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleType } from '@/lib/enums';

interface Profile {
  id: string;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  department: string | null;
  designation: string | null;
  current_status: string;
  role: {
    role_name: UserRoleType;
    role_description: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const attempt = async () => {
        // First attempt: join with roles
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            employee_code,
            first_name,
            last_name,
            phone,
            department,
            designation,
            current_status,
            role:roles(role_name, role_description)
          `)
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.warn('Profile join fetch failed, will try fallback:', error);
        }

        if (data) {
          return data as Profile;
        }

        // Fallback: fetch base profile + role via role_id
        const { data: base, error: baseErr } = await supabase
          .from('profiles')
          .select('id, employee_code, first_name, last_name, phone, department, designation, current_status, role_id')
          .eq('id', userId)
          .maybeSingle();

        if (baseErr) {
          console.error('Base profile fetch failed:', baseErr);
          return null;
        }

        if (!base) {
          console.warn('No profile row found for user:', userId);
          return null;
        }

        let role: Profile['role'] = null;
        if ((base as any).role_id) {
          const { data: roleRow, error: roleErr } = await supabase
            .from('roles')
            .select('role_name, role_description')
            .eq('id', (base as any).role_id)
            .maybeSingle();
          if (roleErr) {
            console.warn('Role fetch failed:', roleErr);
          } else if (roleRow) {
            role = { role_name: roleRow.role_name as any, role_description: roleRow.role_description ?? null };
          }
        }

        const assembled: Profile = {
          id: base.id,
          employee_code: base.employee_code,
          first_name: base.first_name,
          last_name: base.last_name,
          phone: base.phone,
          department: base.department,
          designation: base.designation,
          current_status: base.current_status,
          role,
        };
        return assembled;
      };

      const delays = [0, 200, 1000];
      for (let i = 0; i < delays.length; i++) {
        if (delays[i]) await new Promise(res => setTimeout(res, delays[i]));
        const result = await attempt();
        if (result) return result;
      }
      return null;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Listen for auth changes FIRST (synchronous callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer any Supabase calls to avoid deadlocks
        setTimeout(() => {
          refreshProfile();
        }, 0);
      } else {
        setProfile(null);
      }
    });

    // Get initial session and await profile fetch
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('Fetching profile for user:', session.user.id);
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          if (!profileData) {
            console.warn('No profile found for user:', session.user.id);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      // Always clear local state first
      setUser(null);
      setProfile(null);
      setLoading(false);
      
      // Attempt server-side logout, but don't throw if it fails
      const { error } = await supabase.auth.signOut();
      if (error && error.message !== 'Session from session_id claim in JWT does not exist') {
        console.warn('Sign out error (non-critical):', error);
      }
      
      console.log('Sign out completed');
    } catch (error) {
      // Even if server-side logout fails, we've cleared local state
      console.warn('Sign out error (handled):', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};