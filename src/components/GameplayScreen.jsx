import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gameStore } from '../store/gameStore';
import { audio } from '../audio/engine';
import {
  CHICKEN_SKINS, TILE_STYLES, TRAIL_EFFECTS, MINE_SKINS,
  SKIN_ABILITIES, getAbilityCap, getWealthyMultiplier, getPhasePeeks,
  ACCESSORIES, POWERUP_UPGRADES,
} from '../data/skins';
import { ACHIEVEMENTS } from '../data/achievements';
import { WorldBriefing, AbilityTutorial } from './Tutorial';

// ─── HELPERS ─────────────────────────────────────────────────────
function getMaxHearts(level) {
  return Math.min(3 + Math.floor(level / 5), 6);
}
function getComboMultiplier(combo) {
  if (combo >= 10) return 10;
  if (combo >= 7)  return 5;
  if (combo >= 4)  return 3;
  if (combo >= 2)  return 2;
  return 1;
}
function getComboLabel(combo) {
  if (combo >= 10) return { label: '🔥 INSANE x10', color: '#ff00ff' };
  if (combo >= 7)  return { label: '⚡ BLAZING x5',  color: '#ff4400' };
  if (combo >= 4)  return { label: '🔥 HOT x3',      color: '#ff8800' };
  if (combo >= 2)  return { label: '✨ COMBO x2',     color: '#FFD700' };
  return null;
}

// ─── WORLD SYSTEM ────────────────────────────────────────────────
function getWorld(level) {
  if (level >= 30) return { id:'space',   name:'DEEP SPACE',   icon:'🚀', color:'#64b5f6', bg:'world-space',   num:4 };
  if (level >= 20) return { id:'volcano', name:'VOLCANO',      icon:'🌋', color:'#ff5722', bg:'world-volcano',  num:3 };
  if (level >= 10) return { id:'cave',    name:'DARK CAVE',    icon:'🦇', color:'#9e9e9e', bg:'world-cave',     num:2 };
  return                   { id:'farm',   name:'CHICKEN FARM', icon:'🌾', color:'#8bc34a', bg:'world-farm',     num:1 };
}
function isBossLevel(level) { return level > 0 && level % 10 === 0; }

// ─── V5 TIMER CONFIG ─────────────────────────────────────────────
function getTimerMax(level) {
  if (level <= 5)  return 30;
  if (level <= 9)  return 45;
  if (level <= 14) return 60;
  if (level <= 19) return 75;
  if (level <= 24) return 90;
  if (level <= 29) return 105;
  return 120;
}
function getPeekCost(level) {
  if (level >= 30) return 3;
  if (level >= 20) return 4;
  if (level >= 10) return 5;
  return 6;
}

// ─── ABILITY USE-CAP HELPERS ─────────────────────────────────────
// Returns how many ability uses the player gets for the current world
function getWorldAbilityUses(skinId, worldNum, upgradeLevel) {
  if (!skinId) return 0;
  return getAbilityCap(worldNum, upgradeLevel);
}

// ─── DIFFICULTY CONFIG ────────────────────────────────────────────
function getDifficultyConfig(level, isEndless = false) {
  const world = getWorld(level);
  const wl = world.id;
  const lvlInWorld = wl==='farm'?level : wl==='cave'?level-9 : wl==='volcano'?level-19 : level-29;
  const progress = Math.min(lvlInWorld / 10, 1);

  let mineRate, obstacleFreq, rows, cols;
  let allowedPowerups, movingMines, lavaTiles, gravityFlip;

  if (isEndless) {
    rows = 10; cols = 10;
    mineRate     = 0.12 + Math.min(level * 0.008, 0.55);
    obstacleFreq = Math.min(level * 0.02, 1.2);
    allowedPowerups = level>=20?['shield','slowmo','reveal','doublescore']:level>=10?['shield','slowmo','reveal']:level>=5?['shield','slowmo']:['shield'];
    movingMines = level >= 15; lavaTiles = level >= 20; gravityFlip = level >= 35;
    return { mineRate, rows, cols, obstacleFreq, allowedPowerups, movingMines, lavaTiles, gravityFlip, world: wl };
  }

  if (wl === 'farm') {
    mineRate=0.15+progress*0.10; obstacleFreq=0;
    rows=5+Math.floor(progress*1); cols=5+Math.floor(progress*1);
    allowedPowerups=['shield']; movingMines=false; lavaTiles=false; gravityFlip=false;
  } else if (wl === 'cave') {
    mineRate=0.28+progress*0.12; obstacleFreq=0.2+progress*0.3;
    rows=6+Math.floor(progress*1); cols=7+Math.floor(progress*1);
    allowedPowerups=['shield','slowmo']; movingMines=false; lavaTiles=false; gravityFlip=false;
  } else if (wl === 'volcano') {
    mineRate=0.42+progress*0.13; obstacleFreq=0.5+progress*0.5;
    rows=7+Math.floor(progress*1); cols=8+Math.floor(progress*1);
    allowedPowerups=['shield','slowmo','reveal']; movingMines=progress>0.3; lavaTiles=progress>0.2; gravityFlip=false;
  } else {
    mineRate=0.55+progress*0.10; obstacleFreq=1.0;
    rows=9; cols=9;
    allowedPowerups=['shield','slowmo','reveal','doublescore']; movingMines=true; lavaTiles=true; gravityFlip=progress>0.5;
  }
  if (isBossLevel(level)) {
    mineRate=Math.min(mineRate+0.15,0.75);
    obstacleFreq=Math.min(obstacleFreq+0.4,1.5);
  }
  return { mineRate, rows, cols, obstacleFreq, allowedPowerups, movingMines, lavaTiles, gravityFlip, world: wl };
}

// ─── ADJACENT MINE COUNT ─────────────────────────────────────────
function countAdjacentMines(tiles, r, c, rows, cols) {
  let count = 0;
  for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
    if (dr===0&&dc===0) continue;
    const nr=r+dr, nc=c+dc;
    if (nr<0||nr>=rows||nc<0||nc>=cols) continue;
    const t=tiles.find(x=>x.r===nr&&x.c===nc);
    if (t&&t.isMine) count++;
  }
  return count;
}

// ─── GRID GENERATION ─────────────────────────────────────────────
function generateGrid(rows, cols, mineRate, level, diff, scanMode = 'none') {
  const worldId  = diff?.world || getWorld(level).id;
  const wProps   = getWorldTileProps(worldId);
  const gravFlip = diff?.gravityFlip || false;
  const startR      = gravFlip ? 0       : rows-1;
  const startC      = gravFlip ? cols-1  : 0;
  const checkpointR = gravFlip ? rows-1  : 0;
  const checkpointC = gravFlip ? 0       : cols-1;
  const allowedPowerups = diff?.allowedPowerups || ['shield'];
  const powerupCount    = Math.max(1, Math.min(Math.floor(level/3), 4));
  const fakeSafeCount   = worldId!=='farm'&&level>=12 ? Math.floor((level-9)/4) : 0;
  const doLava          = diff?.lavaTiles || false;

  const tiles = [];
  for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
    tiles.push({
      r, c, isMine:false, isSafe:true,
      isCheckpoint: r===checkpointR&&c===checkpointC,
      isStart: r===startR&&c===startC,
      state:'hidden', powerup:null, isFakeSafe:false, adjMines:0,
      isLava:false, worldId,
      checkpointIcon:wProps.checkpointIcon, mineIcon:wProps.mineIcon,
    });
  }

  // Fisher-Yates random mine placement
  const mineCandidates = tiles.filter(t=>!t.isCheckpoint&&!t.isStart);
  for (let i=mineCandidates.length-1; i>0; i--) {
    const j=Math.floor(Math.random()*(i+1));
    [mineCandidates[i],mineCandidates[j]]=[mineCandidates[j],mineCandidates[i]];
  }
  const mineCount = Math.floor((rows*cols-2)*mineRate);
  const minedSet = new Set();
  mineCandidates.slice(0,mineCount).forEach(t=>{
    const tile=tiles.find(x=>x.r===t.r&&x.c===t.c);
    if(tile){tile.isMine=true;tile.isSafe=false;minedSet.add(`${t.r},${t.c}`);}
  });

  // BFS safe path
  const safePath = carvePathBFS(tiles,rows,cols,startR,startC,checkpointR,checkpointC,gravFlip);
  const safePathSet = new Set(safePath.map(p=>`${p.r},${p.c}`));
  safePath.forEach(({r,c})=>{
    const tile=tiles.find(t=>t.r===r&&t.c===c);
    if(tile&&tile.isMine){tile.isMine=false;tile.isSafe=true;minedSet.delete(`${r},${c}`);}
  });

  // Fake safe tiles
  const realSafe=tiles.filter(t=>!t.isMine&&!t.isCheckpoint&&!t.isStart&&!safePathSet.has(`${t.r},${t.c}`));
  for(let i=realSafe.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[realSafe[i],realSafe[j]]=[realSafe[j],realSafe[i]];}
  realSafe.slice(0,fakeSafeCount).forEach(t=>{
    const tile=tiles.find(x=>x.r===t.r&&x.c===t.c);
    if(tile){tile.isFakeSafe=true;tile.isMine=true;tile.isSafe=false;}
  });

  // Lava tiles
  if(doLava){
    const lavaCandidates=tiles.filter(t=>!t.isMine&&!t.isCheckpoint&&!t.isStart&&!safePathSet.has(`${t.r},${t.c}`));
    for(let i=lavaCandidates.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lavaCandidates[i],lavaCandidates[j]]=[lavaCandidates[j],lavaCandidates[i]];}
    lavaCandidates.slice(0,Math.floor(rows*cols*0.08)).forEach(t=>{const tile=tiles.find(x=>x.r===t.r&&x.c===t.c);if(tile)tile.isLava=true;});
  }

  // Powerups
  const safeTilesForPowerup=tiles.filter(t=>!t.isMine&&!t.isCheckpoint&&!t.isStart&&!t.isLava);
  for(let i=safeTilesForPowerup.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[safeTilesForPowerup[i],safeTilesForPowerup[j]]=[safeTilesForPowerup[j],safeTilesForPowerup[i]];}
  safeTilesForPowerup.slice(0,powerupCount).forEach((t,i)=>{
    const tile=tiles.find(x=>x.r===t.r&&x.c===t.c);
    if(tile)tile.powerup=allowedPowerups[i%allowedPowerups.length];
  });

  // Adj mine counts
  tiles.forEach(tile=>{tile.adjMines=countAdjacentMines(tiles,tile.r,tile.c,rows,cols);});

  // Robot Scan: reveal adjMine numbers at start (scanMode: 'nearby'=only adj, 'all'=all, 'all+lava'=all+lava)
  if (scanMode !== 'none') {
    tiles.forEach(tile => {
      if (!tile.isMine && !tile.isCheckpoint && !tile.isStart && tile.state === 'hidden') {
        if (scanMode === 'nearby' && tile.adjMines > 0) tile.state = 'revealed';
        else if (scanMode === 'all' || scanMode === 'all+lava') tile.state = 'revealed';
      }
    });
  }

  const cp=tiles.find(t=>t.isCheckpoint); if(cp)cp.state='checkpoint';
  const st=tiles.find(t=>t.isStart); if(st)st.state='revealed';
  return tiles;
}

