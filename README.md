# Twitter Page Helper (extension Chrome)

Extension Chrome (Manifest V3) pour interagir rapidement avec la page Twitter/X.

## Fonctionnalités

- Compter les posts visibles dans le fil.
- Copier le texte du dernier post visible.
- Surligner les posts contenant un hashtag.
- Détecter tous les boutons **Like** d'une publication ouverte (`/status/...`) et de ses commentaires.
- Réinjection automatique du content script si le popup est ouvert sur un onglet déjà chargé (corrige l'erreur "Receiving end does not exist").
- Tenter d'ouvrir les blocs de réponses masquées avant la détection (quand Twitter/X expose un bouton "voir plus").
- Utilisation via:
  - un **popup d'extension** ;
  - un **panneau flottant directement sur Twitter/X**.

## Installation locale

1. Ouvre `chrome://extensions`.
2. Active le mode **Développeur**.
3. Clique sur **Charger l'extension non empaquetée**.
4. Sélectionne le dossier du repo.

## Utilisation

1. Ouvre `https://twitter.com` ou `https://x.com`.
2. Va sur une publication précise (URL contenant `/status/`) pour la détection des likes.
3. Clique l'icône de l'extension.
4. Utilise les boutons du popup, ou le panneau flottant en bas à droite de la page.

## Limite importante

- Twitter/X charge certains commentaires dynamiquement (scroll, pagination, filtrage). L'extension détecte les boutons présents dans le DOM au moment de l'analyse, après tentative d'expansion des sections masquées.

## Structure

- `manifest.json` : configuration de l'extension.
- `content.js` / `content.css` : logique + UI injectées dans Twitter/X.
- `popup.html` / `popup.js` / `popup.css` : interface du popup.
- `background.js` : service worker minimal.
