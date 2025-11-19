# 🌐 Guide Complet - Vérification Domaine Google Merchant Center

**Domaine** : veronecollections.fr
**Account ID** : 5495521926
**Date création** : 2025-10-09

---

## 🎯 Objectif

Valider la propriété du domaine **veronecollections.fr** pour Google Merchant Center avant de pouvoir synchroniser les produits.

**⚠️ PRÉ-REQUIS OBLIGATOIRE** : Sans vérification domaine → Impossible de synchroniser produits (même avec API configurée)

---

## 📋 Vue d'Ensemble

### Processus Complet

1. ✅ **Vérification domaine** (cette étape) - BLOQUANTE
2. ✅ **Claim homepage** - BLOQUANTE
3. ✅ Configuration Service Account
4. ✅ Synchronisation produits

### Timing

- **HTML Meta Tag** : Validation immédiate après déploiement (recommandé)
- **DNS TXT Record** : Propagation DNS 5-30 min
- **Google Analytics/Tag Manager** : Si déjà configuré

---

## 🔑 Meta Tag Google Obtenu

**Meta tag généré pour veronecollections.fr** :

```html
<meta
  name="google-site-verification"
  content="yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ"
/>
```

**⚠️ RÈGLE ABSOLUE** : Ne JAMAIS supprimer ce meta tag après validation (Google re-vérifie périodiquement)

---

## 🚀 Méthode 1 : HTML Meta Tag (RECOMMANDÉ pour Next.js)

### Avantages

- ✅ Validation instantanée après déploiement
- ✅ Pas de propagation DNS
- ✅ Facile à implémenter dans Next.js
- ✅ Méthode recommandée par Google

### Implémentation Next.js 15

#### Étape 1 : Meta Tag déjà ajouté dans `apps/back-office/apps/back-office/src/app/layout.tsx`

```typescript
export const metadata = {
  title: 'Vérone Back Office',
  description:
    "CRM/ERP modulaire pour Vérone - Décoration et mobilier d'intérieur",
  verification: {
    google: 'yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ',
  },
};
```

**Résultat HTML généré** :

```html
<head>
  <meta
    name="google-site-verification"
    content="yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ"
  />
  <!-- Autres meta tags Next.js -->
</head>
```

#### Étape 2 : Déploiement sur veronecollections.fr

```bash
# Build production
npm run build

# Déploiement Vercel (auto via Git push)
git add .
git commit -m "feat: Ajout Google Site Verification meta tag"
git push origin main

# OU déploiement manuel
vercel --prod
```

#### Étape 3 : Validation Google (Après déploiement)

```typescript
// 1. Ouvrir browser MCP Playwright
mcp__playwright__browser_navigate(
  'https://merchants.google.com/mc/setup/websiteverification?a=5495521926'
);

// 2. Sélectionner "Ajouter une balise HTML" (déjà fait)

// 3. Cliquer "Valider"
mcp__playwright__browser_click({ element: 'Valider' });

// 4. Attendre confirmation
mcp__playwright__browser_wait_for({ text: 'Validated' });

// 5. Screenshot preuve
mcp__playwright__browser_take_screenshot({
  filename: 'veronecollections-verified.png',
});
```

#### Étape 4 : Vérification Meta Tag Présent

```bash
# Vérifier meta tag sur site déployé
curl -s https://veronecollections.fr | grep "google-site-verification"

# Résultat attendu :
# <meta name="google-site-verification" content="yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ"/>
```

---

## 🌐 Méthode 2 : DNS TXT Record (Alternative)

### Quand l'utiliser

- Site pas encore déployé mais domaine configuré
- Préférence pour validation DNS
- Redondance avec meta tag HTML

### Implémentation DNS

#### Étape 1 : Obtenir TXT Record Google

**Record fourni par Google** :

```
Type: TXT
Name: @ (ou veronecollections.fr)
Value: google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ
```

#### Étape 2 : Ajouter chez Registrar Domaine

**OVH** :

