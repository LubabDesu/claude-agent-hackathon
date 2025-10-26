// document.getElementById("refresh").addEventListener("click", fetchProblem);
// document.addEventListener("DOMContentLoaded", fetchProblem);

// async function fetchProblem() {
//   const titleEl = document.getElementById("title");
//   const descEl = document.getElementById("description");
//   const codeEl = document.getElementById("code");

//   titleEl.textContent = "Fetching...";
//   descEl.textContent = "";
//   codeEl.textContent = "";

//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   if (!tab.url.includes("leetcode.com/problems/")) {
//     titleEl.textContent = "❌ Not on a LeetCode problem page.";
//     return;
//   }

//   const results = await chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     func: () => {
//       // 🧩 --- SCRAPE TITLE ---
//       let title =
//         document.querySelector('div[data-cy="question-title"]')?.innerText ||
//         document.querySelector("div.text-title-large")?.innerText ||
//         document.querySelector("h1")?.innerText;
//       if (title) title = title.trim().replace(/^#?\d+\.\s*/, "");

//       // 🧩 --- SCRAPE DESCRIPTION ---
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

//       // 🧩 --- SCRAPE USER CODE ---
//       let code = "";
//       // Option 1: Monaco editor textareas (best approach)
//       const textAreas = document.querySelectorAll("textarea");
//       for (const ta of textAreas) {
//         // Find the one inside the Monaco editor
//         if (ta.closest(".monaco-editor")) {
//           code = ta.value;
//           break;
//         }
//       }

//       // Option 2: Sometimes LeetCode stores code in data attributes
//       if (!code) {
//         const editor = document.querySelector("[data-mode-id]");
//         if (editor) code = editor.innerText || "";
//       }

//       return { title, description, code };
//     },
//   });

//   const { title, description, code } = results[0].result || {};

//   if (title) {
//     titleEl.textContent = title;
//     descEl.textContent =
//       description?.slice(0, 200) + (description?.length > 200 ? "..." : "");
//     codeEl.textContent =
//       code?.slice(0, 400) + (code?.length > 400 ? "\n... (truncated)" : "");
//   } else {
//     titleEl.textContent = "⚠️ Could not find problem info.";
//   }
// }

import * as acorn from "https://cdn.jsdelivr.net/npm/acorn@8.11.2/+esm";

document.getElementById("refresh").addEventListener("click", fetchProblem);
document.addEventListener("DOMContentLoaded", fetchProblem);

async function fetchProblem() {
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  const codeEl = document.getElementById("code");
  const feedbackEl = document.getElementById("feedback");

  titleEl.textContent = "Fetching...";
  descEl.textContent = "";
  codeEl.textContent = "";
  feedbackEl.textContent = "";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes("leetcode.com/problems/")) {
    titleEl.textContent = "❌ Not on a LeetCode problem page.";
    return;
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // --- SCRAPE TITLE ---
      let title =
        document.querySelector('div[data-cy="question-title"]')?.innerText ||
        document.querySelector("div.text-title-large")?.innerText ||
        document.querySelector("h1")?.innerText;
      if (title) title = title.trim().replace(/^#?\d+\.\s*/, "");

      // --- SCRAPE DESCRIPTION ---
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

      // --- SCRAPE CODE ---
      let code = "";
      const textAreas = document.querySelectorAll("textarea");
      for (const ta of textAreas) {
        if (ta.closest(".monaco-editor")) {
          code = ta.value;
          break;
        }
      }
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

    // --- RUN SYNTAX ANALYSIS ---
    const feedback = await analyzeSyntax(code);
    feedbackEl.textContent = feedback;
  } else {
    titleEl.textContent = "⚠️ Could not find problem info.";
  }
}

async function analyzeSyntax(code) {
  if (!code || code.trim() === "") {
    return "⚠️ No code detected in editor.";
  }

  try {
    acorn.parse(code, { ecmaVersion: "latest" });
    return "✅ No syntax errors found.";
  } catch (err) {
    // Show exact syntax error message with line & column
    return `❌ Syntax Error: ${err.message} (line ${err.loc.line}, col ${err.loc.column})`;
  }
}



