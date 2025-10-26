async function fetchProblem() {
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  const codeEl = document.getElementById("code");

  // Reset UI while fetching
  titleEl.textContent = "Fetching...";
  descEl.textContent = "";
  codeEl.textContent = "";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url.includes("leetcode.com/problems/")) {
      titleEl.textContent = "❌ Not on a LeetCode problem page.";
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Helper to get longest description
        const descCandidates = [
          document.querySelector('[data-key="description-content"]'),
          document.querySelector(".elfjS"),
          document.querySelector(".question-content__JfgR"),
          document.querySelector(".content__u3I1"),
          document.querySelector("div[class*='question-content']"),
        ];

        let description = "";
        for (const el of descCandidates) {
          if (el?.innerText?.length > description.length) {
            description = el.innerText.trim();
          }
        }

        let title =
          document.querySelector('div[data-cy="question-title"]')?.innerText ||
          document.querySelector("div.text-title-large")?.innerText ||
          document.querySelector("h1")?.innerText ||
          "";
        title = title.trim().replace(/^#?\d+\.\s*/, "");

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

    // Helper to truncate text
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
