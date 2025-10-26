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

// popup.js - reads lastFailure and updates UI; listens for broadcasts to update live

document.getElementById("refresh").addEventListener("click", fetchProblem);
document.addEventListener("DOMContentLoaded", () => {
  fetchProblem();
  initFailureUI();
});

// --- Problem scraping (your existing logic) ---
async function fetchProblem() {
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  const codeEl = document.getElementById("code");

  titleEl.textContent = "Fetching...";
  descEl.textContent = "";
  codeEl.textContent = "";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url || !tab.url.includes("leetcode.com/problems/")) {
      titleEl.textContent = "❌ Not on a LeetCode problem page.";
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Scrape title
        let title =
          document.querySelector('div[data-cy="question-title"]')?.innerText ||
          document.querySelector("div.text-title-large")?.innerText ||
          document.querySelector("h1")?.innerText;
        if (title) title = title.trim().replace(/^#?\d+\.\s*/, "");

        // Scrape description
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

        // Scrape user code
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
    } else {
      titleEl.textContent = "⚠️ Could not find problem info.";
    }
  } catch (err) {
    console.error("popup.fetchProblem error:", err);
  }
}

// --- Failure UI handling ---
const failureCard = document.getElementById("failureCard");
const failureStatus = document.getElementById("failureStatus");
const failureTitle = document.getElementById("failureTitle");
const failureUrl = document.getElementById("failureUrl");
const failureTime = document.getElementById("failureTime");
const failureCode = document.getElementById("failureCode");
const helpBtn = document.getElementById("helpBtn");
const dismissBtn = document.getElementById("dismissBtn");

function renderFailure(f) {
  if (!f) {
    failureCard.style.display = "none";
    return;
  }
  failureCard.style.display = "block";
  failureStatus.textContent = `❌ ${f.status || "Submission failed"}`;
  failureTitle.textContent = f.title || "(unknown title)";
  failureUrl.textContent = f.url || "";
  failureTime.textContent = f.detectedAt ? `Detected: ${new Date(f.detectedAt).toLocaleString()}` : "";
  if (f.code) {
    failureCode.style.display = "block";
    failureCode.textContent = f.code.length > 800 ? f.code.slice(0,800) + "\n... (truncated)" : f.code;
  } else {
    failureCode.style.display = "none";
  }
}

// When user clicks help
helpBtn.addEventListener("click", () => {
  chrome.storage.local.get("lastFailure", ({ lastFailure }) => {
    if (!lastFailure) {
      alert("No failure data found.");
      return;
    }
    // Send a message that user accepted help (background or service can handle this)
    chrome.runtime.sendMessage({ type: "LC_USER_WANTS_HELP", data: lastFailure }, () => {
      // clear badge
      try { chrome.action.setBadgeText({ text: "" }); } catch (e) {}
      // feedback to user
      helpBtn.textContent = "Requested";
      helpBtn.disabled = true;
    });
  });
});

// Dismiss button clears the stored failure
dismissBtn.addEventListener("click", () => {
  chrome.storage.local.remove("lastFailure", () => {
    renderFailure(null);
    try { chrome.action.setBadgeText({ text: "" }); } catch (e) {}
  });
});

// Initialize UI by reading stored failure
function initFailureUI() {
  chrome.storage.local.get("lastFailure", ({ lastFailure }) => {
    if (lastFailure) {
      renderFailure(lastFailure);
    }
  });
}

// Listen for broadcasts (if background broadcasted failure and popup is already open)
chrome.runtime.onMessage.addListener((message) => {
  if (!message) return;
  if (message.type === "LC_FAILURE_BROADCAST") {
    renderFailure(message.data);
  }
});


