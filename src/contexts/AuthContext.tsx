import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** The persistent role stored in the database (customer/provider/worker) */
  role: string | null;
  /** The current UI view - can differ from role when provider/worker views as customer */
  activeView: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Switch the UI view without changing the DB role */
  switchView: (view: string) => void;
  /** Permanently change the DB role (used during registration or revocation) */
  setDbRole: (newRole: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  activeView: null,
  loading: true,
  signOut: async () => {},
  switchView: () => {},
  setDbRole: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    const dbRole = data?.role || "customer";
    setRole(dbRole);
    setActiveView(dbRole);
  };

  const switchView = (view: string) => {
    setActiveView(view);
  };

  const setDbRole = async (newRole: string) => {
    if (!session?.user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("user_id", session.user.id);
    
    if (!error) {
      setRole(newRole);
      setActiveView(newRole);
    } else {
      console.error("Error updating role:", error);
      throw error;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      setSession(session);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
        setActiveView(null);
      }
      setLoading(false);
    });

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          fetchRole(session.user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    setActiveView(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, role, activeView, loading, signOut, switchView, setDbRole }}>
      {children}
    </AuthContext.Provider>
  );
};
