# Règles Build & Type-Check (CRITIQUE)

## RÈGLE ABSOLUE : TOUJOURS Filtrer les Builds

**INTERDICTION TOTALE de builder tous les projets quand on travaille sur un seul.**

### ❌ INTERDIT

```bash
pnpm build          # Build 31 packages (3-5 minutes)
pnpm type-check     # Type-check 31 packages (1-2 minutes)
turbo build         # Idem, build tout
```

### ✅ OBLIGATOIRE

**Toujours filtrer sur le package concerné :**

```bash
# Back-office
pnpm --filter @verone/back-office build
pnpm --filter @verone/back-office type-check

# LinkMe
pnpm --filter @verone/linkme build
pnpm --filter @verone/linkme type-check

# Site Internet
pnpm --filter @verone/site-internet build
pnpm --filter @verone/site-internet type-check

# Package spécifique
pnpm --filter @verone/organisations type-check
pnpm --filter @verone/customers build
```

### Avec Turbo

```bash
turbo build --filter=@verone/back-office
turbo type-check --filter=@verone/linkme
```

## Pourquoi cette règle est ABSOLUE

1. **Temps perdu** : Build complet = 3-5 minutes vs build filtré = 30-60 secondes
2. **Ressources gaspillées** : CPU, RAM, batterie
3. **Frustration utilisateur** : L'utilisateur attend inutilement
4. **Pas pertinent** : On ne touche qu'un projet à la fois

## Quand builder tous les projets ?

**UNIQUEMENT** dans ces cas :

1. **PR finale** : Vérifier que TOUT compile avant merge
2. **Changement transversal** : Modification dans `@verone/types` ou `@verone/ui`
3. **Demande explicite** : L'utilisateur demande "build tout"

**Sinon : TOUJOURS filtrer.**

## Checklist Avant Build

Avant de lancer un build/type-check :

- [ ] Quel package ai-je modifié ? (back-office, linkme, site-internet, etc.)
- [ ] Utiliser `--filter @verone/[package]`
- [ ] NE PAS lancer `pnpm build` global

## Exceptions

Aucune. Cette règle est absolue pour éviter de faire perdre du temps à l'utilisateur.
