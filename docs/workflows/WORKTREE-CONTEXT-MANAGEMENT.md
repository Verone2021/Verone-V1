# Gestion du Contexte Worktree - Pratiques Pro

## Problème Résolu

**Erreur fréquente** : Commit accidentel sur `main` depuis le repo principal alors qu'on travaille dans un worktree.

**Symptômes** :

- Claude/AI commit sur `main` au lieu de `work/secondary`
- Perte de contexte du worktree actif
- Refactoring git manuel (reset, stash, re-commit)

---

## Solution 1 : Hooks Bloquants (AUTOMATIQUE)

### Fichiers installés

1. **`.husky/worktree-guard.sh`** - Script de validation
2. **`.husky/pre-commit`** - Appelle worktree-guard AVANT tout
3. **`.husky/pre-push`** - Bloque push vers main depuis worktree

### Comportement

```bash
# Dans MAIN REPO sur branch main
git commit -m "test"
# ❌ BLOQUÉ: "Cannot commit on main branch"

# Dans SECONDARY sur work/secondary
git commit -m "test"
# ✅ AUTORISÉ

# Dans SECONDARY sur main (erreur)
git checkout main
git commit -m "test"
# ❌ BLOQUÉ: "Wrong branch for worktree"
```

### Règles appliquées

| Location  | Branch Allowed   | Action     |
| --------- | ---------------- | ---------- |
| MAIN REPO | `main`           | ❌ BLOCKED |
| MAIN REPO | `feat/*`         | ✅ ALLOWED |
| PRIMARY   | `work/primary`   | ✅ ALLOWED |
| PRIMARY   | autre            | ❌ BLOCKED |
| SECONDARY | `work/secondary` | ✅ ALLOWED |
| SECONDARY | autre            | ❌ BLOCKED |

---

## Solution 2 : Affichage Contexte (VISUEL)

### Script `worktree-context-display.sh`

```bash
# Afficher contexte actuel
bash scripts/worktree-context-display.sh
# Output: 📍 SECONDARY [work/secondary]
```

### Intégration Prompt Shell (Recommandé)

Ajouter à `~/.zshrc` ou `~/.bashrc` :

```bash
# Worktree context in prompt
export PS1='$(bash ~/verone-back-office-V1/scripts/worktree-context-display.sh) $ '
```

**Résultat** :

```
📍 SECONDARY [work/secondary] $ git commit -m "fix"
📍 PRIMARY [work/primary] $ git push
📍 MAIN REPO [feat/ABC-123] $ git status
```

---

## Solution 3 : Fichier `.worktree-context` (RAPPEL)

Créer à la racine de chaque worktree :

```bash
# Dans SECONDARY
echo "SECONDARY - work/secondary" > /Users/romeodossantos/verone-worktrees/SECONDARY/.worktree-context

# Dans PRIMARY
echo "PRIMARY - work/primary" > /Users/romeodossantos/verone-worktrees/PRIMARY/.worktree-context
```

**Utilisation** :

```bash
cat .worktree-context  # Avant chaque session
# Output: SECONDARY - work/secondary
```

---

## Pratiques Développeurs Seniors

### 1. **Tmux/Terminal avec Labels**

```bash
# Terminal 1: Label "PRIMARY"
tmux new-session -s primary
cd /Users/romeodossantos/verone-worktrees/PRIMARY

# Terminal 2: Label "SECONDARY"
tmux new-session -s secondary
cd /Users/romeodossantos/verone-worktrees/SECONDARY
```

### 2. **VSCode Workspaces Séparés**

```json
// primary.code-workspace
{
  "folders": [{"path": "/Users/romeodossantos/verone-worktrees/PRIMARY"}],
  "settings": {
    "window.title": "🔵 PRIMARY - ${activeEditorShort}"
  }
}

// secondary.code-workspace
{
  "folders": [{"path": "/Users/romeodossantos/verone-worktrees/SECONDARY"}],
  "settings": {
    "window.title": "🟢 SECONDARY - ${activeEditorShort}"
  }
}
```

### 3. **Aliases Bash/Zsh**

```bash
# ~/.zshrc
alias goto-primary='cd /Users/romeodossantos/verone-worktrees/PRIMARY'
alias goto-secondary='cd /Users/romeodossantos/verone-worktrees/SECONDARY'
alias goto-main='cd /Users/romeodossantos/verone-back-office-V1'

# Afficher contexte
alias wtree='bash scripts/worktree-context-display.sh'
```

### 4. **Git Config par Worktree**

```bash
# Dans SECONDARY/.git/config
[user]
  name = "Romeo - SECONDARY"
  email = "romeo+secondary@verone.com"

# Commits signés avec identité claire
```

---

## Claude Code / AI Best Practices

### Rappel Contexte au Début de Session

**Pattern obligatoire** pour Claude :

```markdown
1. Vérifier pwd : `pwd`
2. Vérifier worktree : `bash scripts/worktree-context-display.sh`
3. Vérifier branch : `git branch --show-current`

→ Si SECONDARY : JAMAIS cd vers MAIN REPO
→ Si PRIMARY : JAMAIS cd vers SECONDARY
→ Rester dans le worktree actif TOUTE la session
```

### Memory Persistante

Ajouter à `MEMORY.md` :

```markdown
## Session Context (AUTO-UPDATE)

- Worktree actif : SECONDARY
- Branch : work/secondary
- INTERDICTION : cd /Users/romeodossantos/verone-back-office-V1
```

---

## Troubleshooting

### Erreur : "Hook blocked but should be allowed"

```bash
# Vérifier worktree paths dans worktree-guard.sh
bash .husky/worktree-guard.sh
# Debug output
```

### Erreur : "Hook not running"

```bash
# Réinstaller husky
pnpm husky install
chmod +x .husky/worktree-guard.sh
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

---

## Checklist Post-Installation

- [ ] Hook bloque commit sur `main` dans MAIN REPO
- [ ] Hook autorise commit sur `work/secondary` dans SECONDARY
- [ ] Hook autorise commit sur `work/primary` dans PRIMARY
- [ ] Script `worktree-context-display.sh` affiche contexte correct
- [ ] Prompt shell affiche contexte (optionnel mais recommandé)
- [ ] Fichier `.worktree-context` créé dans chaque worktree
- [ ] Documentation lue et comprise par toute l'équipe

---

## Références

- **Trunk-Based Development** : https://trunkbaseddevelopment.com/
- **Git Worktree Documentation** : https://git-scm.com/docs/git-worktree
- **Husky Hooks** : https://typicode.github.io/husky/
