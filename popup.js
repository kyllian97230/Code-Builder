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

async function sendToContentScript(type) {
  const tab = await getCurrentTwitterTab();
  return chrome.tabs.sendMessage(tab.id, { type });
}

document.getElementById("countBtn")?.addEventListener("click", async () => {
  try {
    const response = await sendToContentScript("TPH_COUNT");
    setResult(`${response?.count ?? 0} post(s) visible(s).`);
  } catch (error) {
    setResult(error.message);
  }
});

document.getElementById("copyBtn")?.addEventListener("click", async () => {
  try {
    await sendToContentScript("TPH_COPY");
    setResult("Dernier post copié (si permission autorisée).");
  } catch (error) {
    setResult(error.message);
  }
});

document.getElementById("highlightBtn")?.addEventListener("click", async () => {
  try {
    await sendToContentScript("TPH_HIGHLIGHT");
    setResult("Posts avec hashtags surlignés.");
  } catch (error) {
    setResult(error.message);
  }
});

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
