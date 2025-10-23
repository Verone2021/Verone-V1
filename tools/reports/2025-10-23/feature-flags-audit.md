# 🚩 Audit Feature Flags & Mapping Routes - Vérone Phase 1

**Date** : 2025-10-23  
**Objectif** : Mapper feature flags existants avec routes réelles et identifier incohérences

---

## 📋 ÉTAT ACTUEL FEATURE FLAGS

### Fichier Source
**Emplacement** : `src/lib/feature-flags.ts`  
**Dernière mise à jour** : 2025-10-21 (selon commentaires)

### Configuration Actuelle

```typescript
// PHASES
phase1Enabled: true   // Auth + Profil + Dashboard
phase2Enabled: false  // Stocks + Commandes
phase3Enabled: false  // Interactions + Canaux

// MODULES PHASE 1
dashboardEnabled: true
profilesEnabled: true
catalogueEnabled: false     // ⚠️ Désactivé
sourcingEnabled: false      // ⚠️ Désactivé

// MODULES PHASE 2
stocksEnabled: false
commandesEnabled: false

// MODULES PHASE 3
interactionsEnabled: false
canauxVenteEnabled: false
contactsEnabled: true       // ✅ ACTIF

// MODULES SPÉCIAUX
adminEnabled: true
parametresEnabled: true
testsManuelsEnabled: false

// FEATURES SPÉCIFIQUES
photoUploadWorkflowEnabled: false
googleMerchantSyncEnabled: false
mcpMonitoringEnabled: false

// MODULES FINANCE
financeEnabled: false
facturationEnabled: false
tresorerieEnabled: false
rapprochementEnabled: false
```

---

## 🗺️ MAPPING FEATURE FLAGS → ROUTES

### ✅ MODULES ACTIFS (Souhait Déploiement Phase 1)

| Feature Flag | Route Réelle | État Sidebar | Statut |
|--------------|--------------|--------------|--------|
| `dashboardEnabled: true` | `/dashboard` | ✅ Affiché | ✅ OK |
| `profilesEnabled: true` | `/profile` | ❌ Non affiché | ⚠️ Manquant sidebar |
| `contactsEnabled: true` | `/contacts-organisations` | ✅ Affiché (`/organisation`) | ⚠️ **INCOHÉRENCE ROUTE** |
| `adminEnabled: true` | `/admin` | ❌ Non affiché | ⚠️ Manquant sidebar |
| `parametresEnabled: true` | `/parametres` | ❌ Non affiché | ⚠️ Manquant sidebar |

**Problèmes identifiés** :
1. 🔥 **Duplication route organisations** : 
   - Sidebar pointe vers `/organisation`
   - Code utilise `/contacts-organisations` partout
   - Flag nommé `contactsEnabled` (ambigu)

2. ⚠️ **Sidebar incomplet** : 
   - Profile, Admin, Paramètres absents de sidebar
   - Seuls Dashboard + Organisations affichés

---

## ❌ MODULES DÉSACTIVÉS (Phase 2+)

| Feature Flag | Route Réelle | Protection | Statut |
|--------------|--------------|------------|--------|
| `catalogueEnabled: false` | `/produits/catalogue` | ❌ Aucune | 🔥 **ACCESSIBLE** |
| `sourcingEnabled: false` | `/produits/sourcing` | ❌ Aucune | 🔥 **ACCESSIBLE** |
| `stocksEnabled: false` | `/stocks` | ❌ Aucune | 🔥 **ACCESSIBLE** |
| `commandesEnabled: false` | `/commandes` | ❌ Aucune | 🔥 **ACCESSIBLE** |
| `interactionsEnabled: false` | `/interactions`, `/consultations` | ❌ Aucune | 🔥 **ACCESSIBLE** |
| `canauxVenteEnabled: false` | `/canaux-vente` | ❌ Aucune | 🔥 **ACCESSIBLE** |
| `financeEnabled: false` | `/finance`, `/factures`, `/tresorerie` | ✅ Page bloquée | ✅ OK (composant existant) |

**Problème critique** :
- 🔥 **Aucun middleware protection routes**
- Modules désactivés accessibles en tapant URL directement
- **Seul module finance** implémente protection au niveau composant

---

## 🔍 ANALYSE DÉTAILLÉE PAR MODULE

