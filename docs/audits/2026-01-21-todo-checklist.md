# Checklist TODO - Audit Implémentation 2026-01-21

**Source** : Audit complet `2026-01-21-implementation-gaps.md`

**⚠️ ATTENTION** : Ne PAS implémenter maintenant - Planning futur uniquement

---

## 🔴 P0 - CRITIQUE (À planifier en priorité)

### [ ] 1. Traçabilité Factures Qonto → Commandes LinkMe

**Fichier** : `apps/back-office/src/app/api/qonto/invoices/route.ts`
**Ligne** : 417-418 (TODO existant)

**Changements requis** :
```typescript
// APRÈS ligne 409 (création facture)
const invoice = await qontoClient.createClientInvoice(invoiceParams);

// AJOUTER insertion dans financial_documents
await supabase.from('financial_documents').insert({
  document_type: 'customer_invoice',
  document_direction: 'inbound',
  document_number: invoice.number,
  sales_order_id: salesOrderId,  // ← LIEN CRITIQUE
  qonto_invoice_id: invoice.id,  // ← TRAÇABILITÉ
  // ... autres champs
});
```

**Effort** : 1 jour
**Risque** : 🔴 ÉLEVÉ (module finance fragile)
**Tests requis** : E2E création facture + vérification lien DB

---

### [ ] 2. Corriger Sync Qonto Invoices - Champs Incorrects

**Fichier** : `apps/back-office/src/app/api/qonto/sync-invoices/route.ts`
**Ligne** : 206

**Changements requis** :
```typescript
// REMPLACER
abby_invoice_id: invoice.id,

// PAR
qonto_invoice_id: invoice.id,
qonto_invoice_number: invoiceNumber,

// AJOUTER recherche sales_order_id
const { data: order } = await supabase
  .from('sales_orders')
  .select('id')
  .eq('order_number', invoice.purchase_order_number)
  .maybeSingle();

sales_order_id: order?.id || null,
```

**Effort** : 0.5 jour
**Risque** : 🟡 MOYEN
**Tests requis** : Sync manuelle + vérification données

---

## 🟡 P1 - HAUTE (Développement futur - 1-2 mois)

### [ ] 3. Tests E2E - Workflow Factures

**Package** : `packages/e2e-linkme/tests/invoicing/`

**Fichiers à créer** :
- [ ] `create-invoice-from-order.spec.ts`
- [ ] `send-invoice-email.spec.ts`
- [ ] `reconcile-payment.spec.ts`
- [ ] `end-to-end-order-workflow.spec.ts`

**Scénarios clés** :
```typescript
// Test 1: Création facture
- Se connecter back-office
- Ouvrir commande LinkMe
- Générer facture
- Vérifier facture Qonto créée
- Vérifier lien dans financial_documents

// Test 2: Workflow complet
- Affilié crée commande
- Back-office génère facture
- Simuler paiement Qonto
- Vérifier réconciliation auto
- Vérifier notifications
```

**Effort** : 3 jours
**Risque** : 🟡 MOYEN (fixtures données complexes)

---

### [ ] 4. Webhooks Qonto - Sync Temps Réel

**Fichier à créer** : `apps/back-office/src/app/api/webhooks/qonto/route.ts`

**Événements à gérer** :
- [ ] `transaction.created`
- [ ] `transaction.updated`
- [ ] `invoice.paid`
- [ ] `invoice.overdue`

**Architecture** :
```typescript
export async function POST(request: Request) {
  // 1. Vérifier signature Qonto
  const signature = request.headers.get('x-qonto-signature');
  if (!verifySignature(signature, body)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parser payload
  const { event_type, data } = await request.json();

  // 3. Switch sur type événement
  switch (event_type) {
    case 'transaction.created':
      await syncTransaction(data);
      break;
    case 'invoice.paid':
      await updateInvoiceStatus(data);
      await reconcilePayment(data);
      await sendNotification(data);
      break;
  }
}
```

**Prérequis** :
- [ ] URL publique (tunnel ngrok ou déploiement)
- [ ] Configuration dashboard Qonto (webhooks)
- [ ] Secret webhook Qonto dans `.env`

**Effort** : 1 jour
**Risque** : 🔴 ÉLEVÉ (config externe + sécurité)

---

## 🟢 P2 - MOYENNE (Nice-to-have - 3-6 mois)

### [ ] 5. Gestion Avoirs - Interface Complète

**Contexte** : 2 avoirs créés manuellement suite erreurs

