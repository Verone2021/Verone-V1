# Pull Request - Vérone Back Office

## 📋 Type de changement

<!-- Cocher la case appropriée -->

- [ ] 🐛 Bug fix (correction non-breaking)
- [ ] ✨ New feature (nouvelle fonctionnalité non-breaking)
- [ ] 💥 Breaking change (modification incompatible avec versions précédentes)
- [ ] 📚 Documentation (mise à jour docs uniquement)
- [ ] 🔧 Refactoring (amélioration code sans changement fonctionnel)
- [ ] ⚡ Performance (optimisation performance)
- [ ] 🧪 Tests (ajout ou modification tests)
- [ ] 🔒 Security (correctif sécurité)

---

## 🎯 Contexte & Motivation

**Pourquoi ce changement est nécessaire ?**

<!-- Décrire le problème résolu ou la fonctionnalité ajoutée -->
<!-- Lien vers issue/ticket si applicable : Closes #XX -->

---

## 📝 Description détaillée

**Quoi exactement a été modifié ?**

<!-- Description technique précise des modifications -->
<!-- Lister fichiers principaux modifiés et raisons -->

## **Changements clés** :

-
- ***

## ✅ Tests effectués

<!-- Décrire comment les changements ont été validés -->

### Tests unitaires

- [ ] Tests unitaires ajoutés/modifiés (Vitest)
- [ ] Coverage > 80% sur code modifié
- [ ] Tous tests passent : \`npm run test\`

### Tests E2E / Manuel

- [ ] Tests manuels effectués
- [ ] Scénarios testés :
  - [ ] Scénario 1 : ...
  - [ ] Scénario 2 : ...

### Console Error Check (MANDATORY)

- [ ] **Zero console errors** : Playwright browser check effectué
- [ ] Screenshot console clean attaché ci-dessous

**Screenshot Playwright Console** :

<!-- Ajouter capture d'écran console propre ici -->

---

## ⚠️ Risques & Impacts

**Quels sont les risques potentiels de ce changement ?**

<!-- Identifier impacts possibles sur autres modules/features -->
<!-- Lister dépendances affectées -->

**Impacts identifiés** :

- [ ] Aucun impact (changement isolé)
- [ ] Impact modules : ...
- [ ] Impact database : ... (migration requise ?)
- [ ] Impact performance : ...
- [ ] Impact UI/UX : ...

---

## 🔄 Rollback

**Procédure de rollback si problème en production**

<!-- OBLIGATOIRE : Décrire comment revenir en arrière -->

### Rollback Database (si migration SQL)

\`\`\`sql
-- Script de rollback
-- Exemple : DROP COLUMN, DROP TABLE, etc.
\`\`\`

### Rollback Code

- [ ] Revert commit possible sans impact
- [ ] Feature flag pour désactivation : \`FEATURE_XXX=false\`
- [ ] Backup requis avant déploiement

**Procédure détaillée** :

1.
2.
3.

---

## 📸 Screenshots (si UI modifié)

<!-- Ajouter captures avant/après si changement visuel -->

**Avant** :

**Après** :

---

## 📚 Documentation

<!-- Cocher si applicable -->

- [ ] README mis à jour
- [ ] CLAUDE.md mis à jour
- [ ] Documentation technique ajoutée (docs/)
- [ ] Storybook story ajoutée (si nouveau composant)
- [ ] KPI documenté en YAML (si nouveau KPI)
- [ ] Changelog mis à jour

---

## ✨ Checklist finale

**Avant de soumettre cette PR, vérifier que** :

### Code Quality

- [ ] Code respecte conventions nommage (voir CLAUDE.md)
- [ ] Pas de console.log / debugger laissés
- [ ] Pas de code commenté inutile
- [ ] ESLint passe : \`npm run lint\`
- [ ] TypeScript compile sans erreur

### Tests

- [ ] Tests unitaires ajoutés/modifiés
- [ ] Tous tests passent
- [ ] **Console errors = 0** (Playwright check)

### Database (si applicable)

- [ ] Migration nommée correctement : \`YYYYMMDD_NNN_description.sql\`
- [ ] Migration testée en local
- [ ] Rollback migration documenté
- [ ] RLS policies vérifiées
- [ ] Anti-hallucination check (voir docs/database/best-practices.md)

### Securité

- [ ] Pas de secrets en dur (API keys, passwords)
- [ ] Validation inputs (Zod) si API/form
- [ ] RLS policies à jour si nouvelle table

### Performance

- [ ] Pas de requêtes N+1
- [ ] Indexes DB ajoutés si nécessaire
- [ ] Images optimisées si applicable

### Documentation

- [ ] README à jour si nécessaire
- [ ] Commentaires code si logique complexe
- [ ] Protected files respectés (voir PROTECTED_FILES.json)

---

## 👥 Reviewers

<!-- Mentionner reviewers suggérés -->

**Reviewers recommandés** :

- @owner (si fichiers protégés modifiés)
- @tech-lead (si database modifiée)

---

## 📎 Informations complémentaires

<!-- Tout contexte additionnel utile -->

**Liens utiles** :

- Issue : #
- Documentation :
- Référence externe :

**Notes** :

---

**🚀 Vérone Back Office 2025 - Professional Development**
