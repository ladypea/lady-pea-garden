"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const ADMIN_IDS = [
  "a71e2a83-b48f-438d-bf2c-2b96b36d9216"
];

const EVENTS = [
  { type: "rain_boost", label: "Rain Boost", emoji: "🌧️", text: "Rain Boost has begun. The garden is drinking drama." },
  { type: "seed_storm", label: "Seed Storm", emoji: "🌪️", text: "Seed Storm! Seeds are flying everywhere." },
  { type: "dingle_blessing", label: "Dingle Blessing", emoji: "🌿", text: "Dingle Blessing activated. The bamboo has spoken." },
  { type: "jubear_raid", label: "Jubear Raid", emoji: "🐻", text: "Jubear has entered the garden. Hide your seeds." }
];

export default function AdminPage() {
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState("Checking admin access...");
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user || !ADMIN_IDS.includes(user.id)) {
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      setIsAllowed(true);
      setStatus("Streamer controls.");
      setLoading(false);
    }

    checkAccess();
  }, [supabase]);

  async function triggerEvent(eventType: string, message: string, emoji: string) {
    if (!isAllowed) return;

    const { error } = await supabase.from("stream_events").insert({
      event_type: eventType,
      username: "Lady Pea",
      message,
      emoji
    });

    setStatus(error ? error.message : `Triggered: ${message}`);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        Checking access...
      </main>
    );
  }

  if (!isAllowed) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur">
          <h1 className="text-4xl font-black">🚫 Access Denied</h1>
          <p className="mt-4 text-pink-100/80">
            The garden spirits do not recognize you.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-4xl font-black">Admin Garden Controls</h1>
      <p className="mt-3 text-pink-100/80">{status}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {EVENTS.map((event) => (
          <button
            key={event.type}
            onClick={() => triggerEvent(event.type, `${event.emoji} ${event.text}`, event.emoji)}
            className="rounded-[2rem] border border-white/10 bg-white/10 p-6 text-left shadow-glow backdrop-blur"
          >
            <div className="text-4xl">{event.emoji}</div>
            <div className="mt-3 text-2xl font-black">{event.label}</div>
            <div className="mt-2 text-pink-100/70">{event.text}</div>
          </button>
        ))}
      </div>
    </main>
  );
}