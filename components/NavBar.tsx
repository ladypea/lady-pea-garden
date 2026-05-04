"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

const ADMIN_IDS = ["a71e2a83-b48f-438d-bf2c-2b96b36d9216"];

export default function NavBar() {
  const supabase = getSupabaseClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user && ADMIN_IDS.includes(user.id)) {
        setIsAdmin(true);
      }
    }

    checkAdmin();
  }, []);

  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link href="/" className="text-xl font-black tracking-tight">
        🌱 Lady Pea&apos;s Garden
      </Link>

      <div className="flex gap-4 text-sm text-pink-100">
        <Link href="/garden">Garden</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/overlay">Overlay</Link>

        {/* 👑 ONLY YOU SEE THIS */}
        {isAdmin && <Link href="/admin">Admin</Link>}
      </div>
    </nav>
  );
}