# Architecture Decision Records (ADR)

**Date création** : 2025-11-19
**Mainteneur** : Romeo Dos Santos

---

## 📖 Qu'est-ce qu'un ADR ?

Un **Architecture Decision Record (ADR)** est un document capturant une décision architecturale importante avec son contexte, ses alternatives considérées, et ses conséquences.

### Principe

- **1 décision = 1 ADR**
- **Immutable** : Une fois écrit, un ADR ne se modifie pas (sauf typos)
- **Traçabilité** : Historique complet des décisions pour comprendre évolution architecture

---

## 📂 Liste ADR

| #    | Titre                           | Statut  | Date       |
| ---- | ------------------------------- | ------- | ---------- |
| 0001 | Turborepo Monorepo Architecture | Accepté | 2025-11-19 |
| 0002 | Design System V2 avec CVA       | Accepté | 2025-10-15 |
| 0003 | Supabase RLS Security Model     | Accepté | 2025-09-20 |
| 0004 | Pricing Multi-Canaux            | Accepté | 2025-10-10 |
| 0005 | Stock Movements Traceability    | Accepté | 2025-10-12 |

---

## 🚀 Workflow Création ADR

### 1. Identifier Besoin ADR

**Quand créer ADR ?**

- Choix technologique majeur (framework, librairie, architecture)
- Pattern architectural nouveau (RLS, polymorphic relations)
- Décision impactant >3 mois de développement
- Choix entre 2+ alternatives viables

**Quand NE PAS créer ADR ?**

- Décision triviale (couleur bouton, naming variable)
- Décision facilement réversible (composant UI)
- Choix évident sans alternative

### 2. Utiliser Template

```bash
cp docs/architecture/decisions/adr-template.md \
   docs/architecture/decisions/XXXX-titre-decision.md
```

**Numérotation** : 4 chiffres (0001, 0002, etc.)

### 3. Remplir Sections

- **Statut** : Proposé | Accepté | Déprécié | Supplanté par ADR-XXXX
- **Contexte** : Situation actuelle, problème à résoudre
- **Décision** : Ce qui a été décidé (impératif)
- **Conséquences** : Positives ET négatives
- **Alternatives Considérées** : Options écartées avec raisons

### 4. Valider & Commit

```bash
git add docs/architecture/decisions/XXXX-titre.md
git commit -m "docs(adr): ADR-XXXX Titre décision

Brief description

🤖 Generated with Claude Code"
```

### 5. Mettre à Jour Index

Ajouter ligne dans tableau ci-dessus.

---

## 📋 Template Rapide

```markdown
# ADR-XXXX: Titre Decision

## Statut

[Proposé | Accepté | Déprécié | Supplanté par ADR-YYYY]

## Contexte

Quelle est la situation ? Quel problème voulons-nous résoudre ?

## Décision

Nous avons décidé de [décision]...

## Conséquences

**Positives** :

- ...

**Négatives** :

- ...

## Alternatives Considérées

### Option A : ...

**Avantages** : ...
**Inconvénients** : ...
**Raison rejet** : ...

## Date

YYYY-MM-DD
```

---

## 🔗 Références

- [ADR GitHub Organisation](https://adr.github.io/) - Standard ADR
- [Joel Parker Henderson ADR Templates](https://github.com/joelparkerhenderson/architecture-decision-record) - Templates communauté
- [Michael Nygard ADR Article](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) - Article fondateur

---

**Retour** : [Architecture Documentation](/docs/architecture/README.md)
