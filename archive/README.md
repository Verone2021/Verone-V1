# 📦 Archive Vérone Back Office

**Dernière mise à jour** : 17 octobre 2025
**Objectif** : Centraliser toutes les archives historiques du projet avec contexte préservé

---

## 🗂️ Index des Archives

Le dossier `archive/` contient **5 archives thématiques** organisées chronologiquement :

### 1. backups-migrations-2025-10-17/
**Type** : Backup Sécurité
**Date** : 17 octobre 2025 - 02h08
**Taille** : 1.4 MB (161 fichiers)
**Statut** : ✅ Archivé (peut être supprimé après validation production)

**Contenu** : Snapshot complet migrations Supabase + scripts créé **avant consolidation migrations**.

**Utilité** :
- Filet de sécurité pré-consolidation migrations
- Rollback possible si problème consolidation
- Référence état migrations avant réorganisation

**Suppression recommandée** : Après 1 mois (mi-novembre 2025) si validation production OK

📄 [Voir README détaillé](./backups-migrations-2025-10-17/README.md)

---

### 2. design-v1-obsolete-2025-10-17/
**Type** : Design System Obsolète
**Date** : 17 octobre 2025
**Taille** : ~500 KB
**Statut** : 🗄️ Archivé (référence historique uniquement)

**Contenu** : Design system V1 noir & blanc strict (obsolète depuis Design System V2).

**Utilité** :
- Référence historique design décisions
- Comparaison V1 vs V2 design system
- Contexte évolution identité visuelle

**Ne PAS utiliser** : Utiliser `src/lib/design-system/` et `src/components/ui-v2/` pour design actuel

📄 [Voir README détaillé](./design-v1-obsolete-2025-10-17/README.md)

---

### 3. documentation-archive-2025-10/
**Type** : Documentation Consolidée
**Date** : 17 octobre 2025
**Taille** : ~800 KB (36 fichiers)
**Statut** : 📚 Archivé (contexte préservé)

**Contenu** : Archive consolidée documentation Oct 16 + Oct 17.

**Structure** :
```
documentation-archive-2025-10/
├── oct-16/              # 17 fichiers (guides, workflows, roles)
└── oct-17/              # 19 fichiers (guides migration, rapports phase 1)
```

**Utilité** :
- Référence historique guides migration appliqués
- Contexte rapports phase 1 (facturation, Google Merchant)
- Workflows v1 vs workflows actuels

**Ne PAS utiliser** : Utiliser `docs/` pour documentation actuelle

📄 [Voir README détaillé](./documentation-archive-2025-10/README.md)

---

### 4. phase-1-obsolete-2025-10-16/
**Type** : Phase Projet Obsolète
**Date** : 16 octobre 2025
**Taille** : ~300 KB
**Statut** : 🗄️ Archivé (phase terminée)

**Contenu** : Documentation, rapports et tests phase 1 du projet (obsolète).

**Utilité** :
- Référence historique phase 1
- Contexte décisions architecturales initiales
- Comparaison évolution projet

**Ne PAS utiliser** : Phase terminée, utiliser documentation actuelle `docs/` et `MEMORY-BANK/`

📄 [Voir README détaillé](./phase-1-obsolete-2025-10-16/README.md)

---

### 5. sessions-octobre-2025/
**Type** : Sessions MEMORY-BANK Historiques
**Date** : 17 octobre 2025
**Taille** : ~2.0 MB (46 fichiers)
**Statut** : 📋 Archivé (sessions Oct 13-16)

**Contenu** : Sessions MEMORY-BANK Oct 13-16 organisées en 7 catégories thématiques.

**Structure** :
```
sessions-octobre-2025/
├── phases/              # 12 fichiers (PHASE-1 à PHASE-5, PHASE-9)
├── debug-incidents/     # 7 fichiers (BUG-409, ERREUR-500, etc.)
├── migrations/          # 6 fichiers (ETAPE-2-*, migration reports)
├── tests/               # 2 fichiers (tests exhaustifs)
├── performance/         # 5 fichiers (optimisations, refonte stock)
├── sessions-guides/     # 4 fichiers (reprise guides, checkpoint)
└── recaps-complets/     # 12 fichiers (sessions complètes + 2 prévisionnels)
```

**Utilité** :
- Contexte phases 1-5 terminées
- Référence résolution bugs similaires
- Historique migrations design system V2
- Documentation workflow reprise session

**Ne PAS utiliser** : Utiliser `MEMORY-BANK/sessions/` pour contexte actuel (Oct 17+)

📄 [Voir README détaillé](./sessions-octobre-2025/README.md)

---

## 📊 Vue d'Ensemble Archives

