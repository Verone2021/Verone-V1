# INCIDENT CRITIQUE - Création Famille Impossible (Erreur 409 Systématique)

**Date**: 2025-10-16
**Heure**: Session tests GROUPE 2
**Sévérité**: CRITIQUE - BLOQUANT COMPLET
**Contexte**: Tests E2E validation Erreur #8 (display_order)
**Agent**: verone-e2e-tester (MCP Playwright)

---

## RÉSUMÉ EXÉCUTIF

**TOUS les tests GROUPE 2 sont BLOQUÉS** en raison d'un bug critique dans la création de familles qui renvoie systématiquement une erreur **409 Conflict** (code PostgreSQL 23505 - violation contrainte unique), INDÉPENDAMMENT du nom fourni.

**Impact**: Impossible de valider l'Erreur #8 (display_order) car aucune donnée test ne peut être créée.

---

## SYMPTÔMES OBSERVÉS

### Erreur Console Systématique

```javascript
[ERROR] Failed to load resource: the server responded with a status of 409 ()
[ERROR] ❌ Erreur lors de la création de la famille: Error: Une famille avec ce nom existe déjà. Veuillez choisir un nom différent.
[ERROR] ❌ Message d'erreur: Une famille avec ce nom existe déjà. Veuillez choisir un nom différent.
[ERROR] ❌ Détails complets: {
  "code": "23505"
}
[ERROR] ❌ Erreur lors de la soumission: Error: Une famille avec ce nom existe déjà. Veuillez choisir un nom différent.
```

**Code PostgreSQL 23505**: Violation de contrainte d'unicité (UNIQUE constraint violation)

---

## TENTATIVES EFFECTUÉES (TOUTES ÉCHOUÉES)

| # | Nom Testé | Slug Attendu | Résultat |
|---|-----------|--------------|----------|
| 1 | `test-famille-final-2025` | `test-famille-final-2025` | ❌ 409 Conflict |
| 2 | `Famille-Test-E2E-1029202516` | `famille-test-e2e-1029202516` | ❌ 409 Conflict |
| 3 | `E2E-Famille-a7b3c9d2` | `e2e-famille-a7b3c9d2` | ❌ 409 Conflict |
| 4 | `XQPZ Validation Groupe2 Oct16` | `xqpz-validation-groupe2-oct16` | ❌ 409 Conflict |

**Constat**: Même avec des noms UNIQUES et IMPROBABLES (UUID partiel, timestamp, lettres aléatoires), l'erreur 409 persiste systématiquement.

---

## ANALYSE TECHNIQUE

### Contraintes Unique sur Table `families`

```sql
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,  -- Contrainte 1
    slug VARCHAR(100) NOT NULL UNIQUE,  -- Contrainte 2
    ...
);
```

**Deux points de conflit possibles**:
1. **Contrainte `name` UNIQUE**: Le nom exact existe déjà
2. **Contrainte `slug` UNIQUE**: Le slug généré existe déjà

### Génération Slug (use-families.ts:208)

```typescript
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-")
}
```

**Transformation exemple**:
- `XQPZ Validation Groupe2 Oct16` → `xqpz-validation-groupe2-oct16`

---

## HYPOTHÈSES POSSIBLES

### Hypothèse 1: Bug Génération Slug
**Probabilité**: FAIBLE
Le slug est généré de façon déterministe. Des noms différents donnent des slugs différents.

### Hypothèse 2: Cache Non Vidé
**Probabilité**: MOYENNE
Possible que des tests précédents aient créé ces familles et qu'elles n'aient pas été supprimées.

### Hypothèse 3: Contrainte Unique Trop Large
**Probabilité**: FAIBLE
La contrainte est bien définie sur `name` et `slug` uniquement.

### Hypothèse 4: Bug Logique Validation
**Probabilité**: **ÉLEVÉE** ⚠️
Le message d'erreur dit "Une famille avec ce nom existe déjà" AVANT même d'essayer l'insertion. Possible validation côté client ou API route qui échoue incorrectement.

### Hypothèse 5: RLS Policy Trop Restrictive
**Probabilité**: MOYENNE
Les RLS policies pourraient bloquer l'insertion même si les données sont valides.

---

## FICHIERS CONCERNÉS

### Code Création Famille
```
/Users/romeodossantos/verone-back-office-V1/src/hooks/use-families.ts
Ligne 55-93: Fonction createFamily()
```

### Page UI
```
/Users/romeodossantos/verone-back-office-V1/src/app/catalogue/categories/page.tsx
Ligne 165: handleFormSubmit()
```

### Migration Database
```
/Users/romeodossantos/verone-back-office-V1/supabase/migrations/archive/2025-phase1-initial/20250114_006_catalogue_complete_schema.sql
Table families avec contraintes UNIQUE
```

---

## VÉRIFICATIONS REQUISES

### 1. Vérifier Données Existantes en Base

```sql
-- Compter familles existantes
SELECT COUNT(*) FROM families;

-- Lister tous les noms et slugs
SELECT id, name, slug, created_at
FROM families
ORDER BY created_at DESC;

-- Chercher noms de test spécifiques
SELECT * FROM families
WHERE name LIKE '%test%'
   OR name LIKE '%E2E%'
   OR name LIKE '%XQPZ%';
```

