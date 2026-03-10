(function initTwitterPageHelper() {
  if (window.__TPH_LOADED__) {
    return;
  }
  window.__TPH_LOADED__ = true;

  const panel = document.createElement("aside");
  panel.id = "tph-panel";
  panel.innerHTML = `
    <h3>Twitter Page Helper</h3>
    <div class="tph-buttons">
      <button data-action="count">Compter les posts visibles</button>
      <button data-action="copy-latest">Copier le dernier post</button>
      <button data-action="highlight">Surligner les posts avec hashtags</button>
      <button data-action="detect-likes">Détecter les boutons Like du post + commentaires</button>
    </div>
    <div class="tph-status" id="tph-status"></div>
  `;

  document.body.appendChild(panel);

  const statusEl = panel.querySelector("#tph-status");

  function getTweetTextNodes() {
    return Array.from(document.querySelectorAll('article [data-testid="tweetText"]'));
  }

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  async function copyLatestTweet() {
    const tweets = getTweetTextNodes();
    const latest = tweets.at(0);

    if (!latest) {
      setStatus("Aucun post détecté.");
      return;
    }

    const text = latest.innerText.trim();
    if (!text) {
      setStatus("Le dernier post est vide.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("Dernier post copié dans le presse-papier.");
    } catch (error) {
      setStatus("Impossible de copier automatiquement (permission navigateur).");
      console.warn("copy failed", error);
    }
  }

  function countVisibleTweets() {
    const count = getTweetTextNodes().length;
    setStatus(`${count} post(s) visible(s).`);
  }

  function highlightHashtagTweets() {
    const tweets = getTweetTextNodes();
    let highlighted = 0;

    tweets.forEach((tweetNode) => {
      const container = tweetNode.closest("article");
      if (!container) {
        return;
      }

      if (/#\w+/.test(tweetNode.innerText)) {
        container.classList.add("tph-highlight");
        highlighted += 1;
      } else {
        container.classList.remove("tph-highlight");
      }
    });

    setStatus(`${highlighted} post(s) avec hashtag surligné(s).`);
  }

  async function expandHiddenComments(maxCycles = 5) {
    const expandSelector = [
      'button[data-testid="showMoreReplies"]',
      'button[data-testid="cellInnerDiv"] div[role="button"]',
      'div[role="button"][aria-label*="Voir plus"]',
      'div[role="button"][aria-label*="Show more"]'
    ].join(",");

    for (let cycle = 0; cycle < maxCycles; cycle += 1) {
      const expanders = Array.from(document.querySelectorAll(expandSelector)).filter(
        (node) => node instanceof HTMLElement
      );

      if (expanders.length === 0) {
        return;
      }

      expanders.forEach((button) => {
        button.click();
      });

      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  function getPublicationRoot() {
    const primaryColumn = document.querySelector('main [data-testid="primaryColumn"]');
    return primaryColumn || document;
  }

  function getLikeButtons(root) {
    const selector = [
      'button[data-testid="like"]',
      'button[data-testid="unlike"]',
      'button[aria-label*="J’aime"]',
      'button[aria-label*="Like"]'
    ].join(",");

    return Array.from(root.querySelectorAll(selector));
  }

  async function detectLikeButtonsInPublication() {
    document.querySelectorAll(".tph-like-detected").forEach((node) => node.classList.remove("tph-like-detected"));

    await expandHiddenComments();

    const root = getPublicationRoot();
    const threadArticles = Array.from(root.querySelectorAll("article"));

    if (threadArticles.length === 0) {
      const message = "Aucune publication détectée. Ouvre un post (URL /status/...) puis réessaie.";
      setStatus(message);
      return { ok: false, message };
    }

    let totalLikeButtons = 0;
    let publicationLikeButtons = 0;
    let commentsLikeButtons = 0;

    threadArticles.forEach((article, index) => {
      const likes = getLikeButtons(article);
      likes.forEach((button) => button.classList.add("tph-like-detected"));

      totalLikeButtons += likes.length;
      if (index === 0) {
        publicationLikeButtons += likes.length;
      } else {
        commentsLikeButtons += likes.length;
      }
    });

    const message = `Likes détectés: total ${totalLikeButtons} (post ${publicationLikeButtons}, commentaires ${commentsLikeButtons}).`;
    setStatus(message);

    return {
      ok: true,
      totalLikeButtons,
      publicationLikeButtons,
      commentsLikeButtons,
      articlesScanned: threadArticles.length
    };
  }

  panel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const action = target.dataset.action;

    if (action === "count") {
      countVisibleTweets();
    } else if (action === "copy-latest") {
      copyLatestTweet();
    } else if (action === "highlight") {
      highlightHashtagTweets();
    } else if (action === "detect-likes") {
      detectLikeButtonsInPublication();
    }
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (!request || typeof request !== "object") {
      return;
    }

    if (request.type === "TPH_COUNT") {
      const count = getTweetTextNodes().length;
      setStatus(`${count} post(s) visible(s).`);
      sendResponse({ ok: true, count });
    }

    if (request.type === "TPH_COPY") {
      copyLatestTweet().then(() => sendResponse({ ok: true }));
      return true;
    }

    if (request.type === "TPH_HIGHLIGHT") {
      highlightHashtagTweets();
      sendResponse({ ok: true });
    }

    if (request.type === "TPH_DETECT_LIKES") {
      detectLikeButtonsInPublication().then((result) => sendResponse(result));
      return true;
    }
  });
})();
