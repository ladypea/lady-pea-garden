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
  { name: "Cursed Dingle Bloom", rarity: "Mythic", emoji: "🍄", value: 120 },  { name: "Cosmic Marble Flower",rarity: "Legendary",emoji: "🌌",value: 250},
{ name: "Moonlit Pea Blossom", rarity: "Rare", emoji: "🌙", value: 12 },
{ name: "Rainbow Marble Bloom", rarity: "Epic", emoji: "🌈", value: 30 },
{ name: "Starlight Pea Orchid", rarity: "Epic", emoji: "⭐", value: 35 },
{ name: "Golden Dingle Lily", rarity: "Legendary", emoji: "🌾", value: 75 },
{ name: "Jubear Honey Bloom", rarity: "Legendary", emoji: "🐻", value: 90 },
{ name: "Void Pea Rose", rarity: "Mythic", emoji: "🖤", value: 180 },
{ name: "Celestial Marble Dahlia", rarity: "Mythic", emoji: "🪐", value: 220 },
];

export function rollFlower(): FlowerRoll {
  const roll = Math.random() * 100;

// 🌌 Cosmic Marble mutation (ULTRA RARE)
if (Math.random() < 0.01) {
  return {
    name: "Cosmic Marble Flower",
    rarity: "Legendary",
    emoji: "🌌",
    value: 500
  };
}
function getRandomFlowerByRarity(rarity: Rarity): FlowerRoll {
  const pool = FLOWERS.filter(f => f.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

if (roll < 0.5) return getRandomFlowerByRarity("Mythic");     // 0.5%
if (roll < 2) return getRandomFlowerByRarity("Legendary");    // 1.5%
if (roll < 7) return getRandomFlowerByRarity("Epic");         // 5%
if (roll < 18) return getRandomFlowerByRarity("Rare");        // 11%
if (roll < 43) return getRandomFlowerByRarity("Uncommon");    // 25%
return getRandomFlowerByRarity("Common");                     // 57%

export const PLANT_COST = 10;
export const COLLECT_COOLDOWN_SECONDS = 60;
