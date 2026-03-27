# Recherche 5 : Guide Strategique — Maitriser le Developpement Agentique

**Source** : Transcription Romeo — guide strategique complet
**Date** : 2026-03-27

---

## Resume

"Definir le monde (le pattern) pour que l'output soit parfait par defaut." Configuration = acte fondateur de la souverainete de l'agent. L'humain apporte le "Gout" (vision produit), l'IA gere le "Clean Code".

---

## 1. Architecture Memoire Strategique

### Hierarchie
1. **CLAUDE.md (La Carte)** : minimaliste, chemins vers fichiers critiques (schemas DB, auth, configs)
2. **.claude/rules (Les Lois)** : segmenter par domaine, NE PAS melanger
3. **.claude/skills (Les Competences)** : "cheat codes" — patterns caching, client-side fetch, etc.

### Fichiers memoire essentiels

| Fichier | Contenu | Impact |
|---|---|---|
| `rules/api.md` | Patterns routes + middlewares obligatoires | Elimine failles securite des la generation |
| `rules/naming.md` | Conventions (SnakeCase vs CamelCase) | Uniformite parfaite, zero refactoring style |
| `skills/security.md` | Checklist securite automatisee | Chaque commit respecte les standards |
| `CLAUDE.md` | Vision produit + indexation fichiers cles | Coherence globale fonctionnalites |

---

## 2. Paradoxe des Permissions

- **Mode Bypass** = decision de performance, pas de risque
- Chaque clic "Yes" de validation = frein a la velocite
- "Une IA peut recoder votre application en 20 min ; s'inquieter du vol de donnees est irrationnel"
- **Securisation par infrastructure** : fixtures DB pour restaurer en secondes, pas par restrictions logicielles

| IA Limitee | IA Pleins Pouvoirs |
|---|---|
| Interruption constante du flux | Autonomie totale |
| "Paresse" par manque d'acces outils | Chaine optimale (Bash, Edit, Fetch) |
| Frustration, baisse qualite | Execution fluide |

---

## 3. Methode Apex (Elite)

4 etats sequentiels :
1. **Exploration** : analyse codebase + documentation externe
2. **Planification (Plan Mode)** : plan d'action detaille AVANT de toucher au code — validation critique
3. **Execution (Act Mode)** : modifications une fois le plan valide
4. **Revue** : tests unitaires + linters

### Skills de Revue automatises
- **Clean Code** : fichier > 400 lignes → sous-agent refactoring automatique
- **Optimizer** : force patterns de cache
- **Security Check** : verifie injections + droits d'acces

> "Ce processus permet a un junior de produire un code plus propre que ce que vous produisiez il y a 5 ans."

---

## 4. Dev-Moniteur : 3-4 agents simultanes

- Ratio optimal : **3-4 agents**
- Prerequis : workflows standardises (sinon "cerveau explose")
- Cycle : definir besoin (1 min) → agent travaille (5 min) → piloter les 3 autres

### TMUX
- Sessions nommees (Frontend, Backend, Workers)
- Split ecrans pour voir agents en parallele
- Detach (Ctrl+B + D) pour taches en fond

---

## 5. Ingenierie du Contexte

### "Lost in the Middle"
- IA ignore le milieu d'un prompt trop long
- Solutions : **Prompt Discovery** (lecture sequentielle) + **Subagents**

### Sous-agents = machines a economiser tokens
- Agent "Explore" : parcourt 120 000 mots → retourne 1 500 essentiels
- Protege la clarte cognitive de l'agent principal

### MCP recommandes (dans ce guide)

| MCP | Usage |
|---|---|
| **Context7** | Documentation technique indexee |
| **Exa** | Recherche web ultra-rapide |
| **Playwright** | Tests UI + crawling — indispensable |

---

## 6. Greenfield vs Brownfield

- **Greenfield** : specifier stack, laisser IA "definir la technique"
- **Brownfield** : donner des yeux a l'IA
  - **Iterative Visual Loop** : screenshot → dessiner sur l'image → envoyer a Claude
  - **Injection Positive** : commentaires de code pour guider sur patterns internes non documentes

---

## 7. Rentabilite

| Plan | Cout | Valeur API estimee | Pour qui |
|---|---|---|---|
| Pro | 20$ | ~225$ | Usage modere |
| Max 5x | 100$ | ~800$ | Dev CDI standard |
| Max 20x | 200$ | ~3200$ | Meilleur ROI freelance/senior |

Seul goulot : session 5h. Limite hebdomadaire quasi-impossible a atteindre meme en Max 20x.

---

## 8. Checklist Mise en Oeuvre

1. CLAUDE.md avec paths critiques + premieres rules
2. Mode bypass permissions
3. Regle ChangeLog : IA update changelog.md apres chaque modification
4. Standardiser workflows via Skills (Apex, Optimizer, Security)
5. TMUX : viser 3 agents simultanes d'ici fin de semaine

---

## Impact sur Verone — Synthese des 5 recherches

### Actions prioritaires pour la refonte

| # | Action | Source | Priorite |
|---|---|---|---|
| 1 | **Technique Emphasis CRITICAL** dans toutes les rules importantes | R1, R2, R3 | IMMEDIATE |
| 2 | **Regle "3 fichiers similaires"** avant modification | R3 | IMMEDIATE |
| 3 | **Restructurer commandes** selon Apex/Oneshot/Review | R1, R2, R5 | HAUTE |
| 4 | **Evaluer reduction MCP** : garder Supabase + Playwright + Context7, evaluer Serena + Magic | R1, R2, R3 | HAUTE |
| 5 | **Sous-agent Clean Code** : rejeter fichiers > 400 lignes | R1, R3, R5 | HAUTE |
| 6 | **Skills templates** : new-component, new-api-route, db-migration | R3 | MOYENNE |
| 7 | **Prompt Discovery** dans /implement : decomposer en etapes | R4 | MOYENNE |
| 8 | **TMUX multi-agent** : 3 agents en parallele | R1-R5 (unanime) | OBJECTIF |
| 9 | **Regle ChangeLog** : update automatique apres modification | R5 | BASSE |
| 10 | **"Lost in the Middle"** : rules CRITICAL en haut/bas du CLAUDE.md | R4 | IMMEDIATE |
