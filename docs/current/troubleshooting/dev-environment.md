# Guide de Dépannage - Environnement de Développement

**Dernière mise à jour**: 2026-01-14
**Auteur**: Claude Code

Ce guide vous aide à résoudre les problèmes courants de l'environnement de développement Vérone.

---

## 🚨 Problèmes Fréquents

### 1. Application ne démarre pas

**Symptômes**:
- `pnpm dev` ne lance pas l'application
- Port déjà utilisé
- Erreur "Cannot find module"

**Diagnostic rapide**:
```bash
pnpm env:validate
```

**Solutions par cause**:

#### Port déjà utilisé
```bash
# Voir quel processus utilise le port
lsof -iTCP:3000,3001,3002 -sTCP:LISTEN

# Arrêter proprement
pnpm dev:stop

# Ou forcer l'arrêt
lsof -ti:3000,3001,3002 | xargs kill -9
```

#### Symlinks cassés
```bash
# Symptôme: Cannot find module 'next'
# Solution:
pnpm install --force
```

#### Variables d'environnement manquantes
```bash
# Vérifier que .env.local existe
ls -la apps/*/\.env.local

# Si manquant, créer depuis .env.example
cp apps/back-office/.env.example apps/back-office/.env.local
# Éditer et remplir les valeurs
```

---

### 2. Variables d'environnement ignorées

**Symptômes**:
- Nouvelles variables non prises en compte
- Fonctionnalités ne s'activent pas
- Console: "undefined" pour NEXT_PUBLIC_*

**Cause**: Les variables d'environnement sont chargées au démarrage de Next.js. Si vous modifiez `.env.local` pendant que le serveur tourne, elles ne sont pas rechargées.

**Solution OBLIGATOIRE**:
```bash
# 1. Arrêter les serveurs
pnpm dev:stop

# 2. Redémarrer
pnpm dev

# OU en une commande avec nettoyage:
pnpm dev:clean
```

**Prévention**: Utilisez le git hook qui vous avertit automatiquement:
```bash
# Le hook est installé dans .git/hooks/pre-commit
# Il crée automatiquement un backup et vous rappelle de redémarrer
```

---

### 3. Symlink cassé (Next.js)

**Symptômes**:
```
Error: Cannot find module '/path/to/node_modules/next/dist/bin/next'
```

**Cause**:
- Installation pnpm interrompue
- Cache pnpm corrompu
- Changement de version de dépendance

**Solution**:
```bash
# Option 1: Réinstaller les dépendances
pnpm install --force

# Option 2: Nettoyer complètement
rm -rf node_modules .pnpm-store
pnpm install

# Option 3: Réparer le store pnpm
pnpm store prune
pnpm install
```

**Vérification**:
```bash
# Vérifier que les symlinks fonctionnent
ls -l apps/back-office/node_modules/next
ls -l apps/linkme/node_modules/next
ls -l apps/site-internet/node_modules/next
```

---

### 4. Build échoue (TypeScript)

**Symptômes**:
```
Failed to compile.
Type error: ...
```

**Solutions par erreur**:

#### "params" doit être Promise (Next.js 15)
```typescript
// ❌ AVANT (Next.js 14)
export default function Page({ params }: { params: { id: string } }) {
  console.log(params.id);
}

// ✅ APRÈS (Next.js 15 avec 'use client')
'use client';
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);
}
```

#### Type-check avant commit
```bash
# Toujours vérifier avant de commit
pnpm type-check

# Si erreurs, corriger puis
pnpm build
```

---

### 5. Hot Reload (HMR) ne fonctionne pas

**Symptômes**:
- Modifications du code non reflétées
- Besoin de refresh manuel
- Console: "WebSocket disconnected"

**Solutions**:
```bash
# 1. Redémarrer le serveur
pnpm dev:stop
pnpm dev

# 2. Nettoyer le cache
pnpm dev:clean

# 3. Vérifier que node_modules est bien dans .gitignore
echo "node_modules/" >> .gitignore
```

---

### 6. Console pleine d'erreurs

