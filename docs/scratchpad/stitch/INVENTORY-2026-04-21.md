# Inventaire Stitch — Page détail produit back-office

**Date** : 2026-04-21

## Projets par onglet (13 projets Vérone au total)

| Onglet               | Project ID             |   Écrans (variantes) | Thumbnails disponibles                                                                                             |
| -------------------- | ---------------------- | -------------------: | ------------------------------------------------------------------------------------------------------------------ |
| **Tarification**     | `14273265056008991888` |                    3 | `stitch-tarification-v1-dashboard.png`, `stitch-tarification-v2-panel.png`, `stitch-tarification-v3-dashboard.png` |
| **Général**          | `14298953834634591181` | 1 (thumbnail projet) | `stitch-general-desktop-2026-04-20.png`                                                                            |
| **Descriptions**     | `17155834100199281752` | 1 (thumbnail projet) | `stitch-descriptions-desktop-2026-04-20.png`                                                                       |
| **Stock**            | `6883403801102419941`  | 1 (thumbnail projet) | `stitch-stock-desktop-2026-04-20.png`                                                                              |
| **Caractéristiques** | `12619363905674465118` | 1 (thumbnail projet) | `stitch-caracteristiques-desktop-2026-04-20.png`                                                                   |
| **Images**           | `17803953971591978693` |                    1 | `stitch-images-v1.png`, `stitch-images-desktop-2026-04-20.png`                                                     |
| **Publication**      | `6689251741578606646`  |                    3 | `stitch-publication-v1.png`, `stitch-publication-v2.png`, `stitch-publication-v3.png`                              |

## Notes

- Tarification + Publication ont le plus de variantes (3 chacun) — Romeo a généré les siennes.
- Général / Descriptions / Stock / Caractéristiques n'ont qu'un écran chacun visible via `list_screens` — les autres variantes éventuelles sont à regénérer ou ont été listées comme thumbnail projet uniquement.
- Design systems des projets sont **incohérents** entre eux : `colorVariant` varie entre NEUTRAL, FIDELITY, TONAL_SPOT. À harmoniser quand on retiendra les designs finaux via `mcp__stitch__apply_design_system`.

## Prochaine action (après SI-DESC-001)

Comparer onglet par onglet les variantes existantes, Romeo choisit, puis on implémente.
