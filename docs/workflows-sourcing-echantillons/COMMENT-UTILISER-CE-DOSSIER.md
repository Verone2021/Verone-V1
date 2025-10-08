# 🎯 COMMENT UTILISER CE DOSSIER

**Guide pratique pour exploiter la documentation Workflows Sourcing & Échantillons**

---

## 📦 QU'EST-CE QUE CE DOSSIER ?

Ce dossier contient **TOUTE** la documentation des workflows **Sourcing** et **Échantillons** du projet Vérone Back Office, organisée pour être **facilement réutilisable** dans un autre projet.

**Contenu :**
- ✅ **12 fichiers** documentation (118 KB total)
- ✅ **100% workflows** Sourcing & Échantillons documentés
- ✅ **10 diagrammes Mermaid** workflows visuels
- ✅ **Guides tests** prêts à l'emploi (15 min)
- ✅ **Rapports sessions** avec leçons apprises

---

## 🚀 UTILISATION RAPIDE (3 SCÉNARIOS)

### **Scénario 1 : Copier vers Autre Projet**

```bash
# Dans ton autre repository
cd /path/to/autre-projet

# Copier TOUT le dossier
cp -r /path/to/verone-back-office-V1/docs/workflows-sourcing-echantillons docs/

# OU créer lien symbolique (reste synchronisé)
ln -s /path/to/verone-back-office-V1/docs/workflows-sourcing-echantillons docs/workflows-sourcing-echantillons

# Vérifier
ls -lh docs/workflows-sourcing-echantillons/
# → Doit afficher 12 fichiers
```

**Résultat :** Documentation complète disponible dans ton autre projet !

---

### **Scénario 2 : Onboarding Développeur (1h)**

**Parcours recommandé :**

```
1. README.md (15 min)
   → Vue d'ensemble workflows + architecture

2. SYNTHESE-RAPIDE-1-PAGE.md (5 min)
   → Essentiel en 1 page

3. 01-sourcing-workflow-regles-metier.md (20 min)
   → Machine à états + règles métier

4. DIAGRAMMES-WORKFLOWS-VISUELS.md (10 min)
   → Visualiser workflows

5. 04-guide-tests-workflow-sourcing-15min.md (15 min)
   → Tester en pratique
```

**Temps total :** ~1h
**Résultat :** Développeur opérationnel sur workflows Sourcing !

---

### **Scénario 3 : Implémenter dans Nouveau Projet (2-3h)**

**Étapes :**

1. **Lire architecture** (30 min)
   ```
   01-sourcing-workflow-regles-metier.md
   02-sourcing-validation-workflow-echantillons.md
   ```

2. **Créer schema BD** (30 min)
   ```sql
   -- Copier depuis fichiers:
   - Nouvelles colonnes product_drafts
   - Enum types (sourcing_status, sample_status)
   - Fonction calculate_sourcing_product_status()
   - Triggers automatiques
   ```

3. **Implémenter hooks** (1h)
   ```typescript
   // Copier patterns depuis fichiers:
   - use-sourcing-products.ts
   - use-stock.ts
   - Validation business rules
   ```

4. **Créer UI** (1h)
   ```typescript
   // Référence badges visuels:
   - DIAGRAMMES-WORKFLOWS-VISUELS.md (section 9)
   - STATUS_VISUAL configs
   - CONTEXT_BADGES configs
   ```

5. **Tester** (15 min)
   ```
   04-guide-tests-workflow-sourcing-15min.md
   ```

**Temps total :** ~3h
**Résultat :** Workflow Sourcing opérationnel dans nouveau projet !

---

## 📁 STRUCTURE FICHIERS (12 FICHIERS)

### **1. Fichiers Navigation**

#### `00-INDEX-NAVIGATION-RAPIDE.md`
**Quand l'utiliser :** Chercher info spécifique rapidement
**Contenu :** Index par besoin utilisateur + par rôle (dev/PM/QA)

#### `README.md`
**Quand l'utiliser :** Premier fichier à lire (vue d'ensemble)
**Contenu :** Architecture complète + utilisation + métriques

#### `SYNTHESE-RAPIDE-1-PAGE.md`
**Quand l'utiliser :** Besoin essentiel en 5 min
**Contenu :** Workflows + règles + problèmes connus

#### `DIAGRAMMES-WORKFLOWS-VISUELS.md`
**Quand l'utiliser :** Visualiser workflows
**Contenu :** 10 diagrammes Mermaid (machines à états, flowcharts, ERD)

---

### **2. Fichiers Règles Métier**

#### `01-sourcing-workflow-regles-metier.md`
**Quand l'utiliser :** Implémenter workflow Sourcing principal
**Contenu :**
- Machine à états sourcing
- 3 champs obligatoires (Image facultative, Nom, URL)
- Types sourcing (interne vs client)
- Fonction SQL `calculate_sourcing_product_status()`
- Triggers automatiques
- Badges visuels UI

