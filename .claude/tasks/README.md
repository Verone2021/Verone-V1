# 📋 Claude Tasks - Vérone Back Office

> Dossier pour les rapports de tâches individuelles selon les meilleures pratiques Anthropic

## 🎯 Organisation des Tâches

### **Structure Recommandée**

```
.claude/tasks/
├── README.md                           # Ce fichier
├── YYYY-MM-DD-task-name.md            # Rapports tâches individuelles
└── templates/
    ├── task-report-template.md         # Template standard
    └── bug-fix-template.md             # Template correction bugs
```

### **Types de Rapports**

- **Tâches de développement** : Implémentation features, corrections bugs
- **Analyses techniques** : Investigations, diagnostics, optimisations
- **Configurations système** : Setup tools, environnements, déploiements
- **Tests et validations** : Rapports tests E2E, performance, sécurité

## 📊 Différence avec `manifests/process-learnings/`

### **`.claude/tasks/` (Nouveau)**

- ✅ **Tâches individuelles** spécifiques et courtes
- ✅ **Actions ponctuelles** avec résultats immédiats
- ✅ **Debugging sessions** et troubleshooting
- ✅ **Configuration changes** et setup tools

### **`manifests/process-learnings/`**

- ✅ **Sessions complètes** multi-phases
- ✅ **Retours d'expérience** métier et technique
- ✅ **Décisions architecturales** importantes
- ✅ **Learning outcomes** et best practices

## 🔄 Workflow Recommandé

1. **Début tâche** → Créer fichier `.claude/tasks/YYYY-MM-DD-task-name.md`
2. **Pendant exécution** → Documenter actions et résultats
3. **Fin tâche** → Compléter avec outcomes et next steps
4. **Si session complexe** → Synthèse dans `manifests/process-learnings/`

## 📝 Template Standard

```markdown
# Task: [Nom de la tâche]

**Date**: YYYY-MM-DD
**Type**: [Development/Bug Fix/Configuration/Analysis]
**Durée**: [Temps estimé/réel]

## 🎯 Objectif

[Description claire de ce qui doit être accompli]

## 📋 Actions Réalisées

- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

## 🔧 Changements Techniques

### Fichiers Modifiés

- `path/to/file.ts` - [Description modification]

### Nouvelles Fonctionnalités

- [Liste des fonctionnalités ajoutées]

## 📊 Résultats

### ✅ Succès

- [Points positifs]

### ❌ Problèmes Rencontrés

- [Difficultés et solutions]

## 🔄 Next Steps

- [Actions de suivi nécessaires]

---

_Rapport généré avec Claude Code_
```

---

**Cette structure optimise le suivi des tâches individuelles selon les standards Anthropic pour une meilleure traçabilité et organisation.**
