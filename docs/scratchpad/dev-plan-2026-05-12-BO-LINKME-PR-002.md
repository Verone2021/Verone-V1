# Plan de développement — BO-LINKME-PR-002

# Système demandes de paiement LinkMe — Finalisation complète

**Date :** 2026-05-12  
**Branche :** `fix/BO-LINKME-PR-002` (depuis `staging`)  
**Priorité :** Haute — système non fonctionnel depuis 8 mois  
**Auteur audit :** Claude Code (session 2026-05-12)

---

## Contexte et résumé de l'audit

Le workflow demandes de paiement LinkMe est implémenté à ~70%. Le happy path existe (affilié crée → upload facture → back-office marque payé) mais 4 blockers empêchent une utilisation réelle en production, et plusieurs fonctionnalités prévues n'ont jamais été développées.

**L'erreur visible :** la page détail `/canaux-vente/linkme/demandes-paiement/{id}` affiche "Impossible de charger les détails de cette demande." Ce n'est PAS un problème d'autorisation — les RLS sont correctes depuis la migration `20260130_001`. C'est une colonne manquante en base : `order_date` sur la table `linkme_commissions`.

---

## Audit complet — Ce qui manque

### Bugs bloquants

| #   | Table/Fichier                    | Problème                                                                                                                                   | Impact                                                                     |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| B1  | `linkme_commissions` (DB)        | Colonne `order_date` jamais créée. Le code dans `[id]/page.tsx` l'attend et fait un SELECT qui retourne erreur 400 PostgreSQL (code 42703) | Page détail = erreur blanche. Dates toujours vides. Tri par date cassé.    |
| B2  | `PaymentRequestsTable.tsx`       | Aucun bouton œil distinct. Le lien vers le détail est uniquement le numéro "PR-2026-000001" en bleu. Peu visible.                          | Navigation peu intuitive                                                   |
| B3  | Back-office pages liste + détail | Aucun bouton "Annuler demande". Mutation `useCancelPaymentRequest()` existe côté LinkMe mais jamais côté back-office.                      | Admin bloqué si affilié se trompe. Impossible de corriger sans SQL manuel. |
| B4  | Supabase Storage                 | Bucket `linkme-invoices` marqué "à créer manuellement" dans migration `20251211010000`. Jamais vérifié s'il existe.                        | Upload facture PDF peut échouer silencieusement en production.             |

### Fonctionnalités jamais développées

| #   | Quoi                                         | Où ça manque                                                                           | Prévu depuis                                                                   |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| F1  | Page détail demande côté affilié LinkMe      | `apps/linkme/src/app/(main)/commissions/demandes/[id]/page.tsx` inexistant             | Migration déc 2025 (hook `usePaymentRequestDetail()` créé mais jamais utilisé) |
| F2  | Colonne `payment_proof_url` inutilisée       | Modal `MarkAsPaidModal` ne permet pas d'uploader une preuve de paiement                | Migration déc 2025 (colonne créée mais jamais branchée)                        |
| F3  | Casts TypeScript temporaires jamais nettoyés | `hooks.ts` lignes 21 et 94 : `.from('linkme_payment_requests' as 'linkme_affiliates')` | Commentaire "temporaire en attendant gen types" jamais résolu                  |

---

## Plan d'action — Sprints ordonnés

### SPRINT 1 — Migration DB (blocker principal)

**Fichier à créer :** `supabase/migrations/20260512140000_add_order_date_linkme_commissions.sql`

```sql
-- Migration: Ajout colonne order_date dans linkme_commissions
-- Contexte: Le code dans [id]/page.tsx requête cette colonne mais elle n'a jamais
-- été créée. Le pattern order_number était déjà dénormalisé, order_date suit le
-- même principe pour éviter une jointure supplémentaire vers sales_orders.
-- Données: 130 rows, toutes avec order_id valide (vérification 2026-05-12).

ALTER TABLE linkme_commissions
  ADD COLUMN IF NOT EXISTS order_date date;

-- Backfill depuis sales_orders via order_id (100% des rows ont un order_id valide)
UPDATE linkme_commissions lc
SET order_date = so.order_date
FROM sales_orders so
WHERE so.id = lc.order_id
  AND lc.order_date IS NULL;

-- Index pour le tri chronologique dans la page détail
CREATE INDEX IF NOT EXISTS idx_linkme_commissions_order_date
  ON linkme_commissions(order_date DESC);

-- Commentaire documentation
COMMENT ON COLUMN linkme_commissions.order_date
  IS 'Date de la commande client (dénormalisé depuis sales_orders.order_date, même pattern que order_number)';
```

