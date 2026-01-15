# Plan Actif

**Branche**: `fix/multi-bugs-2026-01`
**Last sync**: 2026-01-15 (67b776e7)

## 📋 Session 2026-01-14/15 - Corrections Multiples

### ✅ Tâches Complétées (Résumé)

| Task ID | Description | Commit | Lignes |
|---------|-------------|--------|--------|
| LM-ORG-004 | Refonte gestion organisations (édition inline, filtres, routing) | cf890814 | ~400 |
| LM-SEL-003 | Optimisation UX sélections publiques (category bar, dropdown) | 8e482ddb | ~300 |
| LM-ORD-005 | Workflow création commande - Phases 1-3 (bug requester corrigé) | 8ef01629 | ~120 |
| LM-ORD-004 | Pré-remplissage contacts - Phases 1-4 (code terminé) | 880af835, 9329ba7e | ~100 |
| LM-AUTH-001 | Fix spinner infini LinkMe | 20658534 | ~50 |
| Sentry Config | Migration Next.js 15 instrumentation | 8184e314, 125f3ee8 | ~80 |

**Temps total session**: ~5h30
**Tests requis**: LM-SEL-003 (tests visuels par utilisateur)

---

## 🔄 Tâches Restantes (Par Ordre de Priorité)

### 🔥 HAUTE PRIORITÉ

**1. LM-ORD-005 (Phases 4-8)** - Workflow Création Commande (~45 min)
- Statut: Phases critiques 1-3 ✅ terminées
- Reste: Labels conditionnels + Section Notes + Tests
- Optionnel mais améliore l'UX

**2. LM-ORD-006** - Refonte UX Sélection Produits (~6h)
- Statut: 📋 PLAN COMPLET prêt
- Plan: `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`
- Grande feature: Layout 2 colonnes + filtres + pagination

### MOYENNE PRIORITÉ

**3. LM-ORD-004 (Phase 5)** - Tests Pré-remplissage (~10-15 min)
- Statut: Code terminé phases 1-4 ✅
- Reste: Tests manuels uniquement

**4. LM-ORG-003** - Popup Carte Organisations (~45 min)
- 8 tâches pour `/organisations?tab=map`

**5. WEB-DEV-001** - Fix Symlink (~10 min)
- `pnpm install --force`

**6. site-internet/.env.local** - Action manuelle
- `cp apps/back-office/.env.local apps/site-internet/.env.local`

---

## 📋 TASK: LM-ORD-005 — Workflow Création Commande (Phases 4-8)

**Contexte**: Phases critiques 1-3 déjà complétées (commit 8ef01629)
- ✅ Phase 1: Import useAuth + state requester
- ✅ Phase 2: Correction handleSubmitNew (p_requester = requester)
- ✅ Phase 3: Section Demandeur dans récapitulatif

**Reste à faire** (optionnel, amélioration UX):

### Phase 4: Labels conditionnels étape 2 (~15 min)

**Objectif**: Afficher "Propriétaire" si franchise, "Responsable" si restaurant propre

**Fichier**: `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Localisation**: Ligne ~1420 (dans `{newRestaurantStep === 2 && (`)

**Modification**:
```typescript
// REMPLACER le titre actuel
<h3 className="text-lg font-semibold text-gray-900 mb-4">
  {newRestaurantForm.ownerType === 'franchise'
    ? 'Propriétaire du restaurant (Franchisé)'
    : 'Responsable du restaurant'}
</h3>
<p className="text-sm text-gray-500 mb-4">
  {newRestaurantForm.ownerType === 'franchise'
    ? 'Informations du propriétaire franchisé'
    : 'Informations du responsable de ce restaurant'}
</p>
```

### Phase 5: Section Notes dans récapitulatif (~10 min)

**Objectif**: Afficher preview des notes en temps réel sous le champ textarea

**Fichier**: `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Localisation**: Après ligne 2175 (après champ textarea Notes, avant message validation)

**Code à insérer**:
```typescript
{/* Preview Notes en temps réel */}
{notes && notes.trim() !== '' && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
    <h4 className="text-xs font-medium text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
      <FileText className="h-3.5 w-3.5" />
      Aperçu de vos notes
    </h4>
    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{notes}</p>
  </div>
)}
```

**Import requis**: Ajouter `FileText` depuis `lucide-react` (ligne 48)

### Phase 6-8: Tests complets (~20 min)

**Tests à effectuer**:
1. Nouveau restaurant franchisé:
   - Se connecter avec Pokawa (pokawa-test@verone.io)
   - Créer commande → Nouveau restaurant → Type Franchisé
   - Vérifier étape 2: Label "Propriétaire du restaurant (Franchisé)"
   - Vérifier étape 5: Section Demandeur = utilisateur Pokawa
   - Ajouter notes → Vérifier preview temps réel
   - Valider → Vérifier en DB `p_requester`

2. Restaurant existant:
   - Sélectionner restaurant
   - Ajouter produits + notes
   - Valider → Vérifier en DB `p_requester`

3. Validation technique:
   - `pnpm type-check` → 0 erreurs
   - `pnpm build` → Build réussi
   - Console: 0 erreurs

### Checklist

- [ ] **LM-ORD-005-7**: Modifier labels étape 2 (conditionnels franchise/propre)
- [ ] **LM-ORD-005-8**: Ajouter preview notes temps réel
- [ ] **LM-ORD-005-9**: `pnpm type-check` → 0 erreurs
- [ ] **LM-ORD-005-10**: `pnpm build` → Build réussi
- [ ] **LM-ORD-005-11**: Tests manuels complets

**Effort total**: ~45 min

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

**Priorité recommandée**: LM-ORD-005 phases 4-8 (~45 min) → Complète le workflow commande
