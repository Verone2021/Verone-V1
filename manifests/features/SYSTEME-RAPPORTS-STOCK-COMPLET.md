# 📊 Système de Rapports de Stock Complet - Vérone Back Office

**Date**: 2025-10-08
**Type**: Spécification Fonctionnelle
**Priorité**: Haute
**Statut**: Spécification Complète - Prêt pour Implémentation

---

## 🎯 Vue d'Ensemble

Ce document définit le système complet de rapports de stock pour le bouton "Rapports" de la page inventaire, basé sur les meilleures pratiques des ERP leaders du marché (Odoo, ERPNext, SAP).

### Objectifs
- Fournir des insights actionnables sur la santé de l'inventaire
- Optimiser la gestion des stocks et réduire les coûts
- Améliorer la prise de décision data-driven
- Identifier rapidement les problèmes (surstock, ruptures, rotation lente)

---

## 📋 Benchmarking ERP Leaders

### Odoo (Leader Open-Source)
**Points forts identifiés:**
- Classification FSN (Fast/Slow/Non-moving) automatique
- Classification XYZ (valeur de stock)
- Rapports d'aging détaillés avec tranches temporelles
- Dashboards de valorisation en temps réel
- Export PDF/Excel natif
- IA pour prédiction de ruptures (Odoo 18)

### ERPNext (Alternative Moderne)
**Points forts identifiés:**
- Stock Level Report avec métriques avancées (Actual/Planned/Requested/Ordered/Reserved)
- Stock Aging Report pour optimisation espace entrepôt
- Stock Ledger complet (inflow/outflow détaillé)
- Dashboards visuels avec tendances
- Intégration multi-sources (ERP/WMS/POS)

### SAP (Leader Entreprise)
**Points forts identifiés:**
- KPIs standardisés (Turnover Ratio, GMROI)
- Supplier Quality Index
- Rapports configurables avec filtres avancés
- Export haute performance pour gros volumes
- Approche SMART pour sélection KPIs

---

## 📊 Catalogue des Rapports Essentiels

### 1. **Rapport de Valorisation de Stock**

**Objectif**: Vue financière complète de l'inventaire

**Métriques clés:**
- Valeur totale du stock (€)
- Valeur par catégorie
- Valeur par fournisseur
- Coût unitaire moyen
- Méthode de valorisation utilisée (FIFO/AVCO/Standard)

**Visualisations:**
- Graphique en secteurs: Répartition valeur par catégorie
- Graphique en barres: Top 10 produits par valeur
- Tableau détaillé: SKU, quantité, coût unitaire, valeur totale

**Filtres:**
- Période (date snapshot)
- Catégorie produit
- Fournisseur
- Emplacement/entrepôt

**Export:** PDF, Excel, CSV

---

### 2. **Rapport d'Aging Inventaire** ⭐ PRIORITAIRE

**Objectif**: Identifier les stocks anciens et optimiser liquidité

**Structure par tranches:**
```
0-30 jours    | Quantité | Valeur | % du total
31-60 jours   | Quantité | Valeur | % du total
61-90 jours   | Quantité | Valeur | % du total
91-180 jours  | Quantité | Valeur | % du total
180+ jours    | Quantité | Valeur | % du total (⚠️ ALERTE)
```

**Métriques clés:**
- Age moyen du stock (jours)
- % stock > 90 jours (indicateur santé)
- Valeur immobilisée dans stock ancien
- Top 20 articles les plus anciens

**Visualisations:**
- Histogramme empilé: Distribution aging par catégorie
- Heatmap: Produits par âge et valeur
- Ligne temporelle: Évolution aging sur 12 mois

**Alertes automatiques:**
- 🔴 Stock > 180 jours: Action urgente requise
- 🟡 Stock 91-180 jours: Attention requise
- 🟢 Stock < 90 jours: Rotation saine

**Filtres:**
- Catégorie produit
- Fournisseur
- Tranche d'âge spécifique
- Emplacement

**Export:** PDF (rapport exécutif), Excel (données détaillées)

---

### 3. **Rapport de Rotation de Stock (Turnover)**

**Objectif**: Mesurer efficacité de rotation et identifier slow-movers

**Métriques clés:**
- Taux de rotation global (ratio)
- Taux de rotation par catégorie
- Taux de rotation par produit
- Jours de stock disponibles (DSI - Days Sales of Inventory)
- Classification FSN automatique

**Formules de calcul:**
```
Taux de Rotation = COGS (Coût des Ventes) / Stock Moyen
DSI = (Stock Moyen / COGS) × 365
```

**Classification FSN:**
- 🟢 **Fast Moving**: Rotation > 8×/an (Benchmark retail)
- 🟡 **Slow Moving**: Rotation 2-8×/an
- 🔴 **Non Moving**: Rotation < 2×/an ou 0 ventes sur période

**Visualisations:**
- Graphique en barres: Turnover par catégorie vs benchmark industrie
- Scatter plot: Valeur stock vs taux rotation (identifier problèmes)
- Tableau dynamique: Produits classés FSN avec actions recommandées

**Benchmarks industrie:**
- Retail général: 8×/an
- Manufacturing: 6×/an
- Mobilier haut de gamme: 4-6×/an (cible Vérone)

**Filtres:**
- Période d'analyse (30/90/180/365 jours)
- Catégorie
- Classification FSN
- Seuil de rotation personnalisé

**Export:** PDF, Excel

---

### 4. **Rapport de Mouvements de Stock**

**Objectif**: Tracer tous les flux entrants/sortants

**Colonnes détaillées:**
- Date transaction
- Type mouvement (Entrée/Sortie/Transfert/Ajustement/Retour)
- SKU + Description
- Quantité
- Emplacement source/destination
- Utilisateur
- Référence document (BL, facture, etc.)
- Valeur unitaire
- Valeur totale mouvement

**Métriques agrégées:**
- Total entrées période
- Total sorties période
- Stock net (entrées - sorties)
- Nombre de transactions
- Valeur totale mouvements

**Visualisations:**
- Ligne temporelle: Entrées vs Sorties sur période
- Graphique en barres: Mouvements par type
- Heatmap calendrier: Jours avec plus grande activité

**Filtres:**
- Période (date range)
- Type de mouvement
- Produit/Catégorie
- Utilisateur
- Emplacement
- Valeur min/max

**Export:** Excel (détails complets), CSV (intégration externe)

---

### 5. **Rapport de Niveaux de Stock**

**Objectif**: Vue instantanée des quantités disponibles

**Métriques par produit:**
- **Quantité En Main** (On Hand): Stock physique actuel
- **Quantité Libre** (Free to Use): Disponible non réservé
- **Quantité Entrante** (Incoming): Commandes fournisseurs en cours
- **Quantité Sortante** (Outgoing): Commandes clients en cours
- **Stock Virtuel** (Virtual): On Hand + Incoming - Outgoing
- **Quantité Réservée** (Reserved): Pour commandes/production
- **Stock de Sécurité** (Safety Stock): Seuil minimal
- **Point de Réapprovisionnement**: Seuil déclenchement commande

**Alertes intelligentes:**
- 🔴 **Rupture de stock**: On Hand = 0
- 🟡 **Stock faible**: On Hand ≤ Safety Stock
- 🟢 **Stock optimal**: Entre Safety et Max
- 🟠 **Surstock**: On Hand > Max recommandé

**Visualisations:**
- Tableau de bord: Indicateurs colorés par statut
- Graphique en barres: Comparaison On Hand vs Safety Stock
- Liste prioritaire: Actions requises par urgence

**Filtres:**
- Statut alerte
- Catégorie
- Fournisseur
- Emplacement
- Quantité min/max

**Export:** PDF (rapport alerte), Excel

