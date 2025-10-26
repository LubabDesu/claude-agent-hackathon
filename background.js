// // Runs whenever a tab is updated (navigated, refreshed, etc.)
// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   if (changeInfo.status === "complete" && tab.url.includes("leetcode.com/problems/")) {
//     console.log("Detected LeetCode problem page:", tab.url);

//     // Inject content script once page is fully loaded
//     await chrome.scripting.executeScript({
//       target: { tabId },
//       files: ["content.js"],
//     });

//     // Then re-inject periodically (every 30 seconds)
//     const intervalId = setInterval(async () => {
//       chrome.tabs.get(tabId, async (updatedTab) => {
//         if (!updatedTab || !updatedTab.url.includes("leetcode.com/problems/")) {
//           clearInterval(intervalId);
//           return;
//         }
//         await chrome.scripting.executeScript({
//           target: { tabId },
//           files: ["content.js"],
//         });
//       });
//     }, 30000); // every 30s
//   }
// });

// background.js
// Injects content.js on page load (as you had) and listens for failure messages to open popup.

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === "complete" && tab?.url && tab.url.includes("leetcode.com/problems/")) {
      console.log("Detected LeetCode problem page:", tab.url);

      // Inject content script once page is fully loaded
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });

      // Then re-inject periodically (every 30 seconds)
      const intervalId = setInterval(async () => {
        chrome.tabs.get(tabId, async (updatedTab) => {
          if (!updatedTab || !updatedTab.url.includes("leetcode.com/problems/")) {
            clearInterval(intervalId);
            return;
          }
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"],
          });
        });
      }, 30000); // every 30s
    }
  } catch (err) {
    console.error("background.onUpdated error:", err);
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "LC_FAILURE_DETECTED") return;

  const failureData = message.data || {};
  console.log("background received LC_FAILURE_DETECTED:", failureData);

  // Persist the last failure to chrome.storage.local (so popup can read it)
  chrome.storage.local.set({ lastFailure: failureData }, () => {
    if (chrome.runtime.lastError) {
      console.warn("chrome.storage.local.set error:", chrome.runtime.lastError);
    } else {
      console.log("lastFailure saved to chrome.storage.local");
    }

    // Try to open the popup automatically
    try {
      // openPopup takes a callback — check for runtime.lastError in the callback
      chrome.action.openPopup(() => {
        if (chrome.runtime.lastError) {
          console.warn("chrome.action.openPopup failed:", chrome.runtime.lastError.message);
          // Fallback: set a badge so user notices the extension
          try {
            chrome.action.setBadgeText({ text: "1" });
            chrome.action.setBadgeBackgroundColor({ color: "#ea580c" });
          } catch (e) {
            // ignore
          }
        } else {
          // Clear badge since popup is opened
          try { chrome.action.setBadgeText({ text: "" }); } catch (e) {}
        }
      });
    } catch (err) {
      console.warn("openPopup exception, fallback to badge", err);
      try {
        chrome.action.setBadgeText({ text: "1" });
        chrome.action.setBadgeBackgroundColor({ color: "#ea580c" });
      } catch (e) {}
    }

    // Also send a runtime message so popup (if already open) can update immediately
    chrome.runtime.sendMessage({ type: "LC_FAILURE_BROADCAST", data: failureData }, () => {});
  });

  // optional: async response
  // sendResponse({ ok: true });
  // return true;
});

