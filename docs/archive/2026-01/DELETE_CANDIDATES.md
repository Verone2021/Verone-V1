# Candidats a Suppression - Janvier 2026

**Date:** 2026-01-09
**Status:** EN ATTENTE VALIDATION

---

## Avertissement

Ces fichiers sont candidats a la suppression DEFINITIVE.
**Ne supprimer qu'apres validation explicite de l'utilisateur.**

---

## Candidats

### 1. Documentation Abby (Integration Obsolete)

| Fichier                                                                         | Raison                  |
| ------------------------------------------------------------------------------- | ----------------------- |
| `docs/archive/2026-01/architecture/ABBY-API-INTEGRATION-COMPLETE-OPTIMISEE.md`  | Abby remplace par Qonto |
| `docs/archive/2026-01/architecture/WORKFLOW-FACTURATION-ABBY-BEST-PRACTICES.md` | Abby remplace par Qonto |
| `docs/archive/2026-01/integration-facturation/ABBY-API-SETUP-GUIDE.md`          | Abby remplace par Qonto |

**Action recommandee:** Supprimer apres 3 mois si aucun retour vers Abby prevu.

---

### 2. Fichiers Speculatifs/Draft

| Fichier                                                                            | Raison                                  |
| ---------------------------------------------------------------------------------- | --------------------------------------- |
| `docs/archive/2026-01/business-rules/13-canaux-vente/futurs-canaux.md`             | Speculation, pas de plan concret        |
| `docs/archive/2026-01/business-rules/13-canaux-vente/PRESENTATION-LINKME-FIGMA.md` | Presentation externe, pas doc technique |

**Action recommandee:** Garder en archive, pas de suppression immediate.

---

### 3. Guides UI/UX Obsoletes

| Fichier                                                                           | Raison                  |
| --------------------------------------------------------------------------------- | ----------------------- |
| `docs/archive/2026-01/guides/06-ui-ux/DESIGN-MOCKUPS-FILTRES-V2.md`               | Mockups implementes     |
| `docs/archive/2026-01/guides/06-ui-ux/README-FILTRES-CATEGORIES-V2.md`            | Filtre V2 en production |
| `docs/archive/2026-01/guides/06-ui-ux/GUIDE-INTEGRATION-FILTRES-CATEGORIES-V2.md` | Integration terminee    |

**Action recommandee:** Supprimer apres confirmation que V2 est stable.

---

### 4. Plans Claude Obsoletes

| Fichier                                            | Raison                                |
| -------------------------------------------------- | ------------------------------------- |
| `.claude/archive/plans-2025-12/*.md` (15 fichiers) | Plans de decembre 2025, tous termines |

**Action recommandee:** Supprimer apres 3 mois.

---

### 5. Logs Volumineux

| Fichier                     | Taille | Raison               |
| --------------------------- | ------ | -------------------- |
| `.claude/logs/security.log` | 3.9 MB | Rotation recommandee |
| `.claude/logs/hooks.log`    | 168 KB | Rotation recommandee |

**Action recommandee:** Implementer rotation automatique, pas de suppression manuelle.

---

## Resume

| Categorie       | Nombre fichiers | Action                        |
| --------------- | --------------- | ----------------------------- |
| Abby (obsolete) | 3               | Supprimer apres 3 mois        |
| Speculatifs     | 2               | Garder en archive             |
| Guides UI/UX    | 3               | Supprimer apres validation V2 |
| Plans Claude    | 15              | Supprimer apres 3 mois        |
| Logs            | 2               | Rotation                      |

**Total candidats suppression immediate:** 0
**Total candidats suppression differee:** 23

---

## Procedure de Suppression

1. Confirmer avec l'utilisateur chaque categorie
2. Creer backup avant suppression
3. Supprimer par categorie
4. Mettre a jour ce fichier

---

_Document genere le 2026-01-09_
