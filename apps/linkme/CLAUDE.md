# LinkMe - Instructions Claude Code

## Description

Plateforme commissions et selections affilies - Port 3002

## Commandes

```bash
npm run dev:linkme    # Dev uniquement linkme
npm run build:linkme  # Build linkme
```

---

## Structure

```
apps/linkme/src/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/            # Routes authentification
│   ├── (main)/            # Routes principales
│   └── (public)/          # Routes publiques (selections)
├── components/            # Composants LinkMe
├── contexts/              # AuthContext, SelectionContext
├── lib/hooks/             # Hooks metier
└── types/                 # Types specifiques
```

---

## Pages Principales

| Route          | Description         |
| -------------- | ------------------- |
| `/dashboard`   | Dashboard affilie   |
| `/selections`  | Gestion selections  |
| `/commandes`   | Commandes affiliees |
| `/commissions` | Suivi commissions   |
| `/p/[slug]`    | Selection publique  |

---

## Architecture Auth

```
auth.users
    ↓
user_app_roles (app='linkme')
    ↓ via enseigne_id OU organisation_id
linkme_affiliates
    ↓
linkme_selections
```

### Roles

- `enseigne_admin` : Admin d'une enseigne
- `org_independante` : Organisation independante

---

## Calcul Commissions

### Produits CATALOGUE

```typescript
// L'affilie GAGNE une marge
commission = base_price_ht × (margin_rate / 100) × quantity
```

### Produits AFFILIE

```typescript
// Verone DEDUIT sa commission
payout = prix_vente - (prix_vente × commission_rate / 100)
```

### Formule Correcte (Taux de Marque)

```typescript
// CORRECT : margin_rate s'applique sur selling_price_ht
retrocession = selling_price_ht × (margin_rate / 100) × quantity
```

---

## Regles Critiques

1. **JAMAIS** confondre taux de marge et taux de marque
2. **TOUJOURS** utiliser `selling_price_ht` pour calcul commission
3. **JAMAIS** acceder affiliates sans passer par user_app_roles

---

## References

- `/docs/current/serena/linkme-architecture.md`
- `/docs/current/serena/linkme-commissions.md`
