import type { Preset } from '../types';

export const PRESETS: Preset[] = [
  // ============================================================
  // VÉRONE — V1 à V6
  // ============================================================
  {
    id: 'V1',
    brand: 'verone',
    name: 'V1 — Packshot fond gris doux',
    description:
      'Produit isolé, fond gris doux Pantone Cool Gray 1C, studio 3 points',
    format: '1:1',
    template:
      '{{PRODUCT}}. Centered isolated product shot, no other objects. Seamless soft grey backdrop (Pantone Cool Gray 1C), subtle gradient from top to bottom. 85mm macro lens, f/5.6, perfectly straight angle at product mid-height. Three-point soft studio lighting, main light from upper left at 45°, softbox 60x90cm, no harsh shadows. Architectural Digest e-commerce premium style, neutral premium palette. Photorealistic, ultra-sharp detail, cinematic realism. 1:1 square format.',
  },
  {
    id: 'V2',
    brand: 'verone',
    name: 'V2 — Lifestyle salon premium',
    description: 'Salon parisien, parquet chevrons, lumière nord, golden hour',
    format: '4:5',
    template:
      '{{PRODUCT}} placed on a [oak side table / travertine coffee table / linen-upholstered bench]. Modern Parisian apartment living room interior, ecru plastered walls, herringbone oak parquet floor, large eucalyptus branch in a hand-thrown stoneware vase, linen curtains slightly diffusing light. 50mm lens, f/2.8 shallow depth of field, eye-level angle. Natural north window light, soft golden hour glow, subtle warmth. Architectural Digest editorial style, neutral premium palette with taupe and ecru accents. Photorealistic, cinematic realism. 4:5 portrait for Instagram feed.',
  },
  {
    id: 'V3',
    brand: 'verone',
    name: 'V3 — Story Instagram 9:16',
    description: 'Hero produit sur étagère marbre, mur limewash texturé',
    format: '9:16',
    template:
      'Hero shot of {{PRODUCT}} as the only subject, placed on a thin marble shelf against a textured limewash wall. Vertical composition, generous negative space at top for caption overlay. 35mm lens, f/4, slightly low angle for elegant proportions. Diffused natural light from the right, soft shadows. Architectural Digest minimal editorial style, neutral premium palette. Photorealistic, cinematic realism. 9:16 vertical for Instagram Story.',
  },
  {
    id: 'V4',
    brand: 'verone',
    name: 'V4 — Banner site 16:9',
    description: 'Salle à manger parisienne, miroir doré vintage, golden hour',
    format: '16:9',
    template:
      'Wide editorial shot of a refined Parisian dining room featuring {{PRODUCT}} as central focal point on the dining table. Background: limewashed walls, vintage gilded mirror, oak Charlotte Perriand chairs, large abstract painting partially visible. 35mm lens, f/4, eye-level horizontal composition with subject centered. Golden hour natural light from large French windows, warm temperature. Architectural Digest cover style, neutral premium palette. Photorealistic, cinematic realism. 16:9 horizontal banner.',
  },
  {
    id: 'V5',
    brand: 'verone',
    name: 'V5 — Flat lay éditorial',
    description: 'Top-down avec props : livre, fleur séchée, bol céramique',
    format: '1:1',
    template:
      'Top-down flat lay composition with {{PRODUCT}} as the hero, surrounded by complementary props: a folded ecru linen napkin, an open coffee table book "Axel Vervoordt: Wabi Inspirations", a dried allium flower, a small handcrafted ceramic bowl with raw stones. Background: warm beige raw cotton fabric, slightly wrinkled. 50mm lens, perfectly perpendicular top-down angle, f/8 for full sharpness. Soft diffused natural light from above, low-contrast. Vogue Living editorial flat lay style, neutral premium palette. Photorealistic, cinematic realism. 1:1 square format.',
  },
  {
    id: 'V6',
    brand: 'verone',
    name: 'V6 — Ambiance chambre',
    description: 'Chambre parisienne sereine, lin froissé, lumière du matin',
    format: '4:5',
    template:
      '{{PRODUCT}} integrated into a serene Parisian bedroom: linen-dressed bed with rumpled sheets, oak nightstand, ceramic table lamp with linen shade, single hardcover book. Walls in muted ecru limewash, oak parquet floor. 50mm lens, f/3.5, slight high angle. Soft morning light from sheer linen curtains, cool-warm balance. Architectural Digest bedroom editorial, neutral premium palette. Photorealistic, cinematic realism. 4:5 portrait.',
  },
  // ============================================================
  // BOHEMIA — B1 à B7
  // ============================================================
  {
    id: 'B1',
    brand: 'bohemia',
    name: 'B1 — Packshot ambiance lin',
    description: 'Lin froissé écru, palmier séché, golden light tardive',
    format: '1:1',
    template:
      '{{PRODUCT}}. Product placed on a backdrop of crumpled natural linen fabric in warm ecru tone, slightly textured. Subtle dried palm leaf or wheat stem leaning at the edge. 85mm lens, f/4, slightly high angle showing both product and texture. Warm late-afternoon golden light from the left, mild backlighting creating gentle rim light. Boho coastal editorial style, terracotta and ecru palette. Photorealistic, cinematic realism. 1:1 square format.',
  },
  {
    id: 'B2',
    brand: 'bohemia',
    name: 'B2 — Lifestyle plage Méditerranée',
    description: 'Plage méditerranéenne, panier rotin, golden hour, lens flare',
    format: '4:5',
    template:
      '{{PRODUCT}} on a sandy Mediterranean beach setting, sand textured close to camera, ocean blurred in the far background. Surrounding props: a folded straw hat, a vintage rattan basket, a bottle of natural orange juice, a paperback book. 35mm lens, f/2.8 shallow depth, low angle close to sand level. Hazy golden hour Mediterranean sun, lens flare from the right. Ibiza editorial summer mood, terracotta-sand-sage palette. Photorealistic, cinematic realism. 4:5 portrait for Instagram feed.',
  },
  {
    id: 'B3',
    brand: 'bohemia',
    name: 'B3 — Intérieur bohème salon',
    description: 'Salon boho, fauteuil rotin, mur arche, vases pampas',
    format: '4:5',
    template:
      '{{PRODUCT}} integrated into a warm boho living room: rattan armchair with sheepskin throw, low travertine coffee table, multiple terracotta vases with dried pampas, jute rug, white plastered walls with arch detail. 35mm lens, f/3.5, eye-level. Sun-drenched natural light from large arched window, warm golden temperature. Mediterranean villa editorial style, terracotta-ecru-sage palette. Photorealistic, cinematic realism. 4:5 portrait.',
  },
  {
    id: 'B4',
    brand: 'bohemia',
    name: 'B4 — Story 9:16 vibes été',
    description: 'Mur limewash blanc, ombres olivier, soleil méditerranéen',
    format: '9:16',
    template:
      'Hero close-up of {{PRODUCT}} hanging or resting against a white limewashed Mediterranean wall, dappled shadow of olive tree leaves cast across the surface. 50mm lens, f/2.8, vertical composition with negative space at top. Strong directional Mediterranean midday sun, hard shadows for graphic effect. Ibiza summer editorial, terracotta-ecru palette with sage accents. Photorealistic, cinematic realism. 9:16 vertical for Instagram Story.',
  },
  {
    id: 'B5',
    brand: 'bohemia',
    name: 'B5 — Flat lay objets nature',
    description: 'Top-down sur jute, pampas, galets, carnet voyage',
    format: '1:1',
    template:
      'Top-down flat lay with {{PRODUCT}} as central piece, surrounded by: a dried pampas plume, three smooth pebbles, a frayed linen napkin in terracotta, an open notebook with handwritten travel notes, a cup of tea on a saucer. Background: raw jute fabric. 50mm lens, perpendicular top-down, f/8. Natural light from upper left, warm tone. Boho coastal flat lay editorial, terracotta-ecru-sage palette. Photorealistic, cinematic realism. 1:1 square.',
  },
  {
    id: 'B6',
    brand: 'bohemia',
    name: 'B6 — Ambiance terrasse été',
    description: 'Terrasse méditerranéenne, travertine, oliviers, vue mer',
    format: '4:5',
    template:
      '{{PRODUCT}} on a Mediterranean terrace: travertine floor, low woven rattan loungers with linen cushions, terracotta pots with olive trees, a low table with a carafe of water. Stone wall in background, ocean glimpse far behind. 35mm lens, f/4, slight low angle giving depth. Late afternoon Mediterranean light, warm golden orange. Ibiza summer villa editorial, terracotta-ecru-sage palette. Photorealistic, cinematic realism. 4:5 portrait.',
  },
  {
    id: 'B7',
    brand: 'bohemia',
    name: 'B7 — Banner saisonnier',
    description: 'Pique-nique boho plage, couverture lin, panier paille',
    format: '16:9',
    template:
      'Wide horizontal scene of a boho beach picnic featuring {{PRODUCT}}: linen blanket on sand, woven straw bag tipped over, a basket of stone fruits, an opened bottle of natural wine, two ceramic glasses. Ocean horizon visible. 35mm lens, f/4, eye-level horizontal. Hazy golden hour Mediterranean sun. Boho coastal editorial summer mood. Photorealistic, cinematic realism. 16:9 horizontal banner.',
  },
  // ============================================================
  // SOLAR — S1 à S7
  // ============================================================
  {
    id: 'S1',
    brand: 'solar',
    name: 'S1 — Packshot fond noir studio',
    description: 'Fond noir profond, studio 3 points, rim light, Apple-style',
    format: '1:1',
    template:
      '{{PRODUCT}}. Centered isolated product shot. Seamless deep black backdrop (Pantone Black 6C), subtle vignette. 100mm macro lens, f/8 for ultra-sharpness, perfectly straight angle. Three-point hard studio lighting with rim light from behind for edge definition, controlled highlights on metal surfaces. Apple product launch style, minimalist tech. Photorealistic, ultra-sharp detail, cinematic realism. 1:1 square format.',
  },
  {
    id: 'S2',
    brand: 'solar',
    name: 'S2 — Packshot fond blanc clean',
    description: 'Fond blanc pur, ombre sol subtile, e-commerce Apple',
    format: '1:1',
    template:
      '{{PRODUCT}}. Centered isolated product shot on seamless pure white backdrop (RGB 255,255,255), no shadow on background, subtle ground shadow only. 100mm macro lens, f/8, perfectly straight angle. Soft diffused studio lighting, large softboxes left and right, fill from above. Apple e-commerce style, minimalist tech. Photorealistic, ultra-sharp detail, cinematic realism. 1:1 square.',
  },
  {
    id: 'S3',
    brand: 'solar',
    name: 'S3 — Démo allumée (luminaire)',
    description: 'Mur béton texturé, faisceau 2700K, contraste dramatique',
    format: '4:5',
    template:
      "{{PRODUCT}} mounted on a textured concrete wall, dramatic warm 2700K beam casting a defined cone of light revealing wall texture. Dark surrounding environment for contrast. 50mm lens, f/2.8, slight low angle to emphasize light direction. Mainly the product's own light, very subtle ambient fill. Modern hospitality editorial style, dramatic minimalist tech. Photorealistic, cinematic realism. 4:5 portrait for feed.",
  },
  {
    id: 'S4',
    brand: 'solar',
    name: 'S4 — Ambiance bureau tech',
    description: 'Home office moderne, bureau noyer, MacBook, daylight froid',
    format: '4:5',
    template:
      "{{PRODUCT}} integrated into a modern minimalist home office: dark walnut desk, Aeron chair partially visible, single MacBook closed, a cup of black coffee, a black ceramic plant pot with snake plant. Walls in cool grey concrete texture. 35mm lens, f/3.5, slight high angle. Cool natural daylight from large window, additional warm accent from product's own light. Apple-meets-Architectural-Digest style, anthracite-black-warm palette. Photorealistic, cinematic realism. 4:5 portrait.",
  },
  {
    id: 'S5',
    brand: 'solar',
    name: 'S5 — Story 9:16 tech',
    description: 'Hero close-up usage, environnement sombre, focal lumineux',
    format: '9:16',
    template:
      "Hero close-up of {{PRODUCT}} in use scenario (e.g., powerbank charging a phone, smart spot illuminating a corner). Vertical composition, dark moody environment, product as luminous focal point. 50mm lens, f/2.8, eye-level. Dramatic lighting from product's own emission plus subtle backlight. Apple product launch story style. Photorealistic, cinematic realism. 9:16 vertical Story.",
  },
  {
    id: 'S6',
    brand: 'solar',
    name: 'S6 — Banner produit hero',
    description: 'Hero horizontal, cône lumière dramatique, espace headline',
    format: '16:9',
    template:
      'Wide horizontal hero shot of {{PRODUCT}} as central focal point, environment dramatically dark with single dramatic light cone illuminating the product. Negative space on the right for headline overlay. 50mm lens, f/4, eye-level. Single key light + rim. Apple keynote editorial style. Photorealistic, cinematic realism. 16:9 horizontal banner.',
  },
  {
    id: 'S7',
    brand: 'solar',
    name: 'S7 — Soirée chaleureuse intérieure (luminaire)',
    description: 'Dîner moderne, table noyer, vin, lumière 2700K dominante',
    format: '4:5',
    template:
      "{{PRODUCT}} illuminating a cozy modern dining scene: walnut table, two ceramic plates with leftovers from dinner, two wine glasses partially full, dimmed background of a modern apartment. The product's warm 2700K light creates the dominant atmosphere. 35mm lens, f/2.8, slightly elevated angle. Mostly product light, very dim ambient. Modern hospitality editorial. Photorealistic, cinematic realism. 4:5 portrait.",
  },
  // ============================================================
  // FLOS — F1 à F7
  // ============================================================
  {
    id: 'F1',
    brand: 'flos',
    name: 'F1 — Packshot fond bois',
    description: 'Surface chêne brut, mur beige, lumière douce dorée',
    format: '1:1',
    template:
      '{{PRODUCT}}. Product placed on natural raw oak wooden surface, minimal background of warm beige plastered wall. 85mm lens, f/4, slightly high angle. Warm soft natural light from upper left, golden tone, soft shadows. Cottagecore slow living editorial style, natural-ivory-sage palette. Photorealistic, cinematic realism. 1:1 square format.',
  },
  {
    id: 'F2',
    brand: 'flos',
    name: 'F2 — Lifestyle ambiance cosy automne',
    description: 'Console bois, plaid crème, chandelles, golden hour fin',
    format: '4:5',
    template:
      '{{PRODUCT}} arranged on a wooden console table in a cozy autumn home: knit cream blanket draped on a rattan armchair partially visible, a stack of three hardcover books, an unlit cream taper candle in a brass holder, dried leaves scattered. Walls in warm beige limewash, soft sheer curtains. 50mm lens, f/2.8, eye-level. Soft warm natural light through curtains, late afternoon golden hour, dust particles visible in light beam. Cottagecore autumn editorial, ivory-sage-amber palette. Photorealistic, cinematic realism. 4:5 portrait.',
  },
  {
    id: 'F3',
    brand: 'flos',
    name: 'F3 — Story 9:16 nature',
    description: 'Mur beige plâtré, blé séché, bougie vacillante',
    format: '9:16',
    template:
      'Vertical close-up of {{PRODUCT}} against a soft beige plastered wall, with a single dried wheat stem and a flickering candle nearby. Vertical composition, generous negative space at top. 50mm lens, f/2.8, eye-level. Soft warm directional light from the right, gentle shadows. Cottagecore slow living story, ivory-sage palette. Photorealistic, cinematic realism. 9:16 vertical Story.',
  },
  {
    id: 'F4',
    brand: 'flos',
    name: 'F4 — Flat lay composition séchée',
    description: 'Top-down sur lin brut, lavande séchée, bougie crème',
    format: '1:1',
    template:
      'Top-down flat lay with {{PRODUCT}} as hero, surrounded by: a small bunch of dried lavender, a sprig of dried eucalyptus, an unlit cream pillar candle, a folded linen napkin in beige, a few autumn leaves (oak, maple). Background: raw natural linen fabric, slightly wrinkled. 50mm lens, perfectly perpendicular top-down, f/8. Warm soft diffused natural light from upper left. Cottagecore flat lay editorial, ivory-sage-amber palette. Photorealistic, cinematic realism. 1:1 square.',
  },
  {
    id: 'F5',
    brand: 'flos',
    name: 'F5 — Ambiance bougie allumée',
    description: 'Bougie centrale flamboyante, livre, tisane, fleurs séchées',
    format: '4:5',
    template:
      '{{PRODUCT}} as the central glowing focal point on a small oak side table, accompanied by an open hardcover book "Slow", a steaming cup of herbal tea, a small bunch of dried flowers in a stoneware vase. Surrounding environment dim and cozy, warm ambient glow. 50mm lens, f/2 shallow depth, eye-level. Mainly the candle\'s own warm flickering light + subtle warm fill. Hygge winter editorial style, amber-cream palette. Photorealistic, cinematic realism. 4:5 portrait.',
  },
  {
    id: 'F6',
    brand: 'flos',
    name: 'F6 — Banner saisonnier automne/Noël',
    description: 'Salon cosy hivernal, bougies multiples, plaid maille',
    format: '16:9',
    template:
      'Wide horizontal scene of a cozy autumn living room featuring {{PRODUCT}} prominently: cream knit blanket on a beige sofa, a wooden coffee table with multiple lit candles, dried botanicals in stoneware vases, a stack of books, a steaming mug. Walls in warm beige, soft curtains diffusing light. 35mm lens, f/4, eye-level horizontal. Late afternoon golden warm light. Cottagecore winter editorial, ivory-amber-sage palette. Photorealistic, cinematic realism. 16:9 horizontal banner.',
  },
  {
    id: 'F7',
    brand: 'flos',
    name: 'F7 — Composition Noël',
    description: 'Table Noël slow living, oranges séchées, cannelle, pin',
    format: '4:5',
    template:
      '{{PRODUCT}} integrated into a Christmas table setting: linen tablecloth in cream, two place settings with vintage flatware, dried orange slices, cinnamon sticks, pine branches, two unlit cream taper candles, a small stoneware bowl with mulled wine spices. 50mm lens, f/3.5, slight high angle. Soft warm late afternoon golden light. Slow living Christmas editorial, ivory-amber-pine palette. Photorealistic, cinematic realism. 4:5 portrait.',
  },
];

export const getPresetsByBrand = (brand: string): Preset[] =>
  PRESETS.filter(p => p.brand === brand);

export const getPreset = (id: string): Preset | undefined =>
  PRESETS.find(p => p.id === id);
