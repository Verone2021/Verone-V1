# Audit des 6 agents — 2026-04-19

**Méthode** : recensement des fichiers `*-report-*.md` et `*-plan-*.md` dans `docs/scratchpad/` pour voir quels agents produisent des livrables.

## Résultat

| Agent | Fichiers scratchpad | Statut | Décision |
|-------|---------------------|--------|----------|
| **dev-agent** | ~10 `dev-plan-*.md` + `dev-report-*.md` (BO-FIN-009, BO-STOCK-008/009, BO-TECH-001, BO-UI-001, BO-SHIP-003, BO-FIN-010/011/014, BO-UI-RESP migration) | Très actif | **GARDER** |
| **reviewer-agent** | ~10 `review-report-*.md` (BO-FIN-009/014/015/017/019/022, BO-TECH-001, BO-SHIP-003, audit-tva-amount, retroactive) | Très actif | **GARDER** |
| **verify-agent** | 0 rapport dédié mais invoqué dans workflow dev-agent | Actif (build/type-check) | **GARDER** |
| **ops-agent** | 0 rapport dédié mais invoqué pour PR/merge | Actif | **GARDER** |
| **writer-agent** | **0 rapport. Aucun `writer-report-*.md`** | **Mort** | **SUPPRIMER** |
| **market-agent** | **0 rapport. Aucun `market-report-*.md`** | **Mort** | **SUPPRIMER** |

## Détail

### Actifs (4 agents)

- **dev-agent** : cœur du workflow. Pilote v2 responsive, sprints finance (BO-FIN-009/014/015), refactoring technique (BO-TECH-001), corrections stock (BO-STOCK-008/009). Sans lui, rien ne se fait.
- **reviewer-agent** : audit avant PR systématique. L'Axe 4 Responsive a sauvé le pilote v1 (détection du bug « Rendered more hooks »). Indispensable.
- **verify-agent** : pas de rapport dédié parce qu'il ne produit pas de markdown — il exécute `type-check`/`build` et retourne PASS/FAIL. Utilisé mais silencieux.
- **ops-agent** : idem — push/PR/merge, pas de rapport mais traces visibles dans les PRs GitHub.

### Morts (2 agents)

- **writer-agent** : défini dans `.claude/agents/writer-agent.md`. Mission : documentation technique. **Jamais invoqué dans 3 mois de scratchpad.** La doc est produite soit par Romeo (RESPONSIVE-SETUP-RECAP.md, GUIDE-RESPONSIVE.md hier soir), soit par moi via claude.ai, soit par dev-agent dans son dev-report. writer-agent fait doublon.
- **market-agent** : défini dans `.claude/agents/market-agent.md`. Mission : positionnement produit, communication B2B/B2C. **Jamais invoqué.** Pas de contenu marketing produit. Probablement ajouté « au cas où » et oublié.

## Recommandation

**Supprimer writer-agent.md et market-agent.md.** Moins d'agents = moins de règles à maintenir = moins de confusion pour le coordinateur qui doit choisir qui invoquer.

Si Romeo a besoin de contenu marketing dans le futur, il peut :
- Soit demander directement à claude.ai (ce qu'il fait déjà)
- Soit recréer un agent dédié à ce moment-là avec un contexte frais

## Application

Pas maintenant. Claude Code est actif sur `feat/responsive-lists`, ne pas modifier `.claude/agents/` en parallèle. La suppression sera loggée comme ADR-005 dans `DECISIONS.md` et appliquée après merge PR A.
