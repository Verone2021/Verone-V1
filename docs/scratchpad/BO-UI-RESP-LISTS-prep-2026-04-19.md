# Préparation PR A — BO-UI-RESP-LISTS

**Date** : 2026-04-19
**Auteur** : Claude (claude.ai, lecture filesystem)
**Objectif** : livrer à Claude Code tout ce qui peut être préparé en parallèle du dev-agent pilote.

Ce document contient :
1. Pièges observés à la lecture du code pilote
2. Checklist de review pour le reviewer-agent (après pilote)
3. Prompts Commits 2, 3, 4 prêts à coller
4. Template de description de PR A
5. Décision post-merge PR A

---

## 1. Pièges observés dans les 3 pages pilotes

J'ai lu le code de `/factures`, `/stocks/inventaire` et `/commandes/fournisseurs` avant que le dev-agent finisse. Voici les pièges concrets à signaler pendant la review pilote.

### 1.1 — Les 3 pages utilisent des anti-patterns explicites

Tous les 3 fichiers de table contiennent :

| Fichier                                                              | Anti-pattern                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `apps/back-office/.../factures/components/InvoicesTable.tsx:90`      | `<Table className="w-auto">`                                |
| `apps/back-office/.../stocks/inventaire/InventaireTable.tsx:73`      | `<table className="w-full">` (HTML natif, pas `<Table>` de @verone/ui) |
| `apps/back-office/.../commandes/fournisseurs/FournisseursTable.tsx:76` | `<Table className="w-auto [&_th]:px-2.5 [&_td]:px-2.5">` |

`w-auto` est listé noir sur blanc comme anti-pattern interdit dans `.claude/rules/responsive.md` et détecté par `check-responsive-violations.sh`. Le dev-agent doit les supprimer, pas les contourner.

### 1.2 — InventaireTable utilise `<table>` HTML natif, pas `<Table>` de @verone/ui

C'est un cas particulier : `ResponsiveDataView` attend probablement une fonction `renderTable` qui rend un `<Table>` de `@verone/ui`. Si l'existant utilise du HTML natif, il faut :
- soit migrer vers `<Table>` de @verone/ui puis envelopper dans `ResponsiveDataView`
- soit rendre `ResponsiveDataView` agnostique au type de table

**À vérifier pendant la review du pilote** : quelle approche a été choisie par le dev-agent ?

### 1.3 — Les 3 "pages" sont en réalité des composants imbriqués

`/factures/page.tsx` orchestre 4 tables dans 4 composants (`FacturesTab`, `DevisTab`, `AvoirsTab`, `MissingInvoicesTable`). Migrer `/factures` = migrer 4+ composants, pas 1.

`/stocks/inventaire/page.tsx` délègue à `InventaireTable` + `InventaireFilters` + `InventaireHeader`.

`/commandes/fournisseurs/page.tsx` utilise `FournisseursTable` + `FournisseursTableRow` (lignes expansibles) + `FournisseursKpiCards`.

**Conséquence** : 3 pages pilotes = **~10-12 fichiers à modifier**. Pas 3. À valider dans le dev-report.

### 1.4 — Actions nombreuses et contextuelles

`FournisseursTable` a 7 actions contextuelles selon statut : `onView`, `onEdit`, `onValidate`, `onDevalidate`, `onReceive`, `onCancel`, `onDelete`, `onCancelRemainder`, `onLinkTransaction`. `ResponsiveActionMenu` doit supporter des `actions` dynamiques (fonction de l'item) ou plusieurs `actions` arrays par état.

**À vérifier** : comment le dev-agent a géré la visibilité conditionnelle des actions dans `ResponsiveActionMenu`.

### 1.5 — InvoicesTable : badge `DocumentDiscordanceBadge` + `DocumentSourceBadge`

Ces badges sont importants métier (sprint finance BO-FIN-010/011 récent). Ils doivent rester visibles en mode carte mobile aussi, pas seulement en mode table. **Ne pas oublier** de les porter dans le `renderCard`.

### 1.6 — FournisseursTable : lignes expansibles (expandedRows Set)

Le mode table actuel a un bouton pour expand/collapse chaque ligne afin d'afficher les sous-items de la PO. En mode carte mobile, cette logique doit être préservée — soit toujours visible (liste d'items dans la card), soit via un collapse.

