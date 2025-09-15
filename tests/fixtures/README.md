# Fixtures de Test

Ce dossier contient toutes les données et assets utilisés pour les tests du projet Vérone Back Office.

## 📁 Organisation

### `csv/`
Fichiers CSV pour les tests d'import de données :
- `Copie de Catalogue Internet 2-2.csv` - Fichier CSV original contenant les 241 produits Vérone

### `images/`
Images de test pour valider l'upload et l'affichage :
- Images de test pour les formulaires
- Screenshots d'erreurs pour debug

### `sql/`
Scripts SQL pour les données de test :
- Données seed pour les tests
- Scripts de nettoyage de base de données

## 🎯 Utilisation

Ces fichiers sont utilisés automatiquement par :
- Les tests E2E Playwright
- Les scripts de debug et validation
- Les tests unitaires

## 📊 Données Importantes

Le fichier `csv/Copie de Catalogue Internet 2-2.csv` contient exactement **241 produits** qui ont été importés avec succès dans la base de données Supabase via le processus d'import systématique documenté dans `manifests/process-learnings/`.

## ⚠️ Note

Ne pas modifier ces fichiers sans comprendre leur impact sur les tests existants.