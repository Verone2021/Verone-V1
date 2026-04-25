# RAPPORT COMPARAISON FORMULAIRES PACKLINK - 2 VARIANTES

**Date** : 2025-11-12  
**Mission** : Identifier les différences entre formulaire Domicile→Domicile vs. Point Relais  
**Environnement** : PackLink Pro (https://pro.packlink.fr)

---

## 🎯 RÉSUMÉ EXÉCUTIF

**DIFFÉRENCE CLEF IDENTIFIÉE** :

La variante avec **Point Relais** ajoute une **section supplémentaire obligatoire** :

```
┌─────────────────────────────────────────┐
│ Retrait en Relais / Locker              │
│ [Sélectionner un point de retrait]      │
└─────────────────────────────────────────┘
```

Cette section **n'existe PAS** dans la variante Domicile→Domicile.

---

## 📋 TEST 1 : DOMICILE → DOMICILE

### Service Sélectionné

- **Transporteur** : UPS
- **Service** : Standard (Collecte à domicile + Livraison à domicile)
- **Prix** : 13,94 € (12,95 € + 0,99 € frais gestion)
- **Délai** : 24h (jeudi 13 novembre 07:00-23:00)

### Structure du Formulaire

#### 1. Section "Expéditeur"

| Champ                    | Type    | État            | Valeur Exemple                    |
| ------------------------ | ------- | --------------- | --------------------------------- |
| Prénom                   | textbox | ✅ Editable     | imane                             |
| Nom                      | textbox | ✅ Editable     | fraija                            |
| Entreprise (Facultatif)  | textbox | ✅ Editable     | verone                            |
| Email                    | textbox | ✅ Editable     | imane@affectbuildingconsulting.fr |
| Téléphone mobile         | textbox | ✅ Editable     | 0656720702                        |
| Adresse                  | textbox | ✅ Editable     | 4 rue du Perou 91300 Massy        |
| **Pays**                 | textbox | 🔒 **DISABLED** | France                            |
| **Ville ou code postal** | textbox | 🔒 **DISABLED** | 91300 - Massy                     |

**Observation** : Les champs Pays et Ville/Code postal sont **grisés (disabled)** car déjà définis lors de l'étape 1.

#### 2. Section "Destinataire"

| Champ                    | Type    | État            | Valeur Exemple             |
| ------------------------ | ------- | --------------- | -------------------------- |
| Prénom                   | textbox | ✅ Editable     | Pokawa                     |
| Nom                      | textbox | ✅ Editable     | Amiens                     |
| Entreprise (Facultatif)  | textbox | ✅ Editable     | Pokawa                     |
| Email                    | textbox | ✅ Editable     | romeo@veronecollections.fr |
| Téléphone mobile         | textbox | ✅ Editable     | 0656720702                 |
| Adresse                  | textbox | ✅ Editable     | (vide)                     |
| **Pays**                 | textbox | 🔒 **DISABLED** | France                     |
| **Ville ou code postal** | textbox | 🔒 **DISABLED** | 75001 - Paris              |

**⚠️ Info Box** : Pourquoi le téléphone mobile et l'e-mail sont-ils requis?

> Un numéro de téléphone mobile et une adresse e-mail aident les transporteurs à contacter le destinataire, à partager les mises à jour de livraison et à assurer une livraison réussie. Fournir les deux augmente **les taux de livraison réussie jusqu'à 95%**.

#### 3. Section "Date de l'enlèvement"

- **Jour** : textbox avec date picker
- **Heure de la collecte** : Radio button "De 07:00 à 23:00" (checked)

#### 4. Section "Contenu envoyé"

| Champ    | Type       | Valeur                                               |
| -------- | ---------- | ---------------------------------------------------- |
| Contenu  | textbox    | (placeholder: Écrivez ou sélectionnez votre contenu) |
| Occasion | checkbox   | ❌ Non coché                                         |
| Valeur   | spinbutton | 0 €                                                  |

#### 5. Section "Protection colis"

- **Titre** : Protégez votre colis
- **Message** : Obtenez un remboursement intégral en cas de perte ou de dommage
- **État** : Votre envoi n'est pas protégé
- **Options** :
  - Radio "Ajouter une protection d'expédition" (disabled)
  - Radio "Je suis prêt(e) à prendre le risque." (disabled)

#### 6. Bouton Final

- **Bouton** : "Aller au paiement"
- **Note** : Acceptation articles interdits + emballage adapté

### ❌ Sections ABSENTES (Variante Domicile→Domicile)

- **Aucune section "Point Relais"**
- **Aucun sélecteur de point de retrait**

---

## 📋 TEST 2 : AVEC POINT RELAIS (SHOP2SHOP)

### Service Sélectionné

- **Transporteur** : Chronopost
- **Service** : Shop2Shop (Dépôt en Relais + Retrait en Relais)
- **Prix** : 6,83 € (pas de frais gestion)
- **Délai** : 3 jours (mardi 18 novembre)

### Structure du Formulaire

#### 1. Section "Expéditeur"

**IDENTIQUE à TEST 1** (mêmes champs, mêmes états)

#### 2. Section "Destinataire"

**IDENTIQUE à TEST 1** (mêmes champs, mêmes états)

#### 3. ⭐ Section "Retrait en Relais / Locker" (NOUVELLE)

**CECI EST LA DIFFÉRENCE CRITIQUE !**

```yaml
Section Title: 'Retrait en Relais / Locker'
Button: 'Sélectionner un point de retrait'
State: Clickable, required
```

##### 3.1 Modal "Point de retrait du destinataire"

Lorsqu'on clique sur "Sélectionner un point de retrait", une **modal s'ouvre** avec :

**Composants** :

1. **Header** :
   - Titre : "Point de retrait du destinataire"
   - Sous-titre : "Sélectionnez le point de retrait de votre acheteur"

2. **Champ de recherche** :
   - Type : textbox
   - Placeholder : "Filtrer par adresse ou par nom du point de retrait"
   - Icône : Loupe

3. **Liste de Points Relais** (scrollable) :

   Exemple des 10 premiers points (75001 - Paris) :

   | Nom                               | Adresse                          | Référence | Action      |
   | --------------------------------- | -------------------------------- | --------- | ----------- |
   | MARIA                             | 58 rue de l arbre sec            | 9835U     | [Confirmer] |
   | La Poste de PARIS CHATELET        | 27 rue lavandieres ste opportune | 7840O     | [Confirmer] |
   | KULTUR                            | 27 rue de la ferronnerie         | 792AC     | [Confirmer] |
   | La Poste de PARIS LOUVRE          | 50 rue du louvre                 | 7783O     | [Confirmer] |
   | Consigne Pickup Carre Pro Sentier | 54 rue d aboukir                 | 0196X     | [Confirmer] |
   | PHONE STORE                       | 87 rue reaumur                   | 718BN     | [Confirmer] |
   | La Poste de PARIS ARTS ET METIERS | 259 rue saint martin             | 7839O     | [Confirmer] |
   | FRANPRIX                          | 121 boulevard de sebastopol      | 7968Y     | [Confirmer] |
   | Avenir informatique               | 39 rue beauregard                | 5282Y     | [Confirmer] |
   | Consigne Carrefour City Paris 09  | 7 rue de caumartin               | 050AX     | [Confirmer] |

4. **Carte Google Maps Interactive** :
   - Carte : Google Maps avec marqueurs
   - Zoom : Boutons Zoom avant/arrière
   - Marqueurs : Points relais géolocalisés
   - API : Google Maps JavaScript API
   - Warning console : "As of February 21st, 2024, google.maps.Marker is deprecated"

**Workflow Sélection** :

```
1. User clique "Sélectionner un point de retrait"
   ↓
2. Modal s'ouvre avec liste + carte
   ↓
3. User peut :
   - Filtrer par nom/adresse (textbox)
   - Cliquer sur point dans liste
   - Cliquer sur marqueur sur carte
   ↓
4. User clique "Confirmer" sur un point
   ↓
5. Modal se ferme
   ↓
6. Point sélectionné s'affiche dans formulaire
```

#### 4. Section "Contenu envoyé"

**IDENTIQUE à TEST 1**

#### 5. Section "Protection colis"

**IDENTIQUE à TEST 1**

#### 6. Bouton Final

**IDENTIQUE à TEST 1** : "Aller au paiement"

---

## 📊 COMPARAISON DÉTAILLÉE : TABLEAU RÉCAPITULATIF

| Élément                                  | Domicile→Domicile | Avec Point Relais | Différence                      |
| ---------------------------------------- | ----------------- | ----------------- | ------------------------------- |
| **Section Expéditeur**                   | ✅ Présente       | ✅ Présente       | ✅ Identique                    |
| **Section Destinataire**                 | ✅ Présente       | ✅ Présente       | ✅ Identique                    |
| **Section "Retrait en Relais / Locker"** | ❌ **ABSENTE**    | ✅ **PRÉSENTE**   | ⭐ **DIFFÉRENCE CLEF**          |
| **Section "Date de l'enlèvement"**       | ✅ Présente       | ❌ Absente        | ⚠️ Variante domicile uniquement |
| **Section "Contenu envoyé"**             | ✅ Présente       | ✅ Présente       | ✅ Identique                    |
| **Section "Protection colis"**           | ✅ Présente       | ✅ Présente       | ✅ Identique                    |
| **Bouton "Aller au paiement"**           | ✅ Présent        | ✅ Présent        | ✅ Identique                    |

---

## 🔍 ANALYSE TECHNIQUE : API & WORKFLOW

### Variante Domicile→Domicile

**Workflow** :

```
1. Remplir Expéditeur (adresse complète)
2. Remplir Destinataire (adresse complète)
3. Choisir Date/Heure enlèvement
4. Remplir Contenu envoyé
5. Choisir Protection colis
6. → Paiement
```

**Champs requis pour API** :

```typescript
{
  from: {
    name: string,
    company?: string,
    email: string,
    phone: string,
    address: string,
    postal_code: string, // disabled, pré-rempli
    city: string,        // disabled, pré-rempli
    country: string      // disabled, pré-rempli
  },
  to: {
    name: string,
    company?: string,
    email: string,
    phone: string,
    address: string,      // ADRESSE COMPLÈTE REQUISE
    postal_code: string,  // disabled, pré-rempli
    city: string,         // disabled, pré-rempli
    country: string       // disabled, pré-rempli
  },
  collection: {
    date: Date,
    time_range: string    // "07:00-23:00"
  },
  content: {
    description: string,
    value: number,
    used: boolean
  }
}
```

### Variante Point Relais

**Workflow** :

```
1. Remplir Expéditeur (adresse complète)
2. Remplir Destinataire (NOM/EMAIL/TÉLÉPHONE uniquement, PAS d'adresse)
3. [NOUVEAU] Sélectionner Point Relais destinataire
4. Remplir Contenu envoyé
5. Choisir Protection colis
6. → Paiement
```

**Champs requis pour API** :

```typescript
{
  from: {
    name: string,
    company?: string,
    email: string,
    phone: string,
    address: string,
    postal_code: string,
    city: string,
    country: string
  },
  to: {
    name: string,
    company?: string,
    email: string,
    phone: string,
    // ❌ PAS d'adresse complète
    postal_code: string,  // utilisé pour rechercher points relais
    city: string,
    country: string
  },
  delivery_point: {        // ⭐ NOUVEAU CHAMP
    id: string,            // Ex: "9835U"
    name: string,          // Ex: "MARIA"
    address: string,       // Ex: "58 rue de l arbre sec"
    postal_code: string,
    city: string,
    type: "pickup_point" | "locker"
  },
  content: {
    description: string,
    value: number,
    used: boolean
  }
}
```

---

## 🛠️ RECOMMANDATIONS POUR NOTRE FORMULAIRE

### 1. Architecture Conditionnelle

**Créer un système de rendu conditionnel basé sur le type de service** :

```typescript
// Type de service (déterminé par API PackLink)
type ServiceType =
  | 'home_to_home' // Domicile → Domicile
  | 'home_to_pickup' // Domicile → Point Relais
  | 'pickup_to_home' // Point Relais → Domicile
  | 'pickup_to_pickup'; // Point Relais → Point Relais

// Déterminer quelles sections afficher
function getFormSections(serviceType: ServiceType) {
  return {
    senderAddress: true, // Toujours présent
    recipientAddress: !serviceType.includes('pickup'), // Seulement si pas Point Relais
    senderPickupPoint: serviceType.startsWith('pickup'), // Si expédition depuis Point Relais
    recipientPickupPoint: serviceType.includes('to_pickup'), // Si livraison vers Point Relais
    collectionDate: serviceType.includes('home'), // Seulement si collecte domicile
    packageContent: true, // Toujours présent
    insurance: true, // Toujours présent
  };
}
```

### 2. Composants à Créer

#### A. `PickupPointSelector.tsx` ⭐ PRIORITÉ HAUTE

**Props** :

```typescript
interface PickupPointSelectorProps {
  postalCode: string;
  city: string;
  country: string;
  onSelect: (point: PickupPoint) => void;
  required?: boolean;
}

interface PickupPoint {
  id: string; // Référence unique (ex: "9835U")
  name: string; // Nom du point
  address: string; // Adresse complète
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
  type: 'pickup_point' | 'locker' | 'post_office';
  hours?: string[]; // Horaires d'ouverture
}
```

**Fonctionnalités** :

- Modal Dialog (shadcn/ui Dialog)
- Liste scrollable de points relais
- Carte Google Maps interactive (ou alternative comme Mapbox)
- Filtrage par nom/adresse
- Sélection avec bouton "Confirmer"
- Affichage du point sélectionné dans formulaire

**Exemple UI** :

```tsx
<PickupPointSelector
  postalCode={form.watch('recipient.postalCode')}
  city={form.watch('recipient.city')}
  country={form.watch('recipient.country')}
  onSelect={point => {
    setValue('deliveryPoint', point);
  }}
  required={true}
/>
```

#### B. `AddressFormSection.tsx` (Modifier existant)

**Props** :

```typescript
interface AddressFormSectionProps {
  type: 'sender' | 'recipient';
  showFullAddress: boolean; // ⭐ NOUVEAU : conditionnel
  disabledFields?: string[]; // Champs grisés (country, postalCode, city)
}
```

**Rendu conditionnel** :

```tsx
{
  showFullAddress && (
    <FormField
      control={form.control}
      name={`${type}.address`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Adresse</FormLabel>
          <FormControl>
            <Textarea {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
```

#### C. `CollectionDatePicker.tsx`

**Props** :

```typescript
interface CollectionDatePickerProps {
  minDate?: Date;
  excludeDates?: Date[];
  onSelect: (date: Date, timeRange: string) => void;
}
```

**Afficher uniquement si** : `serviceType.includes('home')`

### 3. API à Appeler

#### A. Endpoint : Rechercher Points Relais

**Hypothèse** (à vérifier dans doc PackLink) :

```typescript
// API PackLink - GET /pickup-points
interface SearchPickupPointsRequest {
  postal_code: string;
  city?: string;
  country: string;
  carrier?: string; // Ex: "chronopost", "mondial_relay"
  max_results?: number;
}

interface SearchPickupPointsResponse {
  pickup_points: PickupPoint[];
  total: number;
}

// Notre hook
function usePickupPoints(params: SearchPickupPointsRequest) {
  return useQuery({
    queryKey: ['pickup-points', params],
    queryFn: async () => {
      const response = await fetch('/api/packlink/pickup-points', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return response.json();
    },
    enabled: !!params.postal_code,
  });
}
```

**Alternative** : Si PackLink fournit widget/iframe intégré :

```tsx
<PackLinkPickupWidget
  apiKey={process.env.PACKLINK_API_KEY}
  postalCode="75001"
  onSelect={handleSelect}
/>
```

#### B. Endpoint : Créer Shipment (Modifier existant)

**Ajouter champ conditionnel** :

```typescript
interface CreateShipmentRequest {
  // ... champs existants
  delivery_point?: {
    // ⭐ NOUVEAU : uniquement si Point Relais
    id: string;
    name: string;
    address: string;
    postal_code: string;
    city: string;
  };
}
```

### 4. Hooks Nécessaires

#### A. `useShipmentFormConfig.ts`

**Déterminer la configuration du formulaire** :

```typescript
function useShipmentFormConfig(serviceId: string) {
  const { data: service } = usePacklinkService(serviceId);

  return useMemo(() => {
    const hasPickupDelivery = service?.to_type === 'pickup_point';
    const hasHomeCollection = service?.from_type === 'home';

    return {
      showRecipientAddress: !hasPickupDelivery,
      showPickupPointSelector: hasPickupDelivery,
      showCollectionDate: hasHomeCollection,
      requireFullRecipientAddress: !hasPickupDelivery,
    };
  }, [service]);
}
```

#### B. `usePickupPointSelector.ts`

**Gérer l'état de sélection** :

```typescript
function usePickupPointSelector(postalCode: string, city: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);

  const { data: pickupPoints, isLoading } = usePickupPoints({
    postal_code: postalCode,
    city,
    country: 'FR',
  });

  return {
    isOpen,
    setIsOpen,
    selectedPoint,
    setSelectedPoint,
    pickupPoints,
    isLoading,
  };
}
```

### 5. Validation Conditionnelle (Zod Schema)

```typescript
function getShipmentFormSchema(serviceType: ServiceType) {
  const baseSchema = {
    sender: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(10),
      address: z.string().min(5),
      postalCode: z.string(),
      city: z.string(),
      country: z.string(),
    }),
    recipient: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(10),
      postalCode: z.string(),
      city: z.string(),
      country: z.string(),
    }),
  };

  // Conditionnel : Adresse complète destinataire
  if (!serviceType.includes('to_pickup')) {
    baseSchema.recipient.address = z.string().min(5);
  }

  // Conditionnel : Point Relais destinataire
  if (serviceType.includes('to_pickup')) {
    baseSchema.deliveryPoint = z.object({
      id: z.string(),
      name: z.string(),
      address: z.string(),
    });
  }

  // Conditionnel : Date collecte
  if (serviceType.includes('home')) {
    baseSchema.collectionDate = z.object({
      date: z.date(),
      timeRange: z.string(),
    });
  }

  return z.object(baseSchema);
}
```

---

## 📸 SCREENSHOTS CAPTURÉS

1. ✅ **test1-domicile-domicile-form.png** - Formulaire complet Domicile→Domicile
2. ✅ **test1-domicile-domicile-form-bottom.png** - Bas du formulaire avec sections Contenu/Protection
3. ✅ **test2-services-list.png** - Liste des services disponibles (Shop2Shop en premier)
4. ✅ **test2-point-relais-form.png** - Formulaire Point Relais avec bouton "Sélectionner un point de retrait"
5. ✅ **test2-point-relais-modal.png** - Modal de sélection Point Relais avec carte Google Maps

**Localisation** : `/Users/romeodossantos/verone-back-office-V1/.playwright-mcp/`

---

## ✅ VALIDATION CHECKLIST IMPLÉMENTATION

### Phase 1 : Architecture de base

- [ ] Créer type `ServiceType` avec 4 variantes
- [ ] Créer fonction `getFormSections(serviceType)` pour rendu conditionnel
- [ ] Modifier `AddressFormSection` avec prop `showFullAddress`
- [ ] Créer schéma Zod conditionnel `getShipmentFormSchema()`

### Phase 2 : Composant PickupPointSelector

- [ ] Créer composant `PickupPointSelector.tsx`
- [ ] Intégrer Dialog shadcn/ui
- [ ] Implémenter liste scrollable de points
- [ ] Intégrer Google Maps (ou Mapbox)
- [ ] Ajouter filtrage par texte
- [ ] Gérer sélection + confirmation

### Phase 3 : API Integration

- [ ] Créer endpoint `/api/packlink/pickup-points`
- [ ] Créer hook `usePickupPoints()`
- [ ] Modifier endpoint `/api/packlink/create-shipment` pour accepter `delivery_point`
- [ ] Tester avec différents codes postaux

### Phase 4 : Tests E2E

- [ ] Test E2E : Créer shipment Domicile→Domicile
- [ ] Test E2E : Créer shipment Domicile→Point Relais
- [ ] Test E2E : Sélectionner différents points relais
- [ ] Test E2E : Validation erreurs (point non sélectionné)

---

## 🎯 CONCLUSION

**DIFFÉRENCE PRINCIPALE** : La variante avec **Point Relais** ajoute une section obligatoire "Retrait en Relais / Locker" avec :

1. Bouton "Sélectionner un point de retrait"
2. Modal avec liste de points relais
3. Carte Google Maps interactive
4. Filtrage par nom/adresse
5. Sélection avec bouton "Confirmer"

**IMPACT SUR NOTRE FORMULAIRE** :

- Architecture **conditionnelle** basée sur le type de service
- Nouveau composant **PickupPointSelector** (haute priorité)
- Modification du schéma Zod pour validation conditionnelle
- Intégration Google Maps API (ou alternative)
- Nouvelle API endpoint pour récupérer points relais

**ESTIMATION DÉVELOPPEMENT** :

- PickupPointSelector : 4-6h
- API Integration : 2-3h
- Tests E2E : 2h
- **TOTAL** : 8-11h

---

**Rapport généré par** : Claude Code (Playwright MCP)  
**Fichiers screenshots** : `.playwright-mcp/test*.png` (5 fichiers)
