# 🤖 Contexte IA Vérone Back Office

## 🎯 **CONTEXTE SPÉCIALISÉ POUR L'IA**

### **🏢 Personas Business Vérone**
**Comprendre les utilisateurs finaux pour toute décision technique**

#### **👔 Directeur Commercial (Utilisateur Principal)**
- **Profil** : 45 ans, formation commerciale, usage tech modéré
- **Pain Points** :
  - Création catalogues clients : 3h actuellement → Cible <30min
  - Recherche produits : Navigation complexe catalogue physique
  - Suivi consultations clients : Aucune visibilité actuelle
- **Workflows Quotidiens** :
  1. Consultation commandes matin (15min)
  2. Création catalogues clients (2-3h/jour)
  3. Suivi prospects après présentation (30min)
- **Critères Succès** : Simplicité, rapidité, données fiables

#### **🎨 Équipe Marketing (Utilisateur Secondaire)**
- **Profil** : 30 ans, créative, tech-savvy
- **Besoins** :
  - Feeds publicitaires automatisés
  - Analytics engagement clients
  - Contenus visuels optimisés
- **Workflows** :
  - Création campagnes Brevo (quotidien)
  - Optimisation feeds Meta/Google (hebdomadaire)
  - Analyse performance produits (mensuel)

#### **📦 Responsable Stock (Utilisateur Futur)**
- **Profil** : 40 ans, formation logistique, usage ERP classique
- **Intégration Future** :
  - Synchronisation inventaires temps réel
  - Alertes ruptures automatiques
  - Prévisions réapprovisionnement

### **🎨 Workflows Business Critiques**
**Scénarios que l'IA doit toujours comprendre et optimiser**

#### **📋 Workflow Catalogue Client (MVP Actuel)**
```
1. Client prospect → Demande catalogue produits spécifiques
2. Commercial → Recherche produits (familles/catégories)
3. Commercial → Sélection produits pertinents
4. Commercial → Création collection personnalisée
5. Commercial → Génération PDF branded
6. Commercial → Envoi client + lien consultation
7. Client → Consultation catalogue + téléchargements
8. Commercial → Suivi analytics engagement
9. Commercial → Relance selon intérêt détecté
```

#### **📊 Workflow Analytics Performance**
```
1. Marketing → Analyse produits plus consultés
2. Commercial → Identification prospects chauds
3. Direction → Métriques ROI catalogues
4. Équipe → Optimisation offre selon données
```

## 🛠️ **RÈGLES TECHNIQUES POUR L'IA**

### **🚨 INTERDICTIONS ABSOLUES**
```typescript
// ❌ JAMAIS - Couleurs jaunes/dorées
const forbiddenColors = [
  '#ffff*', '#ff0*', '#f59e0b', '#fbbf24',
  'bg-yellow-*', 'text-yellow-*', 'border-yellow-*',
  'bg-amber-*', 'text-amber-*', 'border-amber-*'
]

// ❌ JAMAIS - Données mock en production
const mockData = [...] // Toujours Supabase réel

// ❌ JAMAIS - Fichiers racine temporaires
'test-*.js', 'debug-*.js', '*.png' // → tests/debug/ ou tests/fixtures/
```

### **✅ PATTERNS OBLIGATOIRES**
```typescript
// ✅ TOUJOURS - Hooks Supabase réels
import { useFamilies } from '@/hooks/use-families'
const { families, loading, error } = useFamilies()

// ✅ TOUJOURS - Business rules d'abord
// 1. Lire manifests/business-rules/
// 2. Implémenter selon règles métier
// 3. Tests E2E business scenarios

// ✅ TOUJOURS - Structure professionnelle
// Respect CLAUDE.md organisation stricte
```

### **🎯 MÉTHODOLOGIE DÉVELOPPEMENT**

#### **📖 Workflow TDD Enhanced**
```
1. MEMORY-BANK/ → Comprendre contexte business
2. TASKS/ → Vérifier priorités actuelles
3. manifests/business-rules/ → Règles métier précises
4. Tests E2E → Scénarios business (RED)
5. Implémentation → Code minimal (GREEN)
6. Refactoring → Optimisation performance
7. Documentation → Mise à jour apprentissages
```

