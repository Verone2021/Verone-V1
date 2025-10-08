# ⚖️ Legitimate Interest Assessment (LIA) - Tracking Activité Vérone

**Date d'évaluation:** 07 octobre 2025
**Responsable:** Direction Vérone
**Révision annuelle:** Octobre 2026
**Base légale:** Article 6.1.f RGPD (Intérêt légitime)

---

## 📋 CONTEXTE DU TRAITEMENT

### **Responsable du traitement**
- **Société:** Vérone SAS
- **Activité:** CRM/ERP pour décoration et mobilier d'intérieur haut de gamme
- **Application:** Vérone Back Office (plateforme B2B interne)
- **Utilisateurs concernés:** Employés travaillant à distance (agents autonomes)

### **Données traitées**
- Pages visitées dans l'application
- Actions métier (création produit, validation commande, etc.)
- Temps passé par module/section
- Erreurs rencontrées (debugging UX)
- Session ID, Timestamp, Module courant
- IP anonymisée (production), User agent simplifié

### **Données EXCLUES (jamais collectées)**
- ❌ Screenshots écran
- ❌ Keylogging (frappe clavier)
- ❌ Webcam/microphone
- ❌ GPS/localisation
- ❌ Emails personnels
- ❌ Navigation hors application

---

## 1️⃣ PURPOSE TEST (Test de Finalité)

### **Question:** Quelles sont les finalités légitimes du traitement?

### **Réponses:**

#### **A. Amélioration UX Application**
- **Objectif:** Identifier bugs, erreurs fréquentes, points de friction
- **Bénéfice:** Amélioration continue plateforme → Employés plus efficaces
- **Exemple:** Si 80% utilisateurs rencontrent erreur sur page X → Bug fix prioritaire

#### **B. Formation Ciblée Employés**
- **Objectif:** Détecter features sous-utilisées ou mal comprises
- **Bénéfice:** Formation personnalisée sur modules réellement utilisés
- **Exemple:** Employé ne visite jamais module "Sourcing" → Formation ciblée

#### **C. Optimisation Workflows**
- **Objectif:** Identifier goulots d'étranglement processus métier
- **Bénéfice:** Simplification tâches répétitives chronophages
- **Exemple:** Création produit prend 15min en moyenne → Simplifier formulaire

#### **D. Mesure Engagement Équipe Distante**
- **Objectif:** Vérifier employés distants utilisent correctement outils
- **Bénéfice:** Détection précoce désengagement → Entretien 1-on-1, pas punition
- **Exemple:** Score engagement <30 pendant 2 semaines → Discussion avec employé

#### **E. Support Technique Efficace**
- **Objectif:** Logs erreurs pour debugging et support
- **Bénéfice:** Résolution problèmes techniques plus rapide
- **Exemple:** Employé signale bug → Logs activité aident reproduire erreur

### **✅ Conclusion Purpose Test**
**Finalités légitimes?** OUI
**Raison:** Intérêts business valides (productivité, formation, support) alignés avec intérêts employés (meilleurs outils, moins de friction)

---

## 2️⃣ NECESSITY TEST (Test de Nécessité)

### **Question:** Pouvons-nous atteindre ces objectifs par des moyens moins intrusifs?

### **Analyse par finalité:**

#### **A. Amélioration UX**
- **Alternative 1:** Feedback manuel employés (enquêtes, tickets)
  - ❌ **Limites:** Biais réponse (seuls bugs majeurs signalés), incomplet
- **Alternative 2:** Pas de tracking
  - ❌ **Limites:** Impossible connaître vrais problèmes UX vécus au quotidien
- **Conclusion:** Tracking nécessaire pour données objectives et exhaustives

#### **B. Formation Ciblée**
- **Alternative 1:** Tests de connaissances périodiques
  - ❌ **Limites:** Ne reflète pas usage réel, peut être "triché"
- **Alternative 2:** Auto-déclaration employés
  - ❌ **Limites:** Biais désirabilité sociale (surestimation compétences)
- **Conclusion:** Tracking usage réel plus fiable pour identifier besoins formation

#### **C. Optimisation Workflows**
- **Alternative 1:** Observation directe (shadowing)
  - ❌ **Limites:** Intrusif, chronophage, biais Hawthorne (comportement modifié quand observé)
