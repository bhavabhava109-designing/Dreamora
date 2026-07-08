import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, RefreshCw, Sliders, Music, CloudRain, Coffee, Wind, Compass, Sparkles } from 'lucide-react';

const TRACKS = [
  {
    id: 'rain',
    name: 'Rain & Thunder',
    icon: CloudRain,
    color: 'text-[var(--primary)] bg-[var(--primary-glow)] border-[var(--border)]'
  },
  {
    id: 'cafe',
    name: 'Cozy Cafe',
    icon: Coffee,
    color: 'text-[var(--primary)] bg-[var(--primary-glow)] border-[var(--border)]'
  },
  {
    id: 'wind',
    name: 'Forest Wind',
    icon: Wind,
    color: 'text-[var(--primary)] bg-[var(--primary-glow)] border-[var(--border)]'
  },
  {
    id: 'waves',
    name: 'Ocean Waves',
    icon: Compass,
    color: 'text-[var(--primary)] bg-[var(--primary-glow)] border-[var(--border)]'
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chill',
    icon: Music,
    color: 'text-[var(--primary)] bg-[var(--primary-glow)] border-[var(--border)]'
  },
  {
    id: 'synth',
    name: 'Deep Space Drone',
    icon: Sparkles,
    color: 'text-[var(--primary)] bg-[var(--primary-glow)] border-[var(--border)]'
  }
];

// Web Audio API Ambient Synthesis Engine (CORS-proof, bandwidth-free, offline-ready)
class AmbientSynth {
  constructor() {
    this.ctx = null;
    this.sources = {};
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createNoiseBuffer(type) {
    if (!this.ctx) return null;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'pink') {
      // Kellet's refined pink noise approximation
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.11;
      }
    } else {
      // White noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  startRain(volume) {
    this.init();
    if (this.sources['rain']) return;

    // Base Rain layer (White noise + Lowpass)
    const baseSource = this.ctx.createBufferSource();
    baseSource.buffer = this.createNoiseBuffer('white');
    baseSource.loop = true;

    const baseFilter = this.ctx.createBiquadFilter();
    baseFilter.type = 'lowpass';
    baseFilter.frequency.value = 950;

    const baseGain = this.ctx.createGain();
    baseGain.gain.value = volume * 0.75;

    baseSource.connect(baseFilter);
    baseFilter.connect(baseGain);
    baseGain.connect(this.ctx.destination);

    // Crackle Raindrops layer (White noise + high Q Bandpass + volume oscillation)
    const crackleSource = this.ctx.createBufferSource();
    crackleSource.buffer = this.createNoiseBuffer('white');
    crackleSource.loop = true;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.value = 2300;
    crackleFilter.Q.value = 10;

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.value = volume * 0.12;

    const modulator = this.ctx.createOscillator();
    modulator.type = 'sawtooth';
    modulator.frequency.value = 7.5; // Modulation speed

    const modGain = this.ctx.createGain();
    modGain.gain.value = 0.1;

    modulator.connect(modGain);
    modGain.connect(crackleGain.gain);

    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.ctx.destination);

    baseSource.start();
    crackleSource.start();
    modulator.start();

