# Test Runtime — Bug Expedition Modal

**Date :** 16 avril 2026
**Environnement :** localhost:3000 (dev)
**Utilisateur :** veronebyromeo@gmail.com (MVP Test)

---

## Verdict : LE WIZARD FONCTIONNE EN DEV

Le modal d'expedition s'ouvre correctement et le wizard multi-etapes est pleinement fonctionnel.

---

## Deroulement du test

### 1. Navigation vers /stocks/expeditions

- Page chargee correctement
- Stats affichees : 1 en attente, 0 partielles, 1 complete, 0 en retard
- 1 commande a expedier : **SO-2026-00131** — BCK 2 chez Holding SEG — Validee — 0%
- Screenshot : `.playwright-mcp/screenshots/expedition-02-page-expeditions-20260416.png`

### 2. Clic sur "Expedier"

- **Le modal S'OUVRE** immediatement (pas de delai)
- Titre : "Expedier Commande Client"
- Sous-titre : "SO-2026-00131 - BCK 2 chez Holding SEG"
- **Step 1 (Stock)** affiche correctement :
  - Stepper : "1 Stock → 2 Mode"
  - Produit : "Presentoir exterieur B&W Burgers" (SEP-0002)
  - Commande : 1, Deja exp. : 0, Stock : 8, A expedier : 1
  - Bouton "Tout expedier" disponible
  - Boutons "Annuler" et "Suivant"
- Screenshot : `.playwright-mcp/screenshots/expedition-03-after-click-expedier-20260416.png`

### 3. Clic sur "Suivant" (Step 2)

- **Step 2 (Mode de livraison)** affiche les 4 options :
  - Retrait client
  - Main propre
  - Expedition manuelle
  - Packlink PRO (Recommande)
- Boutons "Retour" et (apres selection) "Valider expedition"
- Screenshot : `.playwright-mcp/screenshots/expedition-04-step2-mode-livraison-20260416.png`

### 4. Selection "Retrait client"

- Option selectionnee (surlignee en bleu)
- Bouton **"Valider expedition"** apparait en bas a droite
- Le wizard est pret a valider l'expedition avec la methode choisie
- Screenshot : `.playwright-mcp/screenshots/expedition-05-after-close-modal-20260416.png`

### 5. Fermeture sans expedier (Escape)

- Modal ferme
- Page revenue a l'etat initial
- Commande toujours "Validee" a 0% — rien n'a ete expedie
- Screenshot : `.playwright-mcp/screenshots/expedition-06-modal-closed-20260416.png`

---

## Console navigateur

### Erreurs : 0

Aucune erreur JavaScript pendant tout le test.

### Warnings (5, non-bloquants) :

1. `GoTrueClient` — Multiple instances detectees (Supabase auth, benin)
2. `Image aspect ratio` — Image `/images/verone-symbol.png` (Next.js warning)
3. `Realtime subscription failed` — Notifications realtime (pas lie aux expeditions)
4. `Missing Description for DialogContent` (x2) — Accessibilite Radix Dialog (benin)

---

## Conclusion

| Aspect           | Resultat                        |
| ---------------- | ------------------------------- |
| Modal s'ouvre    | OUI                             |
| Donnees chargees | OUI (produit, stock, quantites) |
| Step 1 Stock     | OK (selection quantites)        |
| Step 2 Mode      | OK (4 options affichees)        |
| Bouton Valider   | OK (apparait apres selection)   |
| Erreurs JS       | 0                               |
| Erreurs reseau   | 0                               |

**Le wizard d'expedition fonctionne en environnement dev.**

---

## Hypotheses pour le probleme en production (Pokawa Limoges)

1. **Probleme specifique a la commande Pokawa Limoges** — Donnees manquantes (produit supprime, stock null, items vides) qui pourraient faire crasher le wizard pour CETTE commande specifique

2. **Build de production different** — Le comportement en dev (avec webpack HMR) peut differer du build Vercel (turbopack/optimisations). Un import qui fonctionne en dev pourrait echouer en build

3. **Probleme temporaire resolu** — Erreur reseau, timeout Supabase, ou session expiree au moment du test de Romeo

4. **Ancienne version deployee** — Si la production n'a pas ete redeployee apres les derniers fixes, l'ancienne version (avec le bug) pourrait encore etre en ligne

## Prochaines etapes recommandees

1. **Tester en production** (verone-backoffice.vercel.app) avec Playwright pour voir si le bug existe la-bas
2. **Tester avec la commande Pokawa Limoges specifique** — Verifier si cette commande a des donnees particulieres qui feraient crasher le wizard
3. **Verifier le dernier deploiement Vercel** — Est-ce que staging a ete merge dans main et deploye ?
4. **Faire un build local** (`pnpm --filter @verone/back-office build`) pour verifier que la version compilee fonctionne aussi

---

FIN DU RAPPORT
