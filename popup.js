document.getElementById("refresh").addEventListener("click", fetchProblem);
document.addEventListener("DOMContentLoaded", fetchProblem);

async function fetchProblem() {
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  titleEl.textContent = "Fetching...";
  descEl.textContent = "";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes("leetcode.com/problems/")) {
    titleEl.textContent = "❌ Not on a LeetCode problem page.";
    return;
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // New 2025 layout (React SPA)
      let title =
        document.querySelector('div[data-cy="question-title"]')?.innerText ||
        document.querySelector("div.text-title-large")?.innerText ||
        document.querySelector("h1")?.innerText;

      // Clean up titles like "1. Two Sum"
      if (title) title = title.trim().replace(/^#?\d+\.\s*/, "");

      // Description is sometimes nested in a shadow DOM / iframe now
      let description = "";
      const descCandidates = [
        document.querySelector('[data-key="description-content"]'),
        document.querySelector(".elfjS"),
        document.querySelector(".question-content__JfgR"),
        document.querySelector(".content__u3I1"),
        document.querySelector("div[class*='question-content']"),
      ];

      for (const el of descCandidates) {
        if (el?.innerText?.length > description.length) {
          description = el.innerText.trim();
        }
      }

      return { title, description };
    },
  });

  const { title, description } = results[0].result || {};
  if (title) {
    titleEl.textContent = title;
    descEl.textContent =
      description?.slice(0, 300) + (description?.length > 300 ? "..." : "");
  } else {
    titleEl.textContent = "⚠️ Could not find problem info.";
  }
}