#### `02-sourcing-validation-workflow-echantillons.md`
**Quand l'utiliser :** Implémenter workflow Échantillons
**Contenu :**
- Workflow conditionnel `requires_sample`
- États échantillons (request → ordered → delivered → approved)
- Colonnes BD à créer
- Fonction SQL `validate_sourcing_product()`
- Interface utilisateur modals

#### `03-workflows-generaux-etats-transitions.md`
**Quand l'utiliser :** Contexte workflows généraux système
**Contenu :** Commandes vente, Factures, Stock mouvements

---

### **3. Fichiers Guides Pratiques**

#### `04-guide-tests-workflow-sourcing-15min.md`
**Quand l'utiliser :** Tester workflow Sourcing
**Contenu :**
- 6 phases test (2-5 min chacune)
- Checklist validation
- Problèmes connus + solutions

#### `07-guide-insertion-donnees-mcp-browser.md`
**Quand l'utiliser :** Insérer données produits
**Contenu :**
- Méthode MCP Browser (JAMAIS scripts)
- Phase pilote (5 produits, 1h)
- Phase complète (50+ produits, 4-6h)
- Console error checking systématique

---

### **4. Fichiers Rapports Sessions**

#### `05-rapport-session-finale-3-erreurs-critiques.md`
**Quand l'utiliser :** Apprendre patterns fix erreurs
**Contenu :**
- Fix boucle infinie AuthApiError
- Fix image facultative Sourcing
- Fix création Organisations 400
- 5 commits professionnels

#### `06-session-activation-sourcing-phase1.md`
**Quand l'utiliser :** Comprendre activation module
**Contenu :**
- Activation `NEXT_PUBLIC_SOURCING_ENABLED=true`
- Fix erreurs 400 Supabase (jointures)
- Architecture finale Phase 1

---

### **5. Fichiers État Projet**

#### `08-implementation-status-complet.md`
**Quand l'utiliser :** Voir état global système
**Contenu :**
- Modules Phase 1 opérationnels
- Métriques business (241 produits)
- Risques & actions prioritaires
- Performance actuelle

---

## 🎯 PARCOURS PAR RÔLE

### **Développeur Backend**
```
1. 01-sourcing-workflow-regles-metier.md (20 min)
   → Fonctions SQL + triggers

2. 02-sourcing-validation-workflow-echantillons.md (20 min)
   → Schema BD échantillons

3. DIAGRAMMES-WORKFLOWS-VISUELS.md (10 min)
   → ERD + workflows

4. 05-rapport-session-finale-3-erreurs-critiques.md (10 min)
   → Patterns fix
```
**Total :** 1h

---

### **Développeur Frontend**
```
1. 01-sourcing-workflow-regles-metier.md (15 min)
   → Badges UI + statuts

2. DIAGRAMMES-WORKFLOWS-VISUELS.md (15 min)
   → Workflows UI + badges couleurs

3. 04-guide-tests-workflow-sourcing-15min.md (15 min)
   → Tests manuels

4. 05-rapport-session-finale-3-erreurs-critiques.md (10 min)
   → Fix frontend
```
**Total :** 55 min

---

### **Product Manager**
```
1. README.md (15 min)
   → Vue d'ensemble

2. SYNTHESE-RAPIDE-1-PAGE.md (5 min)
   → Essentiel

3. 01-sourcing-workflow-regles-metier.md (15 min)
   → Règles métier

4. DIAGRAMMES-WORKFLOWS-VISUELS.md (10 min)
   → Workflows visuels

5. 08-implementation-status-complet.md (10 min)
   → État projet
```
**Total :** 55 min

---

### **QA / Testeur**
```
1. 04-guide-tests-workflow-sourcing-15min.md (20 min)
   → Guide tests complet (lire + préparer)

2. SYNTHESE-RAPIDE-1-PAGE.md (5 min)
   → Problèmes connus

3. Exécuter tests (15 min)
   → Suivre 6 phases

4. 05-rapport-session-finale-3-erreurs-critiques.md (10 min)
   → Erreurs courantes
```
**Total :** 50 min

---

## 🔍 RECHERCHE RAPIDE

### **Cmd+F (Recherche fichier)**

**Chercher :**
- `calculate_sourcing_product_status` → Fonction SQL principale
- `requires_sample` → Logique échantillons
- `supplier_id` → Validation fournisseur
- `STATUS_VISUAL` → Badges UI
- `sample_status` → États échantillons
- `MCP Browser` → Méthode tests

**Fichiers principaux :**
- Fonction SQL → `01-sourcing-workflow-regles-metier.md`
- Échantillons → `02-sourcing-validation-workflow-echantillons.md`
- Tests → `04-guide-tests-workflow-sourcing-15min.md`
- Diagrammes → `DIAGRAMMES-WORKFLOWS-VISUELS.md`

