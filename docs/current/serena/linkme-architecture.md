> **Source de verite** : `docs/current/linkme/GUIDE-COMPLET-LINKME.md`
> Ce fichier est conserve comme resume rapide. En cas de contradiction, le guide unifie fait foi.

# Architecture LinkMe

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- apps/linkme/src/
- supabase/migrations/20251201\*.sql
  Owner: Romeo Dos Santos
  Created: 2025-12-01
  Updated: 2026-01-10

---

## Vue d'ensemble

LinkMe est la plateforme d'affiliation de Verone. Elle permet aux enseignes et organisations independantes de creer des selections de produits et de percevoir des commissions sur les ventes.

---

## Architecture a 2 Tables

```
AUTHENTIFICATION
┌─────────────────────────────────────────────────────────────┐
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
DONNEES BUSINESS
┌─────────────────────────────────────────────────────────────┐
│  linkme_affiliates (= Profil Business)                     │
│    - enseigne_id XOR organisation_id (contrainte)          │
│    - default_margin_rate (marge par defaut %)              │
│    - linkme_commission_rate (commission plateforme %)      │
│    ↓                                                        │
│  linkme_selections (affiliate_id → linkme_affiliates.id)   │
│    ↓                                                        │
│  linkme_selection_items                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Tables Principales

### user_app_roles (Authentification)

- **Role** : Definit QUI peut se connecter a LinkMe
- **Colonnes cles** : user_id, app='linkme', role, enseigne_id, organisation_id
- **Roles actifs** : `enseigne_admin`, `org_independante`

### linkme_affiliates (Profil Business)

- **Role** : Contient les donnees metier (marges, commissions, profil public)
- **Colonnes cles** :
  - `enseigne_id` XOR `organisation_id` (exactement un des deux)
  - `default_margin_rate` : Marge par defaut quand user ajoute produit
  - `linkme_commission_rate` : Commission plateforme sur ventes
  - `display_name`, `slug`, `logo_url`, `bio` : Profil public

---

## Logique de Liaison

```typescript
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

---

## Triggers Automatiques

### trg_create_linkme_profile_enseigne

- **Evenement** : AFTER INSERT ON enseignes
- **Action** : Cree automatiquement un profil linkme_affiliates avec :
  - default_margin_rate = 15%
  - linkme_commission_rate = 5%
  - status = 'active'

---

## Terminologie

| Terme                  | Signification                                           |
| ---------------------- | ------------------------------------------------------- |
| **Affilie**            | Profil business d'une enseigne/organisation dans LinkMe |
| **Utilisateur LinkMe** | Personne avec un user_app_roles (app='linkme')          |
| **Selection**          | Mini-boutique creee par un affilie avec des produits    |
| **Enseigne**           | Chaine de magasins (ex: Pokawa)                         |
| **Org independante**   | Organisation sans enseigne parent                       |

---

## Regles Absolues

1. **JAMAIS** acceder directement aux affiliates sans passer par user_app_roles
2. **TOUJOURS** verifier la contrainte XOR (enseigne_id OU organisation_id)
3. **JAMAIS** supposer qu'un user a un linkme_affiliates.user_id (colonne supprimee)

---

## References

- `apps/linkme/src/contexts/AuthContext.tsx` - Authentification
- `apps/linkme/src/lib/hooks/use-user-selection.ts` - Lien user→affiliate
- `docs/current/serena/linkme-commissions.md` - Calcul commissions