- **Alternative 2:** Pas d'optimisation
  - ❌ **Limites:** Workflows inefficaces persistent, perte productivité
- **Conclusion:** Tracking passif moins intrusif et plus objectif

#### **D. Mesure Engagement**
- **Alternative 1:** Reporting manuel activité
  - ❌ **Limites:** Chronophage pour employés, risque surestimation/sous-estimation
- **Alternative 2:** Évaluations performance traditionnelles
  - ❌ **Limites:** Subjectives, fréquence limitée (annuel), biais cognitifs
- **Conclusion:** Métriques objectives complètent (ne remplacent pas) évaluations humaines

#### **E. Support Technique**
- **Alternative 1:** Reproduction manuelle bugs par employés
  - ❌ **Limites:** Oublis, descriptions imprécises, chronophage
- **Alternative 2:** Pas de logs
  - ❌ **Limites:** Debugging impossible sans contexte
- **Conclusion:** Error logging indispensable pour support technique efficace

### **✅ Conclusion Necessity Test**
**Traitement nécessaire?** OUI
**Raison:** Aucune alternative moins intrusive permet d'atteindre objectifs avec même efficacité

---

## 3️⃣ BALANCING TEST (Test d'Équilibre)

### **Question:** Les droits des employés prévalent-ils sur les intérêts business?

### **Intérêts Business (Vérone)**

| Intérêt | Justification | Importance |
|---------|--------------|------------|
| **Productivité équipe** | Mesurer efficacité collective pour pilotage activité | 🔴 Élevée |
| **ROI développement** | Savoir si features développées sont utilisées | 🟠 Moyenne |
| **Support technique** | Logs nécessaires debugging rapide | 🔴 Élevée |
| **Formation continue** | Identifier lacunes compétences employés | 🟠 Moyenne |
| **Optimisation UX** | Améliorer expérience utilisateur quotidienne | 🟡 Modérée |

**Score Intérêts Business:** 🔴 Élevé (productivité + support critiques)

### **Droits & Intérêts Employés**

| Droit/Intérêt | Impact du Tracking | Gravité Impact |
|---------------|-------------------|----------------|
| **Vie privée** | Tracking limité heures travail (9h-18h) | 🟢 Faible |
| **Dignité au travail** | Pas de surveillance humiliante (no screenshots) | 🟢 Faible |
| **Autonomie** | Pas de micromanagement temps réel | 🟢 Faible |
| **Transparence** | Chacun voit SES données (/mon-activite) | 🟢 Faible |
| **Non-discrimination** | Métriques = diagnostic, pas punition | 🟢 Faible |

**Score Impact Droits:** 🟢 Faible (safeguards robustes)

### **Safeguards Implémentés (Mesures de Protection)**

#### **1. Limitation Finalité**
- ✅ Données utilisées UNIQUEMENT pour finalités déclarées
- ✅ Interdiction utilisation décisions RH automatisées
- ✅ Pas de vente/partage données tiers

