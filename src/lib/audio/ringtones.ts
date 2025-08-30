
/**
 * Simple Web Audio API ringtone generator with multiple patterns.
 * No audio files required, works across modern browsers.
 */

export type RingtoneId = 'classic-bell' | 'kitchen-timer' | 'chime' | 'alert' | 'service-bell';

export const RINGTONE_OPTIONS: { id: RingtoneId; label: string }[] = [
  { id: 'classic-bell', label: 'Classic Bell' },
  { id: 'kitchen-timer', label: 'Kitchen Timer' },
  { id: 'chime', label: 'Chime' },
  { id: 'alert', label: 'Alert' },
  { id: 'service-bell', label: 'Service Bell' },
];

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let stopAt = 0;

function getAudio(): { ctx: AudioContext; gain: GainNode } | null {
  try {
    if (!audioCtx) {
      const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (!masterGain) {
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
    }
    return { ctx: audioCtx, gain: masterGain };
  } catch (e) {
    console.warn('Audio init failed:', e);
    return null;
  }
}

function scheduleTone(ctx: AudioContext, gainNode: GainNode, freq: number, start: number, durationMs: number, vol: number, shape: OscillatorType = 'sine') {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = shape;
  osc.frequency.setValueAtTime(freq, start);

  // Envelope
  const attack = 0.01;
  const release = 0.15;
  const duration = durationMs / 1000;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), start + attack);
  g.gain.setValueAtTime(Math.max(0.0001, vol), start + Math.max(0, duration - release));
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(g);
  g.connect(gainNode);

  osc.start(start);
  osc.stop(start + duration);
}

function patternClassicBell(ctx: AudioContext, gain: GainNode, now: number, vol: number) {
  // Two chimes
  scheduleTone(ctx, gain, 880, now + 0.0, 280, vol, 'sine');
  scheduleTone(ctx, gain, 660, now + 0.45, 300, vol, 'sine');
  return 1.0; // seconds total approx
}

function patternKitchenTimer(ctx: AudioContext, gain: GainNode, now: number, vol: number) {
  // Series of short beeps
  let t = 0;
  for (let i = 0; i < 6; i++) {
    scheduleTone(ctx, gain, 1400, now + t, 120, vol, 'square');
    t += 0.22;
  }
  return t + 0.1;
}

function patternChime(ctx: AudioContext, gain: GainNode, now: number, vol: number) {
  scheduleTone(ctx, gain, 659.25, now + 0.0, 220, vol, 'triangle'); // E5
  scheduleTone(ctx, gain, 880.0,  now + 0.25, 220, vol, 'triangle'); // A5
  scheduleTone(ctx, gain, 1318.5, now + 0.5, 260, vol, 'triangle'); // E6
  return 1.0;
}

function patternAlert(ctx: AudioContext, gain: GainNode, now: number, vol: number) {
  let t = 0;
  for (let i = 0; i < 8; i++) {
    const f = i % 2 === 0 ? 500 : 1000;
    scheduleTone(ctx, gain, f, now + t, 150, vol, 'sawtooth');
    t += 0.18;
  }
  return t + 0.1;
}

function patternServiceBell(ctx: AudioContext, gain: GainNode, now: number, vol: number) {
  // Single sharp ding
  scheduleTone(ctx, gain, 1046.5, now + 0.0, 200, vol, 'sine'); // C6
  scheduleTone(ctx, gain, 2093.0, now + 0.02, 120, vol * 0.6, 'sine'); // C7 partial
  return 0.6;
}

export async function playRingtone(id: RingtoneId, volumePercent: number = 80) {
  const audio = getAudio();
  if (!audio) return;

  try {
    if (audio.ctx.state === 'suspended') {
      await audio.ctx.resume().catch(() => {});
    }
  } catch {
    // ignore resume errors
  }

  const vol = Math.min(1, Math.max(0, volumePercent / 100));
  // Slightly compress loudness to be kitchen-friendly but not distort
  const gainValue = Math.pow(vol, 0.8);
  audio.gain.gain.setValueAtTime(gainValue, audio.ctx.currentTime);

  const now = audio.ctx.currentTime;
  let lengthSeconds = 1;

  switch (id) {
    case 'classic-bell':
      lengthSeconds = patternClassicBell(audio.ctx, audio.gain, now, 0.9);
      break;
    case 'kitchen-timer':
      lengthSeconds = patternKitchenTimer(audio.ctx, audio.gain, now, 0.9);
      break;
    case 'chime':
      lengthSeconds = patternChime(audio.ctx, audio.gain, now, 0.9);
      break;
    case 'alert':
      lengthSeconds = patternAlert(audio.ctx, audio.gain, now, 1.0);
      break;
    case 'service-bell':
      lengthSeconds = patternServiceBell(audio.ctx, audio.gain, now, 1.0);
      break;
    default:
      lengthSeconds = patternClassicBell(audio.ctx, audio.gain, now, 0.9);
      break;
  }

  stopAt = now + lengthSeconds + 0.05;
}

export function stopRingtone() {
  if (!audioCtx || !masterGain) return;
  try {
    masterGain.disconnect();
  } catch {
    // ignore
  }
  masterGain = null;
}
