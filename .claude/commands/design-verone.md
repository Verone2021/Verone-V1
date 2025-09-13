# 🎨 Commande /design-verone

> **Usage** : `/design-verone <interface-name>`

## 📋 Description  

Workflow de conception UX/UI pour les interfaces Vérone, basé sur le **Design System** et les **workflows métier** spécifiques au CRM/ERP décoration/mobilier.

## 🎯 Workflow Automatique

### **Phase 1 : Analyse UX**
1. **verone-design-expert** → Analyse persona + contexte usage
2. **Manifests analysis** → Business rules + user workflows
3. **Competitive analysis** → Best practices secteur décoration
4. **User journey mapping** → Parcours optimaux par objectif

### **Phase 2 : Design System**
1. **Tokens cohérence** → Couleurs, typography, spacing Vérone
2. **Composants catalogue** → Réutilisation maximum shadcn/ui
3. **Patterns spécialisés** → ProductCard, PriceDisplay, CollectionGrid
4. **Responsive strategy** → Mobile-first approach

### **Phase 3 : Prototypage**
1. **Wireframes** → Structure information + navigation
2. **Visual design** → Application design system Vérone
3. **Micro-interactions** → Animations + transitions cohérentes
4. **Accessibility** → WCAG AA compliance

### **Phase 4 : Validation**
1. **Design review** → Cohérence avec existing interfaces
2. **User testing** → Validation avec équipe Vérone
3. **Technical feasibility** → Implémentation shadcn/ui + Tailwind
4. **Performance impact** → Optimisation images + animations

## 🛠️ Outils Utilisés

### **Design & Prototyping**
- **verone-design-expert** : Spécialiste UX + design system
- **Sequential Thinking** : Architecture information complexe
- **Context7** : Tailwind best practices, shadcn/ui patterns

### **User Research**
- **Manifests/** : User personas, workflows, PRDs
- **Serena** : Analyse composants existants, optimisations
- **GitHub** : Issues utilisateur, feedback, iterations

### **Implementation**  
- **Supabase** : Cohérence données ↔ affichage
- **Playwright** : Tests visuels + responsiveness
- **Next.js patterns** : SSR/SSG optimisations

## 🎭 Examples d'Usage

### **Interface Back-Office**
```bash
/design-verone dashboard-admin

# Workflow automatique:
# 1. Analyse personas admin/commercial/stock
# 2. User journey: login → dashboard → actions rapides
# 3. Information architecture: KPIs + alerts + shortcuts
# 4. Design system: composants DashboardCard, QuickActions
# 5. Responsive: tablette-friendly pour usage terrain
```

### **Catalogue Partageable**
```bash
/design-verone catalogue-client

# Workflow automatique:  
# 1. Analyse expérience client premium attendue
# 2. User journey: lien → consultation → demande devis
# 3. Design immersif: images haute qualité + branding
# 4. Composants: ProductShowcase, QuoteRequest, PDFDownload  
# 5. Mobile-first: consultation majoritairement mobile
```

### **Workflow Commercial**
```bash
/design-verone creation-devis

# Workflow automatique:
# 1. Analyse efficacité commerciale (temps = argent)
# 2. User journey: client → produits → quantités → prix → PDF
# 3. Interface optimisée: recherche + auto-complete + drag&drop
# 4. Composants: ClientSearch, ProductQuickAdd, PriceCalculator
# 5. One-click actions: génération rapide devis branded
```

## 🎨 Design System Vérone

### **Brand Identity** 
```css
/* Couleurs Vérone - Décoration haut de gamme */
:root {
  --verone-primary: #[Couleur signature à définir];
  --verone-secondary: #[Couleur complémentaire];  
  --verone-accent: #[Couleur CTA/actions];
  --verone-neutral: #[Couleur textes/backgrounds];
  
  /* Contextes business */
  --price-highlight: #[Couleur prix/promotions];
  --stock-available: #22c55e;    /* Vert - En stock */
  --stock-limited: #f59e0b;      /* Orange - Sur commande */
  --stock-out: #ef4444;          /* Rouge - Rupture */
}
```

### **Typography Hiérarchique**
```css
/* Fonts adaptées décoration/mobilier */
--font-display: 'Font Vérone Display';  /* Titres, branding */
--font-body: 'Font Vérone Text';       /* Corps, descriptions */
--font-mono: 'JetBrains Mono';         /* Références, prix */

/* Scale harmonieuse */
.text-display { font-size: 2.5rem; }   /* Headers principales */
.text-title { font-size: 1.875rem; }   /* Titres sections */  
.text-subtitle { font-size: 1.25rem; } /* Sous-titres */
.text-body { font-size: 1rem; }        /* Corps principal */
.text-caption { font-size: 0.875rem; } /* Labels, métadonnées */
```

### **Composants Signature**
```typescript
// Composants métier spécialisés
interface VeroneComponents {
  // Catalogue
  ProductCard: { image: string, price: PriceDisplay, stock: StockStatus }
  CollectionGrid: { products: Product[], layout: 'masonry' | 'grid' }  
  CategoryNavigation: { hierarchy: Category[], breadcrumbs: boolean }
  