#### **2. Minimisation Données**
- ✅ Uniquement actions métier importantes trackées (pas chaque clic)
- ✅ Pas de surveillance invasive (screenshots, keylogging interdits)
- ✅ IP anonymisée production (pas d'identification géographique)
- ✅ User agent simplifié (pas de fingerprinting)

#### **3. Transparence Totale**
- ✅ Notice de tracking RGPD complète remise à tous employés
- ✅ Page "Mon Activité" accessible 24/7 par chaque employé
- ✅ RLS strict: Employé voit UNIQUEMENT ses données
- ✅ Propriétaires voient agrégations équipe, pas détails individuels invasifs

#### **4. Rétention Limitée**
- ✅ Logs détaillés: 30 jours maximum
- ✅ Agrégations: 1 an (stats, pas données brutes)
- ✅ Auto-purge automatique (cron quotidien)
- ✅ Pas d'archivage long terme données sensibles

#### **5. Droits RGPD Garantis**
- ✅ Droit d'accès: Export CSV personnel disponible
- ✅ Droit d'effacement: Procédure suppression documentée
- ✅ Droit d'opposition: Formulaire réclamation accessible
- ✅ Droit de portabilité: Format machine-readable (CSV)

#### **6. Tracking Éthique**
- ✅ Heures travail uniquement (9h-18h, Lun-Ven)
- ✅ Pas de tracking hors application (vie privée hors travail protégée)
- ✅ Métriques non-punitives (focus amélioration, pas sanction)
- ✅ Contexte humain pris en compte (nouvel employé = score faible normal)

### **⚖️ Résultat du Balancing Test**

**Intérêts Business:** 🔴 Élevé (productivité + support essentiels)
**vs**
**Impact Droits Employés:** 🟢 Faible (safeguards robustes)

**Balance:** ✅ **INTÉRÊTS BUSINESS PRÉVALENT**

**Justification:**
1. Intérêts business sont légitimes et impérieux (productivité équipe distante, support technique)
2. Impact sur droits employés est minimal grâce aux safeguards
3. Tracking bénéficie AUSSI aux employés (meilleurs outils, formations ciblées, bugs corrigés)
4. Mesures de protection dépassent exigences minimales RGPD

---

## 4️⃣ CONCLUSION LEGITIMATE INTEREST ASSESSMENT

### **✅ TRAITEMENT AUTORISÉ SUR BASE INTÉRÊT LÉGITIME**

**Résumé des 3 tests:**

| Test | Résultat | Justification |
|------|----------|---------------|
| **Purpose** | ✅ VALIDE | Finalités business légitimes et explicites |
| **Necessity** | ✅ VALIDE | Pas d'alternative moins intrusive aussi efficace |
| **Balancing** | ✅ VALIDE | Intérêts business > Impact droits (safeguards robustes) |

### **Conditions d'Exploitation**

Le traitement est autorisé SOUS CONDITIONS suivantes:

1. ✅ **Notice RGPD** remise à tous employés AVANT activation
2. ✅ **Safeguards techniques** implémentés (IP anon, working hours, RLS)
3. ✅ **Transparence** garantie (page Mon Activité accessible)
4. ✅ **Limitation finalité** respectée (pas utilisation abusive)
5. ✅ **Droits RGPD** exercibles facilement (export CSV, suppression)
6. ✅ **Rétention limitée** appliquée (30 jours + auto-purge)
7. ✅ **Review annuelle** LIA (revoir équilibre si changements)

### **Validité de l'Assessment**

- **Date début validité:** 07 octobre 2025
- **Date fin validité:** 06 octobre 2026
- **Révision obligatoire:** Octobre 2026 OU si changements matériels (nouvelles données collectées, nouvelles finalités, etc.)

### **Responsabilité**

- **Responsable Traitement:** Direction Vérone SAS
- **Contact DPO (si applicable):** dpo@verone.com
- **Gestionnaire LIA:** [Nom Responsable Compliance]

---

## 📚 ANNEXES

### **Annexe A: Registre des Traitements (Article 30 RGPD)**

| Champ | Valeur |
|-------|--------|
| **Nom traitement** | Tracking Activité Utilisateurs Application Vérone |
| **Finalités** | Amélioration UX, Formation, Optimisation workflows, Engagement équipe, Support technique |
| **Base légale** | Intérêt légitime (Article 6.1.f) |
| **Catégories données** | Données navigation (pages, actions, temps), Données techniques (session, erreurs) |
| **Catégories personnes** | Employés Vérone (agents autonomes distants) |
| **Destinataires** | Propriétaires organisation, Service technique (debugging) |
| **Transferts hors UE** | Non |
| **Durées conservation** | 30 jours (logs), 1 an (agrégations) |
| **Mesures sécurité** | RLS Supabase, Encryption at rest/in transit, IP anonymisation, Auto-purge |

### **Annexe B: Références Légales**

- **RGPD Article 6.1.f:** Traitement nécessaire aux fins des intérêts légitimes
- **RGPD Article 13-14:** Obligations transparence
- **RGPD Article 30:** Registre des activités de traitement
- **CNIL Guide:** Surveillance employés (Février 2024)
- **ICO Guidance:** Employment Practices Code (UK)

### **Annexe C: Historique Révisions**

| Date | Version | Modifications |
|------|---------|---------------|
| 07/10/2025 | 1.0 | Création initiale LIA |
| - | - | - |

---

**✅ FIN DU LEGITIMATE INTEREST ASSESSMENT**

*Document validé conformément Article 6.1.f RGPD*
*Vérone Back Office - Système Tracking Activité Utilisateur 2025*