**Proposition** : en mode carte, afficher le compteur d'items (`Art.`) et avoir un bouton "Voir les articles" qui route vers la page détail `/commandes/fournisseurs/[id]`. Plus simple que d'intégrer un collapse dans la card.

### 1.7 — Sort cliquable sur colonnes (`FournisseursTable`)

Colonnes `po_number` et `date` sont cliquables pour trier. En mode carte mobile, il faut un `<Select>` dans la toolbar "Trier par" ou bien garder un tri unique par défaut (date DESC). À discuter.

---

## 2. Checklist de review pour le reviewer-agent (pilote 3 pages)

À coller au reviewer-agent quand dev-agent termine. Plus précise que l'Axe 4 générique — ciblée sur les pièges observés.

```
Review pilote BO-UI-RESP-LISTS (3 pages : /factures, /stocks/inventaire, /commandes/fournisseurs).

Lis docs/scratchpad/dev-report-*.md le plus recent et applique Axe 4 Responsive
complet de .claude/agents/reviewer-agent.md.

En plus de l'Axe 4 standard, verifier specifiquement sur ces 3 pages :

[ ] Aucun `w-auto` residuel dans les 3 tables (InvoicesTable, InventaireTable, FournisseursTable)
[ ] InventaireTable : la migration de <table> HTML natif vers ResponsiveDataView est propre
    (soit passage a <Table> @verone/ui, soit ResponsiveDataView accepte le HTML natif)
[ ] Composants imbriques a jour : FacturesTab, DevisTab, AvoirsTab, MissingInvoicesTable
    tous touches OU justification explicite dans le dev-report pourquoi certains sont skippes
[ ] DocumentDiscordanceBadge + DocumentSourceBadge visibles en mode carte mobile
    (pas seulement en mode table)
[ ] FournisseursTable : actions contextuelles (view/edit/validate/devalidate/receive/cancel/delete/
    cancelRemainder/linkTransaction) bien gerees dans ResponsiveActionMenu
    (visibilite conditionnelle preservee)
[ ] FournisseursTable : lignes expansibles -> decision documentee (remplacement par route
    vers page detail OU collapse dans la card)
[ ] FournisseursTable : sort columns -> decision documentee (Select mobile OU tri par defaut)
[ ] Icons actions : h-11 w-11 md:h-9 md:w-9 applique (touch targets 44px mobile)
[ ] Tests Playwright 5 tailles fournis pour les 3 pages (screenshots joints)
[ ] Script check-responsive-violations.sh passe (0 violation sur les 3 fichiers)
[ ] Pattern reproductible : si la migration du pilote a demande des ajustements au
    ResponsiveDataView ou ResponsiveActionMenu, ces ajustements sont factorises dans
    les composants @verone/ui (pas du code specifique page)

Verdict : PASS / FAIL / PASS_WITH_WARNINGS.
Si PASS : confirmer que le pattern est stable et scalable aux 32 pages restantes.
Si PASS_WITH_WARNINGS : lister les warnings qui doivent etre fixes avant de scaler.
Si FAIL : bloquer la suite + liste des correctifs requis.
```

---

## 3. Prompts Commits 2, 3, 4 — prêts à coller

À utiliser après que le pilote soit validé (reviewer-agent PASS).

### Commit 2 — Pattern A secondaire BO (15 pages produits/contacts)

À coller à Claude Code après le merge du pilote dans la branche :

