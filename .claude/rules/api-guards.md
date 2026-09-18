# Gardes des routes API — quelle porte, quelle serrure

**Source de vérité unique** pour la protection des routes API des trois applications.
À lire avant d'écrire une route, avant d'en supprimer une, avant tout audit de sécurité.

**Inventaire nominatif et état réel** : `docs/current/security/api-routes-guards.md`.
**Décision fondatrice** : `.claude/DECISIONS.md` ADR-046.

---

## Le fait qui fonde cette règle

Le 2026-09-18, un appel depuis Internet, **sans aucune connexion**, a renvoyé :

| Adresse                                     | Réponse                          | Contenu                                                            |
| ------------------------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| `/api/qonto/invoices`                       | **200**                          | 41 factures : nom du client, e-mail de contact, montants, lien PDF |
| `/api/qonto/quotes`                         | **200**                          | 27 Ko de devis                                                     |
| `/api/sales-orders/<uuid>/customer-address` | **404 « Commande introuvable »** | la requête est partie en base **avant** tout contrôle              |

**Cause** : le back-office n'a **pas** de `middleware.ts`. Sa protection vient uniquement de
`apps/back-office/src/app/(protected)/layout.tsx`, qui couvre les **pages** et jamais
`src/app/api/**`. Les pages sont fermées à clé, les routes API ne le sont pas.

LinkMe, lui, a un `middleware.ts` qui refuse par défaut avec une liste blanche explicite.
**C'est le modèle.**

---

## REGLES IMPERATIVES

- Toute route qui sert un écran du back-office porte `requireBackofficeAdmin`. **Sans exception.**
- La clé `service_role` ne s'utilise que si la RLS empêche une lecture légitime, et **toujours
  derrière une garde**. Le réflexe par défaut est `createServerClient`.
- Une garde de tâche planifiée ou de webhook ne doit **jamais** pouvoir être sautée parce qu'une
  variable d'environnement manque. **Variable absente = la route refuse.**
- Un jeton ne voyage **jamais** dans l'adresse (`?token=`) : il finit dans les journaux, dans
  l'historique du navigateur et dans l'en-tête `Referer`. Il voyage en en-tête.
- Une route sans aucun appelant dans le code **se supprime**. On ne garde pas une porte dont
  personne ne se sert : on la mure.
- Appeler `getUser()` **sans tester son résultat** ne protège rien. Vu en vrai sur
  `qonto/quotes/[id]/convert`, qui écrit.

---

## Quelle serrure pour quelle porte

| La route est appelée par…      | Serrure                                                                  |
| ------------------------------ | ------------------------------------------------------------------------ |
| un écran du back-office        | `requireBackofficeAdmin(request)`                                        |
| une tâche planifiée Vercel     | secret `CRON_SECRET` en en-tête `Authorization: Bearer`, **obligatoire** |
| un service extérieur (webhook) | signature vérifiée, **sans dégradation possible**                        |
| le public, volontairement      | liste blanche explicite **et justifiée en commentaire**                  |

### Le motif, tel quel

```ts
const guardResult = await requireBackofficeAdmin(request);
if (guardResult instanceof NextResponse) {
  return guardResult;
}
```

Renvoie **401** sans session, **403** si le rôle n'est ni `owner` ni `admin`.
Source : `apps/back-office/src/lib/guards/require-backoffice-admin.ts`.

Quand la route déclare un type de réponse étroit, renvoyer le même code **dans sa forme à elle**,
plutôt que d'élargir son contrat de sortie :

```ts
if (guardResult instanceof NextResponse) {
  return NextResponse.json(
    { success: false, error: 'Acces refuse' },
    { status: guardResult.status }
  );
}
```

---

## Réparer avant de durcir

Précédent : ADR-036 (2026-07-30), « réparer les gardes avant de les durcir ». On ne pose pas un
verrou général sur une porte dont on ne sait pas encore qui l'emprunte.

**Avant de poser une garde sur une route existante**, dans cet ordre :

1. `grep` de tous ses appelants dans `apps/` et `packages/` ;
2. lecture de chaque appelant : est-ce bien un appel depuis un écran protégé (donc porteur de la
   session), et non un appel serveur, une tâche planifiée ou l'extension Chrome du sourcing ?
3. pose de la garde, **sans toucher une ligne de logique métier** ;
4. essai sans session → 401 attendu ;
5. essai à l'écran, connecté, sur les pages concernées → comportement identique à avant.

Si une seule de ces étapes est sautée, on ne pousse pas.

---

## Ce qu'on ne fait pas

- Poser une garde sur une route Qonto ou Packlink **en modifiant sa logique**. Ces intégrations
  sont fragiles ; la facturation doit continuer de fonctionner. On ajoute un contrôle en tête, rien d'autre.
- Verrouiller une route en masse « parce qu'elle a l'air interne », sans avoir lu ses appelants.
- Se fier à une détection automatique par motif pour affirmer « cette route est protégée ». Cette
  question se tranche en lisant le code, ou par un appel réel sans session. Mesuré le 18/09 : la
  détection automatique s'est trompée **dans les deux sens**.

---

## Référence

Référencé par :

- `CLAUDE.md` racine (table SOURCES DE VERITE)
- `.claude/INDEX.md`
- `docs/current/security/api-routes-guards.md` (l'inventaire vivant)

Complémentaire de :

- `.claude/rules/database.md` (R-GRANT — droits d'exécution des fonctions)
- `.claude/rules/non-regression.md` (la démarche en cinq temps ci-dessus en est l'application)
