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
      <button data-action="detect-likes">Détecter les boutons Like du post + commentaires</button>
      <button data-action="trigger-likes">Déclencher tous les Like détectés (1 par 1)</button>
    </div>
    <div class="tph-status" id="tph-status"></div>
  `;

  document.body.appendChild(panel);

  const statusEl = panel.querySelector("#tph-status");

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function expandHiddenComments(maxCycles = 5) {
    const expandSelector = [
      'button[data-testid="showMoreReplies"]',
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

      expanders.forEach((button) => button.click());
      await sleep(600);
    }
  }

  function getPublicationRoot() {
    const primaryColumn = document.querySelector('main [data-testid="primaryColumn"]');
    return primaryColumn || document;
  }

  function isLikeButton(button) {
    const testId = button.getAttribute("data-testid") || "";
    const ariaLabel = (button.getAttribute("aria-label") || "").toLowerCase();

    if (testId === "like") {
      return true;
    }

    if (testId === "unlike") {
      return false;
    }

    return (ariaLabel.includes("like") || ariaLabel.includes("j’aime")) && !ariaLabel.includes("unlike");
  }

  function getLikeButtons(root) {
    const selector = [
      'button[data-testid="like"]',
      'button[data-testid="unlike"]',
      'button[aria-label*="J’aime"]',
      'button[aria-label*="Like"]'
    ].join(",");

    return Array.from(root.querySelectorAll(selector)).filter((button) => isLikeButton(button));
  }

  async function scanThreadLikeButtons() {
    document.querySelectorAll(".tph-like-detected").forEach((node) => node.classList.remove("tph-like-detected"));
    document.querySelectorAll(".tph-like-clicked").forEach((node) => node.classList.remove("tph-like-clicked"));

    await expandHiddenComments();

    const root = getPublicationRoot();
    const threadArticles = Array.from(root.querySelectorAll("article"));

    if (threadArticles.length === 0) {
      return {
        ok: false,
        message: "Aucune publication détectée. Ouvre un post (URL /status/...) puis réessaie.",
        likeButtons: []
      };
    }

    let totalLikeButtons = 0;
    let publicationLikeButtons = 0;
    let commentsLikeButtons = 0;
    const likeButtons = [];

    threadArticles.forEach((article, index) => {
      const likes = getLikeButtons(article);
      likes.forEach((button) => {
        button.classList.add("tph-like-detected");
        likeButtons.push(button);
      });

      totalLikeButtons += likes.length;
      if (index === 0) {
        publicationLikeButtons += likes.length;
      } else {
        commentsLikeButtons += likes.length;
      }
    });

    return {
      ok: true,
      totalLikeButtons,
      publicationLikeButtons,
      commentsLikeButtons,
      articlesScanned: threadArticles.length,
      likeButtons
    };
  }

  async function detectLikeButtonsInPublication() {
    const result = await scanThreadLikeButtons();

    if (!result.ok) {
      setStatus(result.message);
      return result;
    }

    const message = `Likes détectés: total ${result.totalLikeButtons} (post ${result.publicationLikeButtons}, commentaires ${result.commentsLikeButtons}).`;
    setStatus(message);

    return result;
  }

  async function triggerAllDetectedLikeButtons() {
    const result = await scanThreadLikeButtons();

    if (!result.ok) {
      setStatus(result.message);
      return result;
    }

    let clicked = 0;

    for (const likeButton of result.likeButtons) {
      if (!(likeButton instanceof HTMLElement) || !document.contains(likeButton)) {
        continue;
      }

      likeButton.scrollIntoView({ behavior: "smooth", block: "center" });
      likeButton.click();
      likeButton.classList.remove("tph-like-detected");
      likeButton.classList.add("tph-like-clicked");
      clicked += 1;
      await sleep(350);
    }

    const message = `Likes déclenchés un par un: ${clicked}.`;
    setStatus(message);

    return {
      ok: true,
      clicked,
      totalLikeButtons: result.totalLikeButtons,
      publicationLikeButtons: result.publicationLikeButtons,
      commentsLikeButtons: result.commentsLikeButtons
    };
  }

  panel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const action = target.dataset.action;

    if (action === "detect-likes") {
      detectLikeButtonsInPublication();
    } else if (action === "trigger-likes") {
      triggerAllDetectedLikeButtons();
    }
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (!request || typeof request !== "object") {
      return;
    }

    if (request.type === "TPH_DETECT_LIKES") {
      detectLikeButtonsInPublication().then((result) => {
        const { likeButtons: _likeButtons, ...response } = result;
        sendResponse(response);
      });
      return true;
    }

    if (request.type === "TPH_TRIGGER_ALL_LIKES") {
      triggerAllDetectedLikeButtons().then((result) => {
        const { likeButtons: _likeButtons, ...response } = result;
        sendResponse(response);
      });
      return true;
    }
  });
})();
