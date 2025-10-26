// DOM elements
const banner = document.getElementById('failureBanner');
const bannerText = document.getElementById('failureBannerText');

// Show banner function
function showBanner({ title, status }) {
  bannerText.innerHTML = `❌ Last Failure: <strong>${title}</strong> — ${status}`;
  banner.style.display = 'block';
}

// Listen for live failure messages
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'LC_FAILURE_DETECTED') {
    chrome.storage.local.set({ lastFailure: message.data }, () => {
      showBanner(message.data);
    });
  }
});

// Load stored failure on popup open
chrome.storage.local.get('lastFailure', ({ lastFailure }) => {
  if (lastFailure) {
    showBanner(lastFailure);
  }
});



