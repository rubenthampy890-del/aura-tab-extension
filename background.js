/* Aura Tab - Background Service Worker (Manifest V3) */

// Helper to format the local date as YYYY-MM-DD
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const VALID_TIMER_MODES = new Set(["pomodoro", "shortBreak", "longBreak"]);
const normalizeTimerMode = (mode) => VALID_TIMER_MODES.has(mode) ? mode : "pomodoro";
const sanitizeDuration = (value, fallback) => {
  const duration = Number(value);
  return Number.isFinite(duration) ? Math.min(120, Math.max(1, duration)) : fallback;
};

// Default durations in minutes
const getTimerDuration = (mode) => {
  if (mode === "pomodoro") return 25;
  if (mode === "shortBreak") return 5;
  if (mode === "longBreak") return 15;
  return 25;
};

// Set up timer and start alarm
async function startTimerAlarm(mode, customDuration = null) {
  mode = normalizeTimerMode(mode);
  const durationInMinutes = sanitizeDuration(customDuration, getTimerDuration(mode));
  const durationInSeconds = durationInMinutes * 60;
  
  // Clear any existing alarms
  await chrome.alarms.clear("pomodoroTimer");
  
  // Create alarm
  chrome.alarms.create("pomodoroTimer", { delayInMinutes: durationInMinutes });
  
  const timerState = {
    mode: mode,
    isRunning: true,
    timeLeft: durationInSeconds,
    endTime: Date.now() + durationInSeconds * 1000,
    duration: durationInMinutes,
    isPaused: false
  };
  
  await chrome.storage.local.set({ timerState });
  return timerState;
}

// Alarm Listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "pomodoroTimer") {
    // Retrieve current timer state
    const result = await chrome.storage.local.get("timerState");
    const state = result.timerState;
    if (!state || !state.isRunning) return;

    await playSoundEffect("end");
    
    // Fetch custom duration preferences if they exist
    const settingsResult = await chrome.storage.sync.get("settings");
    const settings = settingsResult.settings || {};
    
    const customDurations = settings.pomodoroDurations || {
      pomodoro: 25,
      shortBreak: 5,
      longBreak: 15
    };
    
    let nextMode = "pomodoro";
    let title = "";
    let message = "";
    let btnText = "";
    
    if (state.mode === "pomodoro") {
      // Increment completed stats
      const statsResult = await chrome.storage.local.get("dailyStats");
      const today = getTodayDateString();
      let count = 1;
      
      if (statsResult.dailyStats && statsResult.dailyStats.date === today) {
        count = statsResult.dailyStats.count + 1;
      }
      
      await chrome.storage.local.set({ dailyStats: { date: today, count: count } });
      
      const isLongBreak = count % 4 === 0;
      nextMode = isLongBreak ? "longBreak" : "shortBreak";
      title = "Focus Session Completed!";
      message = isLongBreak ? "Amazing focus! Time for a longer break." : "Great job! Take a short break.";
      btnText = isLongBreak ? "Start Long Break" : "Start Short Break";
    } else {
      nextMode = "pomodoro";
      title = "Break Over!";
      message = "Ready to get back to work?";
      btnText = "Start Focus Session";
    }
    
    const nextDuration = sanitizeDuration(customDurations[nextMode], getTimerDuration(nextMode));
    const newState = {
      mode: nextMode,
      isRunning: false,
      timeLeft: nextDuration * 60,
      endTime: 0,
      duration: nextDuration,
      isPaused: false
    };
    
    await chrome.storage.local.set({ timerState: newState });
    
    // Create Desktop Notification
    chrome.notifications.create(nextMode, {
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: title,
      message: message,
      buttons: [{ title: btnText }],
      priority: 2
    });
  } else if (alarm.name === "dailyReset") {
    // Reset daily Pomodoro stats at local midnight and schedule the next reset.
    await chrome.storage.local.set({ dailyStats: { date: getTodayDateString(), count: 0 } });
    await ensureDailyResetAlarm(true);
  }
});

// Sound Playing Controller (Establishing Offscreen Document)
async function playSoundEffect(soundType) {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: "PLAY_SOUND", source: soundType }).catch(() => {});
}

// Nature sounds manager
async function playAmbientSound(soundType, volume = 0.5) {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: "PLAY_AMBIENT", sound: soundType, volume: volume }).catch(() => {});
}

async function stopAmbientSound() {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: "STOP_AMBIENT" }).catch(() => {});
}

async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) return;
  
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
    justification: "Synthesizing and playing alarms and Zen Mode audio loops"
  });
}

