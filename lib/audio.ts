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
// On unless the reader has turned it off; a browser will not actually make a
// sound until the first gesture regardless.
let enabled = true;

/** Shared noise buffer — regenerating white noise per keystroke is wasteful. */
let noise: AudioBuffer | null = null;

/**
 * A reverb bus. Key clicks stay dry, because a click with a tail on it sounds
 * like a mistake; the intro goes through here, because a long decaying space
 * is most of what separates a sound effect from an atmosphere.
 */
let wet: GainNode | null = null;

/** An impulse response is just noise that decays — no file needed. */
function buildReverb(c: AudioContext, seconds = 4.5, decay = 2.6): ConvolverNode {
  const len = Math.floor(c.sampleRate * seconds);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      // Slightly different per channel, which is what gives it width.
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  const conv = c.createConvolver();
  conv.buffer = ir;
  return conv;
}

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

    const conv = buildReverb(ctx);
    wet = ctx.createGain();
    wet.gain.value = 0.9;
    wet.connect(conv).connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSound(on: boolean) {
  enabled = on;
  if (on) ensure();
}

export const soundOn = () => enabled;

/**
 * A little ahead of the clock. A freshly created context reports
 * `currentTime` of exactly 0, and a short envelope scheduled from there lands
 * its later points before zero, which AudioParam rejects outright.
 */
const now = () => (ctx ? ctx.currentTime + 0.01 : 0);

/** A short band-passed noise burst: the body of a key press. */
function burst(
  at: number,
  dur: number,
  freq: number,
  q: number,
  gain: number,
  out: AudioNode | null = null
) {
  if (!ctx || !noise || !master) return;
  const t0 = Math.max(at, ctx.currentTime);
  const d = Math.max(dur, 0.005);

  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + Math.min(0.001, d * 0.2));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);

  src.connect(bp).connect(g).connect(out ?? master);
  src.start(t0);
  src.stop(t0 + d + 0.02);
}

function tone(
  at: number,
  dur: number,
  freq: number,
  gain: number,
  type: OscillatorType = "sine",
  out: AudioNode | null = null
) {
  if (!ctx || !master) return;
  const t0 = Math.max(at, ctx.currentTime);
  const d = Math.max(dur, 0.03);
  const attack = t0 + Math.min(0.008, d * 0.25);
  const hold = Math.max(attack + 0.001, t0 + d - 0.02);
  const end = hold + Math.max(0.01, t0 + d - hold);

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, attack);
  g.gain.setValueAtTime(gain, hold);
  g.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(g).connect(out ?? master);
  osc.start(t0);
  osc.stop(end + 0.02);
}

/** A key going down. Slightly different every time, or it reads as a machine gun. */
export function key(soft = false) {
  if (!enabled || !ensure() || !ctx) return;
  const t = now();
  burst(t, soft ? 0.012 : 0.02, soft ? 2600 : 1900, 1.2, soft ? 0.05 : 0.11);
  tone(t, 0.016, 120 + Math.random() * 40, soft ? 0.015 : 0.035, "triangle");
}

/** Return: deeper, with the clack of a longer key. */
export function enterKey() {
  if (!enabled || !ensure() || !ctx) return;
  const t = now();
  burst(t, 0.03, 1400, 1, 0.14);
  tone(t, 0.03, 90, 0.05, "triangle");
}

/** Pans a source across the stereo field over its lifetime. */
function panned(at: number, dur: number, from: number, to: number): StereoPannerNode | null {
  if (!ctx || !wet) return null;
  at = Math.max(at, ctx.currentTime);
  const pan = ctx.createStereoPanner();
  pan.pan.setValueAtTime(from, at);
  pan.pan.linearRampToValueAtTime(to, at + dur);
  pan.connect(wet);
  return pan;
}

/**
 * A sound played backwards: noise swelling into an impact rather than decaying
 * away from one. The ear has no everyday model for it, which is most of why it
 * reads as unreal.
 */
function swell(at: number, dur: number, gain: number, out: AudioNode | null) {
  if (!ctx || !noise || !master) return;
  at = Math.max(at, ctx.currentTime);
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  src.playbackRate.value = 0.35;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 2.5;
  bp.frequency.setValueAtTime(220, at);
  bp.frequency.exponentialRampToValueAtTime(5200, at + dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + dur * 0.92);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.12);

  src.connect(bp).connect(g).connect(out ?? master);
  src.start(at);
  src.stop(at + dur + 0.2);
}

