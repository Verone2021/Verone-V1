# Plan de Test - Refonte Canaux de Vente

**Date** : 2026-01-23
**Branches** : `feat/BO-DASH-CLEANUP-remove-old-dashboard`
**Commits** :
- `1cf1e7e1` - Phase 1 (Dashboard RÉEL)
- `fa2cc973` - Phase 2 (Routing LinkMe)

---

## ✅ Tests Statiques (PASSED)

### Type-check
```bash
pnpm type-check
```
**Résultat** : ✅ PASSED (back-office + linkme)

### Build Production
```bash
pnpm --filter @verone/back-office build
pnpm --filter @verone/linkme build
```
**Résultat** : ✅ SUCCESS

---

## 📋 Tests Manuels

### 1. Back-Office - Dashboard Canaux de Vente

#### 1.1 Navigation Sidebar
- [ ] Ouvrir le back-office (http://localhost:3000)
- [ ] Se connecter avec credentials Pokawa
- [ ] **Vérifier** : Menu "Canaux de Vente" visible avec icône Store
- [ ] **Cliquer** sur "Canaux de Vente" → dropdown s'ouvre
- [ ] **Vérifier** : 3 sous-items (LinkMe, Site Internet, Google Merchant)
- [ ] **Vérifier** : Badge rouge sur "Canaux de Vente" si commissions LinkMe en attente
- [ ] **Vérifier** : Badge rouge sur "LinkMe" (même nombre)

#### 1.2 Page Dashboard (/canaux-vente)
- [ ] **Naviguer** vers "Canaux de Vente" (page principale)
- [ ] **Vérifier** : Header avec titre + boutons "Paramètres" et "Nouveau Canal"
- [ ] **Vérifier** : 4 KPIs en haut :
  - CA Total (LinkMe + Google Merchant)
  - Commandes (total des 2 canaux)
  - Produits Actifs (Google Merchant)
  - Canaux Actifs (2)

#### 1.3 Cartes Canaux
- [ ] **Vérifier** : Carte "LinkMe" affichée
  - CA ce mois (données RÉELLES Pokawa)
  - Commandes ce mois
  - Commissions à payer (montant + pastille orange)
  - Croissance vs moyenne mensuelle
- [ ] **Vérifier** : Carte "Google Merchant Center" affichée
  - CA ce mois (données RÉELLES)
  - Commandes (conversions)
  - Produits (total)
- [ ] **Vérifier** : Carte "Site Internet" affichée
  - Status "Non disponible"
  - Message : "Ce module sera disponible prochainement"
  - Icône AlertCircle visible

#### 1.4 Insights
- [ ] **Vérifier** : Section "LinkMe - Performance"
  - Affiliés actifs (nombre réel)
  - Nouveaux ce mois (avec +X)
  - Commissions en attente (X demandes)
- [ ] **Vérifier** : Section "Google Merchant - Statut"
  - Produits approuvés (vert)
  - En attente (jaune)
  - Taux de conversion (%)

#### 1.5 Navigation
- [ ] **Cliquer** sur carte "LinkMe" → redirige vers `/canaux-vente/linkme`
- [ ] **Cliquer** sur carte "Google Merchant" → redirige vers `/canaux-vente/google-merchant`
- [ ] **Cliquer** sur carte "Site Internet" → aucune action (désactivée)

**Critères de succès Phase 1** :
- ✅ Aucune donnée hardcodée visible
- ✅ Tous les chiffres correspondent aux données réelles de la DB
- ✅ Pas d'erreur console
- ✅ Navigation fluide

---

### 2. LinkMe - Pages Publiques (Routing)

#### 2.1 Préparation
- [ ] Identifier un slug de sélection publique Pokawa
  - Option 1 : Ouvrir LinkMe back-office → "Ma sélection" → copier slug URL
  - Option 2 : Query DB : `SELECT id FROM linkme_selections WHERE published_at IS NOT NULL LIMIT 1`
- [ ] Exemple slug : `pokawa-selection-noel-2026`

#### 2.2 Test Redirect (Route principale)
- [ ] **Naviguer** vers `http://localhost:3002/s/{slug}`
- [ ] **Vérifier** : Redirect automatique vers `http://localhost:3002/s/{slug}/catalogue`
- [ ] **Vérifier** : URL change dans le navigateur
- [ ] **Vérifier** : Onglet "Catalogue" actif dans la nav

#### 2.3 Route /catalogue
- [ ] **URL** : `http://localhost:3002/s/{slug}/catalogue`
- [ ] **Vérifier** : Header avec nom de la sélection
- [ ] **Vérifier** : Hero section (image ou gradient)
- [ ] **Vérifier** : Tabs navigation (Catalogue | Points de vente* | FAQ | Contact)
- [ ] **Vérifier** : Onglet "Catalogue" souligné (barre de couleur primaire)
- [ ] **Vérifier** : Barre de catégories horizontale visible
- [ ] **Vérifier** : Grille de produits (2 cols mobile, 3-4 cols desktop)
- [ ] **Vérifier** : Bouton "Ajouter" sur chaque produit
- [ ] **Tester** : Ajouter un produit → badge panier apparaît
- [ ] **Vérifier** : Panier flottant en bas à droite (si items)
- [ ] **Vérifier** : Pagination si > 12 produits

#### 2.4 Route /points-de-vente (si enseigne)
- [ ] **Cliquer** sur onglet "Points de vente" (si visible)
- [ ] **Vérifier** : URL change vers `/s/{slug}/points-de-vente`
- [ ] **Vérifier** : Carte interactive affichée
- [ ] **Vérifier** : Markers pour organisations avec coordonnées
- [ ] **Vérifier** : Popup au hover/click (nom + ville)
- [ ] **Vérifier** : Historique navigateur fonctionne (back button)

#### 2.5 Route /faq
- [ ] **Cliquer** sur onglet "FAQ"
- [ ] **Vérifier** : URL change vers `/s/{slug}/faq`
- [ ] **Vérifier** : Section FAQ avec questions/réponses
- [ ] **Vérifier** : Accordéons fonctionnels
- [ ] **Vérifier** : Informations de contact affichées

#### 2.6 Route /contact
- [ ] **Cliquer** sur onglet "Contact"
- [ ] **Vérifier** : URL change vers `/s/{slug}/contact`
- [ ] **Vérifier** : Formulaire de contact affiché
- [ ] **Vérifier** : Champs : Nom, Email, Message
- [ ] **Vérifier** : Bouton "Envoyer" présent

#### 2.7 Tests Navigation
- [ ] **Copier** URL `/s/{slug}/faq`
- [ ] **Ouvrir** dans nouvel onglet → page FAQ s'affiche directement
- [ ] **Partager** URL avec quelqu'un → URL fonctionne (partageable)
- [ ] **Tester** bouton "Précédent" du navigateur → fonctionne
- [ ] **Tester** bouton "Suivant" du navigateur → fonctionne
- [ ] **Vérifier** : Onglet actif correspond à l'URL

#### 2.8 Tests Panier (State partagé)
- [ ] **Sur** `/s/{slug}/catalogue` → Ajouter 2 produits
- [ ] **Naviguer** vers `/s/{slug}/faq`
- [ ] **Vérifier** : Panier flottant toujours visible (2 articles)
- [ ] **Naviguer** vers `/s/{slug}/contact`
- [ ] **Vérifier** : Panier toujours présent (state conservé)
- [ ] **Cliquer** sur panier → Modal formulaire s'ouvre
- [ ] **Vérifier** : Produits dans le formulaire

**Critères de succès Phase 2** :
- ✅ URLs propres et SEO-friendly
- ✅ Chaque route charge indépendamment (code splitting)
- ✅ State panier partagé entre routes
- ✅ Navigation navigateur fonctionne
- ✅ URLs partageables
- ✅ Pas d'erreur console

---

## 🤖 Tests Automatisés (E2E)

### Option A : Tests Playwright existants

```bash
# Depuis la racine du monorepo
cd packages/e2e-linkme
pnpm test:e2e
```

**Tests à vérifier** :
- Accès à la sélection publique
- Navigation entre onglets
- Ajout au panier
- Soumission de formulaire

### Option B : Nouveaux tests pour routing

Créer tests spécifiques pour valider :

```typescript
// packages/e2e-linkme/tests/public-selection-routing.spec.ts

test('should redirect from /s/[id] to /s/[id]/catalogue', async ({ page }) => {
  await page.goto('/s/test-selection');
  await expect(page).toHaveURL(/\/s\/test-selection\/catalogue/);
});

test('should navigate between routes', async ({ page }) => {
  await page.goto('/s/test-selection/catalogue');

  // Click FAQ tab
  await page.click('text=FAQ');
  await expect(page).toHaveURL(/\/faq$/);

  // Click Contact tab
  await page.click('text=Contact');
  await expect(page).toHaveURL(/\/contact$/);
});

test('should preserve cart state across routes', async ({ page }) => {
  await page.goto('/s/test-selection/catalogue');

  // Add product to cart
  await page.click('[data-testid="add-to-cart"]:first-child');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

  // Navigate to FAQ
  await page.click('text=FAQ');

  // Cart should still show 1 item
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
});
```

---

## 🔍 Tests de Performance

### Vérifier Code Splitting

```bash
# Analyser le build
pnpm --filter @verone/linkme build

# Vérifier les tailles des routes
ls -lh apps/linkme/.next/server/app/\(public\)/s/\[id\]/*/page.js
```

**Critères** :
- `/catalogue/page.js` : ~1-2 kB
- `/faq/page.js` : ~400-500 B
- `/contact/page.js` : ~400-500 B
- `/points-de-vente/page.js` : ~500-600 B

**Avant refonte** : 31 KB dans un seul fichier
**Après refonte** : 4 fichiers < 2 KB chacun (10x plus petit)

---

## 📊 Tests SEO

### Vérifier URLs
```bash
# Crawler les URLs (si lighthouse CLI installé)
lighthouse http://localhost:3002/s/pokawa-selection/catalogue --view

# Vérifier meta tags
curl -s http://localhost:3002/s/pokawa-selection/catalogue | grep -E "<title|<meta"
```

**Critères** :
- ✅ URLs propres (pas de query params)
- ✅ Chaque route a sa propre URL
- ✅ Meta tags appropriés
- ✅ Historique navigateur fonctionnel

---

## 🐛 Checklist Bugs Potentiels

### Back-Office
- [ ] Console errors sur `/canaux-vente`
- [ ] Données "undefined" ou "null" affichées
- [ ] Badge ne s'affiche pas si commissions en attente
- [ ] Croissance affiche "NaN%" ou "Infinity%"
- [ ] Navigation vers sous-pages casse

### LinkMe Public
- [ ] Console errors sur routes publiques
- [ ] Redirect `/s/[id]` ne fonctionne pas
- [ ] State panier perdu entre routes
- [ ] Tabs navigation ne change pas l'onglet actif
- [ ] URLs non partageables
- [ ] Historique navigateur cassé

---

## ✅ Validation Finale

**Phase 1 - Dashboard RÉEL** :
- [ ] Type-check PASSED
- [ ] Build SUCCESS
- [ ] Aucune donnée hardcodée
- [ ] Stats LinkMe correctes (Pokawa)
- [ ] Stats Google Merchant correctes
- [ ] Navigation sidebar fonctionne

**Phase 2 - Routing LinkMe** :
- [ ] Type-check PASSED
- [ ] Build SUCCESS
- [ ] 4 routes créées et accessibles
- [ ] Code splitting vérifié (fichiers < 2KB)
- [ ] URLs SEO-friendly
- [ ] State partagé fonctionne
- [ ] Navigation navigateur OK

---

## 🚀 Prêt pour Production

Si tous les tests ci-dessus passent :
- ✅ Merge des commits dans main
- ✅ Déploiement sur Vercel
- ✅ Validation en staging
- ✅ Déploiement en production

---

**Commandes Rapides** :
```bash
# Tests statiques
pnpm type-check
pnpm build

# Tests E2E
cd packages/e2e-linkme
pnpm test:e2e

# Lancer serveurs (pour tests manuels)
pnpm dev  # Démarre back-office (3000) + linkme (3002)
```
