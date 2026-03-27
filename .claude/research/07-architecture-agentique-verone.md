# Recherche 7 : Architecture Agentique Specifique Verone (par agent externe)

**Source** : Analyse agent externe sur notre architecture TurboRepo
**Date** : 2026-03-27
**Note** : Approche non exhaustive — l'agent n'a pas tout le contexte de nos apps. A croiser avec notre connaissance reelle.

---

## 1. Analyse Strategique Ecosysteme

### Entites a sanctuariser
- **TurboRepo** : structure d'orchestration (NE PAS laisser l'IA restructurer sans supervision)
- **Supabase (schemas + migrations)** : source de verite unique types + relations
- **Canaux de vente (LinkMe/Web)** : consommateurs critiques flux prix + inventaire
- **Core UI Library** : Design System partage, regression impacte toute la flotte

### Risque principal
- **Amnesie contextuelle** : sans segmentation stricte, l'agent applique un pattern React LinkMe a une Edge Function Supabase
- Solution : passer de "one-shot reactif" a "memoire structuree"

---

## 2. Gouvernance et Securite

### CLAUDE.md = plan de vol, PAS un depotoir
- Chemins vers fichiers pivots uniquement
- L'IA doit etre "consciente" des ressources SANS charger le contenu preventivement

### Securisation
- **Mode bypass** obligatoire pour performance
- **Deny list dans settings.json** : bloquer commandes destructrices (`prisma reset`, `rm -rf`)
- On a deja ca : notre deny list bloque `rm -rf /`, `sudo`, les operations Supabase destructrices

### Regle d'Or : "Triple Lecture Obligatoire"
> L'IA doit lire au minimum 3 fichiers ou references similaires avant toute modification

- Force l'alignement sur patterns existants
- Empeche creation de doublons fonctionnels
- **CONFIRME** par recherches 3 et 5

---

## 3. Agents Specialises + Context Forking

### Contre "Lost in the Middle"
- **Context fork systematique** pour taches de recherche lourdes
- Thread principal = lean et focalise sur decision
- Exploration = sous-contextes ephemeres

### Matrice Agents

| Agent | Role | Ressources | Skills | Contrainte |
|---|---|---|---|---|
| **Expert DB** | Integrite + Migrations | `supabase/migrations/`, schema | Schema Sync, SQL Check | Max 2000 tokens/task |
| **Architecte UI** | Design System + UX | `packages/ui/`, tailwind | Component Explorer | Strict shared-hooks read |
| **Business Logic** | Flux vente (LinkMe) | `apps/linkme/api/`, logic/flows | API Mock, Flow Check | Cross-app impact analysis |

→ **Correspond a nos agents** : `database-architect`, `frontend-architect`, `linkme-expert`

---

## 4. Skills = Remplacement Radical des MCP

### Directive
> "Abandonnez les MCP. Ils sont imprevisibles, gourmands en tokens et polluent le system prompt."

### Solution : convertir chaque API externe en CLI local via Skills
- **Terminal = forme de controle la plus pure**
- CLI fonctionne 365j/an sans surcharge protocole

### Skills recommandes
1. **"Project Explorer"** : scripts Bash legers pour scanner arborescence sans charger code
2. **"Schema Sync"** : reference miroir structure DB dans `.claude/rules/db.md` pour consultation instantanee

---

## 5. Workflow APEX + Prompt Discovery

### Protocole de Decouverte Progressive (Steps)
- L'IA ne voit PAS l'integralite de la mission d'un coup
- Elle "decouvre" chaque phase apres validation de la precedente

### 4 phases
1. **Analyse (Sub-agent Explore)** : recherche forcee, l'IA doit PROUVER sa lecture
2. **Planification (Plan Mode)** : fichier d'impact obligatoire, validation humaine AVANT execution
3. **Execution** : modifications locales respectant patterns (CamelCase, imports)
4. **Review** : sous-agent "Clean Code"
   - **REGLE CRITIQUE** : fichier > 400 lignes → blocage + refactoring force

---

## 6. Protocole Recuperation + Memoire Sessionnelle

### Court terme
- `/changelog` obligatoire : fin de tache → update `progress.md`
- Session recovery : commande n1 = "Read progress.md"
- Elimine latence reprise de contexte

### Long terme
- Centralisation identite technique dans `custom_instructions`
- Personnalite technique coherente a travers tout le TurboRepo

---

## SYNTHESE GLOBALE — 7 Recherches

### Actions definitives pour la refonte Verone

| # | Action | Consensus | Priorite |
|---|---|---|---|
| 1 | **Emphasis CRITICAL** dans toutes les rules importantes | 7/7 | IMMEDIATE |
| 2 | **Triple Lecture** : lire 3 fichiers similaires avant toute modification | 4/7 | IMMEDIATE |
| 3 | **CLAUDE.md ultra-minimaliste** : chemins critiques uniquement | 7/7 | IMMEDIATE |
| 4 | **Restructurer commandes** : Apex (explore→plan→execute→review) + Oneshot + Review | 6/7 | HAUTE |
| 5 | **Evaluer reduction MCP** : garder Supabase + Playwright, evaluer reste | 6/7 | HAUTE |
| 6 | **Sous-agent Clean Code** : bloquer fichiers > 400 lignes | 5/7 | HAUTE |
| 7 | **Skills templates** : Project Explorer, Schema Sync, new-component | 5/7 | HAUTE |
| 8 | **Memory Manager** : changelog auto + progress.md + session recovery | 4/7 | HAUTE |
| 9 | **Prompt Discovery** : taches en etapes decouvrables, pas monolithiques | 4/7 | MOYENNE |
| 10 | **TMUX multi-agent** : 3 agents en parallele | 7/7 | OBJECTIF |
| 11 | **Deny list renforcee** dans settings.json | 3/7 | DEJA FAIT |
| 12 | **Regeneration types TS** apres migration = CRITICAL | 2/7 | DEJA EN RULES |
