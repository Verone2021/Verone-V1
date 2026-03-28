# Recherche 3 : Optimisation Claude Code en Environnement Professionnel

**Source** : Transcription Romeo — guide operationnel
**Date** : 2026-03-27

---

## Resume

Transition developpeur executant → gestionnaire d'agents autonomes. 3 piliers : configuration rigoureuse, standardisation workflows, permissions etendues.

---

## 1. Configuration strategique du referentiel

### Hierarchie des fichiers
1. **CLAUDE.md** : minimaliste, guide directionnel, chemins fichiers essentiels
2. **.claude/rules/** : regles specifiques par domaine, qualite "obligatoire et non optionnelle"
3. **Skills** : outils specifiques integres (Optimizer Next.js, Security check) → code "parfait par defaut"

### Regle de workflow cle
> L'agent doit lire au moins 3 fichiers similaires avant toute modification → garantit coherence avec patterns existants

---

## 2. Workflows et Prompting

### Par type de projet
- **Greenfield** (nouveau) : liberte totale, specifier stack des le depart
- **Brownfield** (existant) : l'IA suit les patterns etablis par mimetisme si les rules sont strictes

### Techniques resolution problemes
1. **Donner des "yeux"** : screenshots (CleanShot X) → Claude interprete visuellement les bugs UI
2. **Log Technique** : IA ajoute des logs → execute → analyse la console → auto-correction

---

## 3. Skills vs MCP — Comparaison

| | Skills | MCP |
|---|---|---|
| **Nature** | Dossier instructions + scripts + templates | Standard ouvert services externes |
| **Fonction** | "Apprend" a l'IA COMMENT faire | Permet d'UTILISER des outils externes |
| **Tokens** | Tres econome (on-demand) | Peut etre gourmand |
| **Structure** | Markdown + scripts Bash/ZSH | Architecture client-serveur |

**Avantage cle des Skills** : structurables en plusieurs fichiers, evitent la surcharge de contexte. Peuvent automatiser (ex: skill qui copie un template predefini).

---

## 4. Multi-Agent — Passage a l'echelle

### Modele recommande
- 1 dev senior = 3 agents simultanes
- Pendant phase reflexion/execution agent 1 (4-5 min) → definir besoin agent 2 ou reviser code agent 3
- **TMUX** : gerer plusieurs instances dans une fenetre

### Automatisation qualite
- Agents de review automatique des PR
- Sous-agent refactorisation : rejette fichiers > 400 lignes
- Role humain → "vision produit", IA → "clean code"

---

## 5. Permissions et Securite

- **Permissions totales** = resultats optimaux. Limiter = degrader
- Risque reel unique : Prisma Reset local (gerable via fixtures)
- L'IA n'a pas d'intention malveillante — elle suit les instructions

---

## 6. Apprentissage Continu

Quand l'IA repete une erreur :
1. STOP la tache
2. Creer une regle dans `.claude/rules/`
3. Utiliser `emphasis: CRITICAL` pour priorite maximale

---

## Impact sur Verone — Nouveaux points

### Regle "3 fichiers similaires"
- **A implementer** : avant toute modification, l'agent DOIT lire 3 fichiers similaires existants
- Ajouter dans `.claude/rules/dev/context-loading.md`

### Skills automatisables pour Verone
1. **Skill "new-component"** : copie template composant + structure dossier standard
2. **Skill "new-api-route"** : copie template route API + validation Zod
3. **Skill "db-migration"** : template migration SQL + checklist RLS

### Sous-agent refactorisation
- Hook PostToolUse : si fichier > 400 lignes apres Edit → warning + suggestion decoupe
- On a deja le warning ESLint a 500 lignes, mais le reduire a 400 et le rendre bloquant
