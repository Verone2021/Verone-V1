# 🏭 Sourcing - Inventaire Exhaustif des Tests Manuels

**Module** : Sourcing (Gestion fournisseurs et approvisionnements)
**Priorité** : ÉLEVÉE - Optimisation coûts et délais
**Estimation** : ~65 tests manuels détaillés

---

## 🎯 **Vue d'ensemble du Module**

Gestion complète de la chaîne d'approvisionnement : fournisseurs, catalogues, commandes, livraisons, et optimisation des coûts pour le secteur mobilier haut de gamme.

---

## 🧪 **Tests Fonctionnels Sourcing**

### **01. Gestion Fournisseurs**
- [ ] **T261** - Fiche fournisseur : informations complètes (nom, contact, conditions)
- [ ] **T262** - Évaluation fournisseur : qualité, délai, prix (notation 1-5)
- [ ] **T263** - Statut fournisseur : actif, suspendu, blacklisté
- [ ] **T264** - Conditions commerciales : remises, paiement, livraison
- [ ] **T265** - Documents joints : contrats, certifications, assurances
- [ ] **T266** - Historique relation : commandes, litiges, performances

### **02. Catalogue Fournisseur**
- [ ] **T267** - Import catalogue : CSV/Excel avec mapping intelligent
- [ ] **T268** - Synchronisation prix : manuelle et automatique planifiée
- [ ] **T269** - Comparateur prix : même produit multi-fournisseurs
- [ ] **T270** - Référencement produit : association fournisseur ↔ produit interne
- [ ] **T271** - Gestion variantes : couleurs, tailles spécifiques fournisseur
- [ ] **T272** - Disponibilité temps réel : API ou mise à jour manuelle

### **03. Commandes Fournisseurs**
- [ ] **T273** - Création bon commande : sélection produits + quantités
- [ ] **T274** - Calcul automatique : totaux HT/TTC avec conditions négociées
- [ ] **T275** - Workflow validation : créateur → manager → fournisseur
- [ ] **T276** - Génération PDF : bon de commande format professionnel
- [ ] **T277** - Envoi automatique : email fournisseur avec PDF
- [ ] **T278** - Suivi statut : envoyé, confirmé, préparation, expédié

### **04. Réception et Contrôle**
- [ ] **T279** - Bon réception : vérification quantités/qualité
- [ ] **T280** - Écarts livraison : différentiel commandé/reçu
- [ ] **T281** - Contrôle qualité : conforme/non-conforme avec photos
- [ ] **T282** - Mise en stock : automatique si contrôle OK
- [ ] **T283** - Litige fournisseur : processus réclamation intégré
- [ ] **T284** - Retour marchandise : génération étiquette + suivi

### **05. Analyses et Optimisation**
- [ ] **T285** - Performance fournisseur : respect délais, qualité, prix
- [ ] **T286** - Analyse coûts : évolution prix, impact marge
- [ ] **T287** - Négociation assistée : historique, volume, levier
- [ ] **T288** - Optimisation mix : répartition optimale multi-fournisseurs
- [ ] **T289** - Prévisionnel achats : besoins futurs selon ventes
- [ ] **T290** - ROI fournisseur : rentabilité par partenaire

---

## ⚙️ **Tests Intégration et Performance**

### **06. Intégrations Système**
- [ ] **T291** - Catalogue ↔ Sourcing : synchronisation produits bidirectionnelle
- [ ] **T292** - Stocks ↔ Sourcing : déclenchement réappro automatique
- [ ] **T293** - Comptabilité : génération écritures factures fournisseurs
- [ ] **T294** - CRM : liaison contacts fournisseur ↔ commercial
- [ ] **T295** - API externe : connexion ERP fournisseurs (EDI)

### **07. Workflows Métier**
- [ ] **T296** - Demande achat : collaborateur → validation → sourcing
- [ ] **T297** - Appel d'offres : multi-fournisseurs avec comparatif
- [ ] **T298** - Contrat cadre : conditions volume avec échéances
- [ ] **T299** - Urgence approvisionnement : circuit rapide validé
- [ ] **T300** - Saisonnalité : anticipation commandes périodes fortes

### **08. Contrôles et Sécurité**
- [ ] **T301** - Validation budgétaire : dépassement seuils bloquant
- [ ] **T302** - Séparation tâches : créateur ≠ validateur ≠ réceptionnaire
- [ ] **T303** - Audit trail : traçabilité complète décisions
- [ ] **T304** - Sauvegarde négociations : historique conditions
- [ ] **T305** - Confidentialité prix : accès restreint selon rôles

### **09. Rapports et KPIs**
- [ ] **T306** - Tableau bord achats : volume, coûts, performance
- [ ] **T307** - Analyse ABC fournisseurs : classification importance
- [ ] **T308** - Délais moyen livraison : suivi SLA par fournisseur
- [ ] **T309** - Taux service : disponibilité produits commandés
- [ ] **T310** - Économies réalisées : négociations et optimisations
- [ ] **T311** - Budget vs réalisé : suivi dépenses prévisionnelles

### **10. Tests Edge Cases**
- [ ] **T312** - Fournisseur défaillant : bascule automatique alternative
- [ ] **T313** - Rupture fournisseur : notification clients et alternatives
- [ ] **T314** - Erreur prix import : validation et correction en lot
- [ ] **T315** - Commande annulée : gestion impact stock et client
- [ ] **T316** - Devise étrangère : conversion et couverture change
- [ ] **T317** - Transport international : douanes et réglementation

### **11. Mobile et Terrain**
- [ ] **T318** - App mobile réception : scan codes + photos contrôle
- [ ] **T319** - Signature électronique : validation réception sur site
- [ ] **T320** - Mode offline : saisie en attente synchronisation
- [ ] **T321** - Géolocalisation livraison : confirmation lieu réception
- [ ] **T322** - Photo non-conformité : preuve litiges qualité

### **12. Performance Système**
- [ ] **T323** - Import catalogue 10k produits : traitement < 5min
- [ ] **T324** - Recherche fournisseur : résultats < 1s
- [ ] **T325** - Génération comparatif : multi-fournisseurs < 3s
- [ ] **T326** - Export données : gros volume < 30s

---

## 📊 **Objectifs Business Validés**

### **KPIs Sourcing**
- **Réduction coûts** : -15% prix moyen négociation assistée
- **Amélioration délais** : +20% respect planning livraison
- **Qualité** : <2% taux non-conformité réception
- **Productivité** : -50% temps traitement commandes fournisseur

### **ROI Attendu**
- **Négociation** : 5-8% économies annuelles
- **Optimisation mix** : 10-15% réduction sur-stocks
- **Digitalisation** : 60% réduction temps administratif
- **Qualité** : 80% réduction litiges fournisseurs

---

**Status** : ⏳ Tests business critiques
**Impact** : 🟡 MOYEN-ÉLEVÉ - Optimisation coûts majeure
**ROI** : 🟢 ÉLEVÉ - Économies directes quantifiables