  // Commerce
  PriceDisplay: { context: 'b2b' | 'b2c', tiers: boolean, currency: 'EUR' }
  StockIndicator: { status: 'available' | 'preorder' | 'out', quantity?: number }
  QuoteBuilder: { products: Product[], client: Client, template: string }
  
  // Sharing  
  ShareableLink: { collection: Collection, expiry: Date, password?: string }
  BrandedPDF: { products: Product[], client: Client, branding: 'full' }
  
  // Admin
  BulkActions: { selected: Product[], actions: string[], confirmation: boolean }
  DataTable: { sortable: boolean, filterable: boolean, exportable: boolean }
}
```

## 🔧 Standards UX Vérone

### **Principes de Design**
1. **Efficiency First** : Workflows optimisés productivité équipe
2. **Premium Feel** : Esthétique cohérente positionnement Vérone  
3. **Data-Driven** : Décisions basées métriques + feedback utilisateur
4. **Mobile-Conscious** : Responsive design, touch-friendly
5. **Accessible** : WCAG AA, utilisable par tous

### **Performance UX**
```typescript
// Métriques à respecter
const UX_REQUIREMENTS = {
  // Interactions
  click_response: '< 100ms',
  page_transition: '< 300ms', 
  form_validation: 'realtime',
  
  // Loading
  dashboard_load: '< 2s',
  product_search: '< 1s',
  image_load: '< 500ms',
  
  // Mobile
  touch_target: '>= 44px',
  scroll_smooth: '60fps',
  orientation_adapt: 'automatic'
}
```

### **Accessibility Standards**
- **Contraste** : AAA pour textes, AA pour éléments graphiques
- **Navigation** : 100% accessible clavier
- **Screen readers** : Aria labels complets  
- **Focus management** : Visible + logical order
- **Touch targets** : ≥44px, espacement ≥8px

## 🚀 Contexte Métier Vérone

### **Interfaces Prioritaires MVP**
1. **Dashboard Admin** → Vision 360° activité quotidienne
2. **Catalogue Management** → CRUD produits efficace + intuitif
3. **Collection Builder** → Création sélections clients rapide
4. **Shared Catalogs** → Expérience consultation premium
5. **Quote Generator** → Interface commerciale optimisée

### **User Personas**
```typescript
interface VeronePersonas {
  AdminCatalogue: {
    goals: ['efficiency', 'data_quality', 'bulk_operations']
    pain_points: ['manual_entry', 'validation_errors', 'slow_uploads']
    context: 'desktop_primary, high_frequency'
  }
  
  Commercial: {  
    goals: ['quick_quotes', 'client_impression', 'conversion']
    pain_points: ['complex_pricing', 'slow_catalog_creation', 'mobile_limitations']
    context: 'desktop + mobile, client_facing'
  }
  
  ClientPro: {
    goals: ['product_info', 'bulk_pricing', 'quick_ordering']  
    pain_points: ['complex_navigation', 'unclear_pricing', 'long_quote_process']
    context: 'mobile_majority, time_constrained'
  }
}
```

## 🎯 Success Metrics Design

### **Usabilité Mesurée**
- **Task Success Rate** : >95% sans assistance
- **Time on Task** : -50% vs outils actuels  
- **Error Rate** : <3% erreurs utilisateur
- **Learning Curve** : <30min autonomie nouvelles features

### **Engagement Business**  
- **Daily Active Usage** : 100% équipe Vérone <30 jours
- **Feature Adoption** : >80% features utilisées régulièrement
- **Mobile Usage** : >40% consultations catalogues  
- **Client Satisfaction** : Score NPS >50 sur catalogues partagés

## 💡 Optimisations UX Types

### **Catalogue Management**
```typescript
// Problème actuel: Interface complexe, multiples clics
// Solution Vérone: Inline editing + bulk actions
<ProductTable>
  <InlineEdit fields={['name', 'price', 'stock']} />
  <BulkActions selection="multiple" />
  <DragDropImages upload="instant" />
  <SmartFilters persistence="session" />
</ProductTable>
```

### **Mobile Experience**
```typescript  
// Problème: Desktop-first, navigation difficile mobile
// Solution: Mobile-first, touch-optimized
<MobileOptimized>
  <SwipeNavigation />
  <TouchFriendlyButtons minSize="44px" />
  <ProgressiveImages loading="lazy" />
  <OfflineCapable essential="true" />
</MobileOptimized>
```

### **Client-Facing Interfaces**
```typescript
// Problème: Catalogues basiques, conversion faible  
// Solution: Expérience premium, conversion optimisée
<PremiumCatalog>
  <FullscreenImages quality="high" />
  <ContextualPricing client="detected" />  
  <OneClickQuote integration="seamless" />
  <BrandedExperience consistency="full" />
</PremiumCatalog>
```

La commande `/design-verone` transforme chaque interface en outil de productivité et de conversion, reflétant l'excellence de la marque Vérone.