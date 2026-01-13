# Règle OBLIGATOIRE : Authentification Playwright

## TOUJOURS passer par la page de connexion

Lors des tests avec Playwright (MCP browser lane-1 ou lane-2) sur LinkMe :

1. **TOUJOURS** naviguer vers `http://localhost:3002/login` EN PREMIER
2. **TOUJOURS** s'authentifier avec les identifiants Pokawa :
   - Email: `pokawa-test@verone.io`
   - Password: `music-test-2025`
3. **JAMAIS** aller directement sur une page protégée sans authentification préalable

## Séquence obligatoire

```
1. browser_navigate → http://localhost:3002/login
2. Attendre le formulaire de connexion
3. Remplir email + password
4. Cliquer sur "Se connecter"
5. Attendre la redirection vers /dashboard
6. ENSUITE seulement naviguer vers la page cible
```

## Pourquoi ?

- Les sessions Playwright ne persistent pas entre les sessions
- Sans authentification, les pages protégées retournent des erreurs 500
- L'utilisateur veut voir le flux complet de connexion

---

Mis à jour: 2026-01-10