---

### 6. **Rapport Out-of-Stock / Overstock**

**Objectif**: Identifier déséquilibres critiques

**Section Out-of-Stock:**
- Produits en rupture actuellement
- Historique ruptures (nombre occurrences sur période)
- Impact financier (ventes perdues estimées)
- Délai réapprovisionnement attendu
- Demande non satisfaite

**Section Overstock:**
- Produits avec stock excessif (> Max recommandé)
- Excédent en quantité et valeur
- Coût de stockage excédentaire
- Suggestions liquidation/promotion

**Métriques globales:**
- Taux de service (% demande satisfaite)
- % produits en rupture
- % produits en surstock
- Valeur immobilisée en surstock

**Visualisations:**
- Graphique double: Ruptures vs Surstock sur timeline
- Tableau TOP 20: Produits problématiques
- Indicateurs KPI: Taux service, coûts opportunité

**Filtres:**
- Période analyse
- Catégorie
- Seuil surstock (% over max)
- Gravité rupture

**Export:** PDF (rapport exécutif avec recommandations)

---

### 7. **Rapport de Performance Fournisseurs**

**Objectif**: Évaluer fiabilité et qualité fournisseurs

**Métriques par fournisseur:**
- Nombre de commandes passées
- Taux de livraison à temps (%)
- Délai moyen de livraison (jours)
- Taux de conformité qualité (%)
- Valeur totale achats
- Nombre de retours/réclamations
- **Supplier Quality Index** (score agrégé)

**Calcul Supplier Quality Index:**
```
SQI = (Qualité Matériel × 30%) +
      (Livraison à Temps × 25%) +
      (Actions Correctives × 15%) +
      (Réponse Rapide × 15%) +
      (Systèmes Qualité × 15%)
```

**Visualisations:**
- Classement fournisseurs: Score SQI
- Scatter plot: Délai vs Conformité
- Graphique en barres: Volume achats par fournisseur

**Filtres:**
- Période
- Score SQI min
- Catégorie produit
- Volume achats min

**Export:** PDF, Excel

---

### 8. **Rapport de Classification ABC/XYZ**

**Objectif**: Prioriser gestion selon valeur et rotation

**Classification ABC (par valeur):**
- **Classe A**: 80% de la valeur du stock (20% des SKU)
- **Classe B**: 15% de la valeur du stock (30% des SKU)
- **Classe C**: 5% de la valeur du stock (50% des SKU)

**Classification XYZ (par prévisibilité demande):**
- **Classe X**: Demande stable, prévisible
- **Classe Y**: Demande variable, saisonnalité
- **Classe Z**: Demande irrégulière, imprévisible

**Matrice combinée 9 segments:**
```
        X (Stable)    Y (Variable)   Z (Irrégulier)
A (80%)   AX            AY              AZ
B (15%)   BX            BY              BZ
C (5%)    CX            CY              CZ
```

**Stratégies recommandées par segment:**
- **AX**: Surveillance continue, stock optimal
- **AZ**: Stock de sécurité élevé, multiple sources
- **CZ**: Stock minimal, commande à la demande

**Visualisations:**
- Matrice 9 cases: Distribution produits
- Courbe Pareto: Cumul valeur par produit
- Tableau stratégies: Actions par classe

**Filtres:**
- Période analyse
- Classe ABC
- Classe XYZ
- Catégorie

**Export:** PDF (stratégies), Excel

---

## 📈 KPIs et Métriques Transversales

### Métriques Financières
| Métrique | Formule | Cible Vérone | Benchmark |
|----------|---------|--------------|-----------|
| **Valeur Stock Total** | Sum(Quantité × Coût Unitaire) | - | - |
| **GMROI** | Marge Brute / Stock Moyen | >3.0 | 2.5-4.0 |
| **Coût de Possession** | (Stock Moyen × Taux %) / an | <20% | 15-25% |
| **Stock Immobilisé** | Valeur stock > 90j | <15% | <20% |

### Métriques Opérationnelles
| Métrique | Formule | Cible Vérone | Benchmark |
|----------|---------|--------------|-----------|
| **Taux de Rotation** | COGS / Stock Moyen | 5-6× | 4-8× (mobilier) |
| **DSI (Days Sales Inventory)** | (Stock Moyen / COGS) × 365 | 60-73j | 45-90j |
| **Taux de Service** | (Demandes satisfaites / Total demandes) × 100 | >95% | >90% |
| **Taux de Rupture** | (SKU en rupture / Total SKU) × 100 | <5% | <8% |

### Métriques de Qualité
| Métrique | Formule | Cible Vérone | Benchmark |
|----------|---------|--------------|-----------|
| **Précision Inventaire** | (Stock système = Stock physique) / Total | >98% | >95% |
| **Taux Retour Fournisseur** | (Unités retournées / Unités reçues) × 100 | <2% | <3% |
| **Taux Conformité Livraison** | (Livraisons OK / Total livraisons) × 100 | >95% | >90% |

### Métriques Prédictives (Évolution)
| Métrique | Description | Utilité |
|----------|-------------|---------|
| **Prévision Rupture** | IA: Probabilité rupture 30j | Anticipation |
| **Tendance Rotation** | Évolution turnover 3 mois | Ajustement stock |
| **Saisonnalité** | Patterns récurrents demande | Planification |

---

## 🎨 Structure UI/UX Recommandée

### Modal de Rapports (Approche Recommandée)

**Déclencheur**: Bouton "Rapports" dans header page inventaire

**Structure Modal (3 étapes):**

#### Étape 1: Sélection Type de Rapport
```typescript
<ReportSelectionModal>
  <Header>
    <Title>Générer un Rapport de Stock</Title>
    <Subtitle>Sélectionnez le type de rapport souhaité</Subtitle>
  </Header>

  <ReportGrid columns={2}>
    // Cards cliquables par catégorie
    <ReportCard
      icon={TrendingUp}
      title="Valorisation de Stock"
      description="Vue financière complète de l'inventaire"
      badge="Essentiel"
    />
    <ReportCard
      icon={Clock}
      title="Aging Inventaire"
      description="Identifier les stocks anciens"
      badge="Prioritaire"
      highlight
    />
    <ReportCard
      icon={RotateCw}
      title="Rotation de Stock"
      description="Efficacité de rotation et slow-movers"
    />
    <ReportCard
      icon={Activity}
      title="Mouvements de Stock"
      description="Traçabilité des flux entrées/sorties"
    />
    <ReportCard
      icon={AlertTriangle}
      title="Out-of-Stock / Overstock"
      description="Déséquilibres critiques"
    />
    <ReportCard
      icon={BarChart3}
      title="Niveaux de Stock"
      description="Vue instantanée des quantités"
    />
    <ReportCard
      icon={Users}
      title="Performance Fournisseurs"
      description="Évaluation fiabilité et qualité"
    />
    <ReportCard
      icon={Grid3x3}
      title="Classification ABC/XYZ"
      description="Priorisation par valeur et rotation"
    />
  </ReportGrid>
</ReportSelectionModal>
```

