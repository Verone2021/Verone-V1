# Common Errors - Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

## Table des matières

- [Introduction](#introduction)
- [RLS Errors](#rls-errors)
- [Database Errors](#database-errors)
- [API Errors](#api-errors)
- [Performance Errors](#performance-errors)
- [Authentication Errors](#authentication-errors)

---

## Introduction

Catalogue des erreurs courantes rencontrées dans le système Vérone avec causes et solutions.

**À documenter** :

### RLS Errors
- **"new row violates row-level security policy"** → Missing tenant_id ou policy manquante
- **"permission denied for table X"** → RLS policy trop restrictive

### Database Errors
- **"duplicate key value violates unique constraint"** → Constraint UNIQUE violation
- **"null value in column X violates not-null constraint"** → Champ obligatoire manquant

### API Errors
- **500 Internal Server Error** → Check Sentry logs, erreur serveur
- **401 Unauthorized** → JWT token invalide/expiré
- **403 Forbidden** → Permissions insuffisantes (Admin vs Owner)

### Performance Errors
- **Query timeout** → Index manquant, N+1 queries
- **Slow dashboard** → Too many hooks, cache missing

---

**Retour** : [Documentation Troubleshooting](/Users/romeodossantos/verone-back-office-V1/docs/troubleshooting/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
