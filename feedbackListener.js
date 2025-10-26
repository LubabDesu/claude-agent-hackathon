(() => {
  console.log("🧠 Feedback listener initialized...");

  // Observe DOM changes (LeetCode updates the result dynamically)
  const observer = new MutationObserver(() => {
    const resultPanel = document.querySelector('[data-cy="result-status"]');
    if (!resultPanel) return;

    const resultText = resultPanel.innerText?.toLowerCase();

    if (
      resultText.includes("wrong answer") ||
      resultText.includes("runtime error") ||
      resultText.includes("time limit") ||
      resultText.includes("compile error")
    ) {
      // Avoid triggering multiple times for the same result
      if (window.lastPromptTime && Date.now() - window.lastPromptTime < 10000) return;
      window.lastPromptTime = Date.now();

      const wantHelp = confirm("❌ Test case failed. Would you like AI help debugging this?");
      if (wantHelp) {
        // Store the current code and problem info for later analysis
        const title = document.querySelector('div[data-cy="question-title"]')?.innerText?.trim();
        const editorLines = document.querySelectorAll(".view-lines .view-line");
        const code = Array.from(editorLines).map(line => line.textContent).join("\n");

        const failureData = {
          title,
          code,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        };

        localStorage.setItem("latestFailure", JSON.stringify(failureData));

        alert("🧩 Got it! Your failed attempt was saved. The AI agent will help you shortly.");
        // (Later: send this data to your AI analysis logic)
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();

