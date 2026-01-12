# 📢 Notice de Tracking Activité - Information RGPD

**Conformité:** Articles 13 et 14 du Règlement Général sur la Protection des Données (RGPD)
**Date d'effet:** 07 octobre 2025
**Version:** 1.0

---

## 👥 À QUI S'ADRESSE CETTE NOTICE

Cette notice s'adresse à **tous les employés utilisant l'application Vérone Back Office**, notre plateforme CRM/ERP pour la gestion quotidienne de l'activité.

En tant qu'utilisateur de l'application, **vos activités professionnelles sont enregistrées** pour les raisons détaillées ci-dessous. Cette notice explique:

- ✅ Quelles données sont collectées
- ✅ Pourquoi nous les collectons
- ✅ Qui peut y accéder
- ✅ Combien de temps elles sont conservées
- ✅ Quels sont vos droits

**📖 Lecture recommandée: 5 minutes**

---

## 1️⃣ RESPONSABLE DU TRAITEMENT

### **Identité et coordonnées**

**Nom:** Vérone SAS
**Adresse:** [Adresse siège social]
**Email:** contact@verone.com
**Téléphone:** [Numéro téléphone]

### **Délégué à la Protection des Données (DPO)**

Si vous avez des questions sur le traitement de vos données personnelles:

- **Email DPO:** dpo@verone.com
- **Réponse sous:** 30 jours ouvrés

---

## 2️⃣ QUELLES DONNÉES COLLECTONS-NOUS?

### **✅ Données Collectées**

Lorsque vous utilisez l'application Vérone Back Office, nous enregistrons automatiquement:

| Type de Donnée          | Exemple                         | Finalité                 |
| ----------------------- | ------------------------------- | ------------------------ |
| **Pages visitées**      | `/catalogue`, `/commandes`      | Navigation dans app      |
| **Actions métier**      | "Création produit CAP-2025-123" | Activité professionnelle |
| **Temps par module**    | 15 minutes sur Catalogue        | Métriques utilisation    |
| **Erreurs rencontrées** | "Erreur validation formulaire"  | Debugging technique      |
| **Session ID**          | `sess_abc123xyz`                | Groupement actions       |
| **Timestamp**           | `2025-10-07 14:32:15`           | Chronologie activité     |
| **Module actuel**       | "Dashboard"                     | Contexte action          |

### **🔐 Données Techniques (Anonymisées)**

En production uniquement (pas en développement):

- **Adresse IP:** Anonymisée (12.34.xxx.xxx)
- **User Agent:** Simplifié (Chrome/macOS, pas version détaillée)

### **❌ Données JAMAIS Collectées**

Nous NE collectons JAMAIS:

- ❌ Screenshots de votre écran
- ❌ Enregistrement de votre frappe clavier (keylogging)
- ❌ Accès à votre webcam ou microphone
- ❌ Votre localisation GPS
- ❌ Vos emails personnels
- ❌ Votre navigation hors de l'application Vérone

**🛡️ Votre vie privée hors de l'application est protégée.**

---

## 3️⃣ POURQUOI COLLECTONS-NOUS CES DONNÉES?

### **Base Légale du Traitement**

Ce traitement est basé sur l'**intérêt légitime** (Article 6.1.f RGPD).

Un **Legitimate Interest Assessment** complet a été effectué pour garantir que:

- ✅ Nos intérêts business sont légitimes
- ✅ Le traitement est nécessaire
- ✅ Vos droits sont protégés par des safeguards robustes

📄 _Consultable sur demande: [docs/legal/LEGITIMATE-INTEREST-ASSESSMENT.md]_

### **Finalités du Traitement**

Nous utilisons vos données d'activité pour:

#### **A. Améliorer l'Application (UX)**

- **Objectif:** Identifier bugs, erreurs fréquentes, points de friction
- **Bénéfice pour vous:** Application plus fluide, moins d'erreurs
- **Exemple:** Si 80% des utilisateurs rencontrent une erreur sur une page → Bug fix prioritaire

