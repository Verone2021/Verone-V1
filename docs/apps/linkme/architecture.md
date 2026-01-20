# Architecture LinkMe - Décembre 2025

## Vue d'ensemble

LinkMe est la plateforme d'affiliation de Vérone. Elle permet aux enseignes et organisations indépendantes de créer des sélections de produits et de percevoir des commissions sur les ventes.

## Architecture à 2 Tables

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTIFICATION                         │
├─────────────────────────────────────────────────────────────┤
│  auth.users                                                 │
│    ↓                                                        │
│  user_app_roles (app='linkme')                             │
│    - user_id → auth.users                                  │
│    - role: enseigne_admin | org_independante               │
│    - enseigne_id OU organisation_id                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
              JOIN via enseigne_id OU organisation_id
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    DONNÉES BUSINESS                         │
├─────────────────────────────────────────────────────────────┤
│  linkme_affiliates (= Profil Business)                     │
│    - enseigne_id XOR organisation_id (contrainte)          │
│    - default_margin_rate (marge par défaut %)              │
│    - linkme_commission_rate (commission plateforme %)      │
│    - display_name, slug, logo_url, bio (profil public)     │
│    ↓                                                        │
│  linkme_selections (affiliate_id → linkme_affiliates.id)   │
│    ↓                                                        │
│  linkme_selection_items                                    │
└─────────────────────────────────────────────────────────────┘
```

## Tables Principales

### user_app_roles (Authentification)

- **Rôle** : Définit QUI peut se connecter à LinkMe
- **Colonnes clés** : user_id, app='linkme', role, enseigne_id, organisation_id
- **Rôles actifs** : `enseigne_admin`, `org_independante`
- **Rôles gelés** : `organisation_admin`, `client`

### linkme_affiliates (Profil Business)

- **Rôle** : Contient les données métier (marges, commissions, profil public)
- **Colonnes clés** :
  - `enseigne_id` XOR `organisation_id` (exactement un des deux)
  - `default_margin_rate` : Marge par défaut quand user ajoute produit
  - `linkme_commission_rate` : Commission plateforme sur ventes
  - `display_name`, `slug`, `logo_url`, `bio` : Profil public

### Colonnes supprimées (2025-12-05)

- ❌ `user_id` - Jamais utilisé, lien via enseigne_id/organisation_id
- ❌ `max_margin_rate` - N'existe pas dans le modèle business

## Logique de Liaison

```typescript
// Dans use-user-selection.ts
// Le lien user → affiliate se fait via enseigne_id/organisation_id

if (linkMeRole.role === 'enseigne_admin' && linkMeRole.enseigne_id) {
  query = query.eq('enseigne_id', linkMeRole.enseigne_id);
} else if (
  linkMeRole.role === 'org_independante' &&
  linkMeRole.organisation_id
) {
  query = query.eq('organisation_id', linkMeRole.organisation_id);
}
```

## Logique Marge

```
Quand l'utilisateur ajoute un produit à sa sélection :
1. Marge proposée = linkme_affiliates.default_margin_rate (ex: 15%)
2. L'utilisateur peut modifier cette marge
3. Si marge choisie < marge max du produit → utiliser marge produit
```

## Triggers Automatiques

### trg_create_linkme_profile_enseigne

- **Événement** : AFTER INSERT ON enseignes
- **Action** : Crée automatiquement un profil linkme_affiliates avec :
  - default_margin_rate = 15%
  - linkme_commission_rate = 5%
  - status = 'active'

## Policies RLS

Les policies utilisent `user_app_roles` pour déterminer l'accès :

```sql
-- Accès au profil affilié
EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = auth.uid()
    AND uar.app = 'linkme'
    AND uar.is_active = true
    AND (
      (uar.enseigne_id = linkme_affiliates.enseigne_id) OR
      (uar.organisation_id = linkme_affiliates.organisation_id)
    )
)
```

## Fichiers Clés

### Backend/Database

- `supabase/migrations/20251201175211_create_user_app_roles.sql`
- `supabase/migrations/20251205*_cleanup_linkme_affiliates*.sql`

### Frontend App LinkMe

- `apps/linkme/src/contexts/AuthContext.tsx` - Authentification
- `apps/linkme/src/lib/hooks/use-user-selection.ts` - Lien user→affiliate

### Frontend Back-Office

- `apps/back-office/src/app/canaux-vente/linkme/components/LinkMeSidebar.tsx`
- `apps/back-office/src/app/canaux-vente/linkme/components/SelectionsSection.tsx`

## Terminologie

| Terme                  | Signification                                           |
| ---------------------- | ------------------------------------------------------- |
| **Affilié**            | Profil business d'une enseigne/organisation dans LinkMe |
| **Utilisateur LinkMe** | Personne avec un user_app_roles (app='linkme')          |
| **Sélection**          | Mini-boutique créée par un affilié avec des produits    |
| **Enseigne**           | Chaîne de magasins (ex: Pokawa)                         |
| **Org indépendante**   | Organisation sans enseigne parent                       |

## Audit 2025-12-05

### Problèmes résolus

1. ✅ Supprimé donnée orpheline "Atelier Déco Design"
2. ✅ Supprimé colonne `user_id` (inutilisée)
3. ✅ Supprimé colonne `max_margin_rate` (hors modèle)
4. ✅ Mis à jour policies RLS pour utiliser enseigne_id/organisation_id
5. ✅ Ajouté contrainte `chk_enseigne_xor_org`
6. ✅ Créé trigger auto-création profil pour enseignes
