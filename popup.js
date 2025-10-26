document.getElementById("refresh").addEventListener("click", fetchProblem);

document.addEventListener("DOMContentLoaded", async () => {
  fetchProblem();

  // Safely access storage
  if (chrome.storage?.local) {
    chrome.storage.local.get("latestFailure", ({ latestFailure }) => {
      if (latestFailure) {
        const helpBanner = document.getElementById("help-banner");
        helpBanner.textContent = `❌ Your last attempt failed for: ${latestFailure.title}. Want AI help?`;
        helpBanner.style.display = "block";
      }
    });
  } else {
    console.warn("chrome.storage.local not available in this context");
  }
});

async function fetchProblem() {
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  const codeEl = document.getElementById("code");

  titleEl.textContent = "Fetching...";
  descEl.textContent = "";
  codeEl.textContent = "";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url.startsWith("http") || !tab.url.includes("leetcode.com/problems/")) {
      titleEl.textContent = "❌ Not on a LeetCode problem page or internal page";
      return;
    }

    if (!chrome.scripting) {
      console.warn("chrome.scripting API not available");
      titleEl.textContent = "❌ Cannot execute script";
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        let title =
          document.querySelector('div[data-cy="question-title"]')?.innerText ||
          document.querySelector("div.text-title-large")?.innerText ||
          document.querySelector("h1")?.innerText || "";
        title = title.trim().replace(/^#?\d+\.\s*/, "");

        const descCandidates = [
          document.querySelector('[data-key="description-content"]'),
          document.querySelector(".elfjS"),
          document.querySelector(".question-content__JfgR"),
          document.querySelector(".content__u3I1"),
          document.querySelector("div[class*='question-content']"),
        ];

        let description = "";
        for (const el of descCandidates) {
          if (el?.innerText?.length > description.length) description = el.innerText.trim();
        }

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

    const { title, description, code } = results?.[0]?.result || {};

    const truncate = (text, length) =>
      text?.slice(0, length) + (text?.length > length ? "..." : "");

    if (title) {
      titleEl.textContent = title;
      descEl.textContent = truncate(description, 200);
      codeEl.textContent = truncate(code, 400);
    } else {
      titleEl.textContent = "⚠️ Could not find problem info.";
      descEl.textContent = "";
      codeEl.textContent = "";
    }
  } catch (err) {
    console.error("Failed to fetch problem:", err);
    titleEl.textContent = "❌ Error fetching problem info.";
    descEl.textContent = "";
    codeEl.textContent = "";
  }
}
