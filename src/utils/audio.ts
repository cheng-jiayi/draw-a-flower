// Web Audio API Synthesizer for Authentic Japanese Windchime, Tea Pouring, and Wind

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Play realistic glass furin (windchime) chime
  public playFurinChime(intensity: number = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Japanese glass chime tuned around pentatonic scale: E6 (1318Hz), G#6 (1661Hz), B6 (1975Hz), D#7 (2489Hz)
    const pitches = [1318.5, 1567.98, 1760.0, 2093.0, 2637.0];
    const baseFreq = pitches[Math.floor(Math.random() * pitches.length)];

    // Strike 1 to 3 crystal tinkles in quick succession
    const numStrikes = Math.min(3, Math.max(1, Math.floor(intensity * 2.5)));
    for (let s = 0; s < numStrikes; s++) {
      const strikeTime = now + s * (0.12 + Math.random() * 0.15);
      const freq = baseFreq * (1 + (s * 0.08) * (Math.random() > 0.5 ? 1 : -1));

      // Primary glass strike tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Highpass to eliminate mud, emulate crystal glass
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, strikeTime);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, strikeTime);
      // Slight pitch droop characteristic of bell impact
      osc.frequency.exponentialRampToValueAtTime(freq * 0.992, strikeTime + 0.15);

      gain.gain.setValueAtTime(0, strikeTime);
      gain.gain.linearRampToValueAtTime(0.35 * intensity * (1 - s * 0.25), strikeTime + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 2.8);

      // Overtones (inharmonic crystal ringing)
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtoneOsc.type = 'sine';
      overtoneOsc.frequency.setValueAtTime(freq * 2.76, strikeTime);

      overtoneGain.gain.setValueAtTime(0, strikeTime);
      overtoneGain.gain.linearRampToValueAtTime(0.12 * intensity, strikeTime + 0.002);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 1.2);

      // Connect
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);

      osc.start(strikeTime);
      osc.stop(strikeTime + 3.0);
      overtoneOsc.start(strikeTime);
      overtoneOsc.stop(strikeTime + 1.5);
    }
  }

  // Play peaceful tea pouring sound
  public playTeaPour(duration: number = 2.2) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Pink/Brownish noise for liquid trickle
      output[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + duration); // Pitch rises as cup fills!
    filter.Q.setValueAtTime(4.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.3);
    gain.gain.setValueAtTime(0.28, now + duration - 0.4);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }

  // Play soft wind gust
  public playWindWhisper(duration: number = 3.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise
      lastOut = output[i];
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.linearRampToValueAtTime(550, now + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(200, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + duration * 0.35);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  // Soft wooden / paper chime click
  public playSoftClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Crisp paper rustle / photo sliding sound
  public playPaperRustle(intensity: number = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // High-frequency friction noise for paper fiber texture
      output[i] = (Math.random() * 2 - 1) * 0.35;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    // Bandpass filter sweeping through paper frequency range (1200Hz - 2800Hz)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1300, now);
    filter.frequency.linearRampToValueAtTime(2600, now + duration * 0.4);
    filter.frequency.linearRampToValueAtTime(1500, now + duration);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22 * intensity, now + 0.025);
    gain.gain.linearRampToValueAtTime(0.14 * intensity, now + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }

  // Camera shutter for polaroids
  public playShutter() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }
}

export const sounds = new SoundEngine();

