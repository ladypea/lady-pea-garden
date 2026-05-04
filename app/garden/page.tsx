"use client";

import { useEffect, useState } from "react";
import AuthButton from "@/components/AuthButton";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { PLANT_COST, rollFlower } from "@/lib/game";

type Profile = {
  id: string;
  seeds: number;
};

type PlayerFlower = {
  id: string;
  flower_name: string;
  rarity: string;
  emoji: string;
  value: number;
};

export default function GardenPage() {
  const supabase = getSupabaseClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [flowers, setFlowers] = useState<PlayerFlower[]>([]);
  const [message, setMessage] = useState("Welcome to the garden.");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: flowerData } = await supabase
        .from("player_flowers")
        .select("*")
        .eq("user_id", user.id);

      setProfile(profileData);
      setFlowers(flowerData || []);
      setLoading(false);
    }

    loadData();
  }, []);

  async function plantSeed() {
    if (!profile || profile.seeds < PLANT_COST) return;

    const flower = rollFlower();
    const newSeeds = profile.seeds - PLANT_COST;

    await supabase
      .from("profiles")
      .update({ seeds: newSeeds })
      .eq("id", profile.id);

    const { data } = await supabase
      .from("player_flowers")
      .insert({
        user_id: profile.id,
        flower_name: flower.name,
        rarity: flower.rarity,
        emoji: flower.emoji,
        value: flower.value,
      })
      .select()
      .single();

    setProfile({ ...profile, seeds: newSeeds });
    setFlowers([data, ...flowers]);
    setMessage(`${flower.emoji} You grew a ${flower.rarity} ${flower.name}!`);
  }

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <>
      {/* 🌸 FLOATING ICONS */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => {
          const icons = ["🦋", "🐝", "🌸", "✨", "🍃", "🌼", "🌷"];
          const icon = icons[Math.floor(Math.random() * icons.length)];

          return (
            <span
              key={i}
              className="butterfly"
              style={{
                left: `${Math.random() * 100}vw`,
                top: `${Math.random() * 100}vh`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            >
              {icon}
            </span>
          );
        })}
      </div>

      <main className="relative z-10 mx-auto max-w-5xl px-5 py-10 text-white">
        <div className="mb-6 flex justify-between">
          <div>
            <h1 className="text-4xl font-black">Your Garden</h1>
            <p>Seeds: {profile?.seeds}</p>
          </div>
          <AuthButton />
        </div>

        <button
          onClick={plantSeed}
          className="rounded-xl bg-pink-400 px-6 py-3 font-bold text-black"
        >
          Plant Seed ({PLANT_COST})
        </button>

        <div className="mt-6">{message}</div>

        <div className="mt-8 grid grid-cols-4 gap-4">
          {flowers.map((flower) => (
            <div
              key={flower.id}
              className="flex h-20 items-center justify-center rounded-xl bg-black/40"
            >
              {flower.emoji}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}