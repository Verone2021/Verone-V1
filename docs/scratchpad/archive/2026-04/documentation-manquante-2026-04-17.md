# AXE 3 — DOCUMENTATION MANQUANTE

**Date** : 17 avril 2026
**Objectif** : Identifier ce qui **devrait** etre documente et ne l'est pas.
**Structure** : par priorite (critique → utile → confort).
**Sortie attendue apres validation** : liste de tickets documentation.

---

## 1. CRITIQUE — impact agents IA + onboarding humain

### 1.1 Packages `@verone/*` sans CLAUDE.md

D'apres l'audit 16/04 (Section 6.B), **seuls 3 packages sur 23 ont un CLAUDE.md** :

| Package         | CLAUDE.md      | README.md                    | Etat               |
| --------------- | -------------- | ---------------------------- | ------------------ |
| organisations   | ✓              | ✓                            | Complet            |
| orders          | ✓              | ?                            | Partiel            |
| customers       | ✓ (deprecated) | ?                            | Deprecated declare |
| ui              | ✗              | ✓ (+ DISABLED_COMPONENTS.md) | README seul        |
| stock           | ✗              | ✓                            | README seul        |
| finance         | ✗              | ✓                            | README seul        |
| types           | ✗              | ✓                            | README seul        |
| products        | ✗              | ?                            | Non verifie        |
| hooks           | ✗              | ?                            | Non verifie        |
| utils           | ✗              | ?                            | Non verifie        |
| integrations    | ✗              | ?                            | Non verifie        |
| channels        | ✗              | ?                            | Non verifie        |
| notifications   | ✗              | ?                            | Non verifie        |
| logistics       | ✗              | ?                            | Non verifie        |
| dashboard       | ✗              | ?                            | Non verifie        |
| consultations   | ✗              | ?                            | Non verifie        |
| collections     | ✗              | ?                            | Non verifie        |
| categories      | ✗              | ?                            | Non verifie        |
| roadmap         | ✗              | ?                            | Non verifie        |
| common          | ✗              | ?                            | Non verifie        |
| ui-business     | ✗              | ?                            | Non verifie        |
| eslint-config   | (pas besoin)   | ?                            | Config, pas metier |
| prettier-config | (pas besoin)   | ?                            | Config, pas metier |

**Action proposee** : creer un CLAUDE.md minimal pour les **packages metier** (18 paquets hors config/types) qui documente :

- Role du package (1 phrase)
- Ce qu'il expose (hooks, composants, utils principaux)
- Ce qu'il depend de / ce qui depend de lui
- Regle critique (ex : "ne JAMAIS importer `apps/*` depuis ici")

Template a creer : `/.claude/templates/package-CLAUDE.md`. Longueur cible : 20-40 lignes par package.

### 1.2 `chrome-extension/` completement non documente

Contenu non audite en profondeur mais :

- `popup.js` : 676 lignes
- `content-script.js` : 592 lignes
- Aucun CLAUDE.md, README.md, ni entree dans README principal
- Jamais mentionne dans CLAUDE.md racine ni dans les agents

**Action proposee** : creer `chrome-extension/README.md` avec :

- But de l'extension (cas d'usage)
- Comment l'installer
- Comment la tester
- Comment elle communique avec le monorepo (API ? copier/coller ?)
- Si toujours maintenue ou deprecated

### 1.3 `PROTECTED_FILES.json` non reference dans CLAUDE.md

Fichier critique (protege migrations, env, CLAUDE.md lui-meme). Un agent qui ne le connait pas peut tenter de modifier un fichier protege.

**Action proposee** : ajouter dans `CLAUDE.md` racine, section "SOURCES DE VERITE", une ligne :

```
| Fichiers proteges | PROTECTED_FILES.json |
```

### 1.4 Documentation du workflow dev-plan / dev-report / review-report

Ce workflow est **tres utilise** (25 fichiers dans scratchpad) mais **aucun document ne l'explique** :

- Quand creer un dev-plan ?
- Quand un dev-report ?
- Quand un review-report ?
- Nommage (date + task ID)
- Que faire quand une tache est terminee ? (archivage ?)

**Action proposee** : creer `docs/current/workflows/scratchpad-workflow.md` (ou enrichir `docs/current/dev-workflow.md` existant). Couvrir :

- Format de nommage des fichiers
- Sections obligatoires de chaque type de doc
- Cycle de vie d'une tache (plan → code → report → review → archive)
- Regle de menage (quand supprimer ? voir workflow `scratchpad-cleanup.yml`)