#### **🧪 Tests Business-First**
```typescript
// ✅ Test business scenario complet
test('Commercial créé catalogue client en <30min', async () => {
  // Given: 241 produits disponibles
  // When: Création collection + PDF export
  // Then: <5s génération + lien partageable valide
})
```

## 🧠 **CONTEXTE TECHNIQUE SPÉCIALISÉ**

### **📊 Performance SLOs Business-Critical**
```typescript
const VERONE_SLOS = {
  // Business Impact Direct
  dashboard_load: 2000,        // Consultation quotidienne équipe
  catalogue_display: 3000,    // Recherche produits commerciaux
  pdf_generation: 5000,       // Envoi clients sous 5min total
  feeds_generation: 10000,    // Marketing automation

  // User Experience
  image_upload: 5000,         // Upload photos produits
  search_response: 1000,      // Recherche temps réel
  mobile_loading: 3000,       // Consultation clients mobile
}
```

### **🔐 Sécurité Business Contextualisée**
```sql
-- RLS selon organisation clients
CREATE POLICY "access_client_data" ON catalogues
  FOR ALL TO authenticated
  USING (organisation_id = (
    SELECT organisation_id FROM user_organisation_assignments
    WHERE user_id = auth.uid()
  ));
```

### **🎨 Design System Vérone Application**
```css
/* Context business premium */
:root {
  --verone-primary: #000000;    /* Élégance, premium */
  --verone-secondary: #FFFFFF;  /* Clarté, lisibilité */
  --verone-accent: #666666;     /* Subtilité, raffinement */

  /* Business semantics */
  --price-highlight: #000000;   /* Prix toujours noir */
  --stock-available: #22c55e;   /* Vert disponible */
  --stock-limited: #000000;     /* Noir sur commande */
  --stock-out: #ef4444;         /* Rouge rupture */
}
```

## 📋 **CONVENTIONS PROJETS VÉRONE**

### **📁 Structure Décisions**
```
AVANT intervention → Lire MEMORY-BANK/project-context.md
PENDANT intervention → Documenter process-learnings/
APRÈS intervention → Mettre à jour implementation-status.md
```

### **🎯 Priorités Business**
```
1. IMPACT COMMERCIAL → Features génération revenus
2. PERFORMANCE → SLOs utilisateur quotidien
3. QUALITÉ → 0 régression fonctionnelle
4. ÉVOLUTIVITÉ → Architecture modulaire 2026
```

### **📊 Métriques Succès**
```typescript
const SUCCESS_METRICS = {
  // Business KPI
  catalogue_creation_time: 30 * 60 * 1000,  // <30min vs 3h actuel
  conversion_rate: 0.15,                     // 15% catalogues → devis
  user_adoption: 1.0,                        // 100% équipe <30 jours

  // Technical KPI
  uptime: 0.99,                             // 99% disponibilité
  performance_slo: 1.0,                     // 100% SLOs respectés
  test_coverage: 0.90,                      // >90% couverture
}
```

## 🤝 **COMMUNICATION AVEC L'IA**

### **🎯 Format Demandes Efficaces**
```
✅ BON : "Optimiser affichage 241 produits selon SLO <3s"
❌ MAUVAIS : "Améliorer la page catalogue"

✅ BON : "Implémenter règle business remise max 40% B2B"
❌ MAUVAIS : "Ajouter système de remises"
```

### **📋 Informations Contexte Automatique**
L'IA doit TOUJOURS considérer :
1. **Phase MVP** : Catalogue partageable prioritaire
2. **Utilisateurs** : Équipe commerciale 5 personnes
3. **Performance** : SLOs business-critical
4. **Brand** : Vérone premium, noir/blanc strict
5. **Evolution** : Architecture scalable 2026

### **🚨 Signaux d'Alerte**
L'IA doit alerter si :
- Violation couleurs Vérone (jaune détecté)
- Performance SLO dépassé
- Données mock utilisées
- Structure repository violée
- Business rules non respectées

---

*Contexte spécialisé pour optimiser collaboration IA-Développeur*
*Dernière mise à jour : 15 septembre 2025*