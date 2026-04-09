import React, { useEffect, useState } from 'react';
import { gameStore } from '../store/gameStore';
import { audio }     from '../audio/engine';

function getWorld(level) {
  if (level >= 30) return { name:'Deep Space', icon:'🚀' };
  if (level >= 20) return { name:'Volcano',    icon:'🌋' };
  if (level >= 10) return { name:'Dark Cave',  icon:'🦇' };
  return { name:'Chicken Farm', icon:'🌾' };
}

export default function GameOverScreen({ level, seeds, combo=0, worldStart=1, isEndless=false, onPlayAgain, onShop, onHome }) {
  const [totalSeeds, setTotalSeeds] = useState(0);
  const [bestLevel,  setBestLevel]  = useState(0);
  const [bestEndless,setBestEndless]= useState(0);
  const [explodeParts,setExplodeParts] = useState([]);

  useEffect(() => {
    setTotalSeeds(gameStore.getSeeds());
    setBestLevel(gameStore.getBestLevel());
    setBestEndless(gameStore.getBestEndlessLevel());
    audio.startBackground();
    const parts = Array.from({length:20},(_,i) => ({
      id:i,
      x:   40 + Math.random() * 20,
      y:   30 + Math.random() * 20,
      vx:  (Math.random()-0.5) * 200,
      vy:  (Math.random()-0.5) * 200,
      color:`hsl(${Math.random()*60+10},90%,55%)`,
      size: 6 + Math.random() * 12,
    }));
    setExplodeParts(parts);
  }, []);

  const isNewRecord = isEndless
    ? level > bestEndless
    : level > bestLevel && level > 1;

  return (
    <div className="gameover-screen">
      <div className="gameover-bg-flicker"/>
      <div className="gameover-content">
        <div className="explosion-container">
          {explodeParts.map(p => (
            <div
              key={p.id}
              className="explosion-particle"
              style={{
                left:`${p.x}%`, top:`${p.y}%`,
                background:p.color, width:p.size, height:p.size,
                '--vx':`${p.vx}px`, '--vy':`${p.vy}px`,
              }}
            />
          ))}
          <div className="gameover-chicken">
            <div className="chicken-explode-body">💀</div>
          </div>
        </div>

        <div className="gameover-title">{isEndless ? '∞ ENDLESS OVER' : 'GAME OVER'}</div>

        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:'rgba(255,255,255,0.5)',letterSpacing:1}}>
          {isEndless
            ? <span style={{color:'#00e5ff'}}>∞ Wave {level}</span>
            : <span>{getWorld(level).icon} {getWorld(level).name}</span>
          }
          {combo>=2 && <span style={{color:'#FFD700',marginLeft:8}}>🔥 Best Combo x{combo>=10?10:combo>=7?5:combo>=4?3:2}</span>}
        </div>

        <div className="gameover-stats">
          <div className="stat-card">
            <div className="stat-label">{isEndless ? 'Wave Reached' : 'Level Reached'}</div>
            <div className="stat-value">{isEndless?'∞':'🏁'} {level}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Seeds Earned</div>
            <div className="stat-value">🌾 {seeds}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Seeds</div>
            <div className="stat-value">💰 {totalSeeds}</div>
          </div>
          <div className="stat-card best-card">
            <div className="stat-label">{isEndless?'Endless Best':'Best Level'}</div>
            <div className="stat-value">{isEndless?'∞':'🏆'} {isEndless?bestEndless:bestLevel}</div>
          </div>
        </div>

        {isNewRecord && <div className="new-record">🎉 NEW RECORD! 🎉</div>}

        <div className="gameover-buttons">
          <button
            className="btn-primary btn-play-again"
            onTouchStart={(e) => { e.preventDefault(); onPlayAgain(); }}
            onClick={onPlayAgain}
          >
            {isEndless ? '∞ PLAY ENDLESS AGAIN' : `🔄 RETRY FROM Lv${worldStart}`}
          </button>
          <div className="gameover-buttons-row">
            <button
              className="btn-secondary"
              onTouchStart={(e) => { e.preventDefault(); onShop(); }}
              onClick={onShop}
            >🛒 SHOP</button>
            <button
              className="btn-secondary"
              onTouchStart={(e) => { e.preventDefault(); onHome(); }}
              onClick={onHome}
            >🏠 HOME</button>
          </div>
        </div>
      </div>
    </div>
  );
}
