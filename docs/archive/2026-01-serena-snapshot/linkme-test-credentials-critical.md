# Identifiants de Test LinkMe & Back-Office

## 🚨 RÈGLE CRITIQUE - LIRE AVANT CHAQUE CONNEXION PLAYWRIGHT

**UNE SESSION LINKME/BACK-OFFICE DOIT ÊTRE AUTHENTIFIÉE VIA /login**

Ne JAMAIS naviguer directement vers `/dashboard` ou autre page protégée.
TOUJOURS passer par `/login` d'abord, même si une session semble active.

---

## ✅ Workflow de Connexion Back-Office (PORT 3000)

1. Aller sur `http://localhost:3000/login`
2. Cliquer sur le bouton "Accès test MVP"
3. Credentials affichés :
   - Email: `veronebyromeo@gmail.com`
   - Mot de passe: `Abc123456`
4. Cliquer sur "Se connecter"

## ✅ Workflow de Connexion LinkMe (PORT 3002)

1. Aller sur `http://localhost:3002/login`
2. Cliquer sur le **bouton jaune** "Comptes de test (DEV)"
3. Sélectionner un compte :
   - **Enseigne Admin (Pokawa)** : `admin@pokawa-test.fr` / `TestLinkMe2025`
   - **Org Indépendante** : `test-org@verone.fr` / `TestLinkMe2025`
4. Les credentials sont pré-remplis automatiquement
5. Cliquer sur "Se connecter"

**ATTENTION** : Ces emails correspondent aux utilisateurs en base de données.
Ne JAMAIS inventer d'autres emails.

## 🔒 Isolation des Sessions (2025-12-20)

Les deux apps utilisent maintenant des cookies distincts :

- **Back-office**: cookie par défaut `sb-{PROJECT_ID}-auth-token`
- **LinkMe**: cookie personnalisé `sb-linkme-auth`

Cela permet de se connecter aux deux apps simultanément avec des comptes différents.

---

Créé : 2025-12-19
Mis à jour : 2025-12-20
Raison : Documentation des credentials et isolation des sessions
