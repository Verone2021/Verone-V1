# LinkMe Expert — Memoire Persistante

## Architecture LinkMe

- Plateforme B2B2C affilies (enseignes comme Pokawa)
- 2 tables fondamentales : user_app_roles (auth) + linkme_affiliates (business)
- Contrainte XOR : enseigne_id OU organisation_id (exactement un)
- Trigger auto-creation linkme_affiliates sur insert enseigne (15% marge, 5% commission)
- Canal = "linkme" (JAMAIS "affilie" ou "affiliate")
- Middleware self-contained (pas d'imports workspace — Edge Runtime)

## Roles et permissions

- enseigne_admin : acces complet enseigne + toutes ses orgs
- enseigne_collaborateur : pas de commissions, pas de marges, pas de stock, pas de parametres
- organisation_admin (org_independante) : voit uniquement sa propre org
- Utilisateurs externes : commandes publiques via /s/[id], sans compte

## Commissions (source de verite)

- 2 types produits : Catalogue (marge) vs Affilie (commission)
- Formule CORRIGEE (bug 10 jan 2026) : `retrocession = selling_price_ht × margin_rate/100 × quantity`
- retrocession_rate = margin_rate / 100 (toujours depuis LinkMe selection)
- Produits affilies (created_by_affiliate) : retrocession_rate = 0
- Cycle : pending → validated → payable → paid
- Calculs en HT, TVA jamais appliquee aux commissions
- Champs verrouilles : selling_price_ht_locked, base_price_ht_locked (prix historiques)
- margin_rate = 0 NE SIGNIFIE PAS produit utilisateur — utiliser commission_rate > 0 ou created_by_affiliate

## Formulaires commande

- Formulaire ACTIF : `orders/steps/` (PAS `order-form/`)
- Schema defaults : `apps/linkme/src/components/orders/schemas/order-form.schema.ts`
- Hook soumission : `apps/linkme/src/lib/hooks/use-order-form.ts`
- Regle absolue : PAS DE SELECTION = PAS DE COMMANDE LINKME

## Selections publiques

- Coeur du revenu — selections publiees = catalogue affilie
- is_public = true AND status = 'active' pour acces anonyme
- URL publique : /s/[id]
- Workflow : New → Add products → Configure margin → Publish → Public URL

## Contacts vs Users

- contacts (table contacts, lies aux orgs) ≠ utilisateurs LinkMe (auth.users + user_app_roles, lies aux enseignes)
- JAMAIS confondre les deux

## Pages cles

- LinkMe app : /dashboard, /commandes, /commissions, /ma-selection, /catalogue, /mes-produits, /organisations, /contacts, /stockage, /aide, /statistiques
- Back-office : /canaux-vente/linkme/commandes, /canaux-vente/linkme/approbations, /canaux-vente/linkme/enseignes
- /contacts-organisations/enseignes = page REFERENCE generale ≠ /canaux-vente/linkme/enseignes = vue LinkMe

## Siege et organisations

- Siege = org parent de l'enseigne UNIQUEMENT (pas les orgs)
- Orgs n'ont PAS de siege
- Facturation/livraison = par org (colonnes inline)
- kbis_url sur linkme_details uniquement

## Bugs corriges

- Contacts auto-copies depuis Responsable (defaults schema)
- Logo organisation non herite (double URL getPublicUrl)
- returnUrl manquant sur bouton Modifier organisation
- Incident B&W (19 fev 2026) : 2 factures linkme_selection_id = NULL, retrocession = 0

## Audit mars 2026

- App en excellent etat : 0 erreur console
- 48 pages authentifiees + 13 pages publiques
- channel_pricing : 49 entrees, commission_rate moyenne 61% (aberrant, probablement dead data)
- useLinkMeAnalytics : pattern legacy useState+useEffect (pas React Query)
- useLinkMeDashboard : charge TOUTES les commandes sans filtre date

## Documentation de reference

- `docs/current/linkme/GUIDE-COMPLET-LINKME.md` — guide complet 2.0
- `docs/current/linkme/commission-reference.md` — formules commissions
- `docs/current/linkme/commission-pricing-rules.md` — audit commissions (restaure)
- `docs/current/linkme/business-rules-linkme.md` — regles metier (restaure)
- `docs/current/linkme/routes-index.md` — audit routes (restaure)
- `docs/linkme/margin-calculation.md` — calcul marge SSOT (restaure)
- `docs/current/serena/linkme-commissions.md` — formule corrigee (restaure)
- `docs/current/serena/linkme-architecture.md` — architecture 2 tables (restaure)
