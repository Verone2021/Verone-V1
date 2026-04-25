# INDEX — Documentation restaurée

Documentation restaurée depuis git history par l'agent. Ces fichiers étaient supprimés du tronc actuel mais contiennent de l'information toujours utile (credentials, architectures historiques, plans de configuration). À valider et promouvoir vers `docs/current/` après mise à jour.

**Dernière mise à jour** : 2026-04-25

---

## Sommaire par dossier

### 1. `packlink-2025-11/` (existant, restauré antérieurement)

Documentation Packlink 2025-11 (logistique). Hors périmètre canaux de vente.

### 2. `google-merchant-2025-11/` (restauré 2026-04-25 — 9 fichiers)

Configuration et credentials Google Merchant Center.

| Fichier                                               | Statut                                                                                                                                                    | Action                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `README.md`                                           | obsolète (liens cassés)                                                                                                                                   | mettre à jour avec les chemins actuels                        |
| `GOOGLE-MERCHANT-SERVICE-ACCOUNT-CREDENTIALS.md`      | ⚠️ contient credentials Service Account (Project `make-gmail-integration-428317`, Merchant `5495521926`) — **valider que les clés sont toujours actives** | confronter avec `.env.local` actuel                           |
| `GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md`           | guide pas-à-pas                                                                                                                                           | confronter avec routes API actuelles `/api/google-merchant/*` |
| `GOOGLE-MERCHANT-DOMAIN-VERIFICATION.md`              | vérification `veronecollections.fr`                                                                                                                       | vérifier statut                                               |
| `GOOGLE-MERCHANT-INTEGRATION-PLAN-COMPLET.md`         | plan historique                                                                                                                                           | garder pour contexte                                          |
| `GOOGLE-MERCHANT-RESUME-EXECUTIF.md`                  | résumé checklist 40-50 min                                                                                                                                | mettre à jour                                                 |
| `RAPPORT-ORCHESTRATION-GOOGLE-MERCHANT-2025-11-06.md` | rapport orchestration                                                                                                                                     | confronter avec impl.                                         |
| `google-merchant-setup.md`                            | setup technique                                                                                                                                           | mettre à jour                                                 |
| `feeds-specifications-google.md`                      | spécifications feed (31 colonnes)                                                                                                                         | mettre à jour                                                 |

### 3. `meta-facebook-feeds/` (restauré 2026-04-25 — 1 fichier)

| Fichier                            | Statut                               | Action                                                |
| ---------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `feeds-specifications-facebook.md` | spécifications feed Facebook Catalog | confronter avec implémentation Meta Commerce actuelle |

**Lacune** : ⚠️ aucune doc credentials Meta Commerce ni guide configuration restaurés. À reconstituer manuellement (catalog_id, business_id, system user token sont dans `.env.local` mais non documentés).

### 4. `canaux-vente-2025/` (restauré 2026-04-25 — 7 fichiers)

| Fichier                             | Statut                                                                                                                                                                   | Action                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `README.md`                         | ⚠️ obsolète : décrit 5 canaux retail/wholesale/ecommerce/b2b/google_merchant — la réalité actuelle est LinkMe + Site Internet + Google Merchant + Meta Commerce + Manuel | réécrire d'après la cartographie 2026-04-25           |
| `AUDIT-COMPLET-LINKME-2025-12.md`   | audit historique                                                                                                                                                         | promouvoir partiellement vers `docs/current/linkme/`  |
| `AUDIT-LINKME-WORKFLOWS-2026-01.md` | audit workflows                                                                                                                                                          | promouvoir                                            |
| `PRESENTATION-LINKME-FIGMA.md`      | référence design                                                                                                                                                         | garder en restored                                    |
| `futurs-canaux.md`                  | roadmap (Instagram, Facebook, TikTok)                                                                                                                                    | mettre à jour : Meta Commerce / Instagram déjà actifs |
| `11-canaux-vente.md`                | audit BO Janvier 2026                                                                                                                                                    | promouvoir partiellement                              |
| `TEST-PLAN-REFONTE-CANAUX.md`       | plan tests                                                                                                                                                               | adapter aux changements en cours                      |

### 5. `catalogue-2025/` (restauré 2026-04-25 — 12 fichiers)

| Fichier                                                                                        | Statut                                     | Action                                                        |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `catalogue.md`                                                                                 | règles métier                              | mettre à jour                                                 |
| `README.md`, `components.md`, `hooks.md`, `workflows.md`                                       | doc module produits                        | confronter                                                    |
| `CATALOGUE-ANALYSIS-2025.md`, `COMPOSANTS-CATALOGUE.md`                                        | analyses architecture                      | garder pour contexte                                          |
| `pricing-multi-canaux-clients.md`                                                              | architecture pricing waterfall + ristourne | ⚠️ **important** — confronter avec `.claude/rules/finance.md` |
| `PRD-CATALOGUE-CURRENT.md`                                                                     | PRD catalogue                              | mettre à jour                                                 |
| `conditionnements-packages.md`, `product-images-query-pattern.md`, `product-variants-rules.md` | sous-règles                                | promouvoir individuellement                                   |

---

## Références dans les sources de vérité actuelles

- `docs/current/canaux-vente-publication-rules.md` — Règle métier cascade Site → Google + Meta
- `docs/current/INDEX-CANAUX-VENTE.md` — Index maître canaux de vente

---

## Procédure de promotion vers `docs/current/`

Quand un fichier restauré est validé (contenu confronté au code actuel + mis à jour) :

1. `git mv docs/restored/<dir>/<file>.md docs/current/<domain>/<file>.md`
2. Mettre à jour le frontmatter avec date de validation
3. Référencer dans `docs/current/INDEX-CANAUX-VENTE.md` ou l'INDEX du domaine
4. Ajouter une entrée mémoire si la règle est non-évidente

---

## Historique

- **2026-04-25** : Restauration de 30 fichiers (Google Merchant, Meta, canaux-vente, catalogue, pricing) suite à demande Romeo. Doc supprimée par un nettoyage non documenté entre Janvier et Avril 2026.
