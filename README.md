# Twitter Page Helper (extension Chrome)

Extension Chrome (Manifest V3) orientée détection et déclenchement des boutons Like sur Twitter/X.

## Fonctionnalités

- Détecter tous les boutons **Like** d'une publication ouverte (`/status/...`) et de ses commentaires.
- Déclencher les boutons Like détectés **un par un** automatiquement.
- Tenter d'ouvrir les blocs de réponses masquées avant la détection (quand Twitter/X expose un bouton "voir plus").
- Réinjection automatique du content script si le popup est ouvert sur un onglet déjà chargé (corrige l'erreur "Receiving end does not exist").
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
4. Clique **Détecter les Like du post + commentaires**.
5. Clique **Déclencher tous les Like détectés (1 par 1)** pour lancer les clics.

## Limite importante

- Twitter/X charge certains commentaires dynamiquement (scroll, pagination, filtrage). L'extension détecte les boutons présents dans le DOM au moment de l'analyse, après tentative d'expansion des sections masquées.

## Structure

- `manifest.json` : configuration de l'extension.
- `content.js` / `content.css` : logique + UI injectées dans Twitter/X.
- `popup.html` / `popup.js` / `popup.css` : interface du popup.
- `background.js` : service worker minimal.
