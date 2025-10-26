// (() => {
//   console.log("🧠 Feedback listener initialized...");

//   // Observe DOM changes (LeetCode updates the result dynamically)
//   const observer = new MutationObserver(() => {
//     const resultPanel = document.querySelector('[data-cy="result-status"]');
//     if (!resultPanel) return;

//     const resultText = resultPanel.innerText?.toLowerCase();

//     if (
//       resultText.includes("wrong answer") ||
//       resultText.includes("runtime error") ||
//       resultText.includes("time limit") ||
//       resultText.includes("compile error")
//     ) {
//       // Avoid triggering multiple times for the same result
//       if (window.lastPromptTime && Date.now() - window.lastPromptTime < 10000) return;
//       window.lastPromptTime = Date.now();

//       const wantHelp = confirm("❌ Test case failed. Would you like AI help debugging this?");
//       if (wantHelp) {
//         // Store the current code and problem info for later analysis
//         const title = document.querySelector('div[data-cy="question-title"]')?.innerText?.trim();
//         const editorLines = document.querySelectorAll(".view-lines .view-line");
//         const code = Array.from(editorLines).map(line => line.textContent).join("\n");

//         const failureData = {
//           title,
//           code,
//           timestamp: new Date().toISOString(),
//           url: window.location.href,
//         };

//         localStorage.setItem("latestFailure", JSON.stringify(failureData));

//         alert("🧩 Got it! Your failed attempt was saved. The AI agent will help you shortly.");
//         // (Later: send this data to your AI analysis logic)
//       }
//     }
//   });

//   observer.observe(document.body, {
//     childList: true,
//     subtree: true,
//   });
// })();

