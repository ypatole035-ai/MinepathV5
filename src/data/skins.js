// ─── CHICKEN SKINS ───────────────────────────────────────────────
// ability: id string matching SKIN_ABILITIES below
// upgradeable: true if ability has 3 tiers (Lv1/2/3)
export const CHICKEN_SKINS = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '🐔',
    price: 0,
    description: 'The original miner chicken',
    color: '#FFD700',
    hat: '⛏️',
    outfit: null,
    ability: null,
    upgradeable: false,
  },
  {
    id: 'ninja',
    name: 'Ninja',
    emoji: '🥷',
    price: 150,
    description: 'Dodge — auto-avoids 1 mine',
    color: '#2C2C2C',
    hat: null,
    outfit: 'ninja',
    ability: 'dodge',
    upgradeable: false,
  },
  {
    id: 'royal',
    name: 'Royal',
    emoji: '👑',
    price: 150,
    description: 'Wealthy — bonus seeds per level',
    color: '#9B59B6',
    hat: '👑',
    outfit: 'royal',
    ability: 'wealthy',
    upgradeable: true,
  },
  {
    id: 'ghost',
    name: 'Ghost',
    emoji: '👻',
    price: 150,
    description: 'Phase — free peeks per world',
    color: '#E8E8E8',
    hat: null,
    outfit: 'ghost',
    ability: 'phase',
    upgradeable: true,
  },
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    price: 150,
    description: 'Jump — leap over 1 tile',
    color: '#B0C4DE',
    hat: '👨‍🚀',
    outfit: 'space',
    ability: 'jump',
    upgradeable: false,
  },
  {
    id: 'robot',
    name: 'Robot',
    emoji: '🤖',
    price: 200,
    description: 'Scan — reveals mine counts at start',
    color: '#78909C',
    hat: null,
    outfit: 'robot',
    ability: 'scan',
    upgradeable: true,
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    price: 200,
    description: 'Fireproof — lava tile immunity',
    color: '#FF5722',
    hat: null,
    outfit: 'dragon',
    ability: 'fireproof',
    upgradeable: true,
  },
];

// ─── SKIN ABILITY DEFINITIONS ────────────────────────────────────
// baseCap = uses per world at upgrade level 1
// cap at Lv2 = base+1, Lv3 = base+2
// World boundary caps: Farm=1, Cave=2, Volcano=3, Space=4
// Upgrade adds +1 (Lv2) or +2 (Lv3) to the world cap
export const SKIN_ABILITIES = {
  dodge:     { name: 'Dodge',     icon: '🥷', desc: 'Auto-avoid the next mine you step on',                upgradeable: false },
  wealthy:   { name: 'Wealthy',   icon: '💰', desc: '+20%/+35%/+50% seeds per level',                      upgradeable: true  },
  phase:     { name: 'Phase',     icon: '👻', desc: 'Free peeks: +2/+3/+5 per world',                      upgradeable: true  },
  jump:      { name: 'Jump',      icon: '🚀', desc: 'Leap over 1 tile (non-adjacent step)',                 upgradeable: false },
  scan:      { name: 'Scan',      icon: '🤖', desc: 'Reveals adjMine counts at level start: nearby/all/all+lava', upgradeable: true },
  fireproof: { name: 'Fireproof', icon: '🐉', desc: 'Lava tiles cost 0/0/0 timer + no damage',             upgradeable: true  },
};

// Returns base world use-cap for a given ability upgrade level
// Farm=1, Cave=2, Volcano=3, Space=4 (world num, then +upgrade bonus)
export function getAbilityCap(worldNum, upgradeLevel = 1) {
  const base = worldNum; // 1/2/3/4
  if (upgradeLevel === 2) return base + 1;
  if (upgradeLevel === 3) return base + 2;
  return base;
}

// Wealthy seed multiplier per upgrade level
export function getWealthyMultiplier(upgradeLevel) {
  if (upgradeLevel === 3) return 1.50;
  if (upgradeLevel === 2) return 1.35;
  return 1.20;
}

// Phase free peeks per world per upgrade level
export function getPhasePeeks(upgradeLevel) {
  if (upgradeLevel === 3) return 5;
  if (upgradeLevel === 2) return 3;
  return 2;
}

// ─── MINE SKINS ──────────────────────────────────────────────────
export const MINE_SKINS = [
  {
    id: 'default',
    name: 'Classic Bomb',
    emoji: '💣',
    price: 0,
    description: 'The classic',
    animClass: 'mine-anim-default',
  },
  {
    id: 'skull',
    name: 'Skull',
    emoji: '💀',
    price: 100,
    description: 'Rotates and flashes red when adjacent',
    animClass: 'mine-anim-skull',
  },
  {
    id: 'spider',
    name: 'Spider',
    emoji: '🕷️',
    price: 100,
    description: 'Shakes and vibrates — legs animate',
    animClass: 'mine-anim-spider',
  },
  {
    id: 'electric',
    name: 'Electric',
    emoji: '⚡',
    price: 120,
    description: 'Constant pulse glow — zaps nearby tiles',
    animClass: 'mine-anim-electric',
  },
  {
    id: 'ice',
    name: 'Ice Crystal',
    emoji: '❄️',
    price: 120,
    description: 'Cold blue pulse — freeze effect on reveal',
    animClass: 'mine-anim-ice',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    emoji: '🔮',
    price: 150,
    description: 'Fades in and out — hardest to spot',
    animClass: 'mine-anim-phantom',
  },
  {
    id: 'dynamite',
    name: 'Dynamite',
    emoji: '🧨',
    price: 150,
    description: 'Fuse speeds up as timer runs low',
    animClass: 'mine-anim-dynamite',
  },
];

