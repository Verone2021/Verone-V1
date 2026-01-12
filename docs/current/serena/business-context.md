# Contexte Business Verone

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- README.md
- docs/current/business-rules-linkme.md
  Owner: Romeo Dos Santos
  Created: 2025-10-01
  Updated: 2026-01-10

---

## Mission & Objectifs

**Verone** : Entreprise specialisee decoration et mobilier d'interieur haut de gamme.

### MVP Prioritaire : Catalogue Partageable

- **Probleme** : Creation catalogues clients manuelle et chronophage
- **Solution** : Interface admin → liens partageables + PDF branded + feeds auto
- **Impact Business** : -70% temps creation catalogues (objectif critique)
- **ROI Attendu** : 15% conversion catalogue → devis, 99% uptime

---

## SLOs Business Critiques

| Metrique            | Objectif | Contexte              |
| ------------------- | -------- | --------------------- |
| Dashboard load      | < 2s     | Interface quotidienne |
| Feeds generation    | < 10s    | Feeds Meta/Google     |
| PDF export          | < 5s     | Catalogues clients    |
| Search response     | < 1s     | Recherche produits    |
| Collection creation | < 3min   | Workflow commercial   |
| Uptime              | 99.5%    | Disponibilite minimum |
| Error rate          | < 1%     | Taux erreurs          |

---

## Architecture Modulaire

1. **Catalogue** (MVP Phase 1) → Gestion produits, conditionnements, exports
2. **Stock** → Disponibilites, approvisionnements, alertes
3. **Commandes** → Workflow commercial, devis, facturation
4. **Facturation** → Billing, comptabilite (Qonto)
5. **CRM** → Clients, prospects, segmentation
6. **Integrations** → Brevo, Meta/Google, partenaires

---

## Specificites UX Verone

- **Mobile-First** : >40% consultations catalogues sur mobile
- **Premium Feel** : Design haut de gamme, attention details
- **Performance** : Fluidite critique pour adoption equipe
- **Branding** : Coherence couleurs/logo Verone sur tous exports

---

## Integrations Externes Critiques

| Integration           | Usage                       |
| --------------------- | --------------------------- |
| **Qonto**             | Facturation, comptabilite   |
| **Meta/Google Feeds** | Publicites automatisees CSV |
| **Supabase**          | Database + Auth + Storage   |
| **Vercel**            | Deploiement                 |

---

## Non-Goals

- Details techniques des integrations (voir `docs/current/integrations.md`)
- Regles metier LinkMe specifiques (voir `linkme-commissions.md`)

---

## References

- `docs/current/integrations.md` - Details integrations
- `docs/current/serena/linkme-commissions.md` - Commissions LinkMe