function carvePathBFS(tiles, rows, cols, startR, startC, endR, endC, gravFlip) {
  const dirs = gravFlip ? [[1,0],[0,-1],[0,1]] : [[-1,0],[0,-1],[0,1]];
  const visited=new Set(); const queue=[{r:startR,c:startC,path:[{r:startR,c:startC}]}];
  visited.add(`${startR},${startC}`);
  while(queue.length>0){
    const {r,c,path}=queue.shift();
    if(r===endR&&c===endC) return path;
    const sd=[...dirs].sort(()=>Math.random()-0.5);
    for(const[dr,dc]of sd){
      const nr=r+dr,nc=c+dc;
      if(nr<0||nr>=rows||nc<0||nc>=cols) continue;
      const key=`${nr},${nc}`; if(visited.has(key)) continue;
      visited.add(key); queue.push({r:nr,c:nc,path:[...path,{r:nr,c:nc}]});
    }
  }
  // fallback
  const path=[]; let r=startR,c=startC; path.push({r,c});
  while(r!==endR||c!==endC){ if(r>endR)r--; else if(c<endC)c++; else r--; path.push({r,c}); }
  return path;
}

function getWorldTileProps(worldId) {
  if(worldId==='farm')    return {checkpointIcon:'🌻',mineIcon:'💣',lavaCost:0};
  if(worldId==='cave')    return {checkpointIcon:'💎',mineIcon:'🪨',lavaCost:0};
  if(worldId==='volcano') return {checkpointIcon:'🔥',mineIcon:'🌋',lavaCost:2};
  return                         {checkpointIcon:'🛸',mineIcon:'☄️',lavaCost:3};
}

// ─── MINE TILE (with skin animations) ────────────────────────────
// The mine skin emoji replaces the world mine icon when the player equips one
function getMineEmoji(tile, equippedMineSkin) {
  const skin = MINE_SKINS.find(s => s.id === equippedMineSkin);
  if (skin && skin.id !== 'default') return skin.emoji;
  return tile.mineIcon || '💣';
}

