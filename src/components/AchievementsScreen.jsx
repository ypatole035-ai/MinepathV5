import React, { useState, useEffect } from 'react';
import { gameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../data/achievements';

const TYPE_LABELS = {
  milestone: '🏆 Milestone',
  seeds:     '🌱 Seeds',
  skill:     '⚡ Skill',
  hidden:    '👻 Hidden',
};
const TYPE_ORDER = ['milestone','seeds','skill','hidden'];

export default function AchievementsScreen({ onBack }) {
  const [unlocked, setUnlocked] = useState([]);
  const [stats,    setStats]    = useState({});
  const [show,     setShow]     = useState(false);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    setUnlocked(gameStore.getUnlockedAchievements());
    setStats(gameStore.getStats());
    setTimeout(() => setShow(true), 80);
  }, []);

  const totalUnlocked = unlocked.length;
  const totalPossible = ACHIEVEMENTS.length;
  const pct = Math.round((totalUnlocked / totalPossible) * 100);

  const types = filter === 'all' ? TYPE_ORDER : [filter];
  const visibleAchs = types.flatMap(t =>
    ACHIEVEMENTS.filter(a => a.type === t)
  );

  return (
    <div className="ach-screen">
      {/* Header */}
      <div className="ach-header">
        <button className="btn-back"
          onTouchStart={(e) => { e.preventDefault(); onBack(); }}
          onClick={onBack}>← Back</button>
        <div className="ach-title">🏅 ACHIEVEMENTS</div>
        <div className="ach-count">{totalUnlocked}/{totalPossible}</div>
      </div>

      {/* Progress bar */}
      <div className="ach-progress-wrap">
        <div className="ach-progress-bar">
          <div className="ach-progress-fill" style={{ width: `${pct}%` }}/>
        </div>
        <div className="ach-progress-label">{pct}% complete</div>
      </div>

      {/* Stats strip */}
      <div className="ach-stats-strip">
        <div className="ach-stat">
          <span className="ach-stat-val">{stats.totalMineHits || 0}</span>
          <span className="ach-stat-lbl">Mines Hit</span>
        </div>
        <div className="ach-stat">
          <span className="ach-stat-val">{stats.totalShieldBlocks || 0}</span>
          <span className="ach-stat-lbl">Shields Used</span>
        </div>
        <div className="ach-stat">
          <span className="ach-stat-val">{stats.totalSeedsEarned || 0}</span>
          <span className="ach-stat-lbl">Seeds Earned</span>
        </div>
        <div className="ach-stat">
          <span className="ach-stat-val">{stats.consecutiveHeartlessLevels || 0}</span>
          <span className="ach-stat-lbl">Clean Streak</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="ach-filter-row">
        {['all','milestone','seeds','skill','hidden'].map(f => (
          <button key={f}
            className={`ach-filter-btn ${filter === f ? 'active' : ''}`}
            onTouchStart={(e) => { e.preventDefault(); setFilter(f); }}
            onClick={() => setFilter(f)}>
            {f === 'all' ? '🔍 All' : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Achievement list */}
      <div className={`ach-list ${show ? 'ach-list-show' : ''}`}>
        {visibleAchs.map((ach, i) => {
          const isUnlocked = unlocked.includes(ach.id);
          const isHiddenLocked = ach.type === 'hidden' && !isUnlocked;
          if (isHiddenLocked) return null;
          return (
            <div
              key={ach.id}
              className={`ach-card ${isUnlocked ? 'ach-unlocked' : 'ach-locked'}`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className={`ach-card-icon ${isUnlocked ? 'ach-icon-glow' : ''}`}>
                {isHiddenLocked ? '❓' : ach.icon}
              </div>
              <div className="ach-card-body">
                <div className="ach-card-name">
                  {isHiddenLocked ? '???' : ach.name}
                </div>
                <div className="ach-card-desc">
                  {isHiddenLocked ? 'Keep playing to discover this achievement' : ach.desc}
                </div>
              </div>
              <div className="ach-card-right">
                {isUnlocked
                  ? <div className="ach-check">✅</div>
                  : <div className="ach-reward">🌾{ach.reward}</div>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden achievements teaser */}
      {(filter === 'all' || filter === 'hidden') && (() => {
        const hiddenTotal = ACHIEVEMENTS.filter(a => a.type === 'hidden').length;
        const hiddenUnlocked = ACHIEVEMENTS.filter(a => a.type === 'hidden' && unlocked.includes(a.id)).length;
        const hiddenRemaining = hiddenTotal - hiddenUnlocked;
        if (hiddenRemaining <= 0) return null;
        return (
          <div style={{textAlign:'center',padding:'12px',color:'rgba(255,255,255,0.4)',fontSize:13}}>
            👻 {hiddenRemaining} hidden achievement{hiddenRemaining > 1 ? 's' : ''} remaining — keep playing to discover them!
          </div>
        );
      })()}
    </div>
  );
}