```
Commit 2 de PR A (BO-UI-RESP-LISTS) : Pattern A secondaire back-office.

PREREQUIS : pilote 3 pages deja commite sur feat/responsive-lists, reviewer PASS.

Applique le meme pattern que le pilote (ResponsiveDataView + ResponsiveActionMenu +
colonnes masquables hidden lg/xl/2xl:table-cell + touch targets 44px mobile)
sur les 15 pages suivantes.

Pages a migrer (15, Pattern A secondaire back-office) :
- /produits/catalogue
- /produits/catalogue/archived
- /produits/catalogue/affilies
- /produits/catalogue/sourcing
- /produits/catalogue/sourcing/echantillons
- /contacts-organisations/contacts
- /contacts-organisations/customers
- /contacts-organisations/enseignes
- /contacts-organisations/partners
- /contacts-organisations/suppliers
- /contacts-organisations/clients-particuliers
- /produits/catalogue/categories
- /produits/catalogue/collections
- /produits/catalogue/variantes
- /consultations

Reference audit : docs/scratchpad/audit-responsive-global-2026-04-19.md.
Reference pattern : fichiers migres dans le commit pilote precedent.

Workflow :
1. Pour chaque page, identifier le composant table sous-jacent (page.tsx est souvent
   juste un orchestrateur, la table est dans un composant enfant)
2. Appliquer le pattern pilote
3. Chaque page : verify-agent type-check + check-responsive-violations.sh PASS avant
   de passer a la suivante
4. Commit unique apres les 15 pages : `[BO-UI-RESP-LISTS] refactor: pattern A
   secondaire (15 pages produits + contacts)`
5. Push immediat
6. PAS de PR intermediaire

Si une page resiste (complexite inattendue), STOP + rapport dans dev-report, ne pas
forcer. On decidera de la sortir du commit 2 et de la traiter separement si besoin.

Rapport final : dev-report-{date}-COMMIT-2.md avec liste des 15 pages migrees +
fichiers modifies + fichiers skippes avec raison.
```

### Commit 3 — Pattern B filtres BO (19 pages catalogues + recherches)

```
Commit 3 de PR A : Pattern B (listes avec filtres complexes).

PREREQUIS : commits 1 (pilote) et 2 (A secondaire) deja pousses sur feat/responsive-lists.

Pattern B = liste + filtres multiples (sidebar ou bottom sheet mobile). A verifier avec
audit : les 19 pages Pattern B back-office, liste exacte dans
docs/scratchpad/audit-responsive-global-2026-04-19.md section 1.

Composants obligatoires :
- ResponsiveDataView (listes)
- ResponsiveActionMenu (actions)
- ResponsiveToolbar (header + slot filtres)
- Pour les filtres complexes : drawer/bottom sheet sur mobile via Sheet de @verone/ui
  (filter sidebar sur desktop reste comme actuellement)

Workflow standard :
- Commit unique [BO-UI-RESP-LISTS] refactor: pattern B filtres (19 pages)
- Push immediat
- PAS de PR intermediaire

Rapport : dev-report-{date}-COMMIT-3.md.
```

### Commit 4 — Patterns A+B LinkMe (13 pages)

```
Commit 4 de PR A : Migration LinkMe Patterns A + B.

PREREQUIS : commits 1, 2, 3 deja pousses sur feat/responsive-lists.

SPECIFICITE LINKME : 80%+ usage mobile (terrain affilies). Les breakpoints sont plus
agressifs que back-office : basculer en cards a md (768px) minimum.

Lire AVANT : apps/linkme/CLAUDE.md section RESPONSIVE (SPECIFICITES MOBILE LINKME).

Pages a migrer (13 pages LinkMe Pattern A + B) :
- /dashboard (D, mais a inclure ici car KPIs + mini tables)
- /commandes (A) — critique mobile
- /catalogue (B) — filtres sticky horizontaux
- /commissions (A+D) — KPIs + table
- /organisations (A+D)
- /notifications (A+D)
- /mes-produits (A)
- /statistiques (D, si tables)
- /ma-selection (A+D, liste principale)
- /ma-selection/[id] section table produits
- /demandes-paiement (si Pattern A)
- Autres pages Pattern A/B listees dans audit section LinkMe

Confirmer la liste exacte avec l'audit avant de commencer.

Attention speciale LinkMe :
- Actions CRITIQUES ("Ajouter a ma selection") doivent rester visibles meme sur
  mobile (pas dans dropdown) — utiliser alwaysVisible: true
- Touch targets 44px OBLIGATOIRES (pas negociable en mobile-first)
- Drag & drop sur selections : remplacer par boutons +/- quantite sur mobile
  (voir apps/linkme/CLAUDE.md)

Commit unique : [BO-UI-RESP-LISTS] refactor: patterns A+B linkme (13 pages).
Push immediat. PAS de PR intermediaire — PR finale arrive apres ce commit.

Apres push : lancer reviewer-agent sur la totalite de la branche
feat/responsive-lists (pas juste le commit 4), verify-agent sur les 3 apps,
Playwright 5 tailles sur 10 pages representatives.
```

---

## 4. Template de description PR A

À utiliser par ops-agent quand il crée la PR finale :

