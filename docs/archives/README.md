# Archives Documentation Vérone

**Date archivage**: 2025-12-16
**Raison**: Nettoyage documentation obsolète post-migration Turborepo Phase 4

---

## Structure Archives

```
docs/archives/
├── audits-2025-10/           # Audits octobre 2025 (Phase 1-3)
├── audits-2025-11/           # Audits novembre 2025 (Migration Turborepo)
│   ├── migration/           # Config MCP, Turborepo
│   ├── database/            # Audits Supabase, triggers, RLS
│   └── composants/          # Audits UI, types, stock
├── migration-turborepo/      # Plans et audits migration Turborepo
├── migration-cost-price/     # Migration suppression cost_price
├── design-decisions/         # Décisions architecture archivées
│   └── pricing-2025/        # Comparaison options pricing
└── README.md                 # Ce fichier
```

---

## Contenu Archives

### audits-2025-10/

Rapports Phase 1-3 avant migration Turborepo:

- Audits ESLint, UX/UI initiaux
- Rapports échantillons MVP
- Audits module stock

### audits-2025-11/

Documentation migration Turborepo Phase 4:

- **migration/**: Configuration MCP, audit Turborepo
- **database/**: Audits Supabase (955 problèmes), triggers, RLS
- **composants/**: Audits types, auth, alertes stock

### migration-turborepo/

Plans de migration Turborepo terminée (47/47 problèmes résolus):

- MIGRATION-TURBOREPO-TODO.md
- AUDIT-MIGRATION-TURBOREPO.md

### migration-cost-price/

Documentation suppression champ cost_price (octobre 2025):

- COST_PRICE_SUPPRESSION_SUMMARY.md

### design-decisions/

Décisions architecture historiques:

- **pricing-2025/**: Comparaison options pricing (Option 2 retenue)
- PLAN-B-PENNYLANE.md: Plan backup facturation

---

## Politique Archives

- **Lecture seule**: Ces fichiers ne doivent PAS être modifiés
- **Référence historique**: Consulter pour comprendre l'évolution du projet
- **Pas de suppression**: Conserver pour traçabilité

---

## Documentation Active

La documentation active se trouve dans:

- `docs/architecture/` - Architecture actuelle
- `docs/database/` - Schema et migrations
- `docs/guides/` - Guides développement
- `docs/business-rules/` - Règles métier

**Source de vérité**: `CLAUDE.md` (racine projet)
