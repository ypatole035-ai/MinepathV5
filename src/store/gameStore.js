// Game Store - localStorage persistence layer

const STORAGE_KEYS = {
  SEEDS:            'minepath_seeds',
  UNLOCKED_SKINS:   'minepath_unlocked_skins',
  UNLOCKED_TILES:   'minepath_unlocked_tiles',
  UNLOCKED_TRAILS:  'minepath_unlocked_trails',
  EQUIPPED_SKIN:    'minepath_equipped_skin',
  EQUIPPED_TILE:    'minepath_equipped_tile',
  EQUIPPED_TRAIL:   'minepath_equipped_trail',
  BEST_LEVEL:       'minepath_best_level',
  LEADERBOARD:      'minepath_leaderboard',
  TUTORIAL_SEEN:    'minepath_tutorial_seen',
  BEST_COMBO:       'minepath_best_combo',
  SAVED_LEVEL:      'minepath_saved_level',
  UNLOCKED_WORLD:   'minepath_unlocked_world',
  WORLD_BEST:       'minepath_world_best',
  // V5 Endless
  BEST_ENDLESS:     'minepath_best_endless',
  ENDLESS_BOARD:    'minepath_endless_board',
  // V5 Phase 2
  ABILITY_UPGRADES: 'minepath_ability_upgrades', // { skinId: level 1-3 }
  EQUIPPED_MINE:    'minepath_equipped_mine',
  UNLOCKED_MINES:   'minepath_unlocked_mines',
  // V5 Phase 3
  EQUIPPED_ACCESSORY:   'minepath_equipped_accessory',
  UNLOCKED_ACCESSORIES: 'minepath_unlocked_accessories',
  POWERUP_UPGRADES:     'minepath_powerup_upgrades',
  UNLOCKED_BUNDLES:     'minepath_unlocked_bundles',
};

