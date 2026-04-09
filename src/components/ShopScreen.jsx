import React, { useState } from 'react';
import { gameStore } from '../store/gameStore';
import {
  CHICKEN_SKINS, TRAIL_EFFECTS, MINE_SKINS,
  SKIN_ABILITIES, getWealthyMultiplier, getPhasePeeks,
  ACCESSORIES, POWERUP_UPGRADES, BUNDLE_DEALS,
} from '../data/skins';
import { VISUAL_THEMES } from '../data/achievements';
import { audio } from '../audio/engine';

// ─── PREVIEWS ────────────────────────────────────────────────────
function SkinPreview({ skin, equipped, owned }) {
  return (
    <div className={`skin-preview ${equipped?'equipped':''} ${owned?'owned':'locked'}`}>
      <div className="skin-chicken" style={{background:skin.color}}>
        <div className="skin-head" style={{background:skin.color}}>
          <div className="skin-eye l"/><div className="skin-eye r"/>
          <div className="skin-beak"/>
          {skin.hat && <div className="skin-hat-icon">{skin.hat}</div>}
          {skin.outfit==='ninja'  && <div className="skin-ninja-mask"/>}
          {skin.outfit==='ghost'  && <div className="skin-ghost-overlay"/>}
          {skin.outfit==='robot'  && <div className="skin-robot-visor"/>}
          {skin.outfit==='dragon' && <div className="skin-dragon-horn"/>}
        </div>
        <div className="skin-wing l" style={{background:skin.color}}/>
        <div className="skin-wing r" style={{background:skin.color}}/>
      </div>
    </div>
  );
}

function MinePreview({ skin }) {
  return (
    <div className="mine-preview">
      <span className={`mine-preview-emoji ${skin.animClass}`}>{skin.emoji}</span>
    </div>
  );
}

// ─── ABILITY UPGRADE CARD ─────────────────────────────────────────
function AbilityUpgradeCard({ skin, currentLevel, onUpgrade, seeds }) {
  const abilityDef = SKIN_ABILITIES[skin.ability];
  if (!abilityDef || !skin.upgradeable) return null;
  const maxed = currentLevel >= 3;
  const cost  = currentLevel === 1 ? 200 : 350;
  const descriptions = [
    abilityDef.desc.split('/')[0],
    abilityDef.desc.split('/')[1] || abilityDef.desc.split('/')[0],
    abilityDef.desc.split('/')[2] || abilityDef.desc.split('/')[1] || abilityDef.desc.split('/')[0],
  ];
  return (
    <div className={`ability-upgrade-card ${maxed?'ability-maxed':''}`}>
      <div className="auc-header">
        <SkinPreview skin={skin} equipped={false} owned={true}/>
        <div className="auc-info">
          <div className="auc-name">{skin.emoji} {skin.name}</div>
          <div className="auc-ability-name">{abilityDef.icon} {abilityDef.name}</div>
        </div>
        <div className="auc-level-badge">Lv {currentLevel}</div>
      </div>
      <div className="auc-tiers">
        {[1,2,3].map(lv=>(
          <div key={lv} className={`auc-tier ${lv<=currentLevel?'auc-tier-active':''}`}>
            <span className="auc-tier-dot">{lv<=currentLevel?'●':'○'}</span>
            <span className="auc-tier-desc">{descriptions[lv-1]}</span>
          </div>
        ))}
      </div>
      {!maxed
        ? <button className="auc-upgrade-btn" disabled={seeds<cost}
            onTouchStart={(e)=>{e.preventDefault();onUpgrade(skin.id,cost);}}
            onClick={()=>onUpgrade(skin.id,cost)}>
            {seeds<cost?`🔒 🌾${cost}`:`⬆️ Upgrade Lv${currentLevel+1} — 🌾${cost}`}
          </button>
        : <div className="auc-maxed-label">✅ MAX LEVEL</div>
      }
    </div>
  );
}