**Fichiers à créer** :
- [ ] `apps/back-office/src/app/(protected)/factures/[id]/avoir/page.tsx`
- [ ] `apps/back-office/src/app/api/qonto/credit-notes/from-invoice/route.ts`

**Fonctionnalités** :
- [ ] UI : Bouton "Créer avoir" sur page facture
- [ ] Formulaire : Sélection lignes à avoir (total ou partiel)
- [ ] API : Création avoir Qonto
- [ ] DB : Lien facture originale ↔ avoir
- [ ] Email : Notification client avec PDF avoir

**Effort** : 2 jours
**Risque** : 🟢 FAIBLE

---

### [ ] 6. Audit Sécurité RLS Complet

**Checklist** :
- [ ] Revue exhaustive policies (toutes tables)
  ```sql
  SELECT tablename, policyname, permissive, cmd
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
  ```

- [ ] Test accès non autorisés
  ```typescript
  // Test: User A ne peut pas voir sélections User B
  // Test: Enseigne A ne peut pas modifier produits Enseigne B
  // Test: Anon ne peut pas insérer dans tables protégées
  ```

- [ ] Scan secrets
  ```bash
  # Chercher credentials hardcodés
  rg -i "password.*=|api_key.*=|secret.*=" --type ts --type sql
  ```

- [ ] Rate limiting API publiques
  ```typescript
  // Middleware Next.js ou Cloudflare
  export const config = {
    matcher: ['/api/public/:path*'],
  };
  ```

- [ ] Configuration CORS
  ```typescript
  // next.config.js
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://linkme.verone.fr' },
        ],
      },
    ];
  }
  ```

**Effort** : 1 jour
**Risque** : 🟡 MOYEN (découverte failles potentielles)

---

## 📊 RÉCAPITULATIF EFFORT

| Priorité | Tâches | Effort Total | Risque Global |
|----------|--------|--------------|---------------|
| **P0** | 2 | 1.5 jours | 🔴 ÉLEVÉ |
| **P1** | 2 | 4 jours | 🟡 MOYEN |
| **P2** | 2 | 3 jours | 🟢 FAIBLE |

**TOTAL** : **8.5 jours** de développement

---

## 🚀 PLANNING RECOMMANDÉ

### Sprint 1 (Semaine 1-2) - P0
- [ ] Jour 1 : Traçabilité factures (POC + tests)
- [ ] Jour 2 : Traçabilité factures (finalisation + review)
- [ ] Jour 3 : Sync invoices correction champs
- [ ] Jour 4 : Tests manuels workflow complet
- [ ] Jour 5 : Documentation + déploiement

### Sprint 2 (Semaine 3-5) - P1
- [ ] Semaine 3 : Tests E2E workflow factures (3j)
- [ ] Semaine 4 : Webhooks Qonto (1j) + tests
- [ ] Semaine 5 : Refactoring + optimisations

### Sprint 3 (Mois 2-3) - P2
- [ ] Mois 2 : Gestion avoirs complète (2j)
- [ ] Mois 3 : Audit sécurité (1j)

---

## ⚠️ PRÉREQUIS AVANT DÉMARRAGE

### Environnement
- [ ] Accès admin Qonto (pour webhooks)
- [ ] Environnement de test/staging (ne pas tester en prod)
- [ ] Backup database avant modifications critiques

### Documentation
- [ ] Lire rapport audit complet (`2026-01-21-implementation-gaps.md`)
- [ ] Comprendre architecture finance (`docs/current/database.md`)
- [ ] Revoir logs erreurs factures historiques

### Tests
- [ ] Fixtures commandes LinkMe de test
- [ ] Credentials Qonto sandbox (si disponible)
- [ ] Plan de rollback si erreurs

---

## 📝 NOTES IMPORTANTES

**⚠️ Système Finance Fragile** :
> Le module finance a pris plusieurs semaines à configurer.
> Toute modification doit être testée exhaustivement avant prod.
> En cas de doute, consulter l'équipe avant d'appliquer.

**✅ Pas de Blocage Production** :
> Les gaps identifiés n'empêchent PAS l'utilisation en production.
> La réconciliation manuelle fonctionne (via numéros commande).

**🔄 Processus Validation** :
1. Développement sur branche feature
2. Tests E2E + manuels complets
3. Review code par pair
4. Déploiement staging
5. Tests utilisateurs réels
6. Déploiement production graduel (canary)

---

**Checklist créée** : 2026-01-21
**Source** : Audit implémentation complet
**Statut** : Planning futur (NE PAS implémenter immédiatement)
