// This runs on the LeetCode page and detects execution results
function detectFailure(statusText) {
  const failureKeywords = ['Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Memory Limit Exceeded'];
  return failureKeywords.some(keyword => statusText.includes(keyword));
}

const observer = new MutationObserver(() => {
  const resultBox = document.querySelector('.result__2cdu'); // example selector
  if (resultBox) {
    const statusText = resultBox.innerText;
    if (detectFailure(statusText)) {
      const title = document.querySelector('.css-v3d350').innerText; // Problem Name
      const code = document.querySelector('.view-lines').innerText; // Solution code (Monaco)
      
      chrome.runtime.sendMessage({
        type: "LC_FAILURE_DETECTED",
        data: {
          title,
          code,
          url: window.location.href,
          status: statusText,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
