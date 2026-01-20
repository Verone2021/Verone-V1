# Testing Scripts

Scripts de test manuels et utilitaires pour valider les fonctionnalités.

## test-form-api.sh

Script de test des API de formulaires (LinkMe).

**Usage**:
```bash
cd /Users/romeodossantos/verone-back-office-V1
./scripts/testing/test-form-api.sh
```

**Prérequis**:
- LinkMe doit être démarré sur port 3002 (`npm run dev` depuis apps/linkme)
- PostgreSQL et Supabase doivent être accessibles

**Tests effectués**:
1. Soumission formulaire selection_inquiry
2. Soumission formulaire product_inquiry
3. Soumission SAV urgent
4. Validation champs manquants (erreur attendue)
5. Validation type formulaire invalide (erreur attendue)
6. Notification email manuelle

**Output attendu**:
- Tests 1-3: `✓ Success` avec submission IDs
- Tests 4-5: `✓ Validation working (expected error)`
- Test 6: `✓ Success` ou Skipped si pas de submission ID

**Configuration**:
- BASE_URL: `http://localhost:3002` (LinkMe)
- Endpoints testés:
  - POST `/api/forms/submit`
  - POST `/api/emails/form-confirmation`
  - POST `/api/emails/form-notification`

**Historique**:
- Déplacé depuis root/ vers scripts/testing/ le 2026-01-20
- Ancienne localisation: `/test-form-api.sh`
