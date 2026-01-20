# Integration Resend (Emails)

**Derniere mise a jour:** 2026-01-19

Service d'envoi d'emails pour formulaires LinkMe.

---

## Status

| Element | Valeur                       |
| ------- | ---------------------------- |
| Status  | **ACTIF** (LinkMe)           |
| Usage   | Formulaires, Confirmations   |
| Package | `apps/linkme/src/lib/email/` |

---

## Mode Degrade (Sans Config)

Le systeme fonctionne **sans configuration email**:
- Formulaires acceptes et sauvegardes en base
- Notifications in-app via triggers DB
- Emails desactives (graceful degradation)
- Logs: `[API Form] Resend not configured - emails disabled`

Ideal pour: dev local, tests, staging.

---

## Configuration Production

### 1. Compte Resend

1. Creer compte: https://resend.com
2. Verifier domaine email (ex: `verone.fr`)
3. Dashboard > API Keys > Creer nouvelle cle

### 2. Variables Environnement

Ajouter dans `apps/linkme/.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=re_votre_cle_ici
RESEND_FROM_EMAIL=contact@verone.fr
RESEND_REPLY_TO=veronebyromeo@gmail.com

# URL back-office pour liens emails
NEXT_PUBLIC_BACK_OFFICE_URL=https://back-office.verone.fr
```

### 3. Redemarrer

```bash
pnpm dev:linkme
```

---

## Verification

### Test Manuel

1. Soumettre formulaire depuis LinkMe
2. Verifier logs:
   - ✅ `[API Form Confirmation] Email sent to xxx@example.com`
   - ✅ `[API Form Notification] Sent for submission xxx`
3. Verifier boite mail client
4. Verifier boite mail admin

### Test API Direct

```bash
curl -X POST http://localhost:3002/api/forms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "selection_inquiry",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+33612345678",
    "message": "Test",
    "source": "linkme"
  }'
```

---

## Emails Notification Admin

Configuration dans table `app_settings`:

```sql
-- Voir config actuelle
SELECT setting_value
FROM app_settings
WHERE setting_key = 'notification_emails';

-- Resultat
{"form_submissions": ["veronebyromeo@gmail.com"]}

-- Modifier destinataires
UPDATE app_settings
SET setting_value = '{"form_submissions": ["email1@verone.fr", "email2@verone.fr"]}'::jsonb
WHERE setting_key = 'notification_emails';
```

---

## Architecture

```
ContactForm.tsx (LinkMe)
    ↓ POST /api/forms/submit
    ├─→ INSERT form_submissions (DB)
    ├─→ POST /api/emails/form-confirmation (async)
    │       ↓ Resend.emails.send()
    │       → Email client
    └─→ POST /api/emails/form-notification (async)
            ↓ Resend.emails.send()
            → Emails admin
```

---

## Troubleshooting

### Emails non envoyes

**Logs:** `Resend not configured - emails disabled`
- Verifier `RESEND_API_KEY` dans `.env.local`
- Redemarrer serveur

**Erreur 401 Unauthorized:**
- Cle API invalide ou expiree

**Erreur 403 Forbidden:**
- Domaine `RESEND_FROM_EMAIL` non verifie
- Utiliser email test: `onboarding@resend.dev`

---

## Limites Resend

### Plan Gratuit
- 100 emails/jour
- 1 domaine verifie
- Rate limit: 2 req/s

### Plan Payant (Production)
- 50,000 emails/mois ($20/mois)
- Domaines illimites
- Rate limit: 10 req/s

---

## Securite

- ⚠️ Ne JAMAIS commiter `.env.local`
- ⚠️ Stocker `RESEND_API_KEY` dans Vercel Secrets (prod)
- ⚠️ Cles API differentes par environnement

---

## Reference

- Documentation: https://resend.com/docs
- SDK Node.js: https://resend.com/docs/send-with-nodejs
- Dashboard: https://resend.com/emails
