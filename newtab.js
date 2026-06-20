/* Aura Tab - Core Dashboard & Preferences Engine */

// Default Configurations
const DEFAULT_CONFIG = {
  // Widget Toggles
  showClock: true,
  showGreeting: true,
  showSearch: true,
  showWeather: true,
  showMostVisited: true,
  showQuickLinks: true,
  showZenButton: true,
  
  // Theme Properties
  glassBlur: 15,
  glassOpacity: 15,
  borderOpacity: 12,
  cornerRadius: 16,
  accentColor: "#3b82f6",
  fontFamily: "Inter",
  clockFont: "system",
  greetingFont: "system",
  sidebarFont: "system",
  clockSeconds: true,
  clock24h: false,
  username: "Commander",
  
  // Background configuration
  bgType: "preset", // solid, preset, custom
  solidColor: "#0f172a",
  backgroundImage: "https://images.pexels.com/photos/9400362/pexels-photo-9400362.jpeg",
  darkenOverlay: 0.3,
  
  // Shortcuts data
  quickLinks: [
    { name: "Google", url: "https://google.com", icon: "🌐" },
    { name: "YouTube", url: "https://youtube.com", icon: "📺" },
    { name: "GitHub", url: "https://github.com", icon: "🐙" },
    { name: "Gmail", url: "https://mail.google.com", icon: "✉️" },
    { name: "Brave", url: "https://search.brave.com", icon: "🦁" }
  ],
  
  // Search Bar
  searchEngine: "google",
  enableSearchHistory: true,
  
  // Custom Pomodoro Durations (minutes)
  pomodoroDurations: {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
  },
    
  // New Widgets & Customization Toggles
  showTodo: true,
  showQuote: true,
  borderWidth: 1.5,
  bgBlur: 0,
  glassTint: "#0f172a",
  todoList: [],
  activeWidgets: []
};

// --- IndexedDB Local Storage for High-Quality Photos/Videos ---
const DB_NAME = "AuraTabDB";
const STORE_NAME = "wallpaperStore";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveWallpaperFile(file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(file, "customWallpaper");
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getWallpaperFile() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get("customWallpaper");
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function clearWallpaperFile() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete("customWallpaper");
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

let cachedWallpaperObjectUrl = null;

function isVideoFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith("video/")) {
    return true;
  }
  const name = (file.name || "").toLowerCase();
  return name.endsWith(".mp4") || 
         name.endsWith(".mov") || 
         name.endsWith(".webm") || 
         name.endsWith(".ogg") || 
         name.endsWith(".m4v") || 
         name.endsWith(".mkv");
}

async function loadCustomWallpaper() {
  try {
    const file = await getWallpaperFile();
    if (file) {
      if (cachedWallpaperObjectUrl) {
        URL.revokeObjectURL(cachedWallpaperObjectUrl);
      }
      cachedWallpaperObjectUrl = URL.createObjectURL(file);
      settings.customWallpaperType = isVideoFile(file) ? (file.type || "video/mp4") : (file.type || "image/jpeg");
    } else {
      cachedWallpaperObjectUrl = null;
    }
  } catch (e) {
    console.error("Failed to load custom wallpaper from IndexedDB:", e);
    cachedWallpaperObjectUrl = null;
  }
}

// Preset wallpapers
const WALLPAPER_PRESETS = [
  { name: "Cyberpunk", url: "https://images.pexels.com/photos/9400362/pexels-photo-9400362.jpeg", darkness: 0.3 },
  { name: "Starry Night", url: "https://images.unsplash.com/photo-1597326445154-fcac6ca0ac26?q=80&w=1200&auto=format&fit=crop", darkness: 0.3 },
  { name: "Mountain Mist", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200&auto=format&fit=crop", darkness: 0.25 },
  { name: "Minimalist Sand", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop", darkness: 0.2 }
];

// Preset animated GIFs
const GIF_PRESETS = [
  { name: "Relaxing Pixel Cafe", url: "https://i.gifer.com/Cal.gif", darkness: 0.4 },
  { name: "Cyber City Rain", url: "https://i.gifer.com/2MdY.gif", darkness: 0.2 },
  { name: "Cozy Study Room", url: "https://i.gifer.com/7Kbp.gif", darkness: 0.25 },
  { name: "Lofi Pixel Skyline", url: "https://i.gifer.com/fyrS.gif", darkness: 0.2 },
  { name: "Neon Train Window", url: "https://i.gifer.com/Gd1.gif", darkness: 0.2 }
];

// Popular apps for quick-add in the Quick Links panel
const POPULAR_APPS = [
  { name: "YouTube", url: "https://youtube.com" },
  { name: "Gmail", url: "https://mail.google.com" },
  { name: "WhatsApp", url: "https://web.whatsapp.com" },
  { name: "Instagram", url: "https://instagram.com" },
  { name: "Facebook", url: "https://facebook.com" },
  { name: "X", url: "https://x.com" },
  { name: "Threads", url: "https://threads.net" },
  { name: "LinkedIn", url: "https://linkedin.com" },
  { name: "TikTok", url: "https://tiktok.com" },
  { name: "Discord", url: "https://discord.com" },
  { name: "Reddit", url: "https://reddit.com" },
  { name: "GitHub", url: "https://github.com" },
  { name: "Spotify", url: "https://open.spotify.com" },
  { name: "Pinterest", url: "https://pinterest.com" },
  { name: "Twitch", url: "https://twitch.tv" },
  { name: "Netflix", url: "https://netflix.com" },
  { name: "Amazon", url: "https://amazon.com" },
  { name: "Notion", url: "https://notion.so" }
];

// Fallback search sites list
const DEFAULT_TOP_SITES = [
  { title: "Google", url: "https://google.com" },
  { title: "YouTube", url: "https://youtube.com" },
  { title: "GitHub", url: "https://github.com" },
  { title: "Gmail", url: "https://mail.google.com" },
  { title: "Wikipedia", url: "https://wikipedia.org" },
  { title: "Reddit", url: "https://reddit.com" },
  { title: "Brave", url: "https://search.brave.com" },
  { title: "Translate", url: "https://translate.google.com" }
];

// Search Engines and AI prompts URLs
const SEARCH_ENGINES_CONFIG = {
  google: { name: "Google", url: "https://www.google.com/search?q=", icon: "🌐", type: "search" },
  brave: { name: "Brave", url: "https://search.brave.com/search?q=", icon: "🦁", type: "search" },
  duckduckgo: { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", icon: "🦆", type: "search" },
  bing: { name: "Bing", url: "https://www.bing.com/search?q=", icon: "🔎", type: "search" },
  youtube: { name: "YouTube", url: "https://www.youtube.com/results?search_query=", icon: "📺", type: "search" },
  perplexity: { name: "Perplexity", url: "https://www.perplexity.ai/search?q=", icon: "🌀", type: "ai" },
  chatgpt: { name: "ChatGPT", url: "https://chatgpt.com/?q=", icon: "🤖", type: "ai" },
  claude: { name: "Claude", url: "https://claude.ai/new?q=", icon: "☁️", type: "ai" },
  grok: { name: "Grok", url: "https://grok.com/?q=", icon: "🚀", type: "ai" }
};

// Current extension state variables
let settings = { ...DEFAULT_CONFIG };
let recentSearches = [];
let dragCoordinates = {};
let widgetScales = {};
let currentTimerInterval = null;
let currentZenAmbientSound = "rain";
let isZenSoundPlaying = false;

// Storage Helper supporting chrome storage sync/local with localStorage fallbacks
const Storage = {
  isExtension: typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync,
  
  getSync: function(keys, callback) {
    if (this.isExtension) {
      chrome.storage.sync.get(keys, callback);
    } else {
      const res = {};
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(k => {
        const val = localStorage.getItem("sync_" + k);
        res[k] = val ? JSON.parse(val) : undefined;
      });
      callback(res);
    }
  },
  
  setSync: function(data, callback) {
    if (this.isExtension) {
      chrome.storage.sync.set(data, callback);
    } else {
      Object.keys(data).forEach(k => {
        localStorage.setItem("sync_" + k, JSON.stringify(data[k]));
      });
      if (callback) callback();
    }
  },
  
  getLocal: function(keys, callback) {
    if (this.isExtension) {
      chrome.storage.local.get(keys, callback);
    } else {
      const res = {};
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(k => {
        const val = localStorage.getItem("local_" + k);
        res[k] = val ? JSON.parse(val) : undefined;
      });
      callback(res);
    }
  },
  
  setLocal: function(data, callback) {
    if (this.isExtension) {
      chrome.storage.local.set(data, callback);
    } else {
      Object.keys(data).forEach(k => {
        localStorage.setItem("local_" + k, JSON.stringify(data[k]));
      });
      if (callback) callback();
    }
  },
  
  getAllLocal: function(callback) {
    if (this.isExtension) {
      chrome.storage.local.get(null, callback);
    } else {
      const res = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("local_")) {
          const actualKey = key.substring(6);
          const val = localStorage.getItem(key);
          try {
            res[actualKey] = JSON.parse(val);
          } catch(e) {
            res[actualKey] = val;
          }
        }
      }
      callback(res);
    }
  },
  
  removeLocal: function(key, callback) {
    if (this.isExtension) {
      chrome.storage.local.remove(key, callback);
    } else {
      localStorage.removeItem("local_" + key);
      if (callback) callback();
    }
  },
  
  clearAll: function(callback) {
    if (this.isExtension) {
      chrome.storage.sync.clear(() => {
        chrome.storage.local.clear(() => {
          if (callback) callback();
        });
      });
    } else {
      localStorage.clear();
      if (callback) callback();
    }
  }
};

// Safe wrapper for chrome.runtime.sendMessage to prevent crashes in non-extension previews
function safeSendMessage(message, callback) {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
    try {
      chrome.runtime.sendMessage(message, (res) => {
        if (chrome.runtime.lastError) {
          console.warn("safeSendMessage error:", chrome.runtime.lastError.message);
          if (callback) callback(null);
        } else {
          if (callback) callback(res);
        }
      });
    } catch (e) {
      console.warn("Failed to send extension message:", e);
      if (callback) callback(null);
    }
  } else {
    console.log("No extension context: Mock sending message:", message);
    if (callback) callback(null);
  }
}

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
  loadConfiguration();
  setupUIEventListeners();
  initClockLoop();
  initWeatherLoop();
  initShortcutContextListeners();
});

// Load Settings from Sync/Local Storage
function loadConfiguration() {
  Storage.getSync(["settings", "recentSearches"], (syncResult) => {
    if (syncResult.settings) {
      settings = { ...DEFAULT_CONFIG, ...syncResult.settings };
    } else {
      settings = { ...DEFAULT_CONFIG };
      Storage.setSync({ settings });
    }
    
    recentSearches = syncResult.recentSearches || [];
    
    // Load local storage items (coordinates, scales and base64 wallpapers)
    Storage.getLocal(["dragCoordinates", "widgetScales", "customWallpaper", "clipboardItems", "autoCapture"], (localResult) => {
      dragCoordinates = localResult.dragCoordinates || {};
      widgetScales = localResult.widgetScales || {};
      
      if (localResult.customWallpaper) {
        settings.customWallpaper = localResult.customWallpaper;
      }
      
      // Auto-capture checkbox state
      const capCheck = document.getElementById("toggle-clipboard-capture");
      if (capCheck) capCheck.checked = !!localResult.autoCapture;
      
      // Load custom wallpaper from IndexedDB before applying styles
      loadCustomWallpaper().finally(() => {
        applyDesignSystemStyles();
        populateSettingsInputs();
        renderSidebarDock();
        renderRecentSearches();
        renderTodoList();
        initTodoWidgetEvents();
        initQuoteWidget();
        renderActiveWidgets();
        
        // Load quick tools subpanes
        initNotesPane();
        initTabsPane();
        initExtensionsPane();
        initClipboardPane();
        initFocusTimerSync();
        initMostVisited();
      });
    });
  });
}

/* ==========================================================================
   1. Theme Aesthetics & Real-time CSS Variable updates
   ========================================================================== */
function applyDesignSystemStyles() {
  const root = document.documentElement;
  
  // Glass tokens
  root.style.setProperty("--bg-filter-blur", `${settings.glassBlur}px`);
  root.style.setProperty("--bg-opacity", settings.glassOpacity / 100);
  root.style.setProperty("--border-opacity", settings.borderOpacity / 100);
  root.style.setProperty("--border-radius", `${settings.cornerRadius}px`);
  root.style.setProperty("--accent-color", settings.accentColor);
  
  const rgb = hexToRgb(settings.accentColor);
  root.style.setProperty("--accent-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);

  // Custom Glass Tint Color
  const glassTintRgb = hexToRgb(settings.glassTint || "#0f172a");
  root.style.setProperty("--bg-color", `${glassTintRgb.r}, ${glassTintRgb.g}, ${glassTintRgb.b}`);

  // Custom Border Width & Background Blur
  root.style.setProperty("--border-width", `${settings.borderWidth || 1.5}px`);
  root.style.setProperty("--bg-blur", `${settings.bgBlur || 0}px`);
  
  // Set fonts
  root.style.setProperty("--font-family", `'${settings.fontFamily}', -apple-system, system-ui, sans-serif`);
  
  const clockFontVal = settings.clockFont && settings.clockFont !== "system" ? settings.clockFont : settings.fontFamily;
  const greetingFontVal = settings.greetingFont && settings.greetingFont !== "system" ? settings.greetingFont : settings.fontFamily;
  const sidebarFontVal = settings.sidebarFont && settings.sidebarFont !== "system" ? settings.sidebarFont : settings.fontFamily;
  
  root.style.setProperty("--clock-font", `'${clockFontVal}', -apple-system, system-ui, sans-serif`);
  root.style.setProperty("--greeting-font", `'${greetingFontVal}', -apple-system, system-ui, sans-serif`);
  root.style.setProperty("--sidebar-font", `'${sidebarFontVal}', -apple-system, system-ui, sans-serif`);
  
  // Clock font customization
  const clockContainer = document.getElementById("flip-clock-container");
  const stdClock = document.getElementById("standard-clock-display");
  
  if (clockFontVal === "Silkscreen" || clockFontVal === "Orbitron" || clockFontVal === "Gloria Hallelujah") {
    // Hide slide flip clock for decorative pixel/tech/handwriting fonts, display standard font-styled clock
    clockContainer.style.display = "none";
    stdClock.style.display = "block";
    stdClock.style.fontFamily = `'${clockFontVal}', monospace`;
    if (clockFontVal === "Silkscreen") {
      stdClock.style.fontSize = "3.2rem";
      stdClock.style.letterSpacing = "0.05em";
    } else if (clockFontVal === "Orbitron") {
      stdClock.style.fontSize = "4.2rem";
      stdClock.style.letterSpacing = "0.08em";
    } else {
      stdClock.style.fontSize = "3.8rem";
      stdClock.style.letterSpacing = "0px";
    }
  } else {
    // Show premium slide flipping clock
    clockContainer.style.display = "flex";
    stdClock.style.display = "none";
  }

  // Set Background Image/Solid/Video
  const bg = document.getElementById("wallpaper-bg");
  const videoBg = document.getElementById("wallpaper-video");
  root.style.setProperty("--bg-darkness", settings.darkenOverlay);
  
  // Hide video by default
  if (videoBg) {
    videoBg.style.display = "none";
  }
  if (bg) {
    bg.style.display = "block";
  }
  
  if (settings.bgType === "solid") {
    if (settings.solidColor.startsWith("linear-gradient") || settings.solidColor.startsWith("radial-gradient")) {
      bg.style.backgroundImage = settings.solidColor;
      bg.style.backgroundColor = "transparent";
    } else {
      bg.style.backgroundImage = "none";
      bg.style.backgroundColor = settings.solidColor;
    }
  } else if (settings.bgType === "preset") {
    bg.style.backgroundColor = "transparent";
    bg.style.backgroundImage = `url('${settings.backgroundImage}')`;
  } else if (settings.bgType === "custom") {
    bg.style.backgroundColor = "transparent";
    if (cachedWallpaperObjectUrl) {
      const isVideo = settings.customWallpaperType && settings.customWallpaperType.startsWith("video/");
      if (isVideo && videoBg) {
        bg.style.display = "none";
        videoBg.style.display = "block";
        
        videoBg.muted = true;
        videoBg.loop = true;
        videoBg.playsInline = true;

        videoBg.onerror = (e) => {
          console.warn("Custom video wallpaper failed to load or decode:", e);
          const type = settings.customWallpaperType || "";
          if (type.includes("quicktime") || type.includes("mov") || type.includes("mp4")) {
            console.log("Tip: If the video screen remains blank, it may use an unsupported codec (like H.265/HEVC or Apple ProRes). Try converting it to H.264 encoded MP4.");
          }
        };

        if (videoBg.src !== cachedWallpaperObjectUrl) {
          videoBg.src = cachedWallpaperObjectUrl;
          videoBg.load();
        }

        const playPromise = videoBg.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Video autoplay prevented, adding click listener to play:", error);
            const playOnInteraction = () => {
              videoBg.play().then(() => {
                document.removeEventListener("click", playOnInteraction);
              }).catch(e => console.log("Play retry failed:", e));
            };
            document.addEventListener("click", playOnInteraction);
          });
        }
      } else {
        bg.style.backgroundImage = `url('${cachedWallpaperObjectUrl}')`;
      }
    } else if (settings.customWallpaper) {
      // Fallback for base64
      const isBase64Video = settings.customWallpaper.startsWith("data:video/");
      if (isBase64Video && videoBg) {
        bg.style.display = "none";
        videoBg.style.display = "block";

        videoBg.muted = true;
        videoBg.loop = true;
        videoBg.playsInline = true;

        if (videoBg.src !== settings.customWallpaper) {
          videoBg.src = settings.customWallpaper;
          videoBg.load();
        }

        const playPromise = videoBg.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Video autoplay prevented, adding click listener to play:", error);
            const playOnInteraction = () => {
              videoBg.play().then(() => {
                document.removeEventListener("click", playOnInteraction);
              }).catch(e => console.log("Play retry failed:", e));
            };
            document.addEventListener("click", playOnInteraction);
          });
        }
      } else {
        bg.style.backgroundImage = `url('${settings.customWallpaper}')`;
      }
    } else {
      bg.style.backgroundImage = `url('${settings.backgroundImage}')`;
    }
  }

  // Set Widget Visibility Toggles
  toggleWidgetElement("draggable-time", settings.showClock);
  toggleWidgetElement("draggable-greeting", settings.showGreeting);
  toggleWidgetElement("draggable-searchBar", settings.showSearch);
  toggleWidgetElement("draggable-weather", settings.showWeather);
  toggleWidgetElement("draggable-mostVisited", settings.showMostVisited);
  toggleWidgetElement("left-sidebar-dock", settings.showQuickLinks);
  toggleWidgetElement("draggable-zenMode", settings.showZenButton);
  toggleWidgetElement("draggable-todo", settings.showTodo);
  toggleWidgetElement("draggable-quote", settings.showQuote);
  
  // Set search engine active indicator icon
  const activeEngine = SEARCH_ENGINES_CONFIG[settings.searchEngine] || SEARCH_ENGINES_CONFIG.google;
  document.getElementById("active-engine-icon").innerText = activeEngine.icon;
  
  // Toggle AI prompt search styles
  toggleSearchEngineInputs(activeEngine);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 59, g: 130, b: 246 };
}

