# Scratchpad — Communication inter-agents et notes éphémères

**Source de vérité** : ce fichier + `.claude/scripts/cleanup-scratchpad.sh`.

`docs/scratchpad/` est l'endroit où les agents Verone (dev, reviewer, verify, ops) et le coordinateur déposent leurs plans, rapports et audits courts-lived. **Structure plate par design** : chaque fichier à la racine du dossier, pas de sous-dossiers thématiques. Le cycle de vie est géré automatiquement (archivage + promotion).

---

## Règles fondamentales

- Chaque fichier = 1 jour de travail ou 1 feature.
- Le coordinateur écrit les plans et rapports de synthèse.
- Les sous-agents lisent ce qui les concerne et écrivent leur verdict.
- **Aucun agent ne communique directement avec un autre** — toute transmission passe par un fichier ici.
- Après merge d'une PR, les fichiers associés sont archivés ou promus automatiquement (voir § Cycle de vie).

---

## Conventions de nommage

Tout fichier doit commencer par un préfixe connu. Les 5 préfixes du **pipeline agent** :

| Préfixe           | Format                                  | Écrit par      | Lu par                  |
| ----------------- | --------------------------------------- | -------------- | ----------------------- |
| `dev-plan-*`      | `dev-plan-YYYY-MM-DD-[task-id].md`      | coordinateur   | dev-agent               |
| `dev-report-*`    | `dev-report-YYYY-MM-DD-[task-id].md`    | dev-agent      | reviewer-agent          |
| `review-report-*` | `review-report-[task-id]-YYYY-MM-DD.md` | reviewer-agent | coordinateur, ops-agent |
| `verify-report-*` | `verify-report-YYYY-MM-DD.md`           | verify-agent   | coordinateur            |
| `deploy-report-*` | `deploy-report-YYYY-MM-DD.md`           | ops-agent      | coordinateur, Roméo     |

Les **préfixes secondaires** autorisés (notes, investigations, transmissions) :

| Préfixe           | Usage                                                               | Devenir automatique                                           |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| `audit-*`         | Investigation/diagnostic d'un domaine                               | Candidat promotion vers `docs/current/` après relecture Roméo |
| `rapport-*`       | Rapport one-off (souvent français, ex: rapport pour un autre agent) | Archivé après 14 jours                                        |
| `bug-*`           | Investigation d'un bug identifié                                    | Archivé après 14 jours                                        |
| `fix-*`           | Documentation d'un fix appliqué                                     | Archivé après 14 jours                                        |
| `handoff-*`       | Passage d'une session/agent à l'autre                               | Archivé après 14 jours                                        |
| `plan-*`          | Plan stratégique (non-dev, ex: restructuration, migration)          | Archivé après 14 jours, candidat promotion si plan structurel |
| `diagnostic-*`    | Investigation technique ciblée                                      | Archivé après 14 jours                                        |
| `cleanup-*`       | Rapport de nettoyage                                                | Archivé après 14 jours                                        |
| `dette-*`         | Audit de dette technique                                            | Candidat promotion vers `docs/current/`                       |
| `coherence-*`     | Audit de cohérence documentaire                                     | Candidat promotion vers `docs/current/`                       |
| `documentation-*` | Inventaire de documentation manquante                               | Candidat promotion vers `docs/current/`                       |
| `protocole-*`     | Protocole de tests / procédure répétable                            | Candidat promotion vers `docs/current/`                       |
| `session-*`       | Notes de session longue (nocturne, weekend)                         | Archivé après 30 jours                                        |
| `post-mortem-*`   | Post-mortem d'incident                                              | Candidat promotion vers `docs/current/`                       |

**Préfixes interdits** (créent de la confusion, utiliser un préfixe autorisé à la place) :

- `CLAUDE-*`, `CLAUDE-md-*` : si c'est une proposition de modif `CLAUDE.md`, utiliser `plan-YYYY-MM-DD-claude-md-vN.md`
- `BO-*`, `LM-*`, `SI-*`, `WEB-*` : Task IDs seuls ne sont pas des préfixes de scratchpad — utiliser `dev-plan-YYYY-MM-DD-[task-id].md` ou `dev-report-YYYY-MM-DD-[task-id].md`
- `automation-*`, `roadmap-*` : si permanent, vit dans `docs/current/`. Si éphémère, utiliser `plan-*`.

---

## Structure du dossier

