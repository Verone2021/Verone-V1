# 🔒 Plan d'Action Sécurité Phase 3

**Date création** : 8 octobre 2025
**Priorité** : 🔴 **BLOCKER PRODUCTION**
**Score actuel** : 75/100 → Cible : 95/100

---

## 📋 TÂCHES PRIORITAIRES

### 🔴 PRIORITÉ P0 - BLOCKER (4h) - CETTE SEMAINE

**Deadline** : AVANT tout déploiement production

#### Tâche 1 : Appliquer Migration RLS

**Fichier** : `supabase/migrations/20251008_003_fix_missing_rls_policies.sql`

**Actions** :
- [ ] Review migration avec tech lead
- [ ] Appliquer en staging
  ```bash
  # Staging
  psql $STAGING_DB_URL -f supabase/migrations/20251008_003_fix_missing_rls_policies.sql
  ```
- [ ] Tester accès multi-organisations
  ```sql
  -- Test utilisateur org A ne voit pas données org B
  SET SESSION ROLE authenticated;
  SET request.jwt.claims.sub TO '<user_org_A>';
  SELECT * FROM variant_groups WHERE subcategory_id IN (
    SELECT id FROM subcategories WHERE organisation_id = '<org_B_id>'
  );
  -- ATTENDU: 0 rows
  ```
- [ ] Valider script RLS coverage
  ```bash
  ./scripts/security/validate-rls-coverage.sh
  # ATTENDU: ✅ 100% coverage
  ```
- [ ] Déployer en production
- [ ] Monitoring Sentry actif

**Validation** :
```bash
# Vérifier 100% RLS coverage
./scripts/security/validate-rls-coverage.sh
# ATTENDU: ✅ Toutes les tables ont RLS enabled

# Vérifier policies créées
psql $DATABASE_URL -c "
  SELECT tablename, COUNT(*) as policies
  FROM pg_policies
  WHERE tablename IN ('variant_groups', 'sample_orders', 'sample_order_items', 'contacts')
  GROUP BY tablename;
"
# ATTENDU: 4 policies par table
```

**Effort** : 4 heures
**Blockers** : Aucun (migration prête)
**Responsable** : [À assigner]

---

### 🟠 PRIORITÉ P1 - MAJEUR (8h) - SPRINT COURANT

**Deadline** : Fin sprint courant

#### Tâche 2 : Console.log Cleanup - API Routes

**Fichiers critiques** :
- `src/app/api/google-merchant/test-connection/route.ts` (16 occurrences)
- Autres API routes (~99 occurrences)

**Guide** : `docs/guides/GUIDE-MIGRATION-CONSOLE-LOG-TO-LOGGER.md`

**Actions** :
- [ ] Remplacer console.log par logger dans API routes
  ```typescript
  // AVANT
  console.log('API call:', req.url)
  console.error('Error:', error)

  // APRÈS
  import { logger } from '@/lib/logger'
  logger.info('API call', { method: req.method })
  logger.error('API Error', error as Error)
  ```
- [ ] Valider aucun log credentials
  ```bash
  grep -riE "console\.(log|error).*(\bpassword\b|\btoken\b|\bsecret\b)" src/app/api/
  # ATTENDU: 0 résultats
  ```
- [ ] Tests build production
  ```bash
  npm run build
  grep -r "console\.log" .next/static/**/*.js | wc -l
  # ATTENDU: 0 (minification supprime)
  ```

**Validation** :
```bash
./scripts/security/scan-console-logs.sh
# API Routes ATTENDU: 0 occurrences
```

**Effort** : 4 heures
**Responsable** : [À assigner]

---

#### Tâche 3 : Console.log Cleanup - Top 5 Hooks

**Fichiers** :
1. `src/hooks/use-variant-groups.ts` (31 occurrences)
2. `src/hooks/use-contacts.ts` (18 occurrences)
3. `src/hooks/use-product-images.ts` (15 occurrences)
4. `src/hooks/use-collection-images.ts` (15 occurrences)
5. `src/hooks/use-optimized-image-upload.ts` (14 occurrences)

**Actions** :
- [ ] Migration use-variant-groups.ts
  ```typescript
  // AVANT
  console.log('Fetching variant groups:', filters)

  // APRÈS
  logger.debug('Fetching variant groups', {
    filterCount: Object.keys(filters).length
  })
  ```
