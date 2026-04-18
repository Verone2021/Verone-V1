# LinkMe — Instructions Agent

**Application** : Plateforme affiliation commerciale (port 3002)
**Public** : Affilies, partenaires, enseignes partenaires
**Stack** : Next.js 15, React 18, TypeScript, Tailwind, Supabase

---

## AVANT TOUTE TACHE

1. Lire `/CLAUDE.md` (racine, regles globales + STANDARDS RESPONSIVE)
2. Lire `.claude/rules/responsive.md` si modif UI
3. Lire les CLAUDE.md des packages utilises (`packages/@verone/*/CLAUDE.md`)

---

## CONTEXTE METIER

LinkMe = plateforme d'affiliation. Les affilies (restaurants, hotels,
concept-stores) creent des selections curatees de produits Verone et
touchent une commission sur les ventes generees.

### Roles utilisateurs

- `enseigne_admin` : gere une enseigne (ex: Pokawa HQ)
- `organisation_admin` : gere une organisation (ex: restaurant individuel)
- `client` : affilie simple qui consulte ses stats

### Fonctionnalites principales

- Dashboard affilie avec KPIs (ventes, commissions, clics)
- Catalogue Verone avec ajout a selection
- Creation de selections (drag & drop, visibilite)
- Historique commandes liees a l'affilie
- Demandes de paiement de commissions
- Statistiques performance (Tremor charts)

---

## RESPONSIVE (CRITIQUE pour LinkMe)

**LinkMe est utilise majoritairement sur MOBILE par les affilies.**

Les affilies sont souvent des restaurateurs sur le terrain, ils utilisent
leur iPhone/Android en priorite, pas un PC.

Patterns UI dominants :

- **Pattern A** : listes commandes, selections, commissions
- **Pattern C** : page detail commande / selection
- **Pattern D** : dashboard avec KPI cards
- **Pattern E** : modal creation selection (drag & drop produits)

**SPECIFICITES MOBILE LINKME** :

- Bouton "Ajouter a ma selection" TOUJOURS visible (action metier critique)
- Drag & drop remplace par "+/- quantite" sur mobile (drag = pas mobile)
- QR code telechargeable en plein ecran sur mobile
- Stats en cards empilees verticalement sur mobile

Utiliser OBLIGATOIREMENT :

- `ResponsiveDataView` pour toutes les listes
- `ResponsiveActionMenu` pour 3+ actions
- `ResponsiveToolbar` pour headers

Tests Playwright OBLIGATOIRES a 375px (iPhone standard).

---

## INTERDICTIONS SPECIFIQUES LINKME

- JAMAIS exposer des donnees staff/admin back-office a un affilie
- JAMAIS modifier les policies RLS sans audit (sensibles)
- JAMAIS creer de modal qui occupe plus de 90% de l'ecran mobile sans bouton "X" accessible
- Formulaires -> toujours dans `packages/@verone/` partages avec back-office

---

## COMMANDES

```bash
pnpm --filter @verone/linkme type-check
pnpm --filter @verone/linkme build
pnpm --filter @verone/linkme lint
```

Format commit : `[LM-DOMAIN-NNN] type: description`
Exemples : `[LM-ORD-009]`, `[LM-UI-RESP-001]`, `[LM-COMM-005]`
