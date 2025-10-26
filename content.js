function scrapeLeetCode() {
  const title = document.querySelector('div[data-cy="question-title"]')?.innerText || "";
  const difficulty = document.querySelector('.text-difficulty')?.innerText || "";
  const content = document.querySelector('.content__u3I1.question-content__JfgR')?.innerText || "";

  // LeetCode uses Monaco Editor (like VS Code) — grab its text model
  const code = Array.from(document.querySelectorAll('.view-lines span'))
    .map(span => span.textContent)
    .join('\n');

  return { title, difficulty, content, code };
}

// Periodically scrape every 10 seconds
setInterval(() => {
  const data = scrapeLeetCode();
  console.log("[LeetCode Scraper]", data);

  // Save to localStorage (or send to background for sync)
  chrome.storage.local.set({ leetcodeData: data });
}, 10000);
