# Dev Report — [BO-COMPTA-001] Routes API comptabilité Welyb

**Date** : 2026-06-18
**Branche** : feat/BO-COMPTA-001-cloture-welyb
**Type-check** : PASS (`pnpm --filter @verone/back-office type-check`)

---

## Fichiers créés / modifiés

| Chemin                                                                 | Action                         |
| ---------------------------------------------------------------------- | ------------------------------ |
| `apps/back-office/src/app/api/finance/sync-qonto-attachments/route.ts` | Créé                           |
| `apps/back-office/src/app/api/finance/send-to-accountant/route.ts`     | Créé                           |
| `apps/back-office/.env.example`                                        | Modifié — 4 nouvelles clés ENV |

---

## Route 1 : POST /api/finance/sync-qonto-attachments

**But** : Rapatrier en local les pièces Qonto non encore stockées (`local_pdf_path IS NULL`).

**Logique** :

1. Auth `createServerClient` + `getUser()` → 401 si absent
2. Body optionnel validé par Zod : `{ year?, transactionIds? }`
3. Query Supabase : `bank_transactions` où `has_attachment=true AND local_pdf_path IS NULL`, filtré par année (`settled_at`) ou par IDs
4. Traitement en **série** (un par un) pour ne pas saturer l'API Qonto — pas de batching parallèle
5. Pour chaque tx : `QontoClient.getAttachmentUrl(attachment_ids[0])` → fetch PDF → upload `justificatifs/YYYY/MM/<attachmentId>.pdf` → UPDATE DB
6. Réponse : `{ processed, downloaded, failed, errors[] }`

**Idempotence** : les txs déjà en local (`local_pdf_path IS NOT NULL`) sont exclues par la query.

**Limite de sécurité** : `.limit(200)` par appel — empêche un scan massif accidentel.

**Pattern réutilisé** : logique identique à `storeAttachmentLocally()` dans `api/qonto/attachments/[id]/route.ts` mais en mode synchrone (retour de statut) plutôt que fire-and-forget.

---

## Route 2 : POST /api/finance/send-to-accountant

**But** : Préparer (dry-run par défaut) ou envoyer les pièces au comptable Welyb via Resend.

**Garde-fou double** :

```
confirmSend === true  AND  ACCOUNTANT_SEND_ENABLED === 'true'
```

Les deux conditions doivent être réunies. Sans l'une ou l'autre → dry-run systématique, aucun appel Resend, aucune écriture en base.

**Logique dry-run** (défaut) :

- Calcule les lots de 35 pièces max
- Retourne le plan : `{ dryRun: true, batches: [{ index, recipient, from, subject, attachmentCount, transactionIds }], totalPieces }`

**Logique envoi réel** (confirmSend=true + ENV activé) :

- Download de chaque PDF depuis bucket `justificatifs`
- Email Resend : texte brut intentionnellement sobre (Welyb OCR sensible aux templates HTML)
- Sujet : `Verone - Pieces Achats/Ventes YYYY (lot N/total)`
- INSERT `document_emails` pour traçabilité
- PATCH PostgREST direct pour `transferred_to_accountant_at/_by` (colonnes post-migration 20260618101000, types @verone/types non encore régénérés)

**Scope** : `achats` → side=debit → `WELYB_ACHATS_EMAIL` / `ventes` → side=credit → `WELYB_VENTES_EMAIL`

**Idempotence** : filtre `transferred_to_accountant_at IS NULL` via `.filter()` PostgREST (pas `.is()` qui lèverait une erreur TS sur colonne non typée).

---

## Décisions techniques

### Colonnes `transferred_to_accountant_*` non typées

La migration `20260618101000_bo_compta_001_accountant_transfer_tracking.sql` a ajouté ces colonnes mais `@verone/types/src/supabase.ts` n'a pas encore été régénéré.

- **Filtre query** : utilisation de `.filter('transferred_to_accountant_at', 'is', null)` — PostgREST accepte n'importe quelle colonne en string, pas de vérification TS stricte → zéro cast.
- **UPDATE** : passage par l'API REST PostgREST directement (`fetch(supabaseUrl/rest/v1/bank_transactions?id=in.(...)`) avec la service role key → zéro `as any`, zéro `@ts-ignore`.
- **Action à faire** : régénérer avec `pnpm run generate:types` dans la PR finale.

### Email sobre pour Welyb

Welyb fait de l'OCR sur les pièces jointes. Les logos et templates HTML riches sont parfois confondus avec des pièces à analyser. Email en `text` uniquement, pas de `html`, pas de logo Verone.

### Batching série pour Qonto

L'API Qonto a une limite de taux. Traitement en série (une transaction à la fois) dans `sync-qonto-attachments`. Si besoin de performances, un batch de 5 avec `Promise.allSettled` serait l'étape suivante — mais YAGNI pour l'instant.

---

## Points d'attention / TODO avant PR

1. **Régénérer les types** : `pnpm run generate:types` pour que `transferred_to_accountant_at/_by` apparaissent dans `@verone/types`. Le PATCH PostgREST direct pourra alors être remplacé par `.update()` typé.
2. **ACCOUNTANT_SEND_ENABLED** : configurer à `'true'` dans Vercel prod UNIQUEMENT quand Romeo valide les premiers dry-runs.
3. **UI à brancher** : aucun composant front n'appelle encore ces routes. Il faut créer un écran de cockpit Welyb (page `/finance/comptable` ou similaire) avec :
   - Bouton "Synchroniser les pièces Qonto" → appel `/api/finance/sync-qonto-attachments`
   - Sélecteur année + scope + prévisualisation dry-run → appel `/api/finance/send-to-accountant`
   - Confirmation avant envoi réel
4. **Limite 200/500** : les plafonds `.limit()` sont conservateurs. Adapter si le volume annuel dépasse.
5. **Resend API key** : s'assurer que `RESEND_API_KEY` est bien configuré pour le domaine `veronecollections.fr` dans Vercel.

---

## Non-régression

- Aucun fichier existant modifié (sauf `.env.example` — ajout pur).
- Les routes `api/qonto/*` sont inchangées (immuables).
- Les triggers stock ne sont pas touchés.
- Type-check PASS sur l'ensemble du back-office.