#### Étape 2: Configuration Filtres & Paramètres
```typescript
<ReportConfigModal>
  <Header>
    <BackButton />
    <Title>Configuration: Rapport d'Aging Inventaire</Title>
  </Header>

  <Form>
    // Paramètres obligatoires
    <Section title="Période">
      <DateRangePicker
        defaultValue="last-90-days"
        presets={["last-30-days", "last-90-days", "last-year", "custom"]}
      />
    </Section>

    // Filtres optionnels (repliables)
    <Accordion>
      <AccordionItem title="Filtres par Produit">
        <MultiSelect
          label="Catégories"
          options={categories}
          placeholder="Toutes les catégories"
        />
        <Input
          label="Recherche SKU/Nom"
          placeholder="Filtrer par produit..."
        />
      </AccordionItem>

      <AccordionItem title="Filtres par Fournisseur">
        <MultiSelect
          label="Fournisseurs"
          options={suppliers}
        />
      </AccordionItem>

      <AccordionItem title="Filtres par Emplacement">
        <MultiSelect
          label="Entrepôts/Emplacements"
          options={locations}
        />
      </AccordionItem>

      <AccordionItem title="Seuils & Alertes">
        <Slider
          label="Age minimum (jours)"
          min={0}
          max={365}
          defaultValue={90}
        />
        <Checkbox
          label="Afficher uniquement les alertes critiques (>180j)"
        />
      </AccordionItem>
    </Accordion>

    // Options visualisation
    <Section title="Options d'Affichage">
      <RadioGroup
        label="Vue principale"
        options={["Tableau détaillé", "Graphiques", "Vue combinée"]}
        defaultValue="Vue combinée"
      />
      <Checkbox label="Inclure graphiques dans l'export" defaultChecked />
      <Checkbox label="Inclure recommandations d'actions" defaultChecked />
    </Section>
  </Form>

  <Footer>
    <Button variant="outline" onClick={onBack}>Retour</Button>
    <div className="flex gap-2">
      <Button variant="secondary" onClick={onPreview}>
        <Eye /> Aperçu
      </Button>
      <Button onClick={onGenerate}>
        <FileText /> Générer le Rapport
      </Button>
    </div>
  </Footer>
</ReportConfigModal>
```

#### Étape 3: Aperçu & Export
```typescript
<ReportPreviewModal size="full">
  <Header>
    <BackButton />
    <Title>Aperçu: Rapport d'Aging Inventaire</Title>
    <Actions>
      <Button variant="outline" onClick={onEdit}>
        <Settings /> Modifier Paramètres
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Download /> Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => exportPDF()}>
            <FileText /> PDF (Rapport Exécutif)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportExcel()}>
            <FileSpreadsheet /> Excel (Données Détaillées)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportCSV()}>
            <FileCode /> CSV (Intégration Externe)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" onClick={onPrint}>
        <Printer /> Imprimer
      </Button>
    </Actions>
  </Header>

  <Content className="overflow-y-auto">
    // Résumé exécutif
    <ReportSummary>
      <MetricCard
        title="Age Moyen Stock"
        value="47 jours"
        trend="-8%"
        status="good"
      />
      <MetricCard
        title="Stock > 90 jours"
        value="18%"
        trend="+3%"
        status="warning"
      />
      <MetricCard
        title="Valeur Stock Ancien"
        value="127 450 €"
        status="critical"
      />
      <MetricCard
        title="Articles Alertes"
        value="34"
        subtitle="Action requise"
        status="warning"
      />
    </ReportSummary>

    // Visualisations
    <Charts>
      <ChartCard title="Distribution par Âge">
        <StackedBarChart data={agingDistribution} />
      </ChartCard>
      <ChartCard title="Évolution sur 12 Mois">
        <LineChart data={agingTrend} />
      </ChartCard>
    </Charts>

    // Tableau détaillé
    <DataTable
      data={reportData}
      columns={agingColumns}
      sortable
      filterable
      exportable
    />

    // Recommandations automatiques
    <RecommendationsPanel>
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Actions Urgentes (12 produits)</AlertTitle>
        <AlertDescription>
          Stock > 180 jours détecté. Recommandation: Démarquer de 30% ou promotion.
        </AlertDescription>
      </Alert>
      <Alert variant="warning">
        <Info />
        <AlertTitle>Attention Requise (22 produits)</AlertTitle>
        <AlertDescription>
          Stock 91-180 jours. Surveiller demande et envisager actions commerciales.
        </AlertDescription>
      </Alert>
    </RecommendationsPanel>
  </Content>

  <Footer>
    <ReportMetadata>
      Généré le {timestamp} • {totalRecords} enregistrements • Période: {dateRange}
    </ReportMetadata>
  </Footer>
</ReportPreviewModal>
```

### Principes UX Clés

**1. Guidage Progressif**
- Wizard en 3 étapes claires (Sélection → Configuration → Aperçu)
- Possibilité de revenir en arrière à tout moment
- Sauvegarde automatique configuration

**2. Valeurs par Défaut Intelligentes**
- Périodes pré-configurées (30/90/180/365 jours)
- Filtres optionnels repliés par défaut
- Vue "combinée" par défaut (graphiques + tableaux)

**3. Feedback Visuel Constant**
- Indicateurs de statut colorés (🔴🟡🟢)
- Preview avant génération finale
- Estimation nombre enregistrements avant génération

**4. Performance**
- Génération asynchrone avec progress bar
- Export optimisé pour gros volumes (>10k lignes)
- Pagination automatique dans aperçu

**5. Accessibilité**
- Navigation clavier complète
- Labels ARIA sur tous éléments
- Contraste couleurs WCAG AA minimum

---

## 🛠️ Spécifications Techniques d'Implémentation

### Architecture Technique

```typescript
// Structure dossiers
src/
├── app/
│   └── api/
│       └── rapports/
│           ├── generate/
│           │   └── route.ts          // Génération rapports
│           ├── export/
│           │   ├── pdf/
│           │   │   └── route.ts      // Export PDF
│           │   ├── excel/
│           │   │   └── route.ts      // Export Excel
│           │   └── csv/
│           │       └── route.ts      // Export CSV
│           └── [reportType]/
│               └── route.ts          // Endpoints spécifiques
│
├── components/
│   └── rapports/
│       ├── modals/
│       │   ├── report-selection-modal.tsx
│       │   ├── report-config-modal.tsx
│       │   └── report-preview-modal.tsx
│       ├── cards/
│       │   ├── report-card.tsx
│       │   ├── metric-card.tsx
│       │   └── chart-card.tsx
│       ├── forms/
│       │   ├── report-filters.tsx
│       │   └── report-parameters.tsx
│       ├── visualizations/
│       │   ├── aging-chart.tsx
│       │   ├── turnover-chart.tsx
│       │   ├── abc-matrix.tsx
│       │   └── movement-timeline.tsx
│       ├── tables/
│       │   └── report-data-table.tsx
│       └── exports/
│           ├── pdf-generator.tsx
│           ├── excel-generator.tsx
│           └── csv-generator.tsx
│
├── lib/
│   └── rapports/
│       ├── generators/
│       │   ├── aging-report.ts       // Logique Aging
│       │   ├── turnover-report.ts    // Logique Turnover
│       │   ├── valuation-report.ts   // Logique Valorisation
│       │   └── ...                   // Autres rapports
│       ├── calculators/
│       │   ├── kpi-calculator.ts     // Calculs KPIs
│       │   ├── classification.ts     // FSN, ABC, XYZ
│       │   └── metrics.ts           // Métriques transversales
│       ├── exporters/
│       │   ├── pdf-exporter.ts
│       │   ├── excel-exporter.ts
│       │   └── csv-exporter.ts
│       └── types.ts                 // Types TypeScript
│
└── hooks/
    └── use-reports.ts               // Hook React Query
```

### Stack Technologique

**Backend (API Routes Next.js)**
```typescript
// Bibliothèques principales
- PostgreSQL (via Supabase): Storage données
- Prisma / Supabase Client: ORM
- date-fns: Manipulation dates
- decimal.js: Calculs financiers précis
```

