# Runbook — retour arrière (rollback)

**Source de vérité unique pour annuler une mise en production.**
Créé le 2026-07-30 (`[BO-AUDIT-005]`) en remplacement de `docs/current/deploy-runbooks.md`, dont la seule procédure de rollback (`git revert` puis `git push origin main`, ligne 95) est **interdite par `CLAUDE.md:129` et bloquée par `.husky/pre-commit:14-17` et `.claude/settings.json`** — donc infaisable.

---

## Règle d'or

> **On rétablit d'abord, on comprend ensuite.**
> Le rollback applicatif ne passe pas par git. Il passe par Vercel, il prend trente secondes, et il n'écrit rien dans le dépôt.

---

## 1. Rollback applicatif — 30 secondes

C'est le seul geste à faire quand la production est cassée.

```bash
# Lister les déploiements de production, du plus récent au plus ancien
vercel ls verone-back-office --prod

# Remettre en ligne le dernier déploiement qui fonctionnait
vercel promote <url-du-deploiement>
```

Ou dans le tableau de bord : **Vercel → Project → Deployments → le déploiement sain → Promote to Production**.

Précédent réel : ADR-020 (`.claude/DECISIONS.md:584`) — « Rollback appliqué : `vercel promote <njqx4dcu9-url>` », production rétablie sans passer par git.

À faire à trois reprises identiques : back-office, `linkme`, `site-internet` sont trois projets Vercel distincts. Ne promouvoir que celui qui est cassé.

**Ce qu'il ne faut pas faire** : `git revert` puis `git push origin main`. C'est ce que l'ancien runbook prescrivait. Le push direct sur `main` est interdit par les règles du repo et bloqué par les hooks, et même s'il passait il déclencherait un build de plusieurs minutes pendant lesquelles la production reste cassée.

---

## 2. Corriger proprement — ensuite, sans urgence

La production est rétablie, le code du dépôt est toujours fautif. Le chemin normal :

```bash
git checkout staging && git pull
git checkout -b fix/[APP-DOMAIN-NNN]-revert-<sujet>
git revert <sha-fautif>          # ou un correctif ciblé
# PR vers staging, jamais vers main
gh pr create --base staging --title "[APP-DOMAIN-NNN] fix: ..."
```

Puis la PR release `staging → main`, créée automatiquement le lundi 06:00 UTC par `.github/workflows/auto-release-staging-to-main.yml`, ou à la demande.

**Attention** : `vercel promote` ne modifie pas le dépôt. Tant que l'étape 2 n'est pas faite, le prochain déploiement de `main` remettra le code fautif en ligne.

---

## 3. Cas d'urgence — hotfix direct vers `main`

Prévu et autorisé, mais tracé. `.github/workflows/protect-main-source.yml:40` exige le label **`hotfix-direct`** sur la PR :

```bash
gh pr create --base main --title "[APP-DOMAIN-NNN] hotfix: ..." --label hotfix-direct
```

Sans ce label, la PR est refusée par le workflow. À n'utiliser que si `staging` est lui-même bloqué.

---

## 4. Rollback de base de données

**Il n'y a pas de `down` migration dans ce projet.** Les migrations sont append-only (`.claude/rules/database.md:9`). Annuler un changement de schéma = écrire une **nouvelle migration** qui applique l'inverse.

Avant toute chose, lire `.claude/rules/no-phantom-data.md` : si la donnée est incohérente parce que le code est fautif, on corrige le code, **pas la base**.

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_revert_<sujet>.sql
-- Annule la migration YYYYMMDDHHMMSS_<sujet-fautif>.sql
-- Raison : <incident, date, ce qui a cassé>
```

Application : via `mcp__supabase__execute_sql` ou le SQL Editor du dashboard. **`supabase db push` reste déconseillé** — 418 fichiers de migration à l'ancien format `AAAAMMJJ_NNN` empêchent un push propre (cf. `.claude/work/ACTIVE.md`, réalignement du 2026-07-23).

Puis régénérer les types et la documentation :

```bash
pnpm generate:types
python3 scripts/generate-docs.py --db
```

**Suppression de données : jamais sans sauvegarde préalable et sans accord explicite de Roméo.** Un `DELETE` ou un `DROP` en production est une action irréversible au sens de `CLAUDE.md`.

---

## 5. Après l'incident — obligatoire

1. **Un ADR dans `.claude/DECISIONS.md`** : ce qui a cassé, comment on l'a su, ce qui a été rétabli, ce qui empêchera la récidive. Le repo a 2,7 mois de décisions non tracées ; c'est ainsi que l'extinction du filet E2E est passée inaperçue.
2. **Un test de régression** qui échoue sur le bug et passe après le correctif (`.claude/rules/non-regression.md`).
3. **Mettre à jour `.claude/work/ACTIVE.md`** dans le même geste (`.claude/rules/active-md-maintenance.md`).
4. Si l'incident révèle un motif récurrent : une règle dans `.claude/rules/`, et un gate qui la fait respecter. Une règle sans gate est un vœu.

---

## Ce que ce runbook ne couvre pas encore

À écrire, identifié comme manquant à l'audit du 2026-07-30 :

- **Plan de reprise (PRA)** : sauvegardes Supabase, RPO/RTO, restauration point-in-time, date du dernier test de restauration. Rien n'existe aujourd'hui, sur une application qui gère rapprochement bancaire, TVA et commissions.
- **Préproduction** : `vercel.json:7-13` désactive les déploiements de `staging` (`"staging": false, "main": true`). Il n'existe donc aucun environnement où vérifier un correctif avant la production. Inverser ces deux réglages est le prérequis d'un vrai rollback testable.
