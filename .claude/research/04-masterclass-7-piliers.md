# Recherche 4 : Masterclass Claude Code — Les 7 Piliers et Strategies Avancees

**Source** : Transcription Romeo — masterclass approfondie
**Date** : 2026-03-27

---

## Resume

Claude Code = agent autonome en boucles iteratives (analyse → planifie → execute → verifie). 7 piliers fondamentaux. Gestion du contexte = facteur critique de succes.

---

## 1. Nature Agentique — Cycle de fonctionnement

Boucle infinie jusqu'a completion :
1. **Recuperation d'infos** : analyse codebase ou recherche web
2. **Planification** : strategie d'action
3. **Action** : execution commandes ou modification code
4. **Verification** : analyse resultats, ajustement si necessaire

---

## 2. Les 7 Piliers (Core Seven)

### A. Memoire et Regles
3 niveaux de CLAUDE.md :
- **Global** : `~/.claude/CLAUDE.md` (preferences personnelles, style)
- **Projet** : racine du projet (architecture, stack, regles metier)
- **Dossier** : sous-dossiers specifiques (regles locales composants UI)

### B. Skills (Competences)
- Instructions + scripts Markdown
- Chargement on-demand = economie de tokens
- Expliquent a Claude COMMENT realiser une tache

### C. Hooks
- Actions automatiques avant/apres utilisation d'un outil
- Exemple : formateur code (Prettier) apres chaque modification

### D. MCP (Model Context Protocol)
Deux outils recommandes :
- **Context7** : documentation technique a jour
- **Exa** : recherches web ultra-rapides

### E. Sous-Agents (Subagents)
- Mini-versions pour eviter saturer contexte principal
- Peut lire 100 000 mots et n'en rapporter que 500 essentiels
- **Isolation de contexte** = precision maximale

### F. Status Line
- Barre en bas du terminal
- Affiche : modele, dossier, % contexte consomme, cout session

### G. Teams (Equipes d'Agents)
- Experimental : Team Lead + developpeurs specialises
- Travail en parallele sur differentes zones (Frontend, Backend, Docs)

---

## 3. Probleme "Lost in the Middle"

- Les modeles accordent plus d'importance au DEBUT et a la FIN du contexte
- Les informations AU MILIEU sont souvent ignorees

### Solution : Prompt Discovery
- Diviser tache complexe en plusieurs etapes (steps)
- L'IA decouvre et execute une par une
- Evite la perte d'informations au milieu du contexte

---

## 4. Dossier .claude — Coeur nevralgique

Contient :
- **Sessions** : historique complet des conversations
- **Plans** : strategies elaborees par l'IA
- **Rules** : regles strictes (interdictions, patterns obligatoires)

---

## 5. Worktrees pour modifications lourdes

- Environnement isole (branche separee)
- L'IA travaille sans perturber la branche principale
- Facilite review via Pull Requests
- Usage : changements structurels (DB, architecture)

---

## 6. Bonnes pratiques

1. **Apprentissage continu** : erreur recurrente → creer regle dans `.claude/rules/` pour interdire definitivement
2. **Screenshots** : bugs visuels → envoyer capture, Claude "voit" et corrige
3. **Technique des Logs** : bug complexe → IA insere logs → execute → analyse console → auto-correction
4. **Meta-Prompting** : utiliser Claude pour creer des prompts/Skills plus performants ("l'IA pour ameliorer l'IA")

---

## Impact sur Verone — Nouveaux points

### Prompt Discovery
- **A implementer** : nos commandes `/implement` et `/plan` devraient decomposer en etapes decouvrables
- Eviter les prompts monolithiques qui se perdent dans le contexte

### Worktrees
- On utilise deja les feature branches, mais pas les worktrees Git
- Pour les refactorings lourds (ex: refonte formulaire commande), utiliser `git worktree` pour isoler

### Status Line
- On a deja un statusline custom (`.claude/scripts/statusline-debug.sh`)
- Verifier qu'il affiche le % de contexte consomme

### Teams d'agents (futur)
- Quand Romeo aura TMUX : Team Lead (orchestrateur) + linkme-expert + back-office-expert en parallele
- Correspond a notre architecture d'agents par app

### "Lost in the Middle" — Impact direct
- Explique pourquoi les regles au milieu de CLAUDE.md sont parfois ignorees
- Solution : garder CLAUDE.md court, mettre les regles CRITICAL en haut et en bas
- Les rules dans `.claude/rules/` sont chargees separement → pas affectees par ce probleme