**Frontend (React/Next.js)**
```typescript
// UI Components
- shadcn/ui: Components base
- Radix UI: Primitives accessibles
- Tailwind CSS: Styling
- Lucide React: Icons

// Visualisations
- Recharts: Graphiques (recommandé pour Next.js)
- tremor: Dashboard components (alternative)

// Export
- jsPDF: Génération PDF
- xlsx / exceljs: Export Excel
- papaparse: Export CSV

// State Management
- React Query: Server state
- Zustand: Client state (config rapports)
```

### Types TypeScript

```typescript
// lib/rapports/types.ts

// Types de rapports disponibles
export type ReportType =
  | 'valuation'
  | 'aging'
  | 'turnover'
  | 'movements'
  | 'levels'
  | 'out-of-stock'
  | 'supplier-performance'
  | 'abc-xyz';

// Configuration rapport générique
export interface ReportConfig {
  type: ReportType;
  dateRange: {
    from: Date;
    to: Date;
  };
  filters?: {
    categories?: string[];
    suppliers?: string[];
    locations?: string[];
    skus?: string[];
    minValue?: number;
    maxValue?: number;
  };
  options?: {
    includeCharts?: boolean;
    includeRecommendations?: boolean;
    viewMode?: 'table' | 'charts' | 'combined';
    groupBy?: 'category' | 'supplier' | 'location';
  };
}

// Résultat rapport Aging
export interface AgingReportData {
  summary: {
    averageAge: number;
    totalValue: number;
    alertCount: number;
    percentOld: number; // % > 90 jours
  };
  distribution: Array<{
    bucket: '0-30' | '31-60' | '61-90' | '91-180' | '180+';
    quantity: number;
    value: number;
    percentage: number;
    items: number;
  }>;
  topOldestItems: Array<{
    sku: string;
    name: string;
    category: string;
    age: number;
    quantity: number;
    value: number;
    lastSaleDate: Date | null;
    recommendation: 'urgent' | 'attention' | 'monitor';
  }>;
  trends: Array<{
    month: string;
    averageAge: number;
    percentOld: number;
  }>;
}

// Résultat rapport Turnover
export interface TurnoverReportData {
  summary: {
    globalTurnover: number;
    dsi: number;
    fastMovingCount: number;
    slowMovingCount: number;
    nonMovingCount: number;
  };
  byCategory: Array<{
    category: string;
    turnover: number;
    dsi: number;
    classification: 'fast' | 'slow' | 'non';
    benchmark: number;
    variance: number; // % diff vs benchmark
  }>;
  byProduct: Array<{
    sku: string;
    name: string;
    category: string;
    turnover: number;
    salesQty: number;
    avgStock: number;
    cogs: number;
    classification: 'fast' | 'slow' | 'non';
    recommendation: string;
  }>;
}

// Résultat rapport Valorisation
export interface ValuationReportData {
  summary: {
    totalValue: number;
    totalQty: number;
    avgUnitCost: number;
    valuationMethod: 'FIFO' | 'AVCO' | 'STANDARD';
  };
  byCategory: Array<{
    category: string;
    value: number;
    percentage: number;
    itemCount: number;
  }>;
  bySupplier: Array<{
    supplier: string;
    value: number;
    percentage: number;
    itemCount: number;
  }>;
  topItems: Array<{
    sku: string;
    name: string;
    category: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
    percentageOfTotal: number;
  }>;
}

// Format export
export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ExportConfig {
  format: ExportFormat;
  includeCharts?: boolean;
  includeRawData?: boolean;
  filename?: string;
}

// Métriques KPI
export interface KPIMetrics {
  financial: {
    totalStockValue: number;
    gmroi: number;
    carryingCost: number;
    obsoleteStockValue: number;
  };
  operational: {
    turnoverRatio: number;
    dsi: number;
    fillRate: number;
    stockoutRate: number;
  };
  quality: {
    inventoryAccuracy: number;
    supplierReturnRate: number;
    deliveryConformityRate: number;
  };
}
```

### Requêtes SQL Critiques

```sql
-- Rapport Aging: Distribution par tranches
WITH stock_age AS (
  SELECT
    p.id,
    p.sku,
    p.name,
    p.category_id,
    sm.location_id,
    sm.quantity,
    sm.unit_cost,
    sm.quantity * sm.unit_cost AS total_value,
    sm.created_at AS receipt_date,
    CURRENT_DATE - sm.created_at::date AS age_days,
    CASE
      WHEN CURRENT_DATE - sm.created_at::date <= 30 THEN '0-30'
      WHEN CURRENT_DATE - sm.created_at::date <= 60 THEN '31-60'
      WHEN CURRENT_DATE - sm.created_at::date <= 90 THEN '61-90'
      WHEN CURRENT_DATE - sm.created_at::date <= 180 THEN '91-180'
      ELSE '180+'
    END AS age_bucket
  FROM products p
  JOIN stock_movements sm ON p.id = sm.product_id
  WHERE sm.movement_type = 'IN'
    AND sm.quantity > 0
)
SELECT
  age_bucket,
  COUNT(DISTINCT id) AS item_count,
  SUM(quantity) AS total_quantity,
  SUM(total_value) AS total_value,
  ROUND(100.0 * SUM(total_value) / SUM(SUM(total_value)) OVER (), 2) AS percentage
FROM stock_age
GROUP BY age_bucket
ORDER BY
  CASE age_bucket
    WHEN '0-30' THEN 1
    WHEN '31-60' THEN 2
    WHEN '61-90' THEN 3
    WHEN '91-180' THEN 4
    WHEN '180+' THEN 5
  END;

-- Rapport Turnover: Calcul par produit
WITH sales_period AS (
  SELECT
    product_id,
    SUM(quantity) AS total_sold,
    SUM(quantity * unit_cost) AS cogs
  FROM stock_movements
  WHERE movement_type = 'OUT'
    AND created_at >= $1 -- date_from
    AND created_at <= $2 -- date_to
  GROUP BY product_id
),
avg_stock AS (
  SELECT
    product_id,
    AVG(quantity) AS avg_quantity,
    AVG(quantity * unit_cost) AS avg_value
  FROM stock_movements
  WHERE created_at >= $1
    AND created_at <= $2
  GROUP BY product_id
)
SELECT
  p.sku,
  p.name,
  c.name AS category,
  sp.total_sold,
  sp.cogs,
  ast.avg_quantity,
  ast.avg_value,
  CASE
    WHEN ast.avg_value > 0
    THEN ROUND(sp.cogs / ast.avg_value, 2)
    ELSE 0
  END AS turnover_ratio,
  CASE
    WHEN sp.cogs > 0
    THEN ROUND((ast.avg_value / sp.cogs) * 365, 0)
    ELSE NULL
  END AS dsi,
  CASE
    WHEN sp.cogs / NULLIF(ast.avg_value, 0) >= 8 THEN 'fast'
    WHEN sp.cogs / NULLIF(ast.avg_value, 0) >= 2 THEN 'slow'
    ELSE 'non'
  END AS classification
FROM products p
LEFT JOIN sales_period sp ON p.id = sp.product_id
LEFT JOIN avg_stock ast ON p.id = ast.product_id
LEFT JOIN categories c ON p.category_id = c.id
WHERE ast.avg_value > 0
ORDER BY turnover_ratio DESC;

-- Rapport Niveaux: Stock actuel avec alertes
SELECT
  p.id,
  p.sku,
  p.name,
  p.category_id,
  c.name AS category,
  COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) AS on_hand,
  p.safety_stock,
  p.reorder_point,
  p.max_stock,
  CASE
    WHEN COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) = 0
      THEN 'out_of_stock'
    WHEN COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) <= p.safety_stock
      THEN 'low_stock'
    WHEN COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) > p.max_stock
      THEN 'overstock'
    ELSE 'optimal'
  END AS stock_status
FROM products p
LEFT JOIN stock_movements sm ON p.id = sm.product_id
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY p.id, p.sku, p.name, p.category_id, c.name, p.safety_stock, p.reorder_point, p.max_stock
HAVING COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) >= 0
ORDER BY
  CASE
    WHEN COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) = 0 THEN 1
    WHEN COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) <= p.safety_stock THEN 2
    WHEN COALESCE(SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) > p.max_stock THEN 3
    ELSE 4
  END;
```

