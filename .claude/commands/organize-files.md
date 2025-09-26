# 📁 Commande Organisation Fichiers

**Organisation automatique** du repository selon best practices 2025

---

## 🎯 **Utilisation**

```bash
/organize-files [type] [--dry-run]
```

### **Types d'Organisation**
- `all` : Organisation complète repository
- `root` : Nettoyage fichiers root uniquement
- `docs` : Organisation documentation
- `config` : Organisation configurations
- `cache` : Nettoyage cache et temporaires

---

## 🧠 **Workflow Automatique**

### **📂 Phase 1: Analyse Structure Actuelle**
```typescript
// Utilise Serena pour analyse symbolique
mcp__serena__list_dir(".", true)  // Scan récursif
mcp__serena__find_file("*", ".")  // Tous fichiers
```

### **🏷️ Phase 2: Classification Intelligente**
```typescript
// Auto-classification selon patterns 2025
interface FileClassification {
  type: 'code' | 'config' | 'docs' | 'cache' | 'sensitive';
  destination: string;
  action: 'move' | 'delete' | 'keep' | 'archive';
  priority: 'high' | 'medium' | 'low';
}
```

### **📦 Phase 3: Réorganisation Automatique**
```typescript
// Déplacement intelligent avec Serena
mcp__serena__replace_symbol_body  // Mise à jour imports
// Puis déplacement physique fichiers
```

---

## 📋 **Règles Organisation 2025**

### **🚫 Interdits à la Racine**
```
❌ Documentation (.md non-critiques)
❌ Fichiers configuration multiples
❌ Archives et exports (.zip, .tar)
❌ Logs et temporaires (.log, .tmp)
❌ Sauvegardes et versions (.bak, .old)
```

### **✅ Autorisés à la Racine**
```
✅ CLAUDE.md (cerveau central)
✅ package.json (configuration npm)
✅ next.config.js (configuration Next.js)
✅ tailwind.config.js (styles)
✅ tsconfig.json (TypeScript)
✅ .env.local (variables)
✅ README.md (presentation projet)
```

### **📁 Structure Cible**
```
/                           # Root minimaliste
├── CLAUDE.md              # Cerveau central
├── package.json           # Config npm
├── next.config.js         # Config Next.js
└── ...configs essentiels

docs/                      # Documentation organisée
├── architecture/
├── deployment/
└── guides/

MEMORY-BANK/              # Contexte centralisé
├── active-context.md
├── project-context.md
└── sessions/

manifests/                # Règles métier
├── business-rules/
├── tasks/
└── technical-specs/

archive/                  # Fichiers obsolètes
├── 2024/
└── deprecated/

.claude/                  # Configuration Claude
├── commands/
├── workflows/
└── security/
```

---

## 🤖 **Actions Automatiques**

### **Déplacement Intelligent**
```bash
# Analyse et déplacement
1. Scan tous fichiers repository
2. Classification selon règles 2025
3. Mise à jour imports/références
4. Déplacement vers destinations
5. Nettoyage liens morts
```

### **Patterns de Déplacement**
```typescript
const ORGANIZATION_RULES = {
  // Documentation
  '*.md': {
    destination: 'docs/',
    except: ['CLAUDE.md', 'README.md'],
    subfolders: true
  },

  // Configuration
  '*.config.js': {
    destination: 'config/',
    except: ['next.config.js', 'tailwind.config.js'],
    archive_old: true
  },

  // Archives
  '*.{zip,tar,gz,bak,old}': {
    destination: 'archive/',
    create_date_folder: true
  },

  // Logs et temporaires
  '*.{log,tmp,cache}': {
    action: 'delete',
    confirm: true
  },

  // Exports
  'export_*.{json,csv,xml}': {
    destination: 'exports/',
    organize_by_date: true
  }
};
```

