# Phase 3E - Root Scripts & Triggers Audit

**Date**: 2026-01-20
**Objectif**: Audit fichiers racine (.sh, triggers) - KEEP / MOVE / DELETE

## Root scripts audit

### Fichiers trouvés

```bash
ls -la *.sh *.mjs 2>/dev/null
# Résultat: test-form-api.sh
```

---

## test-form-api.sh

**Localisation**: `/test-form-api.sh` (racine)

**Contenu**: Script test API forms LinkMe (177 lignes)

**Usage**:
- Test routes API: `/api/forms/submit`, `/api/emails/*`
- Tests validation, priorités, form types
- Base URL: `http://localhost:3002` (LinkMe)

**Références**:
```bash
rg "test-form-api" --files-with-matches
# → Aucune référence (pas utilisé dans code/CI)
```

**Décision**: **MOVE** → `scripts/testing/test-form-api.sh`

**Raison**:
- Script utile pour testing manuel
- Pas sa place à la racine
- Pas référencé dans package.json/workflows
- Catégorie: testing scripts

---

## Trigger files

### .deploy-trigger

**Contenu**:
```
# Deploy trigger 2025-12-12_03:47:50
```

**Usage**:
- Trigger manuel deploy (force Git change)
- Date: 2025-12-12 (obsolète)

**Références**: Aucune (sauf pattern .gitignore line 146)

**Décision**: **DELETE**

**Raison**:
- Obsolète (2 mois)
- Pattern deprecated (CI/CD moderne via GitHub Actions)
- .gitignore pattern `.vercel-deploy-trigger-*` suggère rotation automatique

### .vercel-trigger

**Contenu**:
```
# Force deploy after Sentry + Qonto env vars Sat Jan 17 22:46:13 CET 2026
```

**Usage**:
- Trigger deploy après config Sentry/Qonto
- Date: 2026-01-17 (récent, 3 jours)

**Références**: Aucune

**Décision**: **DELETE**

**Raison**:
- Mission accomplie (deploy effectué)
- Méthode deprecated (utiliser `vercel --force` ou GitHub redeploy)
- Pattern `.vercel-deploy-trigger-*` dans .gitignore suggère cleanup auto

---

## Vérification workflows

```bash
rg "\.deploy-trigger|\.vercel-trigger" .github/workflows/
# → Aucune référence
```

**Conclusion**: Triggers NON utilisés par CI/CD ✅

---

## Actions

### 1. Déplacer test-form-api.sh

```bash
mkdir -p scripts/testing
git mv test-form-api.sh scripts/testing/
```

**Mettre à jour** (optionnel): `package.json` pour faciliter usage

```json
{
  "scripts": {
    "test:forms": "bash scripts/testing/test-form-api.sh"
  }
}
```

### 2. Supprimer triggers obsolètes

```bash
git rm .deploy-trigger .vercel-trigger
```

**Alternative moderne**:

```bash
# Force redeploy via Vercel CLI
vercel --force

# Ou via GitHub Actions (redeploy on push)
git commit --allow-empty -m "chore: trigger deploy"
git push
```

**Documentation**: Ajouter dans `docs/runbooks/deployment.md`

---

## Résumé décisions

| File | Decision | New Path | Why |
|------|----------|----------|-----|
| `test-form-api.sh` | **MOVE** | `scripts/testing/` | Script test utile, pas sa place racine |
| `.deploy-trigger` | **DELETE** | - | Obsolète (Dec 2025), pattern deprecated |
| `.vercel-trigger` | **DELETE** | - | Mission accomplie (Jan 17), pattern deprecated |

---

## Impact

**Bénéfices**:
- ✅ Racine propre (moins de fichiers scattered)
- ✅ Scripts tests organisés dans `scripts/testing/`
- ✅ Suppression patterns obsolètes (triggers manuels)

**Risques**:
- Aucun (triggers non utilisés, script déplacé reste accessible)

**Migration path**:

Si quelqu'un cherche `test-form-api.sh`:
```bash
# Ancienne commande
./test-form-api.sh

# Nouvelle commande
npm run test:forms
# OU
bash scripts/testing/test-form-api.sh
```

---

## Checklist exécution

- [ ] Créer `scripts/testing/`
- [ ] Déplacer `test-form-api.sh` (`git mv`)
- [ ] [OPTIONNEL] Ajouter `test:forms` dans package.json
- [ ] Supprimer `.deploy-trigger` (`git rm`)
- [ ] Supprimer `.vercel-trigger` (`git rm`)
- [ ] [OPTIONNEL] Documenter alternative moderne dans `docs/runbooks/deployment.md`
- [ ] Commit: `[NO-TASK] chore: cleanup root scripts & obsolete triggers`
