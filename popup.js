const resultEl = document.getElementById("result");

function setResult(message) {
  if (resultEl) {
    resultEl.textContent = message;
  }
}

async function getCurrentTwitterTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab || !tab.id || !tab.url) {
    throw new Error("Aucun onglet actif trouvé.");
  }

  const isTwitter = tab.url.startsWith("https://twitter.com/") || tab.url.startsWith("https://x.com/");
  if (!isTwitter) {
    throw new Error("Ouvre d'abord un onglet Twitter/X.");
  }

  return tab;
}

async function injectContentScript(tabId) {
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["content.css"]
  });

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

async function sendToContentScript(type) {
  const tab = await getCurrentTwitterTab();

  try {
    return await chrome.tabs.sendMessage(tab.id, { type });
  } catch (error) {
    const message = error?.message || "";
    const isConnectionError =
      message.includes("Receiving end does not exist") || message.includes("Could not establish connection");

    if (!isConnectionError) {
      throw error;
    }

    await injectContentScript(tab.id);
    return chrome.tabs.sendMessage(tab.id, { type });
  }
}

document.getElementById("detectLikesBtn")?.addEventListener("click", async () => {
  try {
    const response = await sendToContentScript("TPH_DETECT_LIKES");
    if (!response?.ok) {
      setResult(response?.message || "Impossible de détecter les boutons Like.");
      return;
    }

    setResult(
      `Likes détectés: ${response.totalLikeButtons} (post ${response.publicationLikeButtons}, commentaires ${response.commentsLikeButtons}).`
    );
  } catch (error) {
    setResult(error.message);
  }
});

document.getElementById("triggerLikesBtn")?.addEventListener("click", async () => {
  try {
    const response = await sendToContentScript("TPH_TRIGGER_ALL_LIKES");
    if (!response?.ok) {
      setResult(response?.message || "Impossible de déclencher les Like.");
      return;
    }

    setResult(`Likes déclenchés un par un: ${response.clicked}.`);
  } catch (error) {
    setResult(error.message);
  }
});