### Dashboard (✅ ACTIF)
- **Flag** : `dashboardEnabled: true`
- **Route** : `/dashboard`
- **Sidebar** : ✅ Affiché (icône Home)
- **Protection** : ❌ Aucune (mais module actif donc OK)
- **Statut** : ✅ **OK**

### Profile (✅ ACTIF)
- **Flag** : `profilesEnabled: true`
- **Route** : `/profile`
- **Sidebar** : ❌ Non affiché
- **Protection** : ❌ Aucune (mais module actif donc OK)
- **Recommandation** : Ajouter dans sidebar (menu utilisateur dropdown)

### Organisations & Contacts (✅ ACTIF)
- **Flag** : `contactsEnabled: true`
- **Routes existantes** :
  - `/organisation` (page principale dans sidebar)
  - `/contacts-organisations` (utilisé partout dans le code)
  - `/contacts-organisations/suppliers`
  - `/contacts-organisations/customers`
  - `/contacts-organisations/partners`
  - `/contacts-organisations/contacts`
- **Sidebar** : ✅ Affiché (pointe vers `/organisation`)
- **Protection** : ❌ Aucune (mais module actif donc OK)
- **Problème** : 
  - 🔥 **Duplication routes** : `/organisation` ET `/contacts-organisations`
  - Sidebar utilise `/organisation` (ligne 60)
  - Code backend/composants utilise `/contacts-organisations`
- **Recommandation** : 
  - **Option A** : Rediriger `/organisation` → `/contacts-organisations` (middleware)
  - **Option B** : Rediriger `/contacts-organisations` → `/organisation` (refactor complet code)
  - **Option C recommandée** : Conserver les deux, ajouter redirect dans `/organisation/page.tsx`

### Admin (✅ ACTIF)
- **Flag** : `adminEnabled: true`
- **Route** : `/admin`
- **Sidebar** : ❌ Non affiché
- **Protection** : ❌ Aucune (mais module actif donc OK)
- **Recommandation** : Ajouter dans sidebar (section Administration, visible si role=admin/owner)

### Paramètres (✅ ACTIF)
- **Flag** : `parametresEnabled: true`
- **Route** : `/parametres`
- **Sidebar** : ❌ Non affiché
- **Protection** : ❌ Aucune (mais module actif donc OK)
- **Recommandation** : Ajouter dans sidebar (icône Settings, bas de sidebar)

### Produits/Catalogue (❌ DÉSACTIVÉ)
- **Flag** : `catalogueEnabled: false`
- **Routes** :
  - `/produits/catalogue`
  - `/produits/catalogue/[productId]`
  - `/produits/catalogue/dashboard`
  - `/produits/catalogue/variantes/[groupId]`
- **Sidebar** : ❌ Non affiché (OK)
- **Protection** : 🔥 **AUCUNE** - Routes accessibles directement
- **Recommandation** : Middleware bloquant accès + page "Coming Soon"

### Sourcing (❌ DÉSACTIVÉ)
- **Flag** : `sourcingEnabled: false`
- **Routes** :
  - `/produits/sourcing`
  - `/produits/sourcing/produits`
  - `/produits/sourcing/produits/[id]`
- **Sidebar** : ❌ Non affiché (OK)
- **Protection** : 🔥 **AUCUNE**
- **Recommandation** : Middleware bloquant accès

### Stocks (❌ DÉSACTIVÉ)
- **Flag** : `stocksEnabled: false`
- **Routes** :
  - `/stocks`
  - `/stocks/mouvements`
  - `/stocks/alertes`
  - `/stocks/receptions`
  - `/stocks/inventaire`
- **Sidebar** : ❌ Non affiché (OK)
- **Protection** : 🔥 **AUCUNE**
- **Recommandation** : Middleware bloquant accès

### Commandes (❌ DÉSACTIVÉ)
- **Flag** : `commandesEnabled: false`
- **Routes** :
  - `/commandes`
  - `/commandes/clients`
  - `/commandes/fournisseurs`
  - `/commandes/expeditions`
- **Sidebar** : ❌ Non affiché (OK)
- **Protection** : 🔥 **AUCUNE**
- **Recommandation** : Middleware bloquant accès

