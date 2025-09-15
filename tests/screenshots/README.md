# Screenshots de Test

Ce dossier contient tous les screenshots générés par les tests Playwright, organisés par fonctionnalité pour faciliter le debug et la validation visuelle.

## 📁 Organisation

### `auth/`
Screenshots liés à l'authentification :
- Pages de connexion
- Processus d'authentification
- Erreurs de validation
- États des sessions utilisateur

### `catalogue/`
Screenshots du système de catalogue :
- Pages de gestion des catégories
- Interface de catalogue
- États de chargement
- Interactions utilisateur

### `families/`
Screenshots de gestion des familles de produits :
- Formulaires de création/modification
- États des formulaires
- Processus d'upload d'images
- Validation des données

### `dashboard/`
Screenshots du dashboard et pages principales :
- Interface principale (homepage)
- Tableaux de bord
- Métriques et KPIs
- États responsive

## 🎯 Utilisation par Playwright

Ces screenshots sont automatiquement générés lors des tests E2E pour :
- **Validation visuelle** - Vérifier l'apparence des composants
- **Debug des échecs** - Comprendre pourquoi un test échoue
- **Documentation** - Historique des états de l'application
- **Régression testing** - Détecter les changements visuels non intentionnels

## 📊 Convention Nommage

Format : `[feature]-[state]-[context].png`
- `login-error-validation.png` - Erreur de validation sur la page login
- `family-form-before-submit.png` - État du formulaire famille avant soumission
- `categories-page-after-refresh.png` - Page catégories après rafraîchissement

## ⚠️ Maintenance

Les screenshots sont générés automatiquement. Ne pas les modifier manuellement.
Ils sont ignorés par Git pour éviter d'encombrer le repository.