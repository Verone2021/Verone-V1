# Archive Migrations Vérone

Migrations historiques archivées pour référence.

## Politique Archivage

**Critères archivage**:
- Migrations remplacées par versions ultérieures
- Rollbacks explicites + migrations annulées
- Iterations debug consolidées
- Migrations expérimentales jamais appliquées production

**⚠️ Important**: Ces migrations ne doivent JAMAIS être supprimées, uniquement archivées.

## Structure

### 2025-phase1-initial/
Migrations initiales (Janvier 2025) - Phase 1 projet
- Auth, Catalogue, Feeds, Dashboard
- Archivées après consolidation Septembre 2025
- **10 migrations** référence historique

### 2025-10-rollbacks/
Rollbacks + migrations annulées (Octobre 2025)
- Workflows paiement annulés (migrations 015, 016, 024)
- Fonctionnalité abandonnée après tests

### 2025-10-debug-iterations/
Iterations debug remplacées (Octobre 2025)
- Fixes progressifs stocks/commandes consolidés
- Versions intermédiaires remplacées par migrations finales

### experimental/
Migrations test jamais appliquées production
- Scripts JavaScript analyse (non-SQL)
- Bash scripts maintenance

## Best Practices 2025

**Archive > Delete** (consensus industry)
- Préserver historique pour audit
- Git blame reste fonctionnel
- Rollback manuel possible si nécessaire

**Sources**:
- Supabase Official Docs
- Andrea Leopardi Blog ("Migrations >12 mois irrelevant")
- Stack Overflow Senior Developers

## Consultation Historique

```bash
# Voir historique archive
git log -- archive/

# Consulter migration archivée
cat archive/2025-10-rollbacks/YYYYMMDD_NNN_*.sql

# Restaurer si nécessaire (rare)
git mv archive/YYYY-MM-category/YYYYMMDD_NNN_*.sql \
       ../YYYYMMDD_NNN_*.sql
```

## Maintenance

**Fréquence**: Cleanup mensuel (premier vendredi du mois)

**Process**:
1. Identifier migrations >3 mois remplacées
2. Analyser dépendances (git log, git diff)
3. Archiver vers `archive/YYYY-MM-category/`
4. Commit mensuel cleanup

---

**Dernière mise à jour**: 2025-10-17
**Migrations archivées**: 10 (phase1-initial) + 13 (octobre 2025) = 23 total

*Vérone Back Office - Clean Migration Management*
