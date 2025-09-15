# Scripts de Debug et Validation

Ce dossier contient tous les scripts de développement et de debug pour le projet Vérone Back Office.

## 📁 Organisation

### `rls-policies/`
Scripts pour tester et déboguer les politiques Row-Level Security (RLS) de Supabase :
- Tests de validation des permissions utilisateur
- Scripts de bypass temporaire pour développement
- Outils de debug des politiques RLS

### `storage/`
Scripts pour tester le système de stockage et upload d'images :
- Tests d'upload d'images vers Supabase Storage
- Validation des politiques de stockage
- Debug des problèmes d'upload

### `forms/`
Scripts pour tester les formulaires et composants UI :
- Tests des formulaires de création (familles, catégories)
- Validation des interactions utilisateur
- Debug des problèmes de soumission

## 🚀 Utilisation

```bash
# Exécuter un script de debug
node tests/debug/rls-policies/test-storage-rls-validation.js

# Vérifier les politiques RLS
node tests/debug/rls-policies/debug-rls-policies.js
```

## ⚠️ Important

Ces scripts sont destinés au **développement uniquement** et ne doivent jamais être utilisés en production.