// ─── TILE STYLES (kept for backwards compat) ─────────────────────
export const TILE_STYLES = [
  { id:'classic', name:'Classic', price:0, hiddenColor:'#8B4513', safeColor:'#4CAF50', mineColor:'#F44336', borderColor:'#5D2E0C' },
  { id:'lava',    name:'Lava',    price:100, hiddenColor:'#8B0000', safeColor:'#FF6B35', mineColor:'#1A1A1A', borderColor:'#FF4500' },
  { id:'ice',     name:'Ice',     price:100, hiddenColor:'#4FC3F7', safeColor:'#E0F7FA', mineColor:'#0D47A1', borderColor:'#81D4FA' },
  { id:'jungle',  name:'Jungle',  price:100, hiddenColor:'#2E7D32', safeColor:'#8BC34A', mineColor:'#BF360C', borderColor:'#1B5E20' },
  { id:'galaxy',  name:'Galaxy',  price:100, hiddenColor:'#1A237E', safeColor:'#7B1FA2', mineColor:'#B71C1C', borderColor:'#283593' },
];

// ─── TRAIL EFFECTS ────────────────────────────────────────────────
export const TRAIL_EFFECTS = [
  { id:'none',    name:'None',         price:0,  description:'No trail' },
  { id:'sparkle', name:'Sparkle ✨',   price:75, description:'Glittering sparkles' },
  { id:'fire',    name:'Fire 🔥',      price:75, description:'Blazing fire trail' },
  { id:'rainbow', name:'Rainbow 🌈',   price:75, description:'Colorful rainbow trail' },
];

// ─── ACCESSORIES (cosmetic) ───────────────────────────────────────
export const ACCESSORIES = [
  { id:'none',    name:'None',         emoji:'',   price:0,   description:'No accessory' },
  { id:'tophat',  name:'Top Hat',      emoji:'🎩', price:80,  description:'Classy.' },
  { id:'shades',  name:'Sunglasses',   emoji:'😎', price:80,  description:'Too cool for mines.' },
  { id:'bow',     name:'Bow',          emoji:'🎀', price:80,  description:'Adorable.' },
  { id:'helmet',  name:'Army Helmet',  emoji:'🪖', price:80,  description:'Battle-ready.' },
];

// ─── POWERUP UPGRADES (permanent, buy-once) ───────────────────────
// These modify base powerup behaviour globally once purchased
export const POWERUP_UPGRADES = [
  {
    id: 'shield_plus',
    name: 'Shield Plus',
    icon: '🛡️',
    price: 300,
    description: 'Shield blocks 2 mines instead of 1',
  },
  {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    icon: '🦅',
    price: 250,
    description: 'Peek reveals the target tile + all adjacent tiles',
  },
  {
    id: 'time_stretch',
    name: 'Time Stretch',
    icon: '⏳',
    price: 200,
    description: '+5s added to every level\'s starting timer',
  },
  {
    id: 'combo_starter',
    name: 'Combo Starter',
    icon: '🔥',
    price: 250,
    description: 'Start every level with x2 combo already active',
  },
  {
    id: 'seed_magnet',
    name: 'Seed Magnet',
    icon: '🧲',
    price: 200,
    description: '+10% seeds from every source',
  },
];

// ─── BUNDLE DEALS ─────────────────────────────────────────────────
// Each bundle unlocks a fixed set of items at a discount
export const BUNDLE_DEALS = [
  {
    id: 'starter',
    name: 'Starter Pack',
    icon: '🎁',
    price: 200,        // vs 375 individual
    originalPrice: 375,
    description: 'Classic Bomb + Sparkle Trail + Top Hat',
    items: [
      { type:'mine',      id:'skull' },
      { type:'trail',     id:'sparkle' },
      { type:'accessory', id:'tophat' },
    ],
  },
  {
    id: 'cave_pack',
    name: 'Cave Pack',
    icon: '🦇',
    price: 280,        // vs 420 individual
    originalPrice: 420,
    description: 'Spider Mine + Ghost Skin + Army Helmet',
    items: [
      { type:'mine',  id:'spider' },
      { type:'skin',  id:'ghost' },
      { type:'accessory', id:'helmet' },
    ],
  },
  {
    id: 'space_pack',
    name: 'Space Pack',
    icon: '🚀',
    price: 320,        // vs 500 individual
    originalPrice: 500,
    description: 'Electric Mine + Space Skin + Shades',
    items: [
      { type:'mine',  id:'electric' },
      { type:'skin',  id:'space' },
      { type:'accessory', id:'shades' },
    ],
  },
];
