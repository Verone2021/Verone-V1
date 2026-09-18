# Plan de correction back-office Vérone — 2026-09-11

Remplace la partie performance du plan du 2026-07-30, invalidée par les mesures. Périmètre :
back-office Vérone uniquement.

---

## 1. La méthode d'audit appliquée

Quatre référentiels, pas une opinion.

**Sécurité — OWASP API Security Top 10 (édition 2023).** Les deux catégories qui te concernent
sont `API2 Broken Authentication` (une route qui répond sans vérifier qui appelle) et
`API5 Broken Function Level Authorization` (une fonction appelable par un rôle qui ne devrait
pas y accéder). Tes 90 routes sans contrôle relèvent d'API2 ; tes 332 fonctions exécutables par
le rôle public relèvent d'API5.

**Performance base — guide officiel Supabase sur les performances RLS.** Il classe les
techniques par gain réel, et l'ordre n'est pas celui qu'on croit :

1. **Indexer les colonnes utilisées dans les règles** — jusqu'à 100× sur les grandes tables.
   C'est la première recommandation, pas la dernière.
2. **Déclarer explicitement `TO authenticated`** sur chaque règle — élimine le rôle public
   sans aucun travail de base. La doc insiste : ne jamais compter sur `auth.uid()` seul pour
   écarter le rôle anonyme.
3. Envelopper les appels de fonction dans un `select` — **avec la mise en garde officielle** :
   ne fonctionne que si le résultat ne dépend pas des données de la ligne. C'est cette
   technique qui a mis ta production à terre le 8 mai. On ne la retente pas.
4. Restructurer les jointures pour comparer une colonne à une valeur fixe plutôt que l'inverse.

**Performance application** — mesure au navigateur : nombre de requêtes par page, temps
jusqu'au premier rendu, temps jusqu'au repos réseau.

**Scalabilité** — trois questions : le schéma est-il reconstructible depuis le dépôt ? les
modules sont-ils découplés ? à quel volume le premier plafond est-il atteint ?

---

## 2. L'état mesuré au 2026-09-11

| Axe         | Note         | Mesure qui la fixe                                                                                                 |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Sécurité    | **19 / 100** | 90 routes sur 152 sans contrôle ; 332 fonctions exécutables par le rôle public ; `reset_finance_auto_data` ouverte |
| Performance | **22 / 100** | 107 ms ajoutés à chaque page ; 11 compteurs par navigation ; Inventaire à 222 requêtes                             |
| Scalabilité | **26 / 100** | 7 copies des types ; 13 cycles ; 6 tables cœur sans script de création                                             |

Ce qui a été fait depuis juillet, et qui compte : dépôt passé en privé, PAT Supabase révoqué,
jetons à portée projet avec expiration, secret CI remplacé, liste clients retirée du suivi git,
gates CI rebranchées. C'est le Lot 001 soldé et le Lot 004 mergé.

