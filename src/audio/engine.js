const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class DrumEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.analyser = null;
    this.masterVolume = 0.72;
    this.bpm = 120;
    this.swing = 0.18;
    this.isPlaying = false;
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.timer = null;
    this.lookahead = 25;
    this.scheduleAhead = 0.11;
    this.getPattern = () => null;
    this.getParams = () => null;
    this.onStep = () => {};
    this.noiseBuffer = null;
    this.meterData = null;
  }

  async ensureContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass)
        throw new Error("Web Audio API не поддерживается этим браузером");
      this.ctx = new AudioContextClass();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.masterVolume;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.78;
      this.master.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer();
      this.meterData = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  createNoiseBuffer() {
    const buffer = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * 1.5,
      this.ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  configure({ getPattern, getParams, onStep }) {
    if (getPattern) this.getPattern = getPattern;
    if (getParams) this.getParams = getParams;
    if (onStep) this.onStep = onStep;
  }

  setBpm(value) {
    this.bpm = clamp(Number(value) || 120, 60, 200);
  }

  setSwing(value) {
    this.swing = clamp(Number(value) || 0, 0, 0.45);
  }

  setMasterVolume(value) {
    this.masterVolume = clamp(Number(value) || 0, 0, 1);
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(
        this.masterVolume,
        this.ctx.currentTime,
        0.02,
      );
    }
  }

  async start() {
    await this.ensureContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.055;
    this.scheduler();
    this.timer = window.setInterval(() => this.scheduler(), this.lookahead);
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
    this.currentStep = 0;
    this.onStep(-1);
  }

  scheduler() {
    if (!this.ctx || !this.isPlaying) return;
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAhead) {
      const step = this.currentStep;
      const baseStepDuration = 60 / this.bpm / 4;
      const swingDelay = step % 2 === 1 ? baseStepDuration * this.swing : 0;
      const scheduledTime = this.nextStepTime + swingDelay;
      this.scheduleStep(step, scheduledTime);
      const uiDelay = Math.max(
        0,
        (scheduledTime - this.ctx.currentTime) * 1000,
      );
      window.setTimeout(() => {
        if (this.isPlaying) this.onStep(step);
      }, uiDelay);
      this.nextStepTime += baseStepDuration;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  scheduleStep(step, time) {
    const pattern = this.getPattern();
    if (!pattern) return;
    for (const [trackId, steps] of Object.entries(pattern)) {
      if (steps?.[step]) this.trigger(trackId, time, this.getParams(trackId));
    }
  }

  async preview(trackId, params) {
    await this.ensureContext();
    this.trigger(trackId, this.ctx.currentTime + 0.005, params);
  }

  trigger(trackId, time, params = {}) {
    if (!this.ctx || !this.master) return;
    const safe = {
      gain: clamp(params.gain ?? 0.6, 0, 1),
      pitch: clamp(params.pitch ?? 0, -24, 24),
      decay: clamp(params.decay ?? 0.3, 0.04, 1.6),
      filter: clamp(params.filter ?? 9000, 300, 18000),
    };
    switch (trackId) {
      case "kick":
        this.kick(time, safe);
        break;
      case "snare":
        this.snare(time, safe);
        break;
      case "clap":
        this.clap(time, safe);
        break;
      case "hat":
        this.hat(time, safe);
        break;
      case "perc":
        this.perc(time, safe);
        break;
      case "bass":
        this.bass(time, safe);
        break;
    }
  }

  makeGain(time, gain, decay) {
    const node = this.ctx.createGain();
    node.gain.setValueAtTime(Math.max(0.0001, gain), time);
    node.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    node.connect(this.master);
    return node;
  }

  kick(time, p) {
    const osc = this.ctx.createOscillator();
    const gain = this.makeGain(time, p.gain, Math.max(0.12, p.decay));
    const pitchRatio = 2 ** (p.pitch / 12);
    osc.type = "sine";
    osc.frequency.setValueAtTime(145 * pitchRatio, time);
    osc.frequency.exponentialRampToValueAtTime(
      46 * pitchRatio,
      time + Math.min(0.13, p.decay * 0.6),
    );
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + p.decay + 0.08);
  }

  snare(time, p) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = Math.max(900, p.filter * 0.22);
    const noiseGain = this.makeGain(
      time,
      p.gain * 0.82,
      Math.max(0.09, p.decay),
    );
    noise.connect(hp).connect(noiseGain);
    noise.start(time);
    noise.stop(time + p.decay + 0.04);

    const osc = this.ctx.createOscillator();
    const body = this.makeGain(
      time,
      p.gain * 0.28,
      Math.max(0.06, p.decay * 0.58),
    );
    osc.type = "triangle";
    osc.frequency.value = 170 * 2 ** (p.pitch / 12);
    osc.connect(body);
    osc.start(time);
    osc.stop(time + p.decay);
  }

  clap(time, p) {
    const bursts = [0, 0.023, 0.047];
    bursts.forEach((offset, index) => {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = Math.max(1200, p.filter * 0.34);
      bp.Q.value = 0.75;
      const gain = this.ctx.createGain();
      const t = time + offset;
      gain.gain.setValueAtTime(
        Math.max(0.0001, p.gain * (index === 0 ? 0.72 : 0.45)),
        t,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        t + Math.max(0.055, p.decay * 0.62),
      );
      noise.connect(bp).connect(gain).connect(this.master);
      noise.start(t);
      noise.stop(t + p.decay + 0.04);
    });
  }

  hat(time, p) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = Math.max(5000, p.filter * 0.64);
    const gain = this.makeGain(time, p.gain * 0.8, Math.min(0.3, p.decay));
    noise.connect(hp).connect(gain);
    noise.start(time);
    noise.stop(time + Math.min(0.34, p.decay + 0.03));
  }

  perc(time, p) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = p.filter;
    filter.Q.value = 1.7;
    const gain = this.makeGain(time, p.gain * 0.7, p.decay);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420 * 2 ** (p.pitch / 12), time);
    osc.frequency.exponentialRampToValueAtTime(
      180 * 2 ** (p.pitch / 12),
      time + Math.min(0.12, p.decay),
    );
    osc.connect(filter).connect(gain);
    osc.start(time);
    osc.stop(time + p.decay + 0.04);
  }

  bass(time, p) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.makeGain(time, p.gain * 0.82, Math.max(0.12, p.decay));
    osc.type = "sawtooth";
    osc.frequency.value = 58 * 2 ** (p.pitch / 12);
    filter.type = "lowpass";
    filter.frequency.value = Math.min(4200, p.filter);
    filter.Q.value = 1.2;
    osc.connect(filter).connect(gain);
    osc.start(time);
    osc.stop(time + p.decay + 0.08);
  }

  getLevel() {
    if (!this.analyser || !this.meterData) return 0;
    this.analyser.getByteFrequencyData(this.meterData);
    let sum = 0;
    for (let i = 0; i < this.meterData.length; i += 1) sum += this.meterData[i];
    return clamp(sum / this.meterData.length / 115, 0, 1);
  }

  destroy() {
    this.stop();
    if (this.ctx && this.ctx.state !== "closed") this.ctx.close();
  }
}
