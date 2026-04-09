import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gameStore } from '../store/gameStore';
import { SKIN_ABILITIES } from '../data/skins';

// ─── PHASE 1: INTERACTIVE BASIC TRAINING ─────────────────────────
// Real mini-grid. Each step requires the player to actually DO the action.

const TRAINING_STEPS = [
  {
    id: 'move',
    icon: '👆',
    title: 'Tap to Move',
    instruction: 'Tap the glowing tile to move your chicken!',
    completeMsg: 'Nice move! 🐔',
  },
  {
    id: 'peek',
    icon: '👁️',
    title: 'Long Press to Peek',
    instruction: 'Long press (hold) the adjacent tile to peek at it!',
    completeMsg: 'Smart chicken! 👁️',
  },
  {
    id: 'number',
    icon: '🔢',
    title: 'Read the Numbers',
    instruction: 'The number shows how many mines are nearby. Tap the safe tile!',
    completeMsg: 'You read it right! 🧠',
  },
  {
    id: 'checkpoint',
    icon: '🏁',
    title: 'Reach the Goal',
    instruction: 'Step to the checkpoint tile to complete the level!',
    completeMsg: "Level complete! You're ready! 🎉",
  },
];

// Mini 3×3 grids for each training step
// Each returns: { tiles[], startR, startC }
function buildTrainingGrid(stepId) {
  const base = (r, c, extra = {}) => ({
    r, c, state: 'hidden', isMine: false, isCheckpoint: false, isStart: false,
    adjMines: 0, powerup: null, isLava: false, worldId: 'farm', ...extra,
  });

  if (stepId === 'move') {
    // Chicken at bottom-left, one glowing safe tile to the right
    return {
      startR: 1, startC: 0,
      tiles: [
        base(0,0), base(0,1), base(0,2,{isMine:true}),
        base(1,0,{state:'revealed',isStart:true}), base(1,1), base(1,2,{isMine:true}),
        base(2,0), base(2,1,{isMine:true}), base(2,2),
      ],
      target: {r:1,c:1},
      goal: 'move_to_target',
    };
  }
  if (stepId === 'peek') {
    // Chicken revealed at 1,0 — tile at 1,1 is hidden safe
    return {
      startR: 1, startC: 0,
      tiles: [
        base(0,0,{state:'revealed',adjMines:0}), base(0,1,{isMine:true}), base(0,2,{isMine:true}),
        base(1,0,{state:'revealed',isStart:true}), base(1,1,{adjMines:2}), base(1,2,{isMine:true}),
        base(2,0,{state:'revealed',adjMines:0}), base(2,1,{adjMines:2}), base(2,2,{isMine:true}),
      ],
      target: {r:1,c:1},
      goal: 'peek_target',
    };
  }
  if (stepId === 'number') {
    // Chicken at 1,0 — tile 1,1 revealed with number 1 — tile 1,2 is safe to step on
    return {
      startR: 1, startC: 0,
      tiles: [
        base(0,0,{state:'revealed',adjMines:0}), base(0,1,{state:'revealed',adjMines:1}), base(0,2,{isMine:true}),
        base(1,0,{state:'revealed',isStart:true}), base(1,1,{state:'revealed',adjMines:1}), base(1,2),
        base(2,0,{state:'revealed',adjMines:0}), base(2,1,{state:'revealed',adjMines:1}), base(2,2,{isMine:true}),
      ],
      target: {r:1,c:2}, // the safe tile beyond the number
      goal: 'move_to_target',
    };
  }
  if (stepId === 'checkpoint') {
    // 3-step path to checkpoint
    return {
      startR: 2, startC: 0,
      tiles: [
        base(0,0,{isMine:true}), base(0,1,{isMine:true}), base(0,2,{isCheckpoint:true,state:'checkpoint'}),
        base(1,0,{state:'revealed',adjMines:1}), base(1,1,{state:'revealed',adjMines:2}), base(1,2,{adjMines:2}),
        base(2,0,{state:'revealed',isStart:true}), base(2,1,{adjMines:1}), base(2,2,{isMine:true}),
      ],
      target: {r:0,c:2},
      goal: 'reach_checkpoint',
    };
  }
  return { startR:0, startC:0, tiles:[], target:null, goal:null };
}

