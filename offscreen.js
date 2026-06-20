/* Aura Tab - Programmatic Web Audio Synthesizer (Offscreen Document) */

let audioCtx = null;
let currentSourceNode = null;
let currentGainNode = null;
let currentLFONodes = [];
let secondarySourceNode = null;

// Initialize Audio Context on demand
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Stop any currently playing audio loops
function stopAllAudio() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
    } catch (e) {}
    currentSourceNode = null;
  }
  if (secondarySourceNode) {
    try {
      secondarySourceNode.stop();
    } catch (e) {}
    secondarySourceNode = null;
  }
  currentLFONodes.forEach(node => {
    try {
      node.stop();
    } catch (e) {}
  });
  currentLFONodes = [];
}

// Synthesize ascending focus start chime
function playStartChime() {
  const ctx = getAudioContext();
  stopAllAudio();
  
  const now = ctx.currentTime;
  
  // Ascending major chord notes: C5 (523.25 Hz) then G5 (783.99 Hz)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(523.25, now);
  osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.3);
  
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(261.63, now); // C4 support
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  
  osc1.start(now);
  osc2.start(now);
  
  osc1.stop(now + 0.8);
  osc2.stop(now + 0.8);
}

// Synthesize descending session end chime
function playEndChime() {
  const ctx = getAudioContext();
  stopAllAudio();
  
  const now = ctx.currentTime;
  
  // Descending bell chord notes: G5 (783.99 Hz) -> E5 (659.25 Hz) -> C5 (523.25 Hz)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(783.99, now);
  osc1.frequency.setValueAtTime(659.25, now + 0.15);
  osc1.frequency.setValueAtTime(523.25, now + 0.3);
  
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(392.00, now); // G4 octave down resonance
  
  osc3.type = "triangle";
  osc3.frequency.setValueAtTime(130.81, now); // C3 deep chime base
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
  
  osc1.connect(gain);
  osc2.connect(gain);
  osc3.connect(gain);
  gain.connect(ctx.destination);
  
  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  
  osc1.stop(now + 1.5);
  osc2.stop(now + 1.5);
  osc3.stop(now + 1.5);
}

// Programmatic Pink Noise Generator (Rain / Wind)
function createPinkNoiseBuffer(ctx) {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // normalise gain roughly
    b6 = white * 0.115926;
  }
  return buffer;
}

// Programmatic Brown Noise Generator (Ocean / Heavy Rain)
function createBrownNoiseBuffer(ctx) {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // normalise gain roughly
  }
  return buffer;
}

// Programmatic White Noise Generator (Focus Static)
function createWhiteNoiseBuffer(ctx) {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Programmatic Water Droplet Synthesizer for realistic Rain patter
function createRainPatterBuffer(ctx) {
  const bufferSize = 3 * ctx.sampleRate; // 3 seconds loop
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Initialize to zero
  for (let i = 0; i < bufferSize; i++) {
    data[i] = 0;
  }
  
  const numDrops = 150; // number of drops in the 3s loop
  for (let d = 0; d < numDrops; d++) {
    const startIdx = Math.floor(Math.random() * (bufferSize - 600));
    const freq = 1200 + Math.random() * 1800; // droplet pitch (high frequency resonant pop)
    const decay = 250 + Math.random() * 250; // droplet duration (samples)
    
    for (let i = 0; i < decay; i++) {
      // Exponential decay envelope on sine wave
      const envelope = Math.exp(-i / (decay * 0.18));
      const value = envelope * Math.sin(2 * Math.PI * freq * (i / ctx.sampleRate));
      data[startIdx + i] += value * 0.06;
    }
  }
  return buffer;
}

// Programmatic Campfire Synthesizer (low rumble + crackling sparks)
function createCampfireBuffer(ctx) {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // 1. Generate base rumble (combination of lowpassed pink/brown noise)
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
    data[i] = pink * 0.06; // soft rumble
  }
  
  // Apply a simple lowpass filter to the base rumble
  let lastVal = 0;
  for (let i = 0; i < bufferSize; i++) {
    data[i] = 0.94 * lastVal + 0.06 * data[i];
    lastVal = data[i];
  }
  
  // 2. Add randomized crackle pops (high pass spikes)
  const numPops = 40 + Math.floor(Math.random() * 40); // 40 to 80 pops in 4 seconds
  for (let p = 0; p < numPops; p++) {
    const startIdx = Math.floor(Math.random() * (bufferSize - 1000));
    const popLength = 5 + Math.floor(Math.random() * 20); // very short
    const amplitude = 0.18 + Math.random() * 0.22;
    
    for (let i = 0; i < popLength; i++) {
      const t = i / popLength;
      const env = Math.sin(t * Math.PI) * Math.exp(-t * 5);
      const noiseVal = Math.random() * 2 - 1;
      data[startIdx + i] += noiseVal * env * amplitude;
    }
  }
  return buffer;
}

