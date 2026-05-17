# Dev Report — HaveIBeenPwned password protection (NOT applicable Free Plan)

**Date** : 2026-04-30
**Contexte** : suite à la PR #840 (BO-SEC-CRITICAL-001 stop-the-bleed), tentative d'activer `password_hibp_enabled` via l'API Management Supabase pour réduire l'advisor `auth_leaked_password_protection: 1 → 0`.

## Tentative

```bash
TOKEN=$(grep SUPABASE_ACCESS_TOKEN apps/linkme/.env.local | cut -d= -f2)
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/aorroydfjsrygmosnzrl/config/auth" \
  -d '{"password_hibp_enabled": true}'
```

## Réponse

```json
{
  "message": "Configuring leaked password protection via HaveIBeenPwned.org is available on Pro Plans and up."
}
```

## Conclusion

**`password_hibp_enabled` est gated par Supabase Pro Plan** (29 USD/mois). Verone est sur Free Plan (DB 246 MB / 500 MB max, Storage 367 MB / 1 GB max).

→ L'advisor `auth_leaked_password_protection: 1` restera à 1 tant que Verone reste sur Free Plan. C'est un **faux positif acceptable** dans notre contexte.

## Action

- **Aucune action SQL requise** — la baseline `auth_leaked_password_protection: 1` reflète déjà l'état accepté.
- Si upgrade Pro Plan plus tard : appeler la même API PATCH pour activer.
- Documentation laissée pour référence future.

## Référence

- API Supabase Management : `https://supabase.com/docs/reference/api/v1-update-a-project-s-auth-config`
- Plan Pro : `https://supabase.com/pricing`
