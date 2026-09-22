/**
 * Every sound here is synthesised rather than loaded. A portfolio should not
 * ship half a megabyte of samples to make a clicking noise, and an oscillator
 * costs nothing.
 *
 * Browsers refuse to start audio before a gesture, so the context is created
 * lazily on the first call that follows one; anything that fires earlier is
 * silently dropped.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;

/** Shared noise buffer — regenerating white noise per keystroke is wasteful. */
let noise: AudioBuffer | null = null;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);

    const len = Math.floor(ctx.sampleRate * 0.4);
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSound(on: boolean) {
  enabled = on;
  if (on) ensure();
}

export const soundOn = () => enabled;

/** A short band-passed noise burst: the body of a key press. */
function burst(at: number, dur: number, freq: number, q: number, gain: number) {
  if (!ctx || !noise || !master) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

  src.connect(bp).connect(g).connect(master);
  src.start(at);
  src.stop(at + dur + 0.02);
}

function tone(at: number, dur: number, freq: number, gain: number, type: OscillatorType = "sine") {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.008);
  g.gain.setValueAtTime(gain, at + dur - 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

  osc.connect(g).connect(master);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** A key going down. Slightly different every time, or it reads as a machine gun. */
export function key(soft = false) {
  if (!enabled || !ensure() || !ctx) return;
  const t = ctx.currentTime;
  burst(t, soft ? 0.012 : 0.02, soft ? 2600 : 1900, 1.2, soft ? 0.05 : 0.11);
  tone(t, 0.016, 120 + Math.random() * 40, soft ? 0.015 : 0.035, "triangle");
}

/** Return: deeper, with the clack of a longer key. */
export function enterKey() {
  if (!enabled || !ensure() || !ctx) return;
  const t = ctx.currentTime;
  burst(t, 0.03, 1400, 1, 0.14);
  tone(t, 0.03, 90, 0.05, "triangle");
}

/**
 * A CRT coming on: the thunk of the degauss coil, then the flyback whine at
 * 15.7kHz — the frequency an actual television line output ran at, and the
 * reason a room with a CRT in it was never quite silent.
 */
export function powerOn() {
  if (!enabled || !ensure() || !ctx) return;
  const t = ctx.currentTime;
  burst(t, 0.18, 90, 0.7, 0.3);
  tone(t, 0.25, 55, 0.12, "sine");

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 15700;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.012, t + 0.4);
  g.gain.setValueAtTime(0.012, t + 2.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  osc.connect(g).connect(master!);
  osc.start(t);
  osc.stop(t + 3.3);
}

/**
 * The handshake, roughly: the dialling tones, the answering carrier, then the
 * scramble where the two modems argue about how fast they can talk.
 */
export function handshake() {
  if (!enabled || !ensure() || !ctx) return;
  const t = ctx.currentTime;

  // Dial.
  const dial = [697, 1209, 697, 1336, 852, 1477, 770, 1209];
  dial.forEach((f, i) => tone(t + 0.12 + i * 0.09, 0.07, f, 0.05));

  // Answer carrier, then the data scramble.
  tone(t + 1.0, 0.5, 2100, 0.045);
  tone(t + 1.5, 0.35, 1180, 0.04);
  for (let i = 0; i < 26; i++) {
    const at = t + 1.85 + i * 0.045;
    tone(at, 0.04, 600 + Math.random() * 1900, 0.028, "square");
    if (i % 3 === 0) burst(at, 0.05, 1200 + Math.random() * 1600, 0.8, 0.03);
  }
  tone(t + 3.05, 0.4, 1800, 0.02, "sawtooth");
}

/** A small negative blip, for a command that was not found. */
export function error() {
  if (!enabled || !ensure() || !ctx) return;
  const t = ctx.currentTime;
  tone(t, 0.08, 220, 0.06, "square");
  tone(t + 0.08, 0.12, 165, 0.06, "square");
}
