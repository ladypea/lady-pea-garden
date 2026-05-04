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
  created_at: string;
};

function getRecycleSeeds(rarity: string): number {
  switch (rarity) {
    case "Common": return 2;
    case "Uncommon": return 5;
    case "Rare": return 12;
    case "Epic": return 30;
    case "Legendary": return 75;
    case "Mythic": return 150;
    default: return 1;
  }
}

function getGlow(rarity: string): string {
  switch (rarity) {
    case "Rare": return "shadow-[0_0_22px_rgba(96,165,250,0.65)]";
    case "Epic": return "shadow-[0_0_26px_rgba(168,85,247,0.75)]";
    case "Legendary": return "shadow-[0_0_32px_rgba(250,204,21,0.85)]";
    case "Mythic": return "shadow-[0_0_38px_rgba(236,72,153,0.9)]";
    default: return "shadow-[0_0_14px_rgba(0,0,0,0.45)]";
  }
}

function getMessageStyle(message: string): string {
  if (message.includes("Mythic") || message.includes("Cosmic Marble Flower")) {
    return "border-pink-300/70 bg-pink-500/20 shadow-[0_0_38px_rgba(236,72,153,0.75)]";
  }
  if (message.includes("Legendary")) {
    return "border-yellow-300/70 bg-yellow-500/20 shadow-[0_0_34px_rgba(250,204,21,0.7)]";
  }
  if (message.includes("Epic")) {
    return "border-purple-300/70 bg-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.65)]";
  }
  if (message.includes("Rare")) {
    return "border-blue-300/70 bg-blue-500/20 shadow-[0_0_26px_rgba(96,165,250,0.55)]";
  }
  return "border-pink-300/35 bg-black/45 shadow-[0_0_25px_rgba(236,72,153,0.25)]";
}

