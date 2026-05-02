"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthButton() {
  const supabase = getSupabaseClient();
  const [emailOrName, setEmailOrName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setEmailOrName(user?.user_metadata?.preferred_username || user?.email || null);
    });
  }, [supabase]);

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "twitch",
      options: {
       redirectTo: "https://lady-pea-garden.vercel.app/garden"
      }
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (!emailOrName) {
    return (
      <button onClick={signIn} className="rounded-full bg-purple-400 px-5 py-2 font-bold text-slate-950">
        Login with Twitch
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-pink-100">Logged in as {emailOrName}</span>
      <button onClick={signOut} className="rounded-full border border-white/20 px-4 py-2 text-sm">
        Logout
      </button>
    </div>
  );
}