### 2. Vérifier RLS Policies

```sql
-- Lister policies sur families
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'families';
```

### 3. Tester Insertion Directe SQL

```sql
-- Test insertion bypass hooks React
INSERT INTO families (name, slug, display_order, is_active)
VALUES ('TEST-SQL-DIRECT-20251016-1645', 'test-sql-direct-20251016-1645', 0, true)
RETURNING *;
```

### 4. Inspecter Code Validation

Vérifier dans `use-families.ts` et `page.tsx` s'il y a une validation AVANT l'appel Supabase qui pourrait échouer incorrectement.

---

## CONTOURNEMENT TEMPORAIRE

### Option A: Supprimer Familles Test

```sql
DELETE FROM families
WHERE name LIKE '%test%'
   OR name LIKE '%E2E%'
   OR name LIKE '%XQPZ%'
   OR name LIKE '%Famille-Test%';
```

### Option B: Utiliser Famille Existante

Utiliser la famille "test" (visible dans la liste) pour créer des catégories et valider display_order.

---

## IMPACT SUR TESTS GROUPE 2

| Test | Statut | Raison |
|------|--------|--------|
| 2.1 - Créer Famille | ❌ BLOQUÉ | Bug 409 systématique |
| 2.2 - Créer Catégorie | ⚠️ BLOQUÉ | Nécessite famille parente |
| 2.3 - Créer Sous-catégorie | ⚠️ BLOQUÉ | Nécessite catégorie parente |
| 2.4 - Créer Collection | ⏸️ INDÉPENDANT | Peut être testé isolément |

**Score actuel**: 0/4 ❌

---

## VALIDATION ERREUR #8 (display_order)

**STATUT**: **IMPOSSIBLE À VALIDER** sans données test

L'Erreur #8 concernait la migration `sort_order` → `display_order` dans les tables:
- ✅ `families`
- ✅ `categories` (déjà corrigée)
- ✅ `subcategories`
- ✅ `collections`

**MAIS** sans pouvoir créer de nouvelles entités, impossible de vérifier que:
1. L'insertion utilise bien `display_order`
2. Aucune erreur PGRST204 n'apparaît en console
3. La colonne `display_order` est correctement remplie

---

## PROCHAINES ACTIONS REQUISES

### Priorité P0 (Urgent - Bloquant)

1. **Investiguer cause root 409**
   - Vérifier données existantes en base
   - Inspecter code validation `use-families.ts`
   - Tester insertion SQL directe

2. **Nettoyer données test si nécessaire**
   ```sql
   DELETE FROM families WHERE name LIKE '%test%' OR name LIKE '%E2E%';
   ```

3. **Corriger bug ou documenter contournement**

### Priorité P1 (Important)

4. **Reprendre tests GROUPE 2** avec fix appliqué

5. **Valider Erreur #8** sur display_order

### Priorité P2 (Souhaitable)

6. **Améliorer gestion unicité slug**
   - Ajouter timestamp ou UUID au slug si conflit
   - Exemple: `nom-famille-abc123` si `nom-famille` existe

7. **Améliorer messages d'erreur**
   - Distinguer conflit `name` vs conflit `slug`
   - Suggérer noms alternatifs

---

## SCREENSHOTS

- `/Users/romeodossantos/verone-back-office-V1/.playwright-mcp/INCIDENT-409-creation-famille-impossible.png`

---

## LOGS CONSOLE COMPLETS

Voir section "SYMPTÔMES OBSERVÉS" ci-dessus pour les messages d'erreur exacts.

**Warnings non-bloquants** (présents mais normaux):
- `Warning: Missing Description for {DialogContent}` (accessibilité RadixUI)
- `❌ Activity tracking: No authenticated user` (avant connexion)
- `✅ Activity tracking: N events logged` (après connexion)

---

## CONCLUSION

**Ce bug est CRITIQUE et BLOQUANT** pour tous les tests de création d'entités catalogue. Il n'est PAS lié à l'Erreur #8 (display_order) mais révèle un problème dans la logique de validation ou les contraintes d'unicité.

**Recommandation immédiate**: Escalader à **verone-debugger** pour investigation approfondie avec accès direct à la base de données Supabase.

**Timeline estimée**:
- Investigation: 15-30 min
- Fix: 10-20 min
- Reprise tests: 20-30 min
- **Total**: 45-80 minutes avant validation Erreur #8

---

**Rapport généré par**: verone-e2e-tester
**Contact**: verone-orchestrator (coordination), verone-debugger (investigation technique)
**Session**: GROUPE-2-TESTS-VALIDATION-DISPLAY-ORDER
**Fichiers associés**:
- `TASKS/testing/GROUPE-2-GUIDE-MANUEL-FINAL.md`
- `MEMORY-BANK/sessions/SESSION-ARRETEE-MCP-PLAYWRIGHT-MANQUANT-2025-10-16.md`
- `MEMORY-BANK/sessions/RAPPORT-ORCHESTRATOR-REPRISE-SESSION-2025-10-16.md`