function toggleWidgetElement(id, isVisible) {
  const elem = document.getElementById(id);
  if (elem) {
    if (id === "left-sidebar-dock") {
      elem.style.display = isVisible ? "flex" : "none";
    } else {
      elem.style.display = isVisible ? "block" : "none";
    }
  }
}

// Populate drawer controls
function populateSettingsInputs() {
  // Checkboxes
  document.getElementById("toggle-clock").checked = settings.showClock;
  document.getElementById("toggle-greeting").checked = settings.showGreeting;
  document.getElementById("toggle-search").checked = settings.showSearch;
  document.getElementById("toggle-weather").checked = settings.showWeather;
  document.getElementById("toggle-most-visited").checked = settings.showMostVisited;
  document.getElementById("toggle-quick-links").checked = settings.showQuickLinks;
  document.getElementById("toggle-zen-button").checked = settings.showZenButton;
  document.getElementById("toggle-todo").checked = settings.showTodo;
  document.getElementById("toggle-quote").checked = settings.showQuote;
  
  document.getElementById("toggle-seconds").checked = settings.clockSeconds;
  document.getElementById("toggle-24h").checked = settings.clock24h;
  
  document.getElementById("input-username").value = settings.username;
  document.getElementById("select-font-family").value = settings.fontFamily;
  document.getElementById("select-clock-font").value = settings.clockFont || "system";
  document.getElementById("select-greeting-font").value = settings.greetingFont || "system";
  document.getElementById("select-sidebar-font").value = settings.sidebarFont || "system";
  
  // Sliders
  document.getElementById("input-blur").value = settings.glassBlur;
  document.getElementById("val-blur").innerText = settings.glassBlur;
  
  document.getElementById("input-opacity").value = settings.glassOpacity;
  document.getElementById("val-opacity").innerText = settings.glassOpacity;
  
  document.getElementById("input-border-opacity").value = settings.borderOpacity;
  document.getElementById("val-border-opacity").innerText = settings.borderOpacity;
  
  document.getElementById("input-radius").value = settings.cornerRadius;
  document.getElementById("val-radius").innerText = settings.cornerRadius;

  document.getElementById("input-border-width").value = settings.borderWidth || 1.5;
  document.getElementById("val-border-width").innerText = settings.borderWidth || 1.5;

  document.getElementById("input-glass-tint").value = settings.glassTint || "#0f172a";
  
  document.getElementById("input-bg-darkness").value = settings.darkenOverlay * 100;
  document.getElementById("val-bg-darkness").innerText = Math.round(settings.darkenOverlay * 100);

  document.getElementById("input-bg-blur").value = settings.bgBlur || 0;
  document.getElementById("val-bg-blur").innerText = settings.bgBlur || 0;
  
  // Solid color Hex
  document.getElementById("input-solid-bg").value = settings.solidColor;
  
  // Image URL input
  if (settings.bgType === "custom" && settings.customWallpaper && !settings.customWallpaper.startsWith("data:")) {
    document.getElementById("input-image-url").value = settings.customWallpaper;
  } else {
    document.getElementById("input-image-url").value = "";
  }
  
  // Background radios
  const radios = document.getElementsByName("bg-type");
  radios.forEach(r => {
    if (r.value === settings.bgType) r.checked = true;
  });
  
  // Accent Color
  document.getElementById("input-accent-color").value = settings.accentColor || "#3b82f6";
  
  // Toggle sub-background sections
  toggleBackgroundSubSections(settings.bgType);
  
  // Pomodoro config values
  const pDur = settings.pomodoroDurations || { pomodoro: 25, shortBreak: 5, longBreak: 15 };
  document.getElementById("cfg-time-work").value = pDur.pomodoro;
  document.getElementById("cfg-time-short").value = pDur.shortBreak;
  document.getElementById("cfg-time-long").value = pDur.longBreak;
}

function toggleBackgroundSubSections(bgType) {
  document.getElementById("bg-section-solid").style.display = bgType === "solid" ? "block" : "none";
  document.getElementById("bg-section-preset").style.display = bgType === "preset" ? "block" : "none";
  document.getElementById("bg-section-custom").style.display = bgType === "custom" ? "block" : "none";
}

function updateGreetingText() {
  const greetingDisplay = document.getElementById("greeting-display");
  if (!greetingDisplay) return;
  
  const now = new Date();
  const hrs = now.getHours();
  let greeting = "GOOD EVENING";
  if (hrs >= 5 && hrs < 12) {
    greeting = "GOOD MORNING";
  } else if (hrs >= 12 && hrs < 17) {
    greeting = "GOOD AFTERNOON";
  } else if (hrs >= 17 && hrs < 22) {
    greeting = "GOOD EVENING";
  } else {
    greeting = "GOOD NIGHT";
  }
  
  const name = settings.username || "";
  if (name.trim()) {
    greetingDisplay.innerText = `${greeting}, ${name.toUpperCase()}`;
  } else {
    greetingDisplay.innerText = greeting;
  }
}

/* ==========================================================================
   2. Flipping / Slide-Up Digital Clock Loop
   ========================================================================== */
let prevTimeStr = "";
function initClockLoop() {
  updateClockDisplay();
  setInterval(updateClockDisplay, 1000);
}

function updateClockDisplay() {
  const now = new Date();
  let hrs = now.getHours();
  const mins = now.getMinutes();
  const secs = now.getSeconds();
  
  // Handle AM/PM
  let ampm = "";
  if (!settings.clock24h) {
    ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12 || 12;
  }
  
  const pad = (v) => v.toString().padStart(2, "0");
  
  const hrStr = pad(hrs);
  const minStr = pad(mins);
  const secStr = pad(secs);
  
  // Standard Clock Text Display (Simple display)
  const stdDisplay = document.getElementById("standard-clock-display");
  if (stdDisplay.style.display !== "none") {
    stdDisplay.innerText = `${hrStr}:${minStr}${settings.clockSeconds ? ":" + secStr : ""} ${ampm}`;
  }
  
  // Build slide flipping clock display
  const timeStr = `${hrStr}${minStr}${settings.clockSeconds ? secStr : ""}`;
  const timeStrLength = timeStr.length;
  
  const container = document.getElementById("flip-clock-container");
  
  // Initialize digit wrap elements if count changes or doesn't match
  const digitWraps = container.querySelectorAll(".digit-card-wrap");
  
  // Build structural HTML for cards if needed
  if (digitWraps.length !== timeStrLength) {
    container.innerHTML = "";
    for (let i = 0; i < timeStrLength; i++) {
      // Add colon dividers
      if (i === 2 || i === 4) {
        const colon = document.createElement("div");
        colon.className = "clock-colon";
        colon.innerText = ":";
        container.appendChild(colon);
      }
      
      const wrap = document.createElement("div");
      wrap.className = "digit-card-wrap";
      wrap.innerHTML = `
        <div class="digit-card-divider"></div>
        <div class="digit-card-val primary-val">${timeStr[i]}</div>
      `;
      container.appendChild(wrap);
    }
    
    // Add AM/PM symbol
    if (!settings.clock24h) {
      const ampmElem = document.createElement("div");
      ampmElem.className = "clock-ampm";
      ampmElem.id = "clock-ampm-symbol";
      ampmElem.innerText = ampm;
      container.appendChild(ampmElem);
    }
    prevTimeStr = timeStr;
    return;
  }
  
  // Handle AM/PM text changes
  const ampmElem = document.getElementById("clock-ampm-symbol");
  if (ampmElem && ampmElem.innerText !== ampm) {
    ampmElem.innerText = ampm;
  }
  
  // Update sliding numbers digit-by-digit
  for (let i = 0; i < timeStrLength; i++) {
    const wrap = digitWraps[i];
    if (timeStr[i] !== prevTimeStr[i]) {
      const currentVal = timeStr[i];
      const prevVal = prevTimeStr[i];
      
      // Trigger slide transitions
      wrap.innerHTML = `
        <div class="digit-card-divider"></div>
        <div class="digit-card-val slide-up">${prevVal}</div>
        <div class="digit-card-val slide-in">${currentVal}</div>
      `;
      
      // Cleanup extra nodes after animation ends (600ms)
      setTimeout(() => {
        wrap.innerHTML = `
          <div class="digit-card-divider"></div>
          <div class="digit-card-val primary-val">${currentVal}</div>
        `;
      }, 600);
    }
  }
  
  prevTimeStr = timeStr;
  
  // Render Date badge
  const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById("date-display").innerText = now.toLocaleDateString("en-US", dateOptions);

  // Update dynamic greeting text
  updateGreetingText();
}

/* ==========================================================================
   3. AI-Ready Search Bar Engine
   ========================================================================== */
function toggleSearchEngineInputs(engineConfig) {
  const queryInput = document.getElementById("search-query-input");
  const promptTextarea = document.getElementById("search-prompt-textarea");
  const searchBox = document.getElementById("search-input-box");
  
  if (engineConfig.type === "ai") {
    queryInput.style.display = "none";
    promptTextarea.style.display = "block";
    promptTextarea.placeholder = `Prompt ${engineConfig.name}...`;
    searchBox.classList.add("ai-expanded");
  } else {
    queryInput.style.display = "block";
    promptTextarea.style.display = "none";
    queryInput.placeholder = `Search with ${engineConfig.name}...`;
    searchBox.classList.remove("ai-expanded");
  }
}

// Redirect and submit searches
function executeSearchSubmit() {
  const engineConfig = SEARCH_ENGINES_CONFIG[settings.searchEngine] || SEARCH_ENGINES_CONFIG.google;
  const isAI = engineConfig.type === "ai";
  const queryValue = isAI 
    ? document.getElementById("search-prompt-textarea").value.trim()
    : document.getElementById("search-query-input").value.trim();
    
  if (!queryValue) {
    if (isAI) {
      window.open(engineConfig.url.split("?")[0], "_self"); // redirect directly to engine page
    }
    return;
  }
  
  // Save to search history if enabled
  if (settings.enableSearchHistory) {
    saveSearchHistory(queryValue);
  }
  
  // Redirect browser tab
  const searchUrl = engineConfig.url + encodeURIComponent(queryValue);
  window.open(searchUrl, "_self");
}

function saveSearchHistory(query) {
  // Limit to 5 items, avoid duplicates
  recentSearches = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
  Storage.setSync({ recentSearches }, () => {
    renderRecentSearches();
  });
}

function renderRecentSearches() {
  const list = document.getElementById("history-items-list");
  const popover = document.getElementById("search-history-popover");
  
  if (!settings.enableSearchHistory || recentSearches.length === 0) {
    popover.style.display = "none";
    return;
  }
  
  list.innerHTML = "";
  recentSearches.forEach(query => {
    const item = document.createElement("div");
    item.className = "history-item";
    
    const text = document.createElement("span");
    text.className = "history-text";
    text.innerText = query;
    text.addEventListener("click", () => {
      // Set value and search
      const activeEngine = SEARCH_ENGINES_CONFIG[settings.searchEngine];
      if (activeEngine.type === "ai") {
        document.getElementById("search-prompt-textarea").value = query;
      } else {
        document.getElementById("search-query-input").value = query;
      }
      executeSearchSubmit();
    });
    
    const delBtn = document.createElement("button");
    delBtn.className = "history-delete-btn";
    delBtn.innerHTML = "&times;";
    delBtn.title = "Remove query";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteHistoryItem(query);
    });
    
    item.appendChild(text);
    item.appendChild(delBtn);
    list.appendChild(item);
  });
}

function deleteHistoryItem(query) {
  recentSearches = recentSearches.filter(q => q !== query);
  Storage.setSync({ recentSearches }, () => {
    renderRecentSearches();
  });
}

/* ==========================================================================
   3b. Dynamic Widgets Engine & Preset Tools
   ========================================================================== */
const calcStates = {};

