"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Event = {
  id: string;
  event_type: string;
  username: string | null;
  message: string | null;
  rarity: string | null;
  flower_name: string | null;
  emoji: string | null;
  created_at: string;
};

export default function OverlayPage() {
  const supabase = getSupabaseClient();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    document.body.style.background = "transparent";

    supabase
      .from("stream_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setEvent(data[0]);
      });

    const channel = supabase
      .channel("stream_events_overlay")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "stream_events" }, (payload) => {
        setEvent(payload.new as Event);
        setTimeout(() => setEvent(null), 9000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!event) return null;

  const isRare = ["Rare", "Epic", "Legendary", "Mythic"].includes(event.rarity || "");

  return (
    <main className="pointer-events-none flex min-h-screen items-end justify-center bg-transparent p-10">
      <div className={`rounded-[2rem] border p-6 text-center shadow-glow backdrop-blur ${
        isRare ? "border-pink-200 bg-black/55" : "border-white/20 bg-black/35"
      }`}>
        <div className="text-6xl">{event.emoji || "🌱"}</div>
        <div className="mt-3 text-3xl font-black text-white">{event.message}</div>
        {isRare && <div className="mt-2 text-xl font-bold text-pink-200">Rare bloom alert!</div>}
      </div>
    </main>
  );
}