#### **B. Former les Employés**

- **Objectif:** Détecter features sous-utilisées ou mal comprises
- **Bénéfice pour vous:** Formation personnalisée sur ce dont vous avez réellement besoin
- **Exemple:** Vous ne visitez jamais le module "Sourcing" → Formation proposée

#### **C. Optimiser les Workflows**

- **Objectif:** Identifier tâches chronophages ou processus inefficaces
- **Bénéfice pour vous:** Tâches répétitives simplifiées, moins de temps perdu
- **Exemple:** Création d'un produit prend 15min en moyenne → Formulaire simplifié

#### **D. Mesurer l'Engagement Équipe**

- **Objectif:** Vérifier que les employés distants utilisent correctement les outils
- **Bénéfice pour vous:** Détection précoce de difficultés → Aide avant que problème empire
- **Exemple:** Score engagement bas 2 semaines de suite → Discussion avec manager pour comprendre

#### **E. Support Technique Efficace**

- **Objectif:** Logs d'erreurs pour debugging et résolution rapide
- **Bénéfice pour vous:** Support technique plus rapide et ciblé
- **Exemple:** Vous signalez un bug → Logs nous aident à le reproduire et corriger

### **✅ IMPORTANT: Utilisation Éthique**

Nous nous engageons à:

- ✅ Utiliser les données UNIQUEMENT pour les finalités ci-dessus
- ✅ Ne JAMAIS vendre vos données à des tiers
- ✅ Ne PAS prendre de décisions RH basées uniquement sur les métriques
- ✅ Considérer le contexte humain (nouvel employé, formation en cours, etc.)

**Les métriques sont un outil de diagnostic, PAS de punition.**

---

## 4️⃣ QUI PEUT ACCÉDER À VOS DONNÉES?

### **Accès Interne**

| Qui?                  | Quelles Données?                        | Pourquoi?                              |
| --------------------- | --------------------------------------- | -------------------------------------- |
| **VOUS**              | VOS propres données uniquement          | Transparence (page /mon-activite)      |
| **Propriétaires**     | Métriques agrégées équipe + accès admin | Pilotage activité, pas micromanagement |
| **Service Technique** | Logs erreurs anonymisés                 | Debugging et support uniquement        |

### **🔒 Sécurité des Accès (RLS Strict)**

- ✅ Vous voyez UNIQUEMENT vos propres données
- ✅ Vous ne voyez PAS les données de vos collègues
- ✅ Row Level Security (RLS) implémenté dans la base de données
- ✅ Accès propriétaires limité aux vues agrégées (pas détails invasifs)

### **Pas de Partage Externe**

- ❌ Aucune donnée n'est partagée avec des entreprises tierces
- ❌ Aucune donnée n'est vendue à des annonceurs
- ❌ Pas de transferts hors de l'Union Européenne

**Vos données restent strictement internes à Vérone.**

---

## 5️⃣ COMBIEN DE TEMPS CONSERVONS-NOUS VOS DONNÉES?

### **Rétention Limitée**

| Type de Données              | Durée Conservation  | Justification               |
| ---------------------------- | ------------------- | --------------------------- |
| **Logs détaillés**           | **30 jours**        | Debugging récent et audit   |
| **Agrégations statistiques** | **1 an**            | Analyse tendances annuelles |
| **Données sensibles**        | **0 jour (jamais)** | Protection vie privée       |
| **Sessions actives**         | **Temps réel**      | Monitoring performance      |

### **🗑️ Suppression Automatique**

- ✅ **Cron job quotidien** supprime automatiquement logs >30 jours
- ✅ Pas besoin de demande manuelle, c'est automatique
- ✅ Agrégations après 1 an également purgées

**Après 30 jours, vos actions détaillées sont définitivement supprimées.**

---

## 6️⃣ QUELS SONT VOS DROITS?

En vertu du RGPD, vous disposez des droits suivants:

### **✅ Droit d'Accès (Article 15)**

**Vous pouvez:**

