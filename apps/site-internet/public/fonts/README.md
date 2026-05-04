# Polices propriétaires Vérone

Ce dossier accueille les fichiers `.woff2` des polices propriétaires Vérone :

- `Balgin-LightSMExpanded.woff2` — police display (wordmark, capitales étirées)
- `Migra-Extrabold.woff2` — police titres éditoriaux (sérif didone)
- `Migra-ExtraboldItalic.woff2` — variante italic des titres

Tant que ces fichiers ne sont pas présents, le site utilise les fallbacks Google
Fonts (DM Sans + Bodoni Moda + Playfair Display) déjà chargés via `globals.css`.

Le rendu est correct mais légèrement différent de l'identité officielle.

## Comment activer les polices propriétaires

1. Déposer les `.woff2` dans ce dossier (même nom que ci-dessus)
2. Décommenter les `@font-face` dans `apps/site-internet/src/app/globals.css`
3. Redémarrer le serveur de dev (ou redéployer)

Aucune autre modification n'est nécessaire — les variables CSS `--font-display`
et `--font-heading` pointent déjà sur Balgin et Migra en priorité, avec
fallback vers les Google Fonts.