| Archive | Type | Date | Fichiers | Taille | Statut |
|---------|------|------|----------|--------|--------|
| **backups-migrations** | Backup | 17 oct | 161 | 1.4 MB | ✅ Temporaire |
| **design-v1-obsolete** | Design | 17 oct | ~15 | 500 KB | 🗄️ Historique |
| **documentation-archive** | Docs | 17 oct | 36 | 800 KB | 📚 Référence |
| **phase-1-obsolete** | Phase | 16 oct | ~10 | 300 KB | 🗄️ Historique |
| **sessions-octobre-2025** | Sessions | 17 oct | 48 | 2.0 MB | 📋 Référence |
| **TOTAL** | — | — | **~270** | **~5.0 MB** | — |

---

## 🔍 Comment Utiliser Cette Archive

### Consultation Archives

```bash
# Accéder au dossier archive
cd archive/

# Lire ce README
cat README.md

# Explorer une archive spécifique
cd sessions-octobre-2025/
cat README.md

# Chercher fichier dans toutes archives
find . -name "*bug-409*"
find . -name "*migration*"
```

### Quand Consulter Les Archives?

#### ✅ Situations Légitimes
- **Référence historique** : Comprendre décisions passées
- **Troubleshooting** : Problèmes similaires déjà résolus
- **Contexte évolution** : Comparer V1 vs V2 (design, architecture)
- **Audit trail** : Traçabilité modifications importantes

#### ❌ Ne PAS Consulter Pour
- **Documentation actuelle** : Utiliser `docs/` (source de vérité)
- **Sessions actives** : Utiliser `MEMORY-BANK/sessions/`
- **Code actuel** : Utiliser `src/`
- **Migrations actives** : Utiliser `supabase/migrations/`

---

## 🎯 Critères d'Archivage

### ✅ Archivé (Contexte Préservé)
- **Snapshots temporels** : Backups, audits datés
- **Phases terminées** : Phase 1, migrations complétées
- **Sessions complètes** : Oct 13-16 terminées
- **Versions obsolètes** : Design system V1, documentation V1

### 🗑️ Supprimé (Obsolète Sans Valeur)
- **Duplicatas** : Fichiers redondants archivés ailleurs
- **Tests temporaires** : Scripts test one-shot
- **Rapports partiels** : Incomplets ou superseded

---

## 🚀 Maintenance Archive

### Révision Trimestrielle Recommandée

**Tous les 3 mois** :
1. Supprimer backups validés (>1 mois)
2. Archiver nouvelles sessions complétées
3. Consolider archives similaires si besoin
4. Mettre à jour ce README

### Bonnes Pratiques

✅ **Archive > Suppression** : Toujours archiver avant supprimer
✅ **README obligatoire** : Chaque archive doit avoir README.md explicatif
✅ **Structure claire** : Organiser par thématique/temporalité
✅ **Contexte préservé** : Expliquer raison archivage + utilité

---

## 📚 Documentation Liée

### Documentation Active (Source de Vérité)
- [docs/README.md](../docs/README.md) - Index principal documentation
- [MEMORY-BANK/README.md](../MEMORY-BANK/README.md) - Sessions actives
- [manifests/README.md](../manifests/README.md) - Business rules

### Rapports Cleanup
- MEMORY-BANK/sessions/RAPPORT-CLEANUP-DOCS-2025-10-17.md
- MEMORY-BANK/sessions/RAPPORT-CLEANUP-MEMORY-BANK-2025-10-17.md
- MEMORY-BANK/sessions/RAPPORT-CLEANUP-ARCHIVE-2025-10-17.md

---

## 🎓 Historique Archive

### 2025-10-17 - Réorganisation Complète
- ✅ Consolidation documentation Oct-16 + Oct-17
- ✅ Archivage backups migrations pré-consolidation
- ✅ Suppression redondances (~150 fichiers nettoyage-2025-10-17/)
- ✅ Déplacement prévisionnels vers sessions-octobre-2025/
- ✅ Création README.md master index

**Gain** : -36% fichiers (425 → ~270), -30% taille (5.0 MB → 3.5 MB)

---

## 🔗 Navigation Rapide

### Par Type de Contenu

**Migrations Database** :
- [backups-migrations-2025-10-17/](./backups-migrations-2025-10-17/)
- [sessions-octobre-2025/migrations/](./sessions-octobre-2025/migrations/)
- [documentation-archive-2025-10/oct-17/migrations-database/](./documentation-archive-2025-10/oct-17/migrations-database/)

**Debug & Incidents** :
- [sessions-octobre-2025/debug-incidents/](./sessions-octobre-2025/debug-incidents/)

**Performance & Optimisation** :
- [sessions-octobre-2025/performance/](./sessions-octobre-2025/performance/)

**Design System** :
- [design-v1-obsolete-2025-10-17/](./design-v1-obsolete-2025-10-17/)

**Guides & Workflows** :
- [documentation-archive-2025-10/oct-16/](./documentation-archive-2025-10/oct-16/)
- [documentation-archive-2025-10/oct-17/guides-migration/](./documentation-archive-2025-10/oct-17/guides-migration/)

---

**🎉 Archive Vérone Back Office - Index Master**

*Dernière mise à jour : 17 octobre 2025*
*Consolidation complète archive/ - 5 archives thématiques*
*Total : ~270 fichiers, ~3.5 MB*
