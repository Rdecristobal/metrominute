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

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playSound(soundType: SoundType, enabled: boolean = true): void {
  if (!enabled) return;

  switch (soundType) {
    case 'hit':
      playTone(800, 100, 'sine');
      break;
    case 'golden':
      playTone(1200, 150, 'triangle');
      setTimeout(() => playTone(1500, 100, 'sine'), 100);
      break;
    case 'combo':
      playTone(600, 50, 'square');
      setTimeout(() => playTone(800, 50, 'square'), 50);
      setTimeout(() => playTone(1000, 100, 'square'), 100);
      break;
    case 'gameover':
      playTone(400, 200, 'sawtooth');
      setTimeout(() => playTone(300, 200, 'sawtooth'), 200);
      break;
    case 'newrecord':
      playTone(600, 100, 'sine');
      setTimeout(() => playTone(800, 100, 'sine'), 100);
      setTimeout(() => playTone(1000, 100, 'sine'), 200);
      setTimeout(() => playTone(1200, 200, 'sine'), 300);
      break;
    case 'error':
      playTone(400, 150, 'sawtooth');
      break;
    case 'challenge-success':
      playTone(600, 100, 'sine');
      setTimeout(() => playTone(800, 100, 'sine'), 100);
      setTimeout(() => playTone(1000, 150, 'sine'), 200);
      break;
  }
}

export function vibrate(pattern?: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate && pattern !== undefined) {
    navigator.vibrate(pattern);
  }
}
