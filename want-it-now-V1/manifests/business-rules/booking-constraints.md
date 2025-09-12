# Règles Métier - Contraintes Booking Exclusifs

## 📋 Règle Business Critique

### **Bookings Exclusifs : Property XOR Unit (Jamais les Deux)**

**Règle** : Un booking/transaction doit être lié SOIT à une propriété (si pas d'unités) SOIT à une unité (si unités), mais jamais aux deux simultanément.

```sql
-- Contrainte Database  
ALTER TABLE seasonal_bookings
ADD CONSTRAINT check_property_or_unit_exclusive 
CHECK (
  (property_id IS NOT NULL AND unit_id IS NULL) OR
  (property_id IS NULL AND unit_id IS NOT NULL)
);

ALTER TABLE transactions
ADD CONSTRAINT check_property_or_unit_exclusive_transactions
CHECK (
  (property_id IS NOT NULL AND unit_id IS NULL) OR  
  (property_id IS NULL AND unit_id IS NOT NULL)
);
```

## 🎯 **Spécifications Techniques**

### **Logique Métier**
```mermaid
graph TD
    A[Propriété] --> B{A des unités ?}
    B -->|Non| C[Booking sur property_id]
    B -->|Oui| D[Booking forcé sur unit_id]
    C --> E[property_id NOT NULL, unit_id NULL]
    D --> F[property_id NULL, unit_id NOT NULL]
    E --> G[✅ Valide]
    F --> G[✅ Valide]
    
    H[❌ Invalide] --> I[property_id ET unit_id NOT NULL]
    H --> J[property_id ET unit_id NULL]
```

### **Triggers Database (Supabase)**
```sql
-- Fonction validation exclusive property/unit
CREATE OR REPLACE FUNCTION validate_booking_exclusivity()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que un seul des deux est renseigné
  IF (NEW.property_id IS NOT NULL AND NEW.unit_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Un booking ne peut pas être lié à la fois à une propriété ET une unité';
  END IF;
  
  IF (NEW.property_id IS NULL AND NEW.unit_id IS NULL) THEN
    RAISE EXCEPTION 'Un booking doit être lié soit à une propriété soit à une unité';
  END IF;
  
  -- Si booking sur propriété, vérifier qu'elle n'a pas d'unités
  IF NEW.property_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM units 
      WHERE property_id = NEW.property_id 
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cette propriété a des unités. Le booking doit être créé sur une unité spécifique';
    END IF;
  END IF;
  
  -- Si booking sur unité, vérifier que l'unité existe et appartient à une propriété
  IF NEW.unit_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM units 
      WHERE id = NEW.unit_id 
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'L''unité spécifiée n''existe pas ou est supprimée';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer trigger sur tables bookings et transactions
CREATE TRIGGER booking_exclusivity_trigger
  BEFORE INSERT OR UPDATE ON seasonal_bookings
  FOR EACH ROW EXECUTE FUNCTION validate_booking_exclusivity();

CREATE TRIGGER transaction_exclusivity_trigger  
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION validate_booking_exclusivity();
```

### **Validation Frontend (TypeScript)**
```typescript
// Schema Zod pour validation booking exclusif
export const bookingExclusivitySchema = z.object({
  property_id: z.string().uuid().nullable(),
  unit_id: z.string().uuid().nullable(),
  // autres champs booking...
  start_date: z.date(),
  end_date: z.date(),
  guest_name: z.string().min(1)
}).refine(
  (data) => {
    // Un seul des deux doit être renseigné (XOR)
    return (data.property_id !== null) !== (data.unit_id !== null);
  },
  {
    message: "Un booking doit être lié soit à une propriété soit à une unité, pas les deux",
    path: ["property_id", "unit_id"]
  }
);

// Type pour booking avec validation
export type BookingWithExclusivity = z.infer<typeof bookingExclusivitySchema>;

// Helper function pour déterminer le type de booking
export function getBookingType(property: Property): 'property' | 'unit' {
  return property.units && property.units.length > 0 ? 'unit' : 'property';
}
```

## 🧪 **Tests Playwright Spécialisés**

### **Test Cases Business Rules**

#### **Test 1: Booking sur Propriété Sans Unités**
```typescript
test('booking sur propriété sans unités', async ({ page }) => {
  // Setup : propriété sans unités
  await page.goto('/properties/property-without-units/bookings/new');
  
  // Vérifier que seul property_id est disponible
  await expect(page.locator('[data-testid="property-field"]')).toBeVisible();
  await expect(page.locator('[data-testid="unit-field"]')).not.toBeVisible();
  
  // Créer booking
  await page.fill('[data-testid="guest-name"]', 'John Doe');
  await page.fill('[data-testid="start-date"]', '2025-06-01');
  await page.fill('[data-testid="end-date"]', '2025-06-07');
  
  // Submit réussi
  await page.click('[data-testid="submit-booking"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  
  // Vérifier en DB que property_id renseigné, unit_id null
  await page.goto('/bookings/list');
  await expect(page.locator('[data-testid="booking-property"]')).toBeVisible();
  await expect(page.locator('[data-testid="booking-unit"]')).toHaveText('N/A');
});
```

#### **Test 2: Booking Forcé sur Unité (Propriété avec Unités)**  
```typescript
test('booking forcé sur unité quand propriété a des unités', async ({ page }) => {
  // Setup : propriété avec 3 unités
  await page.goto('/properties/property-with-units/bookings/new');
  
  // Vérifier que selection unité est obligatoire
  await expect(page.locator('[data-testid="unit-selector"]')).toBeVisible();
  await expect(page.locator('[data-testid="property-field"]')).not.toBeVisible();
  
  // Affichage liste unités disponibles
  await expect(page.locator('[data-testid="unit-option"]')).toHaveCount(3);
  
  // Sélection unité spécifique
  await page.selectOption('[data-testid="unit-selector"]', 'unit-001');
  
  // Remplir booking
  await page.fill('[data-testid="guest-name"]', 'Marie Dupont');
  await page.fill('[data-testid="start-date"]', '2025-06-01');
  await page.fill('[data-testid="end-date"]', '2025-06-07');
  
  // Submit réussi
  await page.click('[data-testid="submit-booking"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  
  // Vérifier unit_id renseigné, property_id null
  await page.goto('/bookings/list');  
  await expect(page.locator('[data-testid="booking-unit"]')).toContainText('Unit 001');
  await expect(page.locator('[data-testid="booking-property"]')).toHaveText('N/A');
});
```

#### **Test 3: Prévention Double Attribution**
```typescript
test('prévention double attribution property ET unit', async ({ page }) => {
  // Tentative modification manuelle (cas edge développeur)
  await page.goto('/admin/bookings/debug');
  
  // Simuler tentative renseignement des deux champs
  await page.fill('[data-testid="debug-property-id"]', 'prop-123');
  await page.fill('[data-testid="debug-unit-id"]', 'unit-456');
  
  // Submit doit échouer
  await page.click('[data-testid="debug-submit"]');
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Un booking ne peut pas être lié à la fois à une propriété ET une unité');
  
  // Vérifier que rien n'est créé en DB
  await expect(page.locator('[data-testid="booking-created"]')).not.toBeVisible();
});
```

### **Edge Cases Testing**

#### **Test 4: Conversion Propriété → Unités**
```typescript
test('gestion conversion propriété vers unités', async ({ page }) => {
  // Créer booking sur propriété
  await page.goto('/properties/prop-conversion/bookings/new');
  await page.fill('[data-testid="guest-name"]', 'Test Guest');
  await page.fill('[data-testid="start-date"]', '2025-06-01'); 
  await page.fill('[data-testid="end-date"]', '2025-06-07');
  await page.click('[data-testid="submit-booking"]');
  
  // Vérifier booking créé sur property_id
  await page.goto('/bookings/list');
  await expect(page.locator('[data-testid="booking-property"]')).toBeVisible();
  
  // Admin ajoute des unités à la propriété
  await page.goto('/properties/prop-conversion/units');
  await page.click('[data-testid="add-unit"]');
  await page.fill('[data-testid="unit-name"]', 'Unit A');
  await page.click('[data-testid="save-unit"]');
  
  // Nouveaux bookings doivent maintenant être sur unités
  await page.goto('/properties/prop-conversion/bookings/new');
  await expect(page.locator('[data-testid="unit-selector"]')).toBeVisible();
  await expect(page.locator('[data-testid="property-field"]')).not.toBeVisible();
  
  // Anciens bookings restent valides sur property_id
  await page.goto('/bookings/list');
  await expect(page.locator('[data-testid="old-booking-property"]')).toBeVisible();
});
```

#### **Test 5: Validation Calendrier Conflit**
```typescript
test('validation conflits calendrier unit vs property', async ({ page }) => {
  // Booking existant sur unit A
  await page.goto('/properties/prop-units/units/unit-a/bookings/new');
  await page.fill('[data-testid="guest-name"]', 'Guest 1');
  await page.fill('[data-testid="start-date"]', '2025-06-01');
  await page.fill('[data-testid="end-date"]', '2025-06-07');  
  await page.click('[data-testid="submit-booking"]');
  
  // Tentative booking sur unit B même période (doit réussir - unités différentes)
  await page.goto('/properties/prop-units/units/unit-b/bookings/new');
  await page.fill('[data-testid="guest-name"]', 'Guest 2');
  await page.fill('[data-testid="start-date"]', '2025-06-01');
  await page.fill('[data-testid="end-date"]', '2025-06-07');
  await page.click('[data-testid="submit-booking"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  
  // Tentative booking sur unit A même période (doit échouer - conflit)  
  await page.goto('/properties/prop-units/units/unit-a/bookings/new');
  await page.fill('[data-testid="guest-name"]', 'Guest 3');
  await page.fill('[data-testid="start-date"]', '2025-06-05');
  await page.fill('[data-testid="end-date"]', '2025-06-10');
  await page.click('[data-testid="submit-booking"]');
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Conflit de dates avec une réservation existante');
});
```

## 🚨 **Messages d'Erreur Standardisés**
```typescript
export const bookingConstraintErrors = {
  bothPropertyAndUnit: "Un booking ne peut pas être lié à la fois à une propriété ET une unité",
  neitherPropertyNorUnit: "Un booking doit être lié soit à une propriété soit à une unité",
  propertyHasUnits: "Cette propriété a des unités. Le booking doit être créé sur une unité spécifique",
  unitNotFound: "L'unité spécifiée n'existe pas ou est supprimée",
  unitRequired: "Sélection d'une unité requise pour cette propriété",
  propertyRequired: "Cette propriété n'a pas d'unités, booking sur propriété requis"
} as const;
```

## 📊 **Phase Réservations (Future)**

### **Extensions Prévues**
```typescript
// Phase 6 - Système réservations avancé
interface ReservationSystem {
  // Gestion conflits automatisée
  conflictDetection: boolean;
  
  // Réservations multiples unités
  multiUnitBooking: boolean;
  
  // Calendrier intégré
  calendarIntegration: boolean;
  
  // Workflow approbation
  approvalWorkflow: boolean;
}
```

Cette règle métier est **CRITIQUE** pour la phase réservations et doit être implémentée avant tout développement du système de booking.