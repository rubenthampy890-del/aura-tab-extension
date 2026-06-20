/* Aura Tab - Programmatic Web Audio Synthesizer (Offscreen Document) */

let audioCtx = null;
let currentSourceNode = null;
let currentGainNode = null;
let lfoNode = null;

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
    } catch (e) {
      // Already stopped
    }
    currentSourceNode = null;
  }
  if (lfoNode) {
    try {
      lfoNode.stop();
    } catch (e) {}
    lfoNode = null;
  }
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
    // Rain filter: Lowpass filter around 1000Hz to remove harsh static frequencies
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(1200, now);
    
    source.connect(lowpass);
    lowpass.connect(mainGain);
  } 
  else if (soundType === "wind") {
    // Wind filter: Bandpass filter with shifting LFO center frequency
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.Q.setValueAtTime(2.0, now);
    
    // Create slow wind LFO
    const windLFO = ctx.createOscillator();
    windLFO.type = "sine";
    windLFO.frequency.setValueAtTime(0.05, now); // very slow cycle (20s)
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, now); // oscillate center frequency +/- 250Hz
    
    windLFO.connect(lfoGain);
    lfoGain.connect(bandpass.frequency); // modulate bandpass frequency
    
    bandpass.frequency.setValueAtTime(400, now); // baseline frequency
    
    source.connect(bandpass);
    bandpass.connect(mainGain);
    
    windLFO.start(now);
    lfoNode = windLFO;
  }
  else if (soundType === "ocean") {
    // Ocean: Brown noise modulated by slow LFO gain sweeping (rolling waves)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(450, now); // deep ocean rumble
    
    // Wave LFO modulating volume
    const waveLFO = ctx.createOscillator();
    waveLFO.type = "sine";
    waveLFO.frequency.setValueAtTime(0.08, now); // cycle every 12.5 seconds
    
    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(userVolume * 0.5, now); // range of volume fluctuation
    
    // Center volume around 50% user volume, and oscillate
    const lfoTargetGain = ctx.createGain();
    lfoTargetGain.gain.setValueAtTime(userVolume * 0.5, now);
    
    waveLFO.connect(waveGain);
    
    // Connect wave LFO directly to gain parameter
    waveGain.connect(mainGain.gain);
    
    source.connect(lowpass);
    lowpass.connect(mainGain);
    
    waveLFO.start(now);
    lfoNode = waveLFO;
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