```
Titre PR : [BO-UI-RESP-LISTS] Migration responsive listes + filtres (87 pages)
Base : staging
Label suggere : responsive, major

Body :

## Scope

Migration responsive complete des 87 pages Pattern A + B sur back-office et LinkMe.
Infrastructure responsive senior deja mergee (PR #649) et audit global deja merge (PR #650).

Reference audit : docs/scratchpad/audit-responsive-global-2026-04-19.md.

## Commits (4 commits regroupes)

1. Pattern A critique back-office : 35 pages priorite 1 (factures, finance, stocks, commandes)
2. Pattern A secondaire back-office : 15 pages (produits/contacts)
3. Pattern B filtres back-office : 19 pages (catalogues + recherches)
4. Patterns A+B LinkMe : 13 pages (mobile-first, critique terrain)

## Composants utilises

- ResponsiveDataView (@verone/ui) : basculement automatique table → cards sous 768px
- ResponsiveActionMenu (@verone/ui) : dropdown auto sur mobile
- ResponsiveToolbar (@verone/ui) : header responsive
- Classes Tailwind : hidden lg:/xl:/2xl:table-cell pour colonnes masquables
- Touch targets : h-11 w-11 md:h-9 md:w-9

## Tests

- Playwright 5 tailles (375/768/1024/1440/1920) sur 10 pages representatives
- Screenshots avant/apres joints en commentaire
- Script check-responsive-violations.sh : 0 violation
- Type-check verts sur back-office et linkme
- Build verts sur back-office et linkme

## Reviewer-agent : verdict [PASS/FAIL]

Lien verdict complet : docs/scratchpad/review-report-BO-UI-RESP-LISTS-*.md

## Hors scope (PRs suivantes)

- PR B : Patterns C + D (73 pages detail + dashboards)
- PR C : Patterns E + F + apps (36 pages forms + linkme detail + site-internet)

## Merge

PR ne merge PAS automatiquement. Attendre validation Romeo + CI verte.
Une fois mergee : marquer BO-UI-RESP-LISTS FAIT dans .claude/work/ACTIVE.md et
enchainer sur PR B (feat/responsive-details).
```

---

## 5. Décision post-merge PR A — options

Quand PR A est mergée, 2 options :

### Option 1 — Enchaîner PR B directement
Migration Patterns C + D (73 pages détail + dashboards). Même pattern, même workflow. Gain : maintien du momentum responsive.

### Option 2 — Faire la Phase 2 restructuration config d'abord
Queue/playbooks/DECISIONS.md + les 4 ajustements validés par l'autre agent + audit nombre d'agents + test CI anti-dérive. Gain : les PRs B et C seront plus propres avec la nouvelle structure.

**Recommandation** : Option 1 si le pilote + PR A se passent bien (pattern rodé, Claude Code en rythme). Option 2 si des frictions notables émergent pendant PR A (signe que la config actuelle bloque).

Romeo décidera après le merge de PR A.

---

## 6. Ce qui n'a PAS été fait ici (respect du scope)

- Aucun fichier applicatif modifié (pages, composants, hooks)
- Aucune modification de `.claude/rules/responsive.md`
- Aucune modification des composants `responsive-*.tsx`
- Aucune modification de `apps/*/CLAUDE.md` section responsive

Tous les fichiers préparés sont en `docs/scratchpad/` uniquement.

---

## 7. Checklist final pour Romeo

Quand le dev-agent pilote termine :

- [ ] Lire son `dev-report-*.md`
- [ ] Me coller son rapport ici → je te dis si c'est OK ou s'il y a des pièges manqués
- [ ] Si OK : copier-coller le prompt "Review pilote BO-UI-RESP-LISTS" (section 2) à Claude Code pour déclencher reviewer-agent
- [ ] Si reviewer PASS : copier-coller prompt Commit 2 (section 3.1) à Claude Code
- [ ] Après Commit 2 : copier-coller prompt Commit 3 (section 3.2)
- [ ] Après Commit 3 : copier-coller prompt Commit 4 (section 3.3)
- [ ] Après Commit 4 : Claude Code lance reviewer-agent global + verify + Playwright → crée PR avec le template section 4
- [ ] Validation Romeo + CI verte → merge

Entre chaque étape : me revenir pour que je relise le rapport généré. Si quelque chose cloche, on ajuste le prompt suivant avant de le coller.