### **Mise à Jour Références**
```typescript
// Auto-correction imports après déplacement
function updateImports(oldPath: string, newPath: string) {
  // 1. Trouve toutes références avec Serena
  const references = await mcp__serena__find_referencing_symbols(oldPath);

  // 2. Met à jour chaque référence
  for (const ref of references) {
    await mcp__serena__replace_symbol_body(
      ref.symbol,
      ref.newBody.replace(oldPath, newPath)
    );
  }

  // 3. Valide pas de liens morts
  await validateNoDeadLinks();
}
```

---

## 📊 **Rapport Organisation**

### **Métriques Collectées**
```typescript
interface OrganizationReport {
  summary: {
    totalFiles: number;
    filesProcessed: number;
    filesMoved: number;
    filesDeleted: number;
    referencesUpdated: number;
  };

  actions: {
    moved: Array<{from: string, to: string, reason: string}>;
    deleted: Array<{file: string, reason: string}>;
    archived: Array<{file: string, location: string}>;
    skipped: Array<{file: string, reason: string}>;
  };

  structure: {
    before: FolderStructure;
    after: FolderStructure;
    improvements: string[];
  };

  errors: Array<{
    file: string;
    error: string;
    solution: string;
  }>;
}
```

### **Console Output**
```bash
📁 RAPPORT ORGANISATION REPOSITORY
=====================================
📊 Résumé:
   • Fichiers analysés: 247
   • Fichiers déplacés: 23
   • Fichiers supprimés: 8
   • Références mises à jour: 15
   • Erreurs: 0

🔄 Actions Principales:
   📦 Déplacé: DESIGN_SYSTEM_TESTS.md → docs/testing/
   📦 Déplacé: old-config.js → archive/2025/
   🗑️ Supprimé: debug.log (temporaire)
   🔗 Mis à jour: 15 imports vers nouveaux chemins

✅ REPOSITORY ORGANISÉ AVEC SUCCÈS
=====================================
```

---

## 🔍 **Mode Dry-Run**

### **Simulation Sans Modification**
```bash
/organize-files --dry-run

# Affiche toutes actions sans les exécuter
📋 SIMULATION ORGANISATION (DRY-RUN)
=====================================
🔄 Actions Prévues:
   📦 Déplacerait: rapport.md → docs/reports/
   🗑️ Supprimerait: temp_file.log
   🔗 Mettrait à jour: 3 références

⚠️ Mode simulation - aucune modification effectuée
=====================================
```

### **Confirmation Interactive**
```bash
# Pour changements majeurs
⚠️ ATTENTION: 23 fichiers seront déplacés
Continuer? (y/N): y

Déplacement en cours...
✅ Organisation terminée avec succès
```

---

## 🛡️ **Protections Sécurité**

### **Fichiers Protégés**
```typescript
const PROTECTED_FILES = [
  '.env*',           // Variables environnement
  '.git/**',         // Contrôle version
  'node_modules/**', // Dépendances
  '.next/**',        // Build cache
  '*.key',           // Clés privées
  '*.pem',           // Certificats
  '.ssh/**'          // SSH keys
];
```

### **Validation Pré-Déplacement**
```typescript
function validateSafeToMove(file: string): boolean {
  // 1. Vérifie pas dans liste protégée
  // 2. Vérifie pas référencé critiquement
  // 3. Vérifie destination accessible
  // 4. Vérifie permissions suffisantes
  return allChecksPass;
}
```

---

## 🎯 **Best Practices**

### **Usage Recommandé**
```bash
# ✅ Workflow idéal
1. /organize-files --dry-run  # Simulation d'abord
2. /organize-files all        # Exécution complète
3. /error-check              # Vérification console
4. /test-critical            # Tests validation
```

### **Fréquence d'Usage**
- ✅ **Début projet** : Organisation structure initiale
- ✅ **Fin sprint** : Nettoyage et archivage
- ✅ **Avant livraison** : Repository propre
- ✅ **Migration majeure** : Restructuration complète

---

**📁 Organisation Repository 2025 - Structure Professionnelle**