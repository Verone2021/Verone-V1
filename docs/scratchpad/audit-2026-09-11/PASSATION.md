# Prompt de passation — back-office Vérone

À coller **en entier** au début d'une nouvelle discussion Cowork ou Claude Code.

---

```
# Contexte — back-office Vérone

Je m'appelle Roméo. Je ne suis pas développeur. Je dirige Vérone, un concept store
de décoration et mobilier d'intérieur : sourcing créatif, sélections curatées,
clients B2B (restaurants, hôtels, bars, retail).

## Ce sur quoi on travaille

UN SEUL sujet : le back-office Vérone, dépôt ~/verone-back-office-V1.
Pas Want It Now, pas d'autre société. Quand je parle de « Want It Now », c'est
uniquement le nom d'un canal de sortie que le back-office alimente — rien d'autre.

## Comment le système est monté — lis-le avant de juger quoi que ce soit

Monorepo Turborepo. Trois applications Next.js 15 qui partagent 26 packages et
UNE SEULE base Supabase (projet aorroydfjsrygmosnzrl) :

  apps/back-office     CRM/ERP central — moi et 2 salariés, tous les jours
  apps/site-internet   e-commerce public B2C
  apps/linkme          plateforme d'affiliation

LE BACK-OFFICE EST LA SOURCE DE VÉRITÉ. Rien n'est saisi ailleurs. Le catalogue,
les fournisseurs, les prix, le stock, les commandes, la comptabilité : tout est
créé et modifié dans le back-office. Les deux autres applications lisent la même
base. Il pilote 4 canaux de vente (LinkMe, site internet, Google Merchant, prix
clients) et un cinquième arrive.

Conséquence : un défaut du back-office n'est jamais isolé. Une donnée produit
incomplète se voit sur le site public. Une règle d'accès trop large expose les
données via l'application affiliée. Une lenteur de base ralentit les trois.

Le cookie de session est partagé entre les trois applications. Un contrôle d'accès
au back-office doit donc vérifier le jeton ET le rôle ET l'application.

Une extension Chrome de sourcing s'authentifie en Bearer sans cookie sur
/api/brands et /api/sourcing/*. Tout contrôle central doit la prévoir.

## Ce que je te demande, et comment

Je veux des audits FONDÉS SUR DU RÉEL, jamais sur des suppositions.

Tu as accès à : le dépôt complet, GitHub, le MCP Supabase (base Vérone), le MCP
Playwright (deux profils Chrome isolés, lane-1 et lane-2), et Chrome piloté
directement. SERS-T'EN. Si tu as besoin de voir une page, demande-moi de lancer
le serveur local et va la regarder. Si tu as besoin d'un identifiant, demande-le.

Règles de méthode, non négociables :
1. Lis l'architecture et la documentation AVANT de mesurer. Puis vérifie la
   documentation contre le code et contre la base : elle est partiellement
   périmée (elle annonce 119 tables contre 133 réelles, 686 migrations contre
   771, et affirme l'existence d'un middleware qui n'existe pas).
2. Mesure, ne déduis pas. EXPLAIN ANALYZE avec un vrai jeton, comptage des
   requêtes au navigateur, information_schema. Un chiffre sans la commande qui
   l'a produit n'entre pas dans un rapport.
3. Cite des référentiels, pas des opinions. Sécurité : OWASP API Security Top 10
   (2023). Base : le guide officiel Supabase « RLS Performance and Best
   Practices ».
4. Si tu ne sais pas, dis-le. Si une de tes conclusions précédentes est
   infirmée par une mesure, dis-le franchement et corrige.
5. Ne me demande jamais de valider un plan que tu n'as pas mesuré.

## Ce qui ne se touche JAMAIS

- L'application est en production depuis des mois, deux salariés l'utilisent tous
  les jours. Aucune interruption.
- AUCUNE écriture sur les données. Lecture seule en base par défaut. Toute
  migration exige mon accord écrit dans le chat, et se fait par execute_sql —
  `supabase db push` est interdit (418 fichiers à l'ancien format l'empêchent).
- AUCUNE donnée de test créée, nulle part.
- Aucun commit, push ou PR sans mon ordre explicite. PR vers staging uniquement,
  jamais main, et sans fusion automatique : le dépôt est privé sur offre GitHub
  Free, donc la protection de branche ne s'applique pas — les 4 checks requis se
  vérifient à la main.
- Aucun e-mail envoyé. Brouillon uniquement.

## Où j'en suis — état mesuré au 2026-09-11

Notes sur 100, grille « ce qu'un directeur technique exigerait d'une application
qui manipule de l'argent ». Cible 80 ; 100 n'existe pas sur cette grille. Ne pas
confondre avec un score Lighthouse, qui mesure le rendu d'une page et rien d'autre.

  Sécurité      19/100   90 routes API sur 152 sans aucun contrôle d'accès ;
                         332 fonctions SECURITY DEFINER exécutables par le rôle
                         public, dont reset_finance_auto_data qui fait un
                         DELETE FROM organisations
  Performance   22/100   107 ms ajoutés à CHAQUE page par le journal de
                         navigation ; 11 compteurs relancés à chaque navigation ;
                         page Inventaire à 222 requêtes
  Scalabilité   26/100   7 copies des types de base ; 13 cycles entre packages ;
                         6 tables cœur sans script de création
  Global        24/100   (22 le 30 juillet, 24 le 31 juillet)

Symptôme que je constate : le back-office est lent, mais par intermittence —
parfois ça marche, parfois non. Piste non confirmée : démarrage à froid des
fonctions serverless, et statistiques Postgres périmées (41 tables sur 185 ont
des statistiques de plus de 30 jours ; la table des rôles n'a pas été analysée
depuis le 13 février).

## Les documents à lire, dans cet ordre

  docs/scratchpad/audit-2026-09-11/PLAN-CORRECTION-2026-09-11.md   ← le plan à jour
  docs/scratchpad/audit-2026-09-11/PROMPTS-2026-09-11.md           ← les sessions
  .claude/work/ACTIVE.md, section « ÉTAT RÉEL AU 2026-09-11 »
  docs/audit-2026-07-30/FINDINGS.md    ← 122 défauts avec fichier:ligne
  CLAUDE.md et .claude/rules/*.md      ← les règles du dépôt

La table de lots plus bas dans ACTIVE.md est HISTORIQUE : elle dit encore que le
dépôt est public et que le lot 001 est urgent, alors que c'est fait. Se fier à la
section « ÉTAT RÉEL », pas à elle.

## Deux pièges qui ont déjà coûté cher

1. NE JAMAIS envelopper is_backoffice_user() en (select is_backoffice_user())
   dans les règles RLS. Appliqué le 7 mai 2026 sur 64 règles, a mis la production
   à terre le 8 mai à 3h du matin : auth.users à 3955 ms, service
   d'authentification en 504, connexion impossible. Rollback
   20260508060000_rollback_bo_rls_perf_002_003.sql. Le guide Supabase explique
   pourquoi : cette technique ne vaut que si le résultat ne dépend pas des données
   de la ligne.

2. Trois conclusions de l'audit de juillet ont été INFIRMÉES par la mesure en
   septembre : le rôle dans le jeton gagne ×2 et non ×36 ; retirer force-dynamic
   est sans effet sur 165 pages sur 169 ; il y a 67 boucles requête-par-élément
   et non 25. Ne pas les reprendre telles quelles.

## Ce que je veux faire ensuite

Améliorer la performance et la scalabilité du back-office, puis développer des
modifications sur le sourcing produits.

Commence par me confirmer en cinq lignes ce que tu as compris du système et de
mes contraintes. Puis dis-moi ce que tu comptes mesurer, et attends mon accord
avant de mesurer quoi que ce soit.
```

---

## Ce qui a été mis en mémoire du projet

Sept fichiers, lus automatiquement au début de chaque session sur ce dépôt.

| Fichier                                 | Contenu                                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `MEMORY.md`                             | l'index, avec l'ordre de lecture                                                                      |
| `architecture_systeme_verone.md`        | **nouveau** — les 3 apps, la base commune, le back-office comme source de vérité, les écarts doc/réel |
| `methode_audit_verone.md`               | **nouveau** — les référentiels OWASP et Supabase, mesurer plutôt que déduire, la grille de notation   |
| `projet_notes_et_etat_11_septembre.md`  | les notes par axe, aucune correction faite, la lenteur intermittente                                  |
| `projet_audit_back_office.md`           | les lots, le travail en suspens, les décisions de méthode                                             |
| `reference_mesures_base_verone.md`      | les colonnes et enums réels là où le code et la doc se trompent                                       |
| `reference_environnement_verone.md`     | ports, comptes GitHub, MCP, jetons, dépôt privé                                                       |
| `feedback_rls_verone.md`                | l'incident du 8 mai et pourquoi on ne retente pas                                                     |
| `feedback_mesurer_avant_de_conclure.md` | les trois conclusions infirmées par la mesure                                                         |