- [ ] Migration use-contacts.ts (⚠️ PII)
  ```typescript
  // AVANT
  console.log('Contact created:', contact) // ❌ PII complet

  // APRÈS
  logger.business('contact_created', {
    contactId: contact.id,
    organisationId: contact.organisation_id
    // ❌ PAS email/phone
  })
  ```
- [ ] Migration use-product-images.ts
- [ ] Migration use-collection-images.ts
- [ ] Migration use-optimized-image-upload.ts

**Validation** :
```bash
# Vérifier top 5 hooks nettoyés
grep -c "console\." src/hooks/use-variant-groups.ts
# ATTENDU: 0

grep -c "console\." src/hooks/use-contacts.ts
# ATTENDU: 0

# Global
./scripts/security/scan-console-logs.sh
# Hooks ATTENDU: <250 occurrences (réduction ~100)
```

**Effort** : 4 heures
**Responsable** : [À assigner]

---

### 🟡 PRIORITÉ P2 - MEDIUM (6h) - SPRINT +1

**Deadline** : Fin sprint prochain

#### Tâche 4 : Console.log Cleanup - Lib + Components

**Zones** :
- Lib files : 140 occurrences (focus : google-merchant/client.ts, upload/supabase-utils.ts)
- Components : 283 occurrences

**Actions** :
- [ ] Migration lib critiques (google-merchant, upload)
- [ ] Batch replacement components
  ```bash
  # Semi-automatique (validation manuelle après)
  find src/components -name "*.tsx" -exec sed -i '' 's/console\.log(/\/\/ console.log(/g' {} \;
  # Puis review + migration logger manuel zones sensibles
  ```
- [ ] Validation finale <50 total

**Validation** :
```bash
./scripts/security/scan-console-logs.sh
# Total ATTENDU: <50 occurrences
# Zones critiques ATTENDU: 0 occurrences
```

**Effort** : 6 heures
**Responsable** : [À assigner]

---

## 🎯 CRITÈRES DE SUCCÈS

### RLS Policies ✅

- [ ] **100% tables avec RLS** (24/24)
- [ ] **Script validation passe** (`validate-rls-coverage.sh`)
- [ ] **Tests multi-organisations OK**
- [ ] **Aucun RLS bypass possible**

### Console.log Cleanup ✅

- [ ] **API Routes : 0 occurrences**
- [ ] **Top 5 Hooks : 0 occurrences**
- [ ] **Total : <50 occurrences** (objectif final)
- [ ] **Aucun log credentials**
- [ ] **Script scan passe** (`scan-console-logs.sh`)

### Production Ready ✅

- [ ] **Score sécurité : ≥95/100**
- [ ] **Migration appliquée production**
- [ ] **Monitoring Sentry configuré**
- [ ] **Sign-off security team**

---

## 📊 SUIVI PROGRESSION

### Métriques Hebdomadaires

**Semaine 1** (J+1 à J+7) :
```
RLS Coverage : [ ] 87.5% → [ ] 100% ✅
Console.log API : [ ] 115 → [ ] 0 ✅
Console.log Hooks : [ ] 347 → [ ] <250
Total : [ ] 885 → [ ] ~680
Score : [ ] 75 → [ ] 85
```

**Semaine 2** (J+8 à J+14) :
```
Console.log Lib : [ ] 140 → [ ] ~50
Console.log Components : [ ] 283 → [ ] ~100
Total : [ ] ~680 → [ ] <200
Score : [ ] 85 → [ ] 90
```

**Semaine 3** (J+15 à J+21) :
```
Console.log Total : [ ] <200 → [ ] <50 ✅
Score : [ ] 90 → [ ] 95 ✅
Production : [ ] Staging → [ ] Déployé ✅
```

---

## 🛠️ OUTILS & RESSOURCES

### Documentation

- **Rapport audit complet** : `docs/reports/AUDIT-SECURITE-PHASE3-2025.md`
- **Guide migration console.log** : `docs/guides/GUIDE-MIGRATION-CONSOLE-LOG-TO-LOGGER.md`
- **Résumé exécutif** : `SECURITY-AUDIT-EXECUTIVE-SUMMARY.md`
- **Session MEMORY-BANK** : `MEMORY-BANK/sessions/2025-10-08-audit-securite-phase3.md`

