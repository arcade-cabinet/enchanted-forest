/**
 * Adjective-Adjective-Noun codename codec for enchanted-forest.
 *
 * Each run gets a human-readable codename that round-trips with an
 * 18-bit seed (6 bits per pool × 3 pools = 262,144 distinct names).
 * The codename IS the shareable run ID — `?seed=<slug>` replays the
 * same grove for any player.
 *
 * Word pools are curated for the rune-cadence survival register:
 * woodland geography, pentatonic musical terms, amulet metals, slow
 * ritual vocabulary. No generic fantasy or cute-RPG terms.
 */

export const ADJECTIVES_PRIMARY: readonly string[] = [
  "Acorn",
  "Amber",
  "Ancient",
  "Archaic",
  "Ashen",
  "Bardic",
  "Becalmed",
  "Birch",
  "Boreal",
  "Burnished",
  "Cedar",
  "Circled",
  "Cloistral",
  "Copse",
  "Corvine",
  "Dappled",
  "Dusked",
  "Elder",
  "Embered",
  "Evensong",
  "Everfall",
  "Evergreen",
  "Fernlit",
  "Fir",
  "Forestborn",
  "Glenlit",
  "Glimmering",
  "Grovekeeper",
  "Halcyon",
  "Hallowed",
  "Harvestlit",
  "Hearthlit",
  "Hushed",
  "Ironbound",
  "Kindled",
  "Lanternlit",
  "Leaflet",
  "Lichened",
  "Longshadow",
  "Mantled",
  "Mosswise",
  "Nightwise",
  "Nocturne",
  "Oaken",
  "Olden",
  "Orchid",
  "Patient",
  "Pine",
  "Quiet",
  "Reedsong",
  "Remembered",
  "Remote",
  "Resonant",
  "Ritual",
  "Rowanborn",
  "Sable",
  "Sagebound",
  "Silver",
  "Slowlit",
  "Solstice",
  "Thicket",
  "Umbral",
  "Vesper",
  "Wildered",
] as const;

export const ADJECTIVES_SECONDARY: readonly string[] = [
  "Alder",
  "Antler",
  "Ashwood",
  "Aspen",
  "Birchbark",
  "Bone",
  "Brambled",
  "Brassbound",
  "Briar",
  "Cairn",
  "Cedarlit",
  "Chordal",
  "Cinder",
  "Cloverlit",
  "Corded",
  "Crescent",
  "Ember",
  "Evergloom",
  "Fern",
  "Firefly",
  "Flintlit",
  "Foundling",
  "Gilded",
  "Glowroot",
  "Gossamer",
  "Hazel",
  "Heartwood",
  "Holly",
  "Honeyed",
  "Ivory",
  "Jasper",
  "Juniper",
  "Kestrel",
  "Lantern",
  "Lichen",
  "Linden",
  "Loom",
  "Loredrawn",
  "Lyric",
  "Mossbound",
  "Mothlit",
  "Mycelial",
  "Nettle",
  "Nocturne",
  "Oakbound",
  "Obsidian",
  "Owlbound",
  "Pinebound",
  "Quartzlit",
  "Reed",
  "Rime",
  "Rootbound",
  "Rowan",
  "Silverleaf",
  "Sparrow",
  "Spruce",
  "Starlit",
  "Stonebound",
  "Thistle",
  "Thornlit",
  "Thrush",
  "Veiled",
  "Vellum",
  "Willow",
] as const;

export const NOUNS: readonly string[] = [
  "Alcove",
  "Arbor",
  "Archway",
  "Atrium",
  "Bastion",
  "Beacon",
  "Bellhouse",
  "Bough",
  "Burrow",
  "Cadence",
  "Cairn",
  "Canopy",
  "Chapel",
  "Chorus",
  "Circle",
  "Clearing",
  "Cloister",
  "Copse",
  "Cornerstone",
  "Crossing",
  "Dell",
  "Enclave",
  "Enclosure",
  "Foundry",
  "Glade",
  "Glen",
  "Grove",
  "Hallow",
  "Haven",
  "Hearth",
  "Hollow",
  "Hostel",
  "Keep",
  "Kiln",
  "Labyrinth",
  "Lantern",
  "Ledger",
  "Loom",
  "Meadow",
  "Nave",
  "Nursery",
  "Orchard",
  "Pavilion",
  "Prism",
  "Reliquary",
  "Rookery",
  "Runehouse",
  "Sanctum",
  "Shieldbough",
  "Shrine",
  "Sigilway",
  "Silverwood",
  "Spring",
  "Steading",
  "Stele",
  "Thicket",
  "Threshold",
  "Triskelion",
  "Vault",
  "Vespery",
  "Vigil",
  "Waymark",
  "Wellspring",
  "Wildwood",
] as const;

const ADJ1_BITS = 6;
const ADJ2_BITS = 6;
const NOUN_BITS = 6;
const ADJ1_MASK = (1 << ADJ1_BITS) - 1;
const ADJ2_MASK = (1 << ADJ2_BITS) - 1;
const NOUN_MASK = (1 << NOUN_BITS) - 1;

export const CODENAME_SEED_MASK = (1 << (ADJ1_BITS + ADJ2_BITS + NOUN_BITS)) - 1;

export interface CodenameParts {
  adjective1: string;
  adjective2: string;
  noun: string;
}

export function codenamePartsFromSeed(seed: number): CodenameParts {
  const s = (seed >>> 0) & CODENAME_SEED_MASK;
  const adj1Idx = s & ADJ1_MASK;
  const adj2Idx = (s >>> ADJ1_BITS) & ADJ2_MASK;
  const nounIdx = (s >>> (ADJ1_BITS + ADJ2_BITS)) & NOUN_MASK;
  return {
    adjective1: ADJECTIVES_PRIMARY[adj1Idx],
    adjective2: ADJECTIVES_SECONDARY[adj2Idx],
    noun: NOUNS[nounIdx],
  };
}

export function codenameFromSeed(seed: number): string {
  const parts = codenamePartsFromSeed(seed);
  return `${parts.adjective1} ${parts.adjective2} ${parts.noun}`;
}

export function codenameSlug(codename: string): string {
  return normalize(codename);
}

export function seedFromCodename(codename: string): number | null {
  const normalized = normalize(codename);
  const tokens = normalized.split("-").filter(Boolean);
  if (tokens.length !== 3) return null;
  const adj1Idx = indexOfCaseInsensitive(ADJECTIVES_PRIMARY, tokens[0]);
  const adj2Idx = indexOfCaseInsensitive(ADJECTIVES_SECONDARY, tokens[1]);
  const nounIdx = indexOfCaseInsensitive(NOUNS, tokens[2]);
  if (adj1Idx < 0 || adj2Idx < 0 || nounIdx < 0) return null;
  return (adj1Idx | (adj2Idx << ADJ1_BITS) | (nounIdx << (ADJ1_BITS + ADJ2_BITS))) >>> 0;
}

export function dailySeed(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return ((y * 10000 + m * 100 + d) >>> 0) & CODENAME_SEED_MASK;
}

function normalize(codename: string): string {
  return codename
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z-]/g, "");
}

function indexOfCaseInsensitive(pool: readonly string[], token: string): number {
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].toLowerCase() === token) return i;
  }
  return -1;
}