```
1. https://www.ovh.com/manager/web/
2. Domaines → veronecollections.fr → Zone DNS
3. Ajouter une entrée
   - Type : TXT
   - Sous-domaine : (vide ou @)
   - Cible : google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ
4. Enregistrer
```

**Gandi** :

```
1. https://admin.gandi.net/
2. Domaines → veronecollections.fr → DNS Records
3. Add Record
   - Type : TXT
   - Name : @
   - Value : google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ
   - TTL : 300
4. Save
```

**Cloudflare** :

```
1. https://dash.cloudflare.com/
2. Domaines → veronecollections.fr → DNS
3. Add record
   - Type : TXT
   - Name : @
   - Content : google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ
   - TTL : Auto
4. Save
```

#### Étape 3 : Attendre Propagation DNS

```bash
# Vérifier propagation DNS (5-30 min)
dig TXT veronecollections.fr +short

# Résultat attendu :
# "google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ"

# OU avec nslookup
nslookup -type=TXT veronecollections.fr
```

#### Étape 4 : Validation Google

```
1. Retour Merchant Center (même lien que méthode HTML)
2. Sélectionner "Utiliser un enregistrement TXT DNS"
3. Google vérifie automatiquement toutes les 10 min
4. Confirmation par email + dans Merchant Center
```

---

## 📊 Méthode 3 : Google Analytics (Si déjà configuré)

### Pré-requis

- Google Analytics 4 déjà installé sur veronecollections.fr
- Tag Google Analytics dans `<head>`
- Même compte Google pour Analytics et Merchant Center

### Validation Automatique

```
1. Merchant Center → Vérification domaine
2. Sélectionner "Utiliser Google Analytics"
3. Validation instantanée (si GA4 détecté)
4. Aucune action supplémentaire requise
```

---

## 📈 Méthode 4 : Google Tag Manager (Si déjà configuré)

### Pré-requis

- Google Tag Manager installé sur veronecollections.fr
- Container GTM dans `<head>`
- Même compte Google pour GTM et Merchant Center

### Validation Automatique

```
1. Merchant Center → Vérification domaine
2. Sélectionner "Utiliser Google Tag Manager"
3. Validation instantanée (si GTM détecté)
4. Aucune action supplémentaire requise
```

---

## ✅ Validation Post-Déploiement

### Checklist Vérification Réussie

- [ ] Meta tag présent sur https://veronecollections.fr (view source)
- [ ] `curl https://veronecollections.fr | grep "google-site-verification"` retourne le meta tag
- [ ] Merchant Center → Website URL → Status "Verified" ✅
- [ ] Email confirmation Google Search Console reçu
- [ ] Screenshot validation sauvegardé

### Tests Automatisés MCP Playwright

```typescript
// Workflow complet validation
async function validateDomain() {
  // 1. Vérifier meta tag sur site
  await mcp__playwright__browser_navigate('https://veronecollections.fr');
  await mcp__playwright__browser_snapshot();

  const pageSource = await page.content();
  const hasMetaTag = pageSource.includes('google-site-verification');

  if (!hasMetaTag) {
    throw new Error('Meta tag Google non trouvé sur veronecollections.fr');
  }

  // 2. Validation Merchant Center
  await mcp__playwright__browser_navigate(
    'https://merchants.google.com/mc/setup/websiteverification?a=5495521926'
  );
  await mcp__playwright__browser_click({ element: 'Valider' });
  await mcp__playwright__browser_wait_for({ text: 'Validated' });

  // 3. Screenshot preuve
  await mcp__playwright__browser_take_screenshot({
    filename: 'veronecollections-verified-success.png',
  });

  console.log('✅ Domaine veronecollections.fr vérifié avec succès');
}
```

---

## 🔧 Troubleshooting

### Erreur : "Meta tag not found"

**Cause** : Meta tag absent ou mal placé sur site déployé

**Solutions** :

