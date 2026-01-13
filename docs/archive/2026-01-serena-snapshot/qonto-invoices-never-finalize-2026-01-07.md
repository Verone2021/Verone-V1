# RÈGLE ABSOLUE - FACTURES QONTO (2026-01-07)

## ⚠️ NE JAMAIS FINALISER UNE FACTURE

### Contexte

Suite à un incident le 7 janvier 2026, une facture test a été finalisée par erreur avec une TVA incorrecte.

- Facture F-2026-001 créée avec TVA à 0.2% au lieu de 20%
- Impossible à supprimer (seul les brouillons peuvent être supprimés)
- Numéro de facture "grillé" définitivement

### RÈGLES ABSOLUES

1. **TOUJOURS** créer les factures en mode brouillon (`autoFinalize: false`)
2. **JAMAIS** appeler `finalizeClientInvoice` dans un contexte de test
3. **JAMAIS** passer `autoFinalize: true` à l'API de création
4. **TOUS** les tests de facturation utilisent des brouillons
5. **SEUL L'UTILISATEUR** peut décider de finaliser une facture via l'UI

### API Endpoints

- `POST /api/qonto/invoices` → toujours `autoFinalize: false` par défaut
- `POST /api/qonto/invoices/[id]/finalize` → INTERDIT en test
- `DELETE /api/qonto/invoices/[id]/delete` → uniquement pour brouillons
- `POST /api/qonto/invoices/[id]/cancel` → pour factures unpaid (finalisées)

### Impact Comptable

- Un numéro de facture est LÉGALEMENT SÉQUENTIEL
- Un numéro utilisé ne peut JAMAIS être réutilisé
- Une facture finalisée entre dans la comptabilité officielle
- Toute erreur sur une facture finalisée nécessite une facture d'avoir

### Rappel technique

```typescript
// BON - Mode brouillon
const invoice = await client.createClientInvoice({ ...params });
// invoice.status === 'draft'

// INTERDIT EN TEST
await client.finalizeClientInvoice(invoiceId);
```

---

Date: 2026-01-07
Auteur: Claude après incident facturation
Priorité: CRITIQUE