### 1.5 Documentation `docs/logs/` quotidien

3 fichiers journaux (16, 17, 18 avril) mais aucune doc sur :

- Qui ecrit ces logs ? (Romeo ? Claude automatiquement ?)
- Quel format ?
- Quand les consulter ?

**Action proposee** : creer `docs/logs/README.md` qui explique le role et le format des journaux quotidiens.

### 1.6 Strategie de deploiement reelle

Le README annonce un pipeline GitHub Actions complet (staging → production). En realite : Vercel auto-deploy + un seul workflow qualite.

**Action proposee** : reecrire `docs/current/deploy-runbooks.md` avec :

- Flux reel : merge staging → Vercel previewUrl, merge main → Vercel production
- Role de `quality.yml` (gate qualite avant merge staging)
- Absence de tests E2E en CI (a declarer explicitement + plan pour y remedier)
- Procedure rollback Vercel

### 1.7 Configuration Vercel jamais decrite

Dossier `.vercel/` + `vercel.json` + `.vercel-trigger` dans chaque app. Aucune doc.

**Action proposee** : creer `docs/current/deployment/vercel-config.md` :

- Comptes Vercel (un projet par app ? mono-projet ?)
- Variables d'env a configurer
- Gestion des previewUrl pour les PR

---

## 2. UTILE — ameliore la qualite projet

### 2.1 Documentation des 3 integrations paiement

Le projet utilise **3 PSP differents** (detecte via dependances + audit 16/04) :

- Qonto (back-office, facturation)
- Stripe (site-internet, checkout)
- Revolut (linkme, commissions)

Documentation existante :

- Qonto : bien documente (`docs/integrations/qonto/GUIDE-COMPLET-API-QONTO.md`)
- Stripe : **absent** — juste dependances dans package.json
- Revolut : **absent** — variables d'env mentionnees dans audit 16/04 seulement

**Action proposee** :

- Creer `docs/integrations/stripe/GUIDE-COMPLET-STRIPE.md`
- Creer `docs/integrations/revolut/GUIDE-COMPLET-REVOLUT.md`

### 2.2 Mapping feature flags

L'audit 16/04 evoque "16 feature flags pour phases 1-3". Aucune doc n'explique :

- Nom de chaque flag
- Son role
- Son statut (actif/inactif/obsolete)
- Le code qui le lit

**Action proposee** : creer `docs/current/feature-flags.md` avec un tableau vivant.

### 2.3 Doublons types Supabase — note officielle

L'audit 16/04 signale des copies imbriquees anormales :

- `packages/@verone/types/packages/@verone/types/src/supabase.ts`
- `packages/@verone/types/apps/back-office/src/types/supabase.ts`
- `packages/@verone/ui/packages/...`

**Action proposee** : soit nettoyer (voir axe 4), soit **a minima** ajouter une note dans `packages/@verone/types/README.md` expliquant pourquoi et quoi faire.

### 2.4 Dette technique triggers DB — centralisation

`ACTIVE.md` liste 3 warnings (W1, W2, W5) avec references vers un rapport retroactif. Mais la liste des warnings 1-9 initiale n'est pas centralisee.

**Action proposee** : creer (ou pointer) `docs/current/database/triggers-stock-dette.md` avec tableau : ID / description / PR liee / statut (W3-W4 resolus, W1-W2-W5 ouverts).

### 2.5 Liste des hooks partages (150+ d'apres README)

L'INDEX `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` liste 541 composants. Mais les **150+ hooks partages dans `@verone/*`** (annonce par `architecture-packages.md`) ne sont pas inventories exhaustivement.

**Action proposee** : automatiser via `pnpm docs:generate:components` (script existe deja). Verifier qu'il couvre bien les hooks des packages, pas seulement ceux des apps.

### 2.6 Glossaire metier

Le projet a un vocabulaire dense (enseigne, affilie, selection, consultation, PMP, pre-payment, proforma, finalisation Qonto, etc.). Un glossaire centralise manque.

Existe partiellement : `docs/current/linkme/GLOSSAIRE-CHAMPS-PRIX.md` (bon point). Mais pas de glossaire global.

**Action proposee** : creer `docs/current/GLOSSAIRE.md` recensant 30-50 termes cles avec definition courte.

### 2.7 Onboarding nouveau developpeur

Le README a une section "Getting Started" mais :

- Pas de checklist "premiere journee"
- Pas de liens vers les ressources pedagogiques
- Pas d'explication de la philosophie (Romeo novice, agents IA, workflow scratchpad)

