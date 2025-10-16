# Orders Lifecycle - Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

## Table des matières

- [Introduction](#introduction)
- [Devis (Quote)](#devis-quote)
- [Commande (Order)](#commande-order)
- [Livraison (Delivery)](#livraison-delivery)
- [Facturation (Invoice)](#facturation-invoice)
- [États et Transitions](#états-et-transitions)

---

## Introduction

Cycle de vie complet d'une commande dans le système Vérone : Devis → Commande → Livraison → Facturation.

**À documenter** :
- **Devis** : Création, envoi client, validation/refus
- **Commande** : Conversion devis → commande, validation, préparation
- **Livraison** : Expédition, tracking, réception
- **Facturation** : Génération facture, paiement, relances
- États (draft, pending, validated, delivered, invoiced, cancelled)
- Transitions autorisées (state machine)
- Permissions Owner vs Admin par état

---

**Retour** : [Documentation Workflows](/Users/romeodossantos/verone-back-office-V1/docs/workflows/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
