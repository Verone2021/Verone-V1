# dev-report — Site-Internet Tier 2 Responsive (Finition)

Date : 2026-04-19
Branche : feat/responsive-finition

---

## Pages modifiees

### contact/page.tsx

- **Probleme** : `grid grid-cols-2 gap-4` sans prefix responsive sur le bloc "Nom complet / Email" du formulaire. Sur 375px, deux colonnes = champs trop etroits (~150px chacun).
- **Fix** : `grid-cols-1 sm:grid-cols-2` — une colonne sous 640px, deux colonnes au-dela.
- **Fichier** : `apps/site-internet/src/app/contact/page.tsx` ligne 140.

### ambassadeur/page.tsx

- **Probleme** : bloc code promo avec `flex items-center justify-between` — texte long (code + description + taux) + 2 boutons cote a cote. Sur 375px, debordement horizontal.
- **Fix** : `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4` + `shrink-0` sur le conteneur des boutons. Layout vertical sur mobile, horizontal sur sm+.
- **Fichier** : `apps/site-internet/src/app/ambassadeur/page.tsx` ligne 330-343.

---

## Pages SKIP (deja responsives ou pas de layout direct)

| Page                    | Raison du skip                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| collections/page.tsx    | Grid deja `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, h1 deja `text-4xl md:text-5xl`, padding `px-6 lg:px-8`. |
| compte/page.tsx         | Layout `grid-cols-1 lg:grid-cols-3`, form `grid-cols-1 md:grid-cols-2`. Deja responsive.                       |
| compte/favoris/page.tsx | Grid deja `grid-cols-1 md:grid-cols-3`. Deja responsive.                                                       |
| faq/page.tsx            | Delegue a `CmsPageContent` — aucun layout direct modifiable.                                                   |
| livraison/page.tsx      | Delegue a `CmsPageContent` — aucun layout direct modifiable.                                                   |
| retours/page.tsx        | Delegue a `CmsPageContent` — aucun layout direct modifiable.                                                   |
| a-propos/page.tsx       | Grid `grid-cols-1 md:grid-cols-2`, padding `px-6 lg:px-8`, h1 `text-4xl md:text-5xl`. Deja responsive.         |

---

## Resultat type-check

```
pnpm --filter @verone/site-internet type-check → exit 0 (aucune erreur)
```
