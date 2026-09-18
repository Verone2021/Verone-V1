# Suite à traiter après BO-MSG-018 (messagerie centralisée)

> Document à conserver entre sessions. Liste tout ce qui n'a PAS été fait
> dans la PR #944 mais qui doit l'être plus tard. Ne pas l'oublier.

**Branche actuelle** : `feat/BO-MSG-018-messagerie-centralisee`
**PR ouverte** : #944 vers staging, **non mergée**.

---

## 1. Phase 8 — Point d'entrée unifié « Envoyer un mail au client » (REPORTÉE)

### Ce qui doit être fait

Dans la page commande détail (LinkMe + à terme Vérone direct), créer un bouton
ou dropdown unique « Envoyer un mail au client » qui :

- Liste les types de mails métier disponibles selon le contexte de la commande :
  - « Envoyer un devis » (si commande draft ou validated)
  - « Envoyer une facture brouillon (proforma) »
  - « Envoyer une facture finale »
  - « Demander des infos manquantes » (si infos manquantes détectées)
- Ouvre le bon modal existant selon le choix :
  - `SendDocumentEmailModal` pour devis/factures
  - `SendInfoRequestDialog` pour infos manquantes

### Pourquoi reportée

Le workflow actuel sépare **création** et **envoi** :

- `QuoteCreateFromOrderModal` / `InvoiceCreateFromOrderModal` créent le doc
  dans Qonto mais NE L'ENVOIENT PAS
- L'envoi se fait depuis la page facture détail via `SendDocumentEmailModal`

Pour que le dropdown ait du sens, il faut soit :

- (A) Modifier les Create modals pour ajouter une checkbox « Envoyer après création »
- (B) Faire 2 actions chaînées : créer puis envoyer (UX moins fluide)

C'est un sprint dédié, pas une intégration triviale dans BO-MSG-018.

### Comment reprendre

1. Lire les fichiers :
   - `packages/@verone/finance/src/components/SendDocumentEmailModal.tsx`
   - `packages/@verone/finance/src/components/QuoteCreateFromOrderModal/`
   - `packages/@verone/finance/src/components/InvoiceCreateFromOrderModal/`
   - `apps/back-office/.../canaux-vente/linkme/messages/components/SendInfoRequestDialog.tsx` (supprimé en BO-MSG-018, à recréer si besoin — voir note plus bas)
2. Décider option A ou B avec Romeo
3. Implémenter le composant `SendClientEmailMenu` dans `@verone/notifications`
4. L'intégrer dans la page commande LinkMe `/canaux-vente/linkme/commandes/[id]/details/page.tsx`

### Note importante

`SendInfoRequestDialog.tsx` a été **supprimé** dans BO-MSG-018 (faisait partie
du dossier `linkme/messages/components/` retiré). Le code est dans Git
historique (`git show HEAD~1:...`) si besoin de le récupérer. Le bandeau
`MissingInfoBanner` dans `linkme/commandes/[id]/details/` utilisait
`RequestInfoDialog` (autre dialog, encore en place dans `../components/ApprovalActionDialogs.tsx`),
donc la fonctionnalité « demander des infos manquantes » continue de marcher
sur la page commande détail.

---

## 2. Centre de traitement — onglets LinkMe absorbés (À VALIDER UX)

### Contexte

L'ancienne page `/canaux-vente/linkme/messages` avait 4 onglets :

- Infos manquantes
- En attente de retour
- Historique
- Notifications affiliés

BO-MSG-018 redirige cette URL vers `/parametres/messagerie?direction=sent&kind=info_request`.

### Ce qui pourrait manquer

- L'onglet « Infos manquantes » (commandes draft avec champs vides, sans
  demande envoyée) n'existe plus comme vue. Il devrait peut-être devenir une
  catégorie du **Centre de traitement** (`/messages`).
- L'onglet « Notifications affiliés » (broadcast) n'a plus d'écran. Décision
  à prendre : page séparée `/canaux-vente/linkme/notifications-affilies` ou
  intégration dans la cloche système.

### Comment reprendre

