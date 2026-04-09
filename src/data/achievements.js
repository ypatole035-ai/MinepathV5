// ─── ACHIEVEMENT DEFINITIONS ─────────────────────────────────────
// type: 'milestone' | 'seeds' | 'skill' | 'hidden'
// condition evaluated in checkAchievements() in GameplayScreen
// reward: seeds awarded on first unlock

export const ACHIEVEMENTS = [
  // ── Milestone ──
  { id:'first_step',       icon:'🐣', name:'First Step',        desc:'Complete level 1',                    reward:50,  type:'milestone' },
  { id:'farm_grad',        icon:'🌾', name:'Farm Graduate',      desc:'Complete World 1 (reach level 10)',   reward:150, type:'milestone' },
  { id:'cave_dweller',     icon:'🦇', name:'Cave Dweller',       desc:'Complete World 2 (reach level 20)',   reward:150, type:'milestone' },
  { id:'volcano_survivor', icon:'🌋', name:'Volcano Survivor',   desc:'Complete World 3 (reach level 30)',   reward:150, type:'milestone' },
  { id:'space_pioneer',    icon:'🚀', name:'Space Pioneer',      desc:'Reach level 30',                     reward:500, type:'milestone' },
  { id:'century',          icon:'💯', name:'Century',            desc:'Reach level 100',                    reward:500, type:'milestone' },

  // ── Seeds ──
  { id:'planter',      icon:'🌱', name:'Planter',      desc:'Earn 100 seeds total',   reward:50,  type:'seeds' },
  { id:'farmer',       icon:'🌿', name:'Farmer',        desc:'Earn 500 seeds total',   reward:100, type:'seeds' },
  { id:'harvest_king', icon:'🌾', name:'Harvest King',  desc:'Earn 2000 seeds total',  reward:300, type:'seeds' },

  // ── Skill ──
  { id:'perfectionist', icon:'💎', name:'Perfectionist',  desc:'Complete a level with full hearts',       reward:100, type:'skill' },
  { id:'on_fire',       icon:'🔥', name:'On Fire',         desc:'Reach x10 combo',                        reward:150, type:'skill' },
  { id:'speed_runner',  icon:'⚡', name:'Speed Runner',    desc:'Complete a level with 80%+ timer left',  reward:100, type:'skill' },
  { id:'blind_faith',   icon:'👁️', name:'Blind Faith',    desc:'Complete a level without peeking',       reward:100, type:'skill' },
  { id:'untouchable',   icon:'🛡️', name:'Untouchable',    desc:'Block 10 mines with shield (total)',      reward:150, type:'skill' },

  // ── Fun / Hidden ──
  { id:'brave_fool',  icon:'💀', name:'Brave Fool',    desc:'Step on 50 mines total',                    reward:50,  type:'hidden' },
  { id:'ghost_run',   icon:'👻', name:'Ghost Run',      desc:'5 levels in a row without losing a heart',  reward:200, type:'hidden' },
  { id:'lucky_cluck', icon:'🎰', name:'Lucky Cluck',    desc:'Collect 3 powerups in one level',           reward:100, type:'hidden' },
];

// ─── VISUAL THEMES ────────────────────────────────────────────────
export const VISUAL_THEMES = [
  {
    id: 'default',
    name: 'Classic',
    icon: '🌞',
    price: 0,
    desc: 'The original MINEPATH look',
    cssClass: 'theme-default',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    icon: '🌙',
    price: 200,
    desc: 'Dark blue starfield atmosphere',
    cssClass: 'theme-midnight',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    icon: '🌸',
    price: 200,
    desc: 'Pink cherry blossom warmth',
    cssClass: 'theme-sakura',
  },
  {
    id: 'cyber',
    name: 'Cyber',
    icon: '🤖',
    price: 200,
    desc: 'Neon green matrix grid',
    cssClass: 'theme-cyber',
  },
  {
    id: 'desert',
    name: 'Desert',
    icon: '🏜️',
    price: 200,
    desc: 'Sandy warm tones, dusty horizon',
    cssClass: 'theme-desert',
  },
];
