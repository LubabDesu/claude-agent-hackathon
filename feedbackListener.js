(() => {
  console.log("feedbackListener.js loaded!");

  const observer = new MutationObserver(() => {
    const resultPanel = document.querySelector('[data-cy="result-status"]');

    if (resultPanel) {
      console.log("Result detected:", resultPanel.innerText);

      const resultText = resultPanel.innerText.toLowerCase();

      if (
        resultText.includes("wrong answer") ||
        resultText.includes("runtime error") ||
        resultText.includes("time limit") ||
        resultText.includes("compile error")
      ) {
        if (window.lastPromptTime && Date.now() - window.lastPromptTime < 10000) return;
        window.lastPromptTime = Date.now();

        if (confirm("Test failed. Want AI help?")) {
          const title = document.querySelector('div[data-cy="question-title"]')?.innerText?.trim();
          const editorLines = document.querySelectorAll(".view-lines .view-line");
          const code = Array.from(editorLines).map(line => line.textContent).join("\n");

          localStorage.setItem("latestFailure", JSON.stringify({
            title, code, url: window.location.href, timestamp: new Date().toISOString(),
          }));

          alert("Failure captured!");
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("🔍 MutationObserver attached");
})();