function renderActiveWidgets() {
  const container = document.getElementById("dynamic-widgets-container");
  if (!container) return;
  
  container.innerHTML = "";
  const widgets = settings.activeWidgets || [];
  
  widgets.forEach(widget => {
    const widgetEl = document.createElement("div");
    widgetEl.className = "draggable-widget glass-panel";
    widgetEl.setAttribute("data-widget", widget.id);
    
    if (widget.type === "spotify" || widget.type === "youtube" || widget.type === "iframe") {
      widgetEl.classList.add("dynamic-iframe-widget");
      widgetEl.innerHTML = `
        <div class="widget-title-bar">
          <span class="widget-title-text">${widget.name}</span>
          <button class="active-widget-remove-btn" data-remove-id="${widget.id}" title="Remove Widget">&times;</button>
        </div>
        <div class="iframe-wrapper-inner">
          <div class="iframe-click-shield"></div>
          <iframe src="${widget.src}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>
      `;
    } else if (widget.type === "calculator") {
      widgetEl.classList.add("calculator-widget");
      widgetEl.innerHTML = `
        <div class="widget-title-bar" style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="widget-title-text" style="font-size: 11px; font-weight: 600; opacity: 0.8;">Calculator</span>
          <button class="active-widget-remove-btn" data-remove-id="${widget.id}" title="Remove Widget" style="font-size: 16px; line-height: 1;">&times;</button>
        </div>
        <div class="calc-display" id="calc-display-${widget.id}">0</div>
        <div class="calc-buttons-grid">
          <button class="calc-btn op-btn" data-val="C">C</button>
          <button class="calc-btn op-btn" data-val="()">( )</button>
          <button class="calc-btn op-btn" data-val="%">%</button>
          <button class="calc-btn op-btn" data-val="/">/</button>
          
          <button class="calc-btn" data-val="7">7</button>
          <button class="calc-btn" data-val="8">8</button>
          <button class="calc-btn" data-val="9">9</button>
          <button class="calc-btn op-btn" data-val="*">&times;</button>
          
          <button class="calc-btn" data-val="4">4</button>
          <button class="calc-btn" data-val="5">5</button>
          <button class="calc-btn" data-val="6">6</button>
          <button class="calc-btn op-btn" data-val="-">&minus;</button>
          
          <button class="calc-btn" data-val="1">1</button>
          <button class="calc-btn" data-val="2">2</button>
          <button class="calc-btn" data-val="3">3</button>
          <button class="calc-btn op-btn" data-val="+">+</button>
          
          <button class="calc-btn" data-val="0">0</button>
          <button class="calc-btn" data-val=".">.</button>
          <button class="calc-btn op-btn" data-val="back">⌫</button>
          <button class="calc-btn eq-btn" data-val="=">=</button>
        </div>
      `;
    } else if (widget.type === "soundboard") {
      widgetEl.classList.add("soundboard-widget");
      widgetEl.innerHTML = `
        <div class="widget-title-bar" style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="widget-title-text" style="font-size: 11px; font-weight: 600; opacity: 0.8;">Gentle Soundboard</span>
          <button class="active-widget-remove-btn" data-remove-id="${widget.id}" title="Remove Widget" style="font-size: 16px; line-height: 1;">&times;</button>
        </div>
        <div class="soundboard-grid">
          <button class="soundboard-btn" data-sound="campfire">
            <span class="soundboard-btn-icon">🔥</span>
            <span>Campfire</span>
          </button>
          <button class="soundboard-btn" data-sound="birds">
            <span class="soundboard-btn-icon">🐦</span>
            <span>Birds Chirping</span>
          </button>
          <button class="soundboard-btn" data-sound="thunder">
            <span class="soundboard-btn-icon">⚡</span>
            <span>Thunder rumble</span>
          </button>
          <button class="soundboard-btn" data-sound="chimes">
            <span class="soundboard-btn-icon">🎐</span>
            <span>Wind Chimes</span>
          </button>
        </div>
      `;
    }
    
    container.appendChild(widgetEl);
    
    // Wire up widget-specific scripts
    if (widget.type === "calculator") {
      initCalculatorWidget(widget.id, widgetEl);
    } else if (widget.type === "soundboard") {
      initSoundboardWidget(widget.id, widgetEl);
    }
  });
  
  // Wire up remove button click handlers on the spawned widgets
  container.querySelectorAll(".active-widget-remove-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-remove-id");
      removeWidget(id);
    });
  });
  
  // Update the Active Widgets list in settings drawer
  renderActiveWidgetsSettingsList();
  
  // Initialize draggability for all widgets (includes new ones)
  initWidgetsDraggability();
}

function renderActiveWidgetsSettingsList() {
  const listEl = document.getElementById("active-widgets-list");
  if (!listEl) return;
  
  listEl.innerHTML = "";
  const widgets = settings.activeWidgets || [];
  
  if (widgets.length === 0) {
    listEl.innerHTML = `<div style="font-size: 11px; opacity: 0.5; text-align: center; padding: 10px 0;">No active widgets</div>`;
    return;
  }
  
  widgets.forEach(widget => {
    const item = document.createElement("div");
    item.className = "active-widget-item";
    
    let icon = "🌐";
    if (widget.type === "spotify") icon = "🎵";
    else if (widget.type === "youtube") icon = "📺";
    else if (widget.type === "calculator") icon = "🧮";
    else if (widget.type === "soundboard") icon = "🔊";
    
    item.innerHTML = `
      <div class="active-widget-info">
        <span>${icon}</span>
        <span style="font-weight: 500; text-transform: capitalize;">${widget.name}</span>
      </div>
      <button class="active-widget-remove-btn" data-remove-id="${widget.id}">&times;</button>
    `;
    
    // Hook up delete
    item.querySelector(".active-widget-remove-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      removeWidget(widget.id);
    });
    
    listEl.appendChild(item);
  });
}

function removeWidget(id) {
  const widget = settings.activeWidgets.find(w => w.id === id);
  if (widget && widget.type === "soundboard") {
    safeSendMessage({ type: "STOP_AMBIENT_BG" });
  }
  
  settings.activeWidgets = settings.activeWidgets.filter(w => w.id !== id);
  
  if (dragCoordinates[id]) delete dragCoordinates[id];
  if (widgetScales[id]) delete widgetScales[id];
  
  Storage.setSync({ settings }, () => {
    Storage.setLocal({ dragCoordinates, widgetScales }, () => {
      renderActiveWidgets();
    });
  });
}

function spawnWidget(type, name, src) {
  const id = `widget-${type}-${Date.now()}`;
  
  const newWidget = {
    id,
    type,
    name: name || (type.charAt(0).toUpperCase() + type.slice(1)),
    src: src || ""
  };
  
  if (!settings.activeWidgets) settings.activeWidgets = [];
  settings.activeWidgets.push(newWidget);
  
  // Center coordinates roughly relative to screen/viewport
  dragCoordinates[id] = { x: 50 + (settings.activeWidgets.length * 20), y: 150 + (settings.activeWidgets.length * 20) };
  widgetScales[id] = 1.0;
  
  Storage.setSync({ settings }, () => {
    Storage.setLocal({ dragCoordinates, widgetScales }, () => {
      renderActiveWidgets();
    });
  });
}

function parseIframeSrc(input) {
  input = input.trim();
  if (input.startsWith("<iframe")) {
    const match = input.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  return input;
}

function initCalculatorWidget(id, widgetEl) {
  calcStates[id] = "0";
  const display = widgetEl.querySelector(`#calc-display-${id}`);
  if (!display) return;
  
  const buttons = widgetEl.querySelectorAll(".calc-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = btn.getAttribute("data-val");
      handleCalculatorInput(id, val, display);
    });
  });
}

function handleCalculatorInput(id, val, displayEl) {
  let state = calcStates[id];
  
  if (val === "C") {
    state = "0";
  } else if (val === "back") {
    if (state.length > 1) {
      state = state.slice(0, -1);
    } else {
      state = "0";
    }
  } else if (val === "=") {
    try {
      const sanitized = state.replace(/×/g, "*").replace(/−/g, "-");
      if (/^[0-9+\-*/%.() ]+$/.test(sanitized)) {
        const result = Function(`"use strict"; return (${sanitized})`)();
        state = String(result);
      } else {
        state = "Error";
      }
    } catch (e) {
      state = "Error";
    }
  } else if (val === "()") {
    const openCount = (state.match(/\(/g) || []).length;
    const closeCount = (state.match(/\)/g) || []).length;
    if (openCount > closeCount && /[0-9)]$/.test(state)) {
      state += ")";
    } else {
      if (state === "0") {
        state = "(";
      } else {
        state += "(";
      }
    }
  } else {
    if (state === "0" && !isNaN(val)) {
      state = val;
    } else {
      state += val;
    }
  }
  
  calcStates[id] = state;
  displayEl.innerText = state;
}

function initSoundboardWidget(id, widgetEl) {
  const buttons = widgetEl.querySelectorAll(".soundboard-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sound = btn.getAttribute("data-sound");
      toggleSoundboardSound(id, sound, btn, buttons);
    });
  });
}

function toggleSoundboardSound(widgetId, sound, btnEl, allButtons) {
  const isPlaying = btnEl.classList.contains("active");
  
  allButtons.forEach(btn => btn.classList.remove("active"));
  
  if (isPlaying) {
    safeSendMessage({ type: "STOP_AMBIENT_BG" });
  } else {
    btnEl.classList.add("active");
    safeSendMessage({ type: "PLAY_AMBIENT_BG", sound: sound, volume: 0.5 });
  }
}

/* ==========================================================================
   4. Draggable Layout Position Engine
   ========================================================================== */
function initWidgetsDraggability() {
  const widgets = document.querySelectorAll(".draggable-widget");
  
  widgets.forEach(widget => {
    const name = widget.getAttribute("data-widget");
    
    // Apply saved coordinates and scales if they exist
    updateWidgetTransform(widget, name);
    
    // Check if drag handle exists, if not inject it
    let handle = widget.querySelector(".drag-handle");
    if (!handle) {
      handle = document.createElement("div");
      handle.className = "drag-handle";
      handle.title = "Drag to reposition";
      widget.appendChild(handle);
      
      // Bind drag event listeners
      setupDragEvents(widget, handle, name);
    }

    // Check if resize controls exist, if not inject them
    let resizeWrap = widget.querySelector(".widget-resize-controls");
    if (!resizeWrap) {
      resizeWrap = document.createElement("div");
      resizeWrap.className = "widget-resize-controls";
      
      const btnMinus = document.createElement("button");
      btnMinus.className = "resize-btn minus";
      btnMinus.innerText = "−";
      btnMinus.title = "Decrease size";
      
      const btnPlus = document.createElement("button");
      btnPlus.className = "resize-btn plus";
      btnPlus.innerText = "+";
      btnPlus.title = "Increase size";
      
      resizeWrap.appendChild(btnMinus);
      resizeWrap.appendChild(btnPlus);
      widget.appendChild(resizeWrap);
      
      // Bind resize events
      setupResizeEvents(widget, btnPlus, btnMinus, name);
    }
  });
}

function updateWidgetTransform(widget, name) {
  const coords = dragCoordinates[name] || { x: 0, y: 0 };
  const scale = widgetScales[name] || 1.0;
  widget.style.transform = `translate(${coords.x}px, ${coords.y}px) scale(${scale})`;
}

function setupResizeEvents(widget, btnPlus, btnMinus, name) {
  btnPlus.addEventListener("click", (e) => {
    e.stopPropagation();
    let scale = widgetScales[name] || 1.0;
    scale = Math.min(2.0, scale + 0.1);
    widgetScales[name] = parseFloat(scale.toFixed(1));
    updateWidgetTransform(widget, name);
    Storage.setLocal({ widgetScales });
  });

  btnMinus.addEventListener("click", (e) => {
    e.stopPropagation();
    let scale = widgetScales[name] || 1.0;
    scale = Math.max(0.5, scale - 0.1);
    widgetScales[name] = parseFloat(scale.toFixed(1));
    updateWidgetTransform(widget, name);
    Storage.setLocal({ widgetScales });
  });
}

function setupDragEvents(widget, handle, name) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = dragCoordinates[name]?.x || 0;
  let currentY = dragCoordinates[name]?.y || 0;
  
  handle.addEventListener("mousedown", (e) => {
    if (!document.body.classList.contains("layout-edit-active")) return;
    
    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
  
  function onMouseMove(e) {
    if (!isDragging) return;
    
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    
    const scale = widgetScales[name] || 1.0;
    widget.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
  }
  
  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    
    // Save position
    dragCoordinates[name] = { x: currentX, y: currentY };
    Storage.setLocal({ dragCoordinates });
  }
}

function resetAllWidgetPositions() {
  dragCoordinates = {};
  widgetScales = {};
  Storage.setLocal({ dragCoordinates, widgetScales }, () => {
    initWidgetsDraggability();
    alert("Widget positions and sizes reset successfully.");
  });
}

/* ==========================================================================
   5. Weather Forecast Module
   ========================================================================== */
function initWeatherLoop() {
  fetchWeatherData();
  // Refresh weather every 15 minutes
  setInterval(fetchWeatherData, 15 * 60 * 1000);
}

function fetchWeatherData() {
  // Use Geolocation to fetch weather coordinates
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      // Open-Meteo current + daily forecast API
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          renderWeatherDashboard(data);
        })
        .catch(err => {
          console.error("Open-Meteo weather fetch error:", err);
          document.getElementById("weather-desc").innerText = "Weather unavailable";
        });
    },
    (error) => {
      console.warn("Geolocation denied or unavailable. Fallback weather for London.", error);
      // Fallback coordinates: London
      const url = `https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          renderWeatherDashboard(data, "London");
        })
        .catch(e => console.error("Fallback weather error:", e));
    }
  );
}

const WEATHER_CODES = {
  0: { desc: "Clear sky", symbol: "☀️" },
  1: { desc: "Mainly clear", symbol: "🌤️" },
  2: { desc: "Partly cloudy", symbol: "⛅" },
  3: { desc: "Overcast", symbol: "☁️" },
  45: { desc: "Foggy", symbol: "🌫️" },
  48: { desc: "Depositing rime fog", symbol: "🌫️" },
  51: { desc: "Light drizzle", symbol: "🌧️" },
  53: { desc: "Moderate drizzle", symbol: "🌧️" },
  55: { desc: "Dense drizzle", symbol: "🌧️" },
  61: { desc: "Slight rain", symbol: "🌧️" },
  63: { desc: "Moderate rain", symbol: "🌧️" },
  65: { desc: "Heavy rain", symbol: "🌧️" },
  71: { desc: "Light snow", symbol: "🌨️" },
  73: { desc: "Moderate snow", symbol: "🌨️" },
  75: { desc: "Heavy snow", symbol: "🌨️" },
  95: { desc: "Thunderstorm", symbol: "⛈️" }
};

function renderWeatherDashboard(data, locationName = null) {
  const current = data.current_weather;
  const weatherCode = current.weathercode;
  const info = WEATHER_CODES[weatherCode] || { desc: "Overcast", symbol: "☁️" };
  
  // Update main card
  document.getElementById("weather-temp").innerText = `${Math.round(current.temperature)}°C`;
  document.getElementById("weather-icon-sym").innerText = info.symbol;
  document.getElementById("weather-desc").innerText = info.desc;
  
  if (locationName) {
    document.getElementById("weather-loc").innerText = locationName;
    document.getElementById("forecast-city").innerText = locationName;
  } else {
    document.getElementById("weather-loc").innerText = "Current Location";
    document.getElementById("forecast-city").innerText = "Local Weather";
  }
  
  // Populate detail card stats
  document.getElementById("forecast-humidity").innerText = `Wind Dir: ${current.winddirection}°`;
  document.getElementById("forecast-wind").innerText = `${current.windspeed} km/h`;
  document.getElementById("forecast-uv").innerText = "Normal";
  document.getElementById("forecast-rain").innerText = data.daily?.weathercode ? "Rain code: " + data.daily.weathercode[0] : "0.0";
  
  // Render 3 Day Forecast inside detail card
  const daily = data.daily;
  const daysBox = document.getElementById("forecast-days");
  daysBox.innerHTML = "";
  
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  
  for (let i = 0; i < 3; i++) {
    const fDate = new Date();
    fDate.setDate(today.getDate() + i);
    const dayName = i === 0 ? "Today" : weekdays[fDate.getDay()];
    
    const maxT = Math.round(daily.temperature_2m_max[i]);
    const minT = Math.round(daily.temperature_2m_min[i]);
    const dCode = daily.weathercode[i];
    const dInfo = WEATHER_CODES[dCode] || { symbol: "☁️" };
    
    const row = document.createElement("div");
    row.className = "forecast-day-row";
    row.innerHTML = `
      <span class="forecast-day-name">${dayName}</span>
      <span class="forecast-day-icon">${dInfo.symbol}</span>
      <span class="forecast-day-temp">${maxT}° / ${minT}°</span>
    `;
    daysBox.appendChild(row);
  }
}

/* ==========================================================================
   5b. Most Visited Sites Module (dynamic topSites permission gate & fallback)
   ========================================================================== */
function initMostVisited() {
  checkTopSitesPermission();
}

function checkTopSitesPermission() {
  if (typeof chrome !== "undefined" && chrome.permissions && chrome.permissions.contains) {
    chrome.permissions.contains({ permissions: ["topSites"] }, (hasAccess) => {
      if (hasAccess) {
        renderTopSitesReal();
      } else {
        renderTopSitesPermissionGate();
      }
    });
  } else {
    renderTopSitesFallback();
  }
}

function renderTopSitesPermissionGate() {
  const container = document.getElementById("widget-most-visited");
  if (!container) return;
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 40px; font-size: 11px; color: rgba(255, 255, 255, 0.7);">
      <span>Most Visited Sites</span>
      <button id="grant-topsites-btn" style="background: var(--accent-color); color: #fff; border: none; padding: 4px 10px; border-radius: 12px; font-size: 10px; cursor: pointer; font-weight: 600; transition: opacity var(--transition-fast);">Enable</button>
    </div>
  `;
  const btn = document.getElementById("grant-topsites-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      chrome.permissions.request({ permissions: ["topSites"] }, (granted) => {
        if (granted) {
          renderTopSitesReal();
        } else {
          alert("Top sites permission is required to list your most visited pages.");
        }
      });
    });
  }
}

