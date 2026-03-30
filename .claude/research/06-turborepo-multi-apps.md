# Recherche 6 : Strategie Turborepo Multi-Applications

**Source** : Transcription Romeo — specifique architecture Turborepo
**Date** : 2026-03-27

---

## Resume

Specifique a notre cas : Turborepo (Supabase + Back-office + LinkMe + Site Web). Defi majeur = **amnesie contextuelle** — l'agent risque d'appliquer un pattern React LinkMe a une Edge Function Supabase. Levier unique = configuration chirurgicale.

---

## 1. Cartographie du Contexte Turborepo

### Point d'ancrage strategique
- **`supabase/migrations/` = source de verite absolue**
- Interdependance totale : 1 DB → canaux de vente multiples (LinkMe, Web) → back-office centralise
- Modification schema DB doit repercuter types TypeScript sur TOUS les frontends

### Defi cle
- Imposer des **limites claires** pour eviter les hallucinations transversales
- Un agent qui travaille sur LinkMe ne doit PAS appliquer des patterns back-office

---

## 2. Configuration Fondamentale

### CLAUDE.md minimaliste
Doit contenir :
- **Context Paths** : `supabase/migrations/`, `packages/ui-components/`, `apps/linkme/src/`
- **Instruction sous-projet** : "Toujours charger la regle locale `.claude/rules/[app_name].md` quand on travaille dans un dossier `apps/`"

### Directive Emphasis
- **OBLIGATOIRE** pour outrepasser l'entrainement de base de Claude
- Exemple : `proxy.ts` au lieu de `middleware.ts` → seule une regle `Emphasis: CRITICAL` empeche l'IA de recreer middleware.ts
- **Unique moyen** de forcer le respect des patterns de nommage (snake_case DB vs CamelCase UI)

---

## 3. Memoire Continue et Persistance

### Memory Manager
- Regle imposant a Claude de mettre a jour un fichier `memory.md` ou `changelog.md` apres chaque feature majeure
- Consigner : date, choix technique, raison du commit
- Sert de premiere lecture lors de la session suivante

### Log Technique (debug dynamique)
1. IA insere des logs temporaires dans le code
2. Execute l'application
3. Reinjecte la sortie console dans son contexte
4. **Seul moyen** pour l'agent de "voir" l'etat d'execution reel (runtime)
5. Permet de sortir des boucles d'erreurs hypothetiques

---

## 4. Agents Specialises par Domaine

| Agent | Specialite |
|---|---|
| **Agent DB/Supabase** | Gardien schemas + politiques RLS |
| **Agent UI/UX** | Composants partages, eviter doublons |
| **Agent Back-Office** | Logique catalogue, promotions |

### Commandes Strategiques

| Commande | Usage | Impact Tokens |
|---|---|---|
| `/Apex` | Features completes (exploration + planification multi-etapes) | Eleve |
| `/OneShot` | Correctifs rapides, micro-UI | Faible |
| `/Review` | Audit qualite, clean code, conformite rules | Moyen |

### Technique "10 UI Variations"
- En cas d'incertitude UX : generer 10 composants distincts dans `/demo`
- Choisir la meilleure experience avant integration finale

---

## 5. CLI vs MCP — Position definitive

> "L'usage des serveurs MCP est proscrit pour les projets a long terme car ils saturent inutilement le contexte."

### Approche CLI + Skills
- Disponible 365j/an
- Controle granulaire
- **Optimisation tokens** : `cat file.ts | head -n 50` au lieu de lire 2000 lignes
- **Pattern "API to CLI"** : transformer API en outil terminal
- "Skills qui creent d'autres skills"

---

## 6. Workflows Haute Velocite

### Layout TMUX standardise
- **Fenetre 1** : Serveur dev + logs systeme
- **Fenetre 2** : Agent DB/Logic
- **Fenetre 3** : Agent UI

### Workflow Apex (Standard Turborepo)
1. **Exploration** : Prompt Discovery → scanner dependances, pre-charger cache IA
2. **Planification** : plan d'action valide par superviseur
3. **Execution** : modification atomique des fichiers
4. **Review** : autocritique via skills qualite

### Clean Code Automatise
- Fichier > 400 lignes → sous-agent "Clean Code" automatique pour refactoriser
- Tests unitaires : generation + execution systematique apres chaque modification

---

## Impact sur Verone — Points specifiques Turborepo

### 1. Instruction sous-projet dans CLAUDE.md
**A IMPLEMENTER** : ajouter dans CLAUDE.md root :
```
Quand tu travailles dans apps/linkme/ → charger apps/linkme/CLAUDE.md
Quand tu travailles dans apps/back-office/ → charger apps/back-office/CLAUDE.md
```
Claude Code fait deja ca automatiquement pour les CLAUDE.md enfants, mais le rendre EXPLICITE renforce le comportement.

### 2. Types TypeScript post-migration
**REGLE CRITIQUE** : apres chaque migration SQL, regenerer les types :
```bash
pnpm --filter @verone/types generate
```
On a cette regle dans `rules/database/supabase.md` mais pas avec Emphasis CRITICAL.

### 3. Agents = notre architecture actuelle
On a deja les 3 agents specialises :
- `linkme-expert` = Agent LinkMe
- `back-office-expert` = Agent Back-Office/Catalogue
- `database-architect` = Agent DB/Supabase

### 4. Memory Manager
On a ACTIVE.md mais pas de **changelog automatique** apres chaque feature.
→ Ajouter un hook PostToolUse sur `git commit` qui rappelle de mettre a jour ACTIVE.md

---

## SYNTHESE FINALE — 6 Recherches

### Consensus unanime (6/6 sources)
1. **CLAUDE.md minimaliste** avec chemins critiques
2. **Rules avec Emphasis CRITICAL** pour patterns obligatoires
3. **Multi-agent TMUX** (3-4 instances)
4. **Skills on-demand** au lieu de MCP persistants
5. **Sous-agent Clean Code** (fichiers > 400 lignes)

### Consensus fort (5/6 sources)
6. **Methode Apex** (Explore → Plan → Execute → Review)
7. **CLI + Bash** superieur aux MCP pour services externes
8. **Technique des Logs** pour debugging

### Points nouveaux (cette recherche)
9. **Instruction sous-projet explicite** dans CLAUDE.md pour Turborepo
10. **Changelog automatique** apres chaque feature (Memory Manager)
11. **Regeneration types TypeScript** apres migration = CRITICAL
12. **"10 UI Variations"** pour decisions UX incertaines
