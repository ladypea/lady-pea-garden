export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";

export type FlowerRoll = {
  name: string;
  rarity: Rarity;
  emoji: string;
  value: number;
};

const FLOWERS: FlowerRoll[] = [
  { name: "Pea Sprout", rarity: "Common", emoji: "🌱", value: 1 },
  { name: "Pink Pea Flower", rarity: "Uncommon", emoji: "🌸", value: 3 },
  { name: "Glowing Pea Bloom", rarity: "Rare", emoji: "🌺", value: 8 },
  { name: "Cosmic Pea Flower", rarity: "Epic", emoji: "✨", value: 18 },
  { name: "Golden Pea Bloom", rarity: "Legendary", emoji: "🌟", value: 50 },
  { name: "Cursed Dingle Bloom", rarity: "Mythic", emoji: "🍄", value: 120 }
];{
  name: "Cosmic Marble Flower",
  rarity: "Legendary",
  emoji: "🌌",
  value: 250
}

export function rollFlower(): FlowerRoll {
  const roll = Math.random() * 100;

  if (roll < 0.5) return FLOWERS[5];      // Mythic 0.5%
  if (roll < 2) return FLOWERS[4];        // Legendary 1.5%
  if (roll < 7) return FLOWERS[3];        // Epic 5%
  if (roll < 18) return FLOWERS[2];       // Rare 11%
  if (roll < 43) return FLOWERS[1];       // Uncommon 25%
  return FLOWERS[0];                      // Common 57%
}

export const PLANT_COST = 10;
export const COLLECT_COOLDOWN_SECONDS = 60;
