# Matrices de prompts Nano Banana — Vérone Group

**Date** : 2026-04-30
**Usage** : Documentation de référence pour générer manuellement des images IA cohérentes par marque, en attendant le Studio Marketing intégré au back-office.

> Workflow : choisis la marque → choisis le preset → copie le prompt complet → colle dans Gemini / Nano Banana → ajoute en image de référence ta photo produit (si packshot) ou ton image d'inspiration (si lifestyle) → génère → importe dans la bibliothèque (manuel pour l'instant, automatisé en Phase 1).

---

## 0. Structure universelle d'un prompt Nano Banana

Tous les prompts suivent **exactement** la même structure (validée par DeepMind) :

```
[SUBJECT]      Que voit-on ? (le produit + ses caractéristiques visuelles)
[ACTION]       Que fait-il ? (posé, suspendu, allumé, en composition...)
[SCENE]        Où ? (décor, mobilier annexe, mur, sol, ambiance)
[CAMERA]       Comment ? (focale, angle, profondeur de champ)
[LIGHTING]     Quelle lumière ? (naturelle, studio, golden hour, tamisée...)
[STYLE]        Référence esthétique (Architectural Digest, Vogue Living...)
[REALISM]      Mot-déclencheur photoréaliste obligatoire
[FORMAT]       Ratio cible (1:1 feed / 4:5 IG portrait / 9:16 story / 16:9 banner)
```

Exemple générique :

> _A 50cm rattan pendant lamp suspended over a wooden dining table, warm 2700K bulb softly illuminating the wood grain. Scandinavian dining room, white plastered walls, oak parquet floor, eucalyptus branch in a stoneware vase. 50mm lens, f/2.8 shallow depth of field, slight high angle. Natural window light from left, late afternoon golden hour. Architectural Digest editorial style, neutral premium palette. Photorealistic, cinematic realism. 4:5 portrait format for Instagram feed._

---

## 1. VÉRONE — Marque mère premium généraliste

**Identité visuelle** : éditorial, sophistiqué, intemporel, neutre premium
**Palette** : taupe, écru, gris perle, blanc cassé, beige rosé, noir profond
**Mots-clés** : _Architectural Digest, Vogue Living, neutral premium, timeless, refined_
**À éviter** : couleurs saturées, ambiances enfantines, kitsch, néons

### Preset V1 — Packshot fond gris doux

```
[Produit Vérone, description précise — ex: "ceramic vase 35cm height, matte off-white finish, organic curved shape"]. Centered isolated product shot, no other objects. Seamless soft grey backdrop (Pantone Cool Gray 1C), subtle gradient from top to bottom. 85mm macro lens, f/5.6, perfectly straight angle at product mid-height. Three-point soft studio lighting, main light from upper left at 45°, softbox 60x90cm, no harsh shadows. Architectural Digest e-commerce premium style, neutral premium palette. Photorealistic, ultra-sharp detail, cinematic realism. 1:1 square format.
```

### Preset V2 — Lifestyle salon premium

```
[Produit Vérone] placed on a [oak side table / travertine coffee table / linen-upholstered bench]. Modern Parisian apartment living room interior, ecru plastered walls, herringbone oak parquet floor, large eucalyptus branch in a hand-thrown stoneware vase, linen curtains slightly diffusing light. 50mm lens, f/2.8 shallow depth of field, eye-level angle. Natural north window light, soft golden hour glow, subtle warmth. Architectural Digest editorial style, neutral premium palette with taupe and ecru accents. Photorealistic, cinematic realism. 4:5 portrait for Instagram feed.
```

### Preset V3 — Story Instagram 9:16

```
Hero shot of [produit Vérone] as the only subject, placed on a thin marble shelf against a textured limewash wall. Vertical composition, generous negative space at top for caption overlay. 35mm lens, f/4, slightly low angle for elegant proportions. Diffused natural light from the right, soft shadows. Architectural Digest minimal editorial style, neutral premium palette. Photorealistic, cinematic realism. 9:16 vertical for Instagram Story.
```

### Preset V4 — Banner site 16:9

