# Plan Actif

**Branche**: `fix/multi-bugs-2026-01`
**Last sync**: 2026-01-15 (67b776e7)

## 📋 Session 2026-01-14/15 - Corrections Multiples

### ✅ Tâches Complétées (Résumé)

| Task ID | Description | Commit | Lignes |
|---------|-------------|--------|--------|
| LM-ORG-004 | Refonte gestion organisations (édition inline, filtres, routing) | cf890814 | ~400 |
| LM-SEL-003 | Optimisation UX sélections publiques (category bar, dropdown) | 8e482ddb | ~300 |
| LM-ORD-005 | Workflow création commande - Phases 1-5 (complet) | 8ef01629, 67b776e7 | ~150 |
| LM-ORD-004 | Pré-remplissage contacts - Phases 1-4 (code terminé) | 880af835, 9329ba7e | ~100 |
| LM-AUTH-001 | Fix spinner infini LinkMe | 20658534 | ~50 |
| Sentry Config | Migration Next.js 15 instrumentation | 8184e314, 125f3ee8 | ~80 |

**Temps total session**: ~5h30
**Tests requis**: LM-SEL-003 (tests visuels par utilisateur)

---

## 🔄 Tâches Restantes (Par Ordre de Priorité)

### 🔥 HAUTE PRIORITÉ

**1. LM-ORD-006** - Refonte UX Sélection Produits (~6h)
- Statut: 📋 PLAN COMPLET prêt
- Plan: `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`
- Grande feature: Layout 2 colonnes + filtres + pagination

### MOYENNE PRIORITÉ

**2. LM-ORD-004 (Phase 5)** - Tests Pré-remplissage (~10-15 min)
- Statut: Code terminé phases 1-4 ✅
- Reste: Tests manuels uniquement

**3. LM-ORG-003** - Popup Carte Organisations (~45 min)
- 8 tâches pour `/organisations?tab=map`

**4. WEB-DEV-001** - Fix Symlink (~10 min)
- `pnpm install --force`

**5. site-internet/.env.local** - Action manuelle
- `cp apps/back-office/.env.local apps/site-internet/.env.local`

---

## 📋 TASK: LM-ORD-006 — Refonte UX Sélection Produits

**Contexte**: CreateOrderModal a une UX de sélection produits insuffisante vs page publique

**Problèmes**:
- ❌ Pas de filtres par catégories
- ❌ Pas de pagination (tous produits chargés)
- ❌ Liste verticale (pas de grille)
- ❌ Panier en dessous (scroll nécessaire)

**Solution**: Refonte complète Step 4
- Layout 2 colonnes: Catalogue 60% + Panier sticky 40%
- Grille responsive (3 cols desktop → 1 mobile)
- Pagination 12 produits/page
- Filtres par catégories

**Fichier**: `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx` (lignes 870-1950)

**Plan détaillé**: `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`

**Effort**: ~6h (grande feature)

---

## 📋 TASK: LM-ORD-004 — Tests Pré-remplissage Contacts (Phase 5)

**Contexte**: Code terminé phases 1-4, tests requis

**Code implémenté**:
- ✅ Phase 1-2: Auto-fill CreateOrderModal (880af835)
- ✅ Phase 3: Pré-remplissage OrderFormUnified org existante (9329ba7e, lignes 238-259)
- ✅ Phase 4: LocalStorage cache (9329ba7e, lignes 262+)

**Fichiers**:
- `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`
- `apps/linkme/src/components/OrderFormUnified.tsx`

### Tests à effectuer (~10-15 min)

1. **CreateOrderModal** (utilisateur authentifié):
   - Se connecter sur http://localhost:3002
   - Aller dans /commandes → Nouvelle vente
   - Vérifier auto-fill des contacts depuis profil utilisateur

2. **OrderFormUnified** (sélection publique):
   - Aller sur une sélection publique (ex: /s/[id])
   - Sélectionner organisation existante
   - Vérifier pré-remplissage contacts depuis DB organisation

3. **Cache localStorage**:
   - Sélection publique → Nouveau restaurant
   - Remplir contacts → Valider commande
   - Créer nouvelle commande → Vérifier contacts pré-remplis depuis cache

### Checklist

- [ ] **LM-ORD-004-8**: Tester CreateOrderModal
- [ ] **LM-ORD-004-9**: Tester OrderFormUnified
- [ ] **LM-ORD-004-10**: Tester cache localStorage

---

## 📋 TASK: LM-ORG-003 — Popup Carte Organisations

**Contexte**: Popup `/organisations?tab=map` trop basique

**Tâches** (~45 min):
- [ ] **LM-ORG-003-1**: Étendre interface Organisation
- [ ] **LM-ORG-003-2**: Créer composant MapPopupCard
- [ ] **LM-ORG-003-3**: Design détaillé du popup
- [ ] **LM-ORG-003-4**: Intégrer MapPopupCard dans MapLibreMapView
- [ ] **LM-ORG-003-5**: Fallback logo intelligent
- [ ] **LM-ORG-003-6**: Fonction utilitaire formatAddress
- [ ] **LM-ORG-003-7**: Tester le popup
- [ ] **LM-ORG-003-8**: Tester responsive

---

## 📋 TASK: WEB-DEV-001 — Fix Symlink node_modules/next

**Contexte**: Symlink cassé empêche démarrage site-internet

**Commandes** (~10 min):
```bash
cd /Users/romeodossantos/verone-back-office-V1
pnpm install --force
pnpm dev
```

**Vérifications**:
- [ ] **WEB-DEV-001-1**: Réinstaller dépendances
- [ ] **WEB-DEV-001-2**: Vérifier symlink créé
- [ ] **WEB-DEV-001-3**: Tester démarrage 3 apps (ports 3000, 3001, 3002)

---

## 📋 TASK: site-internet/.env.local — Synchronisation (Manuel)

**Contexte**: Fichier obsolète (9 nov 2024), manque variables récentes

**Action manuelle requise**:
```bash
# Backup de l'ancien
cp apps/site-internet/.env.local apps/site-internet/.env.local.backup-obsolete

# Copier depuis back-office (à jour)
cp apps/back-office/.env.local apps/site-internet/.env.local
```

**Variables manquantes**:
- `NEXT_PUBLIC_GEOAPIFY_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Autres variables ajoutées depuis novembre

---

## Regles

- Task ID obligatoire: `[APP]-[DOMAIN]-[NNN]`
- Bypass: `[NO-TASK]` (rare)
- Après commit avec Task ID: `pnpm plan:sync` puis `git commit -am "chore(plan): sync"`

---

## Notes

**Fichiers archivés**: `.claude/archive/plans-2026-01/ACTIVE-backup-*.md`

**Plans détaillés**:
- `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`
- `.claude/work/AUDIT-LM-ORD-005.md`
- `.claude/work/UX-NOTES-ANALYSIS.md`

**Priorité recommandée**: LM-ORD-004 phase 5 (~10-15 min) → Tests pré-remplissage contacts
