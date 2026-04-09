import React, { useEffect, useState } from 'react';
import { gameStore } from '../store/gameStore';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen({ onBack }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [bestLevel, setBestLevel] = useState(0);
  const [totalSeeds, setTotalSeeds] = useState(0);

  useEffect(() => {
    setLeaderboard(gameStore.getLeaderboard());
    setBestLevel(gameStore.getBestLevel());
    setTotalSeeds(gameStore.getSeeds());
  }, []);

  return (
    <div className="leaderboard-screen">
      <div className="lb-header">
        <button
          className="btn-back"
          onTouchStart={(e) => { e.preventDefault(); onBack(); }}
          onClick={onBack}
        >
          ← Back
        </button>
        <div className="lb-title">🏆 LEADERBOARD</div>
        <div className="lb-seeds">🌾 {totalSeeds}</div>
      </div>

      <div className="lb-personal-best">
        <div className="pb-label">Personal Best</div>
        <div className="pb-value">Level {bestLevel}</div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="lb-empty">
          <div className="lb-empty-icon">🐔</div>
          <div className="lb-empty-text">No runs yet!</div>
          <div className="lb-empty-sub">Play your first game to appear here</div>
        </div>
      ) : (
        <div className="lb-list">
          <div className="lb-list-header">
            <span>Rank</span>
            <span>Level</span>
            <span>Seeds</span>
            <span>Date</span>
          </div>
          {leaderboard.map((entry, idx) => (
            <div key={idx} className={`lb-entry ${idx === 0 ? 'lb-first' : idx === 1 ? 'lb-second' : idx === 2 ? 'lb-third' : ''}`}>
              <span className="lb-rank">{MEDALS[idx] || `#${idx + 1}`}</span>
              <span className="lb-level">Lv.{entry.level}</span>
              <span className="lb-entry-seeds">🌾{entry.seeds}</span>
              <span className="lb-date">{entry.date}</span>
            </div>
          ))}
        </div>
      )}

      <div className="lb-footer">
        <div className="lb-tip">🌾 Earn more seeds by completing levels fast!</div>
      </div>
    </div>
  );
}