// Programmatic Birds Chirping Synthesizer (randomized high sine frequency sweeps)
function createBirdsBuffer(ctx) {
  const bufferSize = 6 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = 0;
  }
  
  // Add 5-8 chirping events at random times in the 6 seconds
  const numEvents = 5 + Math.floor(Math.random() * 4);
  for (let e = 0; e < numEvents; e++) {
    const startIdx = Math.floor(Math.random() * (bufferSize - ctx.sampleRate));
    const numChirps = 2 + Math.floor(Math.random() * 4); // 2 to 5 chirps per sequence
    let currentOffset = 0;
    
    for (let c = 0; c < numChirps; c++) {
      const chirpDuration = 0.08 + Math.random() * 0.08; // 80ms to 160ms
      const chirpSamples = Math.floor(chirpDuration * ctx.sampleRate);
      const startFreq = 2000 + Math.random() * 800; // 2k to 2.8kHz
      const endFreq = startFreq + 700 + Math.random() * 700; // upward sweep
      const amp = 0.08 + Math.random() * 0.08;
      
      let phase = 0;
      for (let i = 0; i < chirpSamples; i++) {
        const t = i / chirpSamples;
        const env = Math.sin(t * Math.PI) * Math.exp(-t * 2.5);
        const freq = startFreq + (endFreq - startFreq) * t;
        phase += (2 * Math.PI * freq) / ctx.sampleRate;
        const val = Math.sin(phase) * env * amp;
        
        const idx = startIdx + currentOffset + i;
        if (idx < bufferSize) {
          data[idx] += val;
        }
      }
      currentOffset += chirpSamples + Math.floor((0.06 + Math.random() * 0.1) * ctx.sampleRate);
    }
  }
  return buffer;
}

// Programmatic Thunder rumble Synthesizer (envelope-modulated deep lowpassed brown noise)
function createThunderBuffer(ctx) {
  const bufferSize = 8 * ctx.sampleRate; // 8 seconds loop
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // 1. Generate brown noise base
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 1.5;
  }
  
  // 2. Apply thunder envelope: one big strike and one secondary rumble
  const envelope = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) envelope[i] = 0.02; // soft background rumble
  
  // Big strike at 1.5s
  const strike1Idx = Math.floor(1.5 * ctx.sampleRate);
  const strike1Length = Math.floor(4.5 * ctx.sampleRate);
  for (let i = 0; i < strike1Length; i++) {
    const t = i / strike1Length;
    const idx = strike1Idx + i;
    if (idx >= bufferSize) break;
    
    let envVal = 0;
    if (t < 0.03) { // 0.135 seconds rise
      envVal = t / 0.03;
    } else {
      const rumble = 1.0 + 0.3 * Math.sin(t * 2 * Math.PI * 4.5);
      envVal = Math.exp(-(t - 0.03) * 1.5) * rumble;
    }
    envelope[idx] = Math.max(envelope[idx], envVal * 0.7);
  }
  
  // Soft secondary strike at 5.2s
  const strike2Idx = Math.floor(5.2 * ctx.sampleRate);
  const strike2Length = Math.floor(2.5 * ctx.sampleRate);
  for (let i = 0; i < strike2Length; i++) {
    const t = i / strike2Length;
    const idx = strike2Idx + i;
    if (idx >= bufferSize) break;
    
    let envVal = 0;
    if (t < 0.05) {
      envVal = t / 0.05;
    } else {
      const rumble = 1.0 + 0.25 * Math.sin(t * 2 * Math.PI * 5.0);
      envVal = Math.exp(-(t - 0.05) * 2.2) * rumble;
    }
    envelope[idx] = Math.max(envelope[idx], envVal * 0.35);
  }
  
  // Multiply brown noise by the envelope
  for (let i = 0; i < bufferSize; i++) {
    data[i] *= envelope[i];
  }
  
  // Lowpass filter to keep it deep and rumbling (cutoff around 150Hz)
  let lastVal = 0;
  for (let i = 0; i < bufferSize; i++) {
    data[i] = 0.978 * lastVal + 0.022 * data[i];
    lastVal = data[i];
  }
  return buffer;
}

