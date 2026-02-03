// Set up a repeating alarm every minute

//set up chrome event to trigger when ran for first time
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("timerAlarm", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "timerAlarm") {
        // check if its a new day to reset timer
        const now = new Date();
        const lastResetDateKey = 'lastResetDate';

        chrome.storage.local.get([lastResetDateKey], (data) => {
            const lastResetDate = data[lastResetDateKey] ? new Date(data[lastResetDateKey]) : null;
            if (!lastResetDate || now.toDateString() !== lastResetDate.toDateString()) {
                // It's a new day, reset timer
                chrome.storage.local.set({ timerStart: null, timerElapsed: 0, [lastResetDateKey]: now.toISOString() }, () => {
                    console.log("Timer reset for new day");
                });
            }
        });
        

    }
});




// Listen for the alarm and run your timer logic
// Global timer state
let timerInterval = null;
let timerStart = null;
let timerElapsed = 0;
let subscribed = false;
// Load timer state from storage on startup
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['timerStart', 'timerElapsed'], (data) => {
        timerStart = data.timerStart || null;
        timerElapsed = data.timerElapsed || 0;

    });
});

// Helper to start the timer
function startTimerInternal() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = timerElapsed + (timerStart ? (now - timerStart) : 0);
        chrome.storage.local.set({ timerElapsed: elapsed });
        //send updates to popup or content scripts
        if (subscribed) {
         chrome.runtime.sendMessage({ event: "timerUpdate", elapsed: elapsed,running:!!timerStart });
        }

    // Update every second
    // Changed to 10 seconds to see if i still get error
    }, 1000);
}

// Helper to stop the timer
function stopTimerInternal() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Listen for messages to control the timer
chrome.runtime.onMessage.addListener((data) => {
    switch(data.event) {
        case "onStart":
            if (!timerStart) {
                timerStart = Date.now();
                chrome.storage.local.set({ timerStart: timerStart });
                startTimerInternal();
            }
            break;

        case "onStop":
            stopTimerInternal();
            if (timerStart) {
                timerElapsed += Date.now() - timerStart;
                timerStart = null;
                chrome.storage.local.set({ timerElapsed: timerElapsed, timerStart: null });
            }
            break;
        case "subscribe":
            // Send current timer state to the new subscriber
            subscribed = true;
            const now = Date.now();
            const elapsed = timerElapsed + (timerStart ? (now - timerStart) : 0);
            chrome.runtime.sendMessage({ event: "timerUpdate", elapsed: elapsed,running:!!timerStart });
            break;
        case "unsubscribe":
            subscribed = false;
            console.log("Unsubscribed from timer updates");
            break;
    }
})


