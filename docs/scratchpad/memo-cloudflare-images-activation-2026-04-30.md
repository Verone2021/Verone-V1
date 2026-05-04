# Mémo activation Cloudflare Images — Polish, WebP/AVIF, Variants

**Date** : 2026-04-30
**Pour** : Roméo (Vérone)
**Objet** : Activer dans le dashboard Cloudflare les optimisations qui dorment, sans toucher au code Vérone.

> Pourquoi maintenant : tu paies déjà Cloudflare Images, mais Polish + WebP/AVIF auto + variants supplémentaires sont **désactivés par défaut**. En les activant tu gagnes 30 à 60 % de poids sur les images servies → site plus rapide → meilleur SEO + meilleure conversion. Aucune modification de code Vérone nécessaire.

---

## 1. Polish — compression automatique + WebP/AVIF

### Ce que Polish fait

Polish compresse les images à la volée et les **réécrit au format moderne** (WebP ou AVIF) si le navigateur du visiteur les supporte. Effet net : entre **30 % et 60 % de poids en moins**, sans perte visible de qualité.

### Plan d'activation (5 min)

1. Ouvre le **Cloudflare Dashboard** → connecté avec ton compte Vérone
2. Va sur **Websites** → sélectionne ton domaine (typiquement `images.veronecollections.fr` ou le domaine principal selon ta config)
3. Menu de gauche → **Speed** → **Optimization** → onglet **Image Optimization**
4. Cherche **Polish** :
   - Active-le sur **Lossy** (recommandé — compression sans perte visible)
   - Coche **WebP** (compatibilité 95 % des navigateurs en 2026)
   - Coche **AVIF** (encore meilleure compression, supportée par Chrome/Edge/Firefox/Safari récents)
5. Sauvegarde

### Vérification après activation

Ouvre une image produit dans ton site (Inspect → Network → recharge la page) et vérifie :

- L'en-tête `content-type` doit être `image/webp` ou `image/avif` (pas `image/jpeg` ou `image/png`)
- Le poids de l'image doit avoir baissé de 30 % minimum vs avant

Si le `content-type` reste en JPEG, c'est que :

- Soit Polish n'est pas activé sur la bonne zone
- Soit ton navigateur ne supporte pas WebP/AVIF (rare en 2026)

---

## 2. Variants supplémentaires à créer

### Ce qu'est une variant Cloudflare

Une **variant** est une transformation prédéfinie (resize, crop, qualité) que tu nommes une fois et que tu appelles via URL. Exemple : `imagedelivery.net/{hash}/{imageId}/social-1x1` te renvoie l'image en 1080×1080.

Tu en as déjà 4 variants (`thumbnail`, `medium`, `large`, `public`). Pour la publication sociale tu as besoin de 4 nouvelles.

### Variants à ajouter

Dans le dashboard Cloudflare Images :

1. **Cloudflare Dashboard** → **Images** (menu gauche) → **Variants**
2. Clic **Create variant**
3. Crée les 4 variants suivants (un par un) :

| Nom           | Width | Height | Fit                      | Quality | Usage                                     |
| ------------- | ----- | ------ | ------------------------ | ------- | ----------------------------------------- |
| `social-1x1`  | 1080  | 1080   | crop (smart crop center) | 85      | Posts feed Instagram + Facebook           |
| `story-9x16`  | 1080  | 1920   | crop (smart crop center) | 85      | Stories Instagram + Reels covers          |
| `banner-16x9` | 1920  | 1080   | scale-down               | 85      | Bannières site + Pinterest paysage        |
| `pin-2x3`     | 1000  | 1500   | crop (smart crop center) | 85      | Pinterest portrait (ratio recommandé 2:3) |

**Settings importants à cocher pour chaque variant** :

- ✅ **Metadata: keep** (préserve les EXIF utiles)
- ✅ **Never require signed URLs** (à laisser décoché si tu veux pouvoir privatiser plus tard)
- Format : laisse `auto` (Cloudflare choisira WebP / AVIF / JPEG selon le navigateur)

### Test rapide après création

Dans le navigateur, ouvre :

```
https://images.veronecollections.fr/{ton-hash}/{un-image-id-existant}/social-1x1
```

Tu dois voir l'image au format 1080×1080. Si ça marche, tu peux ensuite l'utiliser dans le code :

```tsx
<CloudflareImage imageId={asset.cloudflare_image_id} variant="social-1x1" />
```

---

## 3. Signed URLs — à activer en Phase 1 seulement

### Pourquoi pas maintenant

Signed URLs (URLs signées) servent à protéger les images privées (assets non encore publiés, drafts, archives sensibles). Aujourd'hui toutes tes images produits sont publiques.

### Quand activer

Au moment où tu auras dans la bibliothèque des assets en statut **draft / non publié** que tu ne veux pas voir indexés par Google, on activera Signed URLs sur une variant dédiée (ex: `private-preview`).

À noter pour mémoire dans la Phase 1 du Studio Marketing.

---

## 4. Cache — vérification rapide

Dans **Caching** → **Configuration** :

- **Browser Cache TTL** : laisse à `Respect Existing Headers` (le code Vérone définit déjà `Cache-Control: max-age=3600`)
- **Edge Cache TTL** : `1 month` minimum pour les images (elles ne changent jamais une fois uploadées)

---

## 5. Suivi consommation

À l'onglet **Images** → **Overview** tu verras :

- Nombre d'images stockées (limite plan : 100k = 5$/mois)
- Nombre de livraisons (1$/100k requests)

Si tu approches de la limite, on bumpera. À ton volume actuel (estimé < 5k images), tu es très loin du seuil.

---

## 6. Récap du gain attendu

| Avant activation       | Après activation                       |
| ---------------------- | -------------------------------------- |
| Images en JPEG/PNG     | Images en WebP/AVIF auto               |
| 200-500 KB / image     | 80-200 KB / image (-50 % moyen)        |
| 4 variants disponibles | 8 variants disponibles                 |
| Pas adapté pour social | Adapté pour Meta + Pinterest + Stories |

**Coût additionnel** : 0 €. **Gain SEO** : +0,5 à +2 points sur Lighthouse Performance score (impact direct conversion B2C).

---

## 7. Ordre d'exécution recommandé

1. **Aujourd'hui** : activer Polish (Lossy + WebP + AVIF) — 2 min
2. **Aujourd'hui** : créer les 4 variants supplémentaires — 5 min
3. **Demain** : tester sur 2-3 produits que les nouvelles URLs marchent (ouvrir manuellement dans le navigateur)
4. **Phase 1 dev** : intégrer les nouvelles variants dans le composant `<CloudflareImage>` (`packages/@verone/ui/src/components/ui/cloudflare-image.tsx`) en ajoutant `social-1x1`, `story-9x16`, `banner-16x9`, `pin-2x3` aux types autorisés
5. **Phase 1 dev** : utiliser ces variants dans la nouvelle bibliothèque DAM pour la prévisualisation

---

## 8. En cas de doute

- Documentation officielle : https://developers.cloudflare.com/images/
- Section Polish : https://developers.cloudflare.com/images/polish/
- Section Variants : https://developers.cloudflare.com/images/manage-images/create-variants/

Si une étape ne fonctionne pas, capture une screenshot du dashboard Cloudflare et envoie-moi — je débugge avec toi.
