# 🛠️ Workflow Maintenance Claude Code - Guide Anti-Régression

**Version** : 1.0 - Post-Optimisation 2025
**Objectif** : Maintenir la structure optimisée et éviter régressions futures
**Cible** : Équipe développement + Sessions Claude Code

---

## 🎯 **PRINCIPE FONDAMENTAL**

> **"Documentation Digestible, Jamais Fragmentée"**
>
> Maximum 5 fichiers actifs par dossier
> Archive obligatoire pour historique
> Consolidation systématique après 10+ fichiers

---

## 📋 **WORKFLOW MAINTENANCE HEBDOMADAIRE**

### **🔍 Audit Documentation (15 min/semaine)**

```bash
# Vérification structure optimisée
find . -name "*.md" -not -path "./.git/*" -not -path "./node_modules/*" | wc -l
# Target: <15 fichiers totaux (vs 70+ avant)

# Vérification manifests/
ls manifests/*.md | wc -l
# Target: 4 fichiers max (business-rules, architecture, prd-core, README)

# Vérification MEMORY-BANK/
ls MEMORY-BANK/*.md | wc -l
# Target: 3 fichiers max (current-session, ai-context, + 1 temporaire)
```

### **📊 Métriques Maintenance**

```typescript
// Indicateurs santé repository
const HEALTH_METRICS = {
  manifests_files: 4, // Maximum autorisé
  memory_bank_files: 3, // Maximum autorisé
  claude_md_lines: 105, // Ligne de base optimisée
  mcp_servers: 7, // MCPs officiels uniquement
  documentation_depth: 2, // Niveaux max (éviter sur-structure)
};
```

---

## 🚨 **SIGNAUX D'ALERTE & ACTIONS**

### **⚠️ Alert Level 1 : Documentation Fragmentation**

**Signaux :**

- manifests/ > 6 fichiers
- MEMORY-BANK/ > 5 fichiers
- Nouveau dossier documentation créé

**Actions Immédiates :**

```bash
# 1. Consolidation manifests/
# Fusionner fichiers similaires dans business-rules.md, architecture.md ou prd-core.md

# 2. Archivage MEMORY-BANK/
mv MEMORY-BANK/ancien-fichier.md MEMORY-BANK/archive/

# 3. Documentation unique
# Éviter création nouveaux README.md, préférer sections dans existants
```

### **🚨 Alert Level 2 : Configuration Drift**

**Signaux :**

- MCPs non-officiels ajoutés à .mcp.json
- CLAUDE.md > 150 lignes
- settings.json avec agents fictifs

**Actions Critiques :**

```bash
# 1. Validation MCPs officiels uniquement
# Supprimer tout MCP non-Anthropic/non-officiel

# 2. CLAUDE.md diet
# Retour à 105 lignes, suppression contenu redondant

# 3. settings.json réaliste
# Task agents uniquement, pas d'agents "verone" fictifs
```

### **💥 Alert Level 3 : Régression Majeure**

**Signaux :**

- Documentation > 20 fichiers totaux
- MCPs errors connexion
- Contradictions docs multiples

**Actions Emergency :**

```bash
# Recovery Procedure
1. git checkout dernière version stable
2. Application workflow optimisation complet
3. Consolidation manuelle forcée
4. Validation équipe avant commit
```

---

## 📝 **TEMPLATES MAINTENANCE**

### **Template Consolidation Manifests/**

```markdown
# Nouveau fichier → Intégration existant

❌ Créer nouveau-processus.md
✅ Ajouter section dans business-rules.md

# Structure maintenue

manifests/
├── business-rules.md # Règles métier all-in-one
├── architecture.md # Specs techniques consolidées
├── prd-core.md # Product requirements
└── README.md # Index + navigation
```

### **Template Session MEMORY-BANK/**

```markdown
# Session courante → current-session.md

- Date + objectifs session
- Accomplissements + métriques
- Actions suivantes

# Context permanent → ai-context.md

- Personas business (stable)
- Règles techniques IA (stable)
- Patterns développement (stable)

# Archive automatique

MEMORY-BANK/archive/ pour historique
```

---

## 🎯 **FORMATION ÉQUIPE**

