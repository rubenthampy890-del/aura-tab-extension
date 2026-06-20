/* Aura Tab - Background Service Worker (Manifest V3) */

// Helper to format current date as YYYY-MM-DD
const getTodayDateString = () => new Date().toISOString().split("T")[0];

// Default durations in minutes
const getTimerDuration = (mode) => {
  if (mode === "pomodoro") return 25;
  if (mode === "shortBreak") return 5;
  if (mode === "longBreak") return 15;
  return 25;
};

// Set up timer and start alarm
async function startTimerAlarm(mode, customDuration = null) {
  const durationInMinutes = customDuration || getTimerDuration(mode);
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
    duration: durationInMinutes
  };
  
  await chrome.storage.local.set({ timerState });
  return timerState;
}

// Alarm Listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "pomodoroTimer") {
    // Play end sound
    await playSoundEffect("end");
    
    // Retrieve current timer state
    const result = await chrome.storage.local.get("timerState");
    const state = result.timerState;
    if (!state || !state.isRunning) return;
    
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
    
    const nextDuration = customDurations[nextMode];
    const newState = {
      mode: nextMode,
      isRunning: false,
      timeLeft: nextDuration * 60,
      endTime: 0,
      duration: nextDuration
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
    // Reset daily Pomodoro stats at midnight
    await chrome.storage.local.set({ dailyStats: { date: getTodayDateString(), count: 0 } });
  }
});

// Sound Playing Controller (Establishing Offscreen Document)
async function playSoundEffect(soundType) {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: "PLAY_SOUND", source: soundType });
}

// Nature sounds manager
async function playAmbientSound(soundType, volume = 0.5) {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: "PLAY_AMBIENT", sound: soundType, volume: volume });
}

async function stopAmbientSound() {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: "STOP_AMBIENT" });
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
      
      const duration = customDurations[notificationId];
      const state = await startTimerAlarm(notificationId, duration);
      // Play start sound
      await playSoundEffect("start");
      // Notify active newtab tabs that timer has started
      chrome.runtime.sendMessage({ type: "TIMER_UPDATED", state: state });
    });
  }
  chrome.notifications.clear(notificationId);
});

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
      const state = message.timerState;
      const timeLeft = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
      const pausedState = {
        ...state,
        isRunning: false,
        timeLeft: timeLeft,
        endTime: 0
      };
      await chrome.storage.local.set({ timerState: pausedState });
      sendResponse({ status: "Timer paused", state: pausedState });
    })();
    return true;
  }
  
  if (message.command === "resumeTimer") {
    (async () => {
      const state = message.timerState;
      const delayInMinutes = state.timeLeft / 60;
      
      await chrome.alarms.clear("pomodoroTimer");
      chrome.alarms.create("pomodoroTimer", { delayInMinutes: delayInMinutes });
      
      const resumedState = {
        ...state,
        isRunning: true,
        endTime: Date.now() + state.timeLeft * 1000
      };
      await chrome.storage.local.set({ timerState: resumedState });
      sendResponse({ status: "Timer resumed", state: resumedState });
    })();
    return true;
  }
  
  if (message.command === "resetTimer") {
    (async () => {
      await chrome.alarms.clear("pomodoroTimer");
      const duration = message.duration || getTimerDuration(message.mode);
      const state = {
        mode: message.mode,
        isRunning: false,
        timeLeft: duration * 60,
        endTime: 0,
        duration: duration
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
        const response = await fetch(message.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (!response.ok) {
          throw new Error("CDN response status " + response.status);
        }
        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "application/octet-stream";

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
        const response = await fetch(message.url, {
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (!response.ok) {
          throw new Error("HTML response status " + response.status);
        }
        const html = await response.text();
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
        const response = await fetch(message.url, {
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
      chrome.runtime.sendMessage({ type: "NOTE_ADDED", note: newNote });
      
    } catch (error) {
      console.error("Aura Notes context menu error:", error);
    }
  }
});

// Installation & Updates Initialization
chrome.runtime.onInstalled.addListener(() => {
  console.log("Aura Tab - Custom Glass Dashboard installed successfully.");
  
  // Set default timer state
  const defaultTimer = {
    mode: "pomodoro",
    isRunning: false,
    timeLeft: 25 * 60,
    endTime: 0,
    duration: 25
  };
  chrome.storage.local.set({ timerState: defaultTimer });
  
  // Set default daily stats
  chrome.storage.local.set({ dailyStats: { date: getTodayDateString(), count: 0 } });
  
  // Create alarm to reset stats daily at midnight
  chrome.alarms.create("dailyReset", {
    when: new Date().setHours(24, 0, 0, 0),
    periodInMinutes: 1440
  });
  
  // Create selection text context menu
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "saveToAuraNotes",
      title: "Save selection to Aura Notes",
      contexts: ["selection"]
    });
  });
});
