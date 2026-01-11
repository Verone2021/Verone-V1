# Security Architecture - Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

## Table des matières

- [Introduction](#introduction)
- [RLS Strategy](#rls-strategy)
- [JWT Validation](#jwt-validation)
- [RGPD Compliance](#rgpd-compliance)
- [Audit Trails](#audit-trails)
- [Vulnerabilities](#vulnerabilities)

---

## Introduction

Architecture sécurité complète du système Vérone : RLS policies, JWT validation, RGPD compliance, audit trails.

**À documenter** :

- Row Level Security (RLS) strategy Supabase
- JWT tokens validation (Supabase Auth)
- RGPD compliance (anonymisation data, exports)
- Audit trails (logs modifications, deleted_at soft delete)
- Scan vulnérabilités (npm audit, Sentry)
- Input validation (Zod schemas)
- SQL injection prevention (parameterized queries)

---

**Retour** : [Documentation Architecture](/Users/romeodossantos/verone-back-office-V1/docs/architecture/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