```
Wide editorial shot of a refined Parisian dining room featuring [produit Vérone] as central focal point on the dining table. Background: limewashed walls, vintage gilded mirror, oak Charlotte Perriand chairs, large abstract painting partially visible. 35mm lens, f/4, eye-level horizontal composition with subject centered. Golden hour natural light from large French windows, warm temperature. Architectural Digest cover style, neutral premium palette. Photorealistic, cinematic realism. 16:9 horizontal banner.
```

### Preset V5 — Flat lay éditorial

```
Top-down flat lay composition with [produit Vérone] as the hero, surrounded by complementary props: a folded ecru linen napkin, an open coffee table book "Axel Vervoordt: Wabi Inspirations", a dried allium flower, a small handcrafted ceramic bowl with raw stones. Background: warm beige raw cotton fabric, slightly wrinkled. 50mm lens, perfectly perpendicular top-down angle, f/8 for full sharpness. Soft diffused natural light from above, low-contrast. Vogue Living editorial flat lay style, neutral premium palette. Photorealistic, cinematic realism. 1:1 square format.
```

### Preset V6 — Ambiance chambre

```
[Produit Vérone] integrated into a serene Parisian bedroom: linen-dressed bed with rumpled sheets, oak nightstand, ceramic table lamp with linen shade, single hardcover book. Walls in muted ecru limewash, oak parquet floor. 50mm lens, f/3.5, slight high angle. Soft morning light from sheer linen curtains, cool-warm balance. Architectural Digest bedroom editorial, neutral premium palette. Photorealistic, cinematic realism. 4:5 portrait.
```

---

## 2. BOHEMIA — Ambiance bohème + plage

**Identité visuelle** : casual, chaleureux, méditerranéen, lin froissé, soleil rasant, naturel décontracté
**Palette** : terracotta, écru, sable, lin naturel, verts désaturés (sauge, olivier), ocre, blanc cassé
**Mots-clés** : _boho coastal, Mediterranean villa, Ibiza style, sun-drenched, raw textures, linen, rattan, woven_
**À éviter** : tons pastel, ambiances industrielles, néons, plastique brillant

### Preset B1 — Packshot ambiance lin

```
[Produit Bohemia, description précise]. Product placed on a backdrop of crumpled natural linen fabric in warm ecru tone, slightly textured. Subtle dried palm leaf or wheat stem leaning at the edge. 85mm lens, f/4, slightly high angle showing both product and texture. Warm late-afternoon golden light from the left, mild backlighting creating gentle rim light. Boho coastal editorial style, terracotta and ecru palette. Photorealistic, cinematic realism. 1:1 square format.
```

### Preset B2 — Lifestyle plage Méditerranée

```
[Produit Bohemia] on a sandy Mediterranean beach setting, sand textured close to camera, ocean blurred in the far background. Surrounding props: a folded straw hat, a vintage rattan basket, a bottle of natural orange juice, a paperback book. 35mm lens, f/2.8 shallow depth, low angle close to sand level. Hazy golden hour Mediterranean sun, lens flare from the right. Ibiza editorial summer mood, terracotta-sand-sage palette. Photorealistic, cinematic realism. 4:5 portrait for Instagram feed.
```

### Preset B3 — Intérieur bohème salon

```
[Produit Bohemia] integrated into a warm boho living room: rattan armchair with sheepskin throw, low travertine coffee table, multiple terracotta vases with dried pampas, jute rug, white plastered walls with arch detail. 35mm lens, f/3.5, eye-level. Sun-drenched natural light from large arched window, warm golden temperature. Mediterranean villa editorial style, terracotta-ecru-sage palette. Photorealistic, cinematic realism. 4:5 portrait.
```

### Preset B4 — Story 9:16 vibes été

```
Hero close-up of [produit Bohemia] hanging or resting against a white limewashed Mediterranean wall, dappled shadow of olive tree leaves cast across the surface. 50mm lens, f/2.8, vertical composition with negative space at top. Strong directional Mediterranean midday sun, hard shadows for graphic effect. Ibiza summer editorial, terracotta-ecru palette with sage accents. Photorealistic, cinematic realism. 9:16 vertical for Instagram Story.
```

