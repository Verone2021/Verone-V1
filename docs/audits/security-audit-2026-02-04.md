# Audit Sécurité Complet - 2026-02-04

## Résumé Exécutif

| Catégorie     | Critical | High | Medium | Low |
| ------------- | -------- | ---- | ------ | --- |
| RLS Supabase  | 0        | 3    | 15     | 0   |
| NPM Audit     | 1        | 4    | 6      | 0   |
| Code Patterns | 1        | 2    | 1      | 2   |

---

## 1. RLS Supabase (via `get_advisors`)

### ERRORS (3)

1. **[auth_users_exposed]** Vue `v_linkme_users` expose `auth.users` au rôle `anon`
   - **Sévérité** : HIGH
   - **Remédiation** : Restreindre l'accès ou supprimer la vue si inutilisée

2. **[security_definer_view]** Vue `linkme_selection_items_with_pricing` (SECURITY DEFINER)
   - **Sévérité** : HIGH
   - **Remédiation** : Convertir en SECURITY INVOKER ou ajouter RLS explicit

3. **[security_definer_view]** Vue `v_linkme_users` (SECURITY DEFINER)
   - **Sévérité** : HIGH
   - **Remédiation** : Idem

### WARNINGS (15 fonctions avec search_path mutable)

Toutes les fonctions `public.*` devraient avoir `SET search_path = ''` pour éviter les attaques de search path hijacking.

### Points positifs RLS

- **0 tables sans RLS** - Toutes les tables publiques ont RLS activé
- Fonctions helper `is_backoffice_user()` et `is_back_office_admin()` correctement définies avec SECURITY DEFINER
- Patterns RLS conformes à `.claude/rules/database/rls-patterns.md`

---

## 2. Dépendances NPM

### Critical (1)

| Package                          | Vulnérabilité                     | Fix                           |
| -------------------------------- | --------------------------------- | ----------------------------- |
| `@isaacs/brace-expansion` ≤5.0.0 | Uncontrolled Resource Consumption | ≥5.0.1 (transitive via madge) |

### High (4)

| Package                          | Vulnérabilité                            | Fix                                |
| -------------------------------- | ---------------------------------------- | ---------------------------------- |
| `next` ≥15.5.1-canary.0 <15.5.10 | HTTP request deserialization DoS via RSC | ≥15.5.10                           |
| `fast-xml-parser` ≥4.3.6 ≤5.3.3  | RangeError DoS (numeric entities)        | ≥5.3.4 (via @google-cloud/storage) |
| `jspdf` ≤4.0.0                   | PDF Injection (JS execution)             | ≥4.1.0                             |
| `jspdf` ≤4.0.0                   | DoS via unvalidated BMP dimensions       | ≥4.1.0                             |

### Actions recommandées

1. **`jspdf`** : `pnpm update jspdf` → version 4.1.0+
2. **`next`** : Vérifier version actuelle, mettre à jour si dans la plage vulnérable
3. **`@isaacs/brace-expansion`** : Transitive (madge dev dep), risque limité
4. **`fast-xml-parser`** : Transitive (@google-cloud/storage), attendre update upstream

---

## 3. Patterns Dangereux dans le Code

### Critical (1)

**innerHTML XSS** — `apps/back-office/src/lib/auth/session-config.ts` (L213, L269)

- Utilise `innerHTML` avec template literals
- **Remédiation** : Remplacer par `textContent` ou `createElement()`

### High (2)

1. **Mock API Keys réalistes** — `apps/back-office/.../integrations/page.tsx` (L80, L88)
   - Pattern `lm_live_sk_*` pourrait être confondu avec de vraies clés
   - **Remédiation** : Utiliser des valeurs évidemment fausses

2. **Validation Zod manquante** — Routes API avec validation manuelle
   - `apps/linkme/src/app/api/create-order/route.ts`
   - `apps/linkme/src/app/api/forms/submit/route.ts`
   - `apps/back-office/src/app/api/catalogue/products/route.ts`
   - **Remédiation** : Ajouter Zod schemas

### Points positifs

- **0 eval()** - Aucune instance trouvée
- **0 SQL injection** - Toutes les requêtes via Supabase client (paramétrisé)
- **0 secrets hardcodés** - Toutes les clés API via `process.env`
- **0 Function() constructor** - Pas de code generation
- **Sanitized logging** - Les corps de requête sont nettoyés avant logging
- **Auth admin server-only** - Tous les `supabase.auth.admin.*` dans des route handlers côté serveur

---

## Plan de Remédiation Priorisé

### Immédiat (Sprint courant)

1. [ ] Corriger `innerHTML` → `textContent/createElement` dans `session-config.ts`
2. [ ] Mettre à jour `jspdf` vers 4.1.0+
3. [ ] Remplacer mock API keys par valeurs évidemment fausses

### Court terme (2 semaines)

4. [ ] Ajouter Zod validation aux 3 routes API identifiées
5. [ ] Corriger vue `v_linkme_users` (restreindre accès anon)
6. [ ] Convertir vues SECURITY DEFINER en SECURITY INVOKER

### Moyen terme (1 mois)

7. [ ] Ajouter `SET search_path = ''` aux 15 fonctions
8. [ ] Mettre à jour `next` quand patch stable disponible
9. [ ] Auditer toutes les routes API pour couverture Zod 100%

---

**Auditeur** : Claude Code (automated)
**Prochaine revue** : 2026-03-04