Ce qui n'a pas été fait : aucune correction de performance, aucun des 12 bugs bloquants, et le
Lot 005 (le contrôle central d'accès) toujours dans un commit local jamais poussé.

---

## 3. Les corrections, par ordre de rentabilité mesurée

Chaque bloc = une session, une branche, une PR.

### Bloc A — Le journal de navigation · 2 h · gain : 107 ms sur chaque page

`user_activity_logs` reçoit une écriture à chaque page affichée, dans le chemin du rendu.
L'écriture prend 107 ms. La table pèse 106 Mo, soit 36 % de la base.

Avant toute correction : identifier qui lit cette table. Si personne, on arrête d'écrire. Si
c'est de la traçabilité, on sort l'écriture du chemin de rendu.

**Aucune suppression de ligne dans ce bloc.** Les 123 575 lignes existantes ne sont pas
touchées tant que Roméo n'a pas tranché.

### Bloc B — Les statistiques de la base · 30 min · gain à mesurer

41 tables sur 185 ont des statistiques de plus de 30 jours. `user_app_roles` n'a pas été
analysée depuis le 13 février, `organisations` depuis le 8 mai — le jour de l'incident.

Le rapport de mai montre que le retour arrière s'est accompagné d'un rafraîchissement des
statistiques et que le temps de préparation est passé de 2 484 ms à 17 ms. On ne sait pas
laquelle des deux actions a réparé.

Méthode : mesurer le temps de préparation, lancer `ANALYZE` sur **une seule** table, remesurer,
puis décider. `ANALYZE` ne touche aucune donnée métier.

### Bloc C — Le menu de gauche · 4 h · gain : ~16 h de travail base par an

11 compteurs lancés à chaque affichage, relancés à chaque changement de commande, produit ou
transaction. Remplacer par un seul appel qui renvoie les 11 nombres, et ne le relancer que
lorsque c'est utile.

### Bloc D — Le compteur d'alertes stock · 2 h · gain : 141 ms → 2 ms

La même requête met 141 ms dans la fonction et 2 ms en direct. La fonction se re-prépare
entièrement à chaque appel. À traiter après le bloc B : si les statistiques périmées en sont la
cause, ce bloc disparaît tout seul.

### Bloc E — Les règles d'accès, méthode officielle · 1 j · gain : à mesurer

Deux techniques du guide Supabase, aucune des deux n'est celle qui a cassé la prod :

1. **Ajouter `TO authenticated`** aux règles qui ne l'ont pas. Le rôle public est alors écarté
   sans que la base évalue quoi que ce soit. Cible : les 51 tables où une règle LinkMe ou site
   cohabite avec celle du back-office — ce sont les seules où la fonction de rôle est
   réévaluée ligne par ligne.
2. **Indexer les colonnes utilisées dans les règles** qui ne sont pas déjà clé primaire.

Ces deux techniques sont réversibles règle par règle. Elles se testent une règle à la fois.

### Bloc F — La page Inventaire · 3 h · gain : 222 requêtes → 2

Une requête pour la liste, puis une par produit. Requête ensembliste avec `in()`.

### Bloc G — Le contrôle central d'accès · 1 h de reprise + 2 j · gain : 90 routes fermées

Le code existe déjà, commit `cc10edae`, jamais poussé. À corriger avant : `middleware.ts:87`
utilise `console.log`, interdit par la règle du dépôt. Il corrige aussi le plantage quand on
ouvre une page sans être connecté.

Activation en trois temps, jamais d'un coup : gardes sur les routes sensibles, puis mode
observation deux à trois jours pour construire la liste des appelants légitimes à partir de
mesures, puis activation.

### Bloc H — Les fonctions exposées au rôle public · 2 h · gain : la faille la plus grave

332 fonctions exécutables sans authentification, dont `reset_finance_auto_data` qui fait un
`DELETE FROM organisations`. Le contrôle CI le signale déjà : la baseline acceptait 315, on est
à 332, dernier passage vert le 24 août.

Méthode : distinguer les fonctions de trigger — qui n'ont aucune raison d'être appelables — des
RPC réellement appelées par les applications, en vérifiant chaque RPC contre les appels réels
dans le code. Puis un `REVOKE` groupé. Et un garde-fou en fin de chaque migration future,
sinon le compteur remonte tout seul.

### Ce que j'écarte, et pourquoi

- **Le rôle dans le jeton de session** : gain ×2 seulement, et un droit retiré resterait actif
  jusqu'à l'expiration du jeton. Le rapport bénéfice/risque est mauvais.
- **Retirer `force-dynamic` du layout racine** : sans effet sur 165 pages sur 169.
- **Les 27 index sur clés étrangères** : sans objet à 236 produits.
- **Envelopper les fonctions de rôle dans un `select`** : a mis la production à terre le 8 mai.

---

## 4. Trajectoire

| Après           | Sécu | Perf | Scal | Global |
| --------------- | ---- | ---- | ---- | ------ |
| Aujourd'hui     | 19   | 22   | 26   | **24** |
| Blocs A + B     | 19   | 45   | 26   | **30** |
| Blocs C + D + F | 19   | 62   | 28   | **35** |
| Bloc H          | 42   | 62   | 28   | **42** |
| Bloc G          | 62   | 64   | 32   | **50** |
| Bloc E          | 62   | 72   | 34   | **53** |

80 reste la cible. 100 n'existe pas sur cette grille.

---

## Sources

- [OWASP API Security Top 10 — API2:2023 Broken Authentication](https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/)
- [OWASP API Security Top 10 — API5:2023 Broken Function Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/)
- [Supabase — RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Performance and Security Advisors](https://supabase.com/docs/guides/database/database-advisors)
