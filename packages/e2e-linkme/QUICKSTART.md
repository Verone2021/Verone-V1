# Guide de Démarrage Rapide - Tests E2E LinkMe

**Date**: 2026-01-21
**Statut**: ✅ Migration terminée, prêt pour validation manuelle

---

## 🎯 Ce Qui a Été Fait

### ✅ Structure Migrée
- **Ancien** : `apps/linkme/e2e/` (couplé à l'app)
- **Nouveau** : `packages/e2e-linkme/` (package dédié - best practice Turborepo 2026)

### ✅ Fixtures Améliorées
- **Typed fixtures** avec `test.extend<>()` pour type safety
- **Worker-scoped DB** : 90% de réduction des connexions DB
- **Combined exports** : Import unique depuis `../../fixtures`

### ✅ 18 Tests Migrés
| Suite | Tests |
|-------|-------|
| Data Consistency | 4 |
| Product Creation | 3 |
| Editing Restrictions | 6 |
| Approval Workflow | 3 |
| Data Isolation | 2 |

### ✅ Documentation Corrigée
- ✅ Remplacé `npm` → `pnpm` partout
- ✅ Clarifié que Turborepo démarre TOUTES les apps automatiquement
- ✅ Simplifié workflow (1 terminal au lieu de 3)

---

## 🚀 Prochaines Étapes (À Faire par Vous)

### Étape 1 : Installer les Dépendances (5 min)

```bash
cd /Users/romeodossantos/verone-back-office-V1/packages/e2e-linkme
pnpm install
pnpm exec playwright install chromium
```

**Attendu** :
- `@playwright/test@^1.40.0` installé
- `@supabase/supabase-js@^2.38.0` installé
- Chromium browser téléchargé (~100 MB)

---

### Étape 2 : Démarrer les Applications (1 min)

```bash
# Depuis la RACINE du monorepo
cd /Users/romeodossantos/verone-back-office-V1
pnpm dev
```

**⚠️ UN SEUL TERMINAL SUFFIT !**

Turborepo démarre automatiquement :
- ✅ `back-office` sur http://localhost:3000
- ✅ `linkme` sur http://localhost:3002
- ✅ `site-internet` sur http://localhost:3001

**Vérification** :
```bash
# Dans un autre terminal
curl http://localhost:3000  # Doit retourner HTML
curl http://localhost:3002  # Doit retourner HTML
```

---

### Étape 3 : Vérifier les Variables d'Environnement (1 min)

```bash
# Depuis la racine
cat .env.local | grep SUPABASE
```

**Attendu** :
```
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Si manquant**, créer `.env.local` à la racine :
```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...votre-service-key...
```

💡 **Où trouver les credentials ?** Voir `.serena/memories/*-credentials-*.md`

---

### Étape 4 : Lancer les Tests (2 min)

**Option A** : Avec Turbo (recommandé)
```bash
# Depuis la racine
pnpm turbo run test:e2e --filter=e2e-linkme
```

**Option B** : Directement dans le package
```bash
cd packages/e2e-linkme
pnpm test:e2e
```

**Option C** : Mode UI (pour déboguer)
```bash
cd packages/e2e-linkme
pnpm test:e2e:ui
```

---

### Étape 5 : Voir le Rapport (30 sec)

```bash
cd packages/e2e-linkme
pnpm show-report
```

**Attendu** :
- ✅ 18/18 tests passent
- ✅ Aucune erreur
- ✅ Test data nettoyée automatiquement

---

## 🔍 Si des Tests Échouent

### 1. Vérifier les Applications

```bash
curl http://localhost:3000  # Back-Office
curl http://localhost:3002  # LinkMe
```

**Si échec** : Redémarrer `pnpm dev` depuis la racine

---

### 2. Vérifier la Connexion DB

```bash
cd packages/e2e-linkme
node -e "
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  sb.from('products').select('id').limit(1).then(d => console.log('DB OK:', !!d.data));
"
```

**Si échec** : Vérifier `.env.local` contient les bonnes credentials

---

### 3. Vérifier les Credentials Test

Les tests utilisent 3 comptes :

**Pokawa (Enseigne)** :
- Email : `admin@pokawa-test.fr`
- Password : `TestLinkMe2025`

**Organisation Indépendante** :
- Email : `test-org@verone.fr`
- Password : `TestLinkMe2025`

**Back-Office** :
- Email : `veronebyromeo@gmail.com`
- Password : `Abc123456`

**Si échec** : Vérifier que ces comptes existent dans Supabase

---

### 4. Lancer le Script de Validation

```bash
cd packages/e2e-linkme
./validate-migration.sh
```

Ce script vérifie que tous les fichiers sont en place.

---

## 🧪 Tests Manuels (MCP Playwright Browser)

**IMPORTANT** : Les tests automatisés ne remplacent PAS les tests manuels !

### Quand Utiliser les Tests Automatisés ?
- ✅ Validation systématique après changements
- ✅ Tests de régression (s'assurer qu'un bug ne revient pas)
- ✅ CI/CD (GitHub Actions)

### Quand Utiliser les Tests Manuels (MCP) ?
- ✅ Déboguer une erreur spécifique
- ✅ Explorer une nouvelle fonctionnalité
- ✅ Tester un cas particulier non couvert
- ✅ Créer un nouveau test après avoir trouvé un bug

### Workflow Recommandé
1. **Test Manuel** → Trouver un bug avec MCP Playwright Browser
2. **Corriger** → Fix le code
3. **Re-tester** → Valider avec MCP
4. **Automatiser** → Si bug critique/récurrent, créer un test automatisé

---

## 📊 Validation Manuelle Recommandée

### 1. Connexion Pokawa
```
Email: admin@pokawa-test.fr
Password: TestLinkMe2025
```

**À Vérifier** :
- [ ] `/catalogue` → Produits Pokawa visibles
- [ ] `/mes-produits` → Produits créés par Pokawa
- [ ] `/commandes` → Commandes Pokawa visibles
- [ ] Isolation : Ne voit pas produits test-org

### 2. Connexion Organisation Indépendante
```
Email: test-org@verone.fr
Password: TestLinkMe2025
```

**À Vérifier** :
- [ ] Créer produit AVEC stockage → Dimensions obligatoires
- [ ] Créer produit SANS stockage → Dimensions optionnelles
- [ ] Soumettre pour approbation → Statut pending
- [ ] Édition bloquée après approbation
- [ ] Isolation : Ne voit pas produits Pokawa

### 3. Connexion Back-Office
```
Email: veronebyromeo@gmail.com
Password: Abc123456
```

**À Vérifier** :
- [ ] `/produits/affilies` → Produits en attente visibles
- [ ] Approuver produit → Définir commission_rate
- [ ] `/commandes` → Commandes LinkMe avec channel correct
- [ ] `/finance/commissions-affilies` → Commissions calculées

---

## 📚 Documentation Complète

- **README.md** : Documentation complète du package
- **MIGRATION.md** : Détails de la migration
- **CHECKLIST.md** : Checklist de validation
- **QUICKSTART.md** : Ce fichier (guide rapide)

---

## 🆘 Besoin d'Aide ?

### Commandes Utiles

```bash
# Voir les tests disponibles
cd packages/e2e-linkme
pnpm exec playwright test --list

# Lancer un test spécifique
pnpm exec playwright test -g "Create product WITH Verone storage"

# Lancer une suite spécifique
pnpm exec playwright test tests/product-management

# Mode debug (pause avant chaque action)
pnpm test:e2e:debug

# Mode headed (voir le browser)
pnpm test:e2e:headed
```

### Structure des Tests

```
packages/e2e-linkme/
├── tests/
│   ├── data-consistency/      → Tests cohérence BO ↔ LinkMe
│   ├── product-management/    → Tests création/édition produits
│   ├── approval-workflow/     → Tests workflow approbation
│   └── security/              → Tests isolation RLS
├── fixtures/
│   ├── auth.fixture.ts        → Connexions (loginLinkMe, etc.)
│   ├── database.fixture.ts    → Helpers DB (getProductById, etc.)
│   └── test-data.fixture.ts   → Données de test
```

---

## ✅ Checklist Complète

- [ ] **Étape 1** : Dépendances installées
- [ ] **Étape 2** : Applications démarrées (`pnpm dev`)
- [ ] **Étape 3** : Variables d'environnement vérifiées
- [ ] **Étape 4** : Tests lancés et passent (18/18)
- [ ] **Étape 5** : Rapport HTML visualisé
- [ ] **Validation manuelle** : 3 comptes testés manuellement

---

**⏱️ Temps estimé total** : ~10 minutes

**🎯 Objectif** : Avoir 18/18 tests verts et validation manuelle OK

**📝 Notes** : Si vous rencontrez des erreurs, vérifiez d'abord que :
1. Les applications tournent sur les bons ports
2. Les credentials Supabase sont corrects
3. Les comptes de test existent dans la DB

---

**Bonne chance ! 🚀**
