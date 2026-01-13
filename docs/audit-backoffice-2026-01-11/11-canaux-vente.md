# Audit Section 11 : Canaux de Vente

**Date :** 2026-01-11
**Testeur :** Claude (Playwright MCP Lane 1)

## Pages Testées

| Page | URL | Status | Erreurs Console |
|------|-----|--------|-----------------|
| Hub Canaux | /canaux-vente | ✅ OK | 0 |
| Prix Clients | /canaux-vente/prix-clients | ✅ OK | 0 |
| Dashboard LinkMe | /canaux-vente/linkme | ✅ OK | 0 |
| Enseignes LinkMe | /canaux-vente/linkme/enseignes | ✅ OK | 0 |
| Commandes LinkMe | /canaux-vente/linkme/commandes | ✅ OK | 0 |
| Commissions LinkMe | /canaux-vente/linkme/commissions | ✅ OK | 0 |
| Sélections LinkMe | /canaux-vente/linkme/selections | ❌ ERREUR | Fonction manquante |
| Stockage LinkMe | /canaux-vente/linkme/stockage | ✅ OK | 0 |

**Pages dynamiques non testées (nécessitent ID existant) :**
- /canaux-vente/site-internet/produits/[id]
- /canaux-vente/linkme/enseignes/[id]
- /canaux-vente/linkme/organisations/[id]
- /canaux-vente/linkme/utilisateurs/[id]
- /canaux-vente/linkme/catalogue/[id]
- /canaux-vente/linkme/selections/[id]
- /canaux-vente/linkme/commandes/[id]
- /canaux-vente/linkme/stockage/[id]
- /canaux-vente/linkme/analytics/performance/[affiliateId]

**Pages non testées (nombreuses sous-pages LinkMe) :**
- /canaux-vente/site-internet
- /canaux-vente/google-merchant
- /canaux-vente/linkme/organisations
- /canaux-vente/linkme/utilisateurs
- /canaux-vente/linkme/catalogue
- /canaux-vente/linkme/approbations
- /canaux-vente/linkme/demandes-paiement
- /canaux-vente/linkme/configuration
- /canaux-vente/linkme/analytics

## Résumé

- **Pages testées :** 8/30+ (nombreuses pages dynamiques et sous-pages)
- **Erreurs console :** 1 erreur critique

## Fonctionnalités Testées

- [x] Hub canaux de vente avec KPIs
- [x] Cartes des canaux (Google Merchant, Boutique, LinkMe)
- [x] Prix clients personnalisés
- [x] Dashboard LinkMe
- [x] Enseignes & Organisations LinkMe
- [x] Commandes LinkMe avec filtres
- [x] Stockage & Volumétrie

## Erreurs Trouvées

### 1. ❌ CRITIQUE - Sélections LinkMe
- **URL :** `/canaux-vente/linkme/selections`
- **Message :** `Could not find the function public.get_linkme_catalog_products_for_affiliate`
- **Code :** PGRST202
- **Sévérité :** Critique
- **Impact :** La page sélections ne peut pas charger le catalogue

## Actions Requises

| Priorité | Action | Fichier concerné |
|----------|--------|------------------|
| 🔴 HAUTE | Créer ou renommer la fonction `get_linkme_catalog_products_for_affiliate` | Base de données Supabase |