### Scripts

- **Validation RLS** : `./scripts/security/validate-rls-coverage.sh`
- **Scan Console.log** : `./scripts/security/scan-console-logs.sh`

### Migration

- **RLS Fixes** : `supabase/migrations/20251008_003_fix_missing_rls_policies.sql`

### Logger

- **Logger sécurisé** : `src/lib/logger.ts` (déjà implémenté ✅)

---

## 🚨 BLOCKERS & RISQUES

### Blockers Identifiés

Actuellement : **Aucun blocker technique**
- Migration SQL prête ✅
- Logger implémenté ✅
- Scripts validation testés ✅
- Documentation complète ✅

### Risques

**Risque 1** : Déploiement sans fixes RLS
- **Impact** : 🔴 CRITIQUE (faille accès inter-organisations)
- **Probabilité** : Faible (BLOCKER documenté)
- **Mitigation** : Bloquer déploiement jusqu'à validation

**Risque 2** : Console.log non migré avant production
- **Impact** : 🟠 ÉLEVÉ (fuite credentials potentielle)
- **Probabilité** : Moyenne
- **Mitigation** : Pre-commit hooks + CI/CD checks

**Risque 3** : Régression RLS (nouvelles tables)
- **Impact** : 🟠 ÉLEVÉ
- **Probabilité** : Moyenne
- **Mitigation** : Script validation dans CI/CD obligatoire

---

## 📞 ESCALATION

### Points de Contact

**Security Lead** : [À définir]
**Tech Lead** : [À définir]
**DevOps** : [À définir]

### Escalation Path

1. **Blocker technique** → Tech Lead
2. **Dépassement deadline** → Security Lead
3. **Production compromise** → CTO immédiat

---

## ✅ CHECKLIST DÉPLOIEMENT PRODUCTION

Avant déploiement production, valider :

### Sécurité

- [ ] Migration RLS appliquée et testée
- [ ] Script `validate-rls-coverage.sh` passe ✅
- [ ] Tests RLS bypass échouent (isolation OK)
- [ ] Console.log zones critiques nettoyées
- [ ] Script `scan-console-logs.sh` passe ✅
- [ ] Aucun log credentials détecté

### Tests

- [ ] Tests unitaires passent
- [ ] Tests intégration OK
- [ ] Tests accès multi-organisations validés
- [ ] Build production clean (pas de console.log)
- [ ] Performance non dégradée (RLS overhead acceptable)

### Monitoring

- [ ] Sentry configuré et actif
- [ ] Alertes sécurité activées
- [ ] Logs structured en production
- [ ] Dashboards monitoring créés

### Documentation

- [ ] Changelog mis à jour
- [ ] Équipe informée des changements
- [ ] Runbook incidents sécurité à jour
- [ ] Post-mortem planifié (J+7)

---

## 🎓 FORMATION ÉQUIPE

### Sessions Recommandées

**Semaine 1** : RLS Policies Best Practices
- Pourquoi RLS est critique
- Comment créer policies sécurisées
- Tests RLS systematiques

**Semaine 2** : Logger Sécurisé Usage
- Migration console.log → logger
- Patterns sécurité (sanitization, PII)
- Monitoring production

**Semaine 3** : Security First Development
- Pre-commit hooks
- Security reviews
- Incident response

---

## 📈 SUCCESS STORY

**Avant Audit** :
- ❌ 3 tables sans RLS (accès non autorisé possible)
- ❌ 885 console.log (risque fuite données)
- ⚠️ Score 75/100 (non conforme production)

**Après Fixes** :
- ✅ 100% tables RLS (24/24)
- ✅ <50 console.log (zones critiques : 0)
- ✅ Score 95/100 (excellence sécurité)

**Impact Business** :
- 🔒 Données clients protégées 100%
- 📊 Conformité RGPD renforcée
- 🚀 Déploiement production sécurisé
- 💰 Risque faille sécurité : 0

---

**Plan d'action créé le** : 8 octobre 2025
**Prochain review** : J+7 (15 octobre 2025)
**Audit complet** : J+21 (29 octobre 2025)

---

*Ce plan d'action est à suivre strictement pour garantir la sécurité production.*