### Preset B5 — Flat lay objets nature

```
Top-down flat lay with [produit Bohemia] as central piece, surrounded by: a dried pampas plume, three smooth pebbles, a frayed linen napkin in terracotta, an open notebook with handwritten travel notes, a cup of tea on a saucer. Background: raw jute fabric. 50mm lens, perpendicular top-down, f/8. Natural light from upper left, warm tone. Boho coastal flat lay editorial, terracotta-ecru-sage palette. Photorealistic, cinematic realism. 1:1 square.
```

### Preset B6 — Ambiance terrasse été

```
[Produit Bohemia] on a Mediterranean terrace: travertine floor, low woven rattan loungers with linen cushions, terracotta pots with olive trees, a low table with a carafe of water. Stone wall in background, ocean glimpse far behind. 35mm lens, f/4, slight low angle giving depth. Late afternoon Mediterranean light, warm golden orange. Ibiza summer villa editorial, terracotta-ecru-sage palette. Photorealistic, cinematic realism. 4:5 portrait.
```

### Preset B7 — Banner saisonnier

```
Wide horizontal scene of a boho beach picnic featuring [produit Bohemia]: linen blanket on sand, woven straw bag tipped over, a basket of stone fruits, an opened bottle of natural wine, two ceramic glasses. Ocean horizon visible. 35mm lens, f/4, eye-level horizontal. Hazy golden hour Mediterranean sun. Boho coastal editorial summer mood. Photorealistic, cinematic realism. 16:9 horizontal banner.
```

---

## 3. SOLAR — Électronique, luminaire, spot, powerbank

**Identité visuelle** : tech sleek, packshot rigoureux, mise en valeur de la fonction lumineuse, contraste fort
**Palette** : noir mat, anthracite, blanc clean, accents technologiques (cuivre brossé, lumière ambrée chaude, blanc froid 5500K)
**Mots-clés** : _minimalist tech, Apple-style, modern interior, dramatic lighting, sleek industrial design, focused beam_
**À éviter** : ambiances kitsch, tons pastels, accumulation d'objets, fond bohème

### Preset S1 — Packshot fond noir studio

```
[Produit Solar, description précise — ex: "matte black aluminum smart spot, 8cm diameter, with brushed copper trim ring"]. Centered isolated product shot. Seamless deep black backdrop (Pantone Black 6C), subtle vignette. 100mm macro lens, f/8 for ultra-sharpness, perfectly straight angle. Three-point hard studio lighting with rim light from behind for edge definition, controlled highlights on metal surfaces. Apple product launch style, minimalist tech. Photorealistic, ultra-sharp detail, cinematic realism. 1:1 square format.
```

### Preset S2 — Packshot fond blanc clean

```
[Produit Solar]. Centered isolated product shot on seamless pure white backdrop (RGB 255,255,255), no shadow on background, subtle ground shadow only. 100mm macro lens, f/8, perfectly straight angle. Soft diffused studio lighting, large softboxes left and right, fill from above. Apple e-commerce style, minimalist tech. Photorealistic, ultra-sharp detail, cinematic realism. 1:1 square.
```

### Preset S3 — Démo allumée (luminaire)

```
[Produit Solar luminaire allumé — ex: "wall-mounted spot light"] mounted on a textured concrete wall, dramatic warm 2700K beam casting a defined cone of light revealing wall texture. Dark surrounding environment for contrast. 50mm lens, f/2.8, slight low angle to emphasize light direction. Mainly the product's own light, very subtle ambient fill. Modern hospitality editorial style, dramatic minimalist tech. Photorealistic, cinematic realism. 4:5 portrait for feed.
```

### Preset S4 — Ambiance bureau tech

```
[Produit Solar] integrated into a modern minimalist home office: dark walnut desk, Aeron chair partially visible, single MacBook closed, a cup of black coffee, a black ceramic plant pot with snake plant. Walls in cool grey concrete texture. 35mm lens, f/3.5, slight high angle. Cool natural daylight from large window, additional warm accent from product's own light. Apple-meets-Architectural-Digest style, anthracite-black-warm palette. Photorealistic, cinematic realism. 4:5 portrait.
```

