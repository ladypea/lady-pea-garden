"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const EVENTS = [
  { type: "rain_boost", label: "Rain Boost", emoji: "🌧️", text: "Rain Boost has begun. The garden is drinking drama." },
  { type: "seed_storm", label: "Seed Storm", emoji: "🌪️", text: "Seed Storm! Seeds are flying everywhere." },
  { type: "dingle_blessing", label: "Dingle Blessing", emoji: "🌿", text: "Dingle Blessing activated. The bamboo has spoken." },
  { type: "jubear_raid", label: "Jubear Raid", emoji: "🐻", text: "Jubear has entered the garden. Hide your seeds." }
];

export default function AdminPage() {
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState("Streamer controls.");

  async function triggerEvent(eventType: string, message: string, emoji: string) {
    const { error } = await supabase.from("stream_events").insert({
      event_type: eventType,
      username: "Lady Pea",
      message,
      emoji
    });

    setStatus(error ? error.message : `Triggered: ${message}`);
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

      <p className="mt-8 rounded-2xl border border-yellow-200/30 bg-yellow-300/10 p-4 text-sm text-yellow-100">
        Note: For a real launch, protect this page so only you can use it.
      </p>
    </main>
  );
}
