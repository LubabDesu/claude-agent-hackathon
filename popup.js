document.getElementById("toggleTheme").addEventListener("click", async () => {
  const result = document.getElementById("resultText");
  result.textContent = "Toggling theme...";

  // Find the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Inject a script that toggles dark/light mode on the current page
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const body = document.body;
      const isDark = body.classList.toggle("dark-mode");

      // Apply or remove dark mode styles
      if (isDark) {
        body.style.backgroundColor = "#111";
        body.style.color = "#eee";
      } else {
        body.style.backgroundColor = "";
        body.style.color = "";
      }

      return isDark;
    },
  });

  // Update message
  result.textContent = "✅ Theme toggled!";
});
