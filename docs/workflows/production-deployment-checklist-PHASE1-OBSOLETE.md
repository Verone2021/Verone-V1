# ✅ Checklist Déploiement Production - Phase 1

**Vérone Back Office - Workflow Vercel**

---

## 🎯 Avant Push Main

### Code & Build
- [ ] **Tests locaux** : `npm run dev` → Application fonctionne sans erreurs
- [ ] **Build production** : `npm run build` → Compilation réussie (0 erreurs TypeScript)
- [ ] **Lint check** : `npm run lint` → Pas de warnings critiques

### Console & Browser
- [ ] **Console errors** : MCP Playwright Browser → 0 erreur console
- [ ] **Performance** : Dashboard <2s, Catalogue <3s chargement
- [ ] **Screenshots** : Preuves visuelles fonctionnalités validées

### Données & Sécurité
- [ ] **Données test** : Minimum 5 produits insérés et fonctionnels
- [ ] **.env.local NON committé** : `git status` → Pas de `.env.local` listé
- [ ] **Secrets sécurisés** : Aucun token/key dans code source

### Git
- [ ] **Commit message descriptif** : Émojis + résumé détaillé changements
- [ ] **Branch à jour** : `git pull origin main` si nécessaire
- [ ] **Conflits résolus** : Pas de conflits de merge

---

## 🚀 Pendant Déploiement

### Vercel Dashboard
- [ ] **Build status** : Monitor https://vercel.com/verone2021/verone-backoffice/deployments
- [ ] **Build logs** : Vérifier pas d'erreurs dans logs
- [ ] **Durée build** : < 5 minutes normal

### Attendre Déploiement
- [ ] **Status "Building"** → **"Ready"** (~2-3 minutes)
- [ ] **URL production** : Vérifier nouvelle version déployée

---

## ✅ Après Déploiement Production

### Tests Fonctionnels
- [ ] **URL production fonctionne** : https://verone-backoffice.vercel.app
- [ ] **Connexion Supabase OK** : Dashboard charge métriques depuis prod
- [ ] **Dashboard 8 KPIs affichés** : Tous KPIs visibles avec données correctes
- [ ] **Navigation fonctionnelle** : Sidebar + toutes routes principales
- [ ] **Authentification** : Login/logout fonctionnent
- [ ] **Recherche** : Barre recherche produits opérationnelle

### Monitoring
- [ ] **Pas d'erreurs Sentry** : https://sentry.io (0 issues critiques)
- [ ] **Vercel Analytics** : Pas de pics erreurs 404/500
- [ ] **Supabase Logs** : `mcp__supabase__get_logs` → Pas d'erreurs API

### Performance
- [ ] **Dashboard < 2s** : First Contentful Paint
- [ ] **Catalogue < 3s** : Liste produits charge rapidement
- [ ] **Lighthouse Score** : > 80 Performance (optionnel)

---

## 📦 Post-Déploiement

### Backup & Tags
- [ ] **Backup Supabase** : Export SQL via Supabase Dashboard
- [ ] **Tag Git version** :
  ```bash
  git tag v1.0.0-phase1
  git push origin v1.0.0-phase1
  ```

### Documentation
- [ ] **Changelog mis à jour** : `docs/CHANGELOG.md`
- [ ] **Release notes** : GitHub Release si applicable
- [ ] **MEMORY-BANK session** : Summary créé dans MEMORY-BANK/sessions/

### Communication
- [ ] **Équipe notifiée** : Annoncer déploiement réussi
- [ ] **URL production partagée** : Envoyer lien si démo

---

## 🚨 Rollback Urgence (Si Problème)

### Option 1 : Vercel Rollback Instant (RAPIDE)
1. Vercel Dashboard → **Deployments**
2. Trouver dernier déploiement stable (avant problème)
3. Cliquer **︙** → **Promote to Production**
4. **Résultat** : Production restaurée en ~30 secondes

### Option 2 : Git Revert
```bash
git log --oneline -5  # Identifier commit problématique
git revert <commit-hash>
git push origin main
```

---

## 📊 Métriques Cibles Phase 1

### Performance
- Dashboard : **< 2 secondes**
- Catalogue : **< 3 secondes**
- Feeds : **< 10 secondes**
- PDF : **< 5 secondes**

### Qualité
- Console errors : **0 tolérance**
- TypeScript errors : **0**
- ESLint warnings : **< 5**
- Lighthouse Performance : **> 80**

### Données
- Produits actifs : **≥ 5** (test) ou **≥ 50** (complet)
- Collections : **≥ 2**
- Organisations : **≥ 5**
- Console errors production : **0** après 24h

---

## 🎯 Checklist Rapide (Mémo)

```bash
# Avant
✅ npm run build → OK
✅ MCP Browser → 0 errors
✅ git status → pas .env.local

# Push
git add .
git commit -m "✨ [Description]"
git push origin main

# Après (2-3 min)
✅ Vercel Status → Ready
✅ URL prod → Fonctionne
✅ Dashboard → 8 KPIs OK
✅ Sentry → 0 issues
✅ Tag git → v1.0.0-phase1
```

---

*Checklist créée le 2025-10-01 - Vérone Back Office Phase 1*
