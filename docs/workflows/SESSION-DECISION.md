# Checklist : Quelle Feature dans Quel Worktree ?

## Avant de commencer

```bash
./scripts/worktree-status.sh
```

## Règles de Décision

### PRIMARY (worktree principal)

✅ **Utiliser pour** :

- Features longues (>1 jour)
- Refactoring importants
- Migrations DB
- Auth/sécurité

❌ **Éviter pour** :

- Hotfix urgents
- Features <2h

### SECONDARY (worktree secondaire)

✅ **Utiliser pour** :

- Features courtes (<1 jour)
- Bug fixes
- Ajouts de features simples

❌ **Éviter pour** :

- Migrations DB (conflits types)

### REPO PRINCIPAL (3e session si urgent)

✅ **Utiliser pour** :

- Hotfix production ultra-urgents
- Fixes typos/docs
- Features 10-20 min

❌ **Éviter pour** :

- Features moyennes/longues
- Modifications multi-fichiers

## Exemples

| Feature          | Durée     | Assignment | Raison            |
| ---------------- | --------- | ---------- | ----------------- |
| Consolider RLS   | 2-3 jours | PRIMARY    | Longue + critique |
| Add order filter | 4h        | SECONDARY  | Courte + isolée   |
| Fix typo README  | 5 min     | REPO       | Ultra-rapide      |
| Auth timeout     | 1 jour    | PRIMARY    | Sécurité critique |
| Export PDF       | 6h        | SECONDARY  | Feature moyenne   |
