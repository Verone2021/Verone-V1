# Règles Métier - Système de Réservation Channel Manager

## 📋 Règle Business Critique

### **Réservations Exclusives : Property XOR Unit (Jamais les Deux)**

**Règle** : Une réservation doit être liée SOIT à une propriété (si pas d'unités) SOIT à une unité (si unités), mais jamais aux deux simultanément.

```sql
-- Contrainte Database  
ALTER TABLE reservations
ADD CONSTRAINT check_property_or_unit_exclusive_reservations
CHECK (
  (propriete_id IS NOT NULL AND unite_id IS NULL) OR
  (propriete_id IS NULL AND unite_id IS NOT NULL)
);
```

### **Contrat Actif Obligatoire**

**Règle** : Une réservation ne peut être créée que sur une propriété/unité ayant un contrat actif.

```sql
-- Validation contrat actif
CREATE OR REPLACE FUNCTION validate_contrat_actif_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier qu'un contrat actif existe
  IF NOT EXISTS (
    SELECT 1 FROM contrats c
    WHERE c.id = NEW.contrat_id
    AND c.statut = 'actif'
    AND CURRENT_DATE BETWEEN c.date_debut AND COALESCE(c.date_fin, '9999-12-31'::DATE)
  ) THEN
    RAISE EXCEPTION 'Aucun contrat actif pour cette propriété/unité';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 **Spécifications Techniques**

### **Gestion Conflits Calendrier**
```sql
-- Fonction validation disponibilité
CREATE OR REPLACE FUNCTION check_disponibilite_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier qu'aucune réservation confirmée n'existe sur ces dates
  IF EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.statut = 'confirmee'
    AND (
      (NEW.propriete_id IS NOT NULL AND r.propriete_id = NEW.propriete_id) OR
      (NEW.unite_id IS NOT NULL AND r.unite_id = NEW.unite_id)
    )
    AND daterange(NEW.date_arrivee, NEW.date_depart, '[)') && 
        daterange(r.date_arrivee, r.date_depart, '[)')
  ) THEN
    RAISE EXCEPTION 'Conflit de réservation : dates déjà réservées';
  END IF;
  
  -- Vérifier disponibilité dans calendrier
  IF EXISTS (
    SELECT 1 FROM calendrier_disponibilites cd
    WHERE (
      (NEW.propriete_id IS NOT NULL AND cd.propriete_id = NEW.propriete_id) OR
      (NEW.unite_id IS NOT NULL AND cd.unite_id = NEW.unite_id)
    )
    AND cd.date >= NEW.date_arrivee
    AND cd.date < NEW.date_depart
    AND cd.statut IN ('indisponible', 'bloque')
  ) THEN
    RAISE EXCEPTION 'Dates non disponibles dans le calendrier';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **Calcul Automatique Commissions**
```typescript
// Calcul commissions selon plateforme
export function calculateCommissions(reservation: ReservationData) {
  const { 
    source_reservation,
    prix_nuit,
    nombre_nuits,
    frais_menage 
  } = reservation;
  
  // Récupérer taux commission plateforme
  const commission = await getCommissionRates(source_reservation);
  
  // Calcul côté voyageur
  const sous_total_nuits = prix_nuit * nombre_nuits;
  const frais_service_voyageur = sous_total_nuits * commission.taux_voyageur;
  const total_voyageur = sous_total_nuits + frais_menage + frais_service_voyageur;
  
  // Calcul côté hôte
  const frais_service_hote = (sous_total_nuits + frais_menage) * commission.taux_hote;
  const tva_frais_service = frais_service_hote * 0.20; // TVA 20%
  const total_hote_net = sous_total_nuits + frais_menage - frais_service_hote;
  
  // Commission totale plateforme
  const commission_plateforme_total = frais_service_voyageur + frais_service_hote;
  
  return {
    sous_total_nuits,
    frais_service_voyageur,
    total_voyageur,
    frais_service_hote,
    tva_frais_service,
    total_hote_net,
    commission_plateforme_total
  };
}
```

