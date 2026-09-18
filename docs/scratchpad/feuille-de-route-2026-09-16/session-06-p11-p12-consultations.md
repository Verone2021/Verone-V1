> **PÉRIMÉE le 2026-09-18** — le travail décrit ici est livré : la marge produit un prix de vente,
> la TVA n'est plus figée à 20 %, les frais par fournisseur sont saisissables et répartis, et une
> commande fournisseur est créée par fournisseur (#1169, fusionnée le 16/09), puis les produits en
> sourcing sont sélectionnables, le prix d'achat accepte les dollars et le dépôt de photos est réparé
> (#1171, fusionné le 17/09). Ce qui reste des consultations est en backlog dans `.claude/work/ACTIVE.md`.

# Session 06 — P11 écran consultation projet + P12 PDF et gel des prix

Aucune base (P9 et P10 sont en production depuis #1149). Deux PR (P11, P12).

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  docs/scratchpad/audit-2026-09-11/RAPPORT-SOURCING-CONSULTATIONS-2026-09-11.md, § 8.3 et § 9 « Consultation »
  ~/Documents/Workspace/verone/_outputs/verone/audit-back-office-2026-09-11/2026-09-11-complement-consultations-frais-notation-sync-win.md, § 1
  packages/@verone/consultations/src/lib/consultation-economics.ts et consultation-supplier-costs.ts (+ tests)
  .claude/rules/responsive.md, .claude/rules/code-standards.md (400 lignes), .claude/rules/finance.md (règle R8 TVA)

═══ P11 — écran ═══
E1. En-tête consultation : client, marge par défaut du projet (`default_margin_percentage`), statut.
E2. Besoins (`consultation_needs`) en accordéon : libellé, quantité, prix cible ; ajout / renommage / suppression
    (suppression détache les options, ne les efface pas).
E3. Sous chaque besoin, un **bloc par fournisseur** : nom, frais du fournisseur (port, douane, autre — table
    `consultation_supplier_costs`, saisie en ligne), nombre d'options, marge agrégée calculée ; puis le tableau
    comparatif des options de ce fournisseur : photo, produit, coût, part de frais, prix de revient, prix par défaut,
    prix proposé (éditable), marge € et %, MOQ, délai, statut candidate / pending / approved / rejected. Fournisseur
    avec frais > 0 non supprimable (décision Roméo 13/09).
E4. Une seule source de calcul : tout passe par `consultation-economics.ts` ; grep : aucun calcul de marge ailleurs.
E5. Responsive 5 techniques ; fichiers < 400 lignes ; Playwright 375/768/1024/1440 sur la consultation
    `25fd2694` (Black & White) et une consultation à 2 fournisseurs ; aucune écriture hors produit TEST — pour les
    besoins et frais, utiliser une consultation de test créée par Roméo ou lui demander laquelle.

═══ P12 — PDF ═══
F1. PDF client : besoins et options `pending`/`approved` seulement, prix proposés, **aucun fournisseur, aucun coût,
    aucune marge** (grep sur le texte extrait du PDF). PDF interne : tout, par fournisseur.
F2. « Envoyer la proposition » / « Créer le devis » écrivent les prix ; devis non brouillon ⇒ prix, quantités, statuts,
    frais et marge verrouillés à l'écran ; devis brouillon ⇒ avertissement « régénérer ». TVA par ligne (R8). Routes
    Qonto non modifiées.
Preuves : tableau avant/après sur les consultations vivantes (mêmes totaux qu'en production), tests unitaires, reviewer
PASS. Compte rendu, ACTIVE.md.
```
