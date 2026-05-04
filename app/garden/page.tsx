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
    case "Common":
      return 2;
    case "Uncommon":
      return 5;
    case "Rare":
      return 12;
    case "Epic":
      return 30;
    case "Legendary":
      return 75;
    case "Mythic":
      return 150;
    default:
      return 1;
  }
}

function getRarityGlow(rarity: string): string {
  switch (rarity) {
    case "Uncommon":
      return "shadow-[0_0_18px_rgba(34,197,94,0.45)]";
    case "Rare":
      return "shadow-[0_0_20px_rgba(96,165,250,0.55)]";
    case "Epic":
      return "shadow-[0_0_24px_rgba(168,85,247,0.6)]";
    case "Legendary":
      return "shadow-[0_0_28px_rgba(250,204,21,0.75)]";
    case "Mythic":
      return "shadow-[0_0_34px_rgba(236,72,153,0.85)]";
    default:
      return "shadow-sm";
  }
}

function getMessageStyle(message: string): string {
  if (message.includes("Mythic") || message.includes("Cosmic Marble Flower")) {
    return "border-pink-300/60 bg-pink-500/20 shadow-[0_0_35px_rgba(236,72,153,0.7)]";
  }

  if (message.includes("Legendary")) {
    return "border-yellow-300/60 bg-yellow-500/20 shadow-[0_0_32px_rgba(250,204,21,0.65)]";
  }

  if (message.includes("Epic")) {
    return "border-purple-300/60 bg-purple-500/20 shadow-[0_0_28px_rgba(168,85,247,0.55)]";
  }

  if (message.includes("Rare")) {
    return "border-blue-300/60 bg-blue-500/20 shadow-[0_0_24px_rgba(96,165,250,0.5)]";
  }

  return "border-white/10 bg-black/30";
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
      setLoading(false);
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      username:
        user.user_metadata?.preferred_username ||
        user.user_metadata?.name ||
        "mystery_gardener",
      avatar_url: user.user_metadata?.avatar_url || null,
    });

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

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
        setMessage(
          `The soil is resting. Try again in ${
            COLLECT_COOLDOWN_SECONDS - diffSeconds
          }s.`
        );
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

    setMessage(
      `You found ${amount} seeds hiding in the dirt. Suspiciously generous soil.`
    );
  }

  async function plantSeed() {
    if (!profile) return;

    if (profile.seeds < PLANT_COST) {
      setMessage(`You need ${PLANT_COST} seeds to plant. The garden demands snacks.`);
      return;
    }

    const flower = rollFlower();
    const newSeeds = profile.seeds - PLANT_COST;

    await supabase
      .from("profiles")
      .update({ seeds: newSeeds })
      .eq("id", profile.id);

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
      .eq("id", flower.id);

    if (deleteError) {
      setMessage(`Could not recycle ${flower.flower_name}. Try again.`);
      return;
    }

    await supabase
      .from("profiles")
      .update({ seeds: newSeeds })
      .eq("id", profile.id);

    setProfile({ ...profile, seeds: newSeeds });
    setFlowers(flowers.filter((f) => f.id !== flower.id));
    setMessage(
      `You recycled ${flower.flower_name} into ${seedReward} seeds. The garden accepts the offering.`
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16 text-white">
        Loading garden...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-black/50 p-8 text-center shadow-[0_0_40px_rgba(236,72,153,0.2)] backdrop-blur-xl">
          <h1 className="text-4xl font-black">Enter the Garden</h1>
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
    { icon: "✨", left: "48vw", top: "82vh", delay: "8s" },
    { icon: "🌸", left: "82vw", top: "45vh", delay: "9s" },
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

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-[0_0_40px_rgba(236,72,153,0.16)] backdrop-blur-xl">
          <div>
            <h1 className="text-4xl font-black text-white">Your Garden</h1>
            <p className="text-pink-100/80">
              Seeds:{" "}
              <span className="font-bold text-pink-200">{profile.seeds}</span>
            </p>
          </div>
          <AuthButton />
        </div>

        <div className="space-y-5">
          <section className="rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-[0_0_40px_rgba(236,72,153,0.15)] backdrop-blur-xl">
            <h2 className="text-2xl font-black text-white">Visual Garden</h2>
            <p className="mt-2 text-sm text-pink-100/75">
              Your planted flowers blooming in the patch.
            </p>

            {flowers.length === 0 ? (
              <p className="mt-4 text-pink-100/70">
                Your garden patch is empty.
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-4 gap-4 sm:grid-cols-6">
                {flowers.slice(0, 24).map((flower) => (
                  <div
                    key={flower.id}
                    title={`${flower.rarity} ${flower.flower_name}`}
                    className={`flex h-20 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-green-900/30 to-black/60 text-3xl transition hover:scale-110 ${getRarityGlow(
                      flower.rarity
                    )}`}
                  >
                    {flower.emoji}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-5 md:grid-cols-[1fr_1.5fr]">
            <section className="rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-[0_0_40px_rgba(236,72,153,0.15)] backdrop-blur-xl">
              <h2 className="text-2xl font-black text-white">Garden Actions</h2>

              <div
                className={`mt-4 min-h-14 rounded-2xl border p-4 text-pink-50 transition-all ${getMessageStyle(
                  message
                )}`}
              >
                {message}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={collectSeeds}
                  className="rounded-2xl bg-pink-400 px-5 py-4 font-black text-slate-950 shadow-[0_0_20px_rgba(236,72,153,0.35)] transition hover:scale-[1.02]"
                >
                  Collect Seeds
                </button>

                <button
                  onClick={plantSeed}
                  className="rounded-2xl bg-blue-300 px-5 py-4 font-black text-slate-950 shadow-[0_0_20px_rgba(96,165,250,0.3)] transition hover:scale-[1.02]"
                >
                  Plant Seed ({PLANT_COST} seeds)
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-[0_0_40px_rgba(236,72,153,0.15)] backdrop-blur-xl">
              <h2 className="text-2xl font-black text-white">Flower Inventory</h2>

              {flowers.length === 0 ? (
                <p className="mt-4 text-pink-100/70">
                  No flowers yet. Tiny tragic empty pot energy.
                </p>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {flowers.map((flower) => (
                    <div
                      key={flower.id}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_0_18px_rgba(0,0,0,0.35)]"
                    >
                      <div className="text-3xl">{flower.emoji}</div>
                      <div className="mt-2 font-black text-white">
                        {flower.flower_name}
                      </div>
                      <div className="text-sm text-pink-100/70">
                        {flower.rarity} · value {flower.value}
                      </div>

                      <button
                        onClick={() => recycleFlower(flower)}
                        className="mt-3 rounded-xl border border-white/20 px-3 py-2 text-sm font-bold text-pink-100 transition hover:bg-white/10"
                      >
                        Recycle for {getRecycleSeeds(flower.rarity)} seeds
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}