### API Routes

```typescript
// app/api/rapports/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAgingReport } from '@/lib/rapports/generators/aging-report';
import { generateTurnoverReport } from '@/lib/rapports/generators/turnover-report';
// ... autres générateurs

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse config
    const config: ReportConfig = await request.json();

    // Validation
    if (!config.type || !config.dateRange) {
      return NextResponse.json(
        { error: 'Type de rapport et période requis' },
        { status: 400 }
      );
    }

    // Génération selon type
    let reportData;
    switch (config.type) {
      case 'aging':
        reportData = await generateAgingReport(supabase, config);
        break;
      case 'turnover':
        reportData = await generateTurnoverReport(supabase, config);
        break;
      case 'valuation':
        reportData = await generateValuationReport(supabase, config);
        break;
      // ... autres types
      default:
        return NextResponse.json(
          { error: 'Type de rapport non supporté' },
          { status: 400 }
        );
    }

    // Log génération (audit)
    await supabase.from('report_logs').insert({
      user_id: user.id,
      report_type: config.type,
      filters: config.filters,
      generated_at: new Date().toISOString()
    });

    return NextResponse.json({ data: reportData }, { status: 200 });

  } catch (error) {
    console.error('Erreur génération rapport:', error);
    return NextResponse.json(
      { error: 'Erreur interne serveur' },
      { status: 500 }
    );
  }
}
```

```typescript
// lib/rapports/generators/aging-report.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { ReportConfig, AgingReportData } from '../types';
import { subDays } from 'date-fns';

export async function generateAgingReport(
  supabase: SupabaseClient,
  config: ReportConfig
): Promise<AgingReportData> {

  // 1. Requête distribution par tranches
  const { data: distribution, error: distError } = await supabase.rpc(
    'get_aging_distribution',
    {
      date_from: config.dateRange.from.toISOString(),
      date_to: config.dateRange.to.toISOString(),
      category_filter: config.filters?.categories || null,
      supplier_filter: config.filters?.suppliers || null
    }
  );

  if (distError) throw distError;

  // 2. Requête top articles anciens
  const { data: topOldest, error: topError } = await supabase.rpc(
    'get_oldest_stock_items',
    { limit_count: 20 }
  );

  if (topError) throw topError;

  // 3. Calcul métriques résumé
  const totalValue = distribution.reduce((sum, b) => sum + b.total_value, 0);
  const oldValue = distribution
    .filter(b => ['91-180', '180+'].includes(b.age_bucket))
    .reduce((sum, b) => sum + b.total_value, 0);

  const summary = {
    averageAge: calculateWeightedAverageAge(distribution),
    totalValue,
    alertCount: topOldest.filter(item => item.age_days > 180).length,
    percentOld: (oldValue / totalValue) * 100
  };

  // 4. Tendances historiques (12 derniers mois)
  const trends = await getAgingTrends(supabase, 12);

  // 5. Recommandations automatiques
  const itemsWithRecommendations = topOldest.map(item => ({
    ...item,
    recommendation: getRecommendation(item.age_days)
  }));

  return {
    summary,
    distribution,
    topOldestItems: itemsWithRecommendations,
    trends
  };
}

function calculateWeightedAverageAge(distribution: any[]): number {
  const totalQuantity = distribution.reduce((sum, b) => sum + b.total_quantity, 0);
  const weightedSum = distribution.reduce((sum, b) => {
    const midpoint = getAgeMidpoint(b.age_bucket);
    return sum + (midpoint * b.total_quantity);
  }, 0);
  return Math.round(weightedSum / totalQuantity);
}

function getAgeMidpoint(bucket: string): number {
  const map: Record<string, number> = {
    '0-30': 15,
    '31-60': 45,
    '61-90': 75,
    '91-180': 135,
    '180+': 270 // Estimation conservatrice
  };
  return map[bucket] || 0;
}

function getRecommendation(ageDays: number): 'urgent' | 'attention' | 'monitor' {
  if (ageDays > 180) return 'urgent';
  if (ageDays > 90) return 'attention';
  return 'monitor';
}

async function getAgingTrends(supabase: SupabaseClient, months: number) {
  // Implémentation requête tendances...
  return [];
}
```

### Hook React Query

```typescript
// hooks/use-reports.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { ReportConfig, ExportConfig } from '@/lib/rapports/types';

export function useGenerateReport() {
  return useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await fetch('/api/rapports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur génération rapport');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Rapport généré avec succès:', data);
    },
    onError: (error) => {
      console.error('Erreur génération:', error);
    }
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: async ({
      reportData,
      exportConfig
    }: {
      reportData: any;
      exportConfig: ExportConfig;
    }) => {
      const response = await fetch(`/api/rapports/export/${exportConfig.format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData, config: exportConfig })
      });

      if (!response.ok) {
        throw new Error('Erreur export rapport');
      }

      // Téléchargement fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportConfig.filename || `rapport.${exportConfig.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });
}
```

---

## 📦 Formats d'Export Détaillés

### Export PDF

**Bibliothèque**: jsPDF + jsPDF-AutoTable

**Caractéristiques:**
- Format A4 portrait/paysage selon contenu
- Header: Logo Vérone + Titre rapport + Date génération
- Footer: Pagination + Metadata (période, filtres)
- Graphiques intégrés (PNG/SVG via canvas)
- Tables formatées avec alternance lignes
- Alertes colorées (rouge/jaune/vert)
- Résumé exécutif en première page
- Table des matières pour rapports longs

**Structure PDF:**
```
Page 1: Résumé Exécutif
  - KPIs principaux (cards visuelles)
  - Graphique synthèse
  - Recommandations prioritaires

Page 2+: Détails
  - Graphiques détaillés
  - Tables de données
  - Analyses par section

Dernière Page: Annexes
  - Méthodologie calcul
  - Glossaire métriques
  - Notes
