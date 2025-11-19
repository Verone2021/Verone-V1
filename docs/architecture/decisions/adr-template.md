# ADR-XXXX: [Titre Court de la Décision]

**Date** : YYYY-MM-DD
**Auteur** : [Nom]
**Statut** : Proposé

---

## Statut

**Proposé** | Accepté | Déprécié | Supplanté par ADR-YYYY

---

## Contexte

[Décrire la situation actuelle et le problème à résoudre]

**Questions à répondre** :

- Quelle est la situation actuelle ?
- Quel problème voulons-nous résoudre ?
- Quelles sont les contraintes (techniques, temporelles, budgétaires) ?
- Qui est impacté par cette décision ?

**Exemple** :

> Nous avons besoin de gérer un catalogue produits avec variantes, packages, et collections. Le schema database actuel ne permet pas de modéliser efficacement cette complexité sans duplication de données.

---

## Décision

[Décrire la décision prise - utiliser l'impératif]

**Nous avons décidé de** [décision principale]...

**Implémentation** :

- [Détail technique 1]
- [Détail technique 2]
- [Détail technique 3]

**Exemple** :

> Nous avons décidé d'adopter une architecture Turborepo monorepo avec 3 applications (back-office, site-internet, linkme) et 25 packages partagés (@verone/\*).

---

## Conséquences

### ✅ Positives

- [Conséquence positive 1]
- [Conséquence positive 2]
- [Conséquence positive 3]

### ⚠️ Négatives

- [Conséquence négative 1] → Mitigation : [comment gérer]
- [Conséquence négative 2] → Mitigation : [comment gérer]

### 🔄 Neutre / À Surveiller

- [Point d'attention 1]
- [Point d'attention 2]

**Exemple** :

> **Positives** :
>
> - Partage code entre apps (DRY)
> - Build incrémental (Turborepo cache)
> - Types TypeScript unifiés
>
> **Négatives** :
>
> - Complexité setup initiale → Mitigation : Documentation complète
> - Courbe apprentissage Turborepo → Mitigation : Formation équipe

---

## Alternatives Considérées

### Option A : [Nom Alternative 1]

**Description** : [Brief description]

**Avantages** :

- [Avantage 1]
- [Avantage 2]

**Inconvénients** :

- [Inconvénient 1]
- [Inconvénient 2]

**Raison rejet** : [Pourquoi cette option n'a pas été retenue]

---

### Option B : [Nom Alternative 2]

**Description** : [Brief description]

**Avantages** :

- [Avantage 1]
- [Avantage 2]

**Inconvénients** :

- [Inconvénient 1]
- [Inconvénient 2]

**Raison rejet** : [Pourquoi cette option n'a pas été retenue]

---

## Validation

**Critères de réussite** :

- [ ] [Critère 1]
- [ ] [Critère 2]
- [ ] [Critère 3]

**Métriques** :

- [Métrique 1] : Objectif [valeur]
- [Métrique 2] : Objectif [valeur]

---

## Liens & Références

**Documentation** :

- [Lien documentation 1]
- [Lien documentation 2]

**ADR Connexes** :

- ADR-YYYY : [Titre]
- ADR-ZZZZ : [Titre]

**Discussions** :

- [Lien PR GitHub]
- [Lien discussion interne]

---

**Date finalisation** : YYYY-MM-DD
**Dernière mise à jour** : YYYY-MM-DD
