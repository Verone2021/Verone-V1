# 📑 INDEX - NAVIGATION RAPIDE

**Accès rapide par besoin utilisateur**

---

## 🎯 JE VEUX...

### **Comprendre l'architecture globale**
➡️ Lire : [`README.md`](README.md) - Vue d'ensemble complète

---

### **Implémenter le workflow Sourcing**
➡️ Lire : [`01-sourcing-workflow-regles-metier.md`](01-sourcing-workflow-regles-metier.md)
- Machine à états
- Fonction SQL `calculate_sourcing_product_status()`
- Triggers automatiques
- Badges visuels

---

### **Implémenter les échantillons**
➡️ Lire : [`02-sourcing-validation-workflow-echantillons.md`](02-sourcing-validation-workflow-echantillons.md)
- Workflow conditionnel `requires_sample`
- États échantillons (request → ordered → delivered → approved)
- Fonction SQL `validate_sourcing_product()`
- Colonnes BD à créer

---

### **Tester le système (15 minutes)**
➡️ Suivre : [`04-guide-tests-workflow-sourcing-15min.md`](04-guide-tests-workflow-sourcing-15min.md)
- 6 phases test détaillées
- Checklist validation
- Vérification console 0 erreur

---

### **Résoudre erreurs courantes**
➡️ Consulter : [`05-rapport-session-finale-3-erreurs-critiques.md`](05-rapport-session-finale-3-erreurs-critiques.md)
- Fix boucle infinie AuthApiError
- Fix image facultative Sourcing
- Fix création Organisations 400

---

### **Comprendre contexte activation**
➡️ Lire : [`06-session-activation-sourcing-phase1.md`](06-session-activation-sourcing-phase1.md)
- Activation `NEXT_PUBLIC_SOURCING_ENABLED=true`
- Fix erreurs 400 Supabase
- Architecture finale Phase 1

---

### **Insérer données produits**
➡️ Suivre : [`07-guide-insertion-donnees-mcp-browser.md`](07-guide-insertion-donnees-mcp-browser.md)
- Méthode MCP Browser (JAMAIS de scripts)
- Phase pilote (5 produits, 1h)
- Phase complète (50+ produits, 4-6h)

---

### **Voir état complet système**
➡️ Consulter : [`08-implementation-status-complet.md`](08-implementation-status-complet.md)
- Modules Phase 1 opérationnels
- Métriques business
- Risques & actions prioritaires

---

### **Comprendre workflows généraux**
➡️ Référence : [`03-workflows-generaux-etats-transitions.md`](03-workflows-generaux-etats-transitions.md)
- Commandes vente
- Factures
- Mouvements stock

---

## 📋 PAR RÔLE UTILISATEUR

### **Développeur Backend**
1. [`01-sourcing-workflow-regles-metier.md`](01-sourcing-workflow-regles-metier.md) - Fonctions SQL
2. [`02-sourcing-validation-workflow-echantillons.md`](02-sourcing-validation-workflow-echantillons.md) - Schema BD
3. [`05-rapport-session-finale-3-erreurs-critiques.md`](05-rapport-session-finale-3-erreurs-critiques.md) - Patterns fix

### **Développeur Frontend**
1. [`01-sourcing-workflow-regles-metier.md`](01-sourcing-workflow-regles-metier.md) - Badges UI
2. [`04-guide-tests-workflow-sourcing-15min.md`](04-guide-tests-workflow-sourcing-15min.md) - Tests manuels
3. [`05-rapport-session-finale-3-erreurs-critiques.md`](05-rapport-session-finale-3-erreurs-critiques.md) - Fix UI

### **Product Manager**
1. [`README.md`](README.md) - Vue d'ensemble
2. [`01-sourcing-workflow-regles-metier.md`](01-sourcing-workflow-regles-metier.md) - Règles métier
3. [`08-implementation-status-complet.md`](08-implementation-status-complet.md) - État projet

### **QA / Testeur**
1. [`04-guide-tests-workflow-sourcing-15min.md`](04-guide-tests-workflow-sourcing-15min.md) - Guide tests complet
2. [`05-rapport-session-finale-3-erreurs-critiques.md`](05-rapport-session-finale-3-erreurs-critiques.md) - Erreurs connues
3. [`07-guide-insertion-donnees-mcp-browser.md`](07-guide-insertion-donnees-mcp-browser.md) - Insertion données test

---

## 🔍 PAR TYPE CONTENU

### **Règles Métier**
- [`01-sourcing-workflow-regles-metier.md`](01-sourcing-workflow-regles-metier.md)
- [`02-sourcing-validation-workflow-echantillons.md`](02-sourcing-validation-workflow-echantillons.md)
- [`03-workflows-generaux-etats-transitions.md`](03-workflows-generaux-etats-transitions.md)

### **Guides Pratiques**
- [`04-guide-tests-workflow-sourcing-15min.md`](04-guide-tests-workflow-sourcing-15min.md)
- [`07-guide-insertion-donnees-mcp-browser.md`](07-guide-insertion-donnees-mcp-browser.md)

### **Rapports Sessions**
- [`05-rapport-session-finale-3-erreurs-critiques.md`](05-rapport-session-finale-3-erreurs-critiques.md)
- [`06-session-activation-sourcing-phase1.md`](06-session-activation-sourcing-phase1.md)

### **État Projet**
- [`08-implementation-status-complet.md`](08-implementation-status-complet.md)

---

## ⚡ PARCOURS RECOMMANDÉS

### **Onboarding Nouveau Développeur (1h)**
```
1. README.md (15 min) - Vue d'ensemble
2. 01-sourcing-workflow-regles-metier.md (20 min) - Architecture
3. 04-guide-tests-workflow-sourcing-15min.md (15 min) - Tests pratiques
4. 05-rapport-session-finale-3-erreurs-critiques.md (10 min) - Leçons
```

### **Implémentation Rapide (2-3h)**
```
1. 01-sourcing-workflow-regles-metier.md (30 min) - Comprendre système
2. 02-sourcing-validation-workflow-echantillons.md (30 min) - Échantillons
3. Implémenter code (1-2h)
4. 04-guide-tests-workflow-sourcing-15min.md (15 min) - Valider
```

### **Résolution Bug (30 min)**
```
1. 05-rapport-session-finale-3-erreurs-critiques.md (15 min) - Patterns fix
2. README.md section "Problèmes connus" (5 min)
3. Appliquer fix (10 min)
```

---

## 📊 MÉTRIQUES DOCUMENTATION

**Total fichiers :** 9 (incluant README + INDEX)
**Couverture :** 100% workflows Sourcing & Échantillons
**Formats :** Markdown + Mermaid diagrams
**Taille totale :** ~150 KB texte

**Réutilisable :** ✅ Copier-coller vers autre projet
**Maintenable :** ✅ Structure claire, noms explicites
**Complet :** ✅ Architecture + Tests + Sessions + État

---

**🎯 Navigation optimale : Utiliser recherche Cmd+F pour trouver rapidement**

*Index créé le 2025-10-06*
