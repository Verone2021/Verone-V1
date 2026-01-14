# Plan Actif

**Branche**: `fix/multi-bugs-2026-01`
**Last sync**: 2026-01-14 (20658534)

## Regles

- Task ID obligatoire: `[APP]-[DOMAIN]-[NNN]` (ex: BO-DASH-001, LM-ORD-002, WEB-CMS-001)
- Bypass: `[NO-TASK]` dans le message de commit (rare)
- Apres commit avec Task ID: `pnpm plan:sync` puis `git commit -am "chore(plan): sync"`

## Taches Actives

---

## TASK: LM-ORD-004 — Pré-remplissage contacts clients (Phase 3-5)

**Contexte** : Feature pré-remplissage automatique des données contacts depuis la DB quand un client existant est sélectionné.

**Phase 1-2** : ✅ Terminées (CreateOrderModal)
**Phase 3-5** : En cours (OrderFormUnified + Tests)

### Phase 3 : Modifier OrderFormUnified (sélection publique)

- [ ] **LM-ORD-004-5** : Importer et utiliser le hook useOrganisationContacts
- [ ] **LM-ORD-004-6** : Pré-remplir quand organisation existante sélectionnée

### Phase 4 : LocalStorage pour utilisateurs publics (optionnel)

- [ ] **LM-ORD-004-7** : Ajouter cache localStorage dans OrderFormUnified

### Phase 5 : Tests

- [ ] **LM-ORD-004-8** : Tester CreateOrderModal (utilisateur authentifié)
- [ ] **LM-ORD-004-9** : Tester OrderFormUnified (sélection publique)
- [ ] **LM-ORD-004-10** : Tester cache localStorage

---

## TASK: LM-ORG-003 — Améliorer popup carte organisations (8 tâches, ~45 min)

**Contexte** : Le popup de la carte `/organisations?tab=map` est trop basique.

- [ ] **LM-ORG-003-1** : Étendre interface Organisation
- [ ] **LM-ORG-003-2** : Créer composant MapPopupCard
- [ ] **LM-ORG-003-3** : Design détaillé du popup
- [ ] **LM-ORG-003-4** : Intégrer MapPopupCard dans MapLibreMapView
- [ ] **LM-ORG-003-5** : Fallback logo intelligent
- [ ] **LM-ORG-003-6** : Fonction utilitaire formatAddress
- [ ] **LM-ORG-003-7** : Tester le popup
- [ ] **LM-ORG-003-8** : Tester responsive

---

## TASK: LM-SEL-003 — Optimiser UX sélections publiques (17 tâches, ~1h30)

**Contexte** : Améliorer pagination + barre de catégorisation.

### Phase 1 : Corrections rapides

- [ ] **LM-SEL-003-1** : Réduire pagination à 12 produits/page
- [ ] **LM-SEL-003-2** : Réduire taille bouton "Ajouter"

### Phase 2 : Enrichir les données

- [ ] **LM-SEL-003-3** : Modifier RPC `get_public_selection`
- [ ] **LM-SEL-003-4** : Mettre à jour interface ISelectionItem

### Phase 3 : Créer composants

- [ ] **LM-SEL-003-5** : Créer SelectionCategoryBar.tsx
- [ ] **LM-SEL-003-6** : Créer SelectionCategoryDropdown.tsx
- [ ] **LM-SEL-003-7** : Exporter les composants

### Phase 4 : Intégrer dans la page

- [ ] **LM-SEL-003-8** : Ajouter states et imports
- [ ] **LM-SEL-003-9** : Remplacer CategoryTabs par SelectionCategoryBar
- [ ] **LM-SEL-003-10** : Ajouter SelectionCategoryDropdown dans section filtres
- [ ] **LM-SEL-003-11** : Mettre à jour logique de filtrage
- [ ] **LM-SEL-003-12** : Supprimer ancien code CategoryTabs

### Phase 5 : Tests