### Preset S5 — Story 9:16 tech

```
Hero close-up of [produit Solar] in use scenario (e.g., powerbank charging a phone, smart spot illuminating a corner). Vertical composition, dark moody environment, product as luminous focal point. 50mm lens, f/2.8, eye-level. Dramatic lighting from product's own emission plus subtle backlight. Apple product launch story style. Photorealistic, cinematic realism. 9:16 vertical Story.
```

### Preset S6 — Banner produit hero

```
Wide horizontal hero shot of [produit Solar] as central focal point, environment dramatically dark with single dramatic light cone illuminating the product. Negative space on the right for headline overlay. 50mm lens, f/4, eye-level. Single key light + rim. Apple keynote editorial style. Photorealistic, cinematic realism. 16:9 horizontal banner.
```

### Preset S7 — Soirée chaleureuse intérieure (luminaire)

```
[Produit Solar luminaire allumé] illuminating a cozy modern dining scene: walnut table, two ceramic plates with leftovers from dinner, two wine glasses partially full, dimmed background of a modern apartment. The product's warm 2700K light creates the dominant atmosphere. 35mm lens, f/2.8, slightly elevated angle. Mostly product light, very dim ambient. Modern hospitality editorial. Photorealistic, cinematic realism. 4:5 portrait.
```

---

## 4. FLOS — Plantes séchées + bougies

**Identité visuelle** : nature séchée, doux, bohème naturel, lumière tamisée, ambiance cosy automne/hiver
**Palette** : tons naturels (bois clair, beige, ocre, ivoire), vert sauge, ambré chaud, cire bougie, marron chocolat, blanc cassé
**Mots-clés** : _cottagecore, slow living, autumn cozy, candlelit, dried botanicals, natural materials, hygge_
**À éviter** : tons saturés froids, ambiances industrielles ou tech, plastique

### Preset F1 — Packshot fond bois

```
[Produit Flos, description précise — ex: "dried bouquet of pampas grass and dried lavender, 50cm height, in raw terracotta vase"]. Product placed on natural raw oak wooden surface, minimal background of warm beige plastered wall. 85mm lens, f/4, slightly high angle. Warm soft natural light from upper left, golden tone, soft shadows. Cottagecore slow living editorial style, natural-ivory-sage palette. Photorealistic, cinematic realism. 1:1 square format.
```

### Preset F2 — Lifestyle ambiance cosy automne

```
[Produit Flos] arranged on a wooden console table in a cozy autumn home: knit cream blanket draped on a rattan armchair partially visible, a stack of three hardcover books, an unlit cream taper candle in a brass holder, dried leaves scattered. Walls in warm beige limewash, soft sheer curtains. 50mm lens, f/2.8, eye-level. Soft warm natural light through curtains, late afternoon golden hour, dust particles visible in light beam. Cottagecore autumn editorial, ivory-sage-amber palette. Photorealistic, cinematic realism. 4:5 portrait.
```

### Preset F3 — Story 9:16 nature

```
Vertical close-up of [produit Flos] against a soft beige plastered wall, with a single dried wheat stem and a flickering candle nearby. Vertical composition, generous negative space at top. 50mm lens, f/2.8, eye-level. Soft warm directional light from the right, gentle shadows. Cottagecore slow living story, ivory-sage palette. Photorealistic, cinematic realism. 9:16 vertical Story.
```

### Preset F4 — Flat lay composition séchée

```
Top-down flat lay with [produit Flos] as hero, surrounded by: a small bunch of dried lavender, a sprig of dried eucalyptus, an unlit cream pillar candle, a folded linen napkin in beige, a few autumn leaves (oak, maple). Background: raw natural linen fabric, slightly wrinkled. 50mm lens, perfectly perpendicular top-down, f/8. Warm soft diffused natural light from upper left. Cottagecore flat lay editorial, ivory-sage-amber palette. Photorealistic, cinematic realism. 1:1 square.
```

### Preset F5 — Ambiance bougie allumée