À tester avec Romeo en usage réel : si le manque se fait sentir, prévoir un
mini-sprint pour absorber proprement ces 2 onglets dans le **Centre de
traitement** ou créer un écran dédié. Pas urgent.

---

## 3. Cleanup mineur — types orphelins

### Ce qui peut être nettoyé

`packages/@verone/types/src/email-messages.ts` exporte encore `EmailMessage`
et `EmailMessageEnriched`. Ces types ne sont plus consommés par aucun
fichier (tout est passé sur `Communication` du hook `useCommunications`).

### Pourquoi pas fait dans BO-MSG-018

Risque marginal — si une future feature touche directement la table
`email_messages` (raw), le type est utile. Conservé en attendant.

### Comment reprendre

Quand tu refondras les imports `@verone/types`, supprimer ces 2 types et
le fichier. `git grep "EmailMessageEnriched"` doit revenir vide avant
suppression.

---

## 4. Régénération types Supabase — drift CI

### Statut actuel

`pnpm run generate:types` échoue sur `Unauthorized` (Supabase CLI pas
loggé). Le check `Supabase TS types drift (blocking)` va probablement
fail sur la PR #944.

### Comment résoudre

Workflow règle 4 de `.claude/rules/workflow.md` :

1. Attendre que le check fail
2. Télécharger l'artifact `supabase-types-drift` du job CI failed
3. Le copier dans `packages/@verone/types/src/supabase.ts`
4. Commit + push sur la même branche
5. La CI re-tourne, le check passe

L'agent peut faire ça automatiquement quand la CI a fail.

---

## 5. Documentation DB — régénération

### Statut

`docs/current/database/schema/` doit être régénéré pour refléter la nouvelle
vue `client_communications_unified`.

### Comment

```
python3 scripts/generate-docs.py --db
```

À lancer après merge sur staging. Pas bloquant pour la PR.

---

## 6. Tests Playwright (fonctionnels)

### Ce qui n'a PAS été testé manuellement

- Page `/parametres/messagerie` charge sans erreur SQL
- Filtres direction / brand / kind / status / search fonctionnent
- Drawer détail s'ouvre, affiche corps + pièces jointes
- Marquer mail comme non-lu fonctionne (bouton drawer)
- Compteur header se rafraîchit après lecture d'un mail
- Page commande LinkMe affiche la carte Communications
- Redirect `/canaux-vente/linkme/messages` → `/parametres/messagerie?...`
- Header sur mobile (responsive)

### Comment reprendre

Lancer Playwright sur le déploiement Vercel preview de la PR #944 et
vérifier les 8 points ci-dessus. Si tout passe, la PR peut être mergée.

---

## 7. Sidebar — promotion de l'entrée Messagerie ?

### Contexte

L'entrée « Messagerie » est actuellement dans le sous-menu **Paramètres**.
Pour un HUB centralisé important, elle pourrait être promue au niveau
racine de la sidebar (à côté de « Centre de traitement »).

### Pourquoi pas fait

Décision UX qui dépend de l'usage réel. Romeo verra à l'usage si l'icône
header suffit.

### Comment reprendre

Modifier `apps/back-office/src/components/layout/app-sidebar/sidebar-nav-items.ts`
pour déplacer l'entrée hors de Paramètres.

---

## 8. Migration `email_templates` colonnes dormantes (BO-MSG-014)

### Contexte

La PR #928 (avant BO-MSG-018) a ajouté à `email_templates` les colonnes
`brand`, `default_alias`, `body_text`, `tags`. Aucun workflow ne les
utilise actuellement (les templates des routes Resend sont hardcodés).

### Décision

Garder en l'état (append-only, pas dangereuses). À utiliser quand on fera
un vrai système de templates dynamiques (probablement avec Phase 8).

---

## Récap en 1 phrase

À faire après merge BO-MSG-018 (par ordre de priorité) :

1. Tests Playwright sur preview Vercel (#944) → décider du merge
2. Phase 8 (dropdown envoyer mail) — sprint dédié
3. Régénération doc DB
4. Cleanup types orphelins (mineur)
5. Décider absorption onglets LinkMe (1.b et 7)
