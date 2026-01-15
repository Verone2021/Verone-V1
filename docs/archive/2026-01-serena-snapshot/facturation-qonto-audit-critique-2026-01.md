# Facturation Qonto - Regles Critiques (2026-01)

## 5 REGLES ABSOLUES

1. **JAMAIS `autoFinalize: true`** - Toujours creer en brouillon
2. **Finalisation = IRREVERSIBLE** - Numero facture brule
3. **SEUL L'UTILISATEUR** finalise via UI avec confirmation
4. **PDF disponible APRES finalisation** uniquement
5. **Fallback PDF**: pdf_url → attachment_id (URL 30 min)

## Endpoints Critiques

| Action        | Endpoint                             | Methode |
| ------------- | ------------------------------------ | ------- |
| Creer facture | `/api/qonto/invoices`                | POST    |
| PDF facture   | `/api/qonto/invoices/[id]/pdf`       | GET     |
| Finaliser     | `/api/qonto/invoices/[id]/finalize`  | POST    |
| Marquer payee | `/api/qonto/invoices/[id]/mark-paid` | POST    |
| Rapprochement | `/api/qonto/invoices/[id]/reconcile` | POST    |

## Fichiers a NE JAMAIS MODIFIER sans backup

- `packages/@verone/integrations/src/qonto/client.ts`
- `apps/back-office/src/app/api/qonto/invoices/[id]/pdf/route.ts`
- `apps/back-office/src/app/api/qonto/invoices/route.ts`

## Variables Env Requises

```bash
QONTO_AUTH_MODE=api_key
QONTO_ORGANIZATION_ID=qonto_org_xxx
QONTO_API_KEY=sk_live_xxx
```

## Si PDF ne marche plus

1. Verifier facture finalisee (status !== 'draft')
2. Verifier pdf_url existe dans reponse API
3. Si pas pdf_url, verifier attachment_id + getAttachment()
4. Logs: `[API Qonto Invoice PDF]` dans console

## Documentation Complete

→ `docs/current/AUDIT-FACTURATION-QONTO-2026-01.md`

---

Date: 2026-01-09
