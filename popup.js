document.getElementById("runButton").addEventListener("click", async () => {
  const result = document.getElementById("resultText");
  result.textContent = "Running...";

  // Example: change background color of current page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      document.body.style.backgroundColor = "#FFF3CD";
    },
  });

  setTimeout(() => {
    result.textContent = "✅ Action complete!";
  }, 500);
});