function renderTopSitesReal() {
  if (typeof chrome !== "undefined" && chrome.topSites && chrome.topSites.get) {
    chrome.topSites.get((sites) => {
      if (sites && sites.length > 0) {
        renderTopSitesList(sites);
      } else {
        renderTopSitesFallback();
      }
    });
  } else {
    renderTopSitesFallback();
  }
}

function renderTopSitesFallback() {
  renderTopSitesList(DEFAULT_TOP_SITES);
}

function renderTopSitesList(sites) {
  const container = document.getElementById("widget-most-visited");
  if (!container) return;
  container.innerHTML = "";
  
  const list = sites.slice(0, 8);
  list.forEach(site => {
    const item = document.createElement("a");
    item.className = "most-visited-item";
    item.href = site.url;
    item.target = "_self";
    
    let firstLetter = "";
    let domainName = "";
    try {
      const urlObj = new URL(site.url);
      domainName = urlObj.hostname;
      firstLetter = domainName.replace("www.", "").charAt(0).toUpperCase();
    } catch(e) {
      domainName = site.url;
      firstLetter = site.title ? site.title.charAt(0).toUpperCase() : "🌐";
    }
    
    const faviconUrl = typeof chrome !== "undefined" && chrome.runtime 
      ? `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(site.url)}&size=32`
      : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domainName)}&sz=32`;
      
    const icon = document.createElement("div");
    icon.className = "most-visited-icon";
    
    const img = document.createElement("img");
    img.src = faviconUrl;
    img.style.width = "16px";
    img.style.height = "16px";
    img.style.borderRadius = "2px";
    img.onerror = () => {
      img.style.display = "none";
      icon.innerHTML = `<span style="font-size: 10px;">${firstLetter}</span>`;
    };
    icon.appendChild(img);
    
    const title = document.createElement("div");
    title.className = "most-visited-title";
    title.innerText = site.title || site.url;
    
    item.appendChild(icon);
    item.appendChild(title);
    container.appendChild(item);
  });
}

/* ==========================================================================
   6. Bookmark Management System (CRUD)
   ========================================================================== */
// --- Sidebar Dock & Quick Links Panel ---
function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=64`;
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(urlObj.hostname)}&sz=64`;
  } catch (e) {
    return "";
  }
}

function getFirstLetter(link) {
  try {
    return new URL(link.url).hostname.replace("www.", "").charAt(0).toUpperCase();
  } catch (e) {
    return link.name ? link.name.charAt(0).toUpperCase() : "?";
  }
}

function renderSidebarDock() {
  const container = document.getElementById("sidebar-icons-list");
  if (!container) return;
  container.innerHTML = "";

  (settings.quickLinks || []).forEach((link, idx) => {
    const btn = document.createElement("a");
    btn.className = "sidebar-icon-btn";
    btn.href = link.url;
    btn.title = link.name || link.url;

    const faviconUrl = getFaviconUrl(link.url);
    const letter = getFirstLetter(link);

    btn.innerHTML = `
      <img src="${faviconUrl}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <span class="sidebar-letter" style="display:none;">${letter}</span>
    `;
    container.appendChild(btn);
  });
}

function renderQLExistingGrid() {
  const grid = document.getElementById("ql-existing-grid");
  if (!grid) return;
  grid.innerHTML = "";

  (settings.quickLinks || []).forEach((link, idx) => {
    const item = document.createElement("div");
    item.className = "ql-existing-item";
    const faviconUrl = getFaviconUrl(link.url);
    const letter = getFirstLetter(link);

    item.innerHTML = `
      <div class="ql-icon-circle">
        <img src="${faviconUrl}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <span class="ql-letter" style="display:none;">${letter}</span>
      </div>
      <span class="ql-link-name">${link.name || link.url}</span>
      <span class="ql-delete-badge" data-idx="${idx}">&times;</span>
    `;
    grid.appendChild(item);
  });

  // Delete badge handlers
  grid.querySelectorAll(".ql-delete-badge").forEach(badge => {
    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = parseInt(badge.dataset.idx);
      settings.quickLinks.splice(i, 1);
      saveSettingsSync();
      renderSidebarDock();
      renderQLExistingGrid();
    });
  });
}

function renderQLPopularGrid() {
  const grid = document.getElementById("ql-popular-grid");
  if (!grid) return;
  grid.innerHTML = "";

  POPULAR_APPS.forEach(app => {
    const btn = document.createElement("button");
    btn.className = "ql-popular-btn";
    btn.title = app.name;
    const faviconUrl = getFaviconUrl(app.url);
    btn.innerHTML = `<img src="${faviconUrl}" alt="${app.name}">`;
    btn.addEventListener("click", () => {
      // Check if already exists
      const exists = (settings.quickLinks || []).some(l => {
        try {
          return new URL(l.url).hostname === new URL(app.url).hostname;
        } catch(e) { return false; }
      });
      if (!exists) {
        settings.quickLinks.push({ name: app.name, url: app.url, icon: "" });
        saveSettingsSync();
        renderSidebarDock();
        renderQLExistingGrid();
      }
    });
    grid.appendChild(btn);
  });
}

function addQuickLinkFromInputs() {
  let url = document.getElementById("ql-url-input").value.trim();
  let name = document.getElementById("ql-name-input").value.trim();
  if (!url) return;

  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  if (!name) {
    try {
      const urlObj = new URL(url);
      let host = urlObj.hostname.replace("www.", "");
      name = host.charAt(0).toUpperCase() + host.slice(1);
    } catch (err) {
      name = url;
    }
  }

  settings.quickLinks.push({ name, url, icon: "" });
  saveSettingsSync();
  renderSidebarDock();
  renderQLExistingGrid();
  document.getElementById("ql-url-input").value = "";
  document.getElementById("ql-name-input").value = "";
}

function toggleQuickLinksPanel(show) {
  const panel = document.getElementById("quick-links-panel");
  if (show) {
    panel.style.display = "flex";
    requestAnimationFrame(() => panel.classList.add("active"));
    renderQLExistingGrid();
    renderQLPopularGrid();
  } else {
    panel.classList.remove("active");
    setTimeout(() => { panel.style.display = "none"; }, 260);
  }
}

function saveSettingsSync() {
  const syncSettings = { ...settings };
  delete syncSettings.customWallpaper; // Never sync large base64 wallpaper data
  Storage.setSync({ settings: syncSettings }, () => {
    console.log("Settings synchronized successfully.");
  });
}

/* ==========================================================================
   7. Quick Tools: Focus Timer (Pomodoro) Controller
   ========================================================================== */
function initFocusTimerSync() {
  // Sync state initially
  syncFocusTimerState();
  
  // Periodically pull storage to keep countdown correct if page reloaded
  setInterval(syncFocusTimerState, 5000);
}

async function syncFocusTimerState() {
  Storage.getLocal(["timerState", "dailyStats"], (result) => {
    const state = result.timerState;
    const stats = result.dailyStats;
    
    if (stats) {
      document.getElementById("focus-completed-today").innerText = stats.count || 0;
    }
    
    if (!state) return;
    
    // Clear page interval if running
    if (currentTimerInterval) clearInterval(currentTimerInterval);
    
    // Handle mode buttons UI highlight
    const selectBtns = document.querySelectorAll(".timer-mode-select");
    selectBtns.forEach(btn => {
      if (btn.getAttribute("data-mode") === state.mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    if (state.isRunning) {
      // Toggle play icon to pause
      document.getElementById("timer-toggle-btn").innerText = "⏸";
      document.getElementById("timer-status-desc").innerText = state.mode === "pomodoro" ? "Focus Session" : "Break Time";
      
      // Start counting down in UI
      const refreshUI = () => {
        const remaining = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
        updateTimerDial(remaining, state.duration * 60);
        
        if (remaining <= 0) {
          clearInterval(currentTimerInterval);
          document.getElementById("timer-toggle-btn").innerText = "▶";
          document.getElementById("timer-status-desc").innerText = "Finished";
          // Trigger pull to fetch next state
          setTimeout(syncFocusTimerState, 1500);
        }
      };
      
      refreshUI();
      currentTimerInterval = setInterval(refreshUI, 1000);
    } else {
      document.getElementById("timer-toggle-btn").innerText = "▶";
      document.getElementById("timer-status-desc").innerText = "Ready";
      updateTimerDial(state.timeLeft, state.duration * 60);
    }
  });
}

function updateTimerDial(secondsLeft, totalSeconds) {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const timeStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  
  // Set text
  document.getElementById("timer-countdown").innerText = timeStr;
  
  // Animate circular progress ring
  const circle = document.getElementById("timer-progress-bar");
  const r = 72;
  const circumference = 2 * Math.PI * r; // 452.38
  
  const percentage = (secondsLeft / totalSeconds) * 100;
  const offset = circumference - (percentage / 100) * circumference;
  
  circle.style.strokeDashoffset = offset;
}

// Bind Pomodoro events
document.getElementById("timer-toggle-btn").addEventListener("click", () => {
  Storage.getLocal(["timerState"], (result) => {
    const state = result.timerState;
    if (!state) return;
    
    const customDurations = settings.pomodoroDurations || { pomodoro: 25, shortBreak: 5, longBreak: 15 };
    const command = state.isRunning ? "pauseTimer" : (state.endTime > 0 ? "resumeTimer" : "startTimer");
    
    // Play electronic synth start audio when starting
    if (!state.isRunning) {
      safeSendMessage({ type: "PLAY_SOUND_BG", sound: "start" });
    }
    
    safeSendMessage({
      command: command,
      mode: state.mode,
      duration: customDurations[state.mode],
      timerState: state
    }, (res) => {
      if (res && res.state) {
        syncFocusTimerState();
      }
    });
  });
});

document.getElementById("timer-reset-btn").addEventListener("click", () => {
  Storage.getLocal(["timerState"], (result) => {
    const state = result.timerState;
    if (!state) return;
    
    if (confirm("Reset the current timer session?")) {
      const customDurations = settings.pomodoroDurations || { pomodoro: 25, shortBreak: 5, longBreak: 15 };
      safeSendMessage({
        command: "resetTimer",
        mode: state.mode,
        duration: customDurations[state.mode]
      }, (res) => {
        if (res && res.state) {
          syncFocusTimerState();
        }
      });
    }
  });
});

const modeSelectBtns = document.querySelectorAll(".timer-mode-select");
modeSelectBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    Storage.getLocal(["timerState"], (result) => {
      const state = result.timerState;
      if (state && state.isRunning) {
        alert("Please pause or reset the running timer before changing modes.");
        return;
      }
      
      const newMode = btn.getAttribute("data-mode");
      const customDurations = settings.pomodoroDurations || { pomodoro: 25, shortBreak: 5, longBreak: 15 };
      
      safeSendMessage({
        command: "resetTimer",
        mode: newMode,
        duration: customDurations[newMode]
      }, (res) => {
        if (res && res.state) {
          syncFocusTimerState();
        }
      });
    });
  });
});

// Update customized pomodoro timings
const handleTimeCfgUpdate = () => {
  const pomodoro = parseInt(document.getElementById("cfg-time-work").value) || 25;
  const shortBreak = parseInt(document.getElementById("cfg-time-short").value) || 5;
  const longBreak = parseInt(document.getElementById("cfg-time-long").value) || 15;
  
  settings.pomodoroDurations = { pomodoro, shortBreak, longBreak };
  saveSettingsSync();
  
  // If timer not running, reset to apply the new duration values immediately
  Storage.getLocal(["timerState"], (result) => {
    const state = result.timerState;
    if (state && !state.isRunning) {
      safeSendMessage({
        command: "resetTimer",
        mode: state.mode,
        duration: (settings.pomodoroDurations || { pomodoro: 25, shortBreak: 5, longBreak: 15 })[state.mode] || 25
      }, (res) => {
        if (res && res.state) {
          syncFocusTimerState();
        }
      });
    }
  });
};
document.getElementById("cfg-time-work").addEventListener("change", handleTimeCfgUpdate);
document.getElementById("cfg-time-short").addEventListener("change", handleTimeCfgUpdate);
document.getElementById("cfg-time-long").addEventListener("change", handleTimeCfgUpdate);

// Listen for background timer changes (alarm ends)
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TIMER_UPDATED") {
      syncFocusTimerState();
    }
  });
}

/* ==========================================================================
   8. Quick Tools: Notepad Module (Masonry Layout & Context menu sync)
   ========================================================================== */
function initNotesPane() {
  renderNotesDashboard();
  
  // Notes composer controls
  document.getElementById("new-note-trigger").addEventListener("click", () => {
    document.getElementById("note-composer").classList.add("active");
    document.getElementById("note-trigger-box").style.display = "none";
    document.getElementById("note-title-input").focus();
  });
  
  document.getElementById("close-composer-btn").addEventListener("click", () => {
    closeNotesComposer();
  });
  
  document.getElementById("save-note-btn").addEventListener("click", () => {
    saveNewNoteItem();
  });
  
  document.getElementById("notes-search-query").addEventListener("input", (e) => {
    renderNotesDashboard(e.target.value.trim());
  });
  
  document.getElementById("download-all-notes-btn").addEventListener("click", () => {
    downloadAllNotesFile();
  });
}

function closeNotesComposer() {
  document.getElementById("note-composer").classList.remove("active");
  document.getElementById("note-trigger-box").style.display = "flex";
  document.getElementById("note-title-input").value = "";
  document.getElementById("note-content-input").value = "";
}

function saveNewNoteItem() {
  const content = document.getElementById("note-content-input").value.trim();
  let title = document.getElementById("note-title-input").value.trim();
  
  if (!content) return;
  
  if (!title) {
    const limit = 30;
    title = content.substring(0, limit);
    if (content.length > limit) title += "...";
  }
  
  const id = `note_${Date.now()}`;
  const newNote = {
    id: id,
    title: title,
    content: content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  Storage.setLocal({ [id]: newNote }, () => {
    closeNotesComposer();
    renderNotesDashboard();
  });
}

function renderNotesDashboard(filterQuery = "") {
  Storage.getAllLocal((allLocal) => {
    // Filter keys starting with note_
    let notes = Object.keys(allLocal)
      .filter(k => k.startsWith("note_"))
      .map(k => allLocal[k]);
      
    // Sort by updated time
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Apply search filter
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      notes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    
    const container = document.getElementById("notes-masonry-list");
    const emptyPrompt = document.getElementById("empty-notes-prompt");
    
    container.innerHTML = "";
    
    if (notes.length === 0) {
      emptyPrompt.style.display = "flex";
      container.style.display = "none";
      return;
    }
    
    emptyPrompt.style.display = "none";
    container.style.display = "grid";
    
    notes.forEach(note => {
      const card = document.createElement("div");
      card.className = "note-card";
      
      const head = document.createElement("h4");
      head.innerText = note.title;
      
      const bodyText = document.createElement("p");
      bodyText.innerText = note.content;
      
      const footer = document.createElement("div");
      footer.className = "note-card-footer";
      footer.innerHTML = `<span>${new Date(note.updatedAt).toLocaleDateString()}</span>`;
      
      const actions = document.createElement("div");
      actions.className = "note-card-actions";
      
      // Copy Note
      const copyBtn = document.createElement("button");
      copyBtn.className = "note-action-trigger";
      copyBtn.innerText = "📋";
      copyBtn.title = "Copy to clipboard";
      copyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(note.content).then(() => {
          alert("Note copied!");
        });
      });
      
      // Download single note
      const dlBtn = document.createElement("button");
      dlBtn.className = "note-action-trigger";
      dlBtn.innerText = "💾";
      dlBtn.title = "Download note";
      dlBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadSingleNoteFile(note);
      });
      
      // Delete Note
      const delBtn = document.createElement("button");
      delBtn.className = "note-action-trigger";
      delBtn.innerText = "🗑️";
      delBtn.title = "Delete note";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Delete this note?")) {
          Storage.removeLocal(note.id, () => {
            renderNotesDashboard();
          });
        }
      });
      
      actions.appendChild(copyBtn);
      actions.appendChild(dlBtn);
      actions.appendChild(delBtn);
      footer.appendChild(actions);
      
      card.appendChild(head);
      card.appendChild(bodyText);
      card.appendChild(footer);
      
      // Edit click handler
      card.addEventListener("click", () => {
        // Expand card content
        card.classList.toggle("expanded");
      });
      
      container.appendChild(card);
    });
  });
}

function downloadSingleNoteFile(note) {
  const content = `Title: ${note.title}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n\n${note.content}`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadAllNotesFile() {
  Storage.getAllLocal((allLocal) => {
    const notes = Object.keys(allLocal)
      .filter(k => k.startsWith("note_"))
      .map(k => allLocal[k]);
      
    if (notes.length === 0) return;
    
    let combinedText = "=== AURA TAB NOTES BACKUP ===\n\n";
    notes.forEach((n, idx) => {
      combinedText += `[Note ${idx+1}] ${n.title}\nUpdated: ${new Date(n.updatedAt).toLocaleString()}\n--------------------\n${n.content}\n\n====================\n\n`;
    });
    
    const blob = new Blob([combinedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aura-notes-backup-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Context menu note listener
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "NOTE_ADDED") {
      renderNotesDashboard();
    }
  });
}

/* ==========================================================================
   9. Quick Tools: Tabs Manager Module (Dynamic Permissions & Restoration)
   ========================================================================== */
let savedTabGroups = [];

function initTabsPane() {
  checkTabsPermission();
  
  document.getElementById("grant-tabs-permission-btn").addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.permissions && chrome.permissions.request) {
      chrome.permissions.request({ permissions: ["tabs"] }, (granted) => {
        if (granted) {
          showTabsActiveUI();
        } else {
          alert("Tab permissions are required to use this utility.");
        }
      });
    } else {
      showTabsActiveUI();
    }
  });
  
  document.getElementById("refresh-active-tabs-btn").addEventListener("click", () => {
    loadOpenTabs();
  });
  
  document.getElementById("save-tab-group-btn").addEventListener("click", () => {
    saveWorkspaceTabGroup();
  });
}

function checkTabsPermission() {
  if (typeof chrome !== "undefined" && chrome.permissions) {
    chrome.permissions.contains({ permissions: ["tabs"] }, (hasAccess) => {
      if (hasAccess) {
        showTabsActiveUI();
      } else {
        showTabsPermissionGate();
      }
    });
  } else {
    showTabsPermissionGate();
  }
}

function showTabsPermissionGate() {
  document.getElementById("tabs-permission-gate").style.display = "flex";
  document.getElementById("tabs-manager-active-ui").style.display = "none";
}

function showTabsActiveUI() {
  document.getElementById("tabs-permission-gate").style.display = "none";
  document.getElementById("tabs-manager-active-ui").style.display = "flex";
  
  loadOpenTabs();
  loadSavedTabGroups();
}

let activeTabsCached = [];
function loadOpenTabs() {
  const handleTabs = (tabs) => {
    if (!tabs || tabs.length === 0) return;
    
    activeTabsCached = tabs;
    document.getElementById("active-tabs-count").innerText = `${tabs.length} Open Tabs`;
    
    const container = document.getElementById("active-tabs-list-container");
    container.innerHTML = "";
    
    tabs.forEach(tab => {
      const row = document.createElement("div");
      row.className = "tab-row-item";
      
      const icon = document.createElement("img");
      icon.className = "tab-favicon";
      icon.src = tab.favIconUrl || "icons/icon-16.png";
      icon.onerror = () => { icon.src = "icons/icon-16.png"; };
      
      const info = document.createElement("div");
      info.className = "tab-info-wrap";
      
      const title = document.createElement("span");
      title.className = "tab-title-text";
      title.innerText = tab.title || "Untitled Tab";
      
      const domain = document.createElement("span");
      domain.className = "tab-domain-text";
      try {
        domain.innerText = tab.url ? new URL(tab.url).hostname : "Local Page";
      } catch(e) {
        domain.innerText = "Internal Page";
      }
      
      info.appendChild(title);
      info.appendChild(domain);
      row.appendChild(icon);
      row.appendChild(info);
      container.appendChild(row);
    });
  };

  safeSendMessage({ type: "GET_TABS" }, (tabs) => {
    if (tabs) {
      handleTabs(tabs);
    } else {
      // Mock open tabs fallback for non-extension previews
      const mockTabs = [
        { title: "Aura Tab Dashboard", url: window.location.href, favIconUrl: "icons/icon-16.png" },
        { title: "Google", url: "https://google.com", favIconUrl: "icons/icon-16.png" },
        { title: "GitHub", url: "https://github.com", favIconUrl: "icons/icon-16.png" }
      ];
      handleTabs(mockTabs);
    }
  });
}

function saveWorkspaceTabGroup() {
  const input = document.getElementById("tab-group-name-input");
  const name = input.value.trim();
  if (!name || activeTabsCached.length === 0) return;
  
  // Format tab group payload
  const newGroup = {
    id: `tabgroup_${Date.now()}`,
    name: name,
    tabs: activeTabsCached.map(t => ({ title: t.title, url: t.url, favIconUrl: t.favIconUrl })),
    timestamp: Date.now()
  };
  
  Storage.getSync(["savedTabGroups"], (result) => {
    const list = result.savedTabGroups || [];
    list.unshift(newGroup);
    
    Storage.setSync({ savedTabGroups: list }, () => {
      input.value = "";
      loadSavedTabGroups();
    });
  });
}

function loadSavedTabGroups() {
  Storage.getSync(["savedTabGroups"], (result) => {
    savedTabGroups = result.savedTabGroups || [];
    const container = document.getElementById("saved-tab-groups-list");
    container.innerHTML = "";
    
    if (savedTabGroups.length === 0) {
      container.innerHTML = `<p class="help-text text-center py-4">No saved tab groups yet.</p>`;
      return;
    }
    
    savedTabGroups.forEach(group => {
      const card = document.createElement("div");
      card.className = "saved-group-card";
      
      const info = document.createElement("div");
      info.className = "group-info";
      info.innerHTML = `
        <h5>${group.name}</h5>
        <span>${group.tabs.length} tabs • ${new Date(group.timestamp).toLocaleDateString()}</span>
      `;
      
      const actions = document.createElement("div");
      actions.className = "group-actions";
      
      // Restore Group
      const openBtn = document.createElement("button");
      openBtn.className = "grp-act-btn restore-grp";
      openBtn.innerText = "🚀";
      openBtn.title = "Open all tabs";
      openBtn.addEventListener("click", () => {
        group.tabs.forEach(t => {
          if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
            chrome.tabs.create({ url: t.url });
          } else {
            window.open(t.url, '_blank');
          }
        });
      });
      
      // Delete Group
      const delBtn = document.createElement("button");
      delBtn.className = "grp-act-btn delete-grp";
      delBtn.innerText = "🗑️";
      delBtn.title = "Delete workspace";
      delBtn.addEventListener("click", () => {
        if (confirm("Delete this saved workspace?")) {
          deleteTabGroupItem(group.id);
        }
      });
      
      actions.appendChild(openBtn);
      actions.appendChild(delBtn);
      card.appendChild(info);
      card.appendChild(actions);
      container.appendChild(card);
    });
  });
}

function deleteTabGroupItem(groupId) {
  const updated = savedTabGroups.filter(g => g.id !== groupId);
  Storage.setSync({ savedTabGroups: updated }, () => {
    loadSavedTabGroups();
  });
}

/* ==========================================================================
   10. Quick Tools: Extensions Manager (Dynamic permissions list toggles)
   ========================================================================== */
function initExtensionsPane() {
  checkExtensionsPermission();
  
  document.getElementById("grant-extensions-permission-btn").addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.permissions && chrome.permissions.request) {
      chrome.permissions.request({ permissions: ["management"] }, (granted) => {
        if (granted) {
          showExtensionsActiveUI();
        } else {
          alert("Management permission is required to list browser extensions.");
        }
      });
    } else {
      showExtensionsActiveUI();
    }
  });
  
  // Bind filters
  const extFilters = document.querySelectorAll(".filter-btn");
  extFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      extFilters.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadExtensionsList(document.getElementById("extensions-search-input").value.trim(), btn.getAttribute("data-filter"));
    });
  });
  
  document.getElementById("extensions-search-input").addEventListener("input", (e) => {
    const activeFilter = document.querySelector(".filter-btn.active").getAttribute("data-filter");
    loadExtensionsList(e.target.value.trim(), activeFilter);
  });
}

function checkExtensionsPermission() {
  if (typeof chrome !== "undefined" && chrome.permissions) {
    chrome.permissions.contains({ permissions: ["management"] }, (hasAccess) => {
      if (hasAccess) {
        showExtensionsActiveUI();
      } else {
        showExtensionsPermissionGate();
      }
    });
  } else {
    showExtensionsPermissionGate();
  }
}

function showExtensionsPermissionGate() {
  document.getElementById("extensions-permission-gate").style.display = "flex";
  document.getElementById("extensions-manager-active-ui").style.display = "none";
}

function showExtensionsActiveUI() {
  document.getElementById("extensions-permission-gate").style.display = "none";
  document.getElementById("extensions-manager-active-ui").style.display = "flex";
  
  loadExtensionsList();
}

function loadExtensionsList(search = "", filterType = "all") {
  const renderExtensions = (extensions) => {
    // Check heavy load warning (> 15 active extensions)
    const activeCount = extensions.filter(e => e.enabled).length;
    document.getElementById("extension-heavy-load-warning").style.display = activeCount > 15 ? "block" : "none";
    
    // Apply Search
    if (search) {
      const s = search.toLowerCase();
      extensions = extensions.filter(e => e.name.toLowerCase().includes(s));
    }
    
    // Apply filters
    if (filterType === "active") {
      extensions = extensions.filter(e => e.enabled);
    } else if (filterType === "disabled") {
      extensions = extensions.filter(e => !e.enabled);
    }
    
    // Sort active first, then alphabetically
    extensions.sort((a, b) => {
      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    const container = document.getElementById("extensions-list-container");
    container.innerHTML = "";
    
    if (extensions.length === 0) {
      container.innerHTML = `<p class="help-text text-center py-6">No matching extensions found.</p>`;
      return;
    }
    
    extensions.forEach(ext => {
      const row = document.createElement("div");
      row.className = `extension-row ${ext.enabled ? "enabled" : "disabled"}`;
      
      const left = document.createElement("div");
      left.className = "ext-left";
      
      // Extension Icon img
      const icon = document.createElement("img");
      icon.className = "ext-icon-img";
      if (ext.icons && ext.icons.length > 0) {
        icon.src = ext.icons[ext.icons.length - 1].url;
      } else {
        icon.src = "icons/icon-16.png";
      }
      
      const info = document.createElement("div");
      info.className = "ext-info";
      info.innerHTML = `
        <span class="ext-name">${ext.name}</span>
        <span class="ext-ver">v${ext.version}</span>
      `;
      
      left.appendChild(icon);
      left.appendChild(info);
      
      // Enable/Disable trigger switch
      const toggle = document.createElement("button");
      toggle.className = `ext-toggle-btn ${ext.enabled ? "active" : "inactive"}`;
      toggle.innerText = ext.enabled ? "Off" : "On";
      toggle.title = ext.enabled ? "Disable Extension" : "Enable Extension";
      
      toggle.addEventListener("click", () => {
        const targetState = !ext.enabled;
        if (typeof chrome !== "undefined" && chrome.management && chrome.management.setEnabled) {
          chrome.management.setEnabled(ext.id, targetState, () => {
            loadExtensionsList(search, filterType);
          });
        } else {
          // Fallback mock toggle for non-extension previews
          ext.enabled = targetState;
          loadExtensionsList(search, filterType);
        }
      });
      
      row.appendChild(left);
      row.appendChild(toggle);
      container.appendChild(row);
    });
  };

  if (typeof chrome !== "undefined" && chrome.management && chrome.management.getAll) {
    chrome.management.getAll((list) => {
      // Filter out themes and filter out current extension itself
      const myId = typeof chrome !== "undefined" && chrome.runtime ? chrome.runtime.id : "";
      const extensions = list.filter(item => item.type === "extension" && item.id !== myId);
      renderExtensions(extensions);
    });
  } else {
    // Fallback: render dummy/mock list of extensions for testing/preview purposes
    if (!window.mockExtensionsData) {
      window.mockExtensionsData = [
        { id: "mock-ext-1", name: "Glassy - New Tab", version: "1.5.0", enabled: true, type: "extension", icons: [] },
        { id: "mock-ext-2", name: "uBlock Origin", version: "1.58.0", enabled: true, type: "extension", icons: [] },
        { id: "mock-ext-3", name: "React Developer Tools", version: "5.2.0", enabled: false, type: "extension", icons: [] },
        { id: "mock-ext-4", name: "Aura Tab Helper", version: "1.0.0", enabled: true, type: "extension", icons: [] }
      ];
    }
    renderExtensions(window.mockExtensionsData);
  }
}

/* ==========================================================================
   11. Quick Tools: Clipboard History Module (Navigator read clipboard)
   ========================================================================== */
let clipboardItems = [];

function initClipboardPane() {
  loadClipboardHistory();
  
  document.getElementById("toggle-clipboard-capture").addEventListener("change", (e) => {
    const isChecked = e.target.checked;
    Storage.setLocal({ autoCapture: isChecked }, () => {
      if (isChecked) {
        requestClipboardAccess();
      }
    });
  });
  
  document.getElementById("clear-clipboard-btn").addEventListener("click", () => {
    if (confirm("Clear clipboard history?")) {
      clipboardItems = [];
      Storage.setLocal({ clipboardItems }, () => {
        renderClipboardHistory();
      });
    }
  });
}

function requestClipboardAccess() {
  navigator.clipboard.readText()
    .then(text => {
      console.log("Clipboard monitoring active.");
    })
    .catch(err => {
      console.warn("Clipboard read permission denied by browser.", err);
      alert("Please allow clipboard access requests to auto-capture snippets.");
      document.getElementById("toggle-clipboard-capture").checked = false;
      Storage.setLocal({ autoCapture: false });
    });
}

function loadClipboardHistory() {
  Storage.getLocal(["clipboardItems"], (result) => {
    clipboardItems = result.clipboardItems || [];
    renderClipboardHistory();
  });
}

function renderClipboardHistory() {
  const container = document.getElementById("clipboard-history-list");
  const emptyPrompt = document.getElementById("clipboard-empty-prompt");
  const clearBtn = document.getElementById("clear-clipboard-btn");
  
  container.innerHTML = "";
  
  if (clipboardItems.length === 0) {
    emptyPrompt.style.display = "flex";
    clearBtn.style.display = "none";
    return;
  }
  
  emptyPrompt.style.display = "none";
  clearBtn.style.display = "block";
  
  clipboardItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "clip-card";
    
    const text = document.createElement("pre");
    text.className = "clip-text-content";
    text.innerText = item.content;
    
    const actions = document.createElement("div");
    actions.className = "clip-actions";
    
    // Copy item back
    const copyBtn = document.createElement("button");
    copyBtn.className = "clip-act-btn";
    copyBtn.innerText = "📋";
    copyBtn.title = "Copy back";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(item.content).then(() => {
        alert("Copied back to clipboard!");
      });
    });
    
    // Delete item
    const delBtn = document.createElement("button");
    delBtn.className = "clip-act-btn";
    delBtn.innerText = "🗑️";
    delBtn.title = "Delete snippet";
    delBtn.addEventListener("click", () => {
      deleteClipboardItem(item.id);
    });
    
    actions.appendChild(copyBtn);
    actions.appendChild(delBtn);
    
    card.appendChild(text);
    card.appendChild(actions);
    
    // Expand click handler
    card.addEventListener("click", () => {
      card.classList.toggle("expanded");
    });
    
    container.appendChild(card);
  });
}

function deleteClipboardItem(id) {
  clipboardItems = clipboardItems.filter(i => i.id !== id);
  Storage.setLocal({ clipboardItems }, () => {
    renderClipboardHistory();
  });
}

// Clipboard copy listener on page
document.addEventListener("copy", () => {
  Storage.getLocal(["autoCapture"], (res) => {
    if (!res.autoCapture) return;
    
    setTimeout(() => {
      navigator.clipboard.readText()
        .then(text => {
          if (!text || !text.trim()) return;
          
          // Avoid immediate duplicates
          if (clipboardItems.length > 0 && clipboardItems[0].content === text.trim()) return;
          
          const newItem = {
            id: `clip_${Date.now()}`,
            content: text.trim(),
            timestamp: Date.now()
          };
          
          clipboardItems = [newItem, ...clipboardItems].slice(0, 12);
          Storage.setLocal({ clipboardItems }, () => {
            renderClipboardHistory();
          });
        })
        .catch(e => console.error(e));
    }, 200);
  });
});

/* ==========================================================================
   12. Zen Mode & Ambient Audio synth loops
   ========================================================================== */
function enterZenMode() {
  document.getElementById("zen-mode-overlay").style.display = "flex";
  document.body.classList.add("zen-mode-active");
  
  // Render giant flip clock inside Zen Mode
  initZenClockLoop();
  
  // Start ambient audio if enabled
  if (isZenSoundPlaying) {
    safeSendMessage({ type: "PLAY_AMBIENT_BG", sound: currentZenAmbientSound, volume: parseFloat(document.getElementById("zen-volume-slider").value) });
  }
}

function exitZenMode() {
  document.getElementById("zen-mode-overlay").style.display = "none";
  document.body.classList.remove("zen-mode-active");
  
  // Stop zen clock timer
  if (zenClockTimer) {
    clearInterval(zenClockTimer);
    zenClockTimer = null;
  }
  
  // Stop nature sounds loop
  safeSendMessage({ type: "STOP_AMBIENT_BG" });
}

let zenClockTimer = null;
let prevZenTimeStr = "";
function initZenClockLoop() {
  updateZenClock();
  zenClockTimer = setInterval(updateZenClock, 1000);
}

function updateZenClock() {
  const now = new Date();
  let hrs = now.getHours();
  const mins = now.getMinutes();
  
  let ampm = "";
  if (!settings.clock24h) {
    ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12 || 12;
  }
  
  const pad = (v) => v.toString().padStart(2, "0");
  const hrStr = pad(hrs);
  const minStr = pad(mins);
  
  const timeStr = `${hrStr}${minStr}`;
  const container = document.getElementById("zen-clock-container");
  
  const digitWraps = container.querySelectorAll(".digit-card-wrap");
  
  if (digitWraps.length !== 4) {
    container.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      if (i === 2) {
        const colon = document.createElement("div");
        colon.className = "clock-colon";
        colon.innerText = ":";
        container.appendChild(colon);
      }
      const wrap = document.createElement("div");
      wrap.className = "digit-card-wrap";
      wrap.innerHTML = `
        <div class="digit-card-divider"></div>
        <div class="digit-card-val primary-val">${timeStr[i]}</div>
      `;
      container.appendChild(wrap);
    }
    
    if (!settings.clock24h) {
      const ampmElem = document.createElement("div");
      ampmElem.className = "clock-ampm";
      ampmElem.innerText = ampm;
      container.appendChild(ampmElem);
    }
    prevZenTimeStr = timeStr;
    return;
  }
  
  for (let i = 0; i < 4; i++) {
    const wrap = digitWraps[i];
    if (timeStr[i] !== prevZenTimeStr[i]) {
      const current = timeStr[i];
      const prev = prevZenTimeStr[i];
      
      wrap.innerHTML = `
        <div class="digit-card-divider"></div>
        <div class="digit-card-val slide-up">${prev}</div>
        <div class="digit-card-val slide-in">${current}</div>
      `;
      
      setTimeout(() => {
        wrap.innerHTML = `
          <div class="digit-card-divider"></div>
          <div class="digit-card-val primary-val">${current}</div>
        `;
      }, 600);
    }
  }
  
  prevZenTimeStr = timeStr;
}

/* ==========================================================================
   13. UI Event Listeners Controller (Menu buttons and customize sliders)
   ========================================================================== */
function setupUIEventListeners() {
  
  // Floating Actions Buttons toggles
  document.getElementById("settings-trigger-btn").addEventListener("click", () => {
    document.getElementById("customizer-drawer").classList.toggle("active");
  });
  
  document.getElementById("close-drawer-btn").addEventListener("click", () => {
    document.getElementById("customizer-drawer").classList.remove("active");
  });
  
  document.getElementById("quick-tools-trigger-btn").addEventListener("click", () => {
    const pane = document.getElementById("quick-tools-panel");
    if (pane.style.display === "none") {
      pane.style.display = "flex";
      syncFocusTimerState();
      loadOpenTabs();
      loadExtensionsList();
      loadClipboardHistory();
    } else {
      pane.style.display = "none";
    }
  });
  
  document.getElementById("close-quick-tools-btn").addEventListener("click", () => {
    document.getElementById("quick-tools-panel").style.display = "none";
  });

  // Click outside panels to close
  document.addEventListener("mousedown", (e) => {
    const drawer = document.getElementById("customizer-drawer");
    const settingsBtn = document.getElementById("settings-trigger-btn");
    if (!drawer.contains(e.target) && !settingsBtn.contains(e.target)) {
      drawer.classList.remove("active");
    }
    
    const popover = document.getElementById("search-engine-popover");
    const trigger = document.getElementById("search-engine-trigger");
    if (popover.style.display === "flex" && !popover.contains(e.target) && !trigger.contains(e.target)) {
      popover.style.display = "none";
    }
    
    const historyPopover = document.getElementById("search-history-popover");
    const queryInput = document.getElementById("search-query-input");
    const promptTextarea = document.getElementById("search-prompt-textarea");
    if (historyPopover.style.display === "block" && !historyPopover.contains(e.target) && e.target !== queryInput && e.target !== promptTextarea) {
      historyPopover.style.display = "none";
    }
  });

  // Settings Drawer tabs toggles
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const panes = document.querySelectorAll(".tab-pane");
      panes.forEach(p => p.classList.remove("active"));
      document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
    });
  });

  // Quick Tools tabs toggles
  const panelTabBtns = document.querySelectorAll(".panel-tab-btn");
  panelTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      panelTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const panes = document.querySelectorAll(".tool-pane");
      panes.forEach(p => p.classList.remove("active"));
      document.getElementById(`tool-${btn.getAttribute("data-tool")}`).classList.add("active");
    });
  });

  // Visibility Checkboxes bindings
  const bindVisibilityToggle = (chkId, settingsKey) => {
    document.getElementById(chkId).addEventListener("change", (e) => {
      settings[settingsKey] = e.target.checked;
      saveSettingsSync();
      applyDesignSystemStyles();
    });
  };
  bindVisibilityToggle("toggle-clock", "showClock");
  bindVisibilityToggle("toggle-greeting", "showGreeting");
  bindVisibilityToggle("toggle-search", "showSearch");
  bindVisibilityToggle("toggle-weather", "showWeather");
  bindVisibilityToggle("toggle-most-visited", "showMostVisited");
  bindVisibilityToggle("toggle-quick-links", "showQuickLinks");
  bindVisibilityToggle("toggle-zen-button", "showZenButton");
  bindVisibilityToggle("toggle-todo", "showTodo");
  bindVisibilityToggle("toggle-quote", "showQuote");
  
  // Format Toggles
  document.getElementById("toggle-seconds").addEventListener("change", (e) => {
    settings.clockSeconds = e.target.checked;
    saveSettingsSync();
    
    // Clear and rebuild flipping clock structure
    const container = document.getElementById("flip-clock-container");
    container.innerHTML = "";
    prevTimeStr = "";
    
    updateClockDisplay();
  });
  
  document.getElementById("toggle-24h").addEventListener("change", (e) => {
    settings.clock24h = e.target.checked;
    saveSettingsSync();
    
    // Clear and rebuild flipping clocks
    document.getElementById("flip-clock-container").innerHTML = "";
    prevTimeStr = "";
    prevZenTimeStr = "";
    
    updateClockDisplay();
    if (document.body.classList.contains("zen-mode-active")) {
      document.getElementById("zen-clock-container").innerHTML = "";
      updateZenClock();
    }
  });

  // Profiles inputs bindings
  document.getElementById("input-username").addEventListener("input", (e) => {
    settings.username = e.target.value.trim();
    updateGreetingText();
    saveSettingsSync();
  });
  
  document.getElementById("select-font-family").addEventListener("change", (e) => {
    settings.fontFamily = e.target.value;
    saveSettingsSync();
    applyDesignSystemStyles();
  });

  document.getElementById("select-clock-font").addEventListener("change", (e) => {
    settings.clockFont = e.target.value;
    saveSettingsSync();
    applyDesignSystemStyles();
  });

  document.getElementById("select-greeting-font").addEventListener("change", (e) => {
    settings.greetingFont = e.target.value;
    saveSettingsSync();
    applyDesignSystemStyles();
  });

  document.getElementById("select-sidebar-font").addEventListener("change", (e) => {
    settings.sidebarFont = e.target.value;
    saveSettingsSync();
    applyDesignSystemStyles();
  });

  // Range Slider bindings
  const bindRangeSlider = (sliderId, valueSpanId, settingsKey) => {
    const slider = document.getElementById(sliderId);
    const span = document.getElementById(valueSpanId);
    slider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      span.innerText = val;
      settings[settingsKey] = val;
      applyDesignSystemStyles();
    });
    slider.addEventListener("change", () => {
      saveSettingsSync();
    });
  };
  bindRangeSlider("input-blur", "val-blur", "glassBlur");
  bindRangeSlider("input-opacity", "val-opacity", "glassOpacity");
  bindRangeSlider("input-border-opacity", "val-border-opacity", "borderOpacity");
  bindRangeSlider("input-radius", "val-radius", "cornerRadius");

  // Border width slider
  const borderWidthSlider = document.getElementById("input-border-width");
  borderWidthSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById("val-border-width").innerText = val;
    settings.borderWidth = val;
    applyDesignSystemStyles();
  });
  borderWidthSlider.addEventListener("change", () => {
    saveSettingsSync();
  });

  // Glass tint picker
  const tintColorPicker = document.getElementById("input-glass-tint");
  tintColorPicker.addEventListener("input", (e) => {
    settings.glassTint = e.target.value;
    applyDesignSystemStyles();
  });
  tintColorPicker.addEventListener("change", () => {
    saveSettingsSync();
  });

  // Wallpaper blur slider
  const bgBlurSlider = document.getElementById("input-bg-blur");
  bgBlurSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("val-bg-blur").innerText = val;
    settings.bgBlur = val;
    applyDesignSystemStyles();
  });
  bgBlurSlider.addEventListener("change", () => {
    saveSettingsSync();
  });
  
  // Darkness slider
  const darkSlider = document.getElementById("input-bg-darkness");
  darkSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value) / 100;
    document.getElementById("val-bg-darkness").innerText = e.target.value;
    settings.darkenOverlay = val;
    applyDesignSystemStyles();
  });
  darkSlider.addEventListener("change", () => {
    saveSettingsSync();
  });

  // Layout Edit Mode Toggles
  document.getElementById("toggle-layout-edit").addEventListener("change", (e) => {
    const active = e.target.checked;
    if (active) {
      document.body.classList.add("layout-edit-active");
      document.getElementById("edit-mode-banner").style.display = "flex";
      document.getElementById("customizer-drawer").classList.remove("active");
    } else {
      document.body.classList.remove("layout-edit-active");
      document.getElementById("edit-mode-banner").style.display = "none";
      document.getElementById("drag-help-card").style.display = "none";
    }
  });
  
  document.getElementById("banner-help-btn").addEventListener("click", () => {
    const card = document.getElementById("drag-help-card");
    card.style.display = card.style.display === "none" ? "block" : "none";
  });
  
  document.getElementById("exit-edit-mode-btn").addEventListener("click", () => {
    document.getElementById("toggle-layout-edit").checked = false;
    document.body.classList.remove("layout-edit-active");
    document.getElementById("edit-mode-banner").style.display = "none";
    document.getElementById("drag-help-card").style.display = "none";
  });
  
  document.getElementById("btn-reset-layout").addEventListener("click", () => {
    resetAllWidgetPositions();
  });

  // Background types Radios
  const bgRadios = document.getElementsByName("bg-type");
  bgRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      const type = e.target.value;
      settings.bgType = type;
      toggleBackgroundSubSections(type);
      saveSettingsSync();
      applyDesignSystemStyles();
    });
  });

  // solid color picker
  document.getElementById("input-solid-bg").addEventListener("input", (e) => {
    settings.solidColor = e.target.value;
    settings.bgType = "solid";
    const radios = document.getElementsByName("bg-type");
    radios.forEach(r => {
      if (r.value === "solid") r.checked = true;
    });
    toggleBackgroundSubSections("solid");
    applyDesignSystemStyles();
  });
  document.getElementById("input-solid-bg").addEventListener("change", () => {
    saveSettingsSync();
  });
  
  // accent color picker
  document.getElementById("input-accent-color").addEventListener("input", (e) => {
    settings.accentColor = e.target.value;
    applyDesignSystemStyles();
  });
  document.getElementById("input-accent-color").addEventListener("change", () => {
    saveSettingsSync();
  });
  
  // accent color presets
  const accentPaletteBtns = document.querySelectorAll(".accent-palette-btn");
  accentPaletteBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-color");
      document.getElementById("input-accent-color").value = val;
      settings.accentColor = val;
      applyDesignSystemStyles();
      saveSettingsSync();
    });
  });
  
  const paletteBtns = document.querySelectorAll(".palette-btn:not(.accent-palette-btn)");
  paletteBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-color");
      if (val.startsWith("linear-gradient") || val.startsWith("radial-gradient")) {
        document.getElementById("input-solid-bg").value = "#0f172a";
        settings.solidColor = val;
      } else {
        document.getElementById("input-solid-bg").value = val;
        settings.solidColor = val;
      }
      settings.bgType = "solid";
      const radios = document.getElementsByName("bg-type");
      radios.forEach(r => {
        if (r.value === "solid") r.checked = true;
      });
      toggleBackgroundSubSections("solid");
      applyDesignSystemStyles();
      saveSettingsSync();
    });
  });

  // Build Presets Carousel wallapers
  const wallpaperCarousel = document.getElementById("preset-wallpapers-carousel");
  wallpaperCarousel.innerHTML = "";
  WALLPAPER_PRESETS.forEach(wp => {
    const btn = document.createElement("button");
    btn.className = `preset-thumb-btn ${settings.backgroundImage === wp.url ? "active" : ""}`;
    btn.style.backgroundImage = `url('${wp.url}')`;
    btn.title = wp.name;
    
    btn.addEventListener("click", () => {
      // Deactivate siblings
      wallpaperCarousel.querySelectorAll(".preset-thumb-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      settings.backgroundImage = wp.url;
      settings.darkenOverlay = wp.darkness;
      document.getElementById("input-bg-darkness").value = wp.darkness * 100;
      document.getElementById("val-bg-darkness").innerText = Math.round(wp.darkness * 100);
      
      settings.bgType = "preset";
      const radios = document.getElementsByName("bg-type");
      radios.forEach(r => {
        if (r.value === "preset") r.checked = true;
      });
      toggleBackgroundSubSections("preset");
      
      saveSettingsSync();
      applyDesignSystemStyles();
    });
    wallpaperCarousel.appendChild(btn);
  });

  // Build Presets Carousel GIFs
  const gifCarousel = document.getElementById("preset-gifs-carousel");
  gifCarousel.innerHTML = "";
  GIF_PRESETS.forEach(gif => {
    const btn = document.createElement("button");
    btn.className = `preset-thumb-btn ${settings.backgroundImage === gif.url ? "active" : ""}`;
    btn.style.backgroundImage = `url('${gif.url}')`;
    btn.title = gif.name;
    
    btn.addEventListener("click", () => {
      // Deactivate siblings
      gifCarousel.querySelectorAll(".preset-thumb-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      settings.backgroundImage = gif.url;
      settings.darkenOverlay = gif.darkness;
      document.getElementById("input-bg-darkness").value = gif.darkness * 100;
      document.getElementById("val-bg-darkness").innerText = Math.round(gif.darkness * 100);
      
      settings.bgType = "preset";
      const radios = document.getElementsByName("bg-type");
      radios.forEach(r => {
        if (r.value === "preset") r.checked = true;
      });
      toggleBackgroundSubSections("preset");
      
      saveSettingsSync();
      applyDesignSystemStyles();
    });
    gifCarousel.appendChild(btn);
  });

  // Apply custom URL background (supports direct images, direct videos, and Pinterest links)
  document.getElementById("apply-url-btn").addEventListener("click", async () => {
    const url = document.getElementById("input-image-url").value.trim();
    if (!url) return;
    
    const applyBtn = document.getElementById("apply-url-btn");
    const originalText = applyBtn.textContent;
    applyBtn.textContent = "Loading...";
    applyBtn.disabled = true;

    try {
      let mediaUrl = url;
      let mediaType = "image/jpeg"; // default fallback

      // 1. Detect Pinterest URL
      if (url.includes("pinterest.com") || url.includes("pin.it")) {
        applyBtn.textContent = "Fetching Pin...";
        // Normalize Pinterest URL
        let pinUrl = url;
        if (pinUrl.includes("pinterest.") && !pinUrl.includes("pinterest.com")) {
          pinUrl = pinUrl.replace(/pinterest\.[a-z\.]+\/pin\//i, "pinterest.com/pin/");
        }
        const media = await fetchPinterestMedia(pinUrl);
        mediaUrl = media.url;
        mediaType = media.type === "video" ? "video/mp4" : "image/jpeg";
      } else {
        // 2. Detect direct video link by extension
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".mov") || lowerUrl.endsWith(".webm") || 
            lowerUrl.endsWith(".ogg") || lowerUrl.endsWith(".m4v") || lowerUrl.endsWith(".mkv")) {
          mediaType = "video/mp4";
        }
      }

      applyBtn.textContent = "Downloading...";
      // Fetch media blob via background to bypass CORS and save to IndexedDB
      const blob = await fetchBlobFromBackground(mediaUrl);

      // Save to IndexedDB
      await saveWallpaperFile(blob);

      // Update settings
      settings.bgType = "custom";
      settings.customWallpaperType = blob.type || mediaType;
      settings.customWallpaper = ""; // Clear base64 fallback to conserve sync/local storage
      saveSettingsSync();

      // Revoke and create new Object URL
      if (cachedWallpaperObjectUrl) {
        URL.revokeObjectURL(cachedWallpaperObjectUrl);
      }
      cachedWallpaperObjectUrl = URL.createObjectURL(blob);

      // Save settings to Local Storage
      Storage.setLocal({ customWallpaper: "" }, () => {
        applyDesignSystemStyles();
        populateSettingsInputs();
        alert("Wallpaper saved and applied successfully!");
      });
    } catch (err) {
      console.error("Failed to apply URL wallpaper:", err);
      alert("Failed to apply URL wallpaper: " + err.message);
    } finally {
      applyBtn.textContent = originalText;
      applyBtn.disabled = false;
    }
  });

  // Local file upload background
  const dropZone = document.getElementById("file-upload-zone");
  dropZone.addEventListener("click", () => {
    document.getElementById("input-image-file").click();
  });
  
  document.getElementById("input-image-file").addEventListener("change", (e) => {
    handleWallpaperFilesUpload(e.target.files);
  });
  
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--accent-color)";
  });
  
  dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "rgba(255, 255, 255, 0.2)";
  });
  
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "rgba(255, 255, 255, 0.2)";
    handleWallpaperFilesUpload(e.dataTransfer.files);
  });

  // Search Engine Selector click
  document.getElementById("search-engine-trigger").addEventListener("click", (e) => {
    e.stopPropagation();
    const popover = document.getElementById("search-engine-popover");
    popover.style.display = popover.style.display === "none" ? "flex" : "none";
  });
  
  const engineOpts = document.querySelectorAll(".engine-option");
  engineOpts.forEach(opt => {
    opt.addEventListener("click", () => {
      const engine = opt.getAttribute("data-engine");
      settings.searchEngine = engine;
      saveSettingsSync();
      
      document.getElementById("active-engine-icon").innerText = SEARCH_ENGINES_CONFIG[engine].icon;
      toggleSearchEngineInputs(SEARCH_ENGINES_CONFIG[engine]);
      document.getElementById("search-engine-popover").style.display = "none";
      
      // Focus appropriate input
      if (SEARCH_ENGINES_CONFIG[engine].type === "ai") {
        document.getElementById("search-prompt-textarea").focus();
      } else {
        document.getElementById("search-query-input").focus();
      }
    });
  });

  // Search Submit bindings
  document.getElementById("search-submit-btn").addEventListener("click", () => {
    executeSearchSubmit();
  });
  
  const queryInput = document.getElementById("search-query-input");
  queryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearchSubmit();
    }
  });
  queryInput.addEventListener("focus", () => {
    renderRecentSearches();
    if (recentSearches.length > 0) {
      document.getElementById("search-history-popover").style.display = "block";
    }
  });
  
  const promptTextarea = document.getElementById("search-prompt-textarea");
  promptTextarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeSearchSubmit();
    }
  });
  promptTextarea.addEventListener("input", () => {
    // Autogrow height
    promptTextarea.style.height = "auto";
    const height = Math.min(promptTextarea.scrollHeight, 120);
    promptTextarea.style.height = `${height}px`;
  });
  promptTextarea.addEventListener("focus", () => {
    renderRecentSearches();
    if (recentSearches.length > 0) {
      document.getElementById("search-history-popover").style.display = "block";
    }
  });
  
  document.getElementById("clear-search-history").addEventListener("click", () => {
    recentSearches = [];
    Storage.setSync({ recentSearches }, () => {
      renderRecentSearches();
    });
  });

  // Weather Click Opens Detail Card
  document.getElementById("widget-weather").addEventListener("click", (e) => {
    e.stopPropagation();
    const detail = document.getElementById("weather-detail-card");
    detail.style.display = detail.style.display === "none" ? "flex" : "none";
  });
  
  document.addEventListener("click", (e) => {
    const detail = document.getElementById("weather-detail-card");
    const weather = document.getElementById("widget-weather");
    if (detail && !detail.contains(e.target) && !weather.contains(e.target)) {
      detail.style.display = "none";
    }
  });

  // Sidebar & Quick Links Panel triggers
  document.getElementById("sidebar-more-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const panel = document.getElementById("quick-links-panel");
    const isOpen = panel.classList.contains("active");
    toggleQuickLinksPanel(!isOpen);
  });

  document.getElementById("close-ql-panel-btn").addEventListener("click", () => {
    toggleQuickLinksPanel(false);
  });

  document.getElementById("ql-add-link-btn").addEventListener("click", () => {
    addQuickLinkFromInputs();
  });

  // Close QL panel on outside click
  document.addEventListener("click", (e) => {
    const panel = document.getElementById("quick-links-panel");
    const sidebar = document.getElementById("left-sidebar-dock");
    if (panel.classList.contains("active") && !panel.contains(e.target) && !sidebar.contains(e.target)) {
      toggleQuickLinksPanel(false);
    }
  });

  // Zen Mode Toggles
  document.getElementById("zen-toggle-btn").addEventListener("click", () => {
    enterZenMode();
  });
  
  document.getElementById("zen-mode-overlay").addEventListener("click", (e) => {
    // Close Zen mode if clicking anywhere except controls bar
    const bar = document.querySelector(".zen-controls-bar");
    if (!bar.contains(e.target)) {
      exitZenMode();
    }
  });

  // Zen mode ambient sounds loop binding
  document.getElementById("zen-audio-toggle").addEventListener("click", () => {
    isZenSoundPlaying = !isZenSoundPlaying;
    
    const onSvg = document.getElementById("audio-on-svg");
    const offSvg = document.getElementById("audio-off-svg");
    
    if (isZenSoundPlaying) {
      onSvg.style.display = "block";
      offSvg.style.display = "none";
      
      const vol = parseFloat(document.getElementById("zen-volume-slider").value);
      safeSendMessage({ type: "PLAY_AMBIENT_BG", sound: currentZenAmbientSound, volume: vol });
    } else {
      onSvg.style.display = "none";
      offSvg.style.display = "block";
      safeSendMessage({ type: "STOP_AMBIENT_BG" });
    }
  });
  
  const soundBtns = document.querySelectorAll(".sound-select-btn");
  soundBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      soundBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      currentZenAmbientSound = btn.getAttribute("data-sound");
      
      if (isZenSoundPlaying) {
        const vol = parseFloat(document.getElementById("zen-volume-slider").value);
        safeSendMessage({ type: "PLAY_AMBIENT_BG", sound: currentZenAmbientSound, volume: vol });
      }
    });
  });
  
  document.getElementById("zen-volume-slider").addEventListener("input", (e) => {
    const vol = parseFloat(e.target.value);
    if (isZenSoundPlaying) {
      // Update running sound volume
      safeSendMessage({ type: "PLAY_AMBIENT_BG", sound: currentZenAmbientSound, volume: vol });
    }
  });

  // Config Backup Toggles
  document.getElementById("btn-export-settings").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `aura-tab-config-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
  
  document.getElementById("import-trigger-btn").addEventListener("click", () => {
    document.getElementById("input-import-settings").click();
  });
  
  document.getElementById("input-import-settings").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        settings = { ...DEFAULT_CONFIG, ...parsed };
        
        saveSettingsSync();
        applyDesignSystemStyles();
        populateSettingsInputs();
        renderSidebarDock();
        
        alert("Configuration imported successfully!");
      } catch (err) {
        alert("Error parsing configuration file. Make sure it's valid JSON.");
      }
    };
    reader.readAsText(file);
  });
  
  document.getElementById("btn-reset-settings").addEventListener("click", () => {
    if (confirm("Warning: Reset all settings to defaults? This will erase all custom wallpapers, notes, and links.")) {
      Storage.clearAll(() => {
        window.location.reload();
      });
    }
  });
  
  // Keyboard Shortcuts for accessibility
  document.addEventListener("keydown", (e) => {
    // Alt+Z toggles Zen Mode
    if (e.altKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (document.body.classList.contains("zen-mode-active")) {
        exitZenMode();
      } else {
        enterZenMode();
      }
    }
    
    // Alt+N opens new Note composer
    if (e.altKey && e.key.toLowerCase() === "n") {
      e.preventDefault();
      const pane = document.getElementById("quick-tools-panel");
      pane.style.display = "flex";
      // Switch to notes tab
      const tabBtns = document.querySelectorAll(".panel-tab-btn");
      tabBtns.forEach(b => {
        if (b.getAttribute("data-tool") === "notes") b.click();
      });
      document.getElementById("new-note-trigger").click();
    }
    
    // Alt+P starts/pauses Pomodoro timer
    if (e.altKey && e.key.toLowerCase() === "p") {
      e.preventDefault();
      document.getElementById("timer-toggle-btn").click();
    }
  });

  // Widget Library spawn buttons
  document.querySelectorAll(".spawn-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-preset");
      if (preset === "spotify") {
        spawnWidget("spotify", "Spotify Player", "https://open.spotify.com/embed/playlist/37i9dQZF1DX8Ueb1mRm31c");
      } else if (preset === "youtube") {
        spawnWidget("youtube", "YouTube Lo-Fi", "https://www.youtube.com/embed/jfKfPfyJRdk");
      } else if (preset === "calculator") {
        spawnWidget("calculator", "Calculator");
      } else if (preset === "soundboard") {
        spawnWidget("soundboard", "Gentle Soundboard");
      }
    });
  });

  // Custom widget builder creation
  document.getElementById("btn-add-custom-widget").addEventListener("click", () => {
    const nameInput = document.getElementById("widget-builder-name");
    const srcInput = document.getElementById("widget-builder-src");
    const name = nameInput.value.trim();
    const srcRaw = srcInput.value.trim();
    
    if (!srcRaw) {
      alert("Please enter an Iframe URL or Embed Code.");
      return;
    }
    
    const src = parseIframeSrc(srcRaw);
    if (!src) {
      alert("Invalid Iframe URL / Embed Code.");
      return;
    }
    
    spawnWidget("iframe", name || "Custom Widget", src);
    
    nameInput.value = "";
    srcInput.value = "";
  });

  // Initialize built-in Pinterest Downloader
  initPinterestDownloader();
}

