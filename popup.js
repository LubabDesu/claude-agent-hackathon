document.addEventListener("DOMContentLoaded", async () => {
  const data = await chrome.storage.local.get("leetcodeData");
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(data.leetcodeData, null, 2);
  document.body.appendChild(pre);
});
