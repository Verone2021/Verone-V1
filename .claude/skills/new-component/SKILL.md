---
name: new-component
description: Template creation composant React avec structure dossier standard Verone. Garantit coherence avec le design system existant.
---

# New Component — Template Standard

**Quand utiliser** : Creation d'un nouveau composant React (page, section, modal, formulaire).

## CRITICAL : Triple Lecture

Avant de creer quoi que ce soit, lire **3 composants similaires existants** pour respecter les patterns.

Exemples de recherche :

```bash
# Trouver des composants similaires
Glob "apps/[app]/src/**/*[NomSimilaire]*.tsx"
Grep "function [NomSimilaire]" --type ts
```

## Structure dossier standard

### Composant simple (< 200 lignes)

```
MonComposant.tsx          # Composant unique
```

### Composant complexe (> 200 lignes previsibles)

```
mon-composant/
├── index.tsx              # Export + orchestration (< 50 lignes)
├── MonComposantHeader.tsx  # Sous-composant header
├── MonComposantContent.tsx # Sous-composant contenu
├── MonComposantActions.tsx # Sous-composant actions
├── hooks.ts               # Logique metier (React Query, mutations)
└── types.ts               # Types locaux
```

## Template composant

```typescript
'use client';

import { useState } from 'react';
// Imports @verone/* en premier, puis imports locaux
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';

interface MonComposantProps {
  // Props typees explicitement, jamais de `any`
}

export function MonComposant({ }: MonComposantProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Titre</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Contenu */}
      </CardContent>
    </Card>
  );
}
```

## Template hook React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@verone/utils/supabase';

export function useMonDomaine() {
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: ['mon-domaine'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ma_table')
        .select('id, name, created_at') // JAMAIS select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
```

## Regles

- **Fichier > 400 lignes** = refactoring obligatoire (decomposer)
- **Composant > 200 lignes** = extraire sous-composants
- **JAMAIS** de `any` TypeScript — `unknown` + validation Zod
- **JAMAIS** de `select('*')` sans limit
- **Imports** : `@verone/*` avant `@/` avant imports relatifs
- **Nommage** : PascalCase composants, camelCase hooks, kebab-case fichiers dossiers
- Utiliser les composants `@verone/ui` existants (Card, Dialog, Table, Button, etc.)
- Toujours `'use client'` si le composant utilise des hooks React