// ─── POWERUP UPGRADE CARD ─────────────────────────────────────────
function PowerupUpgradeCard({ upgrade, owned, seeds, onBuy }) {
  return (
    <div className={`pup-card ${owned?'pup-owned':''}`}>
      <div className="pup-icon">{upgrade.icon}</div>
      <div className="pup-info">
        <div className="pup-name">{upgrade.name}</div>
        <div className="pup-desc">{upgrade.description}</div>
      </div>
      {owned
        ? <div className="pup-owned-badge">✅ Active</div>
        : <button className="pup-buy-btn" disabled={seeds<upgrade.price}
            onTouchStart={(e)=>{e.preventDefault();onBuy(upgrade);}}
            onClick={()=>onBuy(upgrade)}>
            {seeds<upgrade.price?`🔒 🌾${upgrade.price}`:`🌾 ${upgrade.price}`}
          </button>
      }
    </div>
  );
}

// ─── BUNDLE CARD ──────────────────────────────────────────────────
function BundleCard({ bundle, owned, seeds, onBuy }) {
  const discount = Math.round((1 - bundle.price / bundle.originalPrice) * 100);
  return (
    <div className={`bundle-card ${owned?'bundle-owned':''}`}>
      <div className="bundle-header">
        <span className="bundle-icon">{bundle.icon}</span>
        <div className="bundle-info">
          <div className="bundle-name">{bundle.name}</div>
          <div className="bundle-desc">{bundle.description}</div>
        </div>
        <div className="bundle-discount">-{discount}%</div>
      </div>
      <div className="bundle-price-row">
        <span className="bundle-orig">🌾{bundle.originalPrice}</span>
        <span className="bundle-arrow">→</span>
        <span className="bundle-now">🌾{bundle.price}</span>
      </div>
      {owned
        ? <div className="bundle-owned-badge">✅ Unlocked</div>
        : <button className="bundle-buy-btn" disabled={seeds<bundle.price}
            onTouchStart={(e)=>{e.preventDefault();onBuy(bundle);}}
            onClick={()=>onBuy(bundle)}>
            {seeds<bundle.price?`🔒 Need 🌾${bundle.price-seeds} more`:`🎁 Buy Bundle — 🌾${bundle.price}`}
          </button>
      }
    </div>
  );
}

