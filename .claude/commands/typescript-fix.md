# /typescript-fix <famille>

Démarre la correction d'une famille d'erreurs TypeScript avec tests et validation.

## Usage

```bash
/typescript-fix TS2322-null-undefined
```

## Arguments

- `<famille>` : ID de la famille depuis `TS_ERRORS_PLAN.md` (ex: TS2322-null-undefined)

## Workflow Automatique

1. **Validation famille existe**
   - Check `TS_ERRORS_PLAN.md`
   - Vérifier status = TODO
   - Charger métadonnées famille

2. **Analyse approfondie**
   - Lire 5-10 exemples erreurs famille
   - Identifier pattern exact
   - Décider stratégie : Script auto | Manual | Hybrid

3. **Correction COMPLÈTE**
   - Corriger TOUTES les erreurs de la famille
   - Une seule session pour maintenir contexte
   - Documenter décisions CHANGELOG

4. **Tests OBLIGATOIRES (AVANT commit)**
   ```bash
   # 1. TypeCheck
   npm run type-check | tee check-post-fix.log
   # Vérifier : erreurs réduites

   # 2. Build
   npm run build
   # Doit réussir sans nouvelles erreurs

   # 3. MCP Browser pages affectées
   # Vérifier 0 console errors
   ```

5. **Commit structuré**
   ```
   fix(types): [FAMILLE] Description - X erreurs résolues (avant→après)

   Famille : TS2322 - Null/Undefined incompatibility
   Fichiers : 15 modifiés
   Stratégie : Null coalescing operator (??)
   Tests : ✅ MCP Browser 0 errors
   Build : ✅ Success

   Avant : 975 erreurs
   Après : 825 erreurs
   Delta : -150 erreurs
   ```

6. **Push et mise à jour plan**
   - Push commit
   - Update `TS_ERRORS_PLAN.md` (status → DONE)

## Stratégies par Type

**TS2322 - Type incompatibility**
- Null coalescing : `value ?? fallback`
- Optional chaining : `object?.property`
- Type narrowing : `if (value !== null)`

**TS2345 - Argument type mismatch**
- Type assertion : `value as TargetType`
- Generic constraints : `<T extends Base>`
- Interface updates

**TS2339 - Property does not exist**
- Interface extension
- Optional properties : `property?: Type`
- Type guards

**TS7006 - Implicit any**
- Explicit typing : `(param: Type) => {}`
- Generic types : `<T>`

## Validation Succès

✅ Erreurs TypeScript réduites
✅ Build successful
✅ Console errors = 0
✅ Aucune régression fonctionnelle
✅ TS_ERRORS_PLAN.md updated

## Agents MCP Utilisés

- **Serena** : Code analysis, symbolic editing
- **Playwright** : Browser testing, console check
- **Sequential Thinking** : Strategy planning
- **Filesystem** : File operations