- [ ] **LM-SEL-003-13** : Tester pagination
- [ ] **LM-SEL-003-14** : Tester bouton "Ajouter"
- [ ] **LM-SEL-003-15** : Tester barre de catégorisation
- [ ] **LM-SEL-003-16** : Tester dropdown sous-catégories
- [ ] **LM-SEL-003-17** : Vérifier responsive

---

## TASK: WEB-DEV-001 — Symlink cassé node_modules/next

**Contexte** : Symlink cassé empêche démarrage site-internet.

- [ ] **WEB-DEV-001-1** : Réinstaller les dépendances (`pnpm install --force`)
- [ ] **WEB-DEV-001-2** : Vérifier symlink
- [ ] **WEB-DEV-001-3** : Tester démarrage des 3 apps

---

## TASK: [NO-TASK] — Problème affichage LinkMe (IDENTIFIÉ)

### Contexte
Le dashboard LinkMe affiche un **spinner qui tourne indéfiniment**. La page ne charge jamais son contenu. Les serveurs démarrent correctement, mais l'application est inutilisable.

### Steps to Reproduce
1. Lancer `pnpm dev`
2. Aller sur http://localhost:3002
3. Observer : spinner infini au centre de l'écran
4. Attendre 10+ secondes : rien ne change

### Expected vs Actual
- **Expected**: Dashboard LinkMe s'affiche avec les KPIs, actions rapides, etc.
- **Actual**: Spinner infini, page bloquée en état "loading"

### Evidence
- Screenshot: `.claude/reports/linkme-dashboard-loading-20260114.png`
- Console warnings: `Multiple GoTrueClient instances detected`, `❌ Activity tracking: No authenticated user`
- Network: Toutes les requêtes retournent 200 OK (Supabase fonctionne)
- HTML body: `<div class="min-h-screen flex items-center justify-center bg-white"><svg ... animate-spin ...>`

### Cause Root (IDENTIFIÉE)

**Fichier**: `apps/linkme/src/contexts/AuthContext.tsx` lignes 203-206

```typescript
useEffect(() => {
  // Éviter les doubles initialisations (StrictMode React)
  if (initializedRef.current) return;  // ← BUG ICI
  initializedRef.current = true;
```

**Problème** : En mode dev, **React StrictMode monte les composants 2 fois**.

1. **Premier montage** (intentionnel par StrictMode) :
   - `initializedRef.current` passe de `false` à `true`
   - `initSession()` est appelé
   - `setInitializing(false)` est appelé dans le finally

2. **Deuxième montage** (le "vrai" montage) :
   - `initializedRef.current` est déjà `true` (persiste entre les montages)
   - `return` immédiat ligne 205 → **aucune initialisation**
   - `initializing` reste bloqué à `true` pour toujours
   - Dashboard reste en loading infini (ligne 64-70 de `dashboard/page.tsx`)

### Pourquoi ça a cassé récemment ?

**Git diff HEAD~3..HEAD** montre des commits récents sur LinkMe :
- `[LM-ORD-004]` : Modifications OrderFormUnified + CreateOrderModal
- `[NO-TASK]` : Fix multi-app stability (commit cf890814)

Le problème existait probablement avant mais était masqué ou pas testé. La modification du commit `cf890814` a peut-être changé l'ordre de montage des composants, révélant le bug.

### Impact

