# ⚠️ RÈGLE ABSOLUE : JAMAIS de Co-Authored-By Claude

**Date** : 2025-12-12
**Importance** : CRITIQUE

## Règle

**INTERDICTION TOTALE** d'inclure dans les messages de commit :

```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

ou toute variante avec "Claude" comme co-auteur.

## Pourquoi

1. **Vercel rejette les commits** avec des co-auteurs qui n'ont pas accès au projet
2. L'email `noreply@anthropic.com` n'est pas un compte GitHub valide
3. Cela bloque les déploiements automatiques sur Vercel
4. L'utilisateur a perdu des heures à cause de ce problème

## Format de commit correct

```bash
git commit -m "$(cat <<'EOF'
type(scope): description

Details here...

🤖 Generated with Claude Code
EOF
)"
```

**NOTER** : On peut garder `🤖 Generated with Claude Code` mais **JAMAIS** la ligne `Co-Authored-By`.

## Commits à éviter

❌ INTERDIT :

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

✅ CORRECT :

```
🤖 Generated with Claude Code
```

ou simplement pas de mention du tout.

## Impact

Cette règle s'applique à TOUS les commits futurs sur ce projet.