### **Organisation Auto-Assignée par Pays**
```sql
-- Trigger pour assigner organisation selon pays du bien
CREATE OR REPLACE FUNCTION assign_organisation_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_pays TEXT;
  v_organisation_id UUID;
BEGIN
  -- Récupérer le pays du bien
  IF NEW.propriete_id IS NOT NULL THEN
    SELECT p.pays INTO v_pays
    FROM proprietes p
    WHERE p.id = NEW.propriete_id;
  ELSIF NEW.unite_id IS NOT NULL THEN
    SELECT p.pays INTO v_pays
    FROM unites u
    JOIN proprietes p ON u.propriete_id = p.id
    WHERE u.id = NEW.unite_id;
  END IF;
  
  -- Assigner organisation selon pays
  SELECT id INTO v_organisation_id
  FROM organisations
  WHERE pays = v_pays
  AND is_active = true
  LIMIT 1;
  
  IF v_organisation_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation active pour le pays %', v_pays;
  END IF;
  
  NEW.organisation_id = v_organisation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🧪 **Tests Playwright Spécialisés**

### **Test 1: Réservation sur Propriété Sans Unités**
```typescript
test('réservation sur propriété sans unités', async ({ page }) => {
  // Navigation vers propriété avec contrat actif
  await page.goto('/reservations/new?property=prop-without-units');
  
  // Vérifier que seul property_id est disponible
  await expect(page.locator('[data-testid="property-field"]')).toBeVisible();
  await expect(page.locator('[data-testid="unit-field"]')).not.toBeVisible();
  
  // Remplir réservation
  await page.fill('[data-testid="guest-name"]', 'John Doe');
  await page.fill('[data-testid="check-in"]', '2025-06-01');
  await page.fill('[data-testid="check-out"]', '2025-06-07');
  await page.fill('[data-testid="price-night"]', '100');
  
  // Vérifier calculs automatiques
  await expect(page.locator('[data-testid="subtotal"]')).toContainText('600€');
  await expect(page.locator('[data-testid="platform-commission"]')).toBeVisible();
  
  // Submit
  await page.click('[data-testid="submit-reservation"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### **Test 2: Conflit de Dates**
```typescript
test('détection conflit réservations', async ({ page }) => {
  // Créer première réservation
  await createReservation(page, {
    property: 'villa-test',
    checkIn: '2025-06-01',
    checkOut: '2025-06-07'
  });
  
  // Tenter réservation chevauchante
  await page.goto('/reservations/new?property=villa-test');
  await page.fill('[data-testid="check-in"]', '2025-06-05');
  await page.fill('[data-testid="check-out"]', '2025-06-10');
  
  // Vérifier message d'erreur
  await page.click('[data-testid="check-availability"]');
  await expect(page.locator('[data-testid="error-conflict"]'))
    .toContainText('Dates déjà réservées');
});
```

### **Test 3: Import CSV Airbnb**
```typescript
test('import CSV Airbnb avec validation', async ({ page }) => {
  await page.goto('/reservations/import');
  
  // Upload fichier CSV
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-data/airbnb-export.csv');
  
  // Vérifier preview
  await expect(page.locator('[data-testid="import-preview"]')).toBeVisible();
  await expect(page.locator('[data-testid="rows-count"]')).toContainText('15 réservations');
  
  // Mapper colonnes
  await page.selectOption('[data-testid="map-guest-name"]', 'Guest name');
  await page.selectOption('[data-testid="map-check-in"]', 'Start date');
  await page.selectOption('[data-testid="map-total"]', 'Total payout');
  
  // Lancer import
  await page.click('[data-testid="start-import"]');
  
  // Vérifier rapport
  await expect(page.locator('[data-testid="import-success"]')).toContainText('13 succès');
  await expect(page.locator('[data-testid="import-errors"]')).toContainText('2 erreurs');
});
```

### **Test 4: Calcul Commissions Complexes**
```typescript
test('calcul commissions Airbnb complet', async ({ page }) => {
  await page.goto('/reservations/new');
  
  // Configuration réservation Airbnb
  await page.selectOption('[data-testid="platform"]', 'airbnb');
  await page.fill('[data-testid="price-night"]', '61');
  await page.fill('[data-testid="nights"]', '18');
  await page.fill('[data-testid="cleaning-fee"]', '40');
  
  // Vérifier calculs automatiques
  await expect(page.locator('[data-testid="subtotal-nights"]')).toContainText('1098€');
  await expect(page.locator('[data-testid="guest-service-fee"]')).toContainText('194.40€');
  await expect(page.locator('[data-testid="total-guest"]')).toContainText('1332.40€');
  
  await expect(page.locator('[data-testid="host-service-fee"]')).toContainText('40.97€');
  await expect(page.locator('[data-testid="total-host"]')).toContainText('1097.03€');
  
  // Vérifier commission totale plateforme
  await expect(page.locator('[data-testid="platform-total-commission"]'))
    .toContainText('235.37€'); // 194.40 + 40.97
});
```

## 🚨 **Messages d'Erreur Standardisés**
```typescript
export const reservationErrorMessages = {
  bothPropertyAndUnit: "Une réservation ne peut pas être liée à la fois à une propriété ET une unité",
  neitherPropertyNorUnit: "Une réservation doit être liée soit à une propriété soit à une unité",
  noActiveContract: "Aucun contrat actif trouvé pour cette propriété/unité",
  conflictDates: "Conflit de dates avec une réservation existante",
  unavailableInCalendar: "Ces dates sont marquées comme indisponibles",
  invalidGuestCount: "Le nombre de voyageurs dépasse la capacité maximale",
  missingCommissionRates: "Taux de commission non configurés pour cette plateforme",
  importFormatError: "Format de fichier CSV non reconnu"
} as const;
```

## 📊 **Métriques & Monitoring**

### **KPIs Réservations**
- Taux d'occupation mensuel (objectif: >70%)
- RevPAR (Revenue Per Available Room)
- Durée moyenne de séjour
- Délai moyen de réservation (booking window)
- Taux d'annulation (<5%)
- Commission moyenne par plateforme

### **Logging Events**
```typescript
export const reservationEvents = {
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_MODIFIED: 'reservation.modified',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  AVAILABILITY_CONFLICT: 'reservation.conflict',
  COMMISSION_CALCULATED: 'reservation.commission.calculated',
  CSV_IMPORT_SUCCESS: 'reservation.import.success',
  CSV_IMPORT_ERROR: 'reservation.import.error',
  CALENDAR_SYNC: 'reservation.calendar.sync'
} as const;
```

## 🔄 **Synchronisation Multi-Plateformes**

### **iCal Integration**
```typescript
// Export calendrier format iCal
export async function exportICal(propertyId: string): Promise<string> {
  const reservations = await getReservations(propertyId);
  
  let ical = 'BEGIN:VCALENDAR\n';
  ical += 'VERSION:2.0\n';
  ical += 'PRODID:-//Want It Now//Reservation System//FR\n';
  
  for (const reservation of reservations) {
    ical += 'BEGIN:VEVENT\n';
    ical += `UID:${reservation.id}@wantitnow.com\n`;
    ical += `DTSTART:${formatDate(reservation.date_arrivee)}\n`;
    ical += `DTEND:${formatDate(reservation.date_depart)}\n`;
    ical += `SUMMARY:${reservation.voyageur_nom} - ${reservation.code_confirmation}\n`;
    ical += `DESCRIPTION:${reservation.nombre_adultes} adultes - ${reservation.source_reservation}\n`;
    ical += 'END:VEVENT\n';
  }
  
  ical += 'END:VCALENDAR';
  return ical;
}
```

---

**Cette règle métier est CRITIQUE pour le système de réservation channel manager et doit être respectée dans tous les workflows de booking.**