// Programmatic Wind Chimes Synthesizer (pentatonic frequencies with inharmonic resonant bells)
function createWindChimesBuffer(ctx) {
  const bufferSize = 5 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = 0;
  }
  
  const freqs = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00]; // Pentatonic notes (C6 - C7)
  const numTriggers = 8 + Math.floor(Math.random() * 6); // 8 to 13 chimes in 5s
  
  for (let t = 0; t < numTriggers; t++) {
    const startIdx = Math.floor(Math.random() * (bufferSize - 1.5 * ctx.sampleRate));
    const freq = freqs[Math.floor(Math.random() * freqs.length)];
    const duration = 0.8 + Math.random() * 0.7; // 0.8s to 1.5s decay
    const decaySamples = Math.floor(duration * ctx.sampleRate);
    const amp = 0.04 + Math.random() * 0.04;
    
    for (let i = 0; i < decaySamples; i++) {
      const time = i / ctx.sampleRate;
      const env = Math.exp(-time * (4.2 / duration)); // exponential decay
      
      // Metal bar resonance model: fundamental + inharmonic overtones
      const val = Math.sin(2 * Math.PI * freq * time) + 
                  0.45 * Math.sin(2 * Math.PI * freq * 2.76 * time) +
                  0.2 * Math.sin(2 * Math.PI * freq * 4.4 * time) +
                  0.1 * Math.sin(2 * Math.PI * freq * 5.4 * time);
                  
      const sampleVal = val * env * amp;
      const idx = startIdx + i;
      if (idx < bufferSize) {
        data[idx] += sampleVal;
      }
    }
  }
  return buffer;
}

