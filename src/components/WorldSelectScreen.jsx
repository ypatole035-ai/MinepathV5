import React, { useState, useEffect } from 'react';
import { gameStore } from '../store/gameStore';

const WORLDS = [
  { num:1, id:'farm',    name:'Chicken Farm', icon:'🌾', levels:'1-9',  color:'#8bc34a', bg:'#1a2e0d', desc:'Basic mines, shields only. Perfect for beginners!' },
  { num:2, id:'cave',    name:'Dark Cave',    icon:'🦇', levels:'10-19', color:'#78909c', bg:'#1a1208', desc:'Fake tiles, thief fox, and pitch-black danger.' },
  { num:3, id:'volcano', name:'Volcano',      icon:'🌋', levels:'20-29', color:'#ff5722', bg:'#2a0a00', desc:'Moving mines, lava tiles, and all obstacles.' },
  { num:4, id:'space',   name:'Deep Space',   icon:'🚀', levels:'30+',  color:'#64b5f6', bg:'#000814', desc:'Gravity flips, brutal mines. True champions only.' },
];

export default function WorldSelectScreen({ onSelectWorld, onBack }) {
  const [unlockedWorld, setUnlockedWorld] = useState(1);
  const [worldBest, setWorldBest] = useState({1:0,2:0,3:0,4:0});
  const [savedLevel, setSavedLevel] = useState(1);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setUnlockedWorld(gameStore.getUnlockedWorld());
    setWorldBest(gameStore.getWorldBest());
    setSavedLevel(gameStore.getSavedLevel());
    setTimeout(() => setShow(true), 80);
  }, []);

  const getWorldProgress = (world) => {
    const best = worldBest[world.num] || 0;
    if (!best) return 0;
    const start = world.num===1?1:world.num===2?10:world.num===3?20:30;
    const end   = world.num===1?9:world.num===2?19:world.num===3?29:999;
    return Math.min(((best - start + 1) / (end - start + 1)) * 100, 100);
  };

  const getContinueLevel = (world) => {
    const start = world.num===1?1:world.num===2?10:world.num===3?20:30;
    const end   = world.num===1?9:world.num===2?19:world.num===3?29:999;
    if(savedLevel >= start && savedLevel <= end) return savedLevel;
    return start;
  };

  return (
    <div className="ws-screen">
      <div className="ws-header">
        <button className="ws-back-btn" onClick={onBack}>← Back</button>
        <div className="ws-title">🗺️ WORLDS</div>
        <div className="ws-seeds">🌾 {gameStore.getSeeds()}</div>
      </div>

      <div className={`ws-list ${show?'ws-show':''}`}>
        {WORLDS.map((world, i) => {
          const locked = world.num > unlockedWorld;
          const progress = getWorldProgress(world);
          const contLevel = getContinueLevel(world);
          const isCurrent = savedLevel >= (world.num===1?1:world.num===2?10:world.num===3?20:30)
                         && savedLevel <= (world.num===4?999:world.num*10);
          const isComplete = (worldBest[world.num]||0) >= (world.num===4?999:world.num*10);

          return (
            <div
              key={world.id}
              className={`ws-card ${locked?'ws-locked':''} ${isCurrent?'ws-current':''} ${isComplete?'ws-complete':''}`}
              style={{'--wcolor': world.color, '--wbg': world.bg, animationDelay:`${i*0.08}s`}}
              onClick={() => !locked && onSelectWorld(world.num, contLevel)}
            >
              <div className="ws-card-left">
                <div className="ws-world-icon">{locked ? '🔒' : world.icon}</div>
              </div>
              <div className="ws-card-body">
                <div className="ws-card-header">
                  <div className="ws-world-name" style={{color: locked?'rgba(255,255,255,0.3)':world.color}}>
                    {world.name}
                  </div>
                  <div className="ws-levels-badge">Lv {world.levels}</div>
                </div>
                <div className="ws-desc">{locked ? `Complete World ${world.num-1} to unlock` : world.desc}</div>
                {!locked && (
                  <div className="ws-progress-row">
                    <div className="ws-progress-bar">
                      <div className="ws-progress-fill" style={{width:`${progress}%`, background:world.color}}/>
                    </div>
                    <span className="ws-progress-pct">{Math.round(progress)}%</span>
                  </div>
                )}
              </div>
              <div className="ws-card-right">
                {!locked && !isComplete && (
                  <div className="ws-play-btn" style={{background:world.color}}>
                    {isCurrent ? `▶ Lv${contLevel}` : '▶ Start'}
                  </div>
                )}
                {isComplete && <div className="ws-complete-badge">✅</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
