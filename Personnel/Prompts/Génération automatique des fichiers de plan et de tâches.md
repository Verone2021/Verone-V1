Prompt MCP – Génération automatique des fichiers de plan et de tâches

🎯 Objectif :  
À partir du fichier `tasks/project-overview.md`, analyse le contenu et crée automatiquement :  
1. `tasks/projectplan.md` — plan détaillé par phases  
2. `tasks/todo.md` — liste de tâches organisées et prêtes à être cochées.

---

📄 **Règles de création :**

### 1️⃣ projectplan.md
- Découpe le projet en **phases logiques** (préparation, développement, tests, déploiement).
- Dans chaque phase :
  - Détailler les actions importantes
  - Préciser les livrables
- Ajouter un tableau **Planning indicatif** avec semaines et objectifs.
- Inclure un rappel de la stack technique et des dépendances.

### 2️⃣ todo.md
- Lister toutes les tâches issues du `project-overview.md` et du `projectplan.md`.
- Classer en trois sections :
  - 📌 **Tâches en cours**
  - ✅ **Tâches terminées**
  - 🔄 **Prochaines étapes**
- Chaque tâche doit être **cochable** avec `[ ]` ou `[x]`.

---

⚠️ **Contraintes** :
- Ne jamais supprimer ou écraser du contenu existant dans les fichiers, mais toujours **fusionner intelligemment**.
- Conserver le style Markdown clair et structuré.
- Utiliser des sections et des titres clairs avec emojis pour repérage rapide.

---

💡 **Exemple d’utilisation** :
1. Tu remplis `tasks/project-overview.md` avec le contexte et les grandes lignes.
2. Tu exécutes ce prompt.
3. Claude génère automatiquement `tasks/projectplan.md` et `tasks/todo.md` prêts à l’emploi.
