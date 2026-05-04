# [INFRA-LEAN-001] Niveau 1 — Allègement faible config Claude

**Date** : 2026-05-02
**Branche** : `feat/INFRA-LEAN-001-allegement-config-niveau-1`
**Source** : audit indépendant 2026-05-02 (rapport produit dans la conversation)

---

## Scope (sans risque, aucune règle métier touchée)

1. Élaguer `CLAUDE.md` racine de 221 → ~120 lignes
2. Fusionner `.claude/rules/branch-strategy.md` (162 lignes) dans `.claude/rules/workflow.md`
3. Fusionner `.claude/rules/playwright-artifacts.md` (152 lignes) dans `.claude/rules/playwright.md`
4. Supprimer rappels worktree en double, ne garder qu'un pointeur unique vers `no-worktree-solo.md`
5. Mettre à jour `.claude/INDEX.md`
6. Ajouter ADR-025 dans `.claude/DECISIONS.md`

**Pas touché** : sous-agents, hooks, autres règles, scripts.

---

## Table de correspondance ancien → nouveau

### Fusion A — `branch-strategy.md` → `workflow.md`

| Contenu source (`branch-strategy.md`)                                 | Destination (`workflow.md`)                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Section "Checklist OBLIGATOIRE avant `git checkout -b`" (3 questions) | Nouvelle section `## Checklist avant nouvelle branche / nouvelle PR`     |
| Section "Règle d'or — par défaut, commit sur la branche en cours"     | Intégrée à la même section                                               |
| Section "Au démarrage de chaque session" (`gh pr list`)               | Intégrée à la même section                                               |
| Section "Anti-patterns interdits"                                     | Fusionnée avec anti-patterns existants                                   |
| Section "Si la règle semble impossible à respecter"                   | Intégrée à la même section                                               |
| Question 4 ajoutée 2026-04-28 (RPC/migration → régen types)           | Section "Incident 2026-04-28" existante (déjà présente dans workflow.md) |

**Résultat** : `branch-strategy.md` SUPPRIMÉ. `workflow.md` enrichi d'une seule nouvelle section.

### Fusion B — `playwright-artifacts.md` → `playwright.md`

| Contenu source (`playwright-artifacts.md`)                       | Destination (`playwright.md`)                               |
| ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Tableau "Type d'artefact / Emplacement / Versionné"              | Nouvelle section `## Artefacts — rangement et cycle de vie` |
| Convention de nommage `.playwright-mcp/screenshots/YYYYMMDD/...` | Remplace les règles de nommage existantes                   |
| Patterns `.gitignore`                                            | Sous-section `### Patterns gitignore`                       |
| Config `playwright.config.ts`                                    | Sous-section `### Config output`                            |
| Anti-patterns                                                    | Fusionnés avec règles impératives existantes                |
| Section "Nettoyage périodique"                                   | Sous-section `### Nettoyage`                                |

**Résultat** : `playwright-artifacts.md` SUPPRIMÉ. `playwright.md` enrichi d'une nouvelle section "Artefacts".

---

## Pointeurs à mettre à jour

### Pointeurs vers `branch-strategy.md` (à remplacer par `workflow.md`)

| Fichier                             | Ligne | Action                                                                                            |
| ----------------------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| `CLAUDE.md` racine                  | 44    | Retirer (déjà couvert par workflow.md ligne 43)                                                   |
| `CLAUDE.md` racine                  | 57    | Remplacer "(cf. branch-strategy.md)" par "(cf. workflow.md section Checklist)"                    |
| `CLAUDE.md` racine                  | 147   | Remplacer "branch-strategy.md checklist question 4" par "workflow.md section Incident 2026-04-28" |
| `CLAUDE.md` racine                  | 180   | Retirer ligne tableau (fusionnée)                                                                 |
| `.claude/INDEX.md`                  | 30    | Retirer ligne (fusionnée dans workflow.md)                                                        |
| `.claude/INDEX.md`                  | 213   | Retirer ligne tableau                                                                             |
| `.claude/agents/ops-agent.md`       | 25    | Remplacer pointeur par `workflow.md section Checklist`                                            |
| `.claude/commands/pr.md`            | 21    | Idem                                                                                              |
| `.claude/commands/pr.md`            | 48    | Idem                                                                                              |
| `.claude/rules/no-worktree-solo.md` | 103   | Remplacer pointeur                                                                                |
| `.claude/rules/no-worktree-solo.md` | 137   | Remplacer pointeur                                                                                |
| `.claude/work/BO-MKT-roadmap.md`    | 71    | Remplacer pointeur                                                                                |