**Après la migration :** `python3 scripts/generate-docs.py --db` + `pnpm run generate:types`

**Vérification :**

```sql
SELECT order_number, order_date FROM linkme_commissions LIMIT 5;
-- Doit retourner des dates non-nulles
```

---

### SPRINT 2 — Back-office : bouton œil + page détail fonctionnelle

**Fichier 1 :** `apps/back-office/src/app/(protected)/canaux-vente/linkme/demandes-paiement/_components/PaymentRequestsTable.tsx`

Modifications :

1. Ajouter `Eye` aux imports lucide-react (ligne 3)
2. Ajouter import `Link` si absent
3. Dans la colonne Actions, avant le bouton `Mail`, ajouter :

```tsx
<Link
  href={`/canaux-vente/linkme/demandes-paiement/${request.id}`}
  className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
  title="Voir le détail"
>
  <Eye className="h-4 w-4" />
</Link>
```

4. Garder le lien bleu sur `request.requestNumber` (double accès, pas de problème)

**Fichier 2 :** `apps/back-office/src/app/(protected)/canaux-vente/linkme/demandes-paiement/[id]/page.tsx`

Ce fichier est correct — il fonctionnera automatiquement après la migration Sprint 1.

Vérification après fix :

- Naviguer vers `http://localhost:3000/canaux-vente/linkme/demandes-paiement/e949f90c-e4d1-445b-86bd-861031561795`
- Le tableau "Commandes incluses" doit afficher les dates et les montants
- Screenshot fullPage avant commit

---

### SPRINT 3 — Back-office : bouton "Annuler demande"

**Fichier 1 :** `apps/back-office/src/app/(protected)/canaux-vente/linkme/demandes-paiement/_components/hooks.ts`

Ajouter mutation `useAdminCancelPaymentRequest()` :

```typescript
export function useAdminCancelPaymentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('linkme_payment_requests' as 'linkme_affiliates')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .in('status', ['pending', 'invoice_received']); // Guard: ne pas annuler ce qui est déjà payé
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin-payment-requests'],
      });
    },
  });
}
```

**Fichier 2 :** `apps/back-office/src/app/(protected)/canaux-vente/linkme/demandes-paiement/[id]/page.tsx`

Ajouter bouton "Annuler demande" dans l'en-tête (visible uniquement si status = 'pending' ou 'invoice_received') :

```tsx
{
  (request.status === 'pending' || request.status === 'invoice_received') && (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => {
        if (
          confirm(
            'Annuler cette demande ? Les commissions seront remises en "à payer".'
          )
        ) {
          void cancelRequest(request.id).catch(err => console.error(err));
        }
      }}
    >
      <XCircle className="h-4 w-4 mr-2" />
      Annuler la demande
    </Button>
  );
}
```

Note : Le trigger DB `sync_commissions_on_payment_request_paid()` gère déjà le cas 'cancelled' → remet les commissions en 'validated'. Pas besoin de logique supplémentaire.

---

### SPRINT 4 — Vérifier et créer le bucket Storage `linkme-invoices`

Vérifier via MCP Supabase si le bucket existe :

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'linkme-invoices';
```

Si la ligne est vide → le bucket n'existe pas → créer via :

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('linkme-invoices', 'linkme-invoices', false)
ON CONFLICT DO NOTHING;
```

Ajouter également les policies Storage pour que les affiliés puissent uploader et que le back-office puisse lire :

```sql
-- Affilié : uploader sa propre facture
CREATE POLICY "affiliates_upload_invoice"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'linkme-invoices'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Back-office : lire toutes les factures
CREATE POLICY "staff_read_invoices"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'linkme-invoices'
  AND is_backoffice_user()
);
```

---

### SPRINT 5 — App LinkMe : page détail demande affilié

**Fichier à créer :** `apps/linkme/src/app/(main)/commissions/demandes/[id]/page.tsx`

Ce fichier doit :

1. Utiliser le hook existant `usePaymentRequestDetail(id)` (déjà implémenté dans `apps/linkme/src/lib/hooks/use-payment-requests.ts`)
2. Afficher :
   - Numéro demande + badge statut
   - Montant TTC total
   - Date de création
   - Tableau des commissions incluses (N° commande, date, montant HT, rémunération TTC)
   - Si status='pending' → bouton "Uploader ma facture" (modal existant)
   - Si status='paid' → afficher référence paiement + date payée
