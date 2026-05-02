# Prompt à lancer dans la prochaine session — [BO-MKT-001] DAM

**À utiliser après merge PR #881 (BO-MKT-002) ET PR #882 (CLEANUP worktree).**
**Nouvelle session dédiée.**

---

## Procédure de lancement (workflow solo, SANS worktree)

```bash
cd /Users/romeodossantos/verone-back-office-V1
git fetch origin
git checkout staging
git pull --ff-only origin staging
git checkout -b feat/BO-MKT-001-dam-bibliotheque
```

Puis copie-colle ce prompt dans Claude Code :

---

Lance [BO-MKT-001] : Bibliothèque DAM (Digital Asset Management) multi-marques.

AVANT TOUT : lis `docs/scratchpad/brief-BO-MKT-001-phase1-dam.md` et `docs/scratchpad/audit-2026-04-30-bibliotheque-images-marketing.md` en entier. C'est la spec exhaustive du sprint.

SCOPE : ce qui est dans le brief Phase 1, rien de plus.

Workflow solo (cf. `.claude/rules/no-worktree-solo.md`) :

- 1 dossier `/Users/romeodossantos/verone-back-office-V1`, JAMAIS `git worktree add`
- Branche `feat/BO-MKT-001-dam-bibliotheque` créée depuis staging à jour
- Push draft immédiat pour sauvegarde + visibilité
- Reviewer-agent obligatoire avant promote ready
- Pas de GO entre étapes (cf. règle anti-GO `.claude/rules/autonomy-boundaries.md`)
- Rapport final consolidé

C'est ce sprint qui donnera la vraie bibliothèque (table, page, upload, filtres, migration). Estimation 2-3 semaines de travail réel selon le brief.

⚠️ Roméo lance lui-même le serveur dev sur :3000 quand il veut valider visuellement (cf. `feedback_pnpm_dev_kill_first.md` — l'agent ne lance JAMAIS le serveur).

⚠️ Une fois fini, ne pas oublier de revenir sur `staging` à jour : `git checkout staging && git pull --ff-only origin staging`.

---

## Rappel : règles critiques pour ce sprint

- **Migration SQL** : la DAM nécessite probablement de nouvelles tables (`media_assets`, `media_asset_links`). À chaque migration → régénérer les types Supabase dans la même PR (cf. `feedback_supabase_drift_fix_proactif.md` + `.claude/rules/branch-strategy.md` Q4).
- **Cloudflare Images** : custom domain `images.veronecollections.fr` déjà actif depuis 2026-04-21 (PR INFRA-IMG-001). Réutiliser le composant `<CloudflareImage>` existant dans `@verone/ui`.
- **Multi-marques** : table `brands` déjà en place (BO-BRAND-002 mergée). `brand_ids uuid[]` sur `products` aussi. Le DAM doit s'aligner via `media_asset_links` à `brand_ids`.
- **Source de vérité produits** : `docs/current/database/schema/` (lire AVANT de coder), `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md`, `docs/current/DEPENDANCES-PACKAGES.md`.
