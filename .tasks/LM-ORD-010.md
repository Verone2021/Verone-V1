---
id: LM-ORD-010
app: linkme
domain: ORDER
status: completed
priority: high
created: 2026-01-15
commits: [27160298]
---

# LM-ORD-010 — Fix AuthContext Error in Public Selection

## Context
OrderFormUnified utilisait useAuth() qui échouait dans pages publiques (pas d'AuthProvider).

Erreur: "useAuth must be used within an AuthProvider" à l'étape 2 du formulaire.

## Solution
Créé useEnseigneIdFromAffiliate() pour obtenir enseigneId depuis affiliateId sans dépendance AuthContext.

## Implementation
- [x] Créer hook use-enseigne-id-from-affiliate.ts
- [x] Adapter OrderFormUnified.tsx (propagation affiliateId)
- [x] Corriger OpeningStep2Restaurant et OpeningStep4Billing
- [x] Résoudre conflits merge use-submit-enseigne-order.ts
- [x] Type-check + build

## Verification
✅ Type-check: 0 erreurs
✅ Build: réussi (Next.js 15.5.9)
✅ Commit: 27160298 pushed sur fix/multi-bugs-2026-01