function safeGet(key, defaultVal) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultVal;
    return JSON.parse(val);
  } catch { return defaultVal; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export const gameStore = {
  getSeeds()           { return safeGet(STORAGE_KEYS.SEEDS, 0); },
  setSeeds(amount)     { safeSet(STORAGE_KEYS.SEEDS, amount); },
  addSeeds(amount)     { const c=this.getSeeds(); safeSet(STORAGE_KEYS.SEEDS, c+amount); return c+amount; },
  spendSeeds(amount)   { const c=this.getSeeds(); if(c<amount) return false; safeSet(STORAGE_KEYS.SEEDS,c-amount); return true; },

  getUnlockedSkins()   { return safeGet(STORAGE_KEYS.UNLOCKED_SKINS, ['classic']); },
  unlockSkin(id)       { const u=this.getUnlockedSkins(); if(!u.includes(id)){u.push(id);safeSet(STORAGE_KEYS.UNLOCKED_SKINS,u);} },

  getUnlockedTiles()   { return safeGet(STORAGE_KEYS.UNLOCKED_TILES, ['classic']); },
  unlockTile(id)       { const u=this.getUnlockedTiles(); if(!u.includes(id)){u.push(id);safeSet(STORAGE_KEYS.UNLOCKED_TILES,u);} },

  getUnlockedTrails()  { return safeGet(STORAGE_KEYS.UNLOCKED_TRAILS, ['none']); },
  unlockTrail(id)      { const u=this.getUnlockedTrails(); if(!u.includes(id)){u.push(id);safeSet(STORAGE_KEYS.UNLOCKED_TRAILS,u);} },

  getEquippedSkin()    { return safeGet(STORAGE_KEYS.EQUIPPED_SKIN, 'classic'); },
  setEquippedSkin(id)  { safeSet(STORAGE_KEYS.EQUIPPED_SKIN, id); },
  getEquippedTile()    { return safeGet(STORAGE_KEYS.EQUIPPED_TILE, 'classic'); },
  setEquippedTile(id)  { safeSet(STORAGE_KEYS.EQUIPPED_TILE, id); },
  getEquippedTrail()   { return safeGet(STORAGE_KEYS.EQUIPPED_TRAIL, 'none'); },
  setEquippedTrail(id) { safeSet(STORAGE_KEYS.EQUIPPED_TRAIL, id); },

  getBestLevel()       { return safeGet(STORAGE_KEYS.BEST_LEVEL, 0); },
  updateBestLevel(lvl) { if(lvl>this.getBestLevel()) safeSet(STORAGE_KEYS.BEST_LEVEL,lvl); },

  getLeaderboard()     { return safeGet(STORAGE_KEYS.LEADERBOARD, []); },
  addLeaderboardEntry(entry) {
    const board=this.getLeaderboard();
    board.push({...entry,date:new Date().toLocaleDateString()});
    board.sort((a,b)=>b.level-a.level);
    const top10=board.slice(0,10);
    safeSet(STORAGE_KEYS.LEADERBOARD,top10);
    return top10;
  },

  getTutorialSeen()    { return safeGet(STORAGE_KEYS.TUTORIAL_SEEN, false); },
  setTutorialSeen()    { safeSet(STORAGE_KEYS.TUTORIAL_SEEN, true); },

  getBestCombo()       { return safeGet(STORAGE_KEYS.BEST_COMBO, 0); },
  updateBestCombo(c)   { if(c>this.getBestCombo()) safeSet(STORAGE_KEYS.BEST_COMBO,c); },

  getSavedLevel()      { return safeGet(STORAGE_KEYS.SAVED_LEVEL, 1); },
  setSavedLevel(lvl)   { safeSet(STORAGE_KEYS.SAVED_LEVEL, lvl); },

  getUnlockedWorld()   { return safeGet(STORAGE_KEYS.UNLOCKED_WORLD, 1); },
  unlockWorld(n)       { if(n>this.getUnlockedWorld()) safeSet(STORAGE_KEYS.UNLOCKED_WORLD,n); },

  getWorldBest()       { return safeGet(STORAGE_KEYS.WORLD_BEST, {1:0,2:0,3:0,4:0}); },
  updateWorldBest(worldNum, level) {
    const best=this.getWorldBest();
    if(!best[worldNum]||level>best[worldNum]){ best[worldNum]=level; safeSet(STORAGE_KEYS.WORLD_BEST,best); }
  },

  // ── V5 Phase 2: Ability Upgrades ──
  getAbilityUpgrades()      { return safeGet(STORAGE_KEYS.ABILITY_UPGRADES, {}); },
  getAbilityUpgradeLevel(skinId) {
    return (this.getAbilityUpgrades()[skinId]) || 1;
  },
  upgradeAbility(skinId) {
    const upgrades = this.getAbilityUpgrades();
    const current = upgrades[skinId] || 1;
    if (current >= 3) return false;
    upgrades[skinId] = current + 1;
    safeSet(STORAGE_KEYS.ABILITY_UPGRADES, upgrades);
    return true;
  },

  // ── V5 Phase 2: Mine Skins ──
  getEquippedMine()    { return safeGet(STORAGE_KEYS.EQUIPPED_MINE, 'default'); },
  setEquippedMine(id)  { safeSet(STORAGE_KEYS.EQUIPPED_MINE, id); },
  getUnlockedMines()   { return safeGet(STORAGE_KEYS.UNLOCKED_MINES, ['default']); },
  unlockMine(id)       { const u=this.getUnlockedMines(); if(!u.includes(id)){u.push(id);safeSet(STORAGE_KEYS.UNLOCKED_MINES,u);} },

  // ── V5 Endless ──
  getBestEndlessLevel()    { return safeGet(STORAGE_KEYS.BEST_ENDLESS, 0); },
  setBestEndlessLevel(lvl) { if(lvl>this.getBestEndlessLevel()) safeSet(STORAGE_KEYS.BEST_ENDLESS,lvl); },

  getEndlessLeaderboard()  { return safeGet(STORAGE_KEYS.ENDLESS_BOARD, []); },
  addEndlessEntry(entry)   {
    const board=this.getEndlessLeaderboard();
    board.push({...entry,date:new Date().toLocaleDateString()});
    board.sort((a,b)=>b.level-a.level);
    safeSet(STORAGE_KEYS.ENDLESS_BOARD, board.slice(0,10));
  },
};
// Appended by Phase 3 patch — extend gameStore with accessory / powerup upgrade / bundle methods
Object.assign(gameStore, {
  // ── Accessories ──
  getEquippedAccessory()    { return safeGet(STORAGE_KEYS.EQUIPPED_ACCESSORY, 'none'); },
  setEquippedAccessory(id)  { safeSet(STORAGE_KEYS.EQUIPPED_ACCESSORY, id); },
  getUnlockedAccessories()  { return safeGet(STORAGE_KEYS.UNLOCKED_ACCESSORIES, ['none']); },
  unlockAccessory(id)       { const u=this.getUnlockedAccessories(); if(!u.includes(id)){u.push(id);safeSet(STORAGE_KEYS.UNLOCKED_ACCESSORIES,u);} },

  // ── Powerup Upgrades (buy-once set) ──
  getPowerupUpgrades()      { return safeGet(STORAGE_KEYS.POWERUP_UPGRADES, []); },
  hasPowerupUpgrade(id)     { return this.getPowerupUpgrades().includes(id); },
  buyPowerupUpgrade(id)     {
    const list = this.getPowerupUpgrades();
    if (!list.includes(id)) { list.push(id); safeSet(STORAGE_KEYS.POWERUP_UPGRADES, list); }
  },

  // ── Bundles ──
  getUnlockedBundles()      { return safeGet(STORAGE_KEYS.UNLOCKED_BUNDLES, []); },
  unlockBundle(id)          { const u=this.getUnlockedBundles(); if(!u.includes(id)){u.push(id);safeSet(STORAGE_KEYS.UNLOCKED_BUNDLES,u);} },
  hasBundleUnlocked(id)     { return this.getUnlockedBundles().includes(id); },
});

// ── V5 Phase 4: Achievements + Stats + Themes ──
const ACH_KEYS = {
  UNLOCKED:       'minepath_achievements',
  STATS:          'minepath_stats',
  EQUIPPED_THEME: 'minepath_theme',
  UNLOCKED_THEMES:'minepath_themes',
};

Object.assign(gameStore, {
  // Achievements
  getUnlockedAchievements() { return safeGet(ACH_KEYS.UNLOCKED, []); },
  isAchievementUnlocked(id) { return this.getUnlockedAchievements().includes(id); },
  unlockAchievement(id) {
    const list = this.getUnlockedAchievements();
    if (list.includes(id)) return false;
    list.push(id);
    safeSet(ACH_KEYS.UNLOCKED, list);
    return true; // returns true = newly unlocked
  },

  // Stats tracked for achievement evaluation
  getStats() {
    return safeGet(ACH_KEYS.STATS, {
      totalMineHits: 0,
      totalShieldBlocks: 0,
      totalSeedsEarned: 0,
      consecutiveHeartlessLevels: 0, // levels cleared without losing a heart in a row
    });
  },
  updateStats(patch) {
    const stats = this.getStats();
    const next = { ...stats };
    if (patch.mineHit)       next.totalMineHits       = (next.totalMineHits       || 0) + 1;
    if (patch.shieldBlock)   next.totalShieldBlocks   = (next.totalShieldBlocks   || 0) + 1;
    if (patch.seedsEarned)   next.totalSeedsEarned    = (next.totalSeedsEarned    || 0) + patch.seedsEarned;
    if (patch.heartLostReset)next.consecutiveHeartlessLevels = 0;
    if (patch.heartKept)     next.consecutiveHeartlessLevels = (next.consecutiveHeartlessLevels || 0) + 1;
    safeSet(ACH_KEYS.STATS, next);
    return next;
  },

  // Themes
  getEquippedTheme()     { return safeGet(ACH_KEYS.EQUIPPED_THEME, 'default'); },
  setEquippedTheme(id)   { safeSet(ACH_KEYS.EQUIPPED_THEME, id); },
  getUnlockedThemes()    { return safeGet(ACH_KEYS.UNLOCKED_THEMES, ['default']); },
  unlockTheme(id)        { const u=this.getUnlockedThemes(); if(!u.includes(id)){u.push(id);safeSet(ACH_KEYS.UNLOCKED_THEMES,u);} },
});

// ── V5 Phase 5: Tutorial tracking ──
const TUT5_KEYS = {
  WORLD_BRIEFINGS_SEEN: 'minepath_world_briefings',  // array of world ids seen
  ABILITY_TUTS_SEEN:    'minepath_ability_tuts',     // array of skin ids seen
};
Object.assign(gameStore, {
  getWorldBriefingsSeen()    { return safeGet(TUT5_KEYS.WORLD_BRIEFINGS_SEEN, []); },
  markWorldBriefingSeen(id)  {
    const s = this.getWorldBriefingsSeen();
    if (!s.includes(id)) { s.push(id); safeSet(TUT5_KEYS.WORLD_BRIEFINGS_SEEN, s); }
  },
  isWorldBriefingSeen(id)    { return this.getWorldBriefingsSeen().includes(id); },

  getAbilityTutsSeen()       { return safeGet(TUT5_KEYS.ABILITY_TUTS_SEEN, []); },
  markAbilityTutSeen(skinId) {
    const s = this.getAbilityTutsSeen();
    if (!s.includes(skinId)) { s.push(skinId); safeSet(TUT5_KEYS.ABILITY_TUTS_SEEN, s); }
  },
  isAbilityTutSeen(skinId)   { return this.getAbilityTutsSeen().includes(skinId); },
});
