"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Row = {
  id: string;
  username: string | null;
  seeds: number;
  player_flowers: { value: number }[];
};

export default function LeaderboardPage() {
  const supabase = getSupabaseClient();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, username, seeds, player_flowers(value)")
      .order("seeds", { ascending: false })
      .limit(25)
      .then(({ data }) => setRows((data as Row[]) || []));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-4xl font-black">Garden Leaderboard</h1>
      <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur">
        <table className="w-full">
          <thead className="bg-white/10 text-left text-sm uppercase tracking-widest text-pink-100/70">
            <tr>
              <th className="p-4">Rank</th>
              <th className="p-4">Gardener</th>
              <th className="p-4">Seeds</th>
              <th className="p-4">Flower Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const totalValue = row.player_flowers?.reduce((sum, flower) => sum + flower.value, 0) || 0;
              return (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="p-4 font-black">#{index + 1}</td>
                  <td className="p-4">{row.username || "mystery_gardener"}</td>
                  <td className="p-4">{row.seeds}</td>
                  <td className="p-4">{totalValue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
