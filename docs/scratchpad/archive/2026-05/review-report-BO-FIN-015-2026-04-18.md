Verdict : PASS

# Review Report — BO-FIN-015 — 2026-04-18

(PASS WITH WARNINGS — warnings pre-existants, non bloquants. Detail en fin de rapport.)

Branch : fix/BO-FIN-015-fake-uuid-service-route
Commit : d626ba6b5
Perimetre annonce : 1 fichier de code

---

## Verdict : PASS WITH WARNINGS

Aucun CRITICAL. Le fix est correct sur les points structurants (placement 401, pattern auth, FK respectee, zero backfill necessaire). Deux WARNING pre-existants que ce sprint n'a pas introduits mais n'a pas corrigés non plus.

---

## Points valides

1. **Check 401 placement** — ligne 107-120. Le `getUser()` est appelé AVANT `createAdminClient()` (l. 124), AVANT toute lecture Supabase (l. 130+), AVANT tout appel Qonto (l. 248+). Aucune operation destructive ne precede le guard. Correct.

2. **Pattern auth aligne avec route standard** — `createServerClient()` puis `supabaseAuth.auth.getUser()` identique aux lignes 781-784 de `route.ts`. Seule divergence intentionnelle et justifiee : la route standard fait `authUser?.id ?? null` (tolerant), la route service fait un hard 401 (strict). Le comportement strict est plus sur pour une FK NOT NULL — acceptable.

3. **FK financial_documents.created_by** — colonne `NOT NULL uuid`. Query DB confirme 0 ligne avec `created_by = '00000000-0000-0000-0000-000000000000'`. Aucun backfill necessaire.

4. **Zero `any`, zero `@ts-ignore`, zero `eslint-disable`** dans le diff. Le cast ligne 71 (`as IPostRequestBody`) et ligne 412 (`as { details: unknown }`) sont pre-existants et hors perimetre de ce sprint.

5. **Zero promesse flottante** dans le code ajoute. Les `await` sont presents sur `createServerClient()` et `supabaseAuth.auth.getUser()`.

6. **Perimetre strict respecte** — 2 fichiers modifies : `service/route.ts` (code) + `INDEX-BACK-OFFICE-APP.md` (timestamp auto-genere). Aucune autre route Qonto touchee.

---

## WARNING — service/route.ts:71 — Body parse sans validation Zod

**Probleme** : `const body = (await request.json()) as IPostRequestBody` est un cast TypeScript sans validation runtime. Un body malformed (ex: `items[0].unitPrice = "abc"`) passe le typecheck et provoque un NaN silencieux dans les calculs de total (l. 349-357). Ce n'est pas introduit par ce sprint mais c'est une violation de la regle "Validation Zod sur tous les inputs API".

**Fix** : Remplacer le cast par un `z.parse()` avec un schema Zod couvrant `clientId` (uuid), `clientType` (enum), `items` (array avec unitPrice number, quantity number, vatRate number). Sprint separe recommande.

---

## WARNING — service/route.ts:132,155 — select('\*') sans explicit columns

**Probleme** : Les requetes `.select('*').eq('id', clientId).single()` (lignes 132 et 155) utilisent un wildcard. Bien que `.single()` limite a 1 ligne, la regle du projet interdit `select('*')` sans select explicite. Pre-existant, hors diff.

**Fix** : Remplacer par un select explicite des colonnes effectivement consommees dans la suite du handler. Sprint separe.

---

## INFO — service/route.ts:429 — Fichier a 429 lignes

**Note** : Le fichier depasse la limite de 400 lignes du standard projet. Ce sprint n'a ajoute que 16 lignes (le fix auth), donc la violation etait pre-existante. A refactoriser lors d'un sprint dedié.

---

## Autorisation PR

Le fix BO-FIN-015 est autorise a merger vers staging. Les deux WARNING et l'INFO sont pre-existants et doivent faire l'objet de tickets separes, pas d'un blocage de cette PR.
