# 🔍 Stock Traceability Business Rules - Vérone Back Office

**Version**: 1.0
**Date**: 22 septembre 2025
**Status**: ✅ IMPLÉMENTÉ
**Owner**: Équipe Développement Vérone

## 📋 Vue d'Ensemble

Le système de traçabilité des mouvements de stock garantit un audit trail complet de toutes les opérations stock avec attribution utilisateur et origine des mouvements. Ce document définit les règles métier applicables au système.

## 🎯 Objectifs Business

### Conformité & Audit
- **100% traçabilité** : Chaque mouvement de stock doit être tracé avec origine et utilisateur responsable
- **Audit trail** : Historique complet consultable pour investigations et contrôles
- **Responsabilité** : Attribution claire des actions pour accountability

### Automatisation Workflow
- **Commandes → Stock** : Mouvements automatiques lors des changements de statut commande
- **Temps réel** : Synchronisation immédiate entre commandes et stock
- **Prévisionnel** : Anticipation des mouvements pour optimisation gestion

## 📊 Types de Mouvements

### 1. Mouvements Manuels
**Origine** : Action directe utilisateur dans interface stock

#### Règles d'Attribution
- **Affichage** : "Manuel - [Nom Prénom Utilisateur]"
- **Icône** : Paramètres (Settings)
- **Badge** : Bleu avec label "Manuel"
- **Reference Type** : `manual_adjustment` ou `manual_entry`

#### Cas d'Usage
- Ajustements inventaire
- Corrections d'erreurs
- Mouvements exceptionnels
- Saisies initiales stock

#### Contrôles
- ✅ Utilisateur authentifié requis
- ✅ Motif obligatoire (`reason_code`)
- ✅ Notes explicatives recommandées
- ✅ Validation stock minimum si sortie

### 2. Mouvements Automatiques - Commandes
**Origine** : Triggers automatiques basés sur workflow commandes

#### Règles d'Attribution
- **Affichage** : "Commande [TYPE-ID] - [Nom Prénom Utilisateur]"
- **Icône** : Panier (ShoppingCart)
- **Badge** : Violet avec label "Commande"
- **Reference Type** : `sales_order_confirmation`, `purchase_order_reception`, etc.

#### Types de Commandes
```
VENTE-xxxxxxxx : Commandes clients
ACHAT-xxxxxxxx : Commandes fournisseurs
CMD-xxxxxxxx   : Commandes génériques
```

#### Workflow Automatisé

##### Commandes Clients (Sales Orders)
1. **Confirmation Commande** (`status: confirmed`)
   - **Trigger** : `sales_order_status_change_trigger`
   - **Action** : Création mouvement prévisionnel OUT
   - **Reference** : `sales_order_confirmation`
   - **Quantité** : Négative (réservation)
   - **Affects Forecast** : `true` avec `forecast_type: 'out'`

2. **Expédition Commande** (`status: shipped`)
   - **Trigger** : `sales_order_shipment_trigger`
   - **Action** : Création mouvement réel OUT + déduction stock
   - **Reference** : `sales_order_shipment`
   - **Quantité** : Négative (sortie physique)
   - **Affects Forecast** : `false` (mouvement réel)

##### Commandes Fournisseurs (Purchase Orders)
1. **Réception Marchandise**
   - **Trigger** : `purchase_order_reception_trigger`
   - **Action** : Création mouvement IN + augmentation stock
   - **Reference** : `purchase_order_reception`
   - **Quantité** : Positive (entrée physique)
   - **Affects Forecast** : `false` (mouvement réel)

## 🔐 Règles de Sécurité

### Authentification
- **Obligatoire** : Tous les mouvements nécessitent un utilisateur authentifié
- **Traçabilité** : `performed_by` doit pointer vers un user_id valide
- **Fallback** : Si utilisateur introuvable → "Utilisateur inconnu"

### Autorisations
- **Mouvements Manuels** : Rôle `manager` ou `admin` requis
- **Mouvements Auto** : Système uniquement (triggers DB)
- **Consultation** : Tous les utilisateurs authentifiés

### RLS Policies
```sql
-- Lecture : Utilisateurs organisation
CREATE POLICY select_movements ON stock_movements
FOR SELECT USING (auth.jwt() ->> 'organisation_id' = organisation_id);

-- Insertion : Managers+ pour mouvements manuels
CREATE POLICY insert_manual_movements ON stock_movements
FOR INSERT WITH CHECK (
  reference_type IN ('manual_adjustment', 'manual_entry')
  AND has_role(auth.uid(), 'manager')
);
```

## 📈 Règles de Calcul

### Stock Réel vs Prévisionnel
- **Stock Réel** : `affects_forecast = false` uniquement
- **Stock Prévisionnel** : `affects_forecast = true` avec type IN/OUT
- **Stock Disponible** : Réel - Prévisionnel OUT + Prévisionnel IN