---

## ✅ CHECKLIST UTILISATION

### **Avant Copie Autre Projet**
- [ ] Vérifier 12 fichiers présents (`ls -l`)
- [ ] Taille totale ~118 KB
- [ ] README.md lisible

### **Après Copie**
- [ ] Dossier accessible (`cd docs/workflows-sourcing-echantillons`)
- [ ] Fichiers markdown s'ouvrent correctement
- [ ] Diagrammes Mermaid rendus (VS Code / GitHub)

### **Onboarding Développeur**
- [ ] Lire README.md (15 min)
- [ ] Consulter DIAGRAMMES (10 min)
- [ ] Tester avec guide (15 min)
- [ ] Développeur peut expliquer workflow Sourcing

### **Implémentation**
- [ ] Schema BD créé (colonnes + fonctions SQL)
- [ ] Hooks implémentés (TypeScript)
- [ ] UI badges configurés
- [ ] Tests manuels PASS (0 erreur console)

---

## 🛠️ OUTILS RECOMMANDÉS

### **Pour Lire Documentation**
- **VS Code** : Extension Markdown Preview Enhanced (diagrammes Mermaid)
- **GitHub** : Render automatique Mermaid
- **Obsidian** : Graph view des liens entre fichiers

### **Pour Copier Fichiers**
```bash
# Copie simple
cp -r docs/workflows-sourcing-echantillons /autre-projet/docs/

# Copie avec archive
tar -czf workflows-sourcing.tar.gz docs/workflows-sourcing-echantillons/
# → Envoyer .tar.gz à quelqu'un

# Extraction
tar -xzf workflows-sourcing.tar.gz
```

---

## 📊 MÉTRIQUES DOCUMENTATION

**Complétude :**
- ✅ 100% workflows Sourcing documentés
- ✅ 100% workflows Échantillons documentés
- ✅ 10 diagrammes visuels
- ✅ 8 fichiers documentation source

**Réutilisabilité :**
- ✅ Copie directe possible (1 commande)
- ✅ Liens relatifs fonctionnels
- ✅ Pas de dépendances externes
- ✅ Format Markdown standard

**Maintenabilité :**
- ✅ Structure claire (00-INDEX, README, etc.)
- ✅ Noms fichiers explicites
- ✅ Table des matières dans README
- ✅ Dates création visibles

---

## 🎁 BONUS : COMMANDES UTILES

### **Statistiques Dossier**
```bash
# Nombre fichiers
ls -1 docs/workflows-sourcing-echantillons/ | wc -l
# → 12

# Taille totale
du -sh docs/workflows-sourcing-echantillons/
# → 118K

# Nombre lignes total
wc -l docs/workflows-sourcing-echantillons/*.md | tail -1
# → ~4000 lignes
```

### **Recherche Globale**
```bash
# Chercher "échantillon" dans tous fichiers
grep -r "échantillon" docs/workflows-sourcing-echantillons/

# Chercher fonction SQL
grep -r "calculate_sourcing" docs/workflows-sourcing-echantillons/

# Lister tous diagrammes Mermaid
grep -r "```mermaid" docs/workflows-sourcing-echantillons/
```

### **Export PDF (Optionnel)**
```bash
# Installer pandoc
brew install pandoc

# Convertir README en PDF
pandoc docs/workflows-sourcing-echantillons/README.md -o workflows-sourcing.pdf
```

---

## 📞 SUPPORT

**Documentation principale projet :**
- [`CLAUDE.md`](/CLAUDE.md) - Configuration agents MCP 2025
- [`manifests/business-rules/`](/manifests/business-rules/) - Règles métier validées
- [`MEMORY-BANK/`](/MEMORY-BANK/) - Contexte projet persistant

**Outils révolutionnaires utilisés :**
- MCP Playwright Browser (tests visibles)
- Sequential Thinking (architecture complexe)
- Serena (code intelligence symbolique)
- Supabase MCP (queries + logs + advisors)

---

## ✨ RÉSUMÉ FINAL

**Ce dossier te permet de :**

✅ **Copier 100% documentation** workflows Sourcing/Échantillons vers autre projet (1 commande)
✅ **Former développeur** en 1h (parcours structuré)
✅ **Implémenter workflows** en 2-3h (guides détaillés)
✅ **Tester système** en 15 min (guide prêt)
✅ **Visualiser architecture** (10 diagrammes Mermaid)

**Total :** 12 fichiers, 118 KB, ~4000 lignes documentation professionnelle

---

**🎉 Maintenant tu peux copier ce dossier dans ton autre projet et avoir TOUTE la documentation workflows Sourcing & Échantillons disponible !**

*Guide créé le 2025-10-06 - Vérone Back Office Phase 1*
