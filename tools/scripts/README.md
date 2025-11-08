# 🛠️ Scripts Outils Vérone

Scripts d'automatisation pour le projet Vérone Back Office.

---

## 📖 generate-stories.js

**Objectif** : Génération automatique de stories Storybook pour tous les composants TSX.

### Utilisation

```bash
# Générer toutes les stories manquantes
npm run generate:stories

# Mode dry-run (aperçu sans créer les fichiers)
npm run generate:stories:dry

# Force la régénération (même si story existe)
npm run generate:stories:force

# Générer story pour un seul composant
node tools/scripts/generate-stories.js --component=ProductCard
```

### Options

| Option             | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `--dry-run`        | Affiche les fichiers qui seraient créés sans les créer |
| `--component=Name` | Génère story pour un seul composant spécifique         |
| `--force`          | Force la régénération même si story existe déjà        |

### Fonctionnement

1. **Scan** : Trouve tous les fichiers `.tsx` dans `src/components/`
2. **Classification** : Détermine la catégorie (ui, business, forms, layout, admin)
3. **Template** : Sélectionne le template approprié
4. **Génération** : Crée le fichier `.stories.tsx` avec placeholders remplacés
5. **Sauvegarde** : Écrit dans `src/stories/[catégorie]/`

### Templates utilisés

| Catégorie    | Template                      | Exemples                     |
| ------------ | ----------------------------- | ---------------------------- |
| **ui**       | `variants-story.template.tsx` | Button, Badge, Card          |
| **business** | `business-story.template.tsx` | ProductCard, OrderTable      |
| **forms**    | `business-story.template.tsx` | ProductForm, CreateOrderForm |
| **layout**   | `basic-story.template.tsx`    | Header, Sidebar              |
| **admin**    | `business-story.template.tsx` | UserManagement, Settings     |

### Exclusions

Composants **déjà créés manuellement** (exclus de la génération auto) :

- `ui/button.tsx`
- `ui/card.tsx`
- `ui/verone-card.tsx`
- `ui/badge.tsx`
- `ui/input.tsx`

Dossiers **exclus** :

- `testing/`
- `providers/`
- Fichiers spéciaux (`index.tsx`, `types.ts`)

### Exemple de sortie

```bash
$ npm run generate:stories:dry

🤖 Auto-Génération Stories Storybook

Mode: DRY-RUN

📦 262 composants TSX trouvés

[DRY-RUN] Créerait: src/stories/1-UI-Base/Select.stories.tsx
[DRY-RUN] Créerait: src/stories/1-UI-Base/Textarea.stories.tsx
[DRY-RUN] Créerait: src/stories/2-Business/ProductCard.stories.tsx
⏭️  Existe déjà: Button (ui)
⏭️  Existe déjà: Card (ui)
...

📊 Résumé:
✅ Créés: 44
⏭️  Ignorés: 218
❌ Erreurs: 0
📦 Total: 262

💡 Mode DRY-RUN activé. Relancez sans --dry-run pour créer les fichiers.
```

### Post-génération

Après génération automatique :

1. **Vérifier** : `npm run storybook` → Inspecter visuellement les stories
2. **Enrichir** : Ajouter variants spécifiques, mock data réelles
3. **Tester** : Accessibilité (addon a11y), responsive (viewport)
4. **Commit** : `git add src/stories/ && git commit -m "feat: Add Storybook stories auto-generated"`

---

## 🔄 Maintenance Scripts (à venir)

- `cleanup-unused-components.js` : Supprimer composants non utilisés
- `update-imports.js` : Mettre à jour imports après refactoring
- `sync-storybook-index.js` : Générer index Storybook automatique

---

**Créé** : 2025-10-21
**Responsable** : Romeo Dos Santos