```

**Code exemple:**
```typescript
// lib/rapports/exporters/pdf-exporter.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function exportAgingReportToPDF(
  reportData: AgingReportData,
  config: ExportConfig
) {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Header
  pdf.setFontSize(20);
  pdf.text('Rapport d\'Aging Inventaire', 20, 20);
  pdf.setFontSize(10);
  pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 28);

  // Résumé KPIs
  let yPos = 40;
  pdf.setFontSize(14);
  pdf.text('Résumé Exécutif', 20, yPos);

  yPos += 10;
  pdf.setFontSize(11);
  pdf.text(`Age Moyen: ${reportData.summary.averageAge} jours`, 20, yPos);
  yPos += 7;
  pdf.text(`Stock > 90j: ${reportData.summary.percentOld.toFixed(1)}%`, 20, yPos);
  yPos += 7;
  pdf.text(`Valeur Totale: ${formatCurrency(reportData.summary.totalValue)}`, 20, yPos);

  // Table distribution
  yPos += 15;
  autoTable(pdf, {
    startY: yPos,
    head: [['Tranche', 'Quantité', 'Valeur', '% Total']],
    body: reportData.distribution.map(row => [
      row.bucket,
      row.quantity,
      formatCurrency(row.value),
      `${row.percentage.toFixed(1)}%`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0] },
    styles: { fontSize: 9 }
  });

  // Nouvelle page pour top items
  pdf.addPage();
  pdf.setFontSize(14);
  pdf.text('Top 20 Articles les Plus Anciens', 20, 20);

  autoTable(pdf, {
    startY: 30,
    head: [['SKU', 'Produit', 'Age (j)', 'Quantité', 'Valeur', 'Action']],
    body: reportData.topOldestItems.map(item => [
      item.sku,
      item.name.substring(0, 30),
      item.age,
      item.quantity,
      formatCurrency(item.value),
      getRecommendationLabel(item.recommendation)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0] },
    styles: { fontSize: 8 },
    didParseCell: (data) => {
      // Colorier selon recommandation
      if (data.column.index === 5 && data.section === 'body') {
        const recommendation = reportData.topOldestItems[data.row.index].recommendation;
        if (recommendation === 'urgent') {
          data.cell.styles.textColor = [220, 38, 38]; // red
        } else if (recommendation === 'attention') {
          data.cell.styles.textColor = [234, 179, 8]; // yellow
        }
      }
    }
  });

  // Footer sur chaque page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(
      `Page ${i} sur ${pageCount} • Vérone Back Office`,
      pdf.internal.pageSize.getWidth() / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Sauvegarde
  pdf.save(config.filename || `rapport-aging-${Date.now()}.pdf`);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function getRecommendationLabel(rec: string): string {
  const labels: Record<string, string> = {
    urgent: '🔴 Urgent',
    attention: '🟡 Attention',
    monitor: '🟢 Surveiller'
  };
  return labels[rec] || rec;
}
```

### Export Excel

**Bibliothèque**: exceljs

**Caractéristiques:**
- Feuilles multiples par section (Summary, Distribution, Details, Trends)
- Formatage cellules (couleurs, bordures, alignement)
- Formules Excel natives pour calculs
- Graphiques Excel intégrés
- Colonnes auto-ajustées
- Filtres automatiques sur headers
- Freeze panes pour headers
- Mise en forme conditionnelle (alertes colorées)

**Structure Excel:**
```
Onglet "Résumé":
  - KPIs en haut (formatés comme cards)
  - Mini-graphiques sparklines
  - Recommandations prioritaires

Onglet "Distribution":
  - Table pivot prête
  - Graphique en barres empilées
  - Filtres par catégorie/fournisseur

Onglet "Détails":
  - Tous les produits avec métriques
  - Colonnes calculées avec formules
  - Mise en forme conditionnelle

Onglet "Tendances":
  - Données historiques
  - Graphique ligne évolution
```

**Code exemple:**
```typescript
// lib/rapports/exporters/excel-exporter.ts
import ExcelJS from 'exceljs';

export async function exportAgingReportToExcel(
  reportData: AgingReportData,
  config: ExportConfig
) {
  const workbook = new ExcelJS.Workbook();

  // Onglet Résumé
  const summarySheet = workbook.addWorksheet('Résumé');
  summarySheet.columns = [
    { header: 'Métrique', key: 'metric', width: 30 },
    { header: 'Valeur', key: 'value', width: 20 }
  ];

  summarySheet.addRows([
    { metric: 'Age Moyen Stock', value: `${reportData.summary.averageAge} jours` },
    { metric: 'Stock > 90 jours', value: `${reportData.summary.percentOld.toFixed(1)}%` },
    { metric: 'Valeur Totale', value: reportData.summary.totalValue },
    { metric: 'Articles en Alerte', value: reportData.summary.alertCount }
  ]);

  // Formatage
  summarySheet.getRow(1).font = { bold: true, size: 12 };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF000000' }
  };
  summarySheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Onglet Distribution
  const distSheet = workbook.addWorksheet('Distribution');
  distSheet.columns = [
    { header: 'Tranche d\'Age', key: 'bucket', width: 15 },
    { header: 'Quantité', key: 'quantity', width: 12 },
    { header: 'Valeur (€)', key: 'value', width: 15 },
    { header: '% Total', key: 'percentage', width: 12 }
  ];

  reportData.distribution.forEach(row => {
    distSheet.addRow({
      bucket: row.bucket,
      quantity: row.quantity,
      value: row.value,
      percentage: row.percentage / 100
    });
  });

  // Format header
  distSheet.getRow(1).font = { bold: true };
  distSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF000000' }
  };
  distSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Format colonnes
  distSheet.getColumn('value').numFmt = '#,##0.00 €';
  distSheet.getColumn('percentage').numFmt = '0.0%';

  // Filtres automatiques
  distSheet.autoFilter = 'A1:D1';

  // Onglet Détails
  const detailsSheet = workbook.addWorksheet('Détails Produits');
  detailsSheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Produit', key: 'name', width: 35 },
    { header: 'Catégorie', key: 'category', width: 20 },
    { header: 'Age (jours)', key: 'age', width: 12 },
    { header: 'Quantité', key: 'quantity', width: 12 },
    { header: 'Valeur (€)', key: 'value', width: 15 },
    { header: 'Recommandation', key: 'recommendation', width: 15 }
  ];

  reportData.topOldestItems.forEach(item => {
    detailsSheet.addRow({
      sku: item.sku,
      name: item.name,
      category: item.category,
      age: item.age,
      quantity: item.quantity,
      value: item.value,
      recommendation: getRecommendationLabel(item.recommendation)
    });
  });

  // Header formatting
  detailsSheet.getRow(1).font = { bold: true };
  detailsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF000000' }
  };
  detailsSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Mise en forme conditionnelle (colorer recommandations)
  detailsSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const recommendation = row.getCell('recommendation').value as string;
      if (recommendation?.includes('🔴')) {
        row.getCell('recommendation').font = { color: { argb: 'FFDC2626' }, bold: true };
      } else if (recommendation?.includes('🟡')) {
        row.getCell('recommendation').font = { color: { argb: 'FFEAB308' }, bold: true };
      }
    }
  });

  // Freeze panes
  detailsSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  // Auto-filtres
  detailsSheet.autoFilter = {
    from: 'A1',
    to: 'G1'
  };

  // Génération buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Téléchargement
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = config.filename || `rapport-aging-${Date.now()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
```

### Export CSV

**Bibliothèque**: papaparse

**Caractéristiques:**
- Format UTF-8 avec BOM (compatibilité Excel français)
- Séparateur point-virgule (;) pour Excel FR
- Headers en français
- Pas de formatage (données brutes)
- Idéal pour imports externes ou traitement Python/R
- Taille fichier minimale