// ─── CHICKEN ─────────────────────────────────────────────────────
const GRID_GAP = 3;
function Chicken({ skin, accessory, animState, expression, position, cellW, cellH }) {
  const skinData = CHICKEN_SKINS.find(s => s.id === skin) || CHICKEN_SKINS[0];
  const pixelX = position.c * (cellW + GRID_GAP) + cellW / 2;
  const pixelY = position.r * (cellH + GRID_GAP) + cellH / 2;
  const isDead        = animState === 'explode';
  const isCelebrating = animState === 'celebrate';
  const isWalking     = animState === 'walk';
  const isShield      = animState === 'shield';
  const isPowerup     = animState === 'powerup';
  const isAbility     = animState === 'ability';
  const isScared      = expression === 'scared';
  const isHype        = expression === 'hype';
  const isLooking     = expression === 'look';
  const isSweat       = expression === 'sweat';
  const eyeContent    = isDead?'dead':isHype?'hype':'normal';
  return (
    <div className="ck-root" style={{
      position:'absolute', left:pixelX, top:pixelY,
      transform:'translate(-50%,-50%)', zIndex:20,
      transition:'left 0.16s cubic-bezier(0.34,1.56,0.64,1), top 0.16s cubic-bezier(0.34,1.56,0.64,1)',
      pointerEvents:'none',
    }}>
      <div className={['ck-wrap',isDead?'ck-dead':'',isCelebrating?'ck-celebrate':'',isWalking?'ck-walk':'',isShield?'ck-shield-hit':'',isPowerup?'ck-powerup':'',isAbility?'ck-ability-use':'',isScared?'ck-scared':'',isHype?'ck-hype':'',isLooking?'ck-look':''].join(' ')} style={{'--skin':skinData.color}}>
        <div className={`ck-shadow ${isDead?'ck-shadow-dead':''}`}/>
        {isSweat && <div className="ck-sweat">💧</div>}
        {accessory && accessory !== 'none' && (
          <div className="ck-accessory">{['tophat','shades','bow','helmet'].includes(accessory) ? {tophat:'🎩',shades:'😎',bow:'🎀',helmet:'🪖'}[accessory] : ''}</div>
        )}
        <div className="ck-helmet">
          <div className="ck-helmet-brim"/><div className="ck-helmet-dome"/>
          <div className="ck-helmet-light"/><div className="ck-helmet-glow"/>
        </div>
        <div className="ck-body">
          <div className={`ck-wing ck-wing-l ${isWalking||isCelebrating?'ck-wing-flap-l':''} ${isHype?'ck-wing-spread':''}`}/>
          <div className={`ck-wing ck-wing-r ${isWalking||isCelebrating?'ck-wing-flap-r':''} ${isHype?'ck-wing-spread':''}`}/>
          <div className="ck-body-shine"/>
          <div className="ck-eyes-row">
            <div className="ck-eye ck-eye-l">
              {eyeContent==='dead' && <span className="ck-eye-x">✕</span>}
              {eyeContent==='hype' && <span className="ck-eye-star">★</span>}
              {eyeContent==='normal' && <><div className="ck-pupil"/><div className="ck-shine"/></>}
            </div>
            <div className="ck-eye ck-eye-r">
              {eyeContent==='dead' && <span className="ck-eye-x">✕</span>}
              {eyeContent==='hype' && <span className="ck-eye-star">★</span>}
              {eyeContent==='normal' && <><div className="ck-pupil"/><div className="ck-shine"/></>}
            </div>
          </div>
          <div className="ck-beak"><div className="ck-beak-top"/><div className="ck-beak-bot"/></div>
          <div className="ck-wattle"><div className="ck-wattle-l"/><div className="ck-wattle-r"/></div>
          {isShield && <div className="ck-shield-bubble"/>}
        </div>
        <div className="ck-legs">
          <div className={`ck-leg ck-leg-l ${isWalking?'ck-step-l':''} ${isDead?'ck-leg-up':''}`}>
            <div className="ck-shin"/><div className="ck-foot ck-foot-l"/>
          </div>
          <div className={`ck-leg ck-leg-r ${isWalking?'ck-step-r':''} ${isDead?'ck-leg-up':''}`}>
            <div className="ck-shin"/><div className="ck-foot ck-foot-r"/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TILE ─────────────────────────────────────────────────────────
function Tile({ tile, isAdjacent, onTap, onLongPress, cellW, cellH, equippedMineSkin, timerPct }) {
  const pressTimer = useRef(null);
  const pressed = useRef(false);
  const handleTouchStart = (e) => { e.preventDefault(); pressed.current=true; pressTimer.current=setTimeout(()=>{if(pressed.current){onLongPress(tile);pressed.current=false;}},400); };
  const handleTouchEnd   = (e) => { e.preventDefault(); if(pressed.current){clearTimeout(pressTimer.current);pressed.current=false;onTap(tile);} };
  const handleTouchMove  = () => { clearTimeout(pressTimer.current); pressed.current=false; };
  const handleMouseDown  = () => { pressed.current=true; pressTimer.current=setTimeout(()=>{if(pressed.current){onLongPress(tile);pressed.current=false;}},400); };
  const handleMouseUp    = () => { if(pressed.current){clearTimeout(pressTimer.current);pressed.current=false;onTap(tile);} };

  const worldColors = {
    farm:    {hidden:'#6B4226',safe:'#4CAF50',mine:'#c62828',border:'#3E2208'},
    cave:    {hidden:'#37474F',safe:'#546E7A',mine:'#4a148c',border:'#263238'},
    volcano: {hidden:'#4E1A05',safe:'#BF360C',mine:'#1a1a1a',border:'#7f2a00'},
    space:   {hidden:'#0D1B3E',safe:'#1A237E',mine:'#880E4F',border:'#050D2A'},
  };
  const wc = worldColors[tile.worldId||'farm'];

  // Mine skin animation class — extra class on the content span
  const mineSkin = MINE_SKINS.find(s => s.id === equippedMineSkin) || MINE_SKINS[0];
  const isTimerLow = timerPct < 25;

  let bg, content, extraClass='', contentClass='';
  if (tile.state==='checkpoint') {
    bg='#FFD700'; content=tile.checkpointIcon||'🏁'; extraClass='tile-checkpoint tile-v3-checkpoint';
  } else if (tile.state==='hidden') {
    bg=tile.isLava?'#B71C1C':wc.hidden;
    content=tile.isLava?'🔥':tile.powerup?'✨':'';
    extraClass=`tile-hidden-v3 ${tile.powerup?'tile-powerup-glow':''} ${isAdjacent?'tile-adjacent-v3':''} ${tile.isLava?'tile-lava':''}`;
  } else if (tile.state==='revealed') {
    bg=tile.isLava?'#D32F2F':wc.safe;
    if(tile.powerup){content=getPowerupIcon(tile.powerup);extraClass='tile-revealed-v3';}
    else if(tile.adjMines>0){content=tile.adjMines;extraClass=`tile-revealed-v3 tile-number tile-num-${tile.adjMines}`;}
    else{content=tile.isLava?'🌋':'';extraClass='tile-revealed-v3';}
  } else if (tile.state==='mine') {
    bg=wc.mine;
    content=getMineEmoji(tile, equippedMineSkin);
    contentClass=`${mineSkin.animClass}`;
    extraClass='tile-mine-v3';
  } else if (tile.state==='peeked') {
    bg=tile.isMine?'#ff4d4d':'#6dff8a';
    if(!tile.isMine&&tile.adjMines>0){content=tile.adjMines;extraClass=`tile-peeked-v3 tile-number tile-num-${tile.adjMines}`;}
    else{
      // Show mine skin emoji when peeked at a mine
      content=tile.isMine ? getMineEmoji(tile, equippedMineSkin) : '✓';
      contentClass=tile.isMine ? `${mineSkin.animClass} ${isTimerLow&&mineSkin.id==='dynamite'?'mine-fuse-fast':''}` : '';
      extraClass='tile-peeked-v3';
    }
  }

  return (
    <div className={`game-tile-v3 ${extraClass}`} style={{width:cellW,height:cellH,background:bg,borderColor:wc.border}}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
      {content!==''&&content!==undefined&&(
        typeof content==='number'
          ? <span className="tile-number-label">{content}</span>
          : <span className={`tile-content-v3 ${contentClass}`}>{content}</span>
      )}
      {tile.state==='hidden'&&isAdjacent&&<div className="tile-adj-glow"/>}
    </div>
  );
}

function getPowerupIcon(type){return{shield:'🛡️',slowmo:'⏱️',reveal:'👁️',doublescore:'⭐'}[type]||'✨';}

// ─── ABILITY HUD ──────────────────────────────────────────────────
function AbilityHUD({ skinId, ability, usesLeft, usesMax }) {
  if (!ability || !skinId) return null;
  const abilityDef = SKIN_ABILITIES[ability];
  if (!abilityDef) return null;
  const dots = Array.from({ length: usesMax }, (_, i) => i < usesLeft);
  return (
    <div className="ability-hud">
      <span className="ability-hud-icon">{abilityDef.icon}</span>
      <div className="ability-hud-dots">
        {dots.map((filled, i) => (
          <div key={i} className={`ability-dot ${filled ? 'ability-dot-filled' : 'ability-dot-empty'}`}/>
        ))}
      </div>
      <span className="ability-hud-name">{abilityDef.name}</span>
    </div>
  );
}

// ─── HEARTS ──────────────────────────────────────────────────────
function Hearts({ current, max }) {
  return (
    <div className="hearts-row">
      {Array.from({length:max}).map((_,i)=>(
        <span key={i} className={`heart-icon ${i<current?'heart-alive':'heart-lost'}`}>{i<current?'❤️':'🖤'}</span>
      ))}
    </div>
  );
}

// ─── COMBO DISPLAY ────────────────────────────────────────────────
function ComboDisplay({ combo }) {
  const info = getComboLabel(combo);
  if(!info) return null;
  return (
    <div className="combo-display" style={{'--combo-color':info.color}}>
      <span className="combo-text">{info.label}</span>
    </div>
  );
}

// ─── TRAIL PARTICLES ─────────────────────────────────────────────
function TrailParticles({ trails, equippedTrail }) {
  if(!equippedTrail||equippedTrail==='none'||trails.length===0) return null;
  return (
    <>
      {trails.map(t=>(
        <div key={t.id} className="trail-particle" style={{
          left:t.x, top:t.y, width:t.size, height:t.size,
          background:t.color, animationDuration:`${t.life}ms`,
          boxShadow:equippedTrail==='sparkle'?`0 0 ${t.size}px ${t.color}`:'none',
        }}/>
      ))}
    </>
  );
}

// ─── CONFETTI ────────────────────────────────────────────────────
function Confetti() {
  const pieces = React.useMemo(()=>Array.from({length:50},(_,i)=>({
    id:i, x:Math.random()*100,
    color:`hsl(${Math.random()*360},90%,60%)`,
    delay:Math.random()*0.8, duration:1.8+Math.random()*1.2,
    size:6+Math.random()*10, shape:Math.random()>0.5?'3px':'50%',
  })),[]);
  return (
    <div className="confetti-container">
      {pieces.map(p=>(
        <div key={p.id} className="confetti-piece" style={{
          left:`${p.x}vw`,background:p.color,
          animationDelay:`${p.delay}s`,animationDuration:`${p.duration}s`,
          width:p.size,height:p.size,borderRadius:p.shape,
        }}/>
      ))}
    </div>
  );
}

// ─── OBSTACLE OVERLAY ─────────────────────────────────────────────
function ObstacleOverlay({ obstacle, onDone }) {
  useEffect(()=>{if(obstacle){const t=setTimeout(onDone,2500);return()=>clearTimeout(t);}},[obstacle]);
  if(!obstacle) return null;
  const msgs={thief:{icon:'🦊',text:'THIEF FOX!',sub:'Stole your powerup!',color:'#ff6b35'},wind:{icon:'💨',text:'WIND GUST!',sub:'You were pushed!',color:'#64b5f6'},scramble:{icon:'🔀',text:'SCRAMBLER!',sub:'Tiles re-hidden + combo reset!',color:'#ce93d8'}};
  const m=msgs[obstacle]||{icon:'⚠️',text:'OBSTACLE!',sub:'',color:'#fff'};
  return (
    <div className="obstacle-v3" style={{'--obs-color':m.color}}>
      <div className="obs-icon">{m.icon}</div>
      <div className="obs-text">{m.text}</div>
      <div className="obs-sub">{m.sub}</div>
    </div>
  );
}

// ─── ABILITY POPUP ────────────────────────────────────────────────
function AbilityPopup({ ability, show }) {
  if (!show || !ability) return null;
  const abilityDef = SKIN_ABILITIES[ability];
  if (!abilityDef) return null;
  return (
    <div className="ability-popup">
      <span className="ability-popup-icon">{abilityDef.icon}</span>
      <span className="ability-popup-name">{abilityDef.name.toUpperCase()} ACTIVATED!</span>
    </div>
  );
}

// ─── PAUSE MENU ───────────────────────────────────────────────────
function PauseMenu({ level, hearts, maxHearts, combo, isEndless, skinId, ability, usesLeft, usesMax, onResume, onRestart, onHome }) {
  const peekCost = getPeekCost(level);
  const abilityDef = ability ? SKIN_ABILITIES[ability] : null;
  return (
    <div className="pause-overlay">
      <div className="pause-panel">
        <div className="pause-icon">⏸</div>
        <div className="pause-title">{isEndless?'∞ ENDLESS':'PAUSED'}</div>
        <div className="pause-level">Level {level}</div>
        <Hearts current={hearts} max={maxHearts}/>
        {combo>=2&&<div className="pause-combo">🔥 Combo x{getComboMultiplier(combo)} active</div>}
        {abilityDef && (
          <div className="pause-ability">
            {abilityDef.icon} {abilityDef.name}: {usesLeft}/{usesMax} uses left
          </div>
        )}
        <div className="pause-buttons">
          <button className="pause-btn pause-resume" onClick={onResume}><span>▶</span> RESUME</button>
          <button className="pause-btn pause-restart" onClick={onRestart}><span>🔄</span> RESTART</button>
          <button className="pause-btn pause-home" onClick={onHome}><span>🏠</span> HOME</button>
        </div>
        <div className="pause-tip">💡 Numbers = nearby mines • Long press to peek (-{peekCost}s)</div>
      </div>
    </div>
  );
}

function HeartLostFlash({ show }) {
  if(!show) return null;
  return <div className="heart-lost-flash">💔 -1 Heart!</div>;
}

function EndlessBanner({ level }) {
  return (
    <div className="endless-banner">
      <span className="endless-infinity">∞</span>
      <span className="endless-label">ENDLESS</span>
      <span className="endless-wave">Wave {level}</span>
    </div>
  );
}

// ─── MAIN GAMEPLAY SCREEN ─────────────────────────────────────────
export default function GameplayScreen({ startLevel=1, isEndless=false, onGameOver, onLevelComplete, onHome }) {
  const [level,setLevel]               = useState(startLevel);
  const [tiles,setTiles]               = useState([]);
  const [chicken,setChicken]           = useState({r:0,c:0});
  const [timer,setTimer]               = useState(30);
  const [timerMax,setTimerMax]         = useState(30);
  const [seeds,setSeeds]               = useState(gameStore.getSeeds());
  const [activePowerup,setActivePowerup] = useState(null);
  const [powerupTimer,setPowerupTimer] = useState(0);
  const [hasShield,setHasShield]       = useState(false);
  const [chickenAnim,setChickenAnim]   = useState('idle');
  const [chickenExpr,setChickenExpr]   = useState('normal');
  const [shaking,setShaking]           = useState(false);
  const [showConfetti,setShowConfetti] = useState(false);
  const [obstacle,setObstacle]         = useState(null);
  const [doubleScore,setDoubleScore]   = useState(false);
  const [gamePhase,setGamePhase]       = useState('playing');
  const [levelSeeds,setLevelSeeds]     = useState(0);
  const [rows,setRows]                 = useState(6);
  const [cols,setCols]                 = useState(8);
  const [slowMoActive,setSlowMoActive] = useState(false);
  const [touchStart,setTouchStart]     = useState(null);
  const [isPaused,setIsPaused]         = useState(false);
  const [hearts,setHearts]             = useState(3);
  const [maxHearts,setMaxHearts]       = useState(3);
  const [combo,setCombo]               = useState(0);
  const [showHeartLost,setShowHeartLost] = useState(false);
  const [trails,setTrails]             = useState([]);
  const [showWorldBanner,setShowWorldBanner] = useState(false);
  const [showBossBanner,setShowBossBanner]   = useState(false);
  const [endlessTotalSeeds,setEndlessTotalSeeds] = useState(0);
  // Achievement notification queue
  const [achNotif, setAchNotif] = useState(null); // { id, icon, name, reward }
  const achQueueRef = useRef([]);
  // World briefing + ability tutorial state
  const [showWorldBriefing, setShowWorldBriefing] = useState(null); // worldId or null
  const [showAbilityTut,    setShowAbilityTut]    = useState(false);
  const abilityTutShownRef = useRef(false);

  // ── Ability state ──
  const [abilityUsesLeft, setAbilityUsesLeft] = useState(0);
  const [abilityUsesMax,  setAbilityUsesMax]  = useState(0);
  const [showAbilityPopup,setShowAbilityPopup]= useState(false);
  // Phase (ghost) free peeks remaining
  const [freePeeksLeft, setFreePeeksLeft]     = useState(0);
  const abilityUsesRef = useRef(0);
  const freePeeksRef   = useRef(0);

  const trailIdRef   = useRef(0);
  const timerRef     = useRef(null);
  const obstacleTimerRef = useRef(null);
  const timerVal     = useRef(30);
  const slowMoRef    = useRef(false);
  const levelRef     = useRef(startLevel);
  const gamePhaseRef = useRef('playing');
  const pauseRef     = useRef(false);
  const diffRef      = useRef(null);
  const heartsRef    = useRef(3);
  const comboRef     = useRef(0);
  const endlessSeedsRef = useRef(0);
  // Per-level achievement tracking refs
  const levelPeekCountRef    = useRef(0);
  const levelPowerupCountRef = useRef(0);
  const levelHeartLostRef    = useRef(false);
  const levelShieldBlocksRef = useRef(0);

  const equippedTheme     = gameStore.getEquippedTheme();
  const equippedSkin      = gameStore.getEquippedSkin();
  const equippedTile      = gameStore.getEquippedTile();
  const equippedTrail     = gameStore.getEquippedTrail();
  const equippedMine      = gameStore.getEquippedMine();
  const equippedAccessory = gameStore.getEquippedAccessory();

  // Skin ability data
  const skinData      = CHICKEN_SKINS.find(s => s.id === equippedSkin) || CHICKEN_SKINS[0];
  const currentAbility= skinData.ability;
  const upgradeLevel  = currentAbility ? gameStore.getAbilityUpgradeLevel(equippedSkin) : 1;

  const spawnTrail = (tileR, tileC, cw, ch) => {
    if(!equippedTrail||equippedTrail==='none') return;
    const colors={sparkle:['#FFD700','#fff','#ffe066'],fire:['#ff4400','#ff8800','#ffcc00'],rainbow:['#ff0000','#ff8800','#ffff00','#00cc00','#0088ff','#8800ff']};
    const palette=colors[equippedTrail]||colors.sparkle;
    const cx=tileC*(cw+3)+cw/2, cy=tileR*(ch+3)+ch/2;
    const newParticles=Array.from({length:6},()=>({
      id:++trailIdRef.current,
      x:cx+(Math.random()-0.5)*cw*0.7, y:cy+(Math.random()-0.5)*ch*0.7,
      size:4+Math.random()*6, color:palette[Math.floor(Math.random()*palette.length)], life:600+Math.random()*400,
    }));
    setTrails(prev=>[...prev.slice(-40),...newParticles]);
    setTimeout(()=>setTrails(prev=>prev.filter(t=>!newParticles.find(n=>n.id===t.id))),1100);
  };

  // ── Ability reset per world boundary ──
  const resetAbilityForWorld = useCallback((lvl) => {
    if (!currentAbility) return;
    const worldNum = getWorld(lvl).num;
    const cap = getWorldAbilityUses(equippedSkin, worldNum, upgradeLevel);
    // Phase ability: free peeks
    if (currentAbility === 'phase') {
      const peeks = getPhasePeeks(upgradeLevel) * cap; // total free peeks for this world
      freePeeksRef.current = peeks; setFreePeeksLeft(peeks);
      abilityUsesRef.current = cap; setAbilityUsesLeft(cap); setAbilityUsesMax(cap);
    } else {
      abilityUsesRef.current = cap; setAbilityUsesLeft(cap); setAbilityUsesMax(cap);
    }
  }, [currentAbility, equippedSkin, upgradeLevel]);

  // Detect world boundary crossing and reset ability uses
  const prevWorldNumRef = useRef(0);

  const initLevel = useCallback((lvl) => {
    const diff = getDifficultyConfig(lvl, isEndless);
    diffRef.current = diff;
    const worldNum = getWorld(lvl).num;

    // Robot scan mode per upgrade level — only runs if uses are available
    let scanMode = 'none';
    if (currentAbility === 'scan' && abilityUsesRef.current > 0) {
      if (upgradeLevel === 1) scanMode = 'nearby';
      else if (upgradeLevel === 2) scanMode = 'all';
      else scanMode = 'all+lava';
      abilityUsesRef.current = Math.max(0, abilityUsesRef.current - 1);
      setAbilityUsesLeft(abilityUsesRef.current);
    }

    const newTiles = generateGrid(diff.rows, diff.cols, diff.mineRate, lvl, diff, scanMode);
    const gravFlip = diff.gravityFlip || false;
    const startR   = gravFlip ? 0 : diff.rows - 1;
    const startC   = gravFlip ? diff.cols - 1 : 0;
    const mh       = getMaxHearts(lvl);
    const timeStretch = gameStore.hasPowerupUpgrade('time_stretch') ? 5 : 0;
    const tMax     = getTimerMax(isEndless ? Math.min(lvl, 30) : lvl) + timeStretch;

    setRows(diff.rows); setCols(diff.cols);
    setTiles(newTiles);
    setChicken({r:startR,c:startC});
    setTimer(tMax); setTimerMax(tMax); timerVal.current = tMax;
    setActivePowerup(null); setPowerupTimer(0);
    setHasShield(false); setDoubleScore(false);
    setSlowMoActive(false); slowMoRef.current = false;
    setShowConfetti(false); setObstacle(null);
    setChickenAnim('idle'); setChickenExpr('normal');
    levelRef.current = lvl;
    gamePhaseRef.current = 'playing'; setGamePhase('playing');
    setIsPaused(false); pauseRef.current = false;
    setMaxHearts(mh);
    setHearts(h=>{const capped=Math.min(h,mh);heartsRef.current=capped;return capped;});
    const comboStart = 0;
    setCombo(comboStart); comboRef.current = comboStart;
    setTrails([]);
    // Reset per-level achievement trackers
    levelPeekCountRef.current    = 0;
    levelPowerupCountRef.current = 0;
    levelHeartLostRef.current    = false;
    levelShieldBlocksRef.current = 0;

    // Reset ability uses every level (world boundary gives more uses via cap)
    if (worldNum !== prevWorldNumRef.current) {
      prevWorldNumRef.current = worldNum;
    }
    resetAbilityForWorld(lvl);

    if (!isEndless) {
      const prevWorld = lvl>1?getWorld(lvl-1).id:null;
      const curWorld  = getWorld(lvl).id;
      const isNewWorld = prevWorld!==curWorld||lvl===1;
      const isBoss = isBossLevel(lvl);

      if (isNewWorld && isBoss) {
        // Show world banner first, then boss banner after it clears
        setTimeout(()=>{setShowWorldBanner(true);setTimeout(()=>setShowWorldBanner(false),2200);},300);
        setTimeout(()=>{setShowBossBanner(true);setTimeout(()=>setShowBossBanner(false),2600);},2700);
      } else if (isNewWorld) {
        setTimeout(()=>{setShowWorldBanner(true);setTimeout(()=>setShowWorldBanner(false),2600);},300);
      } else if (isBoss) {
        setTimeout(()=>{setShowBossBanner(true);setTimeout(()=>setShowBossBanner(false),2900);},300);
      }

      // Phase 2: World briefing on first entry to cave/volcano/space
      if (prevWorld !== curWorld && curWorld !== 'farm' && !gameStore.isWorldBriefingSeen(curWorld)) {
        gameStore.markWorldBriefingSeen(curWorld);
        setTimeout(() => setShowWorldBriefing(curWorld), isNewWorld ? 3200 : 800);
      }
    }
  }, [isEndless, currentAbility, upgradeLevel, resetAbilityForWorld]);

  useEffect(()=>{
    const mh=getMaxHearts(startLevel);
    heartsRef.current=mh; setHearts(mh); setMaxHearts(mh);
    // Init ability for starting world
    prevWorldNumRef.current = getWorld(startLevel).num;
    resetAbilityForWorld(startLevel);
    initLevel(startLevel);
    audio.startBackground();
    // Phase 3: Ability tutorial on first skin equip
    if (currentAbility && !abilityTutShownRef.current && !gameStore.isAbilityTutSeen(equippedSkin)) {
      abilityTutShownRef.current = true;
      gameStore.markAbilityTutSeen(equippedSkin);
      setTimeout(() => setShowAbilityTut(true), 1200);
    }
  },[]);

  const handlePause   = useCallback(()=>{const next=!pauseRef.current;pauseRef.current=next;setIsPaused(next);},[]);
  const handleResume  = useCallback(()=>{pauseRef.current=false;setIsPaused(false);},[]);
  const handleRestart = useCallback(()=>{
    const mh=getMaxHearts(levelRef.current);
    heartsRef.current=mh; setHearts(mh);
    endlessSeedsRef.current=0; setEndlessTotalSeeds(0);
    prevWorldNumRef.current = getWorld(levelRef.current).num;
    resetAbilityForWorld(levelRef.current);
    initLevel(levelRef.current);
  },[initLevel, resetAbilityForWorld]);

  // Timer: real-time drain
  useEffect(()=>{
    if(gamePhase!=='playing') return;
    clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      if(pauseRef.current||gamePhaseRef.current!=='playing') return;
      const slowFactor=slowMoRef.current?0.5:1;
      timerVal.current=Math.max(0,timerVal.current-0.1*slowFactor);
      setTimer(timerVal.current);
      if(timerVal.current<=0){
        gamePhaseRef.current='gameover'; setGamePhase('gameover');
        clearInterval(timerRef.current); audio.gameOver(); setChickenAnim('explode');
        setTimeout(()=>{onGameOver({level:levelRef.current,seeds:isEndless?endlessSeedsRef.current:0,combo:comboRef.current,isEndless});},1500);
      } else if(timerVal.current<=5&&Math.random()<0.3) audio.timerLow();
    },100);
    return()=>clearInterval(timerRef.current);
  },[gamePhase]);

  const idleTimerRef=useRef(null);
  useEffect(()=>{
    if(gamePhase!=='playing') return;
    const adjMines=tiles.filter(t=>{const dr=Math.abs(t.r-chicken.r),dc=Math.abs(t.c-chicken.c);return(dr<=1&&dc<=1&&!(dr===0&&dc===0))&&t.isMine&&t.state==='hidden';}).length;
    clearTimeout(idleTimerRef.current);
    if(adjMines>=3)setChickenExpr('scared');
    else if(adjMines>=2)setChickenExpr('sweat');
    else if(comboRef.current>=4)setChickenExpr('hype');
    else{
      setChickenExpr('normal');
      idleTimerRef.current=setTimeout(()=>{
        if(gamePhaseRef.current==='playing'&&!pauseRef.current){setChickenExpr('look');setTimeout(()=>setChickenExpr('normal'),2000);}
      },5000);
    }
    return()=>clearTimeout(idleTimerRef.current);
  },[chicken,tiles,gamePhase]);

  useEffect(()=>{
    if(gamePhase!=='playing') return;
    const diff=diffRef.current;
    if(!diff||diff.obstacleFreq===0) return;
    const schedule=()=>{
      const delay=(12+Math.random()*15)*1000/diff.obstacleFreq;
      obstacleTimerRef.current=setTimeout(()=>{
        if(gamePhaseRef.current!=='playing') return;
        const types=['thief','wind','scramble'];
        triggerObstacle(types[Math.floor(Math.random()*types.length)]);
        schedule();
      },delay);
    };
    schedule();
    return()=>clearTimeout(obstacleTimerRef.current);
  },[gamePhase,level]);

  useEffect(()=>{
    if(gamePhase!=='playing') return;
    const diff=diffRef.current;
    if(!diff||!diff.movingMines) return;
    const interval=setInterval(()=>{
      if(pauseRef.current||gamePhaseRef.current!=='playing') return;
      setTiles(ts=>{
        const mines=ts.filter(t=>t.isMine&&t.state==='hidden'&&!t.isCheckpoint&&!t.isStart);
        if(mines.length===0) return ts;
        const newTiles=[...ts];
        const mine=mines[Math.floor(Math.random()*mines.length)];
        const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
        for(const[dr,dc]of dirs.sort(()=>Math.random()-0.5)){
          const nr=mine.r+dr,nc=mine.c+dc;
          const target=newTiles.find(t=>t.r===nr&&t.c===nc);
          if(target&&!target.isMine&&!target.isCheckpoint&&!target.isStart&&target.state==='hidden'){
            const mi=newTiles.findIndex(t=>t.r===mine.r&&t.c===mine.c);
            const ti=newTiles.findIndex(t=>t.r===nr&&t.c===nc);
            if(mi>=0&&ti>=0){
              newTiles[mi]={...newTiles[mi],isMine:false,isSafe:true,adjMines:0};
              newTiles[ti]={...newTiles[ti],isMine:true,isSafe:false,powerup:null};
              [newTiles[mi],newTiles[ti]].forEach(t=>{
                const adj=newTiles.filter(x=>{const dr2=Math.abs(x.r-t.r),dc2=Math.abs(x.c-t.c);return dr2<=1&&dc2<=1&&!(dr2===0&&dc2===0)&&x.isMine;}).length;
                const idx=newTiles.findIndex(x=>x.r===t.r&&x.c===t.c);
                if(idx>=0)newTiles[idx]={...newTiles[idx],adjMines:adj};
              });
            }
            break;
          }
        }
        return newTiles;
      });
    },4000);
    return()=>clearInterval(interval);
  },[gamePhase,level]);

  const triggerObstacle=useCallback((type)=>{
    setObstacle(type);
    if(type==='thief'){audio.thiefFox();setActivePowerup(null);setHasShield(false);setDoubleScore(false);setSlowMoActive(false);slowMoRef.current=false;}
    else if(type==='wind'){
      audio.windGust();
      setChicken(prev=>{
        const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
        const dir=dirs[Math.floor(Math.random()*dirs.length)];
        const diff=diffRef.current;
        const newR=Math.max(0,Math.min((diff?.rows||6)-1,prev.r+dir[0]));
        const newC=Math.max(0,Math.min((diff?.cols||8)-1,prev.c+dir[1]));
        setTiles(ts=>{
          const target=ts.find(t=>t.r===newR&&t.c===newC);
          if(target&&target.state==='hidden'){
            if(target.isMine){
              if(hasShield){const rem=hasShield-1;setHasShield(rem);if(rem<=0)setActivePowerup(null);return ts.map(t=>t.r===newR&&t.c===newC?{...t,state:'revealed',isMine:false}:t);}
              setTimeout(()=>handleMineHit(target),0);
              return ts.map(t=>t.r===newR&&t.c===newC?{...t,state:'mine'}:t);
            }
            return ts.map(t=>t.r===newR&&t.c===newC?{...t,state:'revealed'}:t);
          }
          return ts;
        });
        return{r:newR,c:newC};
      });
    } else if(type==='scramble'){
      audio.obstacleScramble();
      setTiles(ts=>ts.map(t=>t.state==='revealed'&&!t.isStart?{...t,state:'hidden'}:t));
      setCombo(0);comboRef.current=0;
    }
    setTimeout(()=>setObstacle(null),2500);
  },[]);

  const isAdj=(tile,pos)=>{const dr=Math.abs(tile.r-pos.r),dc=Math.abs(tile.c-pos.c);return(dr===1&&dc===0)||(dr===0&&dc===1);};
  // Jump: allow stepping 2 tiles away (same row OR same col, 2 distance)
  const isJumpRange=(tile,pos)=>{
    const dr=Math.abs(tile.r-pos.r),dc=Math.abs(tile.c-pos.c);
    return (dr===2&&dc===0)||(dr===0&&dc===2);
  };

  // ── Achievement checker ──
  const checkAchievements = useCallback((context = {}) => {
    const queue = [];
    const stats = gameStore.getStats();
    const totalSeeds = gameStore.getSeeds();
    const bestLevel  = gameStore.getBestLevel();

    const tryUnlock = (id) => {
      if (!gameStore.isAchievementUnlocked(id)) {
        const def = ACHIEVEMENTS.find(a => a.id === id);
        if (def && gameStore.unlockAchievement(id)) {
          gameStore.addSeeds(def.reward);
          queue.push({ id, icon: def.icon, name: def.name, reward: def.reward });
        }
      }
    };

    // Milestone
    if (context.levelCompleted >= 1)  tryUnlock('first_step');
    if (context.levelCompleted >= 9)  tryUnlock('farm_grad');
    if (context.levelCompleted >= 19) tryUnlock('cave_dweller');
    if (context.levelCompleted >= 29) tryUnlock('volcano_survivor');
    if (context.levelCompleted >= 30) tryUnlock('space_pioneer');
    if (context.levelCompleted >= 100)tryUnlock('century');

    // Seeds
    if (totalSeeds >= 100)  tryUnlock('planter');
    if (totalSeeds >= 500)  tryUnlock('farmer');
    if (totalSeeds >= 2000) tryUnlock('harvest_king');

    // Skill
    if (context.fullHearts)   tryUnlock('perfectionist');
    if (context.combo >= 10)  tryUnlock('on_fire');
    if (context.speedRun)     tryUnlock('speed_runner');
    if (context.noPeek)       tryUnlock('blind_faith');
    if ((stats.totalShieldBlocks || 0) >= 10) tryUnlock('untouchable');

    // Hidden
    if ((stats.totalMineHits || 0) >= 50)    tryUnlock('brave_fool');
    if ((stats.consecutiveHeartlessLevels || 0) >= 5) tryUnlock('ghost_run');
    if (context.powerups >= 3) tryUnlock('lucky_cluck');

    if (queue.length > 0) {
      achQueueRef.current = [...achQueueRef.current, ...queue];
      // Show first in queue, chain the rest
      const showNext = () => {
        if (achQueueRef.current.length === 0) return;
        const next = achQueueRef.current.shift();
        setAchNotif(next);
        setTimeout(() => { setAchNotif(null); setTimeout(showNext, 300); }, 2800);
      };
      if (!achNotif) showNext();
    }
  }, [achNotif]);

  const handleMineHit=useCallback((tile)=>{
    setShaking(true); audio.mineExplosion();
    setTimeout(()=>setShaking(false),600);
    const newHearts=heartsRef.current-1;
    heartsRef.current=newHearts; setHearts(newHearts);
    setCombo(0); comboRef.current=0;
    // Achievement stats
    levelHeartLostRef.current = true;
    gameStore.updateStats({ mineHit: true, heartLostReset: true });
    checkAchievements({ combo: 0 });
    setShowHeartLost(true); setTimeout(()=>setShowHeartLost(false),1200);
    if(newHearts<=0){
      setChickenAnim('explode');
      gamePhaseRef.current='gameover'; setGamePhase('gameover');
      clearInterval(timerRef.current);
      if(isEndless){
        setTimeout(()=>onGameOver({level:levelRef.current,seeds:endlessSeedsRef.current,combo:comboRef.current,isEndless:true}),1500);
      } else {
        const failedLvl=levelRef.current;
        const worldStartLevel=failedLvl>=30?30:failedLvl>=20?20:failedLvl>=10?10:1;
        gameStore.setSavedLevel(worldStartLevel);
        setTimeout(()=>onGameOver({level:failedLvl,seeds:0,combo:comboRef.current,worldStart:worldStartLevel}),1500);
      }
    } else {
      setChickenAnim('explode'); setTimeout(()=>setChickenAnim('idle'),800);
      if(tile)setTiles(ts=>ts.map(t=>t.r===tile.r&&t.c===tile.c?{...t,state:'mine'}:t));
    }
  },[onGameOver,isEndless]);

  // ── Activate skin ability ──
  const activateAbility = useCallback((tile) => {
    if (abilityUsesRef.current <= 0) return false;
    if (!currentAbility) return false;

    if (currentAbility === 'dodge') {
      // Dodge: absorb the mine silently
      abilityUsesRef.current--; setAbilityUsesLeft(abilityUsesRef.current);
      setChickenAnim('ability'); setTimeout(()=>setChickenAnim('idle'),600);
      setShowAbilityPopup(true); setTimeout(()=>setShowAbilityPopup(false),1200);
      setTiles(ts=>ts.map(t=>t.r===tile.r&&t.c===tile.c?{...t,state:'revealed',isMine:false}:t));
      setChicken({r:tile.r,c:tile.c});
      return true;
    }

    if (currentAbility === 'jump') {
      // Jump: step onto a non-adjacent tile (2 away, same row/col) — called on step, not here
      // handled in handleTileStep
    }

    return false;
  }, [currentAbility]);

  const handleTileStep=useCallback((tile)=>{
    if(gamePhase!=='playing'||isPaused) return;
    const adj   = isAdj(tile,chicken);
    const jump  = currentAbility==='jump' && abilityUsesRef.current>0 && isJumpRange(tile,chicken);

    if(!adj && !jump) return;

    // Consume jump charge
    if (jump && !adj) {
      abilityUsesRef.current--; setAbilityUsesLeft(abilityUsesRef.current);
      setShowAbilityPopup(true); setTimeout(()=>setShowAbilityPopup(false),1000);
    }

    if(tile.state==='checkpoint'){handleLevelComplete();return;}
    if(tile.state==='revealed'){
      setChicken({r:tile.r,c:tile.c}); setChickenAnim('walk'); setTimeout(()=>setChickenAnim('idle'),300);
      return;
    }
    if(tile.state==='peeked'){
      if(tile.isMine){
        // Try dodge before taking damage
        if(currentAbility==='dodge'&&abilityUsesRef.current>0){activateAbility(tile);return;}
        setTiles(ts=>ts.map(t=>t.r===tile.r&&t.c===tile.c?{...t,state:'mine'}:t));
        handleMineHit(tile);
      } else{setChicken({r:tile.r,c:tile.c});setChickenAnim('walk');setTimeout(()=>setChickenAnim('idle'),300);}
      return;
    }
    if(tile.state!=='hidden') return;

    if(tile.isMine){
      // Shield first
      if(hasShield){
        const remaining = hasShield - 1;
        setHasShield(remaining); if(remaining<=0) setActivePowerup(null);
        setTiles(ts=>ts.map(t=>t.r===tile.r&&t.c===tile.c?{...t,state:'revealed',isMine:false}:t));
        setChicken({r:tile.r,c:tile.c});setChickenAnim('shield');setTimeout(()=>setChickenAnim('idle'),600);
        levelShieldBlocksRef.current++;
        gameStore.updateStats({ shieldBlock: true });
        checkAchievements({});
        return;
      }
      // Dodge second
      if(currentAbility==='dodge'&&abilityUsesRef.current>0){activateAbility(tile);return;}
      setTiles(ts=>ts.map(t=>t.r===tile.r&&t.c===tile.c?{...t,state:'mine'}:t));
      handleMineHit(tile);
    } else {
      setTiles(ts=>ts.map(t=>t.r===tile.r&&t.c===tile.c?{...t,state:'revealed'}:t));
      audio.safeTap();
      setChicken({r:tile.r,c:tile.c});
      setChickenAnim('walk'); setTimeout(()=>setChickenAnim('idle'),300);
      spawnTrail(tile.r,tile.c,cellSize.w,cellSize.h);

      // Lava — Fireproof ability ignores cost
      if(tile.isLava){
        const isFireproof = currentAbility==='fireproof' && abilityUsesRef.current>0;
        if(isFireproof){
          abilityUsesRef.current--; setAbilityUsesLeft(abilityUsesRef.current);
          setShowAbilityPopup(true); setTimeout(()=>setShowAbilityPopup(false),1000);
        } else {
          const lavaCost=diffRef.current?.world==='volcano'?2:3;
          timerVal.current=Math.max(0,timerVal.current-lavaCost);
          setTimer(timerVal.current);
        }
      }

      const newCombo=comboRef.current+1; comboRef.current=newCombo; setCombo(newCombo);
      gameStore.updateBestCombo(newCombo);
      if(tile.powerup) collectPowerup(tile.powerup);
    }
  },[gamePhase,chicken,hasShield,tiles,isPaused,handleMineHit,currentAbility,activateAbility]);

  const handleLongPress=useCallback((tile)=>{
    if(gamePhase!=='playing'||isPaused) return;
    if(!isAdj(tile,chicken)) return;
    if(tile.state!=='hidden') return;

    // Ghost Phase: free peeks
    if(currentAbility==='phase'&&freePeeksRef.current>0){
      freePeeksRef.current--; setFreePeeksLeft(freePeeksRef.current);
      if(freePeeksRef.current===0){setShowAbilityPopup(true);setTimeout(()=>setShowAbilityPopup(false),1000);}
      // Free peek — no timer cost
    } else {
      const cost=getPeekCost(levelRef.current);
      timerVal.current=Math.max(0,timerVal.current-cost);
      setTimer(timerVal.current);
    }

    audio.peek();
    levelPeekCountRef.current++;
    const eagleEye = gameStore.hasPowerupUpgrade('eagle_eye');
    setTiles(ts => {
      return ts.map(t => {
        if (t.r === tile.r && t.c === tile.c) return {...t, state:'peeked'};
        if (eagleEye) {
          const dr = Math.abs(t.r - tile.r), dc = Math.abs(t.c - tile.c);
          if (dr <= 1 && dc <= 1 && t.state === 'hidden') return {...t, state:'peeked'};
        }
        return t;
      });
    });
    if(tile.isMine){
      setTimeout(()=>setTiles(ts=>ts.map(t=>{
        const dr=Math.abs(t.r-tile.r),dc=Math.abs(t.c-tile.c);
        if(t.r===tile.r&&t.c===tile.c&&t.state==='peeked') return{...t,state:'hidden'};
        if(eagleEye&&dr<=1&&dc<=1&&t.state==='peeked'&&!t.isStart) return{...t,state:'hidden'};
        return t;
      })),3000);
    }
  },[gamePhase,chicken,isPaused,currentAbility]);

  const collectPowerup=(type)=>{
    audio.powerupCollect(); setChickenAnim('powerup'); setTimeout(()=>setChickenAnim('idle'),500);
    levelPowerupCountRef.current++;
    if(type==='shield'){const charges=gameStore.hasPowerupUpgrade('shield_plus')?2:1;setHasShield(charges);setActivePowerup('shield');}
    else if(type==='slowmo'){
      setActivePowerup('slowmo');setSlowMoActive(true);slowMoRef.current=true;setPowerupTimer(8);
      let t=8; const interval=setInterval(()=>{t--;setPowerupTimer(t);if(t<=0){clearInterval(interval);setSlowMoActive(false);slowMoRef.current=false;setActivePowerup(null);}},1000);
    } else if(type==='reveal'){
      setActivePowerup('reveal');
      setTiles(ts=>ts.map(t=>t.state==='hidden'&&t.isMine?{...t,state:'peeked'}:t));
      setTimeout(()=>{setActivePowerup(null);setTiles(ts=>ts.map(t=>t.state==='peeked'&&t.isMine?{...t,state:'hidden'}:t));},2000);
    } else if(type==='doublescore'){
      setDoubleScore(true);setActivePowerup('doublescore');setPowerupTimer(10);
      let t=10; const interval=setInterval(()=>{t--;setPowerupTimer(t);if(t<=0){clearInterval(interval);setDoubleScore(false);setActivePowerup(null);}},1000);
    }
  };

  const handleLevelComplete=()=>{
    clearInterval(timerRef.current); clearTimeout(obstacleTimerRef.current);
    audio.levelComplete(); setShowConfetti(true); setChickenAnim('celebrate');
    const lvl=levelRef.current;
    const tMax=getTimerMax(isEndless?Math.min(lvl,30):lvl);
    const timerBonus=Math.floor(Math.min(timerVal.current/tMax*15,15));
    const comboBonus=Math.min(comboRef.current*2,20);
    const base=lvl*3+timerBonus+comboBonus;
    // Royal wealthy multiplier
    const wealthyMult=currentAbility==='wealthy'?getWealthyMultiplier(upgradeLevel):1;
    const magnetMult=gameStore.hasPowerupUpgrade('seed_magnet')?1.10:1;
    const earned=Math.floor(base*(doubleScore?2:1)*wealthyMult*magnetMult);
    gameStore.addSeeds(earned); setSeeds(gameStore.getSeeds()); setLevelSeeds(earned);
    // Update cumulative seed stat and check achievements
    gameStore.updateStats({ seedsEarned: earned, heartKept: !levelHeartLostRef.current ? true : undefined, heartLostReset: levelHeartLostRef.current ? true : undefined });
    const tMaxForCheck = getTimerMax(isEndless ? Math.min(lvl, 30) : lvl);
    checkAchievements({
      levelCompleted: lvl,
      fullHearts: heartsRef.current >= maxHearts,
      combo: comboRef.current,
      speedRun: timerVal.current / tMaxForCheck >= 0.80,
      noPeek: levelPeekCountRef.current === 0,
      powerups: levelPowerupCountRef.current,
    });

    if(isEndless){
      endlessSeedsRef.current+=earned; setEndlessTotalSeeds(endlessSeedsRef.current);
      const best=gameStore.getBestEndlessLevel(); if(lvl>best)gameStore.setBestEndlessLevel(lvl);
    } else {
      gameStore.updateBestLevel(lvl); gameStore.addLeaderboardEntry({level:lvl,seeds:earned});
      gameStore.setSavedLevel(lvl+1);
      const worldNum=lvl>=30?4:lvl>=20?3:lvl>=10?2:1; gameStore.updateWorldBest(worldNum,lvl);
      if(lvl===9)gameStore.unlockWorld(2); if(lvl===19)gameStore.unlockWorld(3); if(lvl===29)gameStore.unlockWorld(4);
    }
    gamePhaseRef.current='levelcomplete'; setGamePhase('levelcomplete');
    setTimeout(()=>{const next=lvl+1;levelRef.current=next;setLevel(next);initLevel(next);if(!isEndless)onLevelComplete(next);},2500);
  };

  const handleTouchStartGrid=(e)=>{const t=e.touches[0];setTouchStart({x:t.clientX,y:t.clientY});};
  const handleTouchEndGrid=(e)=>{
    if(!touchStart) return;
    const t=e.changedTouches[0]; const dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;
    if(Math.abs(dx)<40&&Math.abs(dy)<40) return;
    const dir=Math.abs(dx)>Math.abs(dy)?[0,dx>0?1:-1]:[dy>0?1:-1,0];
    const nr=chicken.r+dir[0],nc=chicken.c+dir[1];
    const adjTile=tiles.find(t=>t.r===nr&&t.c===nc);
    if(adjTile)handleTileStep(adjTile);
    setTouchStart(null);
  };

  const gridContainerRef=useRef(null);
  const [cellSize,setCellSize]=useState({w:44,h:44});
  useEffect(()=>{
    const update=()=>{
      const vw=window.innerWidth, vh=window.innerHeight;
      // Reserve ~160px for HUD, ability bar, powerup bar, combo display etc.
      const availH = vh - 160;
      const cw=Math.floor((vw-24)/cols);
      const ch=Math.floor(availH/rows);
      // Cap cell size so grid always fits, min 28px
      const cell = Math.max(Math.min(cw, ch), 28);
      setCellSize({w:cell, h:cell});
    };
    update(); window.addEventListener('resize',update); return()=>window.removeEventListener('resize',update);
  },[rows,cols]);

  const timerPct   = (timer/timerMax)*100;
  const timerColor = timerPct>50?'#4ade80':timerPct>25?'#fb923c':'#f87171';
  const timerPulse = timerPct<25;
  const comboInfo  = getComboLabel(combo);
  const currentWorld=getWorld(level);
  const peekCost   = getPeekCost(level);

  return (
    <div className={`gameplay-v3 ${shaking?'screen-shake':''} ${isEndless?'world-endless':currentWorld.bg} theme-${equippedTheme||'default'}`}
      onTouchStart={handleTouchStartGrid} onTouchEnd={handleTouchEndGrid}>
      <div className="gameplay-bg" style={{'--level':level}}/>
      {showConfetti&&<Confetti/>}
      <ObstacleOverlay obstacle={obstacle} onDone={()=>setObstacle(null)}/>
      <HeartLostFlash show={showHeartLost}/>
      {/* World Briefing */}
      {showWorldBriefing && (
        <WorldBriefing
          worldId={showWorldBriefing}
          onClose={() => { setShowWorldBriefing(null); }}
        />
      )}

      {/* Ability Tutorial */}
      {showAbilityTut && currentAbility && (
        <AbilityTutorial
          skinId={equippedSkin}
          ability={currentAbility}
          onClose={() => setShowAbilityTut(false)}
        />
      )}

      {achNotif && (
        <div className="ach-notif">
          <span className="ach-notif-icon">{achNotif.icon}</span>
          <div className="ach-notif-body">
            <div className="ach-notif-title">Achievement Unlocked!</div>
            <div className="ach-notif-name">{achNotif.name}</div>
          </div>
          <div className="ach-notif-reward">+{achNotif.reward} 🌾</div>
        </div>
      )}
      <AbilityPopup ability={currentAbility} show={showAbilityPopup}/>

      {isEndless&&<EndlessBanner level={level}/>}
      {!isEndless&&showWorldBanner&&(
        <div className="world-banner">
          <div className="world-banner-icon">{currentWorld.icon}</div>
          <div className="world-banner-name" style={{color:currentWorld.color}}>{currentWorld.name}</div>
          <div className="world-banner-level">Levels {currentWorld.id==='farm'?'1-9':currentWorld.id==='cave'?'10-19':currentWorld.id==='volcano'?'20-29':'30+'}</div>
        </div>
      )}
      {!isEndless&&showBossBanner&&(
        <div className="boss-banner">
          <div className="boss-banner-icon">💀</div>
          <div className="boss-banner-title">BOSS LEVEL!</div>
          <div className="boss-banner-sub">Level {level} — Survive if you can!</div>
        </div>
      )}

      {/* HUD */}
      <div className="hud-v3">
        <div className="hud-left">
          <div className="hud-level-badge">
            {isEndless&&<span className="hud-endless-tag">∞</span>}
            <span className="hud-lv-label">LV</span>
            <span className="hud-lv-num">{level}</span>
          </div>
          <Hearts current={hearts} max={maxHearts}/>
        </div>
        <div className="hud-center">
          <div className={`timer-wrap ${timerPulse?'timer-pulse':''}`}>
            <div className="timer-track"><div className="timer-fill" style={{width:`${timerPct}%`,background:timerColor}}/></div>
            <div className="timer-label" style={{color:timerColor}}>{Math.ceil(timer)}s</div>
          </div>
          <div className="peek-cost-hint">👁️ -{peekCost}s</div>
        </div>
        <div className="hud-right">
          <div className="hud-seeds-badge"><span>🌾</span><span>{seeds}</span></div>
          {isEndless&&<div className="hud-endless-seeds"><span>+{endlessTotalSeeds}</span></div>}
          <button className="hud-pause-btn" onClick={handlePause}>⏸</button>
        </div>
      </div>

      {/* Ability HUD */}
      <AbilityHUD
        skinId={equippedSkin}
        ability={currentAbility}
        usesLeft={currentAbility==='phase'?freePeeksLeft:abilityUsesLeft}
        usesMax={currentAbility==='phase'?getPhasePeeks(upgradeLevel)*abilityUsesMax:abilityUsesMax}
      />

      {combo>=2&&<ComboDisplay combo={combo}/>}

      {activePowerup&&(
        <div className="powerup-bar">
          <span className="powerup-bar-icon">{getPowerupIcon(activePowerup)}</span>
          <span className="powerup-bar-name">{activePowerup.toUpperCase()}</span>
          {powerupTimer>0&&<span className="powerup-bar-timer">{powerupTimer}s</span>}
        </div>
      )}

      {/* Grid */}
      <div className="grid-container-v3" ref={gridContainerRef}>
        <div style={{position:'relative',display:'inline-block'}}>
          <div className="grid-v3" style={{display:'grid',gridTemplateColumns:`repeat(${cols},${cellSize.w}px)`,gridTemplateRows:`repeat(${rows},${cellSize.h}px)`,gap:'3px'}}>
            {tiles.map(tile=>(
              <Tile key={`${tile.r}-${tile.c}`} tile={tile}
                isAdjacent={isAdj(tile,chicken)}
                onTap={handleTileStep} onLongPress={handleLongPress}
                cellW={cellSize.w} cellH={cellSize.h}
                equippedMineSkin={equippedMine}
                timerPct={timerPct}
              />
            ))}
          </div>
          <div style={{position:'absolute',top:0,left:0,pointerEvents:'none',width:cols*(cellSize.w+3)-3,height:rows*(cellSize.h+3)-3}}>
            <TrailParticles trails={trails} equippedTrail={equippedTrail}/>
            <Chicken skin={equippedSkin} accessory={equippedAccessory} animState={chickenAnim} expression={chickenExpr} position={chicken} cellW={cellSize.w} cellH={cellSize.h}/>
          </div>
        </div>
      </div>

      {gamePhase==='levelcomplete'&&(
        <div className="levelcomplete-v3">
          <div className="lc-badge">LEVEL {level-1} CLEARED</div>
          <div className="lc-title">COMPLETE! 🎉</div>
          <div className="lc-seeds">+{levelSeeds} 🌾
            {currentAbility==='wealthy'&&<span style={{color:'#FFD700',fontSize:12,marginLeft:4}}>(+{Math.round((getWealthyMultiplier(upgradeLevel)-1)*100)}% Wealthy)</span>}
          </div>
          {combo>=2&&comboInfo&&<div className="lc-combo" style={{color:comboInfo.color}}>{comboInfo.label} Bonus!</div>}
          {isEndless
            ?<div className="lc-world" style={{color:'#00e5ff'}}>∞ Wave {level} incoming...</div>
            :<>{isBossLevel(level-1)&&<div className="lc-world" style={{color:'#ff4444'}}>💀 Boss Cleared!</div>}<div className="lc-world" style={{color:getWorld(level).color}}>{getWorld(level).icon} Next: {getWorld(level).name}</div></>
          }
          <div className="lc-next">Loading {isEndless?'wave':'level'} {level}...</div>
        </div>
      )}

      {isPaused&&(
        <PauseMenu level={level} hearts={hearts} maxHearts={maxHearts} combo={combo}
          isEndless={isEndless} skinId={equippedSkin} ability={currentAbility}
          usesLeft={currentAbility==='phase'?freePeeksLeft:abilityUsesLeft}
          usesMax={currentAbility==='phase'?getPhasePeeks(upgradeLevel)*abilityUsesMax:abilityUsesMax}
          onResume={handleResume} onRestart={handleRestart} onHome={onHome}/>
      )}
    </div>
  );
}
