# Variables d'environnement - Configuration Vérone Back Office

**Version** : 1.0.0
**Dernière mise à jour** : 2025-11-14

---

## Vue d'ensemble

Ce document répertorie toutes les variables d'environnement utilisées dans l'application Vérone Back Office. Les variables sont organisées par catégorie et documentées avec leur utilité, leur format et leur criticité.

---

## 📦 Structure des fichiers

```
/
├── .env.example       # Template avec toutes les variables (commit)
├── .env.local         # Valeurs réelles locales (NEVER commit)
└── .env.production    # Valeurs production (Vercel)
```

**Règle d'or** : **JAMAIS commit .env.local** (déjà dans .gitignore)

---

## 🔑 Variables critiques

### Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- **NEXT_PUBLIC_SUPABASE_URL** : URL projet Supabase (safe côté client)
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** : Clé anonyme (safe côté client, RLS protège)
- **SUPABASE_SERVICE_ROLE_KEY** : Clé admin (⚠️ JAMAIS côté client, bypass RLS)

**Où trouver** : [Supabase Dashboard](https://app.supabase.com) → Project Settings → API

---

### Packlink Shipping API

```bash
PACKLINK_API_KEY=your_packlink_api_key_here
```

- **PACKLINK_API_KEY** : Clé API Packlink PRO pour expéditions automatisées
- **Criticité** : Haute (accès API externe payante)
- **Où trouver** : [Packlink Dashboard](https://pro.packlink.com/private/settings/api)

**Historique** : API key externalisée le 2025-10-20 (était hardcoded avant)

---

## 📦 Packlink - Adresse expéditeur Vérone SASU

Variables pour pré-remplir automatiquement l'adresse expéditeur dans les formulaires d'expédition Packlink.

```bash
NEXT_PUBLIC_VERONE_SENDER_NAME="Vérone"
NEXT_PUBLIC_VERONE_SENDER_SURNAME="Collections"
NEXT_PUBLIC_VERONE_SENDER_EMAIL="expedition@veronecollections.fr"
NEXT_PUBLIC_VERONE_SENDER_PHONE="+33123456789"
NEXT_PUBLIC_VERONE_SENDER_STREET1="[Votre adresse complète]"
NEXT_PUBLIC_VERONE_SENDER_CITY="[Ville]"
NEXT_PUBLIC_VERONE_SENDER_ZIP="[Code postal]"
NEXT_PUBLIC_VERONE_SENDER_COUNTRY="FR"
```

### Utilisation

Ces variables sont automatiquement chargées dans le formulaire `PacklinkShipmentForm` pour pré-remplir la section "from" (expéditeur).

**Où modifier** :

1. Fichier `.env.local` (développement local)
2. Variables Vercel (production) : [Vercel Dashboard](https://vercel.com) → Project Settings → Environment Variables

**Validation** :

- Toutes les variables doivent être renseignées
- `NEXT_PUBLIC_VERONE_SENDER_COUNTRY` doit être un code ISO-2 (FR, ES, IT, etc.)
- `NEXT_PUBLIC_VERONE_SENDER_PHONE` doit inclure l'indicatif (+33 pour France)

**Exemple complet** :

```bash
NEXT_PUBLIC_VERONE_SENDER_NAME="Vérone"
NEXT_PUBLIC_VERONE_SENDER_SURNAME="Collections"
NEXT_PUBLIC_VERONE_SENDER_EMAIL="expedition@veronecollections.fr"
NEXT_PUBLIC_VERONE_SENDER_PHONE="+33612345678"
NEXT_PUBLIC_VERONE_SENDER_STREET1="123 Rue de la Décoration"
NEXT_PUBLIC_VERONE_SENDER_CITY="Paris"
NEXT_PUBLIC_VERONE_SENDER_ZIP="75001"
NEXT_PUBLIC_VERONE_SENDER_COUNTRY="FR"
```

---

## 🔌 Intégrations tierces

### Google Merchant Center

```bash
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL="google-merchant-verone@your-project.iam.gserviceaccount.com"
GOOGLE_MERCHANT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GOOGLE_MERCHANT_PRIVATE_KEY_ID="abc123..."
GOOGLE_MERCHANT_CLIENT_ID="123456789012345678901"
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
```

**Documentation complète** : `docs/guides/GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md`

### Abby Facturation

```bash
ABBY_API_KEY=your_abby_api_key_here
ABBY_API_URL=https://api.abby.fr/v1
ABBY_WEBHOOK_SECRET=your_webhook_secret_here
```

### REF Tools

```bash
REF_API_KEY=ref-your-api-key-here
```

---

## 🚀 Feature Flags

Variables pour activer/désactiver modules par phase de déploiement.

```bash
# Phase 1: Dashboard + Profiles + Catalogue
NEXT_PUBLIC_PHASE_1_ENABLED=true
NEXT_PUBLIC_DASHBOARD_ENABLED=true
NEXT_PUBLIC_PROFILES_ENABLED=true
NEXT_PUBLIC_CATALOGUE_ENABLED=true

# Phase 2: Stocks + Sourcing + Commandes
NEXT_PUBLIC_PHASE_2_ENABLED=false
NEXT_PUBLIC_STOCKS_ENABLED=false
NEXT_PUBLIC_SOURCING_ENABLED=false
NEXT_PUBLIC_COMMANDES_ENABLED=false

# Phase 3: Interactions + Canaux + Contacts
NEXT_PUBLIC_PHASE_3_ENABLED=false
NEXT_PUBLIC_INTERACTIONS_ENABLED=false
NEXT_PUBLIC_CANAUX_VENTE_ENABLED=false
NEXT_PUBLIC_CONTACTS_ENABLED=false
```

---

## 🛠️ Développement

### Node Options

```bash
NODE_OPTIONS="--no-deprecation"
NEXT_SUPPRESS_STRICT_MODE_WARNINGS=1
```

Supprime warnings console pour environnement dev plus propre.

### URL Application

```bash
NEXT_PUBLIC_APP_URL=https://verone.com
```

---

## 📖 Bonnes pratiques

### Sécurité

1. **JAMAIS commit .env.local**
2. **Variables sensibles** : Toujours préfixer `NEXT_PUBLIC_` SEULEMENT si nécessaire côté client
3. **Rotation keys** : Regénérer clés API tous les 6 mois minimum
4. **Vercel** : Variables production séparées dans dashboard Vercel

### Nommage

- `NEXT_PUBLIC_*` : Exposé côté client (safe)
- Sans préfixe : Server-side uniquement (secret)
- `*_URL` : URLs endpoints
- `*_KEY` : Clés API/secrets
- `*_TOKEN` : Tokens authentification

### Validation

Ajouter validation Zod dans `src/lib/env.ts` :

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  PACKLINK_API_KEY: z.string().min(1),
  // ...
});

export const env = envSchema.parse(process.env);
```

---

## 🔄 Changelog

- **2025-11-14** : Ajout variables adresse expéditeur Vérone SASU (Packlink)
- **2025-10-20** : Externalisation PACKLINK_API_KEY (security fix)
- **2025-09-15** : Ajout Google Merchant Center variables
- **2025-08-01** : Création document initial

---

**Questions** : Contacter l'équipe technique ou consulter `.env.example`