- Consulter vos données à tout moment sur la page `/mon-activite`
- Demander un export complet de vos données (CSV)

**Comment?**

- Cliquez sur votre profil → "Mon Activité" → Bouton "Export CSV"
- OU envoyez un email à dpo@verone.com

**Délai de réponse:** 30 jours maximum

### **📝 Droit de Rectification (Article 16)**

**Vous pouvez:**

- Corriger des données inexactes ou incomplètes

**Exemple:** Une action a été enregistrée par erreur à votre compte

**Comment?** Email à dpo@verone.com avec détails

### **🗑️ Droit à l'Effacement (Article 17)**

**Vous pouvez:**

- Demander la suppression de vos données

**⚠️ Limites:**

- Impossible si données nécessaires pour obligation légale (audit comptable)
- Impossible si données nécessaires pour droits juridiques (preuve travail effectué)

**Comment?** Email à dpo@verone.com avec justification

**Délai de réponse:** 30 jours maximum

### **⛔ Droit d'Opposition (Article 21)**

**Vous pouvez:**

- Vous opposer au traitement de vos données

**⚠️ Important:**

- L'entreprise peut refuser si "motifs légitimes impérieux" (ex: sécurité système)
- Discussion avec DPO et manager dans ce cas

**Comment?** Email à dpo@verone.com avec raisons

### **📤 Droit à la Portabilité (Article 20)**

**Vous pouvez:**

- Recevoir vos données dans un format machine-readable (CSV)
- Transférer ces données à un autre employeur (si changement de job)

**Comment?** Bouton "Export CSV" sur page Mon Activité

### **🚫 Droit de Limitation (Article 18)**

**Vous pouvez:**

- Demander limitation du traitement dans certains cas (litige, inexactitude)

**Comment?** Email à dpo@verone.com

---

## 7️⃣ MESURES DE SÉCURITÉ

### **🔐 Protection Technique**

- ✅ **Encryption at rest:** Données chiffrées dans la base Supabase
- ✅ **Encryption in transit:** HTTPS/TLS pour toutes communications
- ✅ **Row Level Security (RLS):** Isolation données par utilisateur
- ✅ **IP Anonymization:** Production uniquement (12.34.xxx.xxx)
- ✅ **User Agent Simplified:** Pas de fingerprinting détaillé

### **🛡️ Protection Organisationnelle**

- ✅ **Accès restreints:** Seuls propriétaires et techniciens autorisés
- ✅ **Audit logs:** Traçabilité accès administrateurs
- ✅ **Formation RGPD:** Personnel sensibilisé protection données
- ✅ **Politique sécurité:** Procédures documentées et appliquées

---

## 8️⃣ TRACKING ÉTHIQUE & TRANSPARENCE

### **⏰ Tracking Heures Travail Uniquement**

- ✅ Tracking actif: **Lundi-Vendredi, 9h-18h uniquement**
- ✅ Hors heures travail: **Aucun tracking**, même si vous êtes connecté
- ✅ Week-ends: **Aucun tracking**
- ✅ Congés: **Aucun tracking**

**Votre vie privée hors heures de travail est protégée.**

### **📊 Métriques Non-Punitives**

- ✅ Les métriques servent à **identifier besoins**, pas punir
- ✅ Score engagement faible → Discussion, formation, aide
- ✅ Pas de décisions RH automatisées basées uniquement sur métriques
- ✅ Contexte humain toujours pris en compte

**Exemple:** Nouvel employé avec score faible = **normal** (apprentissage), pas **problème**

### **👀 Transparence Totale**

- ✅ Vous voyez **exactement** ce que nous voyons de vous
- ✅ Page `/mon-activite` accessible 24/7
- ✅ Historique de vos 50 dernières actions consultable
- ✅ Export CSV disponible à tout moment

**Pas de tracking caché ou de données secrètes.**

---

## 9️⃣ RÉCLAMATION AUPRÈS D'UNE AUTORITÉ

