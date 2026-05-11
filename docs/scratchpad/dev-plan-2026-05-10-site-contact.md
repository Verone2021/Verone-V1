# Dev-plan — Page Contact `/contact`

**Date :** 2026-05-10
**Task :** SITE-CONTACT-001
**App :** `apps/site-internet`
**Copy source :** `docs/scratchpad/copy-contact-2026-05-10.md`
**Design system :** Bodoni Moda 900 / Montserrat / DM Sans Light — or #C9A961 / charbon #1d1d1b / blanc #FFFFFF — border-radius 0 partout

---

## État actuel du code

`apps/site-internet/src/app/contact/page.tsx` — **à réécrire entièrement.**
Problèmes : `font-playfair`, `verone-black`, `verone-gray-*`, `rounded-lg`, vouvoiement ("Contactez-nous", "Notre équipe est à votre disposition").

**À CONSERVER impérativement :**

- La logique `handleSubmit` (fetch `/api/contact`, état submitted/isSubmitting/submitError) — fonctionnelle.
- Le payload `{ name, email, subject, message }`.
- La route `/api/contact` existante — IMMUABLE.

---

## Structure de la page

```
[Hero — fond blanc]
[Formulaire + infos — fond blanc]
[État confirmation — remplacement inline du form]
```

Pas de sidebar "Nos coordonnées" avec MapPin — trop corporate. Les infos complémentaires vont sous le form, discrètes.

---

## Section 1 — Hero page Contact

**Fond :** `bg-verone-white`
**Padding :** `px-6 pt-24 pb-16 md:px-16 md:pt-32 md:pb-20`
**Centré, max-width 640px**

```tsx
<section className="bg-verone-white px-6 pt-24 pb-16 md:px-16 md:pt-32 md:pb-20">
  <div className="mx-auto flex max-w-[640px] flex-col gap-6">
    <span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl">
      Contact
    </span>

    <h1 className="font-bodoni text-[44px] font-black leading-[1.06] text-verone-charbon md:text-[56px]">
      Une question.
      <br />
      Une commande sur mesure.
      <br />
      Autre chose.
    </h1>

    <p className="font-montserrat text-[15px] font-light leading-[1.7] text-verone-pearl">
      On répond vite. Et en humain.
    </p>
  </div>
</section>
```

---

## Section 2 — Formulaire

**Fond :** `bg-verone-white`
**Padding :** `px-6 pb-24 md:px-16 md:pb-32`
**Max-width formulaire : 640px, centré**

### Champs — style underline (cohérent avec newsletter)

Tous les inputs utilisent le pattern `border-0 border-b border-verone-charbon/30 bg-transparent focus:border-verone-or focus:outline-none` — pas de `rounded`, pas de `ring`, pas de `border-all`.

```tsx
// Label
<label className="font-dm-sans text-[10px] font-light uppercase tracking-[0.24em] text-verone-pearl">
  Ton prénom
</label>

// Input
<input
  type="text"
  name="name"
  required
  className="w-full border-0 border-b border-verone-charbon/30 bg-transparent px-0 py-3 font-montserrat text-sm text-verone-charbon placeholder:text-verone-pearl/60 focus:border-verone-or focus:outline-none"
/>
```

### Ordre des champs

1. **Ton prénom** — `input[type=text][name=name]`
2. **Ton adresse email** — `input[type=email][name=email]`
3. **De quoi s'agit-il ?** — `select[name=subject]`
   - Options : "Une question sur un produit" / "Une commande ou un devis" / "Un retour ou un problème" / "Autre chose"
   - Style select : même underline que les inputs, apparence custom via `appearance-none` + chevron SVG fin à droite
4. **Ton message** — `textarea[name=message][rows=5]`

### CTA submit

```tsx
<button
  type="submit"
  disabled={isSubmitting}
  className="mt-8 inline-flex items-center justify-center border border-verone-charbon bg-verone-charbon px-10 py-4 font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-white transition-all duration-[180ms] ease-editorial hover:shadow-[inset_0_0_0_1px_#C9A961] disabled:opacity-40"
>
  {isSubmitting ? 'Envoi…' : 'Envoyer'}
</button>
```

### Infos complémentaires (sous le bouton)

```tsx
<div className="mt-12 border-t border-verone-charbon/10 pt-8 flex flex-col gap-2">
  <p className="font-montserrat text-xs text-verone-pearl">
    contact@veronecollections.fr
  </p>
  <p className="font-montserrat text-xs text-verone-pearl">
    Réponse sous 48h en semaine.
  </p>
</div>
```

### Erreur submit

```tsx
{
  submitError && (
    <p className="font-montserrat text-xs text-red-500 mt-2">{submitError}</p>
  );
}
```

---

## État confirmation (après envoi)

**Remplace le formulaire inline — pas de modal, pas de redirect.**

```tsx
{
  submitted && (
    <div className="flex flex-col gap-6">
      <h2 className="font-bodoni text-[38px] font-black leading-tight text-verone-charbon">
        C'est noté.
      </h2>
      <p className="font-montserrat text-[15px] font-light leading-[1.7] text-verone-pearl">
        On t'a bien reçu. On revient vers toi dans les 48h.
      </p>
      <Link
        href="/"
        className="font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-charbon underline decoration-verone-or decoration-1 underline-offset-[6px] transition-colors duration-[180ms] hover:text-verone-or"
      >
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
```

---

## Metadata SEO

```tsx
export const metadata: Metadata = {
  title: 'Contact | Vérone',
  description:
    'Une question, une commande sur mesure ou autre chose. On répond vite et en humain.',
  alternates: { canonical: '/contact' },
};
```

---

## Composants à créer / modifier

| Composant                                       | Action                                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| `apps/site-internet/src/app/contact/page.tsx`   | Réécrire entièrement — conserver logique handleSubmit |
| `apps/site-internet/src/app/contact/layout.tsx` | Vérifier si metadata layout existe, sinon pas besoin  |

**Route `/api/contact` : NE PAS TOUCHER — immuable.**

---

## Points d'attention

- `'use client'` obligatoire (useState pour form).
- Tutoiement strict — "Ton prénom", "Ton email", "On répond vite".
- Supprimer : MapPin, icônes Lucide, section "Horaires du service client", "rounded-lg".
- Le select sujet doit avoir `appearance-none` + chevron custom pour matcher le design system.
- Pas de grid 2 colonnes — formulaire centré pleine largeur (max 640px) pour une lecture directe.