// Notification button click handler
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0 && (notificationId === "pomodoro" || notificationId === "shortBreak" || notificationId === "longBreak")) {
    // Fetch custom durations to start the next timer correctly
    chrome.storage.sync.get("settings", async (result) => {
      const settings = result.settings || {};
      const customDurations = settings.pomodoroDurations || {
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15
      };
      
      const duration = sanitizeDuration(customDurations[notificationId], getTimerDuration(notificationId));
      const state = await startTimerAlarm(notificationId, duration);
      // Play start sound
      await playSoundEffect("start");
      // Notify active newtab tabs that timer has started
      chrome.runtime.sendMessage({ type: "TIMER_UPDATED", state: state }).catch(() => {});
    });
  }
  chrome.notifications.clear(notificationId);
});

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const MAX_PINTEREST_HTML_BYTES = 5 * 1024 * 1024;
const PINTEREST_PAGE_HOSTS = [
  "pinterest.com", "pinterest.co.uk", "pinterest.ca", "pinterest.de",
  "pinterest.fr", "pinterest.es", "pinterest.it", "pinterest.co"
];

function parseHttpsUrl(rawUrl) {
  const url = new URL(String(rawUrl || ""));
  if (url.protocol !== "https:") throw new Error("Only HTTPS URLs are supported");
  return url;
}

function assertPinterestPageUrl(rawUrl) {
  const url = parseHttpsUrl(rawUrl);
  const host = url.hostname.toLowerCase();
  const allowed = host === "pin.it" || PINTEREST_PAGE_HOSTS.some(domain => host === domain || host.endsWith("." + domain));
  if (!allowed) throw new Error("Only Pinterest page URLs are allowed");
  return url.href;
}

function assertPinterestMediaUrl(rawUrl) {
  const url = parseHttpsUrl(rawUrl);
  const host = url.hostname.toLowerCase();
  if (host !== "pinimg.com" && !host.endsWith(".pinimg.com")) {
    throw new Error("Only Pinterest media URLs are allowed");
  }
  return url.href;
}