### Cohérence des Données
- **Quantity Before/After** : Obligatoires pour mouvements réels
- **Quantity Change** : Doit correspondre à `after - before`
- **Contrainte** : `quantity_after >= 0` pour stock réel

### Triggers de Validation
```sql
-- Validation cohérence calculs
CREATE OR REPLACE FUNCTION validate_movement_calculation()
RETURNS trigger AS $$
BEGIN
  -- Vérifier cohérence quantity_change
  IF NOT affects_forecast AND (quantity_after - quantity_before) != quantity_change THEN
    RAISE EXCEPTION 'Incohérence dans le calcul des quantités';
  END IF;

  -- Empêcher stock négatif pour mouvements réels
  IF NOT affects_forecast AND quantity_after < 0 THEN
    RAISE EXCEPTION 'Le stock ne peut pas être négatif';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🎨 Règles d'Affichage

### Interface Utilisateur

#### Colonne "Origine"
- **Position** : 6ème colonne dans tableau mouvements
- **Largeur** : `max-w-[220px]` avec truncate
- **Tri** : Non triable (données composites)

#### Badges Visuels
```typescript
// Manuel
<Badge variant="default" className="bg-blue-50 text-blue-700">Manuel</Badge>

// Commande
<Badge variant="default" className="bg-purple-50 text-purple-700">Commande</Badge>
```

#### Icônes
- **Manuel** : `<Settings className="h-3 w-3 text-blue-600" />`
- **Commande** : `<ShoppingCart className="h-3 w-3 text-purple-600" />`

#### Indicateurs Spéciaux
- **Prévisionnel** : Suffixe "Prévisionnel ↘" ou "Prévisionnel ↗"
- **Tooltip** : Affichage complet référence au survol

### Respect Design System Vérone
- **Couleurs** : Noir (#000000), Blanc (#FFFFFF), Gris (#666666) uniquement
- **Accents** : Bleu et violet autorisés pour badges fonctionnels
- **Typography** : Hiérarchie cohérente avec reste application

## 🚨 Gestion des Erreurs

### Cas d'Erreur Traités

#### Utilisateur Introuvable
```typescript
const userName = userProfile
  ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
  : 'Utilisateur inconnu'
```

#### Référence Manquante
```typescript
const orderRef = movement.reference_id?.substring(0, 8) || 'INCONNUE'
```

#### Type Inconnu
```typescript
return {
  icon: <Clock className="h-3 w-3 text-gray-600" />,
  text: `${referenceType || 'Non spécifié'} - ${userName}`,
  badge: <Badge variant="secondary">{referenceType || 'Autre'}</Badge>
}
```

### Monitoring & Alertes
- **Console Errors** : Zéro tolérance selon règles CLAUDE.md
- **Performance** : Chargement < 2s obligatoire
- **Données Manquantes** : Logs d'alerte si référence incomplète

## 📊 Métriques & KPIs

### Indicateurs de Traçabilité
- **Taux Attribution** : % mouvements avec utilisateur identifié (cible 100%)
- **Taux Automatisation** : % mouvements via triggers vs manuels
- **Couverture Audit** : % mouvements avec référence complète

### Performance
- **Temps Réponse** : Chargement page historique < 2s
- **Pagination** : Support >1000 mouvements avec performance maintenue
- **Export** : Génération CSV < 5s pour 500 mouvements

## 🔄 Évolutions Futures

### Améliorations Prévues
1. **Notifications** : Alertes temps réel sur mouvements critiques
2. **Analytics** : Dashboard patterns utilisateurs
3. **Mobile** : Interface dédiée saisie terrain
4. **Intégrations** : APIs partenaires pour mouvements externes

### Règles d'Extension
- **Nouveaux Types** : Ajout `reference_type` avec pattern cohérent
- **Triggers** : Extension workflow pour autres modules
- **Permissions** : Granularité par type de mouvement

## ✅ Checklist Conformité

### Validation Technique
- [ ] Tous les mouvements ont un `performed_by` valide
- [ ] Référence `reference_type` + `reference_id` complète
- [ ] Cohérence calculs `quantity_before/after/change`
- [ ] RLS policies actives et testées

### Validation Fonctionnelle
- [ ] Affichage correct origine Manuel vs Commande
- [ ] Badges et icônes selon spécifications
- [ ] Performance < 2s chargement historique
- [ ] Export CSV fonctionnel

### Validation Business
- [ ] 100% traçabilité des mouvements
- [ ] Attribution utilisateur complète
- [ ] Workflow automatique commandes opérationnel
- [ ] Audit trail exploitable

---

**Document approuvé par** : Équipe Vérone
**Prochaine révision** : Novembre 2025
**Implémentation** : ✅ COMPLETE (22/09/2025)