// Start playing selected ambient sound loop
function playAmbientSound(soundType, userVolume = 0.5) {
  const ctx = getAudioContext();
  stopAllAudio();
  
  const now = ctx.currentTime;
  
  // Create noise buffer source
  let buffer;
  if (soundType === "white") {
    buffer = createWhiteNoiseBuffer(ctx);
  } else if (soundType === "pink" || soundType === "rain" || soundType === "wind") {
    buffer = createPinkNoiseBuffer(ctx);
  } else if (soundType === "brown" || soundType === "ocean" || soundType === "waterfall") {
    buffer = createBrownNoiseBuffer(ctx);
  } else if (soundType === "campfire") {
    buffer = createCampfireBuffer(ctx);
  } else if (soundType === "birds") {
    buffer = createBirdsBuffer(ctx);
  } else if (soundType === "thunder") {
    buffer = createThunderBuffer(ctx);
  } else if (soundType === "chimes") {
    buffer = createWindChimesBuffer(ctx);
  } else {
    buffer = createPinkNoiseBuffer(ctx); // Default
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(userVolume, now);
  
  // Filters to style sounds
  if (soundType === "rain") {
    // 1. Constant Background Rain Rumble (Filtered Pink Noise)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(1000, now);
    
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(120, now); // remove low-end muddiness
    
    // Slow wind-gust modulation on background rain filter (creates organic movement)
    const rainLFO = ctx.createOscillator();
    rainLFO.type = "sine";
    rainLFO.frequency.setValueAtTime(0.08, now); // 12-second cycle
    
    const rainLFOGain = ctx.createGain();
    rainLFOGain.gain.setValueAtTime(180, now); // oscillate filter frequency by +/- 180Hz
    
    rainLFO.connect(rainLFOGain);
    rainLFOGain.connect(lowpass.frequency);
    
    rainLFO.start(now);
    currentLFONodes.push(rainLFO);
    
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(mainGain);
    
    // 2. Dynamic Rain Patter Layer (Synthesized Water Droplets)
    try {
      const patterBuffer = createRainPatterBuffer(ctx);
      const patterSource = ctx.createBufferSource();
      patterSource.buffer = patterBuffer;
      patterSource.loop = true;
      
      const patterFilter = ctx.createBiquadFilter();
      patterFilter.type = "bandpass";
      patterFilter.frequency.setValueAtTime(1800, now); // center droplet clicks
      patterFilter.Q.setValueAtTime(1.0, now);
      
      const patterGain = ctx.createGain();
      patterGain.gain.setValueAtTime(0.7, now); // volume balance relative to main background
      
      patterSource.connect(patterFilter);
      patterFilter.connect(patterGain);
      patterGain.connect(mainGain);
      
      patterSource.start(now);
      secondarySourceNode = patterSource;
    } catch (e) {
      console.warn("Failed to initialize rain patter generator:", e);
    }
  } 
  else if (soundType === "wind") {
    // Dual-layered wind generator (simulates low roar + leafy high rustles)
    
    // Wind Layer 1: Deep low-frequency gust
    const bp1 = ctx.createBiquadFilter();
    bp1.type = "bandpass";
    bp1.Q.setValueAtTime(1.0, now);
    
    const windLFO1 = ctx.createOscillator();
    windLFO1.type = "sine";
    windLFO1.frequency.setValueAtTime(0.04, now); // slow 25-second cycle
    
    const lfo1Gain = ctx.createGain();
    lfo1Gain.gain.setValueAtTime(150, now); // sweep +/- 150Hz
    
    windLFO1.connect(lfo1Gain);
    lfo1Gain.connect(bp1.frequency);
    bp1.frequency.setValueAtTime(250, now); // baseline center
    
    windLFO1.start(now);
    currentLFONodes.push(windLFO1);
    
    // Modulate volume with gust strength
    const windGain1 = ctx.createGain();
    const lfo1VolumeGain = ctx.createGain();
    lfo1VolumeGain.gain.setValueAtTime(0.25, now);
    windLFO1.connect(lfo1VolumeGain);
    lfo1VolumeGain.connect(windGain1.gain);
    windGain1.gain.setValueAtTime(0.55, now); // center gain
    
    source.connect(bp1);
    bp1.connect(windGain1);
    windGain1.connect(mainGain);
    
    // Wind Layer 2: Higher frequency rustling gusts (parallel graph)
    const bp2 = ctx.createBiquadFilter();
    bp2.type = "bandpass";
    bp2.Q.setValueAtTime(1.5, now);
    
    const windLFO2 = ctx.createOscillator();
    windLFO2.type = "sine";
    windLFO2.frequency.setValueAtTime(0.07, now); // faster 14-second cycle
    
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.setValueAtTime(250, now); // sweep +/- 250Hz
    
    windLFO2.connect(lfo2Gain);
    lfo2Gain.connect(bp2.frequency);
    bp2.frequency.setValueAtTime(550, now); // baseline center
    
    windLFO2.start(now);
    currentLFONodes.push(windLFO2);
    
    const windGain2 = ctx.createGain();
    const lfo2VolumeGain = ctx.createGain();
    lfo2VolumeGain.gain.setValueAtTime(0.2, now);
    windLFO2.connect(lfo2VolumeGain);
    lfo2VolumeGain.connect(windGain2.gain);
    windGain2.gain.setValueAtTime(0.35, now); // lower baseline volume for rustle
    
    source.connect(bp2);
    bp2.connect(windGain2);
    windGain2.connect(mainGain);
  }
  else if (soundType === "ocean") {
    // Ocean: Deep Brown noise waves with stereo motion and spectral modulation
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    
    // Wave LFO: modulating volume and lowpass cutoff frequency (simulating wave crests breaking)
    const waveLFO = ctx.createOscillator();
    waveLFO.type = "sine";
    waveLFO.frequency.setValueAtTime(0.07, now); // cycle every 14.2 seconds
    
    // Filter frequency modulation (wave crest opens high frequencies, trough rolls them off)
    const filterLFOGain = ctx.createGain();
    filterLFOGain.gain.setValueAtTime(220, now); // swing of +/- 220Hz
    waveLFO.connect(filterLFOGain);
    filterLFOGain.connect(lowpass.frequency);
    lowpass.frequency.setValueAtTime(380, now); // center frequency
    
    // Volume modulation
    const waveGainNode = ctx.createGain();
    const lfoVolumeGain = ctx.createGain();
    lfoVolumeGain.gain.setValueAtTime(0.3, now); // fluctuate volume +/- 30%
    waveLFO.connect(lfoVolumeGain);
    lfoVolumeGain.connect(waveGainNode.gain);
    waveGainNode.gain.setValueAtTime(0.6, now); // baseline volume
    
    // Stereo Panning (gentle left-to-right drift)
    let finalOutputNode = waveGainNode;
    if (ctx.createStereoPanner) {
      try {
        const panner = ctx.createStereoPanner();
        const panLFO = ctx.createOscillator();
        panLFO.type = "sine";
        panLFO.frequency.setValueAtTime(0.045, now); // slower cycle for stereo phase shift
        
        const panGain = ctx.createGain();
        panGain.gain.setValueAtTime(0.45, now); // pan drift +/- 45% left/right
        
        panLFO.connect(panGain);
        panGain.connect(panner.pan);
        
        panLFO.start(now);
        currentLFONodes.push(panLFO);
        
        waveGainNode.connect(panner);
        finalOutputNode = panner;
      } catch (err) {
        console.warn("Stereo panning node failed to initialize:", err);
      }
    }
    
    source.connect(lowpass);
    lowpass.connect(waveGainNode);
    finalOutputNode.connect(mainGain);
    
    waveLFO.start(now);
    currentLFONodes.push(waveLFO);
  }
  else {
    // Default unfiltered white/pink/brown noise
    source.connect(mainGain);
  }
  
  mainGain.connect(ctx.destination);
  source.start(now);
  
  currentSourceNode = source;
  currentGainNode = mainGain;
}

// Runtime Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PLAY_SOUND") {
    if (message.source === "start") {
      playStartChime();
    } else if (message.source === "end") {
      playEndChime();
    }
    sendResponse({ success: true });
  } 
  else if (message.type === "PLAY_AMBIENT") {
    playAmbientSound(message.sound, message.volume);
    sendResponse({ success: true });
  } 
  else if (message.type === "STOP_AMBIENT") {
    stopAllAudio();
    sendResponse({ success: true });
  }
});
