# PLAN DE REPRISE — [BO-COMPTA-003] Débloquer le flux comptable 2025

> **Fichier de reprise durable.** Si la session tombe, une nouvelle session DOIT
> lire ce fichier + `dev-report-2026-06-26-BO-COMPTA-audit-transfert-2025.md` et reprendre
> à l'étape non cochée. Branche : `feat/BO-COMPTA-001-cloture-welyb`. Autorisation Roméo
> donnée le 2026-06-27 (inclut la modif d'une route `/api/qonto/*` protégée).

## Objectif

Lever les 2 blocages identifiés à l'audit du 2026-06-26 pour que Roméo puisse, depuis
localhost, (1) envoyer réellement au comptable Welyb depuis l'écran, et (2) qu'un dépôt de
pièce crée le rapprochement immédiatement (pièce devient « présente » + envoyable sans étape
de synchro en plus).

## Contexte vérifié (faits)

- Welyb fonctionne (facture RESB bien arrivée — fausse alerte précédente). NE PAS réinitialiser
  `transferred_to_accountant_at` du RESB (`30869166-…`).
- `has_attachment` = colonne **GENERATED** depuis `raw_data->'attachments'` OU
  `raw_data->'attachment_ids'` (PAS depuis la colonne `attachment_ids`).
- Route d'envoi `POST /api/finance/send-to-accountant` : envoi réel uniquement si
  `ACCOUNTANT_SEND_ENABLED==='true'` (serveur) ET `confirmSend===true` (body). Réponses :
  - dry-run → `DryRunResponse { dryRun:true, batches, totalPieces, scope, year }`
  - réel → `SendResult { dryRun:false, batchesSent, piecesSent, piecesAlreadyTransferred, errors[] }`
- Bouton « Confirmer l'envoi » désactivé en dur dans `welyb-plan-dialog.tsx:110-116`.
- Dépôt `POST /api/qonto/attachments/upload` : écrit la colonne `attachment_ids` SEULEMENT
  (pas `raw_data`, pas `local_pdf_path`) → pièce reste « manquante » + non envoyable.
- Volumes 2025 : achats 37 prêtes / 145 à chercher / 8 via sync ; ventes 0 prêtes / 61 à chercher.

---

## FIX 1 — Envoi réel depuis l'écran (GAP 1)

### 1a. Route `apps/back-office/src/app/api/finance/send-to-accountant/route.ts`

- [ ] Ajouter `sendAllowed: boolean;` à l'interface `DryRunResponse` (l.76-82).
- [ ] Dans la réponse dry-run principale (l.306-313) ajouter
      `sendAllowed: process.env.ACCOUNTANT_SEND_ENABLED === 'true'`.
- [ ] Dans le early-return « 0 pièce éligible » (l.265-274) ajouter aussi `sendAllowed: …`.
- Aucune autre logique à toucher (l'envoi réel existe déjà).

### 1b. Types `apps/back-office/src/app/(protected)/finance/_shared-comptable/types.ts`

- [ ] `WelybDryRunResponse` : ajouter `sendAllowed?: boolean;`.
- [ ] Ajouter `WelybSendResult { dryRun:false; batchesSent:number; piecesSent:number; piecesAlreadyTransferred:number; errors:Array<{batchIndex:number;reason:string}> }`.

### 1c. `_shared-comptable/cloture-global-actions.tsx`

- [ ] State : `welybScope: 'achats'|'ventes'|null` + `welybSending: boolean`.
- [ ] `handlePrepareWelyb` : `setWelybScope(scope)` quand on stocke le plan.
- [ ] `handleConfirmSend` : refetch `/api/finance/send-to-accountant` avec
      `{ scope: welybScope, year, confirmSend:true }`. Si la réponse revient `dryRun:true`
      → toast d'erreur « envoi réel non activé côté serveur ». Sinon toast succès
      `piecesSent`, fermer la modale, `onSyncComplete()` (refetch).
- [ ] Passer `onConfirmSend={handleConfirmSend}` + `sending={welybSending}` à `WelyBPlanDialog`.

### 1d. `_shared-comptable/welyb-plan-dialog.tsx`

- [ ] Props : `onConfirmSend: () => void; sending: boolean;`.
- [ ] Si `data.sendAllowed && data.totalPieces>0` : afficher une **case à cocher**
      « Je confirme l'envoi réel au cabinet » qui active le bouton « Confirmer l'envoi (X pièces) ».
      Bouton `disabled={!confirmChecked || sending}` → `onClick={onConfirmSend}`.
      Sinon : garder le bouton désactivé + message actuel (verrou serveur).
- [ ] Bandeau d'avertissement adapté (rouge si envoi réel armé / ambre si verrouillé).

### 1e. Env local

- [ ] Ajouter `ACCOUNTANT_SEND_ENABLED=true` dans `apps/back-office/.env.local`
      (active l'envoi réel EN LOCAL uniquement ; prod inchangé). Demander à Roméo de
      redémarrer son back-office une fois. La sécurité repose sur la case à cocher + le bouton.

---

## FIX 2 — Dépôt = rapprochement immédiat (GAP 2) — ROUTE QONTO PROTÉGÉE (autorisée)

### 2a. `apps/back-office/src/app/api/qonto/attachments/upload/route.ts`

- [ ] l.83-87 : changer le select `'id, raw_data'` → `'id, raw_data, attachment_ids'`.
- [ ] l.170-180 : remplacer l'update « attachment_ids seul » par un update qui écrit aussi :
  - `raw_data` = merge `{ ...rawData, attachment_ids:[...rawData.attachment_ids?? [], attachment.id] }`
    (fait basculer `has_attachment` GENERATED → true).
  - `local_pdf_path = storagePath` et `pdf_stored_at = now()` **uniquement si `!storageError`**
    (le fichier est déjà sauvé dans le bucket `justificatifs` à `storagePath`, l.136-144).
  - conserver `attachment_ids:[...existingIds, attachment.id]`.
- Effet : la pièce déposée devient immédiatement « présente » (sort de `v_library_missing_documents`)
  ET envoyable Welyb (`local_pdf_path` non nul). Plus besoin de re-synchroniser.
- ⚠️ Pas de `any` : typer `rawData` en `Record<string, unknown>`, garder Zod/guards.
- ⚠️ Préserver TOUTES les clés existantes de `raw_data` (spread) — surtout `raw_data.id`
  (UUID Qonto) utilisé pour l'upload.

### 2b. (option, NON décidé) GAP 3 — auto-rapprochement ventes 2025 ↔ factures Vérone : à voir + tard.

---

## Vérification (à faire avant de dire « terminé »)

- [ ] `pnpm --filter @verone/back-office type-check` vert.
- [ ] `pnpm --filter @verone/back-office lint` vert.
- [ ] Runtime (serveur lancé par Roméo) via Playwright lane-2, page `/finance/bibliotheque`
      ou `/finance/cloture`, année 2025 :
  - dépôt d'1 pièce sur une transaction manquante → vérifier en base que `has_attachment=true`
    - `local_pdf_path` non nul + la pièce passe en « présente » sans cliquer « Pièces Qonto ».
  - « Préparer Welyb Achats » 2025 → modale montre le bouton « Confirmer » actif (flag local on)
    - case à cocher. (NE PAS confirmer l'envoi réel pendant le test sauf accord Roméo —
      ça part vraiment au comptable.)
- [ ] 0 erreur console nouvelle.

## Commit / fin de chantier

- [ ] Commits `[BO-COMPTA-003] …` sur la branche (PAS de push tant que Roméo n'a pas validé,
      cf. règle « 1 chantier = 1 push final »).
- [ ] Dans le message de commit de la route Qonto : noter « modif route /api/qonto/\* autorisée
      explicitement par Roméo le 2026-06-27 (déblocage rapprochement dépôt) ».
- [ ] Mettre à jour `dev-report` final + **nettoyer l'entrée BO-COMPTA-003 d'ACTIVE.md**
      quand validé (NE PAS supprimer le fichier ACTIVE.md lui-même).
- [ ] Rien mis en ligne sans GO Roméo.

## État d'avancement (cocher au fur et à mesure)

- [ ] FIX 1a route
- [ ] FIX 1b types
- [ ] FIX 1c global-actions
- [ ] FIX 1d dialog
- [ ] FIX 1e env local
- [ ] FIX 2a upload route
- [ ] type-check + lint
- [ ] test runtime
- [ ] dev-report + ménage ACTIVE.md
