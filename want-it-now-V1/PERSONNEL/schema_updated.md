%% Diagramme global Want It Now (modèle de données + roadmap)

erDiagram
    organizations ||--o{ properties : "possède"
    properties ||--o{ units : "contient (facultatif)"
    properties ||--o{ property_ownership : "lié à"
    owners ||--o{ property_ownership : "détient une quotité"
    owners ||--o{ shareholders : "peut avoir des associés"

    %% Bookings : soit property, soit unit (exclusif)
    properties ||--o{ seasonal_bookings : "génère (si pas d’unités)"
    properties ||--o{ transactions : "génère (si pas d’unités)"
    units ||--o{ seasonal_bookings : "génère (si unités)"
    units ||--o{ transactions : "génère (si unités)"

    lease_contracts ||--o{ transactions : "génère"

%% Roadmap (ordre des phases et guide visuel inclus)
flowchart TD
  A[Phase 0: Boot + Guide Visuel] --> B[Phase 1: Core Database]
  B --> C[Phase 2: UI + Auth (+ intégration Guide Visuel)]
  C --> D1[Slice 1: CRUD Owners]
  D1 --> D2[Slice 2: CRUD Properties + Units]
  D2 --> D3[Slice 3: Bookings + Calendar]
  D3 --> E[Phase 4: Dashboard + RBAC + i18n]
  E --> F[Phase 5: Finances + Inventaire]
  F --> G[Phase 6: Optimisations + Widgets + PWA]