// Runtime Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "startTimer") {
    (async () => {
      const state = await startTimerAlarm(message.mode, message.duration);
      sendResponse({ status: "Timer started", state: state });
    })();
    return true; // Keep message channel open for async response
  }
  
  if (message.command === "pauseTimer") {
    (async () => {
      await chrome.alarms.clear("pomodoroTimer");
      const state = message.timerState || {};
      const timeLeft = Math.max(0, Math.floor((Number(state.endTime) - Date.now()) / 1000));
      const pausedState = {
        ...state,
        isRunning: false,
        timeLeft: timeLeft,
        endTime: 0,
        isPaused: timeLeft > 0
      };
      await chrome.storage.local.set({ timerState: pausedState });
      sendResponse({ status: "Timer paused", state: pausedState });
    })();
    return true;
  }
  
  if (message.command === "resumeTimer") {
    (async () => {
      const state = message.timerState || {};
      const timeLeft = Math.max(1, Number(state.timeLeft) || 1);
      const delayInMinutes = timeLeft / 60;
      
      await chrome.alarms.clear("pomodoroTimer");
      chrome.alarms.create("pomodoroTimer", { delayInMinutes: delayInMinutes });
      
      const resumedState = {
        ...state,
        mode: normalizeTimerMode(state.mode),
        isRunning: true,
        isPaused: false,
        timeLeft,
        endTime: Date.now() + timeLeft * 1000
      };
      await chrome.storage.local.set({ timerState: resumedState });
      sendResponse({ status: "Timer resumed", state: resumedState });
    })();
    return true;
  }
  
  if (message.command === "resetTimer") {
    (async () => {
      await chrome.alarms.clear("pomodoroTimer");
      const mode = normalizeTimerMode(message.mode);
      const duration = sanitizeDuration(message.duration, getTimerDuration(mode));
      const state = {
        mode,
        isRunning: false,
        timeLeft: duration * 60,
        endTime: 0,
        duration: duration,
        isPaused: false
      };
      await chrome.storage.local.set({ timerState: state });
      sendResponse({ status: "Timer reset", state: state });
    })();
    return true;
  }
  
  if (message.command === "getPermission") {
    chrome.notifications.getPermissionLevel((level) => {
      sendResponse(level);
    });
    return true;
  }
  
  if (message.type === "GET_TABS") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      sendResponse(tabs);
    });
    return true;
  }
  
  if (message.type === "PLAY_SOUND_BG") {
    (async () => {
      await playSoundEffect(message.sound);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (message.type === "PLAY_AMBIENT_BG") {
    (async () => {
      await playAmbientSound(message.sound, message.volume);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (message.type === "STOP_AMBIENT_BG") {
    (async () => {
      await stopAmbientSound();
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.type === "FETCH_PINTEREST_MEDIA") {
    (async () => {
      try {
        const mediaUrl = assertPinterestMediaUrl(message.url);
        const response = await fetch(mediaUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (!response.ok) {
          throw new Error("CDN response status " + response.status);
        }
        const declaredLength = Number(response.headers.get("content-length")) || 0;
        if (declaredLength > MAX_MEDIA_BYTES) {
          throw new Error("Media file is larger than the 50 MB safety limit");
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_MEDIA_BYTES) {
          throw new Error("Media file is larger than the 50 MB safety limit");
        }
        const contentType = response.headers.get("content-type") || "application/octet-stream";
        if (!contentType.startsWith("image/") && !contentType.startsWith("video/") && contentType !== "application/octet-stream") {
          throw new Error("Pinterest response was not an image or video");
        }

        // Convert arrayBuffer to base64 securely
        let binary = "";
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
          binary += String.fromCharCode.apply(null, chunk);
        }
        const base64 = btoa(binary);

        sendResponse({ success: true, base64: base64, mimeType: contentType });
      } catch (err) {
        console.error("Fetch background error:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open
  }

  if (message.type === "FETCH_PINTEREST_HTML") {
    (async () => {
      try {
        const pageUrl = assertPinterestPageUrl(message.url);
        const response = await fetch(pageUrl, {
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (!response.ok) {
          throw new Error("HTML response status " + response.status);
        }
        const declaredLength = Number(response.headers.get("content-length")) || 0;
        if (declaredLength > MAX_PINTEREST_HTML_BYTES) {
          throw new Error("Pinterest page was unexpectedly large");
        }
        const html = await response.text();
        if (new TextEncoder().encode(html).byteLength > MAX_PINTEREST_HTML_BYTES) {
          throw new Error("Pinterest page was unexpectedly large");
        }
        sendResponse({ success: true, html: html, finalUrl: response.url });
      } catch (err) {
        console.error("Fetch HTML background error:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open
  }

  if (message.type === "CHECK_URL_HEAD") {
    (async () => {
      try {
        const mediaUrl = assertPinterestMediaUrl(message.url);
        const response = await fetch(mediaUrl, {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        sendResponse({ success: true, ok: response.ok, status: response.status });
      } catch (err) {
        console.error("HEAD request background error:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open
  }
});

// Save highlighted text to quick notes (Context Menu)
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "saveToAuraNotes" && info.selectionText) {
    try {
      const noteId = `note_${Date.now()}`;
      const titleLimit = 40;
      let title = info.selectionText.trim();
      if (title.length > titleLimit) {
        title = title.substring(0, titleLimit) + "...";
      }
      
      const newNote = {
        id: noteId,
        title: title,
        content: info.selectionText.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store in storage.local
      await chrome.storage.local.set({ [noteId]: newNote });
      console.log("Aura Notes: Selection saved successfully", newNote);
      
      // Notify any active dashboards to refresh notes
      chrome.runtime.sendMessage({ type: "NOTE_ADDED", note: newNote }).catch(() => {});
      
    } catch (error) {
      console.error("Aura Notes context menu error:", error);
    }
  }
});

// Installation & Updates Initialization
async function ensureDailyResetAlarm(force = false) {
  if (!force) {
    const existing = await chrome.alarms.get("dailyReset");
    if (existing) return;
  } else {
    await chrome.alarms.clear("dailyReset");
  }

  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0);
  await chrome.alarms.create("dailyReset", { when: nextMidnight.getTime() });
}

async function initializeExtensionState() {
  const stored = await chrome.storage.local.get(["timerState", "dailyStats"]);
  const updates = {};

  if (!stored.timerState) {
    updates.timerState = {
      mode: "pomodoro",
      isRunning: false,
      isPaused: false,
      timeLeft: 25 * 60,
      endTime: 0,
      duration: 25
    };
  } else if (typeof stored.timerState.isPaused !== "boolean") {
    const state = stored.timerState;
    updates.timerState = {
      ...state,
      isPaused: !state.isRunning && Number(state.timeLeft) < Number(state.duration) * 60
    };
  }

  if (!stored.dailyStats) {
    updates.dailyStats = { date: getTodayDateString(), count: 0 };
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
  await ensureDailyResetAlarm();
}

chrome.runtime.onInstalled.addListener(() => {
  initializeExtensionState().catch(error => console.error("Aura initialization failed:", error));

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "saveToAuraNotes",
      title: "Save selection to Aura Notes",
      contexts: ["selection"]
    });
  });
});

chrome.runtime.onStartup.addListener(() => {
  initializeExtensionState().catch(error => console.error("Aura startup initialization failed:", error));
});

// Service workers and alarms may be restarted independently of the browser.
initializeExtensionState().catch(error => console.error("Aura background initialization failed:", error));
