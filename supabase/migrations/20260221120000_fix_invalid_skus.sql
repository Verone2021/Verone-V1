-- Migration: Corriger les SKUs non conformes à la convention Verone
-- Convention: {3 premières lettres de la sous-catégorie}-{NNNN}
-- Ex: MIR-0022, VAS-0033, DEC-0006
--
-- Ordre critique pour éviter les conflits de numérotation :
-- 1. DEC-0001 → VAS (libère le slot DEC-0001 avant que DCO-* ne l'utilise)
-- 2. PRD-0105 → VAS, PRD-0123/0124 → BAN
-- 3. DCO-* → DEC (5 produits, prend les slots DEC-0001 à DEC-0005)
-- 4. ZEN-* → préfixes corrects (21 produits)
-- 5. PRD-0026..0038 → FLE, PRD-0081/0082 → PLA, PRD-0130/0131/0132/0309 → SEP/APP/POU/MEU
-- 6. PRE-BW-001 → SEP

-- ============================================================
-- ÉTAPE 1 : Libérer le slot DEC-0001 (Vide poche cœur vert → VAS)
-- VAS max actuel = 32 → VAS-0033
-- ============================================================
UPDATE products SET sku = 'VAS-0033' WHERE sku = 'DEC-0001';

-- ============================================================
-- ÉTAPE 2 : Groupe B partiel (VAS + BAN)
-- VAS max après étape 1 = 33 → VAS-0034
-- BAN max actuel = 7 → BAN-0008, BAN-0009
-- ============================================================
UPDATE products SET sku = 'VAS-0034' WHERE sku = 'PRD-0105';   -- Ciel de bar
UPDATE products SET sku = 'BAN-0008' WHERE sku = 'PRD-0123';   -- Banc artisanal bois 120cm
UPDATE products SET sku = 'BAN-0009' WHERE sku = 'PRD-0124';   -- Banc artisanal bois 100cm

-- ============================================================
-- ÉTAPE 3 : DCO-* → DEC (Décoration murale, préfixe incorrect)
-- DEC est maintenant vide (DEC-0001 libéré à l'étape 1)
-- ============================================================
UPDATE products SET sku = 'DEC-0001' WHERE sku = 'DCO-0001';   -- Miroir XL
UPDATE products SET sku = 'DEC-0002' WHERE sku = 'DCO-0002';   -- Rond paille S
UPDATE products SET sku = 'DEC-0003' WHERE sku = 'DCO-0003';   -- Rond paille L
UPDATE products SET sku = 'DEC-0004' WHERE sku = 'DCO-0004';   -- Rond paille M
UPDATE products SET sku = 'DEC-0005' WHERE sku = 'DCO-0005';   -- Lots 4 miroirs irrégulier laiton

-- ============================================================
-- ÉTAPE 4 : ZEN-* → préfixes corrects
-- DEC max après étape 3 = 5
-- MIR max actuel = 21
-- SUS max actuel = 11
-- LAM max actuel = 26
-- TAB max actuel = 31
-- RAN max actuel = 0 (aucun RAN-* existant)
-- ============================================================

-- ZEN → DEC (Décoration murale)
UPDATE products SET sku = 'DEC-0006' WHERE sku = 'ZEN-0001';   -- Cadre photo naturel eva
UPDATE products SET sku = 'DEC-0007' WHERE sku = 'ZEN-0004';   -- Deco mural raphia alba 91x64
UPDATE products SET sku = 'DEC-0008' WHERE sku = 'ZEN-0006';   -- Deco mural raphia alaina d64
UPDATE products SET sku = 'DEC-0009' WHERE sku = 'ZEN-0007';   -- Deco mural raphia oasis x2

-- ZEN → SUS (Suspension)
UPDATE products SET sku = 'SUS-0012' WHERE sku = 'ZEN-0002';   -- Suspension ppr etel naturel

-- ZEN → MIR (Miroir)
UPDATE products SET sku = 'MIR-0022' WHERE sku = 'ZEN-0003';   -- Miroir raphia tropi 43x29
UPDATE products SET sku = 'MIR-0023' WHERE sku = 'ZEN-0005';   -- Miroir raphia alba x3
UPDATE products SET sku = 'MIR-0024' WHERE sku = 'ZEN-0008';   -- Miroir tresse d68 celia
UPDATE products SET sku = 'MIR-0025' WHERE sku = 'ZEN-0009';   -- Miroir roseau ael d80
UPDATE products SET sku = 'MIR-0026' WHERE sku = 'ZEN-0010';   -- Miroir deco contour dore losange h60cm
UPDATE products SET sku = 'MIR-0027' WHERE sku = 'ZEN-0011';   -- Miroir deco contour deco dore losange
UPDATE products SET sku = 'MIR-0028' WHERE sku = 'ZEN-0016';   -- Miroir metal warren or d24 x3
UPDATE products SET sku = 'MIR-0029' WHERE sku = 'ZEN-0017';   -- Miroir plast orga roman 30x39
UPDATE products SET sku = 'MIR-0030' WHERE sku = 'ZEN-0020';   -- Miroir raphia safari d38
UPDATE products SET sku = 'MIR-0031' WHERE sku = 'ZEN-0021';   -- Miroir raphia alba d57

-- ZEN → LAM (Lampe de table)
UPDATE products SET sku = 'LAM-0027' WHERE sku = 'ZEN-0012';   -- Lampe campignon lito beige
UPDATE products SET sku = 'LAM-0028' WHERE sku = 'ZEN-0014';   -- Lampe campignon lito noir

-- ZEN → TAB (Table d'appoint + Table basse — même préfixe TAB)
UPDATE products SET sku = 'TAB-0032' WHERE sku = 'ZEN-0013';   -- Table metal D31H46cm (Table d'appoint)
UPDATE products SET sku = 'TAB-0033' WHERE sku = 'ZEN-0015';   -- Table basse aeris beige

-- ZEN → RAN (Rangement cuisine)
UPDATE products SET sku = 'RAN-0001' WHERE sku = 'ZEN-0018';   -- Organiseur coulissant bambou PM
UPDATE products SET sku = 'RAN-0002' WHERE sku = 'ZEN-0019';   -- Organiseur coulissant bambou MM

-- ============================================================
-- ÉTAPE 5 : Groupe C — PRD-* → préfixes par sous-catégorie
-- FLE max = 0, PLA max = 0, SEP max = 0, APP max = 0, POU max = 0, MEU max = 0
-- ============================================================

-- FLE (Fleurs séchées)
UPDATE products SET sku = 'FLE-0001' WHERE sku = 'PRD-0026';   -- Fleur Éternelle
UPDATE products SET sku = 'FLE-0002' WHERE sku = 'PRD-0027';   -- Nuances Bohèmes
UPDATE products SET sku = 'FLE-0003' WHERE sku = 'PRD-0028';   -- Rêve Ensoleillé
UPDATE products SET sku = 'FLE-0004' WHERE sku = 'PRD-0029';   -- Douceur Éthérée
UPDATE products SET sku = 'FLE-0005' WHERE sku = 'PRD-0030';   -- Esprit Bohème
UPDATE products SET sku = 'FLE-0006' WHERE sku = 'PRD-0031';   -- Sérénité Naturelle
UPDATE products SET sku = 'FLE-0007' WHERE sku = 'PRD-0032';   -- Voyage Sensoriel
UPDATE products SET sku = 'FLE-0008' WHERE sku = 'PRD-0033';   -- Douce Breeze
UPDATE products SET sku = 'FLE-0009' WHERE sku = 'PRD-0034';   -- Pureté Envoûtante
UPDATE products SET sku = 'FLE-0010' WHERE sku = 'PRD-0035';   -- Élégance Sauvage
UPDATE products SET sku = 'FLE-0011' WHERE sku = 'PRD-0036';   -- Raffinement Naturel
UPDATE products SET sku = 'FLE-0012' WHERE sku = 'PRD-0037';   -- Grande Majesté
UPDATE products SET sku = 'FLE-0013' WHERE sku = 'PRD-0038';   -- Brise Légère

-- PLA (Plateaux & Supports)
UPDATE products SET sku = 'PLA-0001' WHERE sku = 'PRD-0081';   -- Plateau bois 20x30cm
UPDATE products SET sku = 'PLA-0002' WHERE sku = 'PRD-0082';   -- Plateau bois 30x40cm

-- SEP (Séparateur de terrasse)
UPDATE products SET sku = 'SEP-0001' WHERE sku = 'PRD-0130';   -- Séparateur Terrasse

-- APP (Applique murale)
UPDATE products SET sku = 'APP-0001' WHERE sku = 'PRD-0131';   -- Applique mural raphia

-- POU (Poubelle)
UPDATE products SET sku = 'POU-0001' WHERE sku = 'PRD-0132';   -- Poubelle à POKAWA

-- MEU (Meuble console)
UPDATE products SET sku = 'MEU-0001' WHERE sku = 'PRD-0309';   -- Meuble TABESTO à POKAWA

-- ============================================================
-- ÉTAPE 6 : PRE-BW-001 → SEP (Séparateur de terrasse)
-- SEP max après étape 5 = 1 → SEP-0002
-- ============================================================
UPDATE products SET sku = 'SEP-0002' WHERE sku = 'PRE-BW-001'; -- Présentoir extérieur B&W Burgers