### Pointeurs vers `playwright-artifacts.md` (à remplacer par `playwright.md`)

| Fichier                                    | Ligne | Action                                                   |
| ------------------------------------------ | ----- | -------------------------------------------------------- |
| `.claude/INDEX.md`                         | 33    | Retirer ligne                                            |
| `.claude/INDEX.md`                         | 210   | Retirer ligne tableau                                    |
| `.claude/rules/agent-autonomy-external.md` | 65    | Remplacer pointeur par `playwright.md section Artefacts` |

### Doublons worktree à élaguer

| Fichier                       | Ligne | Contenu                              | Action                                                                       |
| ----------------------------- | ----- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `.claude/rules/workflow.md`   | 119   | "JAMAIS git worktree add" inline     | Garder le pointeur en haut + un rappel ligne 86, supprimer ligne 119 doublon |
| `.claude/agents/dev-agent.md` | 104   | "Ne fais JAMAIS git worktree add..." | SUPPRIMER (doublon ligne 34)                                                 |
| `.claude/agents/ops-agent.md` | 123   | Idem                                 | SUPPRIMER (doublon ligne 24)                                                 |
| `.claude/agents/ops-agent.md` | 163   | Idem                                 | SUPPRIMER (triple)                                                           |

**Note** : on garde les rappels suivants (pas des doublons, points différents) :

- `autonomy-boundaries.md` ligne 152 (FEU ROUGE) + ligne 183 (Agent tool isolation) + ligne 191 (référence)
- `commands/pr.md` lignes 20 + 108 (1 source + 1 rappel inline pédagogique)

---

## Élagage CLAUDE.md racine — plan ligne à ligne

### Sections gardées (intactes ou compressées légèrement)

- IDENTITE (lignes 6-17, gardée intacte)
- POINT D'ENTREE (lignes 19-37, compressé)
- AUTONOMIE (lignes 60-68, gardé)
- STANDARDS RESPONSIVE (lignes 70-84, gardé)
- CODE STANDARDS (lignes 86-100, gardé)
- DELEGATION AUTOMATIQUE (lignes 102-116, gardé)
- SCRATCHPAD (lignes 118-122, gardé)
- INTERDICTIONS ABSOLUES (lignes 124-164, **compressé** : virer détails déjà dans rules)
- SOURCES DE VERITE (lignes 166-187, table compressée après fusion)
- MEMOIRE SCEPTIQUE (gardé)

### Sections à compresser

| Section                                 | Avant               | Après                                   |
| --------------------------------------- | ------------------- | --------------------------------------- |
| WORKFLOW GIT (lignes 39-58)             | 20 lignes (détails) | 8 lignes (pointeurs + règle d'or)       |
| INTERDICTIONS ABSOLUES (lignes 124-164) | 41 lignes           | ~25 lignes (résumés courts + pointeurs) |
| Fichiers auto-générés (lignes 189-203)  | 15 lignes           | 8 lignes                                |
| COMMANDES (lignes 211-221)              | 11 lignes           | 5 lignes (sans bloc bash)               |

**Cible** : 220 → ~120 lignes (gain ~45%).

---

## Validation prévue

1. Type-check + lint local : N/A (modification config Markdown uniquement)
2. Script `scripts/check-config-integrity.sh` : doit passer
3. Aucun lien cassé : `grep -r "branch-strategy\|playwright-artifacts" .claude/ CLAUDE.md` doit ne renvoyer que les références dans DECISIONS.md (historique) et les nouveaux pointeurs corrects
4. reviewer-agent : doit dire PASS sur la cohérence de la config

---

## Risques mitigations

| Risque                                           | Mitigation                                                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Lien cassé après suppression                     | Grep complet avant push, table de correspondance ci-dessus                                           |
| Perte de contenu critique                        | Aucune ligne supprimée sans avoir vérifié qu'elle est soit fusionnée, soit un doublon, soit obsolète |
| ADR-022 référence `branch-strategy.md` checklist | DECISIONS.md = trace historique, on ne touche pas. Le nouveau `workflow.md` couvre le même contenu.  |
| ADR-012 référence `playwright-artifacts.md`      | Idem, historique conservé                                                                            |
