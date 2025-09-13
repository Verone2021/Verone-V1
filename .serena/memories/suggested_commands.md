# Commandes Essentielles Vérone

## 🚀 Développement Quotidien
```bash
# Démarrage développement
npm run dev              # Lance tous les apps en mode dev (Turbo)
npm run build            # Build production de tous les packages/apps
npm run start            # Démarre en mode production

# Quality Assurance
npm run lint             # ESLint sur tous les packages
npm run lint:fix         # ESLint avec auto-fix
npm run type-check       # Vérification TypeScript
npm run test             # Tests unitaires Jest
npm run test:watch       # Tests en mode watch
npm run test:coverage    # Coverage des tests
npm run test:e2e         # Tests E2E Playwright
npm run test:e2e:ui      # Tests E2E avec interface

# Maintenance
npm run clean            # Nettoie builds et cache Turbo
```

## 🗄️ Base de Données (Supabase)
```bash
# Gestion locale Supabase
npm run db:start         # Démarre Supabase local
npm run db:stop          # Arrête Supabase local
npm run db:migrate       # Applique migrations (supabase db push)
npm run db:reset         # Reset complet base locale
npm run db:types         # Génère types TypeScript depuis schema

# Génération types automatique
# Output: packages/database/src/types.ts
```

## 📊 Scripts Business Spécialisés
```bash
# Feeds publicitaires (Meta/Google)
npm run feeds:generate   # Génère feeds CSV (scripts/generate-feeds.js)

# Export PDF catalogues
npm run pdf:export       # Test export PDF (scripts/export-pdf.js)
```

## 🛠️ MCP & Claude Code
```bash
# Vérification MCP
claude mcp list          # Status serveurs MCP

# Agents Vérone disponibles
/implement-verone <feature>    # Workflow implémentation TDD
/design-verone <interface>     # Workflow conception UX/UI
```

## 🔧 Utilitaires Système (macOS)
```bash
# Navigation
ls -la                   # Liste détaillée fichiers
find . -name "*.tsx"     # Recherche fichiers TypeScript React
grep -r "formatPrice"    # Recherche dans code
cd packages/database     # Navigation packages

# Git workflow
git status               # État repository
git add .                # Stage tous changements
git commit -m "feat: ..."  # Commit avec convention
git push origin main     # Push vers remote

# Monitoring performance
top                      # Processus système
du -sh node_modules      # Taille node_modules
```

## ⚡ Workflow Recommandé
```bash
# 1. Démarrage projet
npm run dev

# 2. Avant commit (automatique via husky)
npm run lint:fix
npm run type-check
npm run test

# 3. Avant deploy
npm run build
npm run test:e2e

# 4. Database changes
npm run db:migrate
npm run db:types
```

## 🎯 SLOs Performance à valider
- **Dashboard** : <2s load time
- **Feeds generation** : <10s pour 1000+ produits  
- **PDF export** : <5s pour 50 produits
- **Search** : <1s response time