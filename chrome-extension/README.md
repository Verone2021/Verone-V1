# Verone Sourcing Import — Extension Chrome

Extension Chrome pour importer des produits depuis Alibaba (et autres sites e-commerce) dans le back-office Verone.

## Installation (mode developpement)

1. Ouvrir Chrome et aller dans `chrome://extensions/`
2. Activer le **Mode developpeur** (en haut a droite)
3. Cliquer sur **Charger l'extension non empaquetee**
4. Selectionner le dossier `chrome-extension/`
5. L'icone Verone apparait dans la barre d'extensions

## Utilisation

1. Naviguer sur une page produit **Alibaba** (ou autre site e-commerce)
2. Cliquer sur l'icone **Verone Sourcing** dans la barre Chrome
3. Verifier les donnees extraites (nom, prix, photos, fournisseur)
4. Configurer l'URL du back-office si necessaire (defaut: `http://localhost:3000`)
5. Cliquer sur **Importer dans Verone**
6. La fiche sourcing est creee automatiquement

## Sites supportes

| Site                        | Extraction               | Donnees                       |
| --------------------------- | ------------------------ | ----------------------------- |
| **Alibaba.com**             | Enrichie                 | Produit + fournisseur complet |
| **1688.com**                | Enrichie                 | Produit + fournisseur         |
| **Autres sites e-commerce** | Generique (OG + JSON-LD) | Nom, prix, images             |

## Icones

Pour generer les icones PNG, creer une image 128x128 avec le logo Verone noir sur fond blanc, puis la redimensionner en 16x16 et 48x48.

Placer les fichiers dans `icons/`:

- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)
