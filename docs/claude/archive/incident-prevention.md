# Incident Prevention Checklist

Guide de prevention des incidents bases sur l'historique du projet.

---

## Avant de Modifier Fichier Auth

- [ ] Lire memory `auth-paths-immutable`
- [ ] Lire 100% du fichier existant
- [ ] Verifier PUBLIC_ROUTES actuel
- [ ] Documenter patterns actuels AVANT modification
- [ ] AskUserQuestion pour approbation
- [ ] Tester login/logout apres modification
- [ ] Verifier toutes les apps (back-office, linkme, site-internet)

---

## Avant de Supprimer Code

- [ ] Comprendre POURQUOI ce code existe
- [ ] Verifier si code appele ailleurs (Grep)
- [ ] Ne JAMAIS supprimer "pour simplifier"
- [ ] Ne JAMAIS supprimer hooks de protection
- [ ] Demander approbation si fichier critique
- [ ] Garder trace dans commit message

---

## Avant Modification Middleware

- [ ] Lire memory `middleware-auth-protection-2026-01-07`
- [ ] Lire memory `linkme-middleware-whitelist-2026-01-08`
- [ ] Lire 100% du middleware existant
- [ ] Documenter toutes les routes protegees
- [ ] Documenter toutes les routes publiques
- [ ] AskUserQuestion OBLIGATOIRE
- [ ] Tester TOUTES les routes apres modification

---

## Apres Migration DB

- [ ] Appliquer via psql immediatement
- [ ] Verifier avec SELECT count
- [ ] Regenerer types TypeScript si schema modifie
- [ ] Tester feature concernee
- [ ] Commit avec message explicite
- [ ] Verifier RLS policies si table sensible

---

## Apres Modification Code Critique

- [ ] `pnpm type-check` sans erreur
- [ ] `pnpm build` sans erreur
- [ ] Test manuel de la feature
- [ ] Commit avec Task ID format [APP-DOMAIN-NNN]

---

## Historique des Incidents (Reference)

| Date   | Commit   | Erreur                            | Prevention                                |
| ------ | -------- | --------------------------------- | ----------------------------------------- |
| 21 Jan | e17346bf | Hooks supprimes "remove friction" | Checklist "Avant de Supprimer Code"       |
| 24 Jan | f14e009a | Middleware recree sans audit      | Checklist "Avant Modification Middleware" |

---

## Pattern Anti-Incidents

### NE JAMAIS

- Modifier fichier auth sans lire existant 100%
- Supprimer code "pour simplifier" sans comprendre
- Creer nouveau middleware sans lire ancien
- Ignorer les hooks de protection
- Assumer sans verifier

### TOUJOURS

- Lire avant ecrire
- Documenter avant modifier
- Demander si critique
- Tester apres changer
- Commiter avec contexte

---

**Derniere mise a jour**: 2026-01-26
