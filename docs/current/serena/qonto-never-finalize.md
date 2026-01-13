# Factures Qonto - Ne Jamais Finaliser

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- apps/back-office/src/app/api/qonto/
  Owner: Romeo Dos Santos
  Created: 2026-01-07
  Updated: 2026-01-10

---

## Contexte

Suite a un incident le 7 janvier 2026, une facture test a ete finalisee par erreur avec une TVA incorrecte.

- Facture F-2026-001 creee avec TVA a 0.2% au lieu de 20%
- Impossible a supprimer (seul les brouillons peuvent etre supprimes)
- Numero de facture "grille" definitivement

---

## Regles Absolues

1. **TOUJOURS** creer les factures en mode brouillon (`autoFinalize: false`)
2. **JAMAIS** appeler `finalizeClientInvoice` dans un contexte de test
3. **JAMAIS** passer `autoFinalize: true` a l'API de creation
4. **TOUS** les tests de facturation utilisent des brouillons
5. **SEUL L'UTILISATEUR** peut decider de finaliser une facture via l'UI

---

## API Endpoints

- `POST /api/qonto/invoices` → toujours `autoFinalize: false` par defaut
- `POST /api/qonto/invoices/[id]/finalize` → INTERDIT en test
- `DELETE /api/qonto/invoices/[id]/delete` → uniquement pour brouillons
- `POST /api/qonto/invoices/[id]/cancel` → pour factures unpaid (finalisees)

---

## Impact Comptable

- Un numero de facture est LEGALEMENT SEQUENTIEL
- Un numero utilise ne peut JAMAIS etre reutilise
- Une facture finalisee entre dans la comptabilite officielle
- Toute erreur sur une facture finalisee necessite une facture d'avoir

---

## Code Correct

```typescript
// BON - Mode brouillon
const invoice = await client.createClientInvoice({ ...params });
// invoice.status === 'draft'

// INTERDIT EN TEST
await client.finalizeClientInvoice(invoiceId);
```

---

## Regles Absolues

1. **JAMAIS** finaliser une facture en test
2. **TOUJOURS** utiliser autoFinalize: false
3. **JAMAIS** supposer qu'un numero peut etre reutilise

---

## References

- `apps/back-office/src/app/api/qonto/` - API routes Qonto
- Documentation Qonto API
