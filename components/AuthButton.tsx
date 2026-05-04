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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

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

  // 🌸 NOT LOGGED IN
  if (!user) {
    return (
      <button
        onClick={login}
        className="rounded-xl border border-pink-300/40 bg-black/40 px-5 py-2 font-bold text-pink-200 backdrop-blur-lg transition hover:bg-pink-400/10 hover:shadow-[0_0_18px_rgba(236,72,153,0.5)]"
      >
        Login with Twitch
      </button>
    );
  }

  // 🌿 LOGGED IN
  return (
    <div className="flex items-center gap-3 rounded-xl border border-pink-300/25 bg-black/40 px-4 py-2 backdrop-blur-lg shadow-[0_0_20px_rgba(236,72,153,0.2)]">

      <span className="text-sm text-pink-100">
        Logged in 🌱
      </span>

      <button
        onClick={logout}
        className="rounded-lg border border-pink-400/60 px-3 py-1 text-sm font-bold text-pink-200 transition hover:bg-pink-400/15 hover:shadow-[0_0_12px_rgba(236,72,153,0.6)]"
      >
        Logout
      </button>
    </div>
  );
}