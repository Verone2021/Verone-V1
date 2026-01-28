# Système de Facturation - Workflow 3 Statuts

**Date**: 2026-01-22
**Branche**: `feat/BO-FIN-invoice-workflow-3-statuses`
**Statut**: ⚠️ Implementation complète, migration non appliquée

---

## Vue d'ensemble

Implémentation d'un workflow de validation de factures en 3 étapes :

```
1. SYNCHRONISÉ (synchronized)
   ↓ [Validation utilisateur - bouton "Valider brouillon"]
2. BROUILLON (draft_validated)
   ↓ [Finalisation - bouton "Finaliser (PDF)"]
3. DÉFINITIF (finalized) - PDF disponible
   ↓ [Auto/Manuel]
4. ENVOYÉ (sent)
   ↓ [Paiement]
5. PAYÉ (paid)
```

### Règles

- ✅ Modification autorisée aux statuts 1 et 2 (synchronized, draft_validated)
- ❌ Modification bloquée au statut 3+ (finalized)
- 📄 PDF disponible UNIQUEMENT au statut 3
- 🔄 Qonto reste en "draft" pour statuts 1 et 2
- 🔒 Qonto passe à "finalized" au statut 3

---

## Fichiers implémentés

### Database
- ✅ `supabase/migrations/20260122_003_invoice_workflow_statuses.sql`

### API Backend
- ✅ `apps/back-office/src/app/api/qonto/invoices/[id]/validate-to-draft/route.ts`
- ✅ `apps/back-office/src/app/api/qonto/invoices/[id]/finalize-workflow/route.ts`
- ✅ `apps/back-office/src/app/api/qonto/invoices/by-order/[orderId]/route.ts`
- ✅ `apps/back-office/src/app/api/qonto/invoices/[id]/route.ts` (PATCH modifié)

### UI Frontend
- ✅ `apps/back-office/src/app/(protected)/commandes/clients/[id]/InvoicesSection.tsx`
- ✅ `apps/back-office/src/app/(protected)/commandes/clients/[id]/page.tsx` (intégré)

---

## ⚠️ Prochaines étapes OBLIGATOIRES

### 1. Démarrer Docker Desktop

La migration Supabase nécessite Docker.

```bash
# Ouvrir Docker Desktop manuellement
```

### 2. Appliquer la migration

**Option A - Local (recommandé pour dev)**

```bash
# Appliquer toutes les migrations en local
supabase db reset

# Vérifier les colonnes
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d financial_documents" | grep workflow
```

**Option B - Cloud (si local impossible)**

```bash
# Push vers Supabase cloud
supabase db push
```

### 3. Régénérer les types TypeScript

```bash
# Générer types depuis DB locale
supabase gen types typescript --local > packages/@verone/types/src/database.types.ts

# OU depuis cloud
supabase gen types typescript --project-id <PROJECT_ID> > packages/@verone/types/src/database.types.ts
```

### 4. Vérifier TypeScript

```bash
pnpm type-check
```

Toutes les erreurs sur `workflow_status` doivent disparaître.

### 5. Tester manuellement

```bash
# Démarrer back-office
pnpm dev

# Naviguer vers commande
http://localhost:3000/commandes/clients/[id]

# Tester workflow
1. Créer facture → Statut "Synchronisé"
2. Click "Valider brouillon" → Statut "Brouillon"
3. Click "Finaliser" → Statut "Définitif" + PDF disponible
4. Vérifier bouton "Télécharger PDF"
5. Tester modification aux différents statuts
```

### 6. Build production

```bash
pnpm build
```

---

## Structure technique

### Migration database

**Colonnes ajoutées** :
- `workflow_status` TEXT CHECK (enum)
- `synchronized_at` TIMESTAMPTZ
- `validated_to_draft_at` TIMESTAMPTZ
- `finalized_at` TIMESTAMPTZ
- `sent_at` TIMESTAMPTZ
- `validated_by` UUID
- `finalized_by` UUID

**Trigger** : `trg_update_workflow_timestamps`
- Auto-update timestamps lors des changements de statut

**Index** : `idx_financial_documents_workflow_status`

### Endpoints API

#### POST /api/qonto/invoices/[id]/validate-to-draft
- Transition : synchronized → draft_validated
- Auth : Utilisateur connecté
- Tracking : validated_by, validated_to_draft_at

#### POST /api/qonto/invoices/[id]/finalize-workflow
- Transition : draft_validated → finalized
- Appelle Qonto /finalize
- Génère PDF
- Tracking : finalized_by, finalized_at, qonto_pdf_url

#### GET /api/qonto/invoices/by-order/[orderId]
- Liste factures d'une commande
- Filtre : document_type = 'customer_invoice', deleted_at IS NULL
- Tri : created_at DESC

#### PATCH /api/qonto/invoices/[id]
- Bloque si workflow_status = finalized
- Vérifie Qonto status = draft ET workflow_status IN (synchronized, draft_validated)

### Composant InvoicesSection

**Features** :
- Liste factures avec statut coloré
- Bouton "Valider brouillon" si synchronized
- Bouton "Finaliser (PDF)" si draft_validated
- Bouton "Télécharger PDF" si finalized
- Bouton "Modifier" si synchronized ou draft_validated
- React Query pour cache et invalidation

**Props** :
- `orderId: string` - UUID de la commande

---

## Tests E2E suggérés

```typescript
// packages/e2e-linkme/tests/invoice-workflow.spec.ts

test('Invoice workflow 3 statuses', async ({ page }) => {
  // 1. Créer commande
  // 2. Créer facture → Vérifier "Synchronisé"
  // 3. Valider brouillon → Vérifier "Brouillon"
  // 4. Finaliser → Vérifier "Définitif" + PDF
  // 5. Télécharger PDF → Vérifier download
  // 6. Tester modification bloquée si finalized
});
```

---

## Troubleshooting

### Erreur "column 'workflow_status' does not exist"

**Cause** : Migration non appliquée
**Solution** : Suivre étapes 1-3 ci-dessus

### Erreur "Docker daemon not running"

**Cause** : Docker Desktop non démarré
**Solution** : Ouvrir Docker Desktop

### Types Supabase obsolètes

**Cause** : Types non regénérés après migration
**Solution** : `supabase gen types typescript --local > packages/@verone/types/src/database.types.ts`

### PDF non disponible après finalisation

**Cause** : Qonto /finalize peut prendre 1-2 secondes
**Solution** : Ajouter polling ou refresh après 2 secondes

---

## Commits

```
10e1b06c [BO-FIN] step 1: add workflow_status migration
803e0d40 [BO-FIN] step 2: add validate-to-draft endpoint
7d04286d [BO-FIN] step 3: add finalize-workflow endpoint
8acf5cda [BO-FIN] step 4: add by-order endpoint
d4f26765 [BO-FIN] step 5: block PATCH if invoice finalized
2fd079a0 [BO-FIN] step 6: create InvoicesSection component
945dcdd2 [BO-FIN] step 7: integrate InvoicesSection in order detail page
27cfb414 [BO-FIN] step 8: complete invoice workflow implementation
```

---

**Auteur** : Claude Sonnet 4.5
**Plan source** : `/Users/romeodossantos/.claude/projects/-Users-romeodossantos-verone-back-office-V1/28fa0c06-0630-4420-bfaf-644937e6890b.jsonl`
