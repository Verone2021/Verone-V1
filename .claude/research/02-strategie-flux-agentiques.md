# Recherche 2 : Guide Strategique — Flux de Travail Agentiques (300 jours de production)

**Source** : Transcription Romeo — retour d'experience 300+ jours production
**Date** : 2026-03-27

---

## Resume executif

- Passer de "chat" a "processus" via rules + skills
- Transition MCP → CLI obligatoire
- Multi-agent (3-4 simultanes) = norme senior
- Plans Max (100-200$) = meilleur ratio valeur/token

---

## 1. Les 5 Erreurs Critiques

### 1.1 Absence de configuration haut niveau
- `CLAUDE.md` = minimaliste, workflow + types de modifications + imports + chemins essentiels
- `.claude/rules/` = patterns specifiques (routes API, nommage, securite)
- Objectif : qualite "obligatoire par defaut"

### 1.2 Peur des permissions
- Limiter l'acces = degrader les resultats
- Bypass permissions = IA reellement autonome
- Risque securite mineur vs gain productivite (sauvegardes + fixtures existent)

### 1.3 Manque de standardisation
- Melange d'outils = dette technique
- Solution : Skills Workflow (Apex, Oneshot) qui forcent exploration → execution → revision

### 1.4 Un Dev = Un Agent (ERREUR)

| Profil | Mode | Efficacite |
|---|---|---|
| Junior/Classique | 1 agent a la fois | Faible (4 min attente / 1 min prompt) |
| Expert Agentique | 3-4 agents simultanes | Maximale (flux continu) |

### 1.5 Reviews humaines trop lentes
- Automatiser review 1er niveau via agents specialises

---

## 2. Mort du MCP — Superiorite CLI + Skills

### Problemes MCP
1. **Saturation contexte** : outils MCP injectent des instructions systeme meme si non utilises → gaspillage tokens
2. **Lourdeur** : serveur NPM constant, RAM, maintenance
3. **Decouverte inefficace** : "Load on demand" rend les outils MCP moins accessibles si le modele ne connait pas leur existence exacte

### Superiorite Bash + Skills
- **Bash = outil universel** que l'IA maitrise le mieux
- **Pattern "API to CLI"** : transformer API en mini-CLI locaux (Stripe, Vercel, Gmail)
- **Skills = connaissances on-demand** : dossiers avec instructions, scripts, templates. Telecharges uniquement au besoin
- **Efficacite token** : `head -n 150`, pipes → extraction chirurgicale des donnees necessaires

---

## 3. Methodologies avancees

### 3.1 Debugging
1. **Technique des Logs** : IA insere des logs → execute → analyse ses propres sorties → auto-correction
2. **Apprentissage Continu (Memory)** : quand l'IA repete une erreur → creer fichier dans `.claude/rules/` avec flag CRITICAL

### 3.2 Commandes Workflow

| Commande | Usage | Taux succes |
|---|---|---|
| `/apex` | Feature complete (Analyse → Plan → Implementation → Revue) | 99% 1er essai |
| `/oneshot` | Corrections rapides isolees | Rapide |
| `/brainstorm` | Recherche web + Devil's Advocate + synthese | Exploration |
| `/review-code` | Audit securite + best practices + clean code | Pre-merge |

### 3.3 Contexte visuel
- Screenshots pour bugs UI = reduit l'ambiguite des prompts textuels
- Claude interprete visuellement les bugs

---

## 4. Infrastructure

### 4.1 Abonnements
- Pro (20$) : usage modere
- Max 100$ : 5x capacite
- Max 200$ : 20x capacite, meilleur ratio valeur/euro, zero blocage sessions intensives

### 4.2 TMUX
- Multiplier instances Claude Code dans une fenetre
- Persister sessions (detach/attach)
- Serveur dev + agents codage en parallele

### 4.3 Dossier "CC" (laboratoire)
- Dossier hors-projet pour experimenter (slides, titres, comptabilite)
- Tester avant de transformer en Skills permanents

---

## Impact sur Verone

### Actions immediates
1. **Technique Emphasis CRITICAL** dans nos rules existantes — ajouter le mot CRITICAL en haut des regles les plus importantes
2. **Memory/Rules automatique** — quand un bug se repete, creer une rule CRITICAL pour le graver
3. **Evaluer reduction MCP** — Serena consomme beaucoup de contexte, Magic aussi. Les garder uniquement si le CLI ne peut pas faire la meme chose
4. **Restructurer nos commandes** selon le modele Apex/Oneshot/Brainstorm/Review
5. **TMUX multi-agent** — Romeo peut superviser 3-4 agents en parallele

### Ce qu'on garde des MCP (pour l'instant)
- **Supabase MCP** : difficile a remplacer par CLI (execute_sql, list_tables, advisors)
- **Playwright MCP** : essentiel pour les tests visuels, pas de CLI equivalent
- **Context7 MCP** : documentation librairies a jour, utile mais evaluable

### Ce qu'on peut potentiellement supprimer
- **Serena MCP** : les memories sont deja en fichiers `.serena/memories/`, le find_symbol peut etre fait avec Grep/Glob
- **Magic MCP** : composants UI — peut etre remplace par des Skills avec templates