```
docs/scratchpad/
├── README.md                          # ce fichier
├── audit-2026-04-23-*.md              # fichiers actifs à plat
├── dev-plan-2026-04-23-*.md
├── dev-report-2026-04-23-*.md
├── review-report-*.md
├── handoff-*.md
├── rapport-*.md
├── ...
├── stitch/                            # maquettes Stitch (img + md)
│   ├── stitch-*.png                   # maquettes visuelles
│   ├── stitch-*.html                  # validation HTML
│   └── stitch-redesign-*.md           # prompts/notes Stitch
└── archive/
    └── YYYY-MM/                       # archivage automatique mensuel
        ├── dev-plan-*.md
        ├── dev-report-*.md
        └── ...
```

### Le dossier `stitch/`

Contient tout ce qui concerne les maquettes Stitch (prompts, images, validations). Seul sous-dossier thématique autorisé parce qu'il regroupe des assets lourds (PNG, HTML) incompatibles avec un flux purement textuel. Tout fichier `stitch-*` va dans `stitch/`, jamais à plat.

### Le dossier `archive/YYYY-MM/`

Créé et alimenté automatiquement par `.claude/scripts/cleanup-scratchpad.sh`. Un sous-dossier par mois (format ISO `YYYY-MM`). Les fichiers restent archivés 90 jours avant suppression définitive.

---

## Cycle de vie automatique

Géré par `.claude/scripts/cleanup-scratchpad.sh`. Lancé automatiquement après chaque `gh pr merge` et chaque `git push` (via hook PostToolUse dans `.claude/settings.json`).

| Âge du fichier                      | Action                          | Préfixes concernés                                                                     |
| ----------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| 0-14 jours                          | Actif à la racine du scratchpad | Tous                                                                                   |
| 14+ jours                           | Déplacé vers `archive/YYYY-MM/` | Pipeline + secondaires                                                                 |
| 30+ jours                           | Déplacé vers `archive/YYYY-MM/` | `session-*` uniquement                                                                 |
| 7+ jours avec préfixe « promotion » | Alerte Roméo (ne déplace PAS)   | `audit-*`, `post-mortem-*`, `protocole-*`, `dette-*`, `coherence-*`, `documentation-*` |
| 90+ jours dans archive/             | **Suppression définitive**      | Tous                                                                                   |

**Promotion manuelle** : quand un `audit-*` (ou autre préfixe candidat) devient une référence permanente, Roméo le promeut à la main vers `docs/current/` sous le bon domaine (ex: `docs/current/finance/`, `docs/current/responsive/`, etc.).

---

## Référence rapide — où écrire quoi

**Tu es dev-agent** → `docs/scratchpad/dev-plan-YYYY-MM-DD-[task-id].md` avant le code, `docs/scratchpad/dev-report-YYYY-MM-DD-[task-id].md` après.

**Tu es reviewer-agent** → `docs/scratchpad/review-report-[task-id]-YYYY-MM-DD.md`.

**Tu es verify-agent** → `docs/scratchpad/verify-report-YYYY-MM-DD.md`.

**Tu es ops-agent** → `docs/scratchpad/deploy-report-YYYY-MM-DD.md` après création de PR.

**Tu es perf-optimizer** → `docs/current/perf/audit-YYYY-MM-DD.md` (PAS dans scratchpad, cf `.claude/agents/perf-optimizer.md`).

**Tu es coordinateur** et tu veux documenter une investigation → `audit-YYYY-MM-DD-[sujet].md` ou `rapport-YYYY-MM-DD-[sujet].md`.

**Tu as une maquette Stitch** → directement dans `stitch/stitch-*`.

---

## En cas de doute

1. Lire ce README en entier.
2. Grep le préfixe proposé dans `.claude/scripts/cleanup-scratchpad.sh` pour voir s'il est géré.
3. Si le préfixe n'existe pas, utiliser `audit-*` (investigation) ou `rapport-*` (rapport one-off).
4. Ne JAMAIS créer de sous-dossier thématique — la structure est plate, `stitch/` est la seule exception.

---

## Références

- `.claude/scripts/cleanup-scratchpad.sh` — script d'archivage automatique
- `.claude/README.md` — pipeline scratchpad (`dev-plan → ... → deploy-report`)
- `.claude/agents/dev-agent.md` — où dev-agent écrit
- `.claude/agents/reviewer-agent.md` — où reviewer-agent écrit
- `.claude/DECISIONS.md` — ADR-014 (hygiène scratchpad)
- `docs/README.md` — index des docs canoniques (`docs/current/`)
