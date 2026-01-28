# Règles Serveurs de Développement

## Ports Assignés (NE PAS CHANGER)

| Application | Port |
|-------------|------|
| back-office | 3000 |
| site-internet | 3001 |
| linkme | 3002 |

## Qui Peut Lancer les Serveurs ?

### RÈGLE STRICTE

**SEUL L'UTILISATEUR peut lancer les serveurs de développement.**

Claude **NE DOIT JAMAIS** exécuter:
- `pnpm dev`
- `turbo dev`
- `npm run dev`
- `next dev`
- Toute commande démarrant des serveurs

### Pourquoi ?

Lancer plusieurs instances simultanées cause:
- Conflits de ports (3000-3002)
- Caches corrompus (.turbo, .next)
- Processus zombies (daemon Turbo)
- État incohérent du build

### Que Doit Faire Claude ?

Si les serveurs doivent être relancés:
1. **Informer l'utilisateur** qu'un redémarrage est nécessaire
2. **Proposer les commandes** à exécuter (utilisateur les lance)
3. **NE JAMAIS exécuter automatiquement**

### Exceptions

Aucune. Cette règle est absolue.

### Scripts Recommandés

Utiliser les scripts existants pour un workflow sécurisé:

```bash
pnpm dev:stop   # Arrête serveurs + libère ports (scripts/dev-stop.sh)
pnpm dev:clean  # Stop + nettoie caches + relance (scripts/dev-clean.sh)
pnpm dev:safe   # Valide env + démarre (scripts/validate-env.sh)
```

**Workflow quotidien recommandé:**
```bash
pnpm dev:safe   # Toujours utiliser en priorité (vérifie ports avant)
```

## Gestion des conflits de port

### Interdit

- Laisser Next.js utiliser un port alternatif (ex: 3005)
- Forcer un autre port avec `-p XXXX`
- Lancer plusieurs instances sur differents ports

### Obligatoire

Quand un port est occupe :

1. **Option 1** : Demander a l'utilisateur de tuer les processus existants
   ```bash
   pkill -f "next dev"
   # ou
   lsof -ti:3000 | xargs kill -9
   ```

2. **Option 2** : Proposer un rebuild (si le port est occupe par une session stale)
   ```bash
   pnpm build
   ```

3. **JAMAIS** : Ne jamais accepter silencieusement un port alternatif

## Commande pour relancer proprement

```bash
# Tuer tous les serveurs Next.js
pkill -f "next dev"

# Attendre 2 secondes
sleep 2

# Relancer
pnpm dev
```