**Code exemple:**
```typescript
// lib/rapports/exporters/csv-exporter.ts
import Papa from 'papaparse';

export function exportAgingReportToCSV(
  reportData: AgingReportData,
  config: ExportConfig
) {
  // Flatten data pour CSV
  const csvData = reportData.topOldestItems.map(item => ({
    'SKU': item.sku,
    'Produit': item.name,
    'Catégorie': item.category,
    'Age (jours)': item.age,
    'Quantité': item.quantity,
    'Valeur Unitaire': item.value / item.quantity,
    'Valeur Totale': item.value,
    'Dernière Vente': item.lastSaleDate?.toLocaleDateString('fr-FR') || 'Jamais',
    'Recommandation': item.recommendation
  }));

  // Génération CSV avec papaparse
  const csv = Papa.unparse(csvData, {
    delimiter: ';', // Excel FR
    header: true,
    quotes: true // Toujours encapsuler strings
  });

  // Ajout BOM pour UTF-8 (Excel FR)
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csv;

  // Téléchargement
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = config.filename || `rapport-aging-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
```

---

## 🎯 Roadmap d'Implémentation

### Phase 1: Foundation (Semaine 1-2) ⭐ PRIORITAIRE

**Objectif**: Infrastructure de base + 1er rapport fonctionnel

**Tâches:**
1. ✅ Créer structure dossiers (`components/rapports`, `lib/rapports`, `app/api/rapports`)
2. ✅ Définir types TypeScript complets (`lib/rapports/types.ts`)
3. ✅ Créer composants UI base:
   - Modal sélection rapport
   - Modal configuration filtres
   - Modal aperçu
4. ✅ Implémenter **Rapport Aging** complet (1er rapport)
   - Générateur backend
   - Requêtes SQL
   - API route
   - UI complète
   - Export PDF/Excel/CSV
5. ✅ Hook React Query `useGenerateReport`
6. ✅ Tests manuels Rapport Aging

**Livrables:**
- ✅ Bouton "Rapports" fonctionnel sur page inventaire
- ✅ Rapport Aging générable et exportable
- ✅ Documentation technique complète

---

### Phase 2: Rapports Essentiels (Semaine 3-4)

**Objectif**: Ajouter 3 rapports critiques

**Tâches:**
1. ✅ **Rapport Rotation de Stock (Turnover)**
   - Générateur avec classification FSN
   - Calculs turnover ratio + DSI
   - Visualisations (scatter plot, barres)
   - Exports

2. ✅ **Rapport Niveaux de Stock**
   - Calcul On Hand, Free to Use, Virtual
   - Système alertes (rupture, faible, surstock)
   - Dashboard indicateurs colorés
   - Exports

3. ✅ **Rapport Valorisation de Stock**
   - Calculs valorisation (FIFO/AVCO/Standard)
   - Breakdown par catégorie/fournisseur
   - Graphiques secteurs + top items
   - Exports

**Livrables:**
- ✅ 4 rapports fonctionnels au total
- ✅ Tests utilisateurs internes

---

### Phase 3: Rapports Avancés (Semaine 5-6)

**Objectif**: Compléter catalogue avec rapports avancés

**Tâches:**
1. ✅ **Rapport Mouvements de Stock**
   - Traçabilité complète (IN/OUT/TRANSFER/ADJUST)
   - Timeline interactive
   - Filtres avancés (utilisateur, document ref)

2. ✅ **Rapport Out-of-Stock / Overstock**
   - Sections ruptures + surstock
   - Calculs impact financier
   - Recommandations automatiques

3. ✅ **Rapport Performance Fournisseurs**
   - Supplier Quality Index
   - Métriques livraison + qualité
   - Classement fournisseurs

4. ✅ **Rapport Classification ABC/XYZ**
   - Matrice 9 segments
   - Courbe Pareto
   - Stratégies automatiques par classe

**Livrables:**
- ✅ 8 rapports complets disponibles
- ✅ Système complet opérationnel

---

### Phase 4: Optimisations & IA (Semaine 7-8)

**Objectif**: Performance + fonctionnalités intelligentes

**Tâches:**
1. ✅ **Optimisations Performance**
   - Caching rapports fréquents (Redis/Upstash)
   - Génération asynchrone avec queues (BullMQ)
   - Pagination serveur pour gros volumes
   - Indexes SQL optimisés

2. ✅ **Fonctionnalités IA** (inspiré Odoo 18)
   - Prédiction ruptures de stock (ML model)
   - Détection anomalies mouvements
   - Recommandations réapprovisionnement intelligentes
   - Classification automatique FSN/ABC/XYZ

3. ✅ **Dashboards Interactifs**
   - Drill-down depuis résumés vers détails
   - Filtres dynamiques temps réel
   - Comparaisons périodes (YoY, MoM)

4. ✅ **Rapports Planifiés**
   - Génération automatique hebdomadaire/mensuelle
   - Envoi email automatique
   - Sauvegarde historique rapports

**Livrables:**
- ✅ Système haute performance
- ✅ Fonctionnalités prédictives actives
- ✅ Automatisation complète

---

## 📐 Migrations Supabase Requises

### Nouvelles Tables

```sql
-- Table logs génération rapports (audit)
CREATE TABLE report_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  report_type TEXT NOT NULL,
  filters JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  execution_time_ms INTEGER,
  record_count INTEGER
);

CREATE INDEX idx_report_logs_user_id ON report_logs(user_id);
CREATE INDEX idx_report_logs_type ON report_logs(report_type);
CREATE INDEX idx_report_logs_generated_at ON report_logs(generated_at DESC);

-- Table rapports sauvegardés (pour planification)
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  config JSONB NOT NULL,
  schedule TEXT, -- cron expression: '0 9 * * 1' (chaque lundi 9h)
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_reports_user_id ON saved_reports(user_id);
CREATE INDEX idx_saved_reports_schedule ON saved_reports(schedule) WHERE schedule IS NOT NULL;

