# Plan de Correction : Architecture ACTIVE.md

**Date** : 2026-01-15
**Objectif** : Éliminer définitivement les conflits sur ACTIVE.md lors des cherry-picks

---

## 🔍 Problème Identifié

### Symptôme
- 59 conflits lors du cherry-pick de PR #37
- Chaque commit avec Task ID modifie `.claude/work/ACTIVE.md`
- Git ne peut pas fusionner automatiquement car les lignes changent constamment

### Cause Racine
**Architecture mono-fichier** :
```
.claude/work/ACTIVE.md (modifié par CHAQUE commit)
```

**Effet domino** :
1. Commit 1 : `ACTIVE.md` contient "- [ ] TASK-001"
2. Commit 2 : `ACTIVE.md` contient "- [x] TASK-001\n- [ ] TASK-002"
3. Cherry-pick Commit 2 sur main → CONFLIT (TASK-001 n'existe pas sur main)

### Pourquoi C'est un Anti-Pattern ?

**MongoDB, Kubernetes, React, etc. N'ONT JAMAIS ce problème car :**
- Ils utilisent 1 fichier par entité
- Exemple MongoDB : `src/mongo/db/query/plan_cache.cpp`, `src/mongo/db/query/plan_executor.cpp`, etc.
- Chaque commit touche SON fichier → 0 conflit lors des merges

---

## ✅ Solution : Architecture Multi-Fichiers

### Nouvelle Structure

```
.claude/work/
├── ACTIVE.md (INDEX généré automatiquement, lecture seule)
├── tasks/
│   ├── BO-WORK-001.md
│   ├── BO-WORK-002.md
│   ├── LM-ORD-003.md
│   ├── LM-ORD-004.md
│   └── ...
└── .taskrc (configuration)
```

### Format des Fichiers Task

**Exemple : `.claude/work/tasks/BO-WORK-001.md`**

```markdown
---
id: BO-WORK-001
title: Mise en place workflow Claude Code
status: completed
created: 2026-01-13
completed: 2026-01-13
commits:
  - 738dcc67
  - df2bbf09
priority: high
app: back-office
domain: workflow
---

## Description

Mise en place du workflow Claude Code avec ACTIVE.md comme source de vérité unique.

## Commits

- 738dcc67 : Création initiale
- df2bbf09 : Fix sync check

## Notes

Première tâche du système Task ID.
```

### Génération Automatique d'ACTIVE.md

**Script** : `.claude/scripts/generate-active.js`

```javascript
// Lit tous les fichiers dans tasks/
// Génère ACTIVE.md automatiquement
// Lancé par hook pre-commit ou manuellement

const fs = require('fs');
const path = require('path');

const tasksDir = '.claude/work/tasks';
const outputFile = '.claude/work/ACTIVE.md';

// Lire tous les fichiers .md dans tasks/
const taskFiles = fs.readdirSync(tasksDir)
  .filter(f => f.endsWith('.md'))
  .map(f => {
    const content = fs.readFileSync(path.join(tasksDir, f), 'utf8');
    // Parser YAML front matter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const yaml = match[1];
    const lines = yaml.split('\n');
    const task = {};

    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        task[key.trim()] = valueParts.join(':').trim();
      }
    });

    return task;
  })
  .filter(Boolean);

// Trier par date
taskFiles.sort((a, b) => new Date(b.created) - new Date(a.created));

// Générer ACTIVE.md
let output = `# Plan Actif\n\n`;
output += `**Dernière génération** : ${new Date().toISOString()}\n`;
output += `**Nombre de tâches** : ${taskFiles.length}\n\n`;

output += `## Tâches En Cours\n\n`;
taskFiles.filter(t => t.status === 'in_progress').forEach(t => {
  output += `- [ ] ${t.id} - ${t.title}\n`;
});

output += `\n## Tâches À Faire\n\n`;
taskFiles.filter(t => t.status === 'pending').forEach(t => {
  output += `- [ ] ${t.id} - ${t.title}\n`;
});

output += `\n## Tâches Complétées\n\n`;
taskFiles.filter(t => t.status === 'completed').forEach(t => {
  output += `- [x] ${t.id} - ${t.title}\n`;
});

fs.writeFileSync(outputFile, output);
console.log(`✅ ACTIVE.md généré avec ${taskFiles.length} tâches`);
```

---

## 🔧 Plan de Migration

### Étape 1 : Créer la Structure (5 min)

```bash
mkdir -p .claude/work/tasks

# Créer .taskrc (configuration)
cat > .claude/work/.taskrc << 'EOF'
# Configuration Task Management
task_dir=tasks
index_file=ACTIVE.md
auto_generate=true
EOF
```

### Étape 2 : Migrer ACTIVE.md Actuel (10 min)

**Script** : `.claude/scripts/migrate-active-to-tasks.js`

```javascript
// Lit ACTIVE.md actuel
// Extrait chaque tâche
// Crée un fichier par tâche dans tasks/

const fs = require('fs');

const activeContent = fs.readFileSync('.claude/work/ACTIVE.md', 'utf8');

// Regex pour extraire les tâches
const taskRegex = /- \[([ x])\] ([A-Z]{2}-[A-Z]+-\d+) (.+?)(?:\(([a-f0-9]+)\))?$/gm;

let match;
while ((match = taskRegex.exec(activeContent)) !== null) {
  const [, checked, taskId, title, commit] = match;
  const status = checked === 'x' ? 'completed' : 'pending';

  const [app, domain] = taskId.split('-');

  const taskContent = `---
id: ${taskId}
title: ${title}
status: ${status}
created: 2026-01-13
${status === 'completed' ? `completed: 2026-01-13` : ''}
${commit ? `commits:\n  - ${commit}` : ''}
app: ${app.toLowerCase()}
domain: ${domain.toLowerCase()}
---

## Description

${title}

${commit ? `## Commits\n\n- ${commit}` : ''}
`;

  fs.writeFileSync(`.claude/work/tasks/${taskId}.md`, taskContent);
  console.log(`✅ Créé ${taskId}.md`);
}

console.log('Migration terminée !');
```

### Étape 3 : Mettre à Jour plan-sync.js (10 min)

```javascript
// Au lieu de modifier ACTIVE.md directement
// Créer/mettre à jour le fichier task individuel
// Puis régénérer ACTIVE.md

// Nouveau comportement :
// 1. Détecter Task ID du dernier commit
// 2. Créer/mettre à jour .claude/work/tasks/TASK-ID.md
// 3. Lancer generate-active.js
// 4. Git add tasks/TASK-ID.md ACTIVE.md
```

### Étape 4 : Git Hook (5 min)

```bash
# .claude/hooks/pre-commit
#!/bin/bash

# Vérifier si des fichiers dans tasks/ ont changé
if git diff --cached --name-only | grep -q "^\.claude/work/tasks/"; then
  echo "🔄 Régénération automatique d'ACTIVE.md..."
  node .claude/scripts/generate-active.js
  git add .claude/work/ACTIVE.md
fi
```

---

## ✅ Résultat Attendu

### Avant (Architecture Actuelle)

```bash
# Chaque commit modifie ACTIVE.md
git log --oneline --name-only | grep ACTIVE.md | wc -l
# Résultat : 59 modifications

# Cherry-pick 195 commits → 59 conflits
```

### Après (Nouvelle Architecture)

```bash
# Chaque commit crée/modifie SON fichier task
# ACTIVE.md est généré automatiquement (jamais de conflit)

# Cherry-pick 195 commits → 0 conflit sur ACTIVE.md
```

---

## 🎯 Bénéfices Long Terme

1. **0 Conflit lors des cherry-picks** : Chaque task a son fichier
2. **Scalabilité** : 1000 tâches = 0 problème de performance
3. **Historique Git propre** : `git log tasks/BO-WORK-001.md` montre toute l'évolution
4. **Recherche facile** : `grep -r "middleware" tasks/` trouve toutes les tâches liées
5. **Parallélisation** : 2 développeurs peuvent créer des tâches simultanément sans conflit

---

## 📅 Quand Appliquer Cette Migration ?

**APRÈS le déploiement de PR #37** :

1. Aujourd'hui : Déployer avec Squash (Option A)
2. Demain : Appliquer cette migration
3. Durée : 30 min
4. Impact : 0 (changement interne uniquement)

---

## 📚 Références Industrie

**Projets utilisant cette architecture (1 fichier par entité)** :

- **Kubernetes** : `staging/src/k8s.io/apiserver/pkg/authentication/`
- **MongoDB** : `src/mongo/db/query/`
- **React** : `packages/react/src/`
- **Linux Kernel** : `drivers/`, `fs/`, etc.

**Aucun de ces projets n'a de conflits massifs lors des cherry-picks** car chaque changement est isolé.

---

**Prochaine étape** : Déployer maintenant avec Option A (Squash), puis appliquer cette migration.