### Finance (❌ DÉSACTIVÉ)
- **Flag** : `financeEnabled: false`
- **Routes** :
  - `/finance`
  - `/factures`
  - `/factures/[id]`
  - `/finance/depenses`
  - `/finance/depenses/[id]`
  - `/finance/rapprochement`
  - `/tresorerie`
- **Sidebar** : ❌ Non affiché (OK)
- **Protection** : ✅ **IMPLÉMENTÉE** au niveau composant
  - Chaque page vérifie `featureFlags.financeEnabled`
  - Affiche message "Module Finance désactivé pour Phase 1"
- **Statut** : ✅ OK (modèle à suivre)

### Interactions/Consultations (❌ DÉSACTIVÉ)
- **Flag** : `interactionsEnabled: false`
- **Routes** :
  - `/interactions`
  - `/interactions/dashboard`
  - `/consultations`
  - `/consultations/create`
- **Sidebar** : ❌ Non affiché (OK)
- **Protection** : 🔥 **AUCUNE**
- **Recommandation** : Middleware bloquant accès

### Canaux de Vente (❌ DÉSACTIVÉ)
- **Flag** : `canauxVenteEnabled: false`
- **Routes** :
  - `/canaux-vente`
  - `/ventes`
- **Sidebar** : ❌ Non affiché (OK)
- **Protection** : 🔥 **AUCUNE**
- **Recommandation** : Middleware bloquant accès

---

## 🚨 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. 🔥 Aucun Middleware Protection Routes

**Problème** :
- Modules désactivés accessibles en tapant URL manuellement
- Exemple : `http://localhost:3000/produits/catalogue` → Page charge (avec potentiels bugs)

**Impact** :
- Utilisateurs peuvent accéder fonctionnalités non validées
- Risque console errors, data corruption, bugs métier

**Solution recommandée** :
Créer `src/middleware.ts` Next.js :

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { featureFlags } from '@/lib/feature-flags'