// ─── MAIN SHOP ────────────────────────────────────────────────────
export default function ShopScreen({ onBack }) {
  const TABS = ['skins','mines','trails','accessories','powerups','bundles','upgrades','themes'];
  const TAB_LABELS = {
    skins:'🐔 Skins', mines:'💣 Mines', trails:'✨ Trails',
    accessories:'🎩 Gear', powerups:'⚡ Power', bundles:'🎁 Deals', upgrades:'⬆️ Lvl Up'
  };

  const [tab,setTab]   = useState('skins');
  const [seeds,setSeeds] = useState(gameStore.getSeeds());
  const [unlockedSkins,setUnlockedSkins]         = useState(gameStore.getUnlockedSkins());
  const [unlockedMines,setUnlockedMines]         = useState(gameStore.getUnlockedMines());
  const [unlockedTrails,setUnlockedTrails]       = useState(gameStore.getUnlockedTrails());
  const [unlockedAccessories,setUnlockedAccs]   = useState(gameStore.getUnlockedAccessories());
  const [powerupUpgrades,setPowerupUpgrades]     = useState(gameStore.getPowerupUpgrades());
  const [unlockedBundles,setUnlockedBundles]     = useState(gameStore.getUnlockedBundles());
  const [equippedSkin,setEquippedSkin]           = useState(gameStore.getEquippedSkin());
  const [equippedMine,setEquippedMine]           = useState(gameStore.getEquippedMine());
  const [equippedTrail,setEquippedTrail]         = useState(gameStore.getEquippedTrail());
  const [equippedAcc,setEquippedAcc]             = useState(gameStore.getEquippedAccessory());
  const [abilityUpgrades,setAbilityUpgrades]     = useState(gameStore.getAbilityUpgrades());
  const [equippedTheme,setEquippedTheme]         = useState(gameStore.getEquippedTheme());
  const [unlockedThemes,setUnlockedThemes]       = useState(gameStore.getUnlockedThemes());
  const [msg,setMsg] = useState('');

  const refresh = () => {
    setSeeds(gameStore.getSeeds());
    setUnlockedSkins(gameStore.getUnlockedSkins());
    setUnlockedMines(gameStore.getUnlockedMines());
    setUnlockedTrails(gameStore.getUnlockedTrails());
    setUnlockedAccs(gameStore.getUnlockedAccessories());
    setPowerupUpgrades(gameStore.getPowerupUpgrades());
    setUnlockedBundles(gameStore.getUnlockedBundles());
    setEquippedSkin(gameStore.getEquippedSkin());
    setEquippedMine(gameStore.getEquippedMine());
    setEquippedTrail(gameStore.getEquippedTrail());
    setEquippedAcc(gameStore.getEquippedAccessory());
    setAbilityUpgrades(gameStore.getAbilityUpgrades());
    setEquippedTheme(gameStore.getEquippedTheme());
    setUnlockedThemes(gameStore.getUnlockedThemes());
  };

  const showMsg = (text) => { setMsg(text); setTimeout(()=>setMsg(''),2300); };

  // ── Buy helpers ──
  const buySkin = (skin) => {
    if (unlockedSkins.includes(skin.id)) {
      gameStore.setEquippedSkin(skin.id); setEquippedSkin(skin.id); showMsg(`Equipped ${skin.name}!`);
    } else if (gameStore.spendSeeds(skin.price)) {
      gameStore.unlockSkin(skin.id); gameStore.setEquippedSkin(skin.id);
      refresh(); audio.powerupCollect(); showMsg(`Unlocked ${skin.name}!`);
    } else showMsg('Not enough seeds! 🌾');
  };

  const buyMine = (ms) => {
    if (unlockedMines.includes(ms.id)) {
      gameStore.setEquippedMine(ms.id); setEquippedMine(ms.id); showMsg(`Equipped ${ms.name}!`);
    } else if (gameStore.spendSeeds(ms.price)) {
      gameStore.unlockMine(ms.id); gameStore.setEquippedMine(ms.id);
      refresh(); audio.powerupCollect(); showMsg(`Unlocked ${ms.name}!`);
    } else showMsg('Not enough seeds! 🌾');
  };

  const buyTrail = (trail) => {
    if (unlockedTrails.includes(trail.id)) {
      gameStore.setEquippedTrail(trail.id); setEquippedTrail(trail.id); showMsg(`Equipped ${trail.name}!`);
    } else if (gameStore.spendSeeds(trail.price)) {
      gameStore.unlockTrail(trail.id); gameStore.setEquippedTrail(trail.id);
      refresh(); audio.powerupCollect(); showMsg(`Unlocked ${trail.name}!`);
    } else showMsg('Not enough seeds! 🌾');
  };

  const buyAccessory = (acc) => {
    if (unlockedAccessories.includes(acc.id)) {
      gameStore.setEquippedAccessory(acc.id); setEquippedAcc(acc.id); showMsg(`Equipped ${acc.name}!`);
    } else if (acc.price === 0) {
      gameStore.unlockAccessory(acc.id); gameStore.setEquippedAccessory(acc.id);
      refresh(); showMsg(`Equipped ${acc.name}!`);
    } else if (gameStore.spendSeeds(acc.price)) {
      gameStore.unlockAccessory(acc.id); gameStore.setEquippedAccessory(acc.id);
      refresh(); audio.powerupCollect(); showMsg(`Unlocked ${acc.name}!`);
    } else showMsg('Not enough seeds! 🌾');
  };

  const buyPowerupUpgrade = (upgrade) => {
    if (powerupUpgrades.includes(upgrade.id)) return showMsg('Already purchased!');
    if (!gameStore.spendSeeds(upgrade.price)) return showMsg('Not enough seeds! 🌾');
    gameStore.buyPowerupUpgrade(upgrade.id);
    refresh(); audio.powerupCollect(); showMsg(`${upgrade.name} activated permanently! 🎉`);
  };

  const buyBundle = (bundle) => {
    if (gameStore.hasBundleUnlocked(bundle.id)) return showMsg('Bundle already owned!');
    if (!gameStore.spendSeeds(bundle.price)) return showMsg('Not enough seeds! 🌾');
    gameStore.unlockBundle(bundle.id);
    // Unlock each item
    bundle.items.forEach(item => {
      if (item.type === 'skin')      gameStore.unlockSkin(item.id);
      if (item.type === 'mine')      gameStore.unlockMine(item.id);
      if (item.type === 'trail')     gameStore.unlockTrail(item.id);
      if (item.type === 'accessory') gameStore.unlockAccessory(item.id);
    });
    refresh(); audio.powerupCollect(); showMsg(`${bundle.name} unlocked! 🎉`);
  };

  const handleAbilityUpgrade = (skinId, cost) => {
    if (!gameStore.spendSeeds(cost)) return showMsg('Not enough seeds! 🌾');
    gameStore.upgradeAbility(skinId);
    refresh(); audio.powerupCollect();
    const skin = CHICKEN_SKINS.find(s=>s.id===skinId);
    showMsg(`${skin?.name} ability → Lv${gameStore.getAbilityUpgradeLevel(skinId)}! 🎉`);
  };

  const buyTheme = (theme) => {
    if (unlockedThemes.includes(theme.id)) {
      gameStore.setEquippedTheme(theme.id); setEquippedTheme(theme.id);
      showMsg(`Theme "${theme.name}" applied!`);
    } else if (gameStore.spendSeeds(theme.price)) {
      gameStore.unlockTheme(theme.id); gameStore.setEquippedTheme(theme.id);
      refresh(); audio.powerupCollect(); showMsg(`"${theme.name}" theme unlocked!`);
    } else showMsg('Not enough seeds! 🌾');
  };

  const upgradeableSkins = CHICKEN_SKINS.filter(s=>s.upgradeable&&s.ability&&unlockedSkins.includes(s.id));

  return (
    <div className="shop-screen">
      <div className="shop-header">
        <button className="btn-back"
          onTouchStart={(e)=>{e.preventDefault();onBack();}} onClick={onBack}>← Back</button>
        <div className="shop-title">🛒 SHOP</div>
        <div className="shop-seeds">🌾 {seeds}</div>
      </div>

      {msg && <div className="shop-msg">{msg}</div>}

      {/* Scrollable tab bar */}
      <div className="shop-tabs">
        {TABS.map(t=>(
          <button key={t} className={`shop-tab ${tab===t?'active':''}`}
            onTouchStart={(e)=>{e.preventDefault();setTab(t);}} onClick={()=>setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="shop-items">

        {/* ── SKINS ── */}
        {tab==='skins' && CHICKEN_SKINS.map(skin => {
          const owned = unlockedSkins.includes(skin.id);
          const isEquipped = equippedSkin === skin.id;
          const upgLv = abilityUpgrades[skin.id] || 1;
          return (
            <div key={skin.id} className={`shop-item ${isEquipped?'equipped-item':''}`}>
              <SkinPreview skin={skin} equipped={isEquipped} owned={owned}/>
              <div className="shop-item-info">
                <div className="shop-item-name">{skin.emoji} {skin.name}</div>
                <div className="shop-item-desc">{skin.description}</div>
                {skin.ability && (
                  <div className="shop-ability-tag">
                    {SKIN_ABILITIES[skin.ability]?.icon} {SKIN_ABILITIES[skin.ability]?.name}
                    {skin.upgradeable && owned && <span className="shop-ability-lv"> Lv{upgLv}</span>}
                  </div>
                )}
                {isEquipped && <div className="equipped-badge">✅ Equipped</div>}
              </div>
              <button className={`shop-buy-btn ${owned?'btn-equip':'btn-buy'}`}
                onTouchStart={(e)=>{e.preventDefault();buySkin(skin);}} onClick={()=>buySkin(skin)}>
                {owned ? (isEquipped?'✅':'👗 Equip') : `🌾 ${skin.price}`}
              </button>
            </div>
          );
        })}

        {/* ── MINE SKINS ── */}
        {tab==='mines' && MINE_SKINS.map(ms => {
          const owned = unlockedMines.includes(ms.id);
          const isEquipped = equippedMine === ms.id;
          return (
            <div key={ms.id} className={`shop-item ${isEquipped?'equipped-item':''}`}>
              <MinePreview skin={ms}/>
              <div className="shop-item-info">
                <div className="shop-item-name">{ms.emoji} {ms.name}</div>
                <div className="shop-item-desc">{ms.description}</div>
                {isEquipped && <div className="equipped-badge">✅ Equipped</div>}
              </div>
              <button className={`shop-buy-btn ${owned?'btn-equip':'btn-buy'}`}
                onTouchStart={(e)=>{e.preventDefault();buyMine(ms);}} onClick={()=>buyMine(ms)}>
                {owned ? (isEquipped?'✅':'💣 Equip') : `🌾 ${ms.price}`}
              </button>
            </div>
          );
        })}

        {/* ── TRAILS ── */}
        {tab==='trails' && TRAIL_EFFECTS.map(trail => {
          const owned = unlockedTrails.includes(trail.id);
          const isEquipped = equippedTrail === trail.id;
          return (
            <div key={trail.id} className={`shop-item ${isEquipped?'equipped-item':''}`}>
              <div className="trail-preview">
                {trail.id==='sparkle' && <div className="trail-sparkle-demo">✨✨✨</div>}
                {trail.id==='fire'    && <div className="trail-fire-demo">🔥🔥🔥</div>}
                {trail.id==='rainbow' && <div className="trail-rainbow-demo">🌈</div>}
                {trail.id==='none'    && <div className="trail-none-demo">——</div>}
              </div>
              <div className="shop-item-info">
                <div className="shop-item-name">{trail.name}</div>
                <div className="shop-item-desc">{trail.description}</div>
                {isEquipped && <div className="equipped-badge">✅ Equipped</div>}
              </div>
              <button className={`shop-buy-btn ${owned?'btn-equip':'btn-buy'}`}
                onTouchStart={(e)=>{e.preventDefault();buyTrail(trail);}} onClick={()=>buyTrail(trail)}>
                {owned ? (isEquipped?'✅':'✨ Equip') : `🌾 ${trail.price}`}
              </button>
            </div>
          );
        })}

        {/* ── ACCESSORIES ── */}
        {tab==='accessories' && ACCESSORIES.map(acc => {
          const owned = unlockedAccessories.includes(acc.id);
          const isEquipped = equippedAcc === acc.id;
          return (
            <div key={acc.id} className={`shop-item ${isEquipped?'equipped-item':''}`}>
              <div className="accessory-preview">
                <span className="acc-emoji">{acc.emoji || '—'}</span>
              </div>
              <div className="shop-item-info">
                <div className="shop-item-name">{acc.emoji} {acc.name}</div>
                <div className="shop-item-desc">{acc.description}</div>
                {isEquipped && <div className="equipped-badge">✅ Equipped</div>}
              </div>
              <button className={`shop-buy-btn ${owned?'btn-equip':'btn-buy'}`}
                onTouchStart={(e)=>{e.preventDefault();buyAccessory(acc);}} onClick={()=>buyAccessory(acc)}>
                {owned ? (isEquipped?'✅':'🎩 Equip') : (acc.price===0?'Free':'🌾 '+acc.price)}
              </button>
            </div>
          );
        })}

        {/* ── POWERUP UPGRADES ── */}
        {tab==='powerups' && (
          <>
            <div className="shop-section-label">Permanent upgrades — buy once, active forever</div>
            {POWERUP_UPGRADES.map(upgrade => (
              <PowerupUpgradeCard
                key={upgrade.id}
                upgrade={upgrade}
                owned={powerupUpgrades.includes(upgrade.id)}
                seeds={seeds}
                onBuy={buyPowerupUpgrade}
              />
            ))}
          </>
        )}

        {/* ── BUNDLE DEALS ── */}
        {tab==='bundles' && (
          <>
            <div className="shop-section-label">Discounted bundles — save big on themed sets</div>
            {BUNDLE_DEALS.map(bundle => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                owned={unlockedBundles.includes(bundle.id)}
                seeds={seeds}
                onBuy={buyBundle}
              />
            ))}
          </>
        )}

        {/* ── ABILITY UPGRADES ── */}
        {tab==='upgrades' && (
          upgradeableSkins.length === 0
            ? <div className="shop-upgrades-empty">
                <div style={{fontSize:40}}>⬆️</div>
                <div style={{fontSize:16,color:'rgba(255,255,255,0.7)',fontFamily:"'Fredoka One',cursive",marginTop:8}}>No upgradeable skins yet</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif',marginTop:4}}>Unlock Royal, Ghost, Robot, or Dragon first</div>
              </div>
            : upgradeableSkins.map(skin => (
                <AbilityUpgradeCard
                  key={skin.id}
                  skin={skin}
                  currentLevel={abilityUpgrades[skin.id]||1}
                  onUpgrade={handleAbilityUpgrade}
                  seeds={seeds}
                />
              ))
        )}

      </div>
    </div>
  );
}