```bash
# 1. Vérifier build production
npm run build
# Vérifier output : .next/server/app/layout.html contient meta tag

# 2. Vérifier site déployé
curl -s https://veronecollections.fr | head -20
# Chercher <meta name="google-site-verification"

# 3. Si absent → Re-déployer
git add apps/back-office/src/app/layout.tsx
git commit -m "fix: Google Site Verification meta tag"
git push origin main
```

### Erreur : "DNS record not found"

**Cause** : Propagation DNS incomplète ou TXT record mal configuré

**Solutions** :

```bash
# 1. Vérifier TXT record
dig TXT veronecollections.fr +short

# 2. Si vide → Attendre propagation (max 30 min)

# 3. Si incorrect → Corriger chez registrar
# Value EXACTE : google-site-verification=yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ

# 4. Purge cache DNS local
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

### Erreur : "Validation failed - Site not accessible"

**Cause** : Site veronecollections.fr non accessible ou erreur 404

**Solutions** :

```bash
# 1. Vérifier site accessible
curl -I https://veronecollections.fr
# Status attendu : 200 OK

# 2. Vérifier redirections
# Si 301/302 → Meta tag doit être sur URL finale

# 3. Vérifier SSL
# HTTPS obligatoire pour validation Google

# 4. Vérifier robots.txt
# Ne doit PAS bloquer Googlebot
```

### Erreur : "Multiple verification tags found"

**Cause** : Plusieurs meta tags Google présents (ancien + nouveau)

**Solutions** :

```bash
# 1. Chercher doublons
curl -s https://veronecollections.fr | grep -c "google-site-verification"
# Résultat attendu : 1

# 2. Si >1 → Supprimer anciens meta tags
# Garder uniquement : yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ
```

---

## 📝 Post-Validation : Claim Homepage

**⚠️ ÉTAPE SUIVANTE OBLIGATOIRE** : Après vérification domaine réussie

```
1. Merchant Center → Settings → Website URL
2. Status : "Verified" ✅
3. Cliquer "Claim website"
4. Confirmation popup → "Claim"
5. Status final : "Verified and Claimed" ✅✅
```

**Sans claim homepage** → Produits rejetés avec erreur "Website not claimed"

---

## 🎯 Critères Succès Final

### Configuration Complète ✅

- [x] Meta tag ajouté dans `apps/back-office/apps/back-office/src/app/layout.tsx`
- [ ] Site déployé sur https://veronecollections.fr
- [ ] Meta tag visible dans source HTML
- [ ] Validation Google réussie
- [ ] Email confirmation reçu
- [ ] Homepage claimed
- [ ] Status Merchant Center : "Verified and Claimed"

### Preuves Visuelles ✅

- [ ] Screenshot page validation Google
- [ ] Screenshot status "Verified"
- [ ] Screenshot status "Claimed"
- [ ] Source HTML avec meta tag

---

## 🔗 Liens Utiles

### Documentation Officielle

- [Google Merchant Center - Website Verification](https://support.google.com/merchants/answer/11586344)
- [Google Search Console - Domain Verification](https://support.google.com/webmasters/answer/9008080)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

### Vérone Internal

- [Configuration Google Merchant Complète](./GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md)
- [Résumé Exécutif](./GOOGLE-MERCHANT-RESUME-EXECUTIF.md)
- [Checklist Validation](../../TASKS/completed/GOOGLE-MERCHANT-CONNECTION-CHECKLIST.md)

### URLs Console

- **Merchant Center** : https://merchants.google.com/mc/accounts/5495521926
- **Validation Page** : https://merchants.google.com/mc/setup/websiteverification?a=5495521926
- **Search Console** : https://search.google.com/search-console

---

## 📊 Métriques Session

**Fichier créé** : 2025-10-09
**Meta tag généré** : yTQQSKQhTyiY1QvulJ-7gcGU_j_8wIDljJd9O0HoCLQ
**Domaine** : veronecollections.fr
**Méthode recommandée** : HTML Meta Tag
**Timing validation** : Immédiat après déploiement

---

**Créé le** : 2025-10-09
**Auteur** : Claude Code (Vérone Back Office Team)
**Version** : 1.0
