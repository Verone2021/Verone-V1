# Dev-plan — Page Collections `/collections`

**Date :** 2026-05-10
**Task :** SITE-COLLECTIONS-001
**App :** `apps/site-internet`
**Copy source :** `docs/scratchpad/copy-collections-2026-05-10.md`
**Design system :** Bodoni Moda 900 / Montserrat / DM Sans Light — or #C9A961 / charbon #1d1d1b / blanc #FFFFFF — border-radius 0 partout

---

## État actuel du code

`apps/site-internet/src/app/collections/page.tsx` — **à réécrire entièrement.**
Problèmes : `font-playfair`, `verone-black`, `verone-gray-*`, `rounded-lg` → tous hors design system 2026.

La logique métier (hook `useCollections`) est réutilisable.

---

## Structure de la page

```
[Hero — fond blanc]
[Grille 3 univers — fond blanc]
[Bannière charbon bas de page]
```

---

## Section 1 — Hero page Collections

**Fond :** `bg-verone-white`
**Padding :** `px-6 py-24 md:px-16 md:py-32`
**Centré horizontalement, max-width 800px**

```tsx
// Eyebrow
<span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl">
  Nos univers
</span>

// H1
<h1 className="font-bodoni text-[52px] font-black leading-[1.04] text-verone-charbon md:text-[72px]">
  Chaque espace.<br />Une sélection.
</h1>

// Baseline
<p className="max-w-[480px] font-montserrat text-base font-light leading-[1.7] text-verone-pearl md:text-[17px]">
  Pas un catalogue fourre-tout. Trois univers, trois regards différents.
  Chacun trié avec le même niveau d'exigence.
</p>
```

---

## Section 2 — Grille 3 univers

**Architecture :** Remplacer le composant `CollectionsSection` homepage par une version expanded sur cette page.

**Desktop :** 3 colonnes égales, gap 6px (tight, éditorial)
**Mobile :** 1 colonne empilée

Chaque carte = `aspect-[4/5]` photo plein format + overlay dégradé bas + nom + accroche + CTA.

```tsx
// Données hardcodées (les 3 univers sont fixes)
const UNIVERS = [
  {
    slug: 'salon',
    nom: 'SALON',
    accroche: 'Ce que tout le monde voit. Ce qui donne le ton à tout le reste.',
    href: '/catalogue?collection=salon',
  },
  {
    slug: 'chambre',
    nom: 'CHAMBRE',
    accroche: 'Le seul espace vraiment pour toi. On n'a pas lésiné.',
    href: '/catalogue?collection=chambre',
  },
  {
    slug: 'exterieur',
    nom: 'EXTÉRIEUR',
    accroche: 'Dehors aussi, avec le même niveau d'exigence.',
    href: '/catalogue?collection=exterieur',
  },
]

// Structure carte
<Link href={href} className="group relative block aspect-[4/5] overflow-hidden bg-verone-pearl-soft">
  {/* Image depuis Supabase si disponible, sinon placeholder charbon */}
  <Image fill className="object-cover transition-transform duration-[620ms] ease-editorial group-hover:scale-[1.03]" />

  {/* Overlay dégradé bas — plus profond que homepage */}
  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-verone-charbon/90 via-verone-charbon/50 to-transparent p-6 md:p-10">
    {/* Eyebrow univers */}
    <span className="font-dm-sans text-[10px] font-light uppercase tracking-[0.32em] text-verone-or">
      {nom}
    </span>

    {/* Accroche — nouvelle vs homepage */}
    <p className="mt-2 max-w-[260px] font-montserrat text-sm font-light leading-[1.5] text-verone-white/80">
      {accroche}
    </p>

    {/* CTA */}
    <span className="mt-4 inline-block font-dm-sans text-[11px] font-light uppercase tracking-[0.28em] text-verone-or transition-colors duration-[180ms] group-hover:text-verone-white">
      Découvrir →
    </span>
  </div>
</Link>
```

**Fallback :** Si `useCollections()` ne retourne pas d'images pour ces slugs → fond `bg-verone-charbon` avec texture subtile (on ne bloque pas le rendu).

---

## Section 3 — Bannière charbon bas de page

**Fond :** `bg-verone-charbon`
**Padding :** `px-6 py-20 md:px-16 md:py-28`
**Centré**

```tsx
<section className="bg-verone-charbon px-6 py-20 md:px-16 md:py-28">
  <div className="mx-auto flex max-w-[700px] flex-col items-center gap-10 text-center">
    {/* Citation */}
    <blockquote>
      <p className="font-bodoni text-[26px] font-normal italic leading-[1.3] text-verone-white md:text-[36px]">
        « Tu n'as pas à tout voir pour trouver ce qu'il te faut. »
      </p>
    </blockquote>

    {/* CTA */}
    <Link
      href="/catalogue"
      className="inline-flex items-center justify-center border border-verone-white bg-verone-white px-10 py-4 font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-charbon transition-all duration-[180ms] ease-editorial hover:shadow-[inset_0_0_0_1px_#C9A961]"
    >
      Voir toute la sélection
    </Link>
  </div>
</section>
```

---

## Metadata SEO

```tsx
export const metadata: Metadata = {
  title: 'Nos collections | Vérone — Déco et mobilier par univers',
  description:
    'Salon, Chambre, Extérieur. Trois univers éditoriaux, chacun trié avec exigence. Trouve ta pièce.',
  alternates: { canonical: '/collections' },
};
```

Schema.org : `CollectionPage` via `JsonLdBreadcrumbList` existant.

---

## Composants à créer / modifier

| Composant                                           | Action                                              |
| --------------------------------------------------- | --------------------------------------------------- |
| `apps/site-internet/src/app/collections/page.tsx`   | Réécrire entièrement — conserver `useCollections()` |
| `apps/site-internet/src/app/collections/layout.tsx` | Vérifier metadata layout si présent                 |

**Aucun nouveau package ni composant partagé** — tout dans `apps/site-internet/src/app/collections/`.

---

## Points d'attention

- `useCollections()` retourne les collections depuis Supabase. Le mapping vers les 3 univers hardcodés (salon/chambre/exterieur) doit se faire par slug.
- Si une collection n'a pas d'image → ne pas casser le rendu, afficher fond charbon.
- Tutoiement strict dans tous les textes.
- border-radius 0 sur tous les éléments — pas de `rounded-*`.
- Les 3 univers sont actuellement dans la DB ? À vérifier avec `useCollections()` en dev.
