# Protection Main - Approche Simplifiée (2026-01-21)

## Philosophie : Protection contre accidents, PAS sur-complexification

**Principe** : Protéger contre les erreurs accidentelles, mais permettre les actions intentionnelles.

---

## ✅ Protections ACTIVES (2 hooks seulement)

### 1. Hook: `git commit` sur main

**Objectif** : Empêcher commit ACCIDENTEL sur main

**Code** :
```json
{
  "matcher": "Bash(git commit*)",
  "hooks": [{
    "command": "bash -c 'BRANCH=$(git branch --show-current); if [ \"$BRANCH\" = \"main\" ] || [ \"$BRANCH\" = \"master\" ]; then echo \"❌ INTERDIT de commit sur main. Créer une feature branch: git checkout -b feat/XXX\"; exit 1; fi; ...'"
  }]
}
```

**Effet** :
- ❌ BLOQUE : `git commit -m "..."` si sur branche main
- ✅ FORCE : Créer une feature branch d'abord

**Cas d'usage** : Éviter que Claude ou un développeur committe accidentellement sur main

---

### 2. Hook: `git push origin main`

**Objectif** : Empêcher push ACCIDENTEL sur main

**Code** :
```json
{
  "matcher": "Bash(git push*main*)",
  "hooks": [{
    "command": "bash -c 'if echo \"$TOOL_INPUT\" | grep -qE \"origin (main|master)\"; then echo \"❌ INTERDIT: Push direct sur main. Créer une PR\"; exit 1; fi'"
  }]
}
```

**Effet** :
- ❌ BLOQUE : `git push origin main`
- ❌ BLOQUE : `git push origin feat/xxx:main`
- ✅ FORCE : Passer par une Pull Request

**Cas d'usage** : Éviter bypass de PR en poussant directement sur main

---

## 🤝 Workflow PR : Confiance + Documentation

### Principe

**PAS de hooks bloquants pour `gh pr create` ou `gh pr merge`**

**Pourquoi ?**
- L'utilisateur peut demander explicitement "crée une PR" ou "merge sur main"
- Pas besoin de friction supplémentaire
- La confiance + documentation MANUAL_MODE.md suffisent

### Comportement Claude

#### Création PR (MANUAL_MODE.md)

**Recommandé** (mais pas bloqué techniquement) :
```
Claude: "J'ai terminé l'implémentation. Tous les checks passent.
Veux-tu que je crée une Pull Request ?"

Utilisateur: "oui" ou "crée la PR"

Claude: [Exécute gh pr create]
```

**Si user demande directement** : "crée une PR maintenant"
```
Claude: [Exécute gh pr create directement]
```
✅ Pas de blocage, pas de friction

#### Merge PR (MANUAL_MODE.md)

**Si user dit** : "merge sur main" ou "merge la PR"
```
Claude: [Vérifie que PR est prête]
Claude: [Exécute gh pr merge]
```
✅ Action directe, pas de friction

---

## 🎯 Matrice Protection Simplifiée

| Action | Protection | Raison |
|--------|-----------|--------|
| `git commit` sur main | ❌ BLOQUÉ (hook) | Prévenir accidents |
| `git push origin main` | ❌ BLOQUÉ (hook) | Prévenir bypass PR |
| `gh pr create` | ✅ PERMIS | Confiance + docs suffit |
| `gh pr merge` | ✅ PERMIS | Confiance + docs suffit |
| Push via GitHub UI | ❌ BLOQUÉ (GitHub Required PR) | Prévenir bypass PR |

**Légende** :
- ❌ BLOQUÉ = Protection technique (hook ou GitHub)
- ✅ PERMIS = Pas de blocage, basé sur confiance

---

## 📋 Cas d'Usage Réels

### Cas 1 : Développement Standard

```bash
# Claude autonome (pas de friction)
git checkout -b feat/APP-XXX-001-description
git commit -m "[APP-XXX-001] feat: ..."
git push origin feat/APP-XXX-001-description

# User demande
User: "crée une PR"
Claude: [Exécute gh pr create] ✅ Direct, pas de friction
```

### Cas 2 : User Veut Merger Rapidement

```bash
User: "merge sur main"
Claude: [Vérifie PR prête]
Claude: [Exécute gh pr merge] ✅ Direct, pas de friction
```

### Cas 3 : Tentative Accident sur Main

```bash
# Si Claude essaie accidentellement
git checkout main
git commit -m "test"
# ❌ BLOQUÉ par hook : "INTERDIT de commit sur main"
```

---

## 🛡️ Protection GitHub (Layer 2)

**Required PR Reviews** : ✅ ACTIF

**Effet** :
- Impossible de push direct sur main (même via GitHub UI)
- Requiert 1 approbation minimum
- Force passage par PR

**Important** : Cette protection GitHub reste active comme filet de sécurité, mais n'affecte PAS le workflow quotidien de Claude car il passe par PR de toute façon.

---

## 📚 Documentation Associée

1. **MANUAL_MODE.md** - Workflow professionnel (recommandations)
2. **Ce document** - Protection simplifiée (technique)

---

## 🎯 Résumé

**Protection technique** : 2 hooks seulement
- ❌ Empêcher commit sur main
- ❌ Empêcher push sur main

**Workflow PR** : Confiance + documentation
- ✅ Claude PEUT créer PR quand demandé
- ✅ Claude PEUT merger PR quand demandé
- 📋 MANUAL_MODE.md guide les bonnes pratiques

**Philosophie** :
> "Protéger contre les accidents, pas complexifier les actions intentionnelles"

---

**Version** : 2.0.0 (Simplifiée)
**Date** : 2026-01-21
**Auteur** : Romeo + Claude Sonnet 4.5
