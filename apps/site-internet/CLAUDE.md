# Site Internet — Instructions Agent

**Application** : E-commerce B2C (port 3001)
**Public** : Clients finaux, grand public
**Stack** : Next.js 15, React 18, TypeScript, Tailwind, Supabase, Stripe

---

## AVANT TOUTE TACHE

1. Lire `/CLAUDE.md` (racine, regles globales + STANDARDS RESPONSIVE)
2. Lire `.claude/rules/responsive.md` si modif UI
3. Lire les CLAUDE.md des packages utilises

---

## CONTEXTE METIER

Site e-commerce grand public Verone. Decoration et mobilier d'interieur,
sourcing creatif, selections curatees.

### Design

- **Typographie** : Playfair Display (titles) + Inter (body)
- **Animations** : Framer Motion
- **Style** : minimaliste, luxe, epure
- **Palette** : noir, blanc, tons neutres

### Fonctionnalites principales

- Catalogue avec variantes
- Fiche produit detaillee (galeries, descriptions IA)
- Panier
- Checkout Stripe
- Compte client (commandes, adresses, wishlist)
- Systeme ambassadeurs (parrainage)
- CMS pages libres
- SEO structure (schema.org, sitemaps)

---

## RESPONSIVE (CRITIQUE pour SITE-INTERNET)

**Site-internet = 80% du trafic sur MOBILE (statistique e-commerce standard).**

Sur un site B2C, un mauvais responsive = perte de CA directe.

Patterns UI dominants :

- **Pattern A-bis** : grille produits (pas table, GRILLE CARDS)
- **Pattern C-bis** : page produit (image + info + CTA)
- **Pattern E-bis** : modals (panier latteral, checkout, QR ambassadeur)
- **Pattern G** : footer avec liens multi-colonnes

**SPECIFICITES MOBILE SITE-INTERNET** :

- CTA "Ajouter au panier" TOUJOURS sticky en bas sur mobile (pattern Amazon/Shopify)
- Images produit full-width mobile, carrousel swipe
- Panier = sheet lateral (droite) sur desktop, plein ecran sur mobile
- Menu navigation hamburger sur < lg
- Filtres catalogue en bottom sheet sur mobile (pas sidebar)
- Zoom produit tap-to-zoom (pas hover)

Breakpoints specifiques site-internet :

- Hero section : full-width toutes tailles
- Grille produits : 1 col mobile / 2 cols sm / 3 cols md / 4 cols xl
- Container max-width : 1440px pour confort lecture

---

## INTERDICTIONS SPECIFIQUES SITE-INTERNET

- JAMAIS exposer des prix avec TVA differents selon le client (doit etre coherent public)
- JAMAIS bloquer l'acces catalogue derriere un login (SEO)
- JAMAIS charger des scripts tiers (analytics/pub) avant consentement RGPD
- JAMAIS modifier `/api/checkout` sans test paiement complet
- JAMAIS modifier `/api/webhooks/stripe` (critique paiements)
- Images produit : toujours Next/Image avec `sizes` responsive

---

## SEO ET PERFORMANCE

- LCP < 2.5s (Largest Contentful Paint)
- CLS < 0.1 (pas de layout shift)
- Images : `loading="lazy"` par defaut, `priority` sur hero
- Fonts : `display: swap` toujours
- Metadata structurees : schema.org Product, BreadcrumbList

---

## COMMANDES

```bash
pnpm --filter @verone/site-internet type-check
pnpm --filter @verone/site-internet build
pnpm --filter @verone/site-internet lint
```

Format commit : `[WEB-DOMAIN-NNN] type: description` ou `[SI-DOMAIN-NNN]`
Exemples : `[SI-AMB-001]`, `[WEB-UI-RESP-001]`, `[SI-SEO-002]`
