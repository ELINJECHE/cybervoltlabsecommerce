"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { LOYALTY_V2, type WelcomeVoucher } from "@/lib/loyalty";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  pointsBalance: number;
  refreshPoints: () => Promise<void>;
  /** The customer's one-time welcome voucher (null until loaded, or when rewards are off). */
  welcomeVoucher: WelcomeVoucher | null;
  refreshVoucher: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [welcomeVoucher, setWelcomeVoucher] = useState<WelcomeVoucher | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function refreshAdminStatus() {
    if (!supabaseEnabled || !user) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    setIsAdmin(Boolean(data?.is_admin));
  }

  async function refreshPoints() {
    if (!supabaseEnabled || !user) {
      setPointsBalance(0);
      return;
    }
    const { data } = await supabase
      .from("points_balances")
      .select("balance")
      .eq("customer_id", user.id)
      .maybeSingle();
    setPointsBalance(data?.balance ?? 0);
  }

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Asking for the voucher creates it the first time and just returns it afterwards.
  async function refreshVoucher() {
    if (!LOYALTY_V2 || !supabaseEnabled || !user) {
      setWelcomeVoucher(null);
      return;
    }
    const { data, error } = await supabase.rpc("ensure_welcome_voucher");
    if (error) {
      console.error("[CV-LOY-01] welcome voucher:", error.message);
      setWelcomeVoucher(null);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setWelcomeVoucher(row ? { amount: row.amount, minOrder: row.min_order, used: Boolean(row.used) } : null);
  }

  useEffect(() => {
    refreshPoints();
    refreshVoucher();
    refreshAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function signUp(email: string, password: string, fullName: string, phone: string) {
    if (!supabaseEnabled) return { error: "Accounts aren't set up yet — check back soon." };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    return { error: error?.message ?? null };
  }

  async function signIn(email: string, password: string) {
    if (!supabaseEnabled) return { error: "Accounts aren't set up yet — check back soon." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (!supabaseEnabled) return;
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string) {
    if (!supabaseEnabled) return { error: "Accounts aren't set up yet — check back soon." };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/reset-password`,
    });
    return { error: error?.message ?? null };
  }

  async function updatePassword(newPassword: string) {
    if (!supabaseEnabled) return { error: "Accounts aren't set up yet — check back soon." };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        pointsBalance,
        refreshPoints,
        welcomeVoucher,
        refreshVoucher,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