**Symptômes**:
- Erreurs Sentry non critiques
- Warnings Next.js DevTools
- Deprecation warnings

**Erreurs normales (non-bloquantes)**:
```
[@sentry/nextjs] Could not find `onRequestError` hook
→ Warning normal, Sentry fonctionne quand même

[@sentry/nextjs] DEPRECATION WARNING: rename sentry.client.config.ts
→ À faire plus tard, non urgent

[baseline-browser-mapping] Data over two months old
→ Cosmétique, non bloquant
```

**Erreurs critiques (BLOQUER)**:
```
Error: Cannot find module
Unhandled promise rejection
React error overlay rouge
```

---

## 🔧 Commandes Utiles

### Diagnostic
```bash
pnpm env:validate          # Valider l'environnement complet
pnpm type-check            # Vérifier TypeScript
lsof -iTCP:3000-3002       # Voir les ports utilisés
git status                 # État du repo
```

### Nettoyage
```bash
pnpm dev:stop              # Arrêter les serveurs
pnpm dev:clean             # Arrêter + nettoyer cache
rm -rf node_modules        # Supprimer node_modules (nucléaire)
```

### Redémarrage
```bash
pnpm dev                   # Démarrage normal
pnpm dev:safe              # Avec validation avant
pnpm dev:clean             # Nettoyage + démarrage
```

---

## 📋 Checklist de Dépannage

Si une app ne fonctionne pas, suivez cette checklist dans l'ordre:

- [ ] **Validation environnement**: `pnpm env:validate`
- [ ] **Arrêter les processus**: `pnpm dev:stop`
- [ ] **Nettoyer le cache**: `rm -rf apps/*/.next`
- [ ] **Vérifier .env.local**: Toutes les variables présentes?
- [ ] **Vérifier symlinks**: `ls -l apps/*/node_modules/next`
- [ ] **Réinstaller si besoin**: `pnpm install --force`
- [ ] **Redémarrer**: `pnpm dev`
- [ ] **Vérifier HTTP**: `curl localhost:3000`
- [ ] **Vérifier console**: 0 erreurs critiques?

---

## 🆘 Workflow de Secours

Si rien ne fonctionne, procédure nucléaire:

```bash
# 1. Sauvegarder les .env.local
cp apps/back-office/.env.local /tmp/back-office-env.backup
cp apps/linkme/.env.local /tmp/linkme-env.backup
cp apps/site-internet/.env.local /tmp/site-internet-env.backup

# 2. Tout supprimer
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf apps/*/.next
rm -rf .turbo

# 3. Nettoyer pnpm
pnpm store prune

# 4. Réinstaller
pnpm install

# 5. Restaurer .env.local
cp /tmp/back-office-env.backup apps/back-office/.env.local
cp /tmp/linkme-env.backup apps/linkme/.env.local
cp /tmp/site-internet-env.backup apps/site-internet/.env.local

# 6. Redémarrer
pnpm dev
```

---

## 💡 Bonnes Pratiques

### Avant de coder
1. **Valider l'environnement**: `pnpm env:validate`
2. **Vérifier la branche**: `git branch --show-current`
3. **Pull les dernières modifs**: `git pull`

### Après modification .env.local
1. **TOUJOURS redémarrer**: `pnpm dev:stop && pnpm dev`
2. Le git hook vous rappellera automatiquement

### Avant de commit
1. **Type-check**: `pnpm type-check`
2. **Build local**: `pnpm build` (optionnel mais recommandé)
3. **Vérifier les fichiers**: `git status`

### Quotidien
- Redémarrer les serveurs 1x/jour minimum
- Nettoyer le cache en cas de problème bizarre
- Ne jamais commit `.env.local`

---

## 📞 Support

Si le problème persiste:

1. **Vérifier les logs**: Les erreurs dans le terminal
2. **Reproduire**: Note les étapes exactes qui causent l'erreur
3. **Consulter**: `docs/current/` pour la documentation technique
4. **Demander**: À l'équipe ou dans le Slack technique

---

**Note**: Ce guide est un document vivant. Si vous rencontrez un problème non documenté, ajoutez-le ici après résolution.