/**
 * A slowly detuning pad. Two oscillators a few cents apart beat against each
 * other, and a slow drift on top keeps the beating from settling, so the note
 * never quite arrives anywhere.
 */
function drone(at: number, dur: number, freq: number, gain: number, out: AudioNode | null) {
  if (!ctx || !master) return;
  at = Math.max(at, ctx.currentTime);
  for (const cents of [-7, 0, 9]) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * Math.pow(2, cents / 1200);

    // Tape-like wander.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07 + Math.random() * 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = freq * 0.004;
    lfo.connect(lfoGain).connect(osc.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + dur * 0.35);
    g.gain.setValueAtTime(gain, at + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

    osc.connect(g).connect(out ?? master);
    osc.start(at);
    osc.stop(at + dur + 0.1);
    lfo.start(at);
    lfo.stop(at + dur + 0.1);
  }
}

/**
 * The machine waking up. A reversed swell pulls into the thunk of the degauss
 * coil, a low chord opens underneath, and the flyback whine sits on top at
 * 15.7kHz — the frequency a television line output actually ran at, and the
 * reason a room with a CRT in it was never quite silent.
 */
export function powerOn() {
  if (!enabled || !ensure() || !ctx || !wet) return;
  const t = now();

  swell(t, 1.5, 0.08, wet);

  // The impact the swell was pulling towards.
  burst(t + 1.5, 0.22, 80, 0.7, 0.34, wet);
  tone(t + 1.5, 0.5, 48, 0.16, "sine", wet);
  tone(t + 1.5, 0.35, 96, 0.06, "sine", wet);

  // A fifth, opening slowly. Low enough to be felt more than heard.
  drone(t + 1.45, 7.5, 55, 0.055, wet);
  drone(t + 2.2, 6.5, 82.4, 0.035, wet);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 15700;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t + 1.5);
  g.gain.linearRampToValueAtTime(0.011, t + 2.2);
  g.gain.setValueAtTime(0.011, t + 6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 8);
  osc.connect(g).connect(master!);
  osc.start(t + 1.5);
  osc.stop(t + 8.1);
}

/**
 * The handshake, heard from somewhere further away than it should be. The
 * dialling tones arrive first, then the carrier answers from the other side of
 * the stereo field, and the negotiation scatters across it — each fragment
 * detuned a little, so the two machines never quite agree.
 */
export function handshake() {
  if (!enabled || !ensure() || !ctx || !wet) return;
  const t = now() + 2.2;

  const dial = [697, 1209, 697, 1336, 852, 1477, 770, 1209];
  dial.forEach((f, i) => {
    const out = panned(t + i * 0.13, 0.1, -0.5, -0.2);
    tone(t + i * 0.13, 0.09, f, 0.04, "sine", out ?? wet);
  });

  // The far end answers.
  const ans = panned(t + 1.5, 1.2, 0.6, 0.15);
  tone(t + 1.5, 0.9, 2100, 0.038, "sine", ans ?? wet);
  tone(t + 1.9, 0.7, 1180 * 1.003, 0.03, "sine", ans ?? wet);

  // Negotiation, scattered and drifting.
  for (let i = 0; i < 30; i++) {
    const at = t + 2.3 + i * 0.072;
    const p = panned(at, 0.12, Math.sin(i * 0.9) * 0.8, Math.sin(i * 0.9 + 1) * 0.8);
    const f = 500 + Math.random() * 2200;
    tone(at, 0.06, f, 0.024, i % 4 === 0 ? "square" : "sine", p ?? wet);
    if (i % 5 === 0) burst(at, 0.09, f * 1.6, 0.9, 0.02, p ?? wet);
  }

  // It settles, almost.
  tone(t + 4.6, 1.6, 880, 0.016, "sine", wet);
  tone(t + 4.8, 1.8, 1320 * 0.997, 0.012, "sine", wet);
}

/** A small negative blip, for a command that was not found. */
export function error() {
  if (!enabled || !ensure() || !ctx) return;
  const t = now();
  tone(t, 0.08, 220, 0.06, "square");
  tone(t + 0.08, 0.12, 165, 0.06, "square");
}
