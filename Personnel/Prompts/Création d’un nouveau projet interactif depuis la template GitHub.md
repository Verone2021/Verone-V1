## 🎯 Prompt – Création d’un nouveau projet interactif depuis la template GitHub

**Objectif :**  
Créer un nouveau projet en local à partir du repository template `Verone2021/Template_dev` et publier automatiquement ce projet sur un nouveau repository GitHub.

**Instructions pour le MCP :**

1. **Demander le nom du projet** à l’utilisateur (exemple : `want-it-now-V1`).
2. Cloner le repository `https://github.com/Verone2021/Template_dev.git` en local.
3. Renommer le dossier cloné avec le nom du projet fourni.
4. Supprimer l’historique Git existant :  
rm -rf .git
5. Initialiser un nouveau dépôt Git :  
git init
6. Créer un **nouveau repository GitHub** avec ce nom, en utilisant mon token GitHub :  
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
gh repo create <nom-du-projet> --private --source=. --remote=origin
7. Faire le commit initial :  
git add .
git commit -m "Initial commit from template"
8. Pousser vers le nouveau repository :  
git branch -M main
git push -u origin main
9. Confirmer à la fin que :  
- Le projet local est prêt à être utilisé.  
- L’URL du nouveau repository GitHub est bien créée et accessible.

**Contraintes :**
- Ne pas modifier le contenu de la template.
- Le processus doit fonctionner quel que soit le nom de projet choisi.
- Si le nom de projet existe déjà sur GitHub, demander à l’utilisateur un autre nom.

**Résultat attendu :**
- Un dossier local avec le nom du projet.  
- Un repository GitHub privé contenant le même contenu que la template.