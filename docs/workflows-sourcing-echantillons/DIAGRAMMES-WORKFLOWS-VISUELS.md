# 📊 DIAGRAMMES WORKFLOWS - VISUALISATION COMPLÈTE

**Tous les workflows en format Mermaid**

---

## 🎯 1. MACHINE À ÉTATS SOURCING PRINCIPAL

```mermaid
stateDiagram-v2
    [*] --> sourcing : Création produit

    sourcing --> echantillon_a_commander : requires_sample = true
    sourcing --> pret_a_commander : requires_sample = false

    pret_a_commander --> in_stock : first order OR stock > 0
    echantillon_a_commander --> in_stock : sample validated & order placed

    in_stock --> [*] : Produit actif catalogue
```

**Légende :**
- `sourcing` : État initial après création
- `echantillon_a_commander` : Échantillon requis avant commande
- `pret_a_commander` : Prêt à commander (pas d'échantillon)
- `in_stock` : Produit actif dans catalogue

---

## 🔄 2. WORKFLOW ÉCHANTILLONS CONDITIONNEL

```mermaid
stateDiagram-v2
    [*] --> sourcing_validated : Validation sourcing initiale

    sourcing_validated --> direct_catalog : requires_sample = false
    sourcing_validated --> request_pending : requires_sample = true

    request_pending --> approved_request : Manager approves
    request_pending --> rejected : Manager rejects

    approved_request --> ordered : Commande fournisseur
    ordered --> delivered : Réception échantillon
    delivered --> sample_approved : Qualité OK
    delivered --> sample_rejected : Qualité KO

    sample_approved --> product_created : Ajout catalogue
    sample_rejected --> sourcing_validated : Retour sourcing
    rejected --> [*] : Archivage

    direct_catalog --> product_created
    product_created --> [*] : Produit actif
```

**Légende :**
- `sourcing_validated` : Sourcing validé, décision échantillon
- `request_pending` : Demande approbation manager
- `ordered` : Échantillon commandé chez fournisseur
- `delivered` : Échantillon reçu
- `sample_approved` : Validation qualité OK
- `product_created` : Produit ajouté au catalogue

---

## 📦 3. WORKFLOW CRÉATION PRODUIT SOURCING

```mermaid
flowchart TD
    Start([Utilisateur clique 'Nouveau Sourcing']) --> Form[Formulaire Sourcing Rapide]

    Form --> Input1[Nom produit obligatoire]
    Form --> Input2[URL fournisseur obligatoire]
    Form --> Input3[Image facultative]
    Form --> Input4[Client assigné optionnel]

    Input1 & Input2 & Input3 & Input4 --> Validate{Validation frontend}

    Validate -->|Erreur| Error[Afficher erreurs]
    Error --> Form

    Validate -->|OK| DetectType{Client assigné?}

    DetectType -->|Oui| TypeClient[sourcing_type = 'client']
    DetectType -->|Non| TypeInterne[sourcing_type = 'interne']

    TypeClient & TypeInterne --> CreateDraft[Créer product_draft]

    CreateDraft --> LinkImage{Image uploadée?}

    LinkImage -->|Oui| UploadImage[Upload Supabase Storage]
    LinkImage -->|Non| Skip[Passer]

    UploadImage --> LinkToDraft[Lier image à draft]
    Skip --> Success
    LinkToDraft --> Success[✅ Produit créé]

    Success --> Redirect[Redirection /sourcing/produits]
    Redirect --> End([Dashboard mis à jour])
```

---

## ✅ 4. WORKFLOW VALIDATION PRODUIT → CATALOGUE

```mermaid
flowchart TD
    Start([Utilisateur clique 'Valider']) --> CheckSupplier{supplier_id présent?}

    CheckSupplier -->|Non| ErrorSupplier[❌ Erreur: Fournisseur obligatoire]
    ErrorSupplier --> EditProduct[Éditer produit]
    EditProduct --> AddSupplier[Ajouter fournisseur]
    AddSupplier --> Start

    CheckSupplier -->|Oui| CheckSample{requires_sample?}

    CheckSample -->|true| CheckSampleStatus{sample_status = 'validated'?}
    CheckSampleStatus -->|Non| ErrorSample[❌ Erreur: Échantillon non validé]
    ErrorSample --> WaitSample[Attendre validation échantillon]

    CheckSampleStatus -->|Oui| CalculateStatus
    CheckSample -->|false| CalculateStatus[Calculer nouveau statut]

    CalculateStatus --> CreateProduct[Créer produit catalogue]

    CreateProduct --> MigrateImages[Migrer images]
    MigrateImages --> DeleteDraft[Supprimer product_draft]

    DeleteDraft --> UpdateDashboard[Mettre à jour Dashboard]
    UpdateDashboard --> Success[✅ Produit ajouté catalogue]

    Success --> End([Redirection /catalogue/products])
```

---

## 🏭 5. TRIGGERS AUTOMATIQUES STOCK

```mermaid
flowchart TD
    Start([Commande fournisseur confirmée]) --> Trigger[Trigger: update_sourcing_status]

    Trigger --> GetProducts[Récupérer produits sourcing de la commande]

    GetProducts --> Loop{Pour chaque produit}

    Loop --> CalcStatus[Calculer nouveau statut via fonction SQL]

    CalcStatus --> CheckChange{Statut changé?}

    CheckChange -->|Non| Loop
    CheckChange -->|Oui| UpdateProduct[UPDATE products SET status = new_status]

    UpdateProduct --> LogTransition[LOG transition dans logs]

    LogTransition --> Loop

    Loop -->|Fini| Notify[Notifications automatiques]
    Notify --> End([Workflow terminé])
```

---

## 📊 6. DASHBOARD SOURCING - CALCUL KPIS

```mermaid
flowchart TD
    Start([Chargement Dashboard]) --> FetchProducts[Requête products WHERE creation_mode = 'sourcing']

    FetchProducts --> CountDrafts[COUNT status = 'sourcing']
    FetchProducts --> CountValidation[COUNT status IN échantillon/prêt]
    FetchProducts --> CountSamples[COUNT requires_sample = true]
    FetchProducts --> CountCompleted[COUNT validated ce mois]

    CountDrafts --> KPI1[📊 Brouillons Actifs]
    CountValidation --> KPI2[📊 En Validation]
    CountSamples --> KPI3[📊 Échantillons]
    CountCompleted --> KPI4[📊 Complétés]

    KPI1 & KPI2 & KPI3 & KPI4 --> DisplayDashboard[Afficher Dashboard]

    FetchProducts --> FilterRecent[4 derniers produits]
    FilterRecent --> ActivitySection[Section Activité Récente]

    FetchProducts --> CalcActions[Calcul Prochaines Actions]
    CalcActions --> ActionPending[Produits en attente validation]
    CalcActions --> ActionSamples[Échantillons commandés]
    CalcActions --> ActionClients[Demandes clients]

    ActivitySection & ActionPending & ActionSamples & ActionClients --> DisplayDashboard

    DisplayDashboard --> End([Dashboard 100% données réelles])
```

---

## 🔍 7. WORKFLOW TESTS MANUELS (15 MIN)

```mermaid
flowchart TD
    Start([Démarrer Tests]) --> Phase1[Phase 1: Dashboard Vide 2min]

    Phase1 --> Check1{KPIs = 0?}
    Check1 -->|Non| Fix1[❌ Données mockées détectées]
    Check1 -->|Oui| Phase2[Phase 2: Création SANS Image 3min]

    Phase2 --> Create[Remplir formulaire sans image]
    Create --> Submit[Enregistrer]
    Submit --> Check2{Produit créé?}

    Check2 -->|Non| Fix2[❌ Erreur validation]
    Check2 -->|Oui| Phase3[Phase 3: Dashboard Mis à Jour 2min]

    Phase3 --> Check3{KPIs +1?}
    Check3 -->|Non| Fix3[❌ Refresh KO]
    Check3 -->|Oui| Phase4[Phase 4: Validation 4min]

    Phase4 --> Validate[Clic Valider produit]
    Validate --> Check4{Fournisseur lié?}

    Check4 -->|Non| AddSupplier[Ajouter fournisseur]
    AddSupplier --> Validate

    Check4 -->|Oui| ValidateOK[Produit validé]
    ValidateOK --> Phase5[Phase 5: Catalogue 3min]

    Phase5 --> Check5{Produit visible catalogue?}
    Check5 -->|Non| Fix5[❌ Migration KO]
    Check5 -->|Oui| Phase6[Phase 6: Test AVEC Image 5min optionnel]

    Phase6 --> CheckAll{Console 0 erreur?}

    CheckAll -->|Non| FixConsole[❌ Erreurs critiques]
    CheckAll -->|Oui| Success[✅ Tests PASS 100%]

    Success --> End([Workflow validé])
```

---

## 🏗️ 8. ARCHITECTURE TABLES RELATIONS

```mermaid
erDiagram
    PRODUCT_DRAFTS ||--o{ PRODUCT_DRAFT_IMAGES : has
    PRODUCT_DRAFTS ||--o| ORGANISATIONS : "supplier (FK)"
    PRODUCT_DRAFTS ||--o| ORGANISATIONS : "assigned_client (FK)"
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o| ORGANISATIONS : "supplier (FK)"
    PRODUCTS ||--o| ORGANISATIONS : "assigned_client (FK)"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : tracks
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : contains
    PURCHASE_ORDER_ITEMS }o--|| PRODUCTS : references

    PRODUCT_DRAFTS {
        uuid id PK
        text name
        text supplier_page_url
        text sourcing_type "interne|client"
        text creation_mode "sourcing"
        boolean requires_sample
        text sample_status "enum"
        text sample_request_status "enum"
        uuid supplier_id FK
        uuid assigned_client_id FK
        timestamptz sourcing_validated_at
        timestamptz sample_requested_at
        timestamptz sample_ordered_at
        timestamptz sample_delivered_at
    }

    PRODUCTS {
        uuid id PK
        text sku
        text name
        text status "enum"
        text creation_mode "sourcing|complete"
        boolean requires_sample
        decimal cost_price
        integer stock_real
        integer stock_forecasted_in
        integer stock_forecasted_out
        uuid supplier_id FK
        uuid assigned_client_id FK
    }

    ORGANISATIONS {
        uuid id PK
        text name
        text type "supplier|customer"
        text email
        boolean is_active
    }

    STOCK_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        text movement_type "IN|OUT|ADJUST"
        integer quantity_change
        text reason_code "enum"
        boolean affects_forecast
        timestamptz created_at
    }

    PURCHASE_ORDERS {
        uuid id PK
        text status "draft|confirmed|received"
        uuid supplier_id FK
        timestamptz confirmed_at
        timestamptz received_at
    }
```

---

## 🎨 9. BADGES UI - CODES COULEURS

```mermaid
graph TD
    subgraph "Status Badges"
        S1[sourcing - GRAY]
        S2[pret_a_commander - BLUE]
        S3[echantillon_a_commander - ORANGE]
        S4[in_stock - GREEN]
    end

    subgraph "Context Badges"
        C1[Client - PURPLE]
        C2[Interne - BLACK]
        C3[Échantillon requis - ORANGE]
        C4[Aucun fournisseur - RED]
    end

    subgraph "Sample Status"
        SS1[not_required - GRAY]
        SS2[request_pending - YELLOW]
        SS3[ordered - BLUE]
        SS4[delivered - ORANGE]
        SS5[approved - GREEN]
        SS6[rejected - RED]
    end

    style S1 fill:#e5e7eb,color:#1f2937
    style S2 fill:#dbeafe,color:#1e40af
    style S3 fill:#fed7aa,color:#c2410c
    style S4 fill:#d1fae5,color:#065f46

    style C1 fill:#e9d5ff,color:#6b21a8
    style C2 fill:#000000,color:#ffffff
    style C3 fill:#fed7aa,color:#c2410c
    style C4 fill:#fee2e2,color:#991b1b

    style SS1 fill:#e5e7eb,color:#1f2937
    style SS2 fill:#fef3c7,color:#92400e
    style SS3 fill:#dbeafe,color:#1e40af
    style SS4 fill:#fed7aa,color:#c2410c
    style SS5 fill:#d1fae5,color:#065f46
    style SS6 fill:#fee2e2,color:#991b1b
```

---

## 📱 10. NAVIGATION UI - SITEMAP

```mermaid
graph TD
    Root[/] --> Dashboard[/dashboard]
    Root --> Catalogue[/catalogue]
    Root --> Sourcing[/sourcing]
    Root --> Organisation[/organisation]

    Catalogue --> CatalogueProducts[/catalogue/products]
    Catalogue --> CatalogueCreate[/catalogue/create]
    Catalogue --> CatalogueCategories[/catalogue/categories]
    Catalogue --> CatalogueCollections[/catalogue/collections]
    Catalogue --> CatalogueVariants[/catalogue/variantes]

    Sourcing --> SourcingDashboard[/sourcing - Dashboard]
    Sourcing --> SourcingProducts[/sourcing/produits - Produits à Sourcer]
    Sourcing --> SourcingEchantillons[/sourcing/echantillons - Échantillons]
    Sourcing --> SourcingValidation[/sourcing/validation - Validation]

    CatalogueCreate --> QuickSourcing[Wizard: Sourcing Rapide]
    CatalogueCreate --> CompleteProduct[Wizard: Produit Complet]

    SourcingProducts --> ActionValidate[Action: Valider produit]
    SourcingProducts --> ActionEdit[Action: Éditer]
    SourcingProducts --> ActionDelete[Action: Supprimer]

    ActionValidate --> CatalogueProducts

    style Sourcing fill:#dbeafe,stroke:#1e40af,stroke-width:3px
    style SourcingDashboard fill:#e0e7ff
    style SourcingProducts fill:#e0e7ff
    style SourcingEchantillons fill:#e0e7ff
    style SourcingValidation fill:#e0e7ff
```

---

**🎯 Utiliser ces diagrammes pour visualiser et comprendre les workflows complets**

*Diagrammes créés le 2025-10-06 - Format Mermaid compatible GitHub/VS Code*
