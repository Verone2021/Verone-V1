# Documentation Technique

Ce dossier contient la documentation technique détaillée du projet Vérone Back Office, séparée de la documentation business (dans `manifests/`).

## 📁 Organisation

### `deployment/`
Guides de déploiement et mise en production :
- Configuration Vercel
- Variables d'environnement
- Process de release
- Monitoring en production

### `development/`
Setup et guides pour les développeurs :
- Installation du projet
- Configuration locale
- Convention de code
- Workflow de développement

### `troubleshooting/`
Guide de résolution des problèmes courants :
- Erreurs fréquentes et solutions
- Debug des tests Playwright
- Problèmes Supabase/RLS
- Performance et optimisation

### `api/`
Documentation technique des APIs :
- Endpoints REST
- Schéma GraphQL (si applicable)
- Authentification et autorisation
- Exemples de requêtes

## 🎯 Différence avec Manifests

| **docs/** (Technique) | **manifests/** (Business) |
|----------------------|---------------------------|
| Setup développement | Requirements business |
| Configuration serveurs | Règles métier |
| Debug et troubleshooting | Processus et workflows |
| API et intégrations | Architecture fonctionnelle |

## 📚 Navigation Rapide

- **Nouveau développeur** → `development/`
- **Problème technique** → `troubleshooting/`
- **Déploiement** → `deployment/`
- **API/Intégrations** → `api/`

## 🔄 Maintenance

Cette documentation est maintenue par l'équipe technique et mise à jour à chaque changement architectural significatif.