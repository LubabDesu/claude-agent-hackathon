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
      const title = document.querySelector('div[data-cy="question-title"]')?.innerText?.trim();
      const description = document.querySelector('.content__u3I1.question-content__JfgR')?.innerText?.trim();
      return { title, description };
    },
  });

  const { title, description } = results[0].result || {};
  if (title) {
    titleEl.textContent = title;
    descEl.textContent = description?.slice(0, 300) + (description?.length > 300 ? "..." : "");
  } else {
    titleEl.textContent = "⚠️ Could not find problem info.";
  }
}
