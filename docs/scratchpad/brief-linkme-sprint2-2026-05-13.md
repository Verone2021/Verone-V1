# Brief LinkMe — Sprint 2 : Corrections pages publiques + Nouvelle page enseignes

**Date :** 2026-05-13 — Mis à jour après audit site live
**App :** `apps/linkme`  
**Urgence :** BUG CRITIQUE à corriger en premier

---

## BUG CRITIQUE — À traiter AVANT tout le reste

Les pages suivantes redirigent vers `/login` au lieu d'être publiques :

- `/pour-les-createurs`
- `/pour-les-pros`
- `/comment-ca-marche`

Ces pages existent dans le routeur Next.js mais leur layout ou leur middleware les protège comme des pages authentifiées. **Elles doivent être publiques, accessibles sans connexion.**

**Action :** Identifier pourquoi ces routes sont protégées (middleware, layout avec auth guard, ou fichier de config auth) et les exclure de la protection. Vérifier que `/about` reste accessible (elle l'est actuellement — ne pas casser).

---

## Positionnement V2 — règles absolues

1. **Aucun nom de marque spécifique** sur les pages publiques (Boemia, Solar, FLOS, Vérone). Écrire : "déco, éclairage, végétal, électronique" ou "catalogue multi-marques".
2. **Triple cible** par ordre de priorité : Enseignes & réseaux → Professionnels prescripteurs → Créateurs de contenu.
3. **Message-clé transversal** : "Ton réseau génère des ventes. LinkMe te les paie."
4. **SSG obligatoire** : toutes les pages publiques doivent être statiques (○ dans le build). Vérifier après chaque nouvelle page créée.

---

## Pages à créer ou corriger dans ce sprint

### 1. Corriger /pour-les-createurs (bug auth → rendre publique)

Contenu :

```
title: "LinkMe pour les créateurs — Ambassadeur de marque avec une vraie marge"
H1: "Recommande les bonnes marques. Encaisse vraiment."
Badge: "Accès sur demande"

Section 1 — DOULEUR
"Tu envoies des liens Amazon à 2% de commission. Ton audience mérite mieux. Toi aussi."

Section 2 — DIFFÉRENCIATION (tableau)
LinkMe vs Amazon Affiliation :
- Commission : Marge que tu configures / 1-3% fixe
- Catalogue : Marques sélectionnées / 350M produits génériques
- Image : Ta sélection, ton univers / Page Amazon
- Accès : Sur demande (réseau qualitatif) / Ouvert à tous

Section 3 — COMMENT ÇA MARCHE (3 étapes)
Étape 1 : Choisis tes produits dans le catalogue multi-marques (déco, éclairage, végétal, électronique)
Étape 2 : Configure ta marge produit par produit avec le système feux tricolores
Étape 3 : Partage ta sélection à ton audience. Touche ta commission sur chaque vente.

Section 4 — POUR QUI
"LinkMe est fait pour toi si tu crées du contenu autour de la maison, la déco, le lifestyle — et que ton audience te fait confiance pour ses choix produits."

Section 5 — FAQ (5 questions)
Q1 : C'est quoi la différence avec un programme d'affiliation classique ?
Q2 : Combien puis-je gagner comme ambassadeur LinkMe ?
Q3 : Est-ce qu'il faut un minimum d'abonnés ?
Q4 : Qui gère les commandes et les livraisons ?
Q5 : Comment je reçois mes commissions ?

Section 6 — CTA final
H2 : "Ta prochaine recommandation mérite d'être rémunérée."
CTA : "Demander l'accès →"

SEO : keyword cible "ambassadeur de marque" (720 vol, KD 19)
Meta description (< 155 car.) : "LinkMe te donne accès à un catalogue de marques sélectionnées. Tu fixes ta marge, tu partages ta sélection. Commission réelle sur chaque vente."
```

---

### 2. Corriger /pour-les-pros (bug auth → rendre publique)

Contenu :

```
title: "LinkMe pour les professionnels — Commission sur vos prescriptions"
H1: "Vos prescriptions ont toujours eu de la valeur. Maintenant elles ont un prix."

Section 1 — DOULEUR
"Architectes, décorateurs, consultants HCR — tu passes des heures à sourcer les bons produits pour tes clients. Ils achètent ailleurs. Tu n'en vois pas la couleur."

Section 2 — CAS D'USAGE
"Un architecte d'intérieur travaille sur 5 projets simultanément. Pour chaque projet, il crée une sélection LinkMe des produits qu'il recommande. Son client reçoit le lien dans le livrable. Il commande. L'architecte touche sa commission. Sans gérer stock ni livraison."

Section 3 — COMMENT ÇA MARCHE (3 étapes identiques, adaptées au contexte pro)

Section 4 — POUR QUI
Architectes d'intérieur · Décorateurs · Stylistes · Consultants hôtels-cafés-restaurants · Agents immobiliers · Tout professionnel qui prescrit des produits à ses clients

Section 5 — FAQ (5 questions)
Q1 : Est-ce que mes clients voient que j'utilise LinkMe ?
Q2 : Puis-je créer une sélection différente par projet ou client ?
Q3 : Qu'est-ce qui se passe si mon client retourne un produit ?
Q4 : Y a-t-il un engagement minimum ou un abonnement ?
Q5 : Comment est-ce que je justifie la commission auprès de mes clients ?

Section 6 — CTA
H2 : "Tes conseils génèrent déjà des ventes. Commence à en voir la couleur."
CTA : "Demander l'accès →"

SEO : keyword cible "commission sur recommandation" (350 vol, KD 18)
```

---

### 3. Corriger /comment-ca-marche (bug auth → rendre publique)

Contenu :

```
title: "Comment fonctionne LinkMe — Affiliation sans stock en 3 étapes"
H1: "Simple. En trois étapes."
Sous-titre: "De la création de ta première sélection à ta première commission."

Section 1 — ÉTAPE 1
Icône : grille
Titre : "Parcours le catalogue multi-marques"
Corps : "Explore les produits de toutes les marques sélectionnées sur LinkMe — déco, éclairage, végétal, électronique et plus. Sélectionne ceux qui correspondent à ton univers ou aux besoins de tes clients. Chaque produit a une fiche complète : visuels, description, prix de base fournisseur, marge maximale autorisée."

Section 2 — ÉTAPE 2
Icône : sliders
Titre : "Configure ta marge produit par produit"
Corps : "Pour chaque produit de ta sélection, fixe ton prix de vente dans la fourchette autorisée. Le système feux tricolores te guide : vert pour vendre vite, orange pour l'équilibre, rouge pour maximiser ta marge unitaire. Tu décides. Pas de règle imposée."

Section 3 — ÉTAPE 3
Icône : partage
Titre : "Partage ta sélection et encaisse"
Corps : "Ta sélection a son propre lien partageable. Diffuse-la à ton audience, tes clients, ton réseau. Chaque vente générée via ton lien te rapporte ta marge — tracée en temps réel dans ton dashboard."

Section 4 — ENCART RÉSEAUX (important)
Titre : "Vous êtes une enseigne ou un réseau ?"
Corps : "Le fonctionnement est le même, à l'échelle. La tête de réseau configure le catalogue et les taux de commission. Chaque point de vente reçoit son propre compte. Déploiement en moins d'une semaine."
CTA : "Voir la démo réseau →" → lien /pour-les-enseignes

Section 5 — FAQ (5 questions)
Q1 : Qui gère les commandes et les livraisons ?
Q2 : Combien de temps pour créer ma première sélection ?
Q3 : Est-ce que je peux avoir plusieurs sélections ?
Q4 : Comment je reçois mes paiements ?
Q5 : Qu'est-ce qui se passe si un produit est en rupture de stock ?

Section 6 — CTA double
CTA1 : "Demander l'accès →"
CTA2 : "Voir une démo réseau →"

SEO : keyword cible "affiliation sans stock comment ça marche" (200 vol, KD 15)
```

---

### 4. Créer /pour-les-enseignes (nouvelle page)

```
title: "LinkMe pour les enseignes — Déployez un catalogue produit à votre réseau"
H1: "Votre réseau de points de vente, transformé en réseau de revente."
Ton : vouvoiement
Badge : "Démo disponible"

Section 1 — SOCIAL PROOF
"Pokawa et Black & White utilisent déjà LinkMe pour déployer un catalogue produit à leurs réseaux."
Afficher les logos des deux enseignes.

Section 2 — LE PROBLÈME
Titre : "Votre réseau a une clientèle captive. Pas de catalogue à lui proposer."
Corps : "Vos franchisés ou affiliés voient des clients tous les jours. Ces clients font confiance à votre enseigne. Mais votre catalogue est limité à ce que vous avez en stock. Chaque vente complémentaire qui pourrait exister ne se fait pas."

Section 3 — LA SOLUTION (4 étapes réseau)
Étape 1 : La tête de réseau configure le catalogue LinkMe et les taux de commission
Étape 2 : Chaque point de vente reçoit son compte et sa page de sélection
Étape 3 : Les clients commandent via les pages de sélection
Étape 4 : La tête de réseau pilote tout depuis le tableau de bord central (commissions agrégées, performances par point de vente)

Section 4 — TABLEAU DE BORD CENTRAL
"Une vue complète sur l'activité de votre réseau : ventes agrégées, commissions par point de vente, produits les plus vendus, performances comparées."
(Ajouter une illustration ou une capture fictive du dashboard)

Section 5 — ARGUMENT DÉLAI
Titre : "Opérationnel en moins d'une semaine."
Corps : "Vous configurez le catalogue. Nous activons les comptes. Vos points de vente reçoivent leurs accès. En moins de 7 jours, votre réseau peut commencer à vendre."

Section 6 — FAQ (5 questions)
Q1 : Combien de points de vente puis-je gérer depuis un seul compte ?
Q2 : Est-ce que chaque point de vente peut personnaliser sa sélection ?
Q3 : Comment les commissions sont-elles réparties entre le point de vente et la tête de réseau ?
Q4 : Y a-t-il un engagement ou un abonnement minimum ?
Q5 : Comment se déroule la démonstration ?

Section 7 — CTA
H2 : "Votre réseau peut commencer à vendre cette semaine."
CTA principal : "Demander une démo →"
Sous-CTA : "On vous rappelle sous 24h."

SEO : keyword cible "programme revendeur réseau" (150 vol, KD 15)
Meta : "LinkMe déploie un catalogue multi-marques à tout votre réseau de franchisés en moins d'une semaine. Dashboard central, commissions tracées, zéro stock."
```

---

### 5. Mettre à jour /about

Ajouter la mention explicite des enseignes dans le positionnement. Ajouter "Enseignes têtes de réseau" dans la liste des profils d'ambassadeurs.

---

### 6. Mettre à jour la navigation (header)

Ajouter le lien "Pour les enseignes" dans la nav publique, en première position dans le dropdown ou directement visible.

---

## Règles pour Claude Code dans ce sprint

1. **Commencer par le bug auth** — tout le reste est bloqué par ce bug.
2. **Vérifier le build SSG** après chaque nouvelle page : `pnpm --filter @verone/linkme build`. Toutes les pages publiques doivent être `○ (Static)`.
3. **Ne pas modifier les routes authentifiées** (dashboard, ma-selection, commandes, etc.) — hors périmètre.
4. **Pas de noms de marques** sur les nouvelles pages.
5. **Format commit** : `[LM-PUB-002] feat: fix public pages auth redirect + create /pour-les-enseignes`

---

## Vérification finale (checklist avant PR)

- [ ] /pour-les-createurs accessible sans connexion
- [ ] /pour-les-pros accessible sans connexion
- [ ] /comment-ca-marche accessible sans connexion
- [ ] /pour-les-enseignes créée et accessible sans connexion
- [ ] Toutes les nouvelles pages en SSG (○ dans le build)
- [ ] Aucun nom de marque spécifique sur les pages publiques
- [ ] Navigation mise à jour avec lien "Pour les enseignes"
- [ ] Métadonnées (title, description, og) sur chaque nouvelle page