// feedbackListener.js
(() => {
  const TAG = "🧠 feedbackListener";
  console.log(`${TAG} initialized...`);

  // Debounce window: don't notify more than once within this ms window
  const DEBOUNCE_MS = 10_000;

  // last time we recorded/detected a failure
  window.__lc_lastFailureTime = window.__lc_lastFailureTime || 0;

  // keywords to consider a failure
  const failureKeywords = [
    "wrong answer",
    "runtime error",
    "time limit",
    "time limit exceeded",
    "time limit exceeded (tle)",
    "compile error",
    "memory limit",
    "failed"
  ];

  function isFailureText(text = "") {
    if (!text) return false;
    const low = text.toLowerCase();
    return failureKeywords.some(k => low.includes(k));
  }

  // Try multiple selectors because LeetCode DOM changes frequently
  function findResultNodes() {
    const nodes = [];

    // data-cy or e2e selectors
    const r1 = document.querySelector('[data-cy="result-status"]');
    if (r1) nodes.push(r1);

    const r2 = document.querySelector('[data-e2e-lc-submission-result]'); // sometimes used
    if (r2) nodes.push(r2);

    const r3 = document.querySelector('[data-cy="judge-result-toast"]');
    if (r3) nodes.push(r3);

    // toast/alert areas
    document.querySelectorAll('.ant-message, .ant-notification, .result__2cdu, .submission-result, .resultStatus, .status-text').forEach(n => nodes.push(n));

    // generic search for nodes containing key words (avoid duplicates)
    const textCandidates = Array.from(document.querySelectorAll('div, span, p')).filter(el => {
      try {
        return /wrong|runtime|time limit|compile|failed|error/i.test(el.innerText || "");
      } catch (e) {
        return false;
      }
    });
    textCandidates.forEach(n => nodes.push(n));

    // dedupe
    return Array.from(new Set(nodes));
  }

  // Attempt to extract current user's code from Monaco editor or inner text fallbacks
  function extractEditorCode() {
    try {
      // Monaco textarea (the hidden textarea inside monaco-editor)
      const ta = document.querySelector('.monaco-editor textarea');
      if (ta && ta.value && ta.value.trim()) return ta.value;

      // view lines inside monaco
      const lines = document.querySelectorAll('.view-lines .view-line');
      if (lines && lines.length) {
        return Array.from(lines).map(l => l.textContent || "").join("\n");
      }

      // LeetCode sometimes has a data prop element
      const codeEl = document.querySelector('[data-mode-id], .CodeMirror, .editor');
      if (codeEl) return codeEl.innerText || "";

      return "";
    } catch (err) {
      console.error(`${TAG} extractEditorCode error`, err);
      return "";
    }
  }

  // Attempt to extract problem title
  function extractTitle() {
    try {
      const t1 = document.querySelector('div[data-cy="question-title"]');
      if (t1) return t1.innerText.trim();

      const t2 = document.querySelector('.css-v3d350, .question-title, .text-title-large, h1');
      if (t2) return t2.innerText.trim();

      return document.title || "";
    } catch (err) {
      return "";
    }
  }

  // Save failure to both localStorage (legacy) and chrome.storage.local (for popup)
  function persistFailure(failureData) {
    try {
      // legacy localStorage array
      const existing = JSON.parse(localStorage.getItem("leetcodeScrapes") || "[]");
      existing.push(Object.assign({}, failureData, { savedAt: new Date().toISOString() }));
      localStorage.setItem("leetcodeScrapes", JSON.stringify(existing));
    } catch (err) {
      console.warn(`${TAG} localStorage persist failed`, err);
    }

    try {
      // chrome.storage.local for extension use (async)
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ lastFailure: failureData }, () => {
          if (chrome.runtime.lastError) {
            console.warn(`${TAG} chrome.storage.local.set error:`, chrome.runtime.lastError);
          } else {
            console.log(`${TAG} persisted to chrome.storage.local`);
          }
        });
      }
    } catch (err) {
      console.warn(`${TAG} chrome.storage persist error`, err);
    }
  }

  // Send a runtime message to extension (background/popup)
  function notifyExtension(failureData) {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: "LC_FAILURE_DETECTED",
          data: failureData
        }, (resp) => {
          // optional callback
          if (chrome.runtime.lastError) {
            // This can happen if no listener; ignore silently
          } else {
            // console.log(TAG, "sendMessage response", resp);
          }
        });
      }
    } catch (err) {
      console.warn(`${TAG} notifyExtension error`, err);
    }
  }

  // Main handler when a failure node is found
  function handleFailureNode(node) {
    try {
      const text = node.innerText || node.textContent || "";
      if (!isFailureText(text)) return;

      const now = Date.now();
      if (now - window.__lc_lastFailureTime < DEBOUNCE_MS) {
        // already reported recently
        return;
      }
      window.__lc_lastFailureTime = now;

      const title = extractTitle();
      const code = extractEditorCode();
      const url = window.location.href;
      const status = text.trim();

      const failureData = {
        title,
        code,
        url,
        status,
        detectedAt: new Date().toISOString()
      };

      console.log(`${TAG} FAILURE detected:`, failureData);

      // Persist & notify (so popup can display without user needing to confirm)
      persistFailure(failureData);
      notifyExtension(failureData);

      // Keep the original UX: ask user via confirm if they want AI help.
      // We do this AFTER persisting so the info is available regardless of their choice.
      try {
        if (window.lastPromptTime && Date.now() - window.lastPromptTime < 10000) {
          // throttle confirm prompts
          return;
        }
        window.lastPromptTime = Date.now();

        const wantHelp = confirm("❌ Test case failed. Would you like AI help debugging this?");
        if (wantHelp) {
          // Save as latestFailure explicitly (legacy field used earlier)
          try {
            localStorage.setItem("latestFailure", JSON.stringify(failureData));
          } catch (e) {}

          // Also put into chrome.storage.local (redundant, but ensures popup sees it)
          if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ latestFailure: failureData }, () => {});
          }

          alert("🧩 Got it! Your failed attempt was saved. The AI agent will help you shortly.");
        }
      } catch (err) {
        console.warn(`${TAG} confirm/alert failed`, err);
      }

    } catch (err) {
      console.error(`${TAG} handleFailureNode error`, err);
    }
  }

  // MutationObserver callback
  const observer = new MutationObserver((mutations) => {
    try {
      // Quick scan for potential result nodes (only if page likely shows judge results)
      const nodes = findResultNodes();
      if (!nodes || nodes.length === 0) return;

      for (const node of nodes) {
        try {
          if (!node) continue;
          // use trimmed innerText for detection
          const txt = (node.innerText || node.textContent || "").trim();
          if (isFailureText(txt)) {
            handleFailureNode(node);
            break; // stop after first detected failure
          }
        } catch (e) {
          // ignore single-node failures
        }
      }
    } catch (err) {
      console.error(`${TAG} mutation handler error`, err);
    }
  });

  // Start observing the body for changes (LeetCode is SPA/react)
  try {
    observer.observe(document.body, { childList: true, subtree: true });
    console.log(`${TAG} MutationObserver attached`);
  } catch (err) {
    console.error(`${TAG} failed to attach observer`, err);
  }

  // Also do a one-time passive scan on load in case result is already present
  setTimeout(() => {
    try {
      const nodes = findResultNodes();
      nodes.forEach(n => {
        const txt = (n.innerText || n.textContent || "").trim();
        if (isFailureText(txt)) handleFailureNode(n);
      });
    } catch (err) {
      // swallow
    }
  }, 1200);
})();
