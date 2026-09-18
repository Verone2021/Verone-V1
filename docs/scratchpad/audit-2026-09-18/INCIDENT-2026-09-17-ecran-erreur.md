# Incident — « Erreur système Vérone », collaboratrice bloquée (17-18/09)

**Rapporté** : 17/09 au soir, puis toujours actif le 18/09 vers 17 h 40 (Paris).
**Utilisatrice** : elisabetecostacunha@gmail.com — Chrome sur Windows.
**Écrit par** : Cowork, 18/09, à partir des journaux Supabase et du dépôt. Aucune écriture, aucune action sur la prod.

## 1. Ce qui est prouvé

| Fait                                                                  | Preuve                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Son compte est sain                                                   | `user_app_roles` : `back-office:admin:true` ; `user_profiles` présent ; dernière connexion 18/09 15:59:57 UTC                                                                                    |
| Ses requêtes aboutissent                                              | Journaux passerelle : 118 appels à 15 h 30, 35 à 15 h 45, 21 à 16 h 00 UTC — **0 erreur**, tout en 200                                                                                           |
| Le tableau de bord reçoit ses données                                 | Commandes, produits, alertes stock, consultations, `get_sidebar_counts` : tous 200                                                                                                               |
| Le plantage est donc **côté navigateur**, après réception des données | déduction directe des deux lignes précédentes                                                                                                                                                    |
| L'écran vu est `global-error.tsx`                                     | Texte identique à `apps/back-office/src/app/global-error.tsx:34-42`, traduit en portugais par Chrome                                                                                             |
| Chrome traduit la page chez elle                                      | La capture montre « Erro no sistema Verona », alors que le code est en français                                                                                                                  |
| Le service d'authentification est tombé deux fois                     | `auth_logs` : **31 erreurs 500** le 17/09 16 h-17 h UTC, **20** le 18/09 12 h, **75** le 18/09 13 h — messages « failed to connect to host=localhost user=supabase_auth_admin », « i/o timeout » |
| Les deux adresses Vercel sont le même projet                          | `.vercel/project.json` = `verone-back-office` ; `vercel.json:5` déclare l'alias `verone-backoffice.vercel.app`                                                                                   |

## 2. Les trois défauts empilés

1. **Cause de fond : la base sature.** Quand elle sature, le service d'authentification Supabase ne la joint plus
   et répond 500. Mesure du 18/09 : **93,5 % du temps de travail de la base ne sert pas l'application**
   (temps réel 61,5 %, introspection CI 21,8 %, compteur d'alertes 6,8 %). → lot 2.
2. **Défaut d'architecture des filets.** `AuthWrapper` et les fournisseurs sont rendus **dans** `app/layout.tsx`.
   Dans l'App Router, une erreur qui s'y produit n'est pas attrapée par `app/error.tsx` (ajouté le 18/09 par
   `[BO-AUTH-SESSION-002]`) : elle tombe dans `global-error.tsx`, qui démonte l'application. « Réessayer »
   rejoue le même rendu, donc le même plantage. → lot 1.
3. **Traduction automatique de Chrome.** Elle remplace des nœuds de texte dans le DOM ; React perd ses repères
   et lève une erreur non rattrapée. Cause connue, cohérente avec « ça touche elle et pas Roméo ». → lot 1.

Hypothèse secondaire non écartée : fichiers de la version précédente demandés par un onglet resté ouvert après
la mise en ligne de 13 h 45 UTC (`ChunkLoadError`), même symptôme, même boucle. → traitée aussi au lot 1.

## 3. Ce qui a déjà été corrigé le 18/09 (PR #1173, en production depuis 13 h 45 UTC)

- Plus de `throw` dans `(protected)/layout.tsx` : redirection vers `/login?erreur=...` ou `/unauthorized`.
- `app/error.tsx` créé — mais **au-dessous** des fournisseurs, donc inefficace pour le cas décrit au § 2.2.
- Réveil de session au retour sur l'onglet (`auth-wrapper.tsx`).

## 4. Ce qui manque et qui a coûté deux heures

Aucune trace de l'erreur nulle part : ni Sentry, ni rejeu de session, ni capture d'erreur navigateur.
`/api/logs` écrit dans le système de fichiers de Vercel, qui est éphémère : inutilisable.
**C'est l'objet du lot 1.**