function MiniGrid({ tiles, chickenPos, onTap, onLongPress, targetTile, stepId }) {
  const pressTimer = useRef(null);
  const pressed = useRef(false);

  const isAdj = (tile) => {
    const dr = Math.abs(tile.r - chickenPos.r), dc = Math.abs(tile.c - chickenPos.c);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  };
  const isTarget = (tile) => targetTile && tile.r === targetTile.r && tile.c === targetTile.c;

  return (
    <div className="tut-mini-grid">
      {tiles.map(tile => {
        const adj = isAdj(tile);
        const isChicken = tile.r === chickenPos.r && tile.c === chickenPos.c;
        const isTarget_ = isTarget(tile);
        const worldColors = { hidden:'#6B4226', safe:'#4CAF50', mine:'#c62828', border:'#3E2208' };

        let bg = worldColors.hidden, content = '', extraClass = '';
        if (tile.isCheckpoint) { bg = '#FFD700'; content = '🌻'; extraClass = 'tut-mg-checkpoint'; }
        else if (tile.state === 'revealed') {
          bg = worldColors.safe;
          if (tile.adjMines > 0) { content = tile.adjMines; extraClass = 'tut-mg-revealed tut-mg-num'; }
          else { extraClass = 'tut-mg-revealed'; }
        } else if (tile.state === 'mine') { bg = worldColors.mine; content = '💥'; extraClass = 'tut-mg-mine'; }
        else if (tile.state === 'peeked') {
          bg = tile.isMine ? '#ff4d4d' : '#6dff8a';
          content = tile.isMine ? '💣' : '✓'; extraClass = 'tut-mg-peeked';
        } else { extraClass = 'tut-mg-hidden'; }

        const glowing = adj && isTarget_ && !isChicken;

        const handleTouchStart = (e) => {
          e.preventDefault();
          pressed.current = true;
          pressTimer.current = setTimeout(() => {
            if (pressed.current) { onLongPress(tile); pressed.current = false; }
          }, 400);
        };
        const handleTouchEnd = (e) => {
          e.preventDefault();
          if (pressed.current) { clearTimeout(pressTimer.current); pressed.current = false; onTap(tile); }
        };
        const handleMouseDown = () => {
          pressed.current = true;
          pressTimer.current = setTimeout(() => {
            if (pressed.current) { onLongPress(tile); pressed.current = false; }
          }, 400);
        };
        const handleMouseUp = () => {
          if (pressed.current) { clearTimeout(pressTimer.current); pressed.current = false; onTap(tile); }
        };

        return (
          <div key={`${tile.r}-${tile.c}`}
            className={`tut-mg-tile ${extraClass} ${glowing ? 'tut-mg-glow' : ''}`}
            style={{ background: bg }}
            onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
          >
            {isChicken ? <span className="tut-mg-chicken">🐔</span>
              : content !== '' ? <span className={tile.adjMines > 0 ? 'tut-num-label' : ''}>{content}</span>
              : null}
          </div>
        );
      })}
    </div>
  );
}