    this.sources['rain'] = {
      baseSource,
      crackleSource,
      modulator,
      baseGain,
      crackleGain
    };
  }

  stopRain() {
    const s = this.sources['rain'];
    if (s) {
      try { s.baseSource.stop(); } catch(e) {}
      try { s.crackleSource.stop(); } catch(e) {}
      try { s.modulator.stop(); } catch(e) {}
      delete this.sources['rain'];
    }
  }

  setRainVolume(volume) {
    const s = this.sources['rain'];
    if (s && this.ctx) {
      s.baseGain.gain.setValueAtTime(volume * 0.75, this.ctx.currentTime);
      s.crackleGain.gain.setValueAtTime(volume * 0.12, this.ctx.currentTime);
    }
  }

  startWind(volume) {
    this.init();
    if (this.sources['wind']) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer('pink');
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2.0;
    filter.frequency.value = 380;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume * 0.5;

    // Gusting LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // Gust period

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 220; // Sweeping range

    const lfoVolumeGain = this.ctx.createGain();
    lfoVolumeGain.gain.value = volume * 0.45;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    lfo.connect(lfoVolumeGain);
    lfoVolumeGain.connect(gainNode.gain);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    source.start();
    lfo.start();

    this.sources['wind'] = {
      source,
      lfo,
      filter,
      gainNode,
      lfoVolumeGain
    };
  }

  stopWind() {
    const s = this.sources['wind'];
    if (s) {
      try { s.source.stop(); } catch(e) {}
      try { s.lfo.stop(); } catch(e) {}
      delete this.sources['wind'];
    }
  }

  setWindVolume(volume) {
    const s = this.sources['wind'];
    if (s && this.ctx) {
      s.gainNode.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);
      s.lfoVolumeGain.gain.setValueAtTime(volume * 0.45, this.ctx.currentTime);
    }
  }

  startWaves(volume) {
    this.init();
    if (this.sources['waves']) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer('pink');
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume * 0.5;

    // Slow swell LFO (20s cycle)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;

    const lfoFilterGain = this.ctx.createGain();
    lfoFilterGain.gain.value = 160;

    const lfoVolumeGain = this.ctx.createGain();
    lfoVolumeGain.gain.value = volume * 0.45;

    lfo.connect(lfoFilterGain);
    lfoFilterGain.connect(filter.frequency);

    lfo.connect(lfoVolumeGain);
    lfoVolumeGain.connect(gainNode.gain);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    source.start();
    lfo.start();

    this.sources['waves'] = {
      source,
      lfo,
      filter,
      gainNode,
      lfoVolumeGain
    };
  }

  stopWaves() {
    const s = this.sources['waves'];
    if (s) {
      try { s.source.stop(); } catch(e) {}
      try { s.lfo.stop(); } catch(e) {}
      delete this.sources['waves'];
    }
  }

  setWavesVolume(volume) {
    const s = this.sources['waves'];
    if (s && this.ctx) {
      s.gainNode.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);
      s.lfoVolumeGain.gain.setValueAtTime(volume * 0.45, this.ctx.currentTime);
    }
  }

  startSynth(volume) {
    this.init();
    if (this.sources['synth']) return;

    // Phasing deep oscillators
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = 55.0; // A1

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 55.3; // detuned

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.value = 110.0; // octave up

    const g1 = this.ctx.createGain();
    g1.gain.value = 0.5;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.15;
    const g3 = this.ctx.createGain();
    g3.gain.value = 0.35;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 125;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;

    // Slow space sweep
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.03;

    const lfoFilterGain = this.ctx.createGain();
    lfoFilterGain.gain.value = 35;

    lfo.connect(lfoFilterGain);
    lfoFilterGain.connect(filter.frequency);

    osc1.connect(g1);
    osc2.connect(g2);
    osc3.connect(g3);

    g1.connect(filter);
    g2.connect(filter);
    g3.connect(filter);

    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();

    this.sources['synth'] = {
      osc1,
      osc2,
      osc3,
      lfo,
      gainNode
    };
  }

  stopSynth() {
    const s = this.sources['synth'];
    if (s) {
      try { s.osc1.stop(); } catch(e) {}
      try { s.osc2.stop(); } catch(e) {}
      try { s.osc3.stop(); } catch(e) {}
      try { s.lfo.stop(); } catch(e) {}
      delete this.sources['synth'];
    }
  }

  setSynthVolume(volume) {
    const s = this.sources['synth'];
    if (s && this.ctx) {
      s.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  startCafe(volume) {
    this.init();
    if (this.sources['cafe']) return;

    // 1. Cafe Murmur (low-passed pink noise for background chatter/hiss)
    const murmurSource = this.ctx.createBufferSource();
    murmurSource.buffer = this.createNoiseBuffer('pink');
    murmurSource.loop = true;

    const murmurFilter = this.ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 400;
    murmurFilter.Q.value = 1.0;

    const murmurGain = this.ctx.createGain();
    murmurGain.gain.value = volume * 0.35;

    murmurSource.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(this.ctx.destination);
    murmurSource.start();

    // Cafe state object
    const state = {
      volume,
      murmurSource,
      murmurGain,
      clinkInterval: null,
      cricketInterval: null,
      chordInterval: null,
      chordIndex: 0
    };
    this.sources['cafe'] = state;

    // Rhodes-like chords: Cmaj7, Am7, Dm7, G7
    const chords = [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [110.00, 130.81, 164.81, 196.00], // Am7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [98.00, 123.47, 146.83, 174.61]   // G7
    ];

    const playCafeChord = () => {
      if (!this.ctx || !this.sources['cafe']) return;
      const vol = this.sources['cafe'].volume;
      const chordNotes = chords[state.chordIndex % chords.length];
      state.chordIndex++;

      const now = this.ctx.currentTime;
      chordNotes.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gainNode = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(vol * 0.16, now + 1.2);
        gainNode.gain.setValueAtTime(vol * 0.16, now + 4.8);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 6.8);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 7.0);
      });
    };

    // Play first chord immediately
    playCafeChord();
    state.chordInterval = setInterval(playCafeChord, 7000);

    // Cup clinks (random resonant clicks)
    const triggerClink = () => {
      if (!this.ctx || !this.sources['cafe']) return;
      const vol = this.sources['cafe'].volume;
      const now = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2400 + Math.random() * 300, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(3200 + Math.random() * 300, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(vol * 0.04, now + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.1);
      osc2.stop(now + 0.1);
    };

    state.clinkInterval = setInterval(() => {
      if (Math.random() > 0.4) triggerClink();
    }, 4500);

    // Subtle crickets/insect chirps (Cozy Cafe)
    const triggerCricketChirp = () => {
      if (!this.ctx || !this.sources['cafe']) return;
      const vol = this.sources['cafe'].volume;
      const now = this.ctx.currentTime;

      // 3 fast chirps in sequence
      for (let i = 0; i < 3; i++) {
        const startTime = now + i * 0.08;
        const duration = 0.035;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(4300 + Math.random() * 60, startTime);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(vol * 0.035, startTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
      }
    };

    state.cricketInterval = setInterval(() => {
      if (Math.random() > 0.35) triggerCricketChirp();
    }, 3500);
  }

  stopCafe() {
    const s = this.sources['cafe'];
    if (s) {
      if (s.clinkInterval) clearInterval(s.clinkInterval);
      if (s.cricketInterval) clearInterval(s.cricketInterval);
      if (s.chordInterval) clearInterval(s.chordInterval);
      if (s.murmurSource) {
        try { s.murmurSource.stop(); } catch(e) {}
      }
      delete this.sources['cafe'];
    }
  }

  setCafeVolume(volume) {
    const s = this.sources['cafe'];
    if (s) {
      s.volume = volume;
      if (s.murmurGain && this.ctx) {
        s.murmurGain.gain.setValueAtTime(volume * 0.35, this.ctx.currentTime);
      }
    }
  }

  startLofi(volume) {
    this.init();
    if (this.sources['lofi']) return;

    const state = {
      volume,
      crackleInterval: null,
      birdInterval: null,
      beatInterval: null,
      chordInterval: null,
      chordIndex: 0,
      beatStep: 0
    };
    this.sources['lofi'] = state;

    // Chords: Em9, A7sus4, Cmaj9, B7alt
    const chords = [
      [82.41, 196.00, 246.94, 293.66, 369.99], // Em9
      [110.00, 164.81, 196.00, 293.66],       // A7sus4
      [130.81, 196.00, 246.94, 293.66, 329.63], // Cmaj9
      [123.47, 155.56, 220.00, 293.66]        // B7alt
    ];

    const playLofiChord = () => {
      if (!this.ctx || !this.sources['lofi']) return;
      const vol = this.sources['lofi'].volume;
      const chordNotes = chords[state.chordIndex % chords.length];
      state.chordIndex++;

      const now = this.ctx.currentTime;
      chordNotes.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gainNode = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(vol * 0.18, now + 2.0);
        gainNode.gain.setValueAtTime(vol * 0.18, now + 5.5);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 7.8);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 8.0);
      });
    };

    playLofiChord();
    state.chordInterval = setInterval(playLofiChord, 8000);

    // Vinyl crackle simulator
    const triggerCrackle = () => {
      if (!this.ctx || !this.sources['lofi']) return;
      const vol = this.sources['lofi'].volume;
      const now = this.ctx.currentTime;

      const source = this.ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer('white');

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.Q.setValueAtTime(4, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.03 * Math.random(), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      source.start(now);
      source.stop(now + 0.02);
    };

    state.crackleInterval = setInterval(triggerCrackle, 350);

    // Bird chirping sounds (Lo-Fi Chill)
    const triggerBirdChirps = () => {
      if (!this.ctx || !this.sources['lofi']) return;
      const vol = this.sources['lofi'].volume;
      const now = this.ctx.currentTime;
      const sweeps = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < sweeps; i++) {
        const startTime = now + i * 0.14;
        const duration = 0.085;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1600 + Math.random() * 200, startTime);
        osc.frequency.exponentialRampToValueAtTime(2900 + Math.random() * 200, startTime + duration);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(vol * 0.045, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
      }
    };

    state.birdInterval = setInterval(() => {
      if (Math.random() > 0.4) triggerBirdChirps();
    }, 4200);

    // Boom-bap lo-fi beat loop (144 eighths = 72 BPM)
    state.beatInterval = setInterval(() => {
      if (!this.ctx || !this.sources['lofi']) return;
      const vol = this.sources['lofi'].volume;
      const now = this.ctx.currentTime;
      const currentStep = state.beatStep % 8;
      state.beatStep++;

      if (currentStep === 0 || currentStep === 5) {
        // Kick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(75, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);

        gain.gain.setValueAtTime(vol * 0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (currentStep === 4) {
        // Snare rim
        const source = this.ctx.createBufferSource();
        source.buffer = this.createNoiseBuffer('white');

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.Q.setValueAtTime(3, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
        source.stop(now + 0.05);
      }
    }, 416);
  }

  stopLofi() {
    const s = this.sources['lofi'];
    if (s) {
      if (s.crackleInterval) clearInterval(s.crackleInterval);
      if (s.birdInterval) clearInterval(s.birdInterval);
      if (s.beatInterval) clearInterval(s.beatInterval);
      if (s.chordInterval) clearInterval(s.chordInterval);
      delete this.sources['lofi'];
    }
  }

  setLofiVolume(volume) {
    const s = this.sources['lofi'];
    if (s) {
      s.volume = volume;
    }
  }

  start(id, volume) {
    if (id === 'rain') this.startRain(volume);
    else if (id === 'wind') this.startWind(volume);
    else if (id === 'waves') this.startWaves(volume);
    else if (id === 'synth') this.startSynth(volume);
    else if (id === 'cafe') this.startCafe(volume);
    else if (id === 'lofi') this.startLofi(volume);
  }

  stop(id) {
    if (id === 'rain') this.stopRain();
    else if (id === 'wind') this.stopWind();
    else if (id === 'waves') this.stopWaves();
    else if (id === 'synth') this.stopSynth();
    else if (id === 'cafe') this.stopCafe();
    else if (id === 'lofi') this.stopLofi();
  }

  setVolume(id, volume) {
    if (id === 'rain') this.setRainVolume(volume);
    else if (id === 'wind') this.setWindVolume(volume);
    else if (id === 'waves') this.setWavesVolume(volume);
    else if (id === 'synth') this.setSynthVolume(volume);
    else if (id === 'cafe') this.setCafeVolume(volume);
    else if (id === 'lofi') this.setLofiVolume(volume);
  }

  stopAll() {
    this.stopRain();
    this.stopWind();
    this.stopWaves();
    this.stopSynth();
    this.stopCafe();
    this.stopLofi();
  }
}

export default function SoundMixer() {
  const [mixerState, setMixerState] = useState(() => {
    const saved = localStorage.getItem('dreamora_mixer_state');
    if (saved) return JSON.parse(saved);
    return TRACKS.reduce((acc, t) => {
      acc[t.id] = { playing: false, volume: 0.5 };
      return acc;
    }, {});
  });

  const [masterPlaying, setMasterPlaying] = useState(false);
  const synthRef = useRef(null);

  // Lazily construct Web Audio class instance
  if (!synthRef.current) {
    synthRef.current = new AmbientSynth();
  }

  // Sync Audio context when state changes from local storage trigger
  const syncAudioWithState = (stateObj) => {
    if (!synthRef.current) return;
    Object.entries(stateObj).forEach(([id, track]) => {
      if (track.playing) {
        synthRef.current.start(id, track.volume);
      } else {
        synthRef.current.stop(id);
      }
    });
    setMasterPlaying(Object.values(stateObj).some(t => t.playing));
  };

  // Listen to storage events and initial sync
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'dreamora_mixer_state' && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        setMixerState(parsed);
        syncAudioWithState(parsed);
      }
    };
    
    // Initial sync on mount if there is a saved state
    const saved = localStorage.getItem('dreamora_mixer_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      syncAudioWithState(parsed);
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Clean up all audio components on component unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stopAll();
      }
    };
  }, []);

  const toggleTrack = (id) => {
    const newState = { ...mixerState };

    if (newState[id].playing) {
      synthRef.current.stop(id);
      newState[id].playing = false;
    } else {
      const vol = newState[id].volume;
      synthRef.current.start(id, vol);
      newState[id].playing = true;
    }

    setMixerState(newState);
    setMasterPlaying(Object.values(newState).some(t => t.playing));
    localStorage.setItem('dreamora_mixer_state', JSON.stringify(newState));
  };

  const changeVolume = (id, value) => {
    synthRef.current.setVolume(id, value);

    const newState = {
      ...mixerState,
      [id]: { ...mixerState[id], volume: value }
    };
    setMixerState(newState);
    localStorage.setItem('dreamora_mixer_state', JSON.stringify(newState));
  };

  const stopAll = () => {
    const newState = { ...mixerState };
    synthRef.current.stopAll();
    Object.keys(newState).forEach(id => {
      newState[id].playing = false;
    });
    setMixerState(newState);
    setMasterPlaying(false);
    localStorage.setItem('dreamora_mixer_state', JSON.stringify(newState));
  };

  const applyPreset = (preset) => {
    const newState = { ...mixerState };

    synthRef.current.stopAll();
    Object.keys(newState).forEach(id => {
      newState[id].playing = false;
    });

    // Deploy preset volumes to corresponding channels
    Object.entries(preset).forEach(([id, vol]) => {
      newState[id] = { playing: true, volume: vol };
      synthRef.current.start(id, vol);
    });

    setMixerState(newState);
    setMasterPlaying(true);
    localStorage.setItem('dreamora_mixer_state', JSON.stringify(newState));
  };

  const PRESETS = {
    rainyCafe: { rain: 0.7, cafe: 0.4 },
    deepFocus: { rain: 0.3, wind: 0.5, synth: 0.2 },
    wavesSynth: { waves: 0.6, lofi: 0.4 },
    studySession: { lofi: 0.5, cafe: 0.3 }
  };

  return (
    <div className="glass-panel p-6 flex flex-col flex-1 min-h-0 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ambient Mixer</h2>
          <p className="text-sm text-gray-400">Design your perfect acoustic environment for deep study sessions</p>
        </div>
        {masterPlaying && (
          <button
            onClick={stopAll}
            className="glass-button flex items-center gap-2 border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
          >
            <VolumeX size={16} />
            Mute All
          </button>
        )}
      </div>

      {/* Preset cards */}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Soundscapes</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => applyPreset(PRESETS.rainyCafe)}
          className="glass-panel p-3 text-center cursor-pointer hover:border-violet-500/30 hover:bg-violet-950/10 transition-all flex flex-col items-center justify-center gap-1 group"
        >
          <span className="text-xl">🌧️☕</span>
          <span className="font-semibold text-xs group-hover:text-violet-400">Rainy Cafe</span>
        </button>
        <button
          onClick={() => applyPreset(PRESETS.deepFocus)}
          className="glass-panel p-3 text-center cursor-pointer hover:border-violet-500/30 hover:bg-violet-950/10 transition-all flex flex-col items-center justify-center gap-1 group"
        >
          <span className="text-xl">💨🧘</span>
          <span className="font-semibold text-xs group-hover:text-violet-400">Deep Focus</span>
        </button>
        <button
          onClick={() => applyPreset(PRESETS.wavesSynth)}
          className="glass-panel p-3 text-center cursor-pointer hover:border-violet-500/30 hover:bg-violet-950/10 transition-all flex flex-col items-center justify-center gap-1 group"
        >
          <span className="text-xl">🌊🎹</span>
          <span className="font-semibold text-xs group-hover:text-violet-400">Ocean Breeze</span>
        </button>
        <button
          onClick={() => applyPreset(PRESETS.studySession)}
          className="glass-panel p-3 text-center cursor-pointer hover:border-[var(--primary-hover)] hover:bg-[var(--primary-glow)] transition-all flex flex-col items-center justify-center gap-1 group"
        >
          <span className="text-xl">🎵☕</span>
          <span className="font-semibold text-xs group-hover:text-[var(--primary)]">Study Session</span>
        </button>
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Custom Channels</h3>
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TRACKS.map(track => {
            const state = mixerState[track.id];
            const Icon = track.icon;

            return (
              <div
                key={track.id}
                className={`glass-panel p-4 flex flex-col gap-3 transition-all ${
                  state.playing ? 'border-[var(--primary)] bg-[var(--primary-glow)] shadow-inner' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg border ${track.color} ${state.playing ? 'animate-pulse' : ''}`}>
                      <Icon size={18} />
                    </div>
                    <span className="font-semibold text-sm">{track.name}</span>
                  </div>
                  <button
                    onClick={() => toggleTrack(track.id)}
                    className={`p-2 rounded-full border transition-all ${
                      state.playing
                        ? 'bg-[var(--primary)] border-[var(--primary-hover)] text-[var(--bg-dark)] hover:opacity-90 shadow-lg shadow-[var(--primary-glow)]'
                        : 'border-[var(--border)] text-[var(--primary)] hover:bg-white/5 bg-transparent'
                    }`}
                  >
                    {state.playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Volume2 size={14} className="text-gray-500" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={state.volume}
                    onChange={(e) => changeVolume(track.id, parseFloat(e.target.value))}
                    disabled={!state.playing}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                  <span className="text-[10px] font-mono text-gray-500 w-8 text-right">
                    {Math.round(state.volume * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