### **🧑‍💻 Onboarding Développeur**

**Claude Code Optimisé - Checklist :**

1. ✅ Lire README.md section "Monitoring Claude Code"
2. ✅ Consulter manifests/README.md pour navigation
3. ✅ Comprendre structure 4 fichiers manifests/
4. ✅ Vérifier .mcp.json (7 MCPs officiels uniquement)
5. ✅ Tester console error checking (tolérance zéro)

### **📊 KPIs Formation**

```typescript
// Objectifs équipe post-formation
const TEAM_TARGETS = {
  time_finding_info: 30, // <30s trouver info (vs 5+ min avant)
  new_docs_creation: 0, // 0 nouveau fichier doc/mois
  consolidation_reflex: 100, // 100% réflexe consolidation
  mcp_errors: 0, // 0 erreur configuration MCPs
};
```

---

## 🔄 **WORKFLOW INTÉGRATION CONTINUE**

### **Pre-Commit Hooks (Futur)**

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Vérification documentation bounds
manifests_count=$(ls manifests/*.md | wc -l)
if [ $manifests_count -gt 5 ]; then
  echo "❌ ERREUR: manifests/ > 5 fichiers. Consolidation requise."
  exit 1
fi

# Vérification MCPs officiels uniquement
if grep -q '"orchestrator"' .mcp.json; then
  echo "❌ ERREUR: MCP non-officiel détecté dans .mcp.json"
  exit 1
fi

echo "✅ Structure documentation validée"
```

### **GitHub Actions (Future Enhancement)**

```yaml
# .github/workflows/docs-health-check.yml
name: Documentation Health Check
on: [push, pull_request]

jobs:
  docs-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Audit documentation structure
        run: |
          # Compter fichiers documentation
          total_docs=$(find . -name "*.md" -not -path "./.git/*" | wc -l)
          echo "Documentation files: $total_docs"

          if [ $total_docs -gt 15 ]; then
            echo "::error::Documentation fragmentation detected"
            exit 1
          fi
```

---

## 📈 **MÉTRIQUES SUCCESS MAINTENANCE**

### **Avant Optimisation (Baseline)**

```
❌ 70+ fichiers documentation dispersés
❌ 4 MCPs fictifs → erreurs connexion
❌ CLAUDE.md 400+ lignes contradictoires
❌ Temps recherche info: 5+ minutes
❌ Régressions fréquentes par confusion docs
```

### **Après Optimisation (Target Maintenu)**

```
✅ 7 fichiers documentation essentiels
✅ 7 MCPs officiels 100% fonctionnels
✅ CLAUDE.md 105 lignes digestibles
✅ Temps recherche info: <30 secondes
✅ Structure claire anti-régression
```

### **KPIs Maintenance Continue**

```typescript
const MAINTENANCE_SUCCESS = {
  documentation_files: '<=15', // Total fichiers .md
  manifests_files: '<=4', // Manifests/ consolidés
  memory_bank_files: '<=3', // MEMORY-BANK/ optimisé
  mcp_connection_errors: 0, // MCPs officiels uniquement
  team_confusion_incidents: 0, // Documentation claire
  info_search_time: '<=30s', // Navigation rapide
};
```

---

## 🏆 **RÉFÉRENCES ANTI-RÉGRESSION**

### **Documents Consolidés (Ne JAMAIS fragmenter)**

1. **manifests/business-rules.md** → Toutes règles métier
2. **manifests/architecture.md** → Toutes specs techniques
3. **manifests/prd-core.md** → Tous requirements produit
4. **CLAUDE.md** → Configuration Claude Code unique

### **Processus Décision Documentation**

```
Nouvelle information → Où l'intégrer ?
├── Règle métier → business-rules.md (section appropriée)
├── Spec technique → architecture.md (section appropriée)
├── Requirement produit → prd-core.md (section appropriée)
└── Configuration Claude → CLAUDE.md (mise à jour)

❌ JAMAIS créer nouveau fichier sauf cas exceptionnel
✅ TOUJOURS consolider dans existant
```

---

**🎯 Objectif Maintenance : Structure Optimisée Pérenne**

_Guide Anti-Régression - Vérone Back Office Professional_