```
[Produit Flos bougie allumée] as the central glowing focal point on a small oak side table, accompanied by an open hardcover book "Slow", a steaming cup of herbal tea, a small bunch of dried flowers in a stoneware vase. Surrounding environment dim and cozy, warm ambient glow. 50mm lens, f/2 shallow depth, eye-level. Mainly the candle's own warm flickering light + subtle warm fill. Hygge winter editorial style, amber-cream palette. Photorealistic, cinematic realism. 4:5 portrait.
```

### Preset F6 — Banner saisonnier automne/Noël

```
Wide horizontal scene of a cozy autumn living room featuring [produit Flos] prominently: cream knit blanket on a beige sofa, a wooden coffee table with multiple lit candles, dried botanicals in stoneware vases, a stack of books, a steaming mug. Walls in warm beige, soft curtains diffusing light. 35mm lens, f/4, eye-level horizontal. Late afternoon golden warm light. Cottagecore winter editorial, ivory-amber-sage palette. Photorealistic, cinematic realism. 16:9 horizontal banner.
```

### Preset F7 — Composition Noël

```
[Produit Flos] integrated into a Christmas table setting: linen tablecloth in cream, two place settings with vintage flatware, dried orange slices, cinnamon sticks, pine branches, two unlit cream taper candles, a small stoneware bowl with mulled wine spices. 50mm lens, f/3.5, slight high angle. Soft warm late afternoon golden light. Slow living Christmas editorial, ivory-amber-pine palette. Photorealistic, cinematic realism. 4:5 portrait.
```

---

## 5. Workflow recommandé pour générer une image

1. **Choisis la marque** (Vérone / Bohemia / Solar / Flos)
2. **Choisis le preset** (V1 à V6, B1 à B7, S1 à S7, F1 à F7)
3. **Remplace `[Produit X]`** par la description précise de ton produit. Ex pour S1 : _"matte black aluminum smart wall spot, 8cm diameter, with brushed copper trim ring, single LED beam, IP44 rated"_.
4. **Optionnel — image de référence** : sur Nano Banana / Gemini, dépose ta photo produit existante (packshot fond blanc actuel) pour que le modèle conserve fidèlement la forme/couleur du produit.
5. **Génère** 3 à 5 variantes en gardant le prompt identique → tu choisiras la meilleure.
6. **Importe dans la bibliothèque** Vérone (manuel pour l'instant) avec :
   - `ai_generated = true`
   - `ai_model = nano-banana-2` ou `nano-banana-pro`
   - `ai_prompt` = le prompt complet utilisé
   - `brand_ids` = la marque choisie
   - `eligible_channels` = les canaux où tu prévois de l'utiliser

---

## 6. Notes pratiques

- **Si Nano Banana refuse** un prompt (filtre safety), reformule en supprimant les mots ambigus (rare avec ces presets, conçus pour rester safe).
- **Pour les produits avec personnes** (mannequin tenant le produit) : Nano Banana Pro est meilleur que Nano Banana 2. Toujours flagger `contains_persons = true` dans la bibliothèque.
- **Coût indicatif** (si tu passes un jour à l'API) : ~0,01 € à 0,04 € par image. 200 images/mois = 2 à 8 €/mois. Insignifiant.
- **Cohérence de marque** : utilise toujours **les mêmes mots-clés** pour une marque (ne mélange jamais les palettes — pas de "boho coastal" sur un produit Solar).

---

## 7. Évolution prévue (Phase 2 du Studio Marketing)

Cette doc deviendra obsolète quand le module **Studio Prompts** sera livré dans le back-office :

- Formulaire qui demande : marque + produit (autocomplete) + preset → génère le prompt automatiquement avec les bonnes substitutions
- Bouton "Copier le prompt"
- Bouton "Importer l'image générée" (drag-drop) qui pré-remplit `ai_prompt`, `ai_model`, `brand_ids`
- Banque de prompts personnalisés sauvegardés (au-delà des 27 presets de cette doc)

D'ici là, ce document est ta **bible de référence** à imprimer / mettre en PDF / coller en Notion.
