# CONFIGURATION DNS RESEND - notifications.veronecollections.fr

## ✅ Domaine créé sur Resend
- **Domaine**: notifications.veronecollections.fr
- **Région**: Ireland (eu-west-1)
- **Status**: En attente de validation DNS

## 📋 DNS RECORDS À AJOUTER

### 1. DKIM (Domain Verification) - OBLIGATOIRE

**Objectif**: Vérifier que vous possédez le domaine et signer les emails

| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | `resend._domainkey.notifications` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCxBWxJLdBDftAwWhgN3JsAp0opOjZdnTaryqDFeYN53KM+stThUOeyMLL8DF92zqw7wqSHug6zcJxC7Tz/OgZAw/OKSmY5YECU3vInUB8s79/LJdp+RJewmZ6lUV/VM8EB/9CwuQIiX6Egw5BqA5X3wPtH6X7cdSTBL1SjT1daZQIDAQAB` | Auto |

### 2. SPF (Enable Sending) - OBLIGATOIRE

**Objectif**: Autoriser Amazon SES à envoyer des emails depuis votre domaine

#### 2.1 MX Record

| Type | Name | Content | TTL | Priority |
|------|------|---------|-----|----------|
| MX | `send.notifications` | `feedback-smtp.eu-west-1.amazonses.com` | 3600 | 10 |

#### 2.2 TXT Record

| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | `send.notifications` | `v=spf1 include:amazonses.com ~all` | 3600 |

### 3. DMARC (Optional but RECOMMENDED)

**Objectif**: Politique de sécurité email (reporting)

| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Auto |

---

## 🔧 OÙ AJOUTER CES RECORDS

### Si vous utilisez Cloudflare (recommandé):

1. Allez sur https://dash.cloudflare.com
2. Sélectionnez le domaine `veronecollections.fr`
3. Allez dans **DNS** → **Records**
4. Cliquez sur **Add record** pour chaque ligne du tableau ci-dessus

**Exemple pour DKIM**:
- Type: `TXT`
- Name: `resend._domainkey.notifications` (Cloudflare ajoutera automatiquement `.veronecollections.fr`)
- Content: `p=MIGfMA0GC...` (copier-coller le contenu exact)
- TTL: Auto

**Exemple pour MX (SPF)**:
- Type: `MX`
- Name: `send.notifications`
- Mail server: `feedback-smtp.eu-west-1.amazonses.com`
- Priority: `10`
- TTL: Auto (ou 3600)

### Si vous utilisez un autre provider:

Consultez: https://resend.com/docs/knowledge-base/hostinger (tutoriel générique)

---

## ⏱️ DÉLAI DE PROPAGATION

- **Temps de validation**: 5-30 minutes généralement
- **Propagation DNS**: Jusqu'à 24-48h maximum (rare)
- **Vérification**: Resend vérifie automatiquement toutes les 15 minutes

---

## ✅ APRÈS AJOUT DES RECORDS

1. Retourner sur https://resend.com/domains
2. Cliquer sur le domaine `notifications.veronecollections.fr`
3. Cliquer sur **"I've added the records"**
4. Attendre la validation (symbole ✓ vert)

---

## 📧 EMAILS D'ENVOI AUTORISÉS

Une fois validé, vous pourrez envoyer depuis:

```
contact@notifications.veronecollections.fr
support@notifications.veronecollections.fr
orders@notifications.veronecollections.fr
... (n'importe quelle adresse @notifications.veronecollections.fr)
```

**MAIS PAS depuis**:
- `romeo@veronecollections.fr` ❌ (domaine racine non vérifié)
- `contact@verone.fr` ❌ (autre domaine)

**SOLUTION**: Utiliser `FROM: romeo@notifications.veronecollections.fr` dans le code

---

## 🔄 CORRECTIONS .env.local REQUISES

```bash
# Exécuter ces commandes dans le terminal:
sed -i '' 's/contact@verone.fr/romeo@notifications.veronecollections.fr/g' apps/linkme/.env.local apps/back-office/.env.local
sed -i '' 's/veronebyromeo@gmail.com/romeo@notifications.veronecollections.fr/g' apps/linkme/.env.local apps/back-office/.env.local
```

**OU** modifier manuellement:

```bash
# apps/linkme/.env.local et apps/back-office/.env.local
RESEND_FROM_EMAIL=romeo@notifications.veronecollections.fr
RESEND_REPLY_TO=romeo@veronecollections.fr  # Peut rester sur domaine principal
```

---

## 📊 SUIVI

Dashboard Resend: https://resend.com/domains
API Keys: https://resend.com/api-keys
Logs: https://resend.com/logs