-- Table historique rapports générés
CREATE TABLE report_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_report_id UUID REFERENCES saved_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  report_type TEXT NOT NULL,
  data JSONB NOT NULL,
  file_url TEXT, -- Stockage Supabase Storage si PDF/Excel persisté
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_archives_saved_report_id ON report_archives(saved_report_id);
CREATE INDEX idx_report_archives_generated_at ON report_archives(generated_at DESC);
```

### Fonctions SQL Réutilisables

```sql
-- Fonction: Distribution Aging
CREATE OR REPLACE FUNCTION get_aging_distribution(
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  category_filter TEXT[] DEFAULT NULL,
  supplier_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  age_bucket TEXT,
  item_count BIGINT,
  total_quantity NUMERIC,
  total_value NUMERIC,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stock_age AS (
    SELECT
      p.id,
      sm.quantity,
      sm.quantity * sm.unit_cost AS value,
      CURRENT_DATE - sm.created_at::date AS age_days,
      CASE
        WHEN CURRENT_DATE - sm.created_at::date <= 30 THEN '0-30'
        WHEN CURRENT_DATE - sm.created_at::date <= 60 THEN '31-60'
        WHEN CURRENT_DATE - sm.created_at::date <= 90 THEN '61-90'
        WHEN CURRENT_DATE - sm.created_at::date <= 180 THEN '91-180'
        ELSE '180+'
      END AS bucket
    FROM products p
    JOIN stock_movements sm ON p.id = sm.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE sm.movement_type = 'IN'
      AND sm.created_at >= date_from
      AND sm.created_at <= date_to
      AND (category_filter IS NULL OR c.name = ANY(category_filter))
      AND (supplier_filter IS NULL OR s.name = ANY(supplier_filter))
  )
  SELECT
    bucket AS age_bucket,
    COUNT(DISTINCT id)::BIGINT AS item_count,
    SUM(quantity)::NUMERIC AS total_quantity,
    SUM(value)::NUMERIC AS total_value,
    ROUND(100.0 * SUM(value) / SUM(SUM(value)) OVER (), 2)::NUMERIC AS percentage
  FROM stock_age
  GROUP BY bucket
  ORDER BY
    CASE bucket
      WHEN '0-30' THEN 1
      WHEN '31-60' THEN 2
      WHEN '61-90' THEN 3
      WHEN '91-180' THEN 4
      WHEN '180+' THEN 5
    END;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Top articles anciens
CREATE OR REPLACE FUNCTION get_oldest_stock_items(
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  sku TEXT,
  name TEXT,
  category TEXT,
  age_days INTEGER,
  quantity NUMERIC,
  value NUMERIC,
  last_sale_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.sku,
    p.name,
    c.name AS category,
    (CURRENT_DATE - MIN(sm_in.created_at)::date)::INTEGER AS age_days,
    SUM(CASE WHEN sm_all.movement_type = 'IN' THEN sm_all.quantity ELSE -sm_all.quantity END)::NUMERIC AS quantity,
    SUM(CASE WHEN sm_all.movement_type = 'IN' THEN sm_all.quantity * sm_all.unit_cost ELSE 0 END)::NUMERIC AS value,
    MAX(CASE WHEN sm_out.movement_type = 'OUT' THEN sm_out.created_at END) AS last_sale_date
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN stock_movements sm_in ON p.id = sm_in.product_id AND sm_in.movement_type = 'IN'
  LEFT JOIN stock_movements sm_all ON p.id = sm_all.product_id
  LEFT JOIN stock_movements sm_out ON p.id = sm_out.product_id AND sm_out.movement_type = 'OUT'
  GROUP BY p.id, p.sku, p.name, c.name
  HAVING SUM(CASE WHEN sm_all.movement_type = 'IN' THEN sm_all.quantity ELSE -sm_all.quantity END) > 0
  ORDER BY age_days DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 Plan de Tests

### Tests Unitaires

```typescript
// __tests__/lib/rapports/calculators/kpi-calculator.test.ts
import { calculateTurnoverRatio, calculateDSI, classifyFSN } from '@/lib/rapports/calculators/kpi-calculator';

describe('KPI Calculator', () => {
  describe('calculateTurnoverRatio', () => {
    it('calcule correctement le ratio de rotation', () => {
      const cogs = 100000;
      const avgStock = 20000;
      expect(calculateTurnoverRatio(cogs, avgStock)).toBe(5);
    });

    it('retourne 0 si stock moyen est 0', () => {
      expect(calculateTurnoverRatio(100000, 0)).toBe(0);
    });
  });

  describe('calculateDSI', () => {
    it('calcule correctement les jours de stock', () => {
      const avgStock = 20000;
      const cogs = 100000;
      expect(calculateDSI(avgStock, cogs)).toBe(73); // (20000 / 100000) * 365
    });
  });

  describe('classifyFSN', () => {
    it('classe correctement Fast Moving', () => {
      expect(classifyFSN(10)).toBe('fast'); // > 8
    });

    it('classe correctement Slow Moving', () => {
      expect(classifyFSN(5)).toBe('slow'); // 2-8
    });

    it('classe correctement Non Moving', () => {
      expect(classifyFSN(1)).toBe('non'); // < 2
    });
  });
});
```

### Tests d'Intégration

```typescript
// __tests__/app/api/rapports/generate/route.test.ts
import { POST } from '@/app/api/rapports/generate/route';
import { createMocks } from 'node-mocks-http';

describe('/api/rapports/generate', () => {
  it('génère rapport aging avec succès', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        type: 'aging',
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31')
        }
      }
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveProperty('summary');
    expect(data.data).toHaveProperty('distribution');
    expect(data.data.distribution).toBeInstanceOf(Array);
  });

  it('retourne 400 si type manquant', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        dateRange: {
          from: new Date(),
          to: new Date()
        }
      }
    });

    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });
});
```

### Tests E2E (Playwright MCP)

```bash
# Scénario complet: Génération + Export Rapport Aging
1. Navigate to /stocks/inventaire
2. Click "Rapports" button
3. Select "Aging Inventaire" card
4. Configure filters (date range: last 90 days)
5. Click "Générer le Rapport"
6. Verify preview modal opens
7. Verify summary metrics displayed
8. Verify chart rendered
9. Click "Exporter" > "PDF"
10. Verify download triggered
11. Check console errors (should be 0)
12. Screenshot final preview
```

---

## 🎓 Glossaire Métrique

| Terme | Définition | Formule |
|-------|------------|---------|
| **COGS** | Cost of Goods Sold - Coût des marchandises vendues | Sum(Quantité vendue × Coût unitaire) |
| **DSI** | Days Sales of Inventory - Jours de stock disponibles | (Stock Moyen / COGS) × 365 |
| **GMROI** | Gross Margin Return On Investment - Retour sur investissement marge brute | Marge Brute / Stock Moyen |
| **FSN** | Fast/Slow/Non-moving - Classification vitesse rotation | Based on turnover ratio |
| **ABC** | Classification Pareto par valeur | A=80% valeur, B=15%, C=5% |
| **XYZ** | Classification par prévisibilité demande | X=stable, Y=variable, Z=irrégulier |
| **SQI** | Supplier Quality Index - Indice qualité fournisseur | Weighted average of quality metrics |
| **Turnover Ratio** | Taux de rotation stock | COGS / Stock Moyen |
| **Fill Rate** | Taux de service - % demandes satisfaites | (Demandes OK / Total demandes) × 100 |
| **Stockout Rate** | Taux de rupture | (SKU en rupture / Total SKU) × 100 |
| **Carrying Cost** | Coût de possession stock | Stock Moyen × Taux % annuel |

---

## ✅ Checklist Validation Finale

**Avant mise en production, vérifier:**

- [ ] Les 8 rapports essentiels sont fonctionnels
- [ ] Exports PDF/Excel/CSV testés pour chaque rapport
- [ ] Filtres et paramètres fonctionnent correctement
- [ ] Graphiques s'affichent sans erreurs
- [ ] Calculs KPIs validés par contrôle manuel
- [ ] Performance acceptable (<5s génération rapports standards)
- [ ] UI responsive (desktop + tablet minimum)
- [ ] Accessibilité WCAG AA validée
- [ ] Tests E2E passent (0 erreur console)
- [ ] Documentation utilisateur créée
- [ ] Migration Supabase appliquée en production
- [ ] Logs audit fonctionnels
- [ ] Permissions RLS configurées (users voient uniquement leurs rapports)

---

## 📚 Ressources Complémentaires

**Documentation ERP:**
- [Odoo Inventory Reports](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/warehouses_storage/reporting/)
- [ERPNext Stock Reports](https://docs.erpnext.com/docs/user/manual/en/stock)
- [SAP Inventory Management](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/91b21005dded4984bcccf4a69ae1300c/5863bd534f22b44ce10000000a174cb4.html)

**Bibliothèques Techniques:**
- [Recharts Documentation](https://recharts.org/en-US/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [shadcn/ui Components](https://ui.shadcn.com/)

**Articles Expertise:**
- [NetSuite: Inventory KPIs](https://www.netsuite.com/portal/resource/articles/inventory-management/inventory-management-kpis-metrics.shtml)
- [MRPeasy: Inventory Management KPIs](https://www.mrpeasy.com/blog/inventory-management-kpis/)

---

## 🎯 Conclusion

Ce système de rapports complet positionne Vérone Back Office au niveau des ERP leaders du marché (Odoo, ERPNext, SAP) en termes de capacités analytiques et de prise de décision data-driven.

**Points forts du système:**
- ✅ 8 rapports essentiels couvrant tous les besoins métier
- ✅ KPIs standardisés alignés sur meilleures pratiques industrie
- ✅ UI/UX moderne et intuitive (workflow 3 étapes guidé)
- ✅ Exports professionnels (PDF exécutif, Excel analysable, CSV intégrable)
- ✅ Performance optimisée pour croissance future
- ✅ Extensible facilement (nouveaux rapports, IA prédictive)

**Impact business attendu:**
- Réduction 30% stock ancien (via Aging Report + actions)
- Amélioration 20% rotation stock (via Turnover analytics)
- Diminution 50% ruptures de stock (via Levels + alertes)
- Économie 15% coûts stockage (via optimisation niveaux)

**Prochaines étapes immédiates:**
1. Valider spécifications avec équipe métier
2. Lancer Phase 1 (Foundation + Rapport Aging)
3. Itérer selon feedback utilisateurs
4. Déployer progressivement autres rapports (Phases 2-4)

---

**Document vivant**: Ce document sera mis à jour au fil de l'implémentation avec retours d'expérience, ajustements techniques et nouvelles fonctionnalités identifiées.

**Dernière mise à jour**: 2025-10-08
**Prochaine révision**: Après Phase 1 (Semaine 2)
