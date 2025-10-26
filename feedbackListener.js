(() => {
  console.log("🧠 Feedback listener initialized...");

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
      // Prevent multiple triggers
      if (window.lastPromptTime && Date.now() - window.lastPromptTime < 5000) return;
      window.lastPromptTime = Date.now();

      // Collect failure data
      const title = document.querySelector('div[data-cy="question-title"]')?.innerText?.trim();
      const editorLines = document.querySelectorAll(".view-lines .view-line");
      const code = Array.from(editorLines).map(line => line.textContent).join("\n");

      const failureData = {
        title,
        code,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      console.log("📩 Sending failure data to popup:", failureData);

      chrome.runtime.sendMessage({
        type: "leetcode_failure",
        payload: failureData
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
