// document.getElementById("refresh").addEventListener("click", fetchProblem);
// document.addEventListener("DOMContentLoaded", fetchProblem);

// async function fetchProblem() {
//   const titleEl = document.getElementById("title");
//   const descEl = document.getElementById("description");
//   titleEl.textContent = "Fetching...";
//   descEl.textContent = "";

//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   if (!tab.url.includes("leetcode.com/problems/")) {
//     titleEl.textContent = "❌ Not on a LeetCode problem page.";
//     return;
//   }

//   const results = await chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     func: () => {
//       // New 2025 layout (React SPA)
//       let title =
//         document.querySelector('div[data-cy="question-title"]')?.innerText ||
//         document.querySelector("div.text-title-large")?.innerText ||
//         document.querySelector("h1")?.innerText;

//       // Clean up titles like "1. Two Sum"
//       if (title) title = title.trim().replace(/^#?\d+\.\s*/, "");

//       // Description is sometimes nested in a shadow DOM / iframe now
//       let description = "";
//       const descCandidates = [
//         document.querySelector('[data-key="description-content"]'),
//         document.querySelector(".elfjS"),
//         document.querySelector(".question-content__JfgR"),
//         document.querySelector(".content__u3I1"),
//         document.querySelector("div[class*='question-content']"),
//       ];

//       for (const el of descCandidates) {
//         if (el?.innerText?.length > description.length) {
//           description = el.innerText.trim();
//         }
//       }

//       return { title, description };
//     },
//   });

//   const { title, description } = results[0].result || {};
//   if (title) {
//     titleEl.textContent = title;
//     descEl.textContent =
//       description?.slice(0, 300) + (description?.length > 300 ? "..." : "");
//   } else {
//     titleEl.textContent = "⚠️ Could not find problem info.";
//   }
// } 

document.getElementById("refresh").addEventListener("click", fetchProblem);
document.addEventListener("DOMContentLoaded", fetchProblem);

async function fetchProblem() {
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  const codeEl = document.getElementById("code");

  titleEl.textContent = "Fetching...";
  descEl.textContent = "";
  codeEl.textContent = "";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes("leetcode.com/problems/")) {
    titleEl.textContent = "❌ Not on a LeetCode problem page.";
    return;
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // 🧩 --- SCRAPE TITLE ---
      let title =
        document.querySelector('div[data-cy="question-title"]')?.innerText ||
        document.querySelector("div.text-title-large")?.innerText ||
        document.querySelector("h1")?.innerText;
      if (title) title = title.trim().replace(/^#?\d+\.\s*/, "");

      // 🧩 --- SCRAPE DESCRIPTION ---
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

      // 🧩 --- SCRAPE USER CODE ---
      let code = "";
      // Option 1: Monaco editor textareas (best approach)
      const textAreas = document.querySelectorAll("textarea");
      for (const ta of textAreas) {
        // Find the one inside the Monaco editor
        if (ta.closest(".monaco-editor")) {
          code = ta.value;
          break;
        }
      }

      // Option 2: Sometimes LeetCode stores code in data attributes
      if (!code) {
        const editor = document.querySelector("[data-mode-id]");
        if (editor) code = editor.innerText || "";
      }

      return { title, description, code };
    },
  });

  const { title, description, code } = results[0].result || {};

  if (title) {
    titleEl.textContent = title;
    descEl.textContent =
      description?.slice(0, 200) + (description?.length > 200 ? "..." : "");
    codeEl.textContent =
      code?.slice(0, 400) + (code?.length > 400 ? "\n... (truncated)" : "");
  } else {
    titleEl.textContent = "⚠️ Could not find problem info.";
  }
}


