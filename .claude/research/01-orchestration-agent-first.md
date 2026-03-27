# Recherche 1 : Guide d'Orchestration Claude Code — Paradigme Agent-First

**Source** : PDF `docs/assets/Claude_Code_Orchestration.pdf` + transcription Romeo
**Date** : 2026-03-27

---

## 1. Philosophie Agent-First

- Le role du developpeur = piloter et monitorer une flotte d'agents intelligents
- La structure du code source est le levier de velocite le plus puissant
- Un repo mal configure = frein cognitif pour l'IA
- Performance = clarte des regles imposees aux agents

## 2. Architecture de Gouvernance

### CLAUDE.md = Constitution du projet
- Doit rester **minimaliste**
- But : rendre l'IA "aware" de l'architecture
- Fournir les **chemins strategiques** vers les piliers (schemas DB, auth, configs)
- PAS de generalites qui saturent le contexte

### .claude/rules = Precision operationnelle
- Patterns incontournables (naming, API, imports)
- **Technique de l'Emphasis** : marqueurs CRITICAL pour garantir l'obeissance

Exemple :
```
CRITICAL : Gouvernance de la Logique de Redirection
* Regle : Ne jamais creer/modifier middleware.ts
* Contexte : Architecture basee sur proxy.ts dans /utils
* Emphasis : L'utilisation de middleware.ts est INTERDITE et cassera le deploiement
```

## 3. ABANDON des MCP pour CLI + Skills

### Pourquoi les MCP sont problematiques
1. **RAM inutile** : chaque serveur MCP = processus Node.js persistant
2. **Surcharge contexte** : definitions d'outils injectees a CHAQUE requete
3. **Echec MCP Search** : l'agent devient "aveugle" — ne sait pas quels outils existent, ne sait pas quoi chercher

### Solution : Bash + Skills
- **Bash est l'outil ultime**
- **Skills = chargement "on demand"** : 160 lignes d'instructions injectees UNIQUEMENT quand la commande est invoquee
- **API to CLI** : transformer les services externes (Stripe, Linear) en mini-CLI locaux
- **Context Forking** : deleguer a des sous-agents specialises pour preserver le thread principal

## 4. Les 5 Erreurs Critiques

| Erreur | Impact | Remediation |
|---|---|---|
| Config absente/floue | Perte et erreurs de structure | CLAUDE.md + rules strictes |
| Peur des permissions | IA bridee, interruptions manuelles | Activer Permission Bypass |
| Fragmentation workflows | Dette contextuelle | Standardiser sur Claude Code + Skills partages |
| 1 Dev = 1 Agent | Goulot d'etranglement, 80% temps d'attente | Multi-agent obligatoire (3-4 via TMUX) |
| Reviews humaines lentes | Paralysie velocite | Automatiser review 1er niveau via agents |

### Multi-Agent = Imperatif
- 1 seule instance = 80% du temps a attendre
- TMUX pour piloter 3-4 agents : feature, tests, documentation
- "Si vous ne multipliez pas vos agents, vous n'etes pas un orchestrateur, vous etes un spectateur"

## 5. Skills (Esquisses) : Types de Workflows

| Skill | Usage |
|---|---|
| **Apex** | Features complexes (Exploration → Planification → Execution) |
| **Oneshot** | Correctifs rapides sans analyse profonde |
| **Brainstorm** | Recherche multidimensionnelle (Devil's Advocate, Synthese) |
| **Review Code** | Audit qualite avant soumission |

### Sous-agent "Clean Code"
- Rejet systematique de tout fichier > 400 lignes
- Force la modularite : "Warning trop lourd, refactorisation obligatoire"

### Technique des Logs
- En cas de bug complexe : l'IA injecte ses propres logs de tracabilite
- L'agent s'auto-corrige en analysant ses propres sorties

## 6. Environnement Multi-Agent

- **TMUX** : fenetres CC1, CC2, CC3 + fenetre Serveur
- **Screenshots** : ne pas decrire les bugs UI, envoyer un screenshot
- **Dossier CC** : bac a sable pour taches hors codebase

## 7. Checklist Optimisation Immediate

1. Liberer les permissions (mode Bypass)
2. 3+ regles critiques dans .claude/rules avec Emphasis
3. Setup TMUX multi-agent (minimum 3 agents simultanes)
4. CLAUDE.md : 10 chemins de fichiers vitaux
5. Skills de base : Apex, Review

---

## Impact sur notre repository Verone

### Ce qu'on fait deja bien
- Rules dans .claude/rules/ avec hooks bloquants
- CLAUDE.md minimaliste (42 lignes)
- Agents specialises par app (crees aujourd'hui)

### Ce qu'on doit changer selon ce guide
1. **Evaluer la reduction des MCP** — Supabase et Playwright sont utiles, mais Serena et Magic consomment du contexte. Evaluer si des scripts Bash + Skills peuvent remplacer certains MCP.
2. **Creer des Skills type Apex/Oneshot** — nos commandes `/implement` et `/fix-warnings` sont proches mais pas aussi structurees
3. **Adopter la technique Emphasis** dans nos rules — "CRITICAL" en haut de chaque regle importante
4. **Multi-agent via TMUX** — Romeo peut piloter 3 agents en parallele (feature, tests, docs)
5. **Sous-agent Clean Code** — hook qui rejette les fichiers > 400 lignes (on a deja le warning ESLint a 500 lignes)
