"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthButton() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login() {
    await supabase.auth.signInWithOAuth({
      provider: "twitch",
      options: {
        redirectTo: `${window.location.origin}/garden`,
      },
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (!user) {
    return (
      <button
        onClick={login}
        className="rounded-xl bg-purple-500 px-4 py-2 font-bold text-white"
      >
        Login with Twitch
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/80">
        Logged in 🌱
      </span>

      <button
        onClick={logout}
        className="rounded-xl bg-red-500 px-3 py-1 text-white"
      >
        Logout
      </button>
    </div>
  );
}