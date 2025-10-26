// Runs whenever a tab is updated (navigated, refreshed, etc.)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("leetcode.com/problems/")) {
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
});