### **🇫🇷 Si Vous Êtes en France**

Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la **CNIL** (Commission Nationale de l'Informatique et des Libertés):

**CNIL**

- **Adresse:** 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
- **Téléphone:** 01 53 73 22 22
- **Site web:** https://www.cnil.fr
- **Formulaire en ligne:** https://www.cnil.fr/fr/plaintes

### **🇪🇺 Si Vous Êtes dans un Autre Pays UE**

Contactez l'autorité de protection des données de votre pays:

- **Liste complète:** https://edpb.europa.eu/about-edpb/board/members_en

---

## 🔟 MODIFICATIONS DE CETTE NOTICE

### **Mises à Jour**

Cette notice peut être modifiée si:

- Nouvelles finalités de traitement
- Nouvelles données collectées
- Changements réglementaires (RGPD mis à jour)

### **Notification**

En cas de modification:

- ✅ Vous serez informé par **email**
- ✅ Notice mise à jour accessible sur cette page
- ✅ Historique versions disponible (Annexe B)

**Dernière mise à jour:** 07 octobre 2025

---

## 📞 CONTACT & QUESTIONS

### **Pour Toute Question sur Cette Notice:**

**Email DPO:** dpo@verone.com
**Réponse sous:** 30 jours ouvrés

### **Pour Exercer Vos Droits:**

**Email:** dpo@verone.com
**Objet:** [RGPD] Exercice du droit [accès/rectification/effacement/etc.]
**Pièces à joindre:** Preuve identité (carte d'identité, badge employé, etc.)

**Délai de réponse:** 30 jours (extensible à 90 jours si demande complexe)

---

## 📋 ANNEXES

### **Annexe A: Glossaire**

- **RGPD:** Règlement Général sur la Protection des Données (2016/679)
- **DPO:** Délégué à la Protection des Données (Data Protection Officer)
- **RLS:** Row Level Security (sécurité niveau ligne base données)
- **Intérêt Légitime:** Base légale Article 6.1.f RGPD
- **LIA:** Legitimate Interest Assessment (évaluation intérêt légitime)

### **Annexe B: Historique Versions**

| Version | Date       | Modifications            |
| ------- | ---------- | ------------------------ |
| 1.0     | 07/10/2025 | Création initiale notice |
| -       | -          | -                        |

### **Annexe C: Documents Connexes**

- **Legitimate Interest Assessment:** `docs/legal/LEGITIMATE-INTEREST-ASSESSMENT.md`
- **Best Practices Tracking Employés:** `docs/guides/BEST-PRACTICES-TRACKING-EMPLOYÉS-DISTANTS.md`
- **Guide Technique Tracking:** `docs/guides/GUIDE-TRACKING-ACTIVITE-UTILISATEUR.md`

---

## ✅ CONFIRMATION DE LECTURE (Optionnel mais Recommandé)

### **Pour les Nouveaux Employés**

Lors de votre onboarding, nous vous demandons de signer un accusé de réception confirmant que:

```
☑️ J'ai lu et compris la Notice de Tracking Activité RGPD
☑️ Je comprends quelles données sont collectées et pourquoi
☑️ Je connais mes droits (accès, rectification, effacement, opposition)
☑️ Je sais que je peux consulter mes données sur /mon-activite à tout moment
☑️ Je sais que je peux contacter le DPO (dpo@verone.com) pour toute question

Nom: _______________
Date: _______________
Signature: _______________
```

**Note:** Cette signature n'est PAS un consentement (le traitement est basé sur intérêt légitime, pas consentement). C'est une **confirmation de lecture** pour garantir la transparence.

---

**📢 FIN DE LA NOTICE DE TRACKING ACTIVITÉ**

_Document conforme aux Articles 13 et 14 du RGPD_
_Vérone Back Office - Système Tracking Activité Utilisateur 2025_

---

**🔗 Liens Utiles:**

- 🏠 Retour Dashboard: `/dashboard`
- 📊 Mon Activité: `/mon-activite`
- 💬 Contact DPO: dpo@verone.com
- 🇫🇷 CNIL: https://www.cnil.fr
