import React, { useEffect, useState } from 'react';
import { gameStore } from '../store/gameStore';
import { audio }     from '../audio/engine';
import Tutorial      from './Tutorial';

function ChickenHero({ bounce }) {
  return (
    <div className={`hero-chicken ${bounce ? 'bounce-up' : 'bounce-down'}`}>
      <div className="hero-shadow" />
      <div className="hc-body">
        <div className="hc-tail">
          <div className="hc-feather f1" />
          <div className="hc-feather f2" />
          <div className="hc-feather f3" />
        </div>
        <div className="hc-wing left" />
        <div className="hc-wing right" />
        <div className="hc-head">
          <div className="hc-comb">
            <div className="hc-comb-bump b1" />
            <div className="hc-comb-bump b2" />
            <div className="hc-comb-bump b3" />
          </div>
          <div className="hc-eye left"><div className="hc-pupil" /><div className="hc-shine" /></div>
          <div className="hc-eye right"><div className="hc-pupil" /><div className="hc-shine" /></div>
          <div className="hc-beak"><div className="hc-beak-top" /><div className="hc-beak-bot" /></div>
          <div className="hc-wattle" />
        </div>
        <div className="hc-belly" />
      </div>
      <div className="hc-legs">
        <div className="hc-leg left"><div className="hc-foot" /></div>
        <div className="hc-leg right"><div className="hc-foot" /></div>
      </div>
    </div>
  );
}

export default function HomeScreen({ onPlay, onEndless, onShop, onLeaderboard, onAchievements, onWorldSelect }) {
  const [seeds, setSeeds]           = useState(0);
  const [bounce, setBounce]         = useState(false);
  const [show, setShow]             = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [bestEndless, setBestEndless]   = useState(0);

  const equippedTheme = gameStore.getEquippedTheme();

  useEffect(() => {
    setSeeds(gameStore.getSeeds());
    setBestEndless(gameStore.getBestEndlessLevel());
    audio.startBackground();
    setTimeout(() => setShow(true), 100);
    const interval = setInterval(() => setBounce(b => !b), 900);
    if (!gameStore.getTutorialSeen()) {
      setTimeout(() => setShowTutorial(true), 600);
    }
    return () => clearInterval(interval);
  }, []);

  const savedLevel    = gameStore.getSavedLevel();
  const unlockedWorld = gameStore.getUnlockedWorld();
  const savedWorld    = savedLevel>=30?'🚀':savedLevel>=20?'🌋':savedLevel>=10?'🦇':'🌾';
  const bestLevel     = gameStore.getBestLevel();

  return (
    <div className={`home-screen-v3 theme-${equippedTheme||'default'}`}>
      {showTutorial && (
        <Tutorial onClose={() => setShowTutorial(false)} onSkip={() => setShowTutorial(false)}/>
      )}
      <div className="home-bg-grid" />
      <div className="home-particles">
        {[...Array(12)].map((_,i) => (
          <div key={i} className="home-particle" style={{
            left:`${8 + i * 8}%`,
            animationDelay:`${i * 0.4}s`,
            animationDuration:`${3 + (i % 3)}s`,
          }}/>
        ))}
      </div>

      <div className={`home-content-v3 ${show ? 'home-show' : ''}`}>
        <div className="home-logo">
          <div className="logo-mine">MINE</div>
          <div className="logo-path">PATH</div>
          <div className="logo-version">V5</div>
          <div className="logo-tagline">⚠️ Step carefully, little chicken ⚠️</div>
        </div>

        <ChickenHero bounce={bounce}/>

        <div className="home-stats">
          <div className="stat-pill">
            <span className="stat-icon">🌾</span>
            <span className="stat-num">{seeds}</span>
          </div>
          {bestLevel > 0 && (
            <div className="stat-pill best">
              <span className="stat-icon">🏆</span>
              <span className="stat-num">Lv.{bestLevel}</span>
            </div>
          )}
          {bestEndless > 0 && (
            <div className="stat-pill endless-stat">
              <span className="stat-icon">∞</span>
              <span className="stat-num">W{bestEndless}</span>
            </div>
          )}
        </div>

        <div className="home-btns">
          {/* Campaign Play */}
          <button
            className="btn-play-v3"
            onTouchStart={(e) => { e.preventDefault(); audio.init(); onPlay(); }}
            onClick={() => { audio.init(); onPlay(); }}
          >
            <span className="btn-play-icon">▶</span>
            <span>{savedLevel > 1 ? `CONTINUE ${savedWorld} Lv${savedLevel}` : 'PLAY'}</span>
          </button>

          {/* Endless Mode */}
          <button
            className="btn-endless-v3"
            onTouchStart={(e) => { e.preventDefault(); audio.init(); onEndless(); }}
            onClick={() => { audio.init(); onEndless(); }}
          >
            <span className="btn-endless-icon">∞</span>
            <span>ENDLESS MODE</span>
            {bestEndless > 0 && <span className="btn-endless-best">Best: W{bestEndless}</span>}
          </button>

          <div className="home-btns-row">
            <button
              className="btn-secondary-v3"
              onTouchStart={(e) => { e.preventDefault(); onShop(); }}
              onClick={onShop}
            >🛒 SHOP</button>
            <button
              className="btn-secondary-v3"
              onTouchStart={(e) => { e.preventDefault(); onLeaderboard(); }}
              onClick={onLeaderboard}
            >🏆 SCORES</button>
          </div>
          <button
            className="btn-secondary-v3 btn-achievements"
            style={{width:'100%'}}
            onTouchStart={(e) => { e.preventDefault(); onAchievements(); }}
            onClick={onAchievements}
          >🏅 ACHIEVEMENTS</button>

          <button
            className="btn-howtoplay"
            onTouchStart={(e) => { e.preventDefault(); setShowTutorial(true); }}
            onClick={() => setShowTutorial(true)}
          >📖 How to Play</button>

          {unlockedWorld > 1 && (
            <button
              className="btn-howtoplay"
              style={{color:'#FFD700', borderColor:'rgba(255,215,0,0.3)'}}
              onTouchStart={(e) => { e.preventDefault(); onWorldSelect(); }}
              onClick={onWorldSelect}
            >🗺️ World Select</button>
          )}
        </div>

        <div className="home-hint-v3">Tap • Long press to peek 👁️ • Swipe to move</div>
      </div>
    </div>
  );
}
