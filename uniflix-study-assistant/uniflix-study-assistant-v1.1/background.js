chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id || !tab.url?.startsWith('https://uniflix.uoa.gr/')) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'UFSA_TOGGLE_PANEL' });
  } catch (_) {}
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'UFSA_OPEN_DASHBOARD') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  }
});