**Action proposee** : creer `docs/current/ONBOARDING.md` dedie aux humains qui rejoignent le projet.

---

## 3. CONFORT — n'est pas urgent mais ameliore la DX

### 3.1 `docs/marketing/` vide

Dossier present avec juste un `.gitkeep`.

**Action proposee** : soit y mettre le positionnement Verone (market-agent doit bien avoir des briefs quelque part), soit supprimer le dossier.

### 3.2 `docs/runbooks/` quasi vide (1 fichier)

Un seul runbook : `incident.md`. Ajouter les runbooks metier manquants :

- Comment gerer un echec de sync Google Merchant ?
- Comment gerer un webhook Stripe en erreur ?
- Comment gerer une migration SQL ratee ?
- Comment gerer un stock desynchronise ?

**Action proposee** : creer 4-5 runbooks supplementaires progressivement.

### 3.3 `docs/metrics/` (1 fichier)

`database-triggers.md` seul. Ajouter :

- SLOs reels (serena/business-context.md en a probablement)
- Metriques business (taux de conversion, panier moyen, etc.)
- Metriques techniques (couverture tests, temps de build, etc.)

### 3.4 Conventions de code specifiques au projet

Il existe `.claude/rules/code-standards.md` (142 lignes). Mais rien pour les humains dans `docs/`. Un dev humain qui ouvre le repo ne trouvera pas les conventions facilement.

**Action proposee** : creer `docs/current/code-conventions.md` qui **reprend** (ne duplique pas) le contenu de `.claude/rules/code-standards.md` dans un format lisible humain.

### 3.5 Schema visuel architecture

Le README a un diagramme Mermaid simple. Rien d'equivalent dans `docs/current/architecture.md`. Un schema complet avec :

- Les 3 apps
- Les 23 packages
- Les 5 integrations externes (Qonto, Stripe, Revolut, Google Merchant, Resend)
- La DB Supabase centrale

**Action proposee** : un beau diagramme Mermaid dans `docs/current/architecture.md`.

### 3.6 Headers standardises pour chaque doc

Aucune convention de header. Certaines docs ont une date, d'autres non. Certaines ont un statut (actif/archive), d'autres non.

**Action proposee** : creer un template `docs/templates/doc-header.md` et appliquer progressivement :

```markdown
---
statut: actif | draft | archive | deprecated
domaine: back-office | linkme | site-internet | transverse
derniere-revue: YYYY-MM-DD
auteur: @...
source-canonique: oui | non (+ lien vers source si non)
---
```

---

## 4. RECAPITULATIF : NOUVEAUX DOCS PROPOSES

### A creer en priorite 1 (critique)

- `CLAUDE.md` dans 18 packages `@verone/*` (template a creer d'abord)
- `chrome-extension/README.md`
- `docs/current/workflows/scratchpad-workflow.md`
- `docs/logs/README.md`
- Reecriture `docs/current/deploy-runbooks.md` pour refleter la realite

### A creer en priorite 2 (utile)

- `docs/integrations/stripe/GUIDE-COMPLET-STRIPE.md`
- `docs/integrations/revolut/GUIDE-COMPLET-REVOLUT.md`
- `docs/current/feature-flags.md`
- `docs/current/database/triggers-stock-dette.md`
- `docs/current/GLOSSAIRE.md`
- `docs/current/ONBOARDING.md`

### A creer en priorite 3 (confort)

- `docs/current/code-conventions.md` (ou pointer vers `.claude/rules/code-standards.md`)
- `docs/runbooks/*.md` (4-5 runbooks metier)
- `docs/templates/doc-header.md`
- Schema architecture dans `docs/current/architecture.md`

### A corriger plutot qu'a recreer

- `README.md` racine (reecriture partielle — voir Axe 2)
- `docs/README.md` (legere MAJ pour refleter les nouveaux fichiers)
- `docs/current/index.md` (MAJ date + liste)

---

## 5. CHIFFRE FINAL

Si tout est fait :

- **~18 CLAUDE.md a creer** (packages)
- **~15 docs transverses a creer** (priorites 1+2+3)
- **~5 docs a reecrire** (README + deploy + quelques autres)

Effort estime (si Romeo delegue a un `@writer-agent`) : 2-3 sessions de travail intense ou 1 semaine en fond.

---

**FIN DU RAPPORT — AXE 3**

Suite : `docs/scratchpad/dette-technique-2026-04-17.md`
