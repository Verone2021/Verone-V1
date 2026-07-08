# Modèle d'article Journal — veronecollections.fr

Format de référence pour les futurs articles du Journal, extrait des 5 articles
de lancement (supprimés le 2026-07-08 car liés à une sélection produits non
figée — sauvegarde complète : `backup-articles-journal-2026-07-08.json`).

Table : `public.articles`. Un article publié doit avoir `status = 'published'`
et un `published_at`. **Toujours renseigner `cover_image_url`** (sinon bloc gris
sur le site) et ne lier (`featured_product_ids`) que des produits **réellement
publiés** dans le catalogue au moment de la publication.

---

## Champs à remplir

| Champ                                                           | Rôle                       | Exemple / consigne                                                      |
| --------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------- | -------- |
| `title`                                                         | Titre H1 + onglet          | « Lampe de table design : comment choisir la bonne pour son intérieur » |
| `subtitle`                                                      | Sous-titre optionnel       | —                                                                       |
| `slug`                                                          | URL `/journal/<slug>`      | `lampe-table-design-comment-choisir` (kebab-case, mots-clés SEO)        |
| `excerpt`                                                       | Accroche (1-2 phrases)     | affichée en liste + carte                                               |
| `body_markdown`                                                 | Corps (## / ### sections)  | 700-1300 mots, ton Vérone (tutoiement, éditorial)                       |
| `cover_image_url` + `cover_image_alt`                           | Image de couverture        | **obligatoire**                                                         |
| `category`                                                      | `Inspiration` ou `Guide`   | Guide = pratique/comment choisir ; Inspiration = ambiance/idées         |
| `tags`                                                          | 5 à 7 mots-clés            | `['lampe de table','luminaire','design','chevet','chromé']`             |
| `author_name` / `author_role`                                   | Auteur                     | `Vérone` / `Rédaction`                                                  |
| `reading_time_minutes` / `word_count`                           | Temps de lecture           | ~ mots / 180                                                            |
| `featured_product_ids`                                          | 4 à 6 produits **publiés** | `uuid[]` de `products` réels et en ligne                                |
| `related_article_ids`                                           | Articles liés              | `uuid[]`                                                                |
| `meta_title`                                                    | SEO titre                  | « …                                                                     | Vérone » |
| `meta_description`                                              | SEO description            | ~155 caractères, avec le mot-clé                                        |
| `canonical_url`                                                 | Canonique                  | `/journal/<slug>`                                                       |
| `og_title` / `og_description` / `og_image_url` / `og_image_alt` | Open Graph                 | partage réseaux                                                         |
| `twitter_card`                                                  | Type carte                 | `summary_large_image`                                                   |
| `schema_type`                                                   | Schema.org                 | `BlogPosting`                                                           |
| `robots_index` / `robots_follow`                                | Indexation                 | `true` / `true`                                                         |

## Structure type du corps (exemple « Guide »)

```markdown
Accroche forte en 2-3 phrases (reprend l'excerpt, l'enrichit).

## Le principe / l'angle (l'usage avant la forme)

Paragraphe qui pose le vrai critère de choix.

## Les grandes options et ce qu'elles apportent

### Option A : …

### Option B : …

### Option C : …

## Les erreurs courantes

## Par type de pièce / cas d'usage

Clôture qui oriente vers les produits Vérone (sans être un catalogue).
```

## Structure type (« Inspiration »)

Plus narrative : angle sensoriel → 3-5 idées concrètes illustrées par des pièces
réelles → clôture ouverte. Même longueur, même ton.

## Règles éditoriales Vérone

- Tutoiement strict, ton éditorial (cf. `docs/brand/BRAND-FOUNDATION-VERONE.md`).
- On ne survend pas : l'article aide, il ne « pitch » pas. Les produits sont des
  illustrations, pas une liste de courses.
- Chaque produit cité doit exister et être en ligne (sinon lien mort / hors-sujet).
- 1 image de couverture + alt descriptif obligatoires avant publication.