function InteractiveTutorial({ onComplete }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [tiles, setTiles]     = useState([]);
  const [chickenPos, setChickenPos] = useState({ r: 0, c: 0 });
  const [target, setTarget]   = useState(null);
  const [goal, setGoal]       = useState(null);
  const [feedback, setFeedback] = useState('');
  const [stepDone, setStepDone] = useState(false);
  const [shake, setShake]     = useState(false);

  const currentStep = TRAINING_STEPS[stepIdx];

  const loadStep = useCallback((idx) => {
    const { startR, startC, tiles: t, target: tgt, goal: g } = buildTrainingGrid(TRAINING_STEPS[idx].id);
    setTiles(t);
    setChickenPos({ r: startR, c: startC });
    setTarget(tgt);
    setGoal(g);
    setFeedback('');
    setStepDone(false);
  }, []);

  useEffect(() => { loadStep(0); }, []);

  const completeStep = useCallback(() => {
    setStepDone(true);
    setFeedback(TRAINING_STEPS[stepIdx].completeMsg);
  }, [stepIdx]);

  const handleTap = useCallback((tile) => {
    if (stepDone) return;
    const isAdj = (Math.abs(tile.r - chickenPos.r) + Math.abs(tile.c - chickenPos.c)) === 1;
    if (!isAdj) return;

    if (tile.isMine) {
      // Gentle shake, not a real game-over in tutorial
      setShake(true); setTimeout(() => setShake(false), 500);
      setFeedback('💣 That\'s a mine! Avoid it.');
      return;
    }

    if (tile.isCheckpoint) {
      setTiles(ts => ts.map(t => t.r === tile.r && t.c === tile.c ? { ...t } : t));
      setChickenPos({ r: tile.r, c: tile.c });
      if (goal === 'reach_checkpoint') completeStep();
      return;
    }

    if (tile.state === 'hidden' || tile.state === 'peeked') {
      setTiles(ts => ts.map(t => t.r === tile.r && t.c === tile.c ? { ...t, state: 'revealed' } : t));
      setChickenPos({ r: tile.r, c: tile.c });
      if (goal === 'move_to_target' && tile.r === target?.r && tile.c === target?.c) {
        completeStep();
      } else if (goal === 'reach_checkpoint' && tile.r === target?.r && tile.c === target?.c) {
        completeStep();
      }
      return;
    }

    if (tile.state === 'revealed') {
      setChickenPos({ r: tile.r, c: tile.c });
    }
  }, [chickenPos, tiles, goal, target, stepDone, completeStep]);

  const handleLongPress = useCallback((tile) => {
    if (stepDone) return;
    const isAdj = (Math.abs(tile.r - chickenPos.r) + Math.abs(tile.c - chickenPos.c)) === 1;
    if (!isAdj) return;
    if (tile.state !== 'hidden') return;

    setTiles(ts => ts.map(t => t.r === tile.r && t.c === tile.c ? { ...t, state: 'peeked' } : t));
    if (goal === 'peek_target' && tile.r === target?.r && tile.c === target?.c) {
      setTimeout(() => completeStep(), 400);
    }
    // Auto-unpeek mines
    if (tile.isMine) {
      setTimeout(() => setTiles(ts => ts.map(t =>
        t.r === tile.r && t.c === tile.c && t.state === 'peeked' ? { ...t, state: 'hidden' } : t
      )), 2500);
    }
  }, [chickenPos, tiles, goal, target, stepDone, completeStep]);

  const handleNext = () => {
    if (!stepDone) return;
    const next = stepIdx + 1;
    if (next >= TRAINING_STEPS.length) {
      gameStore.setTutorialSeen();
      onComplete();
    } else {
      setStepIdx(next);
      loadStep(next);
    }
  };

  return (
    <div className="tut-interactive">
      {/* Header */}
      <div className="tut-int-header">
        <div className="tut-int-steps">
          {TRAINING_STEPS.map((_, i) => (
            <div key={i} className={`tut-int-dot ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}/>
          ))}
        </div>
        <div className="tut-int-skip" onTouchStart={(e) => { e.preventDefault(); gameStore.setTutorialSeen(); onComplete(); }}
          onClick={() => { gameStore.setTutorialSeen(); onComplete(); }}>Skip</div>
      </div>

      {/* Step info */}
      <div className="tut-int-icon">{currentStep.icon}</div>
      <div className="tut-int-title">{currentStep.title}</div>
      <div className="tut-int-instruction">{currentStep.instruction}</div>

      {/* Interactive grid */}
      <div className={`tut-int-grid-wrap ${shake ? 'tut-shake' : ''}`}>
        <MiniGrid
          tiles={tiles}
          chickenPos={chickenPos}
          onTap={handleTap}
          onLongPress={handleLongPress}
          targetTile={target}
          stepId={currentStep.id}
        />
      </div>

      {/* Feedback */}
      <div className={`tut-int-feedback ${feedback ? 'visible' : ''}`}>{feedback || ' '}</div>

      {/* Next button — only active when step is done */}
      <button
        className={`tut-int-next ${stepDone ? 'ready' : 'waiting'}`}
        onTouchStart={(e) => { e.preventDefault(); handleNext(); }}
        onClick={handleNext}
        disabled={!stepDone}
      >
        {stepDone
          ? (stepIdx === TRAINING_STEPS.length - 1 ? "🐔 Let's Play!" : 'Next →')
          : 'Complete the task above ↑'}
      </button>
    </div>
  );
}

// ─── PHASE 2: WORLD BRIEFING ──────────────────────────────────────
const WORLD_BRIEFINGS = {
  cave: {
    icon: '🦇',
    title: 'Dark Cave',
    color: '#78909C',
    mechanics: [
      { icon: '🪨', label: 'Fake Tiles', desc: 'Some tiles look safe but hide mines. Trust the numbers.' },
      { icon: '🦊', label: 'Thief Fox', desc: 'Random obstacle steals your active powerup.' },
      { icon: '⏱️', label: 'Slow-Mo', desc: 'Slow Motion powerup now appears — halves timer drain for 8s.' },
    ],
  },
  volcano: {
    icon: '🌋',
    title: 'Volcano',
    color: '#FF5722',
    mechanics: [
      { icon: '🔥', label: 'Lava Tiles', desc: 'Stepping on lava costs 2-3 extra seconds from your timer.' },
      { icon: '💣', label: 'Moving Mines', desc: 'Mines shift position every few seconds. Stay alert.' },
      { icon: '👁️', label: 'Reveal Power', desc: 'Reveal powerup shows all mine positions briefly.' },
    ],
  },
  space: {
    icon: '🚀',
    title: 'Deep Space',
    color: '#64b5f6',
    mechanics: [
      { icon: '🔃', label: 'Gravity Flip', desc: 'Checkpoint moves to the bottom-left. Your start is top-right.' },
      { icon: '☄️', label: 'Max Density', desc: 'Up to 65% of tiles are mines. Every step counts.' },
      { icon: '⭐', label: 'Double Score', desc: 'Double Score powerup available — earns 2× seeds for 10s.' },
    ],
  },
};

export function WorldBriefing({ worldId, onClose }) {
  const brief = WORLD_BRIEFINGS[worldId];
  if (!brief) return null;
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 50); }, []);

  return (
    <div className={`world-brief-overlay ${show ? 'brief-show' : ''}`}>
      <div className="world-brief-panel" style={{ '--wcolor': brief.color }}>
        <div className="brief-icon">{brief.icon}</div>
        <div className="brief-title" style={{ color: brief.color }}>{brief.title}</div>
        <div className="brief-subtitle">New mechanics entering this world:</div>
        <div className="brief-mechanics">
          {brief.mechanics.map((m, i) => (
            <div key={i} className="brief-mechanic">
              <span className="brief-m-icon">{m.icon}</span>
              <div className="brief-m-body">
                <div className="brief-m-label">{m.label}</div>
                <div className="brief-m-desc">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="brief-btn"
          onTouchStart={(e) => { e.preventDefault(); onClose(); }}
          onClick={onClose}>
          Got it — let's go! {brief.icon}
        </button>
      </div>
    </div>
  );
}

// ─── PHASE 3: ABILITY TUTORIAL ────────────────────────────────────
function AbilityPracticeGrid({ ability, onDone }) {
  const [tried, setTried] = useState(false);
  const [msg, setMsg]     = useState('');

  // Simple 3-tile demo per ability type
  const demos = {
    dodge: {
      desc: 'You\'re about to step on a mine. Your Dodge ability will auto-save you!',
      prompt: 'Tap the mine tile — your ability absorbs it.',
      action: 'Tap the 💣 tile',
    },
    wealthy: {
      desc: 'Royal bonus: earn +20% extra seeds on every level you complete.',
      prompt: 'No action needed — it activates automatically each level!',
      action: null,
    },
    phase: {
      desc: 'Ghost Phase gives you free peeks each world. Long press a tile — no timer cost!',
      prompt: 'Long press the adjacent tile to peek for free.',
      action: 'Long press to peek free',
    },
    jump: {
      desc: 'Space Jump lets you leap over one tile — step 2 tiles away in the same row or column.',
      prompt: 'In-game: tap a tile 2 steps ahead to jump over the gap.',
      action: null,
    },
    scan: {
      desc: 'Robot Scan reveals mine counts at level start. Numbers appear automatically!',
      prompt: 'No action needed — activates when a new level loads.',
      action: null,
    },
    fireproof: {
      desc: 'Dragon Fireproof: walk onto lava tiles without losing any timer.',
      prompt: 'In-game: step on 🔥 lava tiles freely.',
      action: null,
    },
  };

  const info = demos[ability] || { desc: '', prompt: '' };
  const abilityDef = SKIN_ABILITIES[ability];
  if (!abilityDef) return null;

  return (
    <div className="abt-practice">
      <div className="abt-ability-icon">{abilityDef.icon}</div>
      <div className="abt-ability-name">{abilityDef.name}</div>
      <div className="abt-desc">{info.desc}</div>
      <div className="abt-prompt">{info.prompt}</div>
      {msg ? <div className="abt-msg">{msg}</div> : null}
      <button className="abt-done-btn"
        onTouchStart={(e) => { e.preventDefault(); onDone(); }}
        onClick={onDone}>
        Got it — I'm ready! ✅
      </button>
    </div>
  );
}

export function AbilityTutorial({ skinId, ability, onClose }) {
  const abilityDef = SKIN_ABILITIES[ability];
  if (!abilityDef) return null;
  const skinName = skinId.charAt(0).toUpperCase() + skinId.slice(1);

  return (
    <div className="abt-overlay">
      <div className="abt-panel">
        <div className="abt-header">
          <div className="abt-header-label">NEW ABILITY EQUIPPED</div>
          <div className="abt-header-skin">{skinName} Chicken</div>
        </div>
        <AbilityPracticeGrid ability={ability} onDone={onClose}/>
      </div>
    </div>
  );
}

// ─── ORIGINAL STATIC TUTORIAL (kept for how-to-play button) ──────
const STEPS = [
  { icon:'👆', title:'Tap to Move',     desc:"Tap any tile next to your chicken to move. One step at a time — up, down, left, or right." },
  { icon:'💥', title:'Avoid Mines!',    desc:'Hidden mines are scattered across the grid. Step on one and lose ❤️. Lose all hearts — game over!' },
  { icon:'🔢', title:'Use the Numbers', desc:'When you step on a safe tile, nearby tiles show how many mines are adjacent. Plan around them!' },
  { icon:'👁️', title:'Peek to Spy',    desc:'Long press any adjacent tile to peek. Costs timer seconds (fewer at harder levels). Use it wisely!' },
  { icon:'🏁', title:'Reach the Goal!', desc:'Navigate safely to the 🏁 checkpoint tile to complete the level and advance to the next one!' },
];

export default function Tutorial({ onClose, onSkip }) {
  const [mode, setMode] = useState('interactive'); // 'interactive' | 'static'
  const [step, setStep] = useState(0);

  // If tutorial not yet seen, show interactive; otherwise static
  if (mode === 'interactive' && !gameStore.getTutorialSeen()) {
    return (
      <div className="tutorial-overlay">
        <InteractiveTutorial onComplete={() => { gameStore.setTutorialSeen(); onClose(); }}/>
      </div>
    );
  }

  // Static how-to-play (accessed via button after first run)
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-panel">
        <button className="tutorial-skip"
          onTouchStart={(e) => { e.preventDefault(); onSkip(); }}
          onClick={onSkip}>Close</button>
        <div className="tutorial-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`tutorial-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}/>
          ))}
        </div>
        <div className="tutorial-icon" key={step}>{current.icon}</div>
        <div className="tutorial-title">{current.title}</div>
        <div className="tutorial-desc">{current.desc}</div>
        <button className="tutorial-next"
          onTouchStart={(e) => { e.preventDefault(); isLast ? onClose() : setStep(s => s + 1); }}
          onClick={() => isLast ? onClose() : setStep(s => s + 1)}>
          {isLast ? '✅ Got it!' : 'Next →'}
        </button>
        <div className="tutorial-counter">{step + 1} / {STEPS.length}</div>
      </div>
    </div>
  );
}
