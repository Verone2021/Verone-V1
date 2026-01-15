# Configuration Resend pour le Système de Formulaires

## Vue d'ensemble

Le système de gestion des formulaires (BO-FORM-001) envoie des emails automatiques via [Resend](https://resend.com) :
- **Confirmation client** : Email envoyé au client après soumission
- **Notification admin** : Email envoyé à l'équipe pour chaque nouvelle soumission

## Mode Dégradé (Sans Configuration)

Le système fonctionne **sans configuration email** :
- Les formulaires sont acceptés et sauvegardés en base
- Les notifications in-app fonctionnent via triggers DB
- Les emails sont simplement désactivés (graceful degradation)
- Logs : `[API Form *] Resend not configured - emails disabled`

Idéal pour :
- Développement local
- Tests
- Environnements staging

## Configuration Production

### 1. Créer un compte Resend

1. Aller sur https://resend.com
2. Créer un compte
3. Vérifier votre domaine email (ex: `verone.fr`)

### 2. Générer une clé API

1. Dashboard Resend > API Keys
2. Créer une nouvelle clé
3. Copier la clé (format : `re_...`)

### 3. Configurer les variables d'environnement

Ajouter dans `apps/linkme/.env.local` :

```bash
# ---------- RESEND EMAIL SERVICE ----------
# API Key pour l'envoi d'emails via Resend
# Créer une clé sur https://resend.com/api-keys
RESEND_API_KEY=re_votre_cle_ici

# Email d'envoi par défaut (doit être vérifié dans Resend)
RESEND_FROM_EMAIL=contact@verone.fr

# Email de réponse par défaut
RESEND_REPLY_TO=veronebyromeo@gmail.com

# URL du back-office pour les liens dans les emails de notification
NEXT_PUBLIC_BACK_OFFICE_URL=https://back-office.verone.fr
```

### 4. Redémarrer le serveur

```bash
pnpm dev:linkme
```

## Vérification

### Test Manuel

1. Soumettre un formulaire depuis LinkMe (ex: sélection publique)
2. Vérifier les logs serveur :
   - ✅ `[API Form Confirmation] Email sent to xxx@example.com`
   - ✅ `[API Form Notification] Sent for submission xxx - 1 emails`
3. Vérifier la boîte mail du client
4. Vérifier la boîte mail admin (`veronebyromeo@gmail.com` par défaut)

### Test API Direct

```bash
# Test endpoint de soumission
curl -X POST http://localhost:3002/api/forms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "selection_inquiry",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+33612345678",
    "message": "Message de test",
    "source": "linkme"
  }'

# Réponse attendue
{
  "success": true,
  "submissionId": "uuid-here",
  "message": "Votre message a été envoyé avec succès"
}
```

## Gestion des Emails de Notification

Les emails de notification admin sont configurés dans la table `app_settings` :

```sql
-- Voir la configuration actuelle
SELECT setting_value
FROM app_settings
WHERE setting_key = 'notification_emails';

-- Résultat attendu
{
  "form_submissions": ["veronebyromeo@gmail.com"]
}
```

Pour ajouter/modifier les destinataires :
1. Via le back-office : `/parametres/notifications` (Phase 6 - à implémenter)
2. Via SQL direct :
```sql
UPDATE app_settings
SET setting_value = '{"form_submissions": ["email1@verone.fr", "email2@verone.fr"]}'::jsonb
WHERE setting_key = 'notification_emails';
```

## Troubleshooting

### Emails non envoyés

**Symptôme** : Logs `Resend not configured - emails disabled`

**Solution** :
1. Vérifier que `RESEND_API_KEY` est définie dans `.env.local`
2. Redémarrer le serveur dev

**Symptôme** : Erreur 401 Unauthorized

**Solution** :
1. Vérifier que la clé API est valide
2. Vérifier que la clé n'a pas expiré dans Resend Dashboard

**Symptôme** : Erreur 403 Forbidden

**Solution** :
1. Vérifier que le domaine `RESEND_FROM_EMAIL` est vérifié dans Resend
2. Utiliser l'email de test Resend : `onboarding@resend.dev`

### Logs utiles

```bash
# Grep les logs email dans le terminal dev
# Confirmation client
grep "Form Confirmation"

# Notification admin
grep "Form Notification"

# Erreurs
grep "error:" | grep -i email
```

## Limites Resend

### Plan Gratuit
- 100 emails/jour
- 1 domaine vérifié
- Rate limit : 2 requêtes/seconde

### Plan Payant (recommandé production)
- 50,000 emails/mois à partir de $20/mois
- Domaines illimités
- Rate limit : 10 requêtes/seconde
- Support prioritaire

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
            → Emails admin (from app_settings)
```

## Sécurité

⚠️ **IMPORTANT** :
- Ne JAMAIS commiter `.env.local` dans Git
- Stocker `RESEND_API_KEY` dans les secrets Vercel (production)
- Utiliser des clés API différentes par environnement (dev/staging/prod)
- Restreindre les permissions de la clé API si possible

## Référence

- Documentation Resend : https://resend.com/docs
- SDK Node.js : https://resend.com/docs/send-with-nodejs
- Dashboard : https://resend.com/emails
