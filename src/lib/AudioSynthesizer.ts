/**
 * Web Audio API Procedural Rain & Thunder Synthesizer
 */
export class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;

  // Sound nodes
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private thunderGain: GainNode | null = null;

  // Rain generators
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilter1: BiquadFilterNode | null = null;
  private rainFilter2: BiquadFilterNode | null = null;

  // Individual droplet crackle generators
  private crackleSource: AudioBufferSourceNode | null = null;
  private crackleGain: GainNode | null = null;

  // Thunder generators
  private thunderSource: AudioBufferSourceNode | null = null;
  private thunderFilter: BiquadFilterNode | null = null;
  private thunderTimeout: number | null = null;

  // Parameters
  private masterVolume: number = 0.5;
  private rainVolume: number = 0.7;
  private thunderVolume: number = 0.4;

  constructor() {
    // Lazy initialize to bypass user-interaction autoplay restrictions
  }

  private initContext() {
    if (this.ctx) return;
    
    // Create AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API is not supported in this browser.');
      return;
    }
    
    this.ctx = new AudioContextClass();
    
    // Create node graph
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Create rain path
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(this.rainVolume, this.ctx.currentTime);
    this.rainGain.connect(this.masterGain);

    // Create thunder path
    this.thunderGain = this.ctx.createGain();
    this.thunderGain.gain.setValueAtTime(0, this.ctx.currentTime); // Starts silent until triggered
    this.thunderGain.connect(this.masterGain);

    // Build noises and filters
    this.setupRainSynth();
    this.setupThunderSynth();
  }

  private createWhiteNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('Context not initialized');
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }

  private createBrownNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('Context not initialized');
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 4; // 4 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration formula
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Amplify slightly to compensate filter losses
    }
    
    return buffer;
  }

  private setupRainSynth() {
    if (!this.ctx || !this.rainGain) return;

    // Create continuous rain noise source
    const rainBuffer = this.createWhiteNoiseBuffer();
    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = rainBuffer;
    this.rainSource.loop = true;

    // Rain filter cascade (bandpass then lowpass to make it sound like rain outside hitting glass)
    this.rainFilter1 = this.ctx.createBiquadFilter();
    this.rainFilter1.type = 'bandpass';
    this.rainFilter1.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.rainFilter1.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.rainFilter2 = this.ctx.createBiquadFilter();
    this.rainFilter2.type = 'lowpass';
    this.rainFilter2.frequency.setValueAtTime(2500, this.ctx.currentTime);
    this.rainFilter2.Q.setValueAtTime(0.5, this.ctx.currentTime);

    // Connect rain path
    this.rainSource.connect(this.rainFilter1);
    this.rainFilter1.connect(this.rainFilter2);
    this.rainFilter2.connect(this.rainGain);

    // Create glass droplet crackles (high frequency pops to simulate individual drops near the observer)
    const crackleBuffer = this.createWhiteNoiseBuffer();
    this.crackleSource = this.ctx.createBufferSource();
    this.crackleSource.buffer = crackleBuffer;
    this.crackleSource.loop = true;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.setValueAtTime(6000, this.ctx.currentTime);
    crackleFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.crackleGain = this.ctx.createGain();
    this.crackleGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    this.crackleSource.connect(crackleFilter);
    crackleFilter.connect(this.crackleGain);
    this.crackleGain.connect(this.rainGain); // Feeds into rain gain
  }

  private setupThunderSynth() {
    if (!this.ctx || !this.thunderGain) return;

    // Create brown noise source for deep rumbling
    const thunderBuffer = this.createBrownNoiseBuffer();
    this.thunderSource = this.ctx.createBufferSource();
    this.thunderSource.buffer = thunderBuffer;
    this.thunderSource.loop = true;

    // Deep rumble lowpass filter
    this.thunderFilter = this.ctx.createBiquadFilter();
    this.thunderFilter.type = 'lowpass';
    this.thunderFilter.frequency.setValueAtTime(70, this.ctx.currentTime);
    this.thunderFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Connect thunder path
    this.thunderSource.connect(this.thunderFilter);
    this.thunderFilter.connect(this.thunderGain);
  }

  public async start() {
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isRunning) return;

    try {
      this.rainSource?.start(0);
      this.crackleSource?.start(0);
      this.thunderSource?.start(0);
      this.isRunning = true;
      
      // Schedule automatic occasional lightning and thunder
      this.scheduleNextThunder();
    } catch (e) {
      console.error('Failed to start AudioSynthesizer sources (likely already started)', e);
    }
  }

  public stop() {
    if (!this.isRunning) return;

    // To pause/stop cleanly, we can suspend the context or recreate nodes.
    // Suspending context is the cleanest and allows rapid resume.
    this.ctx?.suspend();
    this.isRunning = false;

    if (this.thunderTimeout) {
      clearTimeout(this.thunderTimeout);
      this.thunderTimeout = null;
    }
  }

  public toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  public getRunning() {
    return this.isRunning;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, this.ctx.currentTime + 0.1);
    }
  }

  public setRainVolume(vol: number) {
    this.rainVolume = Math.max(0, Math.min(1, vol));
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.linearRampToValueAtTime(this.rainVolume, this.ctx.currentTime + 0.1);
      // Adjust crackle gain based on rain density/volume
      if (this.crackleGain) {
        this.crackleGain.gain.linearRampToValueAtTime(this.rainVolume * 0.02, this.ctx.currentTime + 0.1);
      }
    }
  }

  public setThunderVolume(vol: number) {
    this.thunderVolume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Triggers a thunder strike with lightning rumble simulation.
   * Ramps up volume quickly with some crackling and then slowly rumbles away.
   */
  public triggerThunder() {
    if (!this.ctx || !this.thunderGain || !this.isRunning) return;

    const now = this.ctx.currentTime;
    
    // Quick lightning flash sound spike (rumble increases instantly)
    this.thunderGain.gain.cancelScheduledValues(now);
    this.thunderGain.gain.setValueAtTime(0, now);
    
    // Distant or close strike? Randomize slightly
    const isDistant = Math.random() > 0.4;
    const strikeVolume = isDistant ? this.thunderVolume * 0.6 : this.thunderVolume * 1.2;
    const strikeDuration = isDistant ? 6 + Math.random() * 5 : 8 + Math.random() * 8;

    if (!isDistant) {
      // Close strike starts with a quick crackle/boom
      this.thunderGain.gain.linearRampToValueAtTime(strikeVolume, now + 0.1);
      // First rumble dip
      this.thunderGain.gain.setValueAtTime(strikeVolume * 0.7, now + 0.6);
      this.thunderGain.gain.linearRampToValueAtTime(strikeVolume * 0.9, now + 1.2);
    } else {
      // Distant strike builds up slowly
      this.thunderGain.gain.linearRampToValueAtTime(strikeVolume, now + 1.5);
    }

    // Schedule rumbling trail
    let rumTime = now + (isDistant ? 1.5 : 1.2);
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const rumbleFactor = 0.3 + Math.random() * 0.5;
      rumTime += strikeDuration / steps;
      this.thunderGain.gain.linearRampToValueAtTime(strikeVolume * rumbleFactor * (1 - (i / steps)), rumTime);
    }

    // Completely silent at the end
    this.thunderGain.gain.linearRampToValueAtTime(0, now + strikeDuration + 2);
  }

  private scheduleNextThunder() {
    if (this.thunderTimeout) clearTimeout(this.thunderTimeout);

    // Schedule next thunder in 20-50 seconds
    const delay = 20000 + Math.random() * 30000;
    this.thunderTimeout = window.setTimeout(() => {
      this.triggerThunder();
      this.scheduleNextThunder();
    }, delay);
  }
}
