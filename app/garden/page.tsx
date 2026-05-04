"use client";

import { useEffect, useState } from "react";
import AuthButton from "@/components/AuthButton";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { COLLECT_COOLDOWN_SECONDS, PLANT_COST, rollFlower } from "@/lib/game";

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  seeds: number;
  last_collected_at: string | null;
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
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setLoading(false);
        return;
      }

      let { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileData) {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username:
              user.user_metadata?.preferred_username ||
              user.user_metadata?.name ||
              "mystery_gardener",
            seeds: 0,
          })
          .select()
          .single();

        profileData = newProfile;
      }

      const { data: flowerData } = await supabase
        .from("player_flowers")
        .select("*")
        .eq("user_id", user.id);

      setProfile(profileData);
      setFlowers(flowerData || []);
      setLoading(false);
    }

    load();
  }, []);

  async function collectSeeds() {
    if (!profile) return;

    const amount = Math.floor(Math.random() * 6) + 5;
    const newSeeds = profile.seeds + amount;

    await supabase
      .from("profiles")
      .update({ seeds: newSeeds })
      .eq("id", profile.id);

    setProfile({ ...profile, seeds: newSeeds });
    setMessage(`🌱 You found ${amount} seeds.`);
  }

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

    setMessage(`🌸 You grew a ${flower.rarity} ${flower.name}!`);
  }

  if (loading) {
    return <div className="p-10 text-white">Loading...</div>;
  }

  if (!profile) {
    return (
      <main className="p-10 text-white text-center">
        <h1 className="text-3xl mb-4">Enter the Garden 🌸</h1>
        <AuthButton />
      </main>
    );
  }

  return (
    <main className="p-10 text-white">

      {/* HEADER WITH LOGIN/LOGOUT */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Your Garden 🌱</h1>
          <p>Seeds: {profile.seeds}</p>
        </div>

        <AuthButton />
      </div>

      {/* ACTIONS */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={collectSeeds}
          className="bg-pink-500 px-4 py-2 rounded"
        >
          Collect Seeds
        </button>

        <button
          onClick={plantSeed}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          Plant Seed ({PLANT_COST})
        </button>
      </div>

      {/* MESSAGE */}
      <div className="mb-6">{message}</div>

      {/* FLOWERS */}
      <div className="grid grid-cols-4 gap-4">
        {flowers.map((flower) => (
          <div
            key={flower.id}
            className="h-20 flex items-center justify-center bg-black/40 rounded"
          >
            {flower.emoji}
          </div>
        ))}
      </div>

    </main>
  );
}