3. Lien retour vers `/commissions/demandes`

Structure à suivre : s'inspirer de `apps/back-office/.../demandes-paiement/[id]/page.tsx` mais adapté pour l'affichage affilié (sans les boutons admin).

---

### SPRINT 6 — Nettoyage TypeScript casts

**Fichier :** `apps/back-office/src/app/(protected)/canaux-vente/linkme/demandes-paiement/_components/hooks.ts`

Après `pnpm run generate:types` (Sprint 1) :

1. Supprimer `as 'linkme_affiliates'` lignes 21 et 94
2. Vérifier `pnpm --filter @verone/back-office type-check` → 0 erreur

---

## Fichiers à créer / modifier — récapitulatif

| Sprint | Fichier                                                                       | Action                         |
| ------ | ----------------------------------------------------------------------------- | ------------------------------ |
| S1     | `supabase/migrations/20260512140000_add_order_date_linkme_commissions.sql`    | CRÉER                          |
| S2     | `apps/back-office/.../demandes-paiement/_components/PaymentRequestsTable.tsx` | MODIFIER (bouton œil)          |
| S2     | `apps/back-office/.../demandes-paiement/[id]/page.tsx`                        | AUCUNE MODIF (marche après S1) |
| S3     | `apps/back-office/.../demandes-paiement/_components/hooks.ts`                 | MODIFIER (mutation annulation) |
| S3     | `apps/back-office/.../demandes-paiement/[id]/page.tsx`                        | MODIFIER (bouton annuler)      |
| S4     | Migration Storage bucket (SQL via MCP)                                        | CRÉER si manquant              |
| S5     | `apps/linkme/src/app/(main)/commissions/demandes/[id]/page.tsx`               | CRÉER                          |
| S6     | `apps/back-office/.../demandes-paiement/_components/hooks.ts`                 | MODIFIER (supprimer casts)     |

---

## Ordre d'exécution recommandé

```
S1 → S6 → S2 → test détail BO → S3 → S4 → S5
```

Rationale :

- S1 est le blocker critique — tout le reste découle
- S6 juste après S1 car les types sont régénérés
- S2 est rapide (30 min)
- S3 ajoute l'annulation (fonctionnel mais non critique)
- S4 doit être vérifié (peut être déjà en place)
- S5 est le plus long (nouvelle page LinkMe)

---

## Checklist de validation finale

### Base de données

- [ ] `SELECT order_date FROM linkme_commissions LIMIT 5` → dates non-nulles
- [ ] `SELECT id, name FROM storage.buckets WHERE id = 'linkme-invoices'` → 1 résultat

### Back-office

- [ ] `/canaux-vente/linkme/demandes-paiement` → liste visible, bouton œil présent
- [ ] Clic bouton œil PR-2026-000001 → page détail avec tableau commandes + dates visibles
- [ ] Demande en status='pending' → bouton "Annuler demande" visible
- [ ] Clic annuler → confirm dialog → demande passe en 'cancelled'
- [ ] Demande en status='paid' → bouton annuler absent

### App LinkMe

- [ ] `/commissions/demandes` → liste des demandes affilié visible
- [ ] Clic sur une demande → page `/commissions/demandes/{id}` → détail visible
- [ ] Si status='pending' → bouton upload facture visible

### TypeScript

- [ ] `pnpm --filter @verone/back-office type-check` → 0 erreur
- [ ] `pnpm --filter @verone/linkme type-check` → 0 erreur

---

## Format commit attendu

```
[BO-LINKME-PR-002] fix: colonne order_date + bouton oeil + annulation demande paiement
```

Si plusieurs commits (migration séparée) :

```
[BO-LINKME-PR-002] fix: add order_date to linkme_commissions (backfill 130 rows)
[BO-LINKME-PR-002] feat: bouton oeil PaymentRequestsTable + annulation back-office
[BO-LINKME-PR-002] feat: page detail demande paiement LinkMe affilié
```

---

## Références

- Migration principale : `supabase/migrations/20251211010000_create_payment_requests.sql`
- Fix RLS : `supabase/migrations/20260130_001_fix_payment_requests_rls_staff.sql`
- Schéma doc : `docs/current/database/schema/06-linkme.md`
- Hook affilié : `apps/linkme/src/lib/hooks/use-payment-requests.ts`
- Règles DB : `.claude/rules/database.md`
- Règles workflow : `.claude/rules/workflow.md`
