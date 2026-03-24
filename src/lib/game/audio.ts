// Audio system using Web Audio API
let audioContext: AudioContext | null = null;

export type SoundType = 'hit' | 'golden' | 'combo' | 'gameover' | 'newrecord' | 'error' | 'challenge-success';

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

export function resumeAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

// Arcade-style pop sound for normal targets
function playPopSound(): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(600, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
  oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

// Error buzz sound for decoys
function playErrorBuzz(): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(150, ctx.currentTime);
  oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);

  oscillator.type = 'sawtooth';

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
}

// Coin collect sound for golden targets
function playCoinCollect(): void {
  const ctx = getAudioContext();
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator1.frequency.setValueAtTime(1200, ctx.currentTime);
  oscillator1.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.1);

  oscillator2.frequency.setValueAtTime(1600, ctx.currentTime);
  oscillator2.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.1);

  oscillator1.type = 'square';
  oscillator2.type = 'square';

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  oscillator1.start(ctx.currentTime);
  oscillator2.start(ctx.currentTime);
  oscillator1.stop(ctx.currentTime + 0.15);
  oscillator2.stop(ctx.currentTime + 0.15);
}

export function playSound(soundType: SoundType, enabled: boolean = true): void {
  if (!enabled) return;

  switch (soundType) {
    case 'hit':
      playPopSound();
      break;
    case 'golden':
      playCoinCollect();
      break;
    case 'combo':
      // Soft combo sound - less aggressive than square waves
      playTone(400, 80, 'sine', 0.15);
      setTimeout(() => playTone(500, 80, 'sine', 0.15), 80);
      break;
    case 'gameover':
      playTone(400, 200, 'sawtooth', 0.3);
      setTimeout(() => playTone(300, 200, 'sawtooth', 0.3), 200);
      break;
    case 'newrecord':
      playTone(600, 100, 'sine', 0.3);
      setTimeout(() => playTone(800, 100, 'sine', 0.3), 100);
      setTimeout(() => playTone(1000, 100, 'sine', 0.3), 200);
      setTimeout(() => playTone(1200, 200, 'sine', 0.3), 300);
      break;
    case 'error':
      playErrorBuzz();
      break;
    case 'challenge-success':
      playTone(600, 100, 'sine', 0.3);
      setTimeout(() => playTone(800, 100, 'sine', 0.3), 100);
      setTimeout(() => playTone(1000, 150, 'sine', 0.3), 200);
      break;
  }
}

export function vibrate(pattern?: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate && pattern !== undefined) {
    navigator.vibrate(pattern);
  }
}
