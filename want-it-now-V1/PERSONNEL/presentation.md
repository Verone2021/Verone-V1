# Want It Now – Présentation (Version Interne)

## 1. Introduction
- **Nom du projet :** Want It Now  
- **Type :** Outil interne de gestion immobilière pour notre société.  
- **Modèle :** Gestion en *master-lease* (contrats fixes ou variables) et sous-location saisonnière.  
- **Objectif :** Centraliser la gestion des propriétés, des contrats et des flux financiers dans une plateforme unique.

---

## 2. Fonctionnement de l’application
- **Organisations :** Chaque société du groupe est une organisation distincte.  
- **Propriétés et propriétaires :** Chaque propriété est rattachée à une organisation et peut avoir un ou plusieurs propriétaires (quotités).  
- **Contrats de gestion :** Contrats fixes ou variables liant Want It Now et la propriété.  
- Une propriété apparaît dans l’organisation uniquement lorsqu’un contrat de gestion est signé. 
Biens sans contrat : Les propriétés qui n’ont pas encore de contrat de gestion sont traitées comme des biens en sourcing.
Nous les recherchons et insérons dans l’application dès leur identification, même si aucun accord n’est signé.
Nous contactons directement les propriétaires ou agences immobilières pour connaître les conditions et les coûts.
Chaque bien reçoit un statut clair : en négociation, en attente de signature, validé, ou refusé (trop cher).
Lorsque nous connaissons les coûts, nous pouvons ajouter une estimation des revenus potentiels afin de déterminer la rentabilité (cette estimation sera exploitée dans la V2).
L’objectif est de suivre le sourcing et la négociation de ces biens et, une fois validés, de les transformer en propriétés gérées via un contrat.
Ainsi, l’application permet de centraliser à la fois les biens en gestion et les opportunités de sourcing, pour avoir un suivi complet des biens potentiels et des négociations avec les propriétaires ou agences.
---

## 3. Gestion des Revenus et Paiements
- **Sous-location saisonnière :** Gestion des réservations (Airbnb, Booking).  
- **Import des réservations :** Import manuel avec calcul automatique des frais de plateforme.  
- **Calcul des redevances :** Paiement mensuel aux propriétaires, réparti selon leurs quotités après déduction des frais.

---

## 4. Gestion des Calendriers (Prévue pour V2)
- **Calendrier des réservations :** Affichage des disponibilités et réservations pour chaque propriété ou unité.  
- **Intégration iCal/Google Calendar :** Synchronisation via URL iCal (et éventuellement Google Calendar) pour automatiser les mises à jour.

---

## 5. Objectifs et Perspectives
- **Centraliser et automatiser** la gestion des biens et des contrats.  
- **Réduire le temps de gestion** et fiabiliser le calcul des revenus et paiements.  
- **Préparer la V2** avec gestion avancée des calendriers et intégrations externes (iCal, Google Calendar).