const INACTIVE_ROUTES = [
  '/produits',
  '/stocks',
  '/commandes',
  '/ventes',
  '/interactions',
  '/consultations',
  '/canaux-vente',
  '/notifications',
  '/tests-essentiels'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si route désactivée
  for (const route of INACTIVE_ROUTES) {
    if (pathname.startsWith(route)) {
      // Rediriger vers page "Module non déployé"
      const url = request.nextUrl.clone()
      url.pathname = '/module-inactive'
      url.searchParams.set('module', route.replace('/', ''))
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### 2. ⚠️ Duplication Routes Organisations

**Problème** :
- Sidebar pointe `/organisation`
- Code utilise `/contacts-organisations`
- Deux pages distinctes avec contenu similaire

**Impact** :
- Confusion utilisateur
- Maintenance double
- Risque désynchronisation

**Solutions possibles** :

**Option A (Recommandée)** : Redirect dans `/organisation/page.tsx`
```typescript
// src/app/organisation/page.tsx
import { redirect } from 'next/navigation'

export default function OrganisationPage() {
  redirect('/contacts-organisations')
}
```

**Option B** : Middleware redirect
```typescript
// src/middleware.ts
if (pathname === '/organisation') {
  return NextResponse.redirect(new URL('/contacts-organisations', request.url))
}
```

**Option C** : Refactor complet (long terme)
- Supprimer `/contacts-organisations`
- Tout migrer vers `/organisation`
- Refactor tous liens/imports

### 3. ⚠️ Flag `contactsEnabled` Ambigu

**Problème** :
- Flag nommé `contactsEnabled`
- Route réelle : `/contacts-organisations` (organisations ≠ contacts)
- Sous-route `/contacts-organisations/contacts` existe aussi

**Confusion** :
- `contactsEnabled` contrôle module Organisations (fournisseurs, clients, prestataires)
- Pas uniquement les "contacts" (personnes)

**Recommandation** :
Renommer flag pour clarté :
```typescript
// src/lib/feature-flags.ts
organisationsEnabled: true  // Au lieu de contactsEnabled
contactsPersonnesEnabled: true  // Pour sous-module contacts
```

### 4. ⚠️ Sidebar Incomplète

**Problème** :
Sidebar affiche seulement :
- Dashboard
- Organisations & Contacts

**Manquants** :
- Profile (lien vers `/profile`)
- Admin (si role admin/owner)
- Paramètres (lien vers `/parametres`)

**Recommandation** :
Enrichir sidebar avec modules actifs manquants.

---

## ✅ RECOMMANDATIONS PRIORITAIRES

### Urgentes (Avant Déploiement)

1. 🔥 **Créer middleware protection routes** (CRITIQUE)
   - Bloquer accès modules désactivés
   - Rediriger vers page "Module non déployé"
   - Temps estimé : 30 min

2. ⚠️ **Résoudre duplication organisations** (IMPORTANT)
   - Implémenter redirect `/organisation` → `/contacts-organisations`
   - Temps estimé : 10 min

3. ⚠️ **Enrichir sidebar** (IMPORTANT)
   - Ajouter Profile (dropdown menu utilisateur)
   - Ajouter Admin (si role approprié)
   - Ajouter Paramètres (bas sidebar)
   - Temps estimé : 20 min

### Moyennes (Post-Déploiement)

4. 📝 **Renommer flag `contactsEnabled`** → `organisationsEnabled`
   - Clarifier intention flag
   - Temps estimé : 15 min

5. 📝 **Documenter mapping flags→routes**
   - Créer tableau référence dans CLAUDE.md
   - Temps estimé : 10 min

---

## 📊 RÉSUMÉ FEATURE FLAGS vs ROUTES

### Modules Actifs (5)

| Module | Flag | Route | Sidebar | Protection | Statut |
|--------|------|-------|---------|------------|--------|
| Dashboard | ✅ true | /dashboard | ✅ | ❌ (OK) | ✅ OK |
| Profile | ✅ true | /profile | ❌ | ❌ (OK) | ⚠️ Manque sidebar |
| Organisations | ✅ true | /organisation ⚠️ /contacts-organisations | ✅ | ❌ (OK) | ⚠️ Duplication |
| Admin | ✅ true | /admin | ❌ | ❌ (OK) | ⚠️ Manque sidebar |
| Paramètres | ✅ true | /parametres | ❌ | ❌ (OK) | ⚠️ Manque sidebar |

### Modules Désactivés (9)

| Module | Flag | Route(s) | Sidebar | Protection | Statut |
|--------|------|----------|---------|------------|--------|
| Catalogue | ❌ false | /produits/catalogue | ❌ | 🔥 **AUCUNE** | 🔥 CRITIQUE |
| Sourcing | ❌ false | /produits/sourcing | ❌ | 🔥 **AUCUNE** | 🔥 CRITIQUE |
| Stocks | ❌ false | /stocks | ❌ | 🔥 **AUCUNE** | 🔥 CRITIQUE |
| Commandes | ❌ false | /commandes | ❌ | 🔥 **AUCUNE** | 🔥 CRITIQUE |
| Interactions | ❌ false | /interactions | ❌ | 🔥 **AUCUNE** | 🔥 CRITIQUE |
| Consultations | ❌ false | /consultations | ❌ | 🔥 **AUCUNE** | 🔥 CRITIQUE |
| Canaux Vente | ❌ false | /canaux-vente, /ventes | ❌ | 🔥 **AUCUNE** | 🔥 CRITIQUE |
| Finance | ❌ false | /finance, /factures, /tresorerie | ❌ | ✅ Composant | ✅ OK |
| Notifications | ❌ false | /notifications | ❌ | 🔥 **AUCUNE** | 🔥 CRITIQUE |

---

## 🎯 CONCLUSION

### État Global

🔴 **NON DÉPLOYABLE EN L'ÉTAT** : Modules désactivés accessibles sans protection

### Actions Bloquantes

1. ✅ Créer middleware protection routes (MANDATORY)
2. ✅ Résoudre duplication organisations (IMPORTANT)
3. ✅ Enrichir sidebar modules actifs (IMPORTANT)

### Timeline Recommandée

- **Middleware** : 30 min
- **Duplication** : 10 min
- **Sidebar** : 20 min
- **TOTAL** : **~1h**

### Validation Déploiement

✅ **Prêt pour déploiement** après :
- [ ] Middleware implémenté et testé
- [ ] Duplication résolue
- [ ] Sidebar enrichie
- [ ] Tests accès routes (actifs=200, désactivés=404)

---

**Rapport généré par Claude Code - 2025-10-23**  
**Prochaine étape** : Phase 2 - Implémentation fixes critiques
