// Web Audio API Sound Engine - No external files

let ctx = null;
let bgGain = null;
let bgNodes = [];
let bgPlaying = false;
let masterGain = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq, duration, type = 'sine', gainVal = 0.3, delay = 0) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(masterGain);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);
  g.gain.setValueAtTime(gainVal, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration);
}

function playFreqSeq(freqs, noteDuration, type = 'square', gainVal = 0.2) {
  freqs.forEach((freq, i) => {
    if (freq > 0) playTone(freq, noteDuration, type, gainVal, i * noteDuration);
  });
}

export const audio = {
  init() {
    getCtx();
  },

  safeTap() {
    const c = getCtx();
    playTone(520, 0.08, 'sine', 0.25);
    playTone(780, 0.06, 'sine', 0.15, 0.07);
  },

  mineExplosion() {
    const c = getCtx();
    // Boom
    const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(0.8, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    src.connect(g);
    g.connect(masterGain);
    src.start();
    // Sad trombone
    setTimeout(() => {
      playFreqSeq([440, 415, 392, 349], 0.2, 'sawtooth', 0.15);
    }, 400);
  },

  powerupCollect() {
    playFreqSeq([523, 659, 784, 1047], 0.08, 'sine', 0.2);
  },

  levelComplete() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1175, 1319];
    melody.forEach((freq, i) => {
      playTone(freq, 0.15, 'sine', 0.25, i * 0.1);
    });
  },

  timerLow() {
    const c = getCtx();
    playTone(880, 0.05, 'square', 0.1);
  },

  thiefFox() {
    playFreqSeq([784, 698, 659, 587, 523], 0.1, 'sawtooth', 0.2);
  },

  windGust() {
    const c = getCtx();
    const buf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3 * Math.sin(i / data.length * Math.PI);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    src.connect(filter);
    filter.connect(masterGain);
    src.start();
  },

  peek() {
    playTone(300, 0.1, 'sine', 0.15);
    playTone(400, 0.1, 'sine', 0.1, 0.1);
  },

  startBackground() {
    if (bgPlaying) return;
    const c = getCtx();
    bgPlaying = true;

    bgGain = c.createGain();
    bgGain.gain.value = 0.12;
    bgGain.connect(masterGain);

    const bpm = 130;
    const beat = 60 / bpm;

    // Chiptune melody
    const melody = [
      523, 523, 659, 0, 784, 659, 523, 0,
      392, 392, 523, 0, 659, 523, 392, 0,
      523, 659, 784, 784, 698, 659, 523, 0,
      392, 523, 659, 784, 523, 0, 392, 0,
    ];

    const bassline = [
      131, 0, 131, 0, 165, 0, 165, 0,
      196, 0, 196, 0, 131, 0, 131, 0,
      131, 0, 131, 0, 165, 0, 165, 0,
      196, 0, 131, 0, 0, 0, 196, 0,
    ];

    const loopRef = { id: null };
    let startTime = c.currentTime;

    function scheduleLoop() {
      if (!bgPlaying) return;
      const loopDuration = beat * melody.length;

      melody.forEach((freq, i) => {
        if (freq > 0) {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.connect(g);
          g.connect(bgGain);
          osc.type = 'square';
          osc.frequency.value = freq;
          const t = startTime + i * beat;
          g.gain.setValueAtTime(0.3, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.8);
          osc.start(t);
          osc.stop(t + beat * 0.85);
          bgNodes.push(osc);
        }
      });

      bassline.forEach((freq, i) => {
        if (freq > 0) {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.connect(g);
          g.connect(bgGain);
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const t = startTime + i * beat;
          g.gain.setValueAtTime(0.5, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.9);
          osc.start(t);
          osc.stop(t + beat * 0.95);
          bgNodes.push(osc);
        }
      });

      startTime += loopDuration;
      loopRef.id = setTimeout(scheduleLoop, (loopDuration - 0.5) * 1000);
    }

    scheduleLoop();
    audio._bgLoopRef = loopRef;
  },

  stopBackground() {
    bgPlaying = false;
    if (audio._bgLoopRef) clearTimeout(audio._bgLoopRef.id);
    bgNodes.forEach(n => { try { n.stop(); } catch {} });
    bgNodes = [];
    if (bgGain) {
      bgGain.gain.setValueAtTime(bgGain.gain.value, getCtx().currentTime);
      bgGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.3);
    }
    bgGain = null;
  },

  gameOver() {
    this.stopBackground();
    this.mineExplosion();
  },

  obstacleScramble() {
    playFreqSeq([800, 600, 400, 700, 500, 300], 0.07, 'sawtooth', 0.15);
  },

  fakeMinePop() {
    playTone(300, 0.05, 'sine', 0.2);
    playTone(250, 0.05, 'sine', 0.15, 0.05);
    this.mineExplosion();
  },
};
