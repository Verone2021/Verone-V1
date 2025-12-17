---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - supabase/migrations/*rls*.sql
  - apps/back-office/src/middleware.ts
references:
  - docs/auth/rls-policies.md
  - docs/security/
  - docs/legal/
---

# Security Verone

Securite application et donnees.

## Couches de securite

| Couche | Implementation |
|--------|----------------|
| **Auth** | Supabase Auth + JWT |
| **Database** | RLS (Row Level Security) |
| **API** | Middleware Next.js |
| **Transport** | HTTPS (Vercel) |

## Row Level Security (RLS)

**239 policies** actives.

Principe: chaque requete est filtree par `organisation_id` du user.

```sql
-- Exemple politique
CREATE POLICY "Users can only see their org's products"
ON products FOR SELECT
USING (organisation_id = auth.jwt() -> 'user_metadata' ->> 'organisation_id');
```

## Secrets

| Secret | Stockage |
|--------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (serveur only) |
| `GOOGLE_CLIENT_SECRET` | Vercel env |
| API keys | Vercel env |

**JAMAIS** dans le code ou `.env` commite.

## RGPD

- Donnees users isolees par organisation
- Droit a l'oubli: suppression cascade
- Logs activite (Owner-only)

Voir [NOTICE-TRACKING-RGPD.md](../legal/NOTICE-TRACKING-RGPD.md).

## Audit

- `.github/workflows/audit.yml` - Audits npm automatiques
- Dependabot actif (GitHub)

## Bonnes pratiques

- Ne jamais logger de secrets
- Valider inputs cote serveur
- Utiliser parametres SQL (pas de concatenation)
- Verifier roles avant actions sensibles

## Liens

- [Auth](./04-auth.md) - Roles, permissions
- [Database](./03-database.md) - RLS details

---

*Derniere verification: 2025-12-17*
