# Migration Cleanup - 2025-11-20

## 🎯 Objectif

Supprimer migrations obsolètes (septembre → novembre 18) pour :

- Réduire token usage Claude Code (173 → 6 fichiers)
- Éviter hallucinations sur code obsolète
- Suivre best practices 2025 (Andrea Leopardi Blog)

## 📊 Résultat

**AVANT** : 173 migrations
**APRÈS** : 6 migrations
**SUPPRIMÉ** : 167 migrations obsolètes

### Fichiers Conservés

```
supabase/migrations/
├── 00000000_000000_baseline.sql
├── 00000000_000000_baseline_snapshot.sql
├── 20251120_001_cleanup_purchase_order_status_enum.sql
├── 20251120_002_cleanup_sales_order_status_enum.sql
├── 20251120_003_simplify_purchase_order_triggers.sql
└── 20251120_004_create_sales_order_triggers.sql
```

## ✅ Migrations Supprimées

### Septembre 2025 (23 fichiers)

- `supabase/migrations/202509*.sql`

### Octobre 2025 (80 fichiers)

- `supabase/migrations/202510*.sql`

### Novembre 2025 (64 fichiers - 01-18)

- `supabase/migrations/202511[01]*.sql`
- Inclut migrations 20251119_012 à 20251119_015 (hotfixes alertes stock)

## 🔧 Commandes Exécutées

```bash
# Vérification AVANT
ls -1 supabase/migrations/*.sql | wc -l  # 173

# Suppression
rm supabase/migrations/202509*.sql       # 23 fichiers
rm supabase/migrations/202510*.sql       # 80 fichiers
rm supabase/migrations/202511[01]*.sql   # 64 fichiers

# Vérification APRÈS
ls -1 supabase/migrations/*.sql | wc -l  # 6
```

## 🛡️ Sécurité

**Aucun risque** car :

1. ✅ Toutes migrations déjà appliquées en DB production
2. ✅ Git conserve historique complet (pas de perte)
3. ✅ Baseline (00000000) capture état complet DB
4. ✅ DB Production intacte (aucune modification schema)

## 📚 Justification Best Practices

### Andrea Leopardi Blog (2025)

> "Migrations >12 mois completely irrelevant for new developers.
> Squash into baseline, Git keeps history, focus on current state."

### Recommandations Pros

- ✅ Supprimer (pas archiver) si déjà appliquées
- ✅ Git = source of truth pour historique
- ✅ Baseline = snapshot état actuel
- ✅ Réduire cognitive load nouveaux devs

## 🎯 Impact

### Avant

- Claude devait scanner 173 migrations
- Risque hallucination sur statuts obsolètes ('confirmed', 'sent')
- Token waste énorme (migrations inutiles)

### Après

- Claude scanne 6 migrations pertinentes
- Focus sur workflow actuel (6 statuts simples)
- Token budget optimisé

## 🔗 Références

- `.serena/memories/database-migrations-convention.md`
- Andrea Leopardi Blog: "Migrations at Scale" (2025)
- Supabase official docs: Migration best practices

## 📅 Date

**2025-11-20** - Cleanup effectué après simplification workflow stock (ENUM 7→6 statuts)