- ✅ **back-office** : Fonctionne (http://localhost:3000/login)
- ✅ **site-internet** : Fonctionne (http://localhost:3001/)
- ❌ **linkme** : **BLOQUÉ** (http://localhost:3002/dashboard)

### Fix Proposé (haut niveau)

**Option 1** (Recommandée) : Supprimer `initializedRef` et gérer le StrictMode proprement

```typescript
useEffect(() => {
  let cancelled = false;

  const initSession = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!cancelled) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchLinkMeRole(currentSession.user.id);
        }
      }
    } catch (error) {
      console.error('[AuthContext] initSession ERROR:', error);
    } finally {
      if (!cancelled) {
        setInitializing(false);
      }
    }
  };

  initSession();

  return () => {
    cancelled = true;
  };
}, []);
```

**Option 2** (Quick fix) : Reset `initializedRef` dans le cleanup

```typescript
useEffect(() => {
  initializedRef.current = true;

  // ... code existant ...

  return () => {
    initializedRef.current = false; // Reset pour le prochain montage
  };
}, []);
```

### Plan de Correction (Best Practices React 18+)

#### Analyse Préliminaire
✅ Audit réalisé : Seul `apps/linkme/src/contexts/AuthContext.tsx` utilise le pattern problématique `initializedRef`. Les autres contextes (back-office, site-internet) ne sont pas affectés.

#### Solution Technique (Recommandée)

**Principe** : React 18 StrictMode monte/démonte intentionnellement les composants 2 fois en dev pour détecter les bugs. On doit gérer ce comportement, pas le bloquer.

**Fichier** : `apps/linkme/src/contexts/AuthContext.tsx`

**Modification** : Lignes 203-241 (remplacer le useEffect d'initialisation)

```typescript
// ❌ SUPPRIMER initializedRef.current complètement
// const initializedRef = useRef(false); // Ligne 75 à supprimer

// ✅ REMPLACER le useEffect par :
useEffect(() => {
  let cancelled = false;

  const initSession = async () => {
    const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1';
    if (DEBUG) console.log('[AuthContext] initSession START');

    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (DEBUG)
        console.log('[AuthContext] getSession result:', {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
        });

      // ✅ Vérifier cancelled AVANT setState
      if (cancelled) {
        if (DEBUG) console.log('[AuthContext] initSession CANCELLED');
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchLinkMeRole(currentSession.user.id);
      }
    } catch (error) {
      console.error('[AuthContext] initSession ERROR:', error);
    } finally {
      // ✅ Toujours setInitializing(false), même si cancelled
      if (!cancelled) {
        if (DEBUG)
          console.log(
            '[AuthContext] initSession DONE - setInitializing(false)'
          );
        setInitializing(false);
      }
    }
  };

  initSession();

  // ✅ Cleanup: marquer comme cancelled pour éviter setState après unmount
  return () => {
    const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1';
    if (DEBUG) console.log('[AuthContext] useEffect CLEANUP');
    cancelled = true;
  };
}, []); // Pas de dépendances, s'exécute à chaque montage
```

#### Pourquoi cette solution est meilleure ?

1. **Compatible StrictMode** : S'exécute 2 fois en dev, mais chaque montage est nettoyé proprement
2. **Évite les fuites mémoire** : `cancelled` empêche les setState après unmount
3. **Pattern standard React** : Recommandé dans la doc officielle React 18
4. **Pas de ref inutile** : Plus simple à comprendre et maintenir

#### Étapes d'Implémentation

**Phase 1 : Préparation**
- [ ] **STEP-1** : Créer une branche `fix/linkme-auth-strictmode`
- [ ] **STEP-2** : Backup du fichier actuel dans `.claude/archive/`

**Phase 2 : Modification du Code**
- [ ] **STEP-3** : Supprimer `const initializedRef = useRef(false);` (ligne 75)
- [ ] **STEP-4** : Supprimer le commentaire "Ref pour éviter les appels multiples" (ligne 74)
- [ ] **STEP-5** : Remplacer le useEffect lignes 203-241 par le nouveau code ci-dessus
- [ ] **STEP-6** : Vérifier que `fetchLinkMeRole` et `supabase` sont toujours dans le scope

**Phase 3 : Tests Locaux**
- [ ] **STEP-7** : `pnpm type-check` (0 erreurs attendues)
- [ ] **STEP-8** : Redémarrer le serveur linkme : `pkill -f "next dev" && pnpm dev`
- [ ] **STEP-9** : Aller sur http://localhost:3002/dashboard
- [ ] **STEP-10** : Vérifier que le dashboard charge en < 2 secondes
- [ ] **STEP-11** : Ouvrir la console : vérifier 0 erreurs (Console Zero)
- [ ] **STEP-12** : En mode DEBUG (`NEXT_PUBLIC_DEBUG_AUTH=1`) : vérifier 2 montages dans les logs

**Phase 4 : Tests de Non-Régression**
- [ ] **STEP-13** : Tester la connexion : http://localhost:3002/login
- [ ] **STEP-14** : Tester la déconnexion
- [ ] **STEP-15** : Rafraîchir la page (F5) : session doit persister
- [ ] **STEP-16** : Vérifier back-office (http://localhost:3000) fonctionne toujours
- [ ] **STEP-17** : Vérifier site-internet (http://localhost:3001) fonctionne toujours

**Phase 5 : Commit & Documentation**
- [ ] **STEP-18** : `git add apps/linkme/src/contexts/AuthContext.tsx`
- [ ] **STEP-19** : Commit : `[LM-AUTH-001] fix: resolve infinite loading in dashboard due to StrictMode`
- [ ] **STEP-20** : `pnpm plan:sync`
- [ ] **STEP-21** : `git commit -am "chore(plan): sync"`

#### Critères de Succès (Acceptance)

✅ **Fonctionnel**
- Dashboard LinkMe s'affiche en < 2 secondes
- Aucun spinner infini
- Login/logout fonctionnent correctement
- Rafraîchissement de page préserve la session

✅ **Qualité**
- Console Zero : 0 erreurs (warnings Sentry acceptables)
- TypeScript : 0 erreurs
- Back-office et site-internet non impactés

✅ **Best Practices**
- Code compatible React 18 StrictMode
- Pattern cleanup standard utilisé
- Pas de ref inutiles

#### Risques Identifiés

🟡 **Risque Faible** : Si `fetchLinkMeRole` prend > 5 secondes, le cleanup pourrait annuler la requête
   - **Mitigation** : Acceptable, car c'est le comportement attendu en cas d'unmount

🟢 **Pas de risque** : Back-office et site-internet n'utilisent pas ce pattern

#### Temps Estimé

- **Modification** : 5 minutes
- **Tests** : 10 minutes
- **Total** : ~15 minutes

---

## TASK: [NO-TASK] — Correction serveurs dev multiples (RÉSOLU)

### Contexte
Les serveurs ne recompilaient pas. Plusieurs instances de `next dev` tournaient simultanément, causant des conflits.

### Steps to Reproduce
1. Lancer `pnpm dev`
2. Modifier du code dans n'importe quelle app
3. Observer que les changements ne se recompilent pas
4. Vérifier avec `ps aux | grep "next dev"` → plusieurs processus identiques

### Expected vs Actual
- **Expected**: 1 processus par app (3 total : back-office, linkme, site-internet)
- **Actual**: 4-5 processus dont 2 pour back-office → conflits de recompilation

### Evidence
- Processus multiples détectés : `43815`, `56758` (back-office), `43849` (linkme), `43850` (site-internet)
- Ports utilisés correctement mais processus en double

### Fix Appliqué
1. ✅ Tué tous les processus `next dev` avec `pkill -9 -f "next dev"`
2. ✅ Libéré les ports 3000, 3001, 3002
3. ✅ Nettoyé les builds `.next` de chaque app
4. ✅ Relancé `pnpm dev` proprement

### Résultat (2026-01-14 20:31)
✅ **RÉSOLU** - Serveurs lancés correctement :
- **back-office** : http://localhost:3000 (PID 59500)
- **site-internet** : http://localhost:3001 (PID 59503)
- **linkme** : http://localhost:3002 (PID 59504)

### Commandes Utiles (pour l'avenir)
```bash
# Arrêter proprement
pnpm dev:stop

# Nettoyer et redémarrer
pnpm dev:clean && pnpm dev

# Vérifier les ports
lsof -i :3000 -i :3001 -i :3002 | grep LISTEN
```

---

## Notes

**Fichiers archivés** : `.claude/archive/plans-2026-01/ACTIVE-backup-*.md`

**Priorité** : LM-ORD-004-5 à 4-10 (continuité logique)

**Sentry DSN** : ✅ Configuré manuellement dans `.env.local`
