# dev-report — [BO-COMPTA-001] Cockpit comptable sur Finance / Bibliothèque

**Date** : 2026-06-24
**Branche** : `feat/BO-COMPTA-001-cloture-welyb`
**Statut** : ✅ type-check vert, lint zéro, testé à l'écran (Playwright), non-régression Clôture OK

---

## Objectif

Permettre à Roméo de **tout piloter depuis Finance / Bibliothèque** (et pas seulement
depuis la Clôture comptable), en gardant l'affichage en **galerie de vignettes**.

## Problème de départ confirmé

Le bouton « Synchroniser » de la Bibliothèque appelait
`POST /api/qonto/attachments/backfill-pdfs` — **route inexistante** (404). Seule route
backfill réelle : `/api/qonto/invoices/backfill-pdfs` (autre périmètre). La synchro Qonto de
la Bibliothèque ne faisait donc rien.

---

## Architecture — réutilisation via `_shared-comptable/`

Les briques du cockpit Clôture ont été **promues** dans un dossier partagé consommé par les
deux pages (pas de duplication, pas d'import cross-route `_components`).

**Dossier créé** : `apps/back-office/src/app/(protected)/finance/_shared-comptable/`
Fichiers déplacés (`git mv`) depuis `cloture/` : `types.ts`, `use-cloture-data.ts`,
`cloture-row-signals.tsx`, `cloture-counters.tsx`, `cloture-upload-dialog.tsx`,
`cloture-vat-pcg-dialog.tsx`, `cloture-global-actions.tsx`, `welyb-plan-dialog.tsx`.
`cloture-table.tsx` reste dans `cloture/_components/` (spécifique tableau).
Imports de `cloture/page.tsx` + `cloture/_components/cloture-table.tsx` redirigés.
Commit isolé « no behavior change » (type-check vert avant la suite).

**Nouveau** : `_shared-comptable/card-signal-badge.tsx` — helper `getDominantSignal` +
composant `CardSignalBadge` (UNE pastille dominante pour rester lisible en overlay sur la
vignette). Ordre : ignoré > pièce manquante > PCG manquant > TVA à vérifier > transféré (« Envoyé
le X ») > OK.

---

## Modifications

| Fichier                                                         | Changement                                                                                                                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_shared-comptable/use-cloture-data.ts`                         | expose aussi `documents: LibraryDocument[]` (mono-fetch, pas de double appel `v_library_documents`)                                                                                                            |
| `bibliotheque/page.tsx`                                         | branché sur `useClotureData` ; `rowsById` mémoïsé ; `ClotureCountersBar` ; `LibraryHeader` (actions globales) ; dialogs upload + vat/pcg centralisés au niveau page (partagés galerie + section manquants)     |
| `bibliotheque/_components/document-card.tsx`                    | props optionnelles `signals/onUpload/onEditVatPcg` ; pastille overlay haut-gauche ; entrées menu « Déposer/Remplacer la pièce » + « Corriger TVA/compta » (visibles si `source_table === 'bank_transactions'`) |
| `bibliotheque/_components/document-list.tsx`                    | passe-plat `rowsById/onUpload/onEditVatPcg`                                                                                                                                                                    |
| `bibliotheque/_components/library-toolbar.tsx`                  | **retrait du bouton Synchroniser cassé** ; garde recherche + Actualiser                                                                                                                                        |
| `bibliotheque/_components/library-header.tsx` (créé)            | titre + description + `ClotureGlobalActions` (Pièces Qonto + Welyb Achats/Ventes)                                                                                                                              |
| `bibliotheque/_components/missing-documents-section.tsx` (créé) | section manquants actionnable : pastilles + boutons Déposer / Corriger                                                                                                                                         |

Tous les fichiers < 400 lignes (page.tsx = 247 l).

## Routes appelées (aucune modifiée)

`POST /api/finance/sync-qonto-attachments` {year}, `POST /api/finance/send-to-accountant`
{scope, year} (dry-run, jamais confirmSend), `POST /api/transactions/update-vat`,
`POST /api/qonto/attachments/upload`, `DELETE /api/library/documents/[id]`.

---

## Vérification Playwright (back-office, 1440, login veronebyromeo)

- `/finance/bibliotheque` : compteurs (29/32/51/0/61 sur 2026), galerie avec pastilles
  (PCG manquant rouge, OK vert), header avec Pièces Qonto + Welyb. Screenshot `biblio-initial-174800`.
- **Synchro réparée** : clic « Pièces Qonto » → `POST /api/finance/sync-qonto-attachments` **200 OK**
  (network request #724). Plus aucun 404 backfill.
- **Welyb dry-run** : « Préparer Welyb Ventes » → modale plan (3 pièces, dest. `ventes+verone@welyb.fr`,
  bouton confirmer désactivé, « aucun email envoyé »). Screenshot `biblio-welyb-plan-174900`.
- **Section manquants actionnable** : pastilles + boutons dépôt/correction. Screenshot
  `biblio-missing-section-175000`.
- **Dialog TVA/PCG** : ouverture OK sur pièce « SIE PARIS 1ER 2E » (annulé, pas de mutation test).
  Screenshot `biblio-vatpcg-dialog-175100`.
- **Non-régression Clôture** : `/finance/cloture` identique (tableau, compteurs 41/200/211/0/241,
  signaux, actions). Screenshot `cloture-nonregression-175200`.
- **0 erreur console** sur les deux pages (2 warnings pré-existants : logo aspect-ratio + realtime notif).

## Checks

- `pnpm --filter @verone/back-office type-check` : ✅
- `pnpm --filter @verone/back-office lint` : ✅ zéro warning

## Reste (hérité du chantier BO-COMPTA-001, hors périmètre de cet ajout)

Renouveler le jeton Supabase (drift CI), redécoupe éventuelle, tests d'envoi Welyb réel
(verrouillé par `ACCOUNTANT_SEND_ENABLED`). Pas de push tant que le chantier complet n'a pas
le GO Roméo.
