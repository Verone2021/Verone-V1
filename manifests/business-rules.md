# 📋 Règles Métier Vérone - Consolidées

**Version** : 2.0 Consolidée
**Mise à jour** : 27 septembre 2025
**Source** : Consolidation 16 documents business-rules/

---

## 🛍️ **CATALOGUE & PRODUITS**

### **Statuts Disponibilité**
- `en_stock` : Disponible immédiatement → `in stock` feeds
- `sur_commande` : Délai 2-8 semaines → `preorder` feeds
- `rupture` : Temporairement indisponible → `out of stock` feeds
- `discontinue` : Produit arrêté (non visible publiquement)

### **Variantes & Groupes**
- Groupées par `product_group_id` → `item_group_id` feeds
- Une variante = un produit avec référence et stock propres
- Image groupe utilisée si pas d'image variante spécifique

### **Quantités Minimales (MOQ)**
- MOQ par défaut : 1 unité
- Multiples possibles : `[1, 3, 6, 12]` (JSON)
- Commandes doivent respecter ces multiples

---

## 💰 **TARIFICATION**

### **Structure Prix**
```
Prix d'achat HT (coût fournisseur, interne)
    ↓
Prix de vente HT (base calculs)
    ↓
Prix particulier TTC = Prix vente HT × (1 + TVA)
Prix professionnel HT = Prix vente HT × (1 - Remise B2B)
```

### **TVA & Fiscalité**
- Taux standard : 20%
- Modulable par produit selon réglementation
- Marge brute = `((Prix vente - Prix achat) / Prix vente) × 100`

---

## 📦 **STOCK & TRAÇABILITÉ**

### **Mouvements de Stock**
- **100% traçabilité** : Chaque mouvement avec utilisateur + origine
- Types : Entrée, Sortie, Ajustement, Réservation
- Statuts : En cours, Validé, Annulé

### **Audit Trail**
- Historique complet movements
- Attribution utilisateur obligatoire
- Origine du mouvement (commande, ajustement, etc.)

---

## 🏢 **ORGANISATION & ACCÈS**

### **Permissions par Rôle**
- **Admin** : Accès total
- **Manager** : Gestion équipe + produits
- **Commercial** : Consultation + commandes
- **Consultant** : Lecture seule

### **Row Level Security (RLS)**
- Filtrage automatique par `organisation_id`
- Isolation données entre organisations
- Sécurité appliquée niveau base de données

---

## 🔗 **INTÉGRATIONS EXTERNES**

### **Feeds Commerce (Google/Meta)**
- Export quotidien automatique
- Mapping statuts : `en_stock` → `in stock`
- Groupes produits pour variantes
- Performance target : <10s génération

### **API Catalogue**
- REST endpoints standardisés
- Authentification Bearer Token + RLS
- Cache Redis pour performance
- Rate limiting par organisation

---

## 🎨 **DESIGN SYSTEM**

### **Couleurs Vérone (STRICT)**
- Noir : `#000000` (signature)
- Blanc : `#FFFFFF` (pur)
- Gris : `#666666` (élégant)
- **❌ INTERDIT ABSOLU** : Jaune/Doré/Ambre

### **Performance Targets**
- Dashboard : <2s
- Catalogue : <3s
- Feeds : <10s
- PDF : <5s

---

## 🚨 **RÈGLES CRITIQUES**

1. **Console Errors** : Tolérance zéro
2. **Documentation** : Français uniquement
3. **Design System** : Respect strict couleurs
4. **RLS** : Sécurité niveau BDD obligatoire
5. **Performance** : Respect SLOs définis

*Vérone Back Office - Règles Métier Consolidées*