export default function GardenPage() {
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [flowers, setFlowers] = useState<PlayerFlower[]>([]);
  const [message, setMessage] = useState("Welcome to the garden.");
  const [loading, setLoading] = useState(true);
  const [burst, setBurst] = useState(false);

  async function loadGarden() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileData) {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username:
            user.user_metadata?.preferred_username ||
            user.user_metadata?.name ||
            "mystery_gardener",
          avatar_url: user.user_metadata?.avatar_url || null,
          seeds: 0,
        })
        .select("*")
        .single();

      profileData = newProfile;
      profileError = insertError;
    }

    if (profileError || !profileData) {
      console.error("Profile error:", profileError);
      setMessage("Could not load your garden profile.");
      setLoading(false);
      return;
    }

    const { data: flowerData } = await supabase
      .from("player_flowers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setProfile(profileData);
    setFlowers(flowerData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadGarden();
  }, []);

  async function collectSeeds() {
    if (!profile) return;

    if (profile.last_collected_at) {
      const last = new Date(profile.last_collected_at).getTime();
      const now = Date.now();
      const diffSeconds = Math.floor((now - last) / 1000);

      if (diffSeconds < COLLECT_COOLDOWN_SECONDS) {
        setMessage(`The soil is resting. Try again in ${COLLECT_COOLDOWN_SECONDS - diffSeconds}s.`);
        return;
      }
    }

    const amount = Math.floor(Math.random() * 6) + 5;
    const newSeeds = profile.seeds + amount;

    await supabase
      .from("profiles")
      .update({
        seeds: newSeeds,
        last_collected_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setProfile({
      ...profile,
      seeds: newSeeds,
      last_collected_at: new Date().toISOString(),
    });

    setMessage(`🌱 You found ${amount} seeds in the garden.`);
  }

  async function plantSeed() {
    if (!profile) return;

    if (profile.seeds < PLANT_COST) {
      setMessage(`You need ${PLANT_COST} seeds to plant. The garden demands snacks.`);
      return;
    }

    const flower = rollFlower();
    const newSeeds = profile.seeds - PLANT_COST;

    await supabase.from("profiles").update({ seeds: newSeeds }).eq("id", profile.id);

    const { data: inserted } = await supabase
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

    await supabase.from("stream_events").insert({
      event_type: "flower_planted",
      username: profile.username,
      message: `${profile.username} grew a ${flower.rarity} ${flower.name}!`,
      rarity: flower.rarity,
      flower_name: flower.name,
      emoji: flower.emoji,
    });

    setProfile({ ...profile, seeds: newSeeds });
    setFlowers(inserted ? [inserted, ...flowers] : flowers);

    setBurst(true);
    setTimeout(() => setBurst(false), 900);

    if (flower.name === "Cosmic Marble Flower") {
      setMessage("🌌 COSMIC MARBLE FLOWER! The whole garden starts glowing!");
    } else {
      setMessage(`${flower.emoji} You grew a ${flower.rarity} ${flower.name}!`);
    }
  }

  async function recycleFlower(flower: PlayerFlower) {
    if (!profile) return;

    const seedReward = getRecycleSeeds(flower.rarity);
    const newSeeds = profile.seeds + seedReward;

    const { error: deleteError } = await supabase
      .from("player_flowers")
      .delete()
      .eq("id", flower.id)
      .eq("user_id", profile.id);

    if (deleteError) {
      setMessage(`Could not recycle ${flower.flower_name}. Try again.`);
      return;
    }

    await supabase.from("profiles").update({ seeds: newSeeds }).eq("id", profile.id);

    setProfile({ ...profile, seeds: newSeeds });
    setFlowers(flowers.filter((f) => f.id !== flower.id));
    setMessage(`You recycled ${flower.flower_name} into ${seedReward} seeds.`);
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl px-5 py-16 text-white">Loading garden...</main>;
  }

  if (!profile) {
    return (
      <main className="relative z-10 mx-auto max-w-3xl px-5 py-16 text-white">
        <div className="rounded-[2rem] border border-pink-300/25 bg-black/55 p-8 text-center shadow-[0_0_45px_rgba(236,72,153,0.25)] backdrop-blur-xl">
          <h1 className="text-4xl font-black text-pink-200">Enter the Garden</h1>
          <p className="mb-6 mt-3 text-pink-100/80">
            Login with Twitch to collect seeds and grow flowers.
          </p>
          <AuthButton />
        </div>
      </main>
    );
  }

  const floatingItems = [
    { icon: "🦋", left: "8vw", top: "20vh", delay: "0s" },
    { icon: "✨", left: "22vw", top: "70vh", delay: "1s" },
    { icon: "🌸", left: "38vw", top: "35vh", delay: "2s" },
    { icon: "🐝", left: "55vw", top: "60vh", delay: "3s" },
    { icon: "🍃", left: "72vw", top: "25vh", delay: "4s" },
    { icon: "🌼", left: "88vw", top: "75vh", delay: "5s" },
    { icon: "🌷", left: "15vw", top: "50vh", delay: "6s" },
    { icon: "🦋", left: "65vw", top: "12vh", delay: "7s" },
  ];

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {floatingItems.map((item, i) => (
          <span
            key={i}
            className="butterfly"
            style={{
              left: item.left,
              top: item.top,
              animationDelay: item.delay,
            }}
          >
            {item.icon}
          </span>
        ))}
      </div>

      {burst && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="plant-burst">✨</div>
          <div className="plant-burst plant-burst-two">🌸</div>
          <div className="plant-burst plant-burst-three">🌱</div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-8 text-white">
        <div className="mb-6 rounded-[2rem] border border-pink-300/25 bg-black/55 p-6 shadow-[0_0_45px_rgba(236,72,153,0.2)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-pink-200 drop-shadow">
                Your Garden 🌱
              </h1>
              <p className="mt-2 text-xl text-pink-100">
                🪴 Seeds:{" "}
                <span className="font-black text-pink-300">{profile.seeds}</span>
              </p>
            </div>

            <AuthButton />
          </div>

          <div
            className={`mt-6 rounded-2xl border p-5 text-xl font-bold text-pink-50 backdrop-blur-lg transition-all ${getMessageStyle(message)}`}
          >
            {message}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[0.85fr_1.85fr]">
          <section className="rounded-[1.5rem] border border-pink-300/20 bg-black/55 p-5 shadow-[0_0_35px_rgba(236,72,153,0.18)] backdrop-blur-xl">
            <h2 className="text-2xl font-black text-pink-200">🌸 Garden Actions</h2>

            <div className="mt-5 flex flex-col gap-4">
              <button
                onClick={collectSeeds}
                className="rounded-xl bg-gradient-to-r from-pink-400 to-pink-600 px-5 py-4 text-left font-black text-white shadow-[0_0_25px_rgba(236,72,153,0.45)] transition hover:scale-[1.02]"
              >
                <span className="mr-3">🌱</span>
                Collect Seeds
                <div className="text-sm font-medium text-white/80">Find seeds in the garden</div>
              </button>

              <button
                onClick={plantSeed}
                className="rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 px-5 py-4 text-left font-black text-white shadow-[0_0_25px_rgba(96,165,250,0.4)] transition hover:scale-[1.02]"
              >
                <span className="mr-3">🪴</span>
                Plant Seed ({PLANT_COST} seeds)
                <div className="text-sm font-medium text-white/80">Grow a mystery flower</div>
              </button>

              <div className="rounded-xl border border-pink-300/20 bg-black/35 p-4 text-pink-100">
                Collect seeds, plant them, and fill your garden with beautiful flowers! 💗
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-pink-300/20 bg-black/55 p-5 shadow-[0_0_35px_rgba(236,72,153,0.18)] backdrop-blur-xl">
            <h2 className="text-2xl font-black text-pink-200">🌸 Visual Garden</h2>
            <p className="mt-1 text-sm text-pink-100/75">
              Your planted flowers blooming in the patch.
            </p>

            {flowers.length === 0 ? (
              <p className="mt-5 text-pink-100/70">Your garden patch is empty.</p>
            ) : (
              <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6">
                {flowers.slice(0, 24).map((flower) => (
                  <div
                    key={flower.id}
                    title={`${flower.rarity} ${flower.flower_name}`}
                    className={`flex h-20 items-center justify-center rounded-xl border border-pink-300/25 bg-black/45 text-4xl transition hover:scale-110 ${getGlow(flower.rarity)}`}
                  >
                    {flower.emoji}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-5 rounded-[1.5rem] border border-pink-300/20 bg-black/55 p-5 shadow-[0_0_35px_rgba(236,72,153,0.18)] backdrop-blur-xl">
          <h2 className="text-2xl font-black text-pink-200">🌸 Flower Inventory</h2>
          <p className="mt-1 text-sm text-pink-100/75">
            Your collection of discovered flowers.
          </p>

          {flowers.length === 0 ? (
            <p className="mt-5 text-pink-100/70">
              No flowers yet. Tiny tragic empty pot energy.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {flowers.map((flower) => (
                <div
                  key={flower.id}
                  className={`rounded-xl border border-pink-300/25 bg-black/50 p-4 text-center shadow-[0_0_20px_rgba(0,0,0,0.45)] ${getGlow(flower.rarity)}`}
                >
                  <div className="text-4xl">{flower.emoji}</div>
                  <div className="mt-2 font-black text-white">{flower.flower_name}</div>
                  <div className="text-sm text-pink-100/75">{flower.rarity}</div>
                  <div className="text-sm text-pink-100/75">Value: {flower.value}</div>

                  <button
                    onClick={() => recycleFlower(flower)}
                    className="mt-3 rounded-lg border border-pink-400/70 px-3 py-1 text-sm font-bold text-pink-200 transition hover:bg-pink-400/10"
                  >
                    Recycle ({getRecycleSeeds(flower.rarity)})
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 text-center text-3xl font-black text-pink-200 drop-shadow-[0_0_12px_rgba(236,72,153,0.7)]">
          Grow. Collect. Bloom. ✨
        </div>
      </main>
    </>
  );
}