async function handleWallpaperFilesUpload(files) {
  const file = files[0];
  if (!file) return;

  try {
    await saveWallpaperFile(file);
    if (cachedWallpaperObjectUrl) {
      URL.revokeObjectURL(cachedWallpaperObjectUrl);
    }
    cachedWallpaperObjectUrl = URL.createObjectURL(file);
    
    settings.bgType = "custom";
    settings.customWallpaperType = isVideoFile(file) ? (file.type || "video/mp4") : (file.type || "image/jpeg");
    settings.customWallpaper = ""; // Clear base64 fallback to conserve sync/local storage
    saveSettingsSync();
    
    // Also clear it in local storage to keep things clean
    Storage.setLocal({ customWallpaper: "" }, () => {
      applyDesignSystemStyles();
      populateSettingsInputs();
      alert("Local wallpaper saved and applied successfully at maximum quality!");
    });
  } catch (e) {
    alert("Failed to save wallpaper: " + e.message);
  }
}

// Right-click context note sync
function initShortcutContextListeners() {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "NOTE_ADDED") {
        renderNotesDashboard();
      }
    });
  }
}

// Built-in Pinterest Downloader implementation
function initPinterestDownloader() {
  const urlInput = document.getElementById("pinterest-url-input");
  const fetchBtn = document.getElementById("pinterest-fetch-btn");
  const loader = document.getElementById("pinterest-loader");
  const previewArea = document.getElementById("pinterest-preview-area");
  const actionsWrap = document.getElementById("pinterest-actions-wrap");
  const setBgBtn = document.getElementById("pinterest-set-bg-btn");
  const downloadBtn = document.getElementById("pinterest-download-btn");
  const emptyPrompt = document.getElementById("pinterest-empty-prompt");

  if (!urlInput || !fetchBtn || !loader || !previewArea || !actionsWrap || !setBgBtn || !downloadBtn || !emptyPrompt) {
    console.warn("Pinterest Downloader UI elements not found.");
    return;
  }

  let fetchedMedia = null;

  async function handleFetch() {
    let pinUrl = urlInput.value.trim();
    if (!pinUrl) {
      alert("Please enter a Pinterest URL.");
      return;
    }

    // Reset UI state
    previewArea.style.display = "none";
    actionsWrap.style.display = "none";
    emptyPrompt.style.display = "none";
    loader.style.display = "flex";
    previewArea.innerHTML = "";
    fetchedMedia = null;

    try {
      // Normalize URL if it is a country-specific Pinterest subdomain
      // e.g. pinterest.ca/pin/123 -> pinterest.com/pin/123
      if (pinUrl.includes("pinterest.") && !pinUrl.includes("pinterest.com")) {
        pinUrl = pinUrl.replace(/pinterest\.[a-z\.]+\/pin\//i, "pinterest.com/pin/");
      }

      const media = await fetchPinterestMedia(pinUrl);
      fetchedMedia = media;

      // Render Preview
      if (media.type === "video") {
        const video = document.createElement("video");
        video.src = media.url;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.maxWidth = "100%";
        video.style.maxHeight = "200px";
        video.style.borderRadius = "8px";
        previewArea.appendChild(video);
        setBgBtn.textContent = "Set as Live Wallpaper";
      } else {
        const img = document.createElement("img");
        img.src = media.url;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "200px";
        img.style.borderRadius = "8px";
        img.style.objectFit = "contain";
        previewArea.appendChild(img);
        setBgBtn.textContent = "Set as Wallpaper";
      }

      loader.style.display = "none";
      previewArea.style.display = "flex";
      actionsWrap.style.display = "flex";
    } catch (err) {
      console.error("Pinterest fetch error:", err);
      loader.style.display = "none";
      emptyPrompt.style.display = "block";
      alert("Failed to fetch Pinterest media: " + err.message);
    }
  }

  fetchBtn.addEventListener("click", handleFetch);
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFetch();
    }
  });



  setBgBtn.addEventListener("click", async () => {
    if (!fetchedMedia) return;

    const originalText = setBgBtn.textContent;
    setBgBtn.textContent = "Downloading & Saving Wallpaper...";
    setBgBtn.disabled = true;

    try {
      const blob = await fetchBlobFromBackground(fetchedMedia.url);

      // Save to IndexedDB
      await saveWallpaperFile(blob);

      // Update settings
      settings.bgType = "custom";
      settings.customWallpaperType = blob.type;
      settings.customWallpaper = ""; // Clear fallback
      saveSettingsSync();

      // Revoke and create new Object URL
      if (cachedWallpaperObjectUrl) {
        URL.revokeObjectURL(cachedWallpaperObjectUrl);
      }
      cachedWallpaperObjectUrl = URL.createObjectURL(blob);

      // Save settings to Local Storage (keeps customWallpaper empty)
      Storage.setLocal({ customWallpaper: "" }, () => {
        applyDesignSystemStyles();
        populateSettingsInputs();
        alert("Pinterest wallpaper saved and applied successfully at maximum quality!");
      });
    } catch (err) {
      console.error("Failed to set wallpaper:", err);
      alert("Failed to set wallpaper: " + err.message);
    } finally {
      setBgBtn.textContent = originalText;
      setBgBtn.disabled = false;
    }
  });

  downloadBtn.addEventListener("click", async () => {
    if (!fetchedMedia) return;

    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = "Downloading...";
    downloadBtn.disabled = true;

    try {
      const blob = await fetchBlobFromBackground(fetchedMedia.url);

      const fileUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = fileUrl;
      const ext = fetchedMedia.type === "video" ? "mp4" : "jpg";
      a.download = `pinterest_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    } catch (err) {
      console.error("Failed to download file:", err);
      alert("Failed to download: " + err.message);
    } finally {
      downloadBtn.textContent = originalText;
      downloadBtn.disabled = false;
    }
  });
}

function fetchBlobFromBackground(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "FETCH_PINTEREST_MEDIA", url: url }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response) {
        reject(new Error("No response from background script"));
        return;
      }
      if (!response.success) {
        reject(new Error(response.error || "Unknown error fetching media"));
        return;
      }

      try {
        // Convert base64 back to Blob
        const binary = atob(response.base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: response.mimeType });
        resolve(blob);
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function fetchPinterestMedia(pinUrl) {
  // Ensure http/https prefix
  if (!/^https?:\/\//i.test(pinUrl)) {
    pinUrl = "https://" + pinUrl;
  }

  // Fetch the HTML from the background script to bypass CORS and avoid Pinterest login redirects
  const htmlResult = await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "FETCH_PINTEREST_HTML", url: pinUrl }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response) {
        reject(new Error("No response from background script"));
        return;
      }
      if (!response.success) {
        reject(new Error(response.error || "Failed to fetch HTML page"));
        return;
      }
      resolve(response.html);
    });
  });

  // Helper to decode escaped characters, HTML entities, and Unicode escapes
  function decodeHtmlContent(str) {
    return str
      .replace(/\\u002F/gi, "/")
      .replace(/\\u0026/gi, "&")
      .replace(/\\\/|\\/g, "/") // convert escaped slashes \/ or backslashes to /
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  const cleanHtml = decodeHtmlContent(htmlResult);

  // 1. Extract and sort video URLs
  let videoUrls = [];
  
  // Match standard mp4 formats in cleanHtml (handling any query parameters)
  const mp4Regex = /https?:\/\/[a-z0-9.]*?pinimg\.com\/videos\/[^"'\s]*?\.mp4[^"'\s]*?/gi;
  const mp4Matches = cleanHtml.match(mp4Regex) || [];
  videoUrls.push(...mp4Matches);

  // Match in meta tags
  const ogVideoMatch = cleanHtml.match(/<meta[^>]+content=["'](https?:\/\/[a-z0-9.]*?pinimg\.com\/videos\/[^"']+)["']/i) ||
                       cleanHtml.match(/<meta[^>]*property=["']og:video["'][^>]*content=["']([^"']+)["']/i) ||
                       cleanHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:video["']/i);
  if (ogVideoMatch) {
    videoUrls.push(ogVideoMatch[1] || ogVideoMatch[0]);
  }

  // Match contentUrl from ld+json
  const ldVideoMatch = cleanHtml.match(/"contentUrl"\s*:\s*"([^"]+)"/i);
  if (ldVideoMatch) {
    videoUrls.push(ldVideoMatch[1]);
  }

  // Clean trailing characters (like quotes or backslashes) from URLs
  videoUrls = videoUrls.map(url => {
    return url ? url.replace(/[\\"' >].*$/, "") : null;
  });

  // Deduplicate and clean video URLs
  videoUrls = [...new Set(videoUrls)].filter(u => u && u.startsWith("http"));
  
  // Sort videos by resolution/quality
  if (videoUrls.length > 0) {
    videoUrls.sort((a, b) => {
      const score = url => {
        if (url.includes("1080p") || url.includes("_1080")) return 100;
        if (url.includes("720p") || url.includes("_720")) return 80;
        if (url.includes("h264") || url.includes("_h264")) return 60;
        if (url.includes("480p") || url.includes("_480")) return 40;
        return 0;
      };
      return score(b) - score(a);
    });
  }

  // 2. Extract and sort image URLs
  let imageUrls = [];

  // Match standard image formats in cleanHtml
  const imgMatches = cleanHtml.match(/https?:\/\/[a-z0-9.]*?pinimg\.com\/[^"'\s]*?\.(?:jpg|jpeg|png|webp)[^"'\s]*?/gi) || [];
  imageUrls.push(...imgMatches);

  // Match in meta tags
  const ogImageMatch = cleanHtml.match(/<meta[^>]+content=["'](https?:\/\/[a-z0-9.]*?pinimg\.com\/[^"']+)["']/i) ||
                       cleanHtml.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                       cleanHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogImageMatch) {
    imageUrls.push(ogImageMatch[1] || ogImageMatch[0]);
  }

  // Match thumbnailUrl from ld+json
  const ldImageMatch = cleanHtml.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/i);
  if (ldImageMatch) {
    imageUrls.push(ldImageMatch[1]);
  }

  // Clean trailing characters from URLs
  imageUrls = imageUrls.map(url => {
    return url ? url.replace(/[\\"' >].*$/, "") : null;
  });

  // Deduplicate and clean image URLs (exclude static webapp assets)
  imageUrls = [...new Set(imageUrls)].filter(u => u && u.startsWith("http") && !u.includes("/webapp/"));

  let hdImageUrl = null;

  if (imageUrls.length > 0) {
    // Sort images so that higher resolution directories are checked first
    imageUrls.sort((a, b) => {
      const score = url => {
        if (url.includes("/originals/")) return 100;
        if (url.includes("/736x/")) return 80;
        if (url.includes("/564x/")) return 60;
        if (url.includes("/474x/")) return 40;
        if (url.includes("/236x/")) return 20;
        return 0;
      };
      return score(b) - score(a);
    });

    const bestImg = imageUrls[0];
    // Boost image quality to originals
    hdImageUrl = bestImg.replace(/\/(?:136x136|236x|474x|564x|736x)\//, "/originals/");
    try {
      // Check if originals is valid (fast validation) via background script to bypass CORS
      const checkHd = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "CHECK_URL_HEAD", url: hdImageUrl }, (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            resolve({ ok: false });
          } else {
            resolve(response);
          }
        });
      });
      if (!checkHd.ok) {
        hdImageUrl = bestImg; // fallback
      }
    } catch (err) {
      console.warn("HD image verification failed, falling back:", err);
      hdImageUrl = bestImg;
    }
  }

  if (videoUrls.length > 0) {
    let videoUrl = videoUrls[0];
    videoUrl = videoUrl.replace(/&amp;/g, "&");
    return {
      type: "video",
      url: videoUrl,
      thumbnail: hdImageUrl || imageUrls[0]
    };
  } else if (imageUrls.length > 0) {
    return {
      type: "image",
      url: hdImageUrl || imageUrls[0]
    };
  } else {
    throw new Error("Could not find any media content on this Pinterest page. Make sure it is a direct Pin link.");
  }
}

// ==========================================================================
// New Widgets: Todo List and Daily Quotes
// ==========================================================================

const INSPIRED_QUOTES = [
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Make it simple, but significant.", author: "Don Draper" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Programming is the art of telling another human what the computer should do.", author: "Donald Knuth" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Technology is best when it brings people together.", author: "Matt Mullenweg" },
  { text: "One man's constant is another man's variable.", author: "Alan Perlis" },
  { text: "Quality is a product of a conflict between design and content.", author: "Yann LeCun" },
  { text: "An ounce of prevention is worth a pound of cure.", author: "Benjamin Franklin" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
  { text: "Every great developer you know got there by solving problems they were unqualified to solve.", author: "Patrick McKenzie" },
  { text: "Do not search for the truth, just be willing to see it.", author: "Zen Proverb" },
  { text: "The function of good software is to make the complex appear simple.", author: "Grady Booch" },
  { text: "Computers are good at following instructions, but not at reading your mind.", author: "Donald Knuth" },
  { text: "Perfect is the enemy of good.", author: "Voltaire" }
];

// --- Todo List Widget ---
function renderTodoList() {
  const container = document.getElementById("todo-items-list");
  if (!container) return;
  container.innerHTML = "";
  
  const list = settings.todoList || [];
  if (list.length === 0) {
    container.innerHTML = `<div class="todo-empty" style="text-align:center; font-size:12px; opacity:0.5; padding: 12px 0;">No tasks for today!</div>`;
    return;
  }
  
  list.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = `todo-item ${item.completed ? "completed" : ""}`;
    div.innerHTML = `
      <div class="todo-item-left">
        <input type="checkbox" class="todo-checkbox" ${item.completed ? "checked" : ""} data-idx="${idx}">
        <span class="todo-text">${escapeHtml(item.text)}</span>
      </div>
      <button class="todo-delete-btn" data-idx="${idx}">&times;</button>
    `;
    container.appendChild(div);
  });
  
  // Bind item change events
  container.querySelectorAll(".todo-checkbox").forEach(chk => {
    chk.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      if (settings.todoList && settings.todoList[idx]) {
        settings.todoList[idx].completed = e.target.checked;
        saveSettingsSync();
        renderTodoList();
      }
    });
  });
  
  // Bind delete events
  container.querySelectorAll(".todo-delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.idx);
      if (settings.todoList) {
        settings.todoList.splice(idx, 1);
        saveSettingsSync();
        renderTodoList();
      }
    });
  });
}

function initTodoWidgetEvents() {
  const form = document.getElementById("todo-add-form");
  if (!form) return;
  
  // Prevent duplicate bindings
  if (form.dataset.bound) return;
  form.dataset.bound = "true";
  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("todo-input");
    const text = input.value.trim();
    if (!text) return;
    
    if (!settings.todoList) settings.todoList = [];
    settings.todoList.push({ text, completed: false });
    saveSettingsSync();
    renderTodoList();
    input.value = "";
  });
}

// Simple HTML escaping helper
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// --- Inspiration Quote Widget ---
function initQuoteWidget() {
  const refreshBtn = document.getElementById("quote-refresh-btn");
  if (refreshBtn && !refreshBtn.dataset.bound) {
    refreshBtn.dataset.bound = "true";
    refreshBtn.addEventListener("click", loadRandomQuote);
  }
  loadRandomQuote();
}

function loadRandomQuote() {
  const textEl = document.getElementById("quote-text");
  const authorEl = document.getElementById("quote-author");
  if (!textEl || !authorEl) return;
  
  const randomIndex = Math.floor(Math.random() * INSPIRED_QUOTES.length);
  const quote = INSPIRED_QUOTES[randomIndex];
  
  textEl.innerText = `"${quote.text}"`;
  authorEl.innerText = `— ${quote.author}`;
}
