# Règles Métier - Validation Quotités Propriétaires

## 📋 Règle Business Critique

### **Quotités Propriétaires : SUM = 100% Obligatoire**

**Règle** : Pour chaque propriété, la somme des quotités de tous les propriétaires doit être exactement égale à 100%.

```sql
-- Contrainte Database
ALTER TABLE property_ownership 
ADD CONSTRAINT check_quotites_sum_100 
CHECK (
  (SELECT SUM(ownership_percentage) 
   FROM property_ownership 
   WHERE property_id = NEW.property_id) = 100
);
```

## 🎯 **Spécifications Techniques**

### **Validation Database (Supabase)**
```sql
-- Trigger de validation quotités
CREATE OR REPLACE FUNCTION validate_quotites_sum()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT SUM(ownership_percentage) 
      FROM property_ownership 
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)) != 100 
  THEN
    RAISE EXCEPTION 'La somme des quotités doit être exactement 100%%';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotites_validation_trigger
  AFTER INSERT OR UPDATE OR DELETE ON property_ownership
  FOR EACH ROW EXECUTE FUNCTION validate_quotites_sum();
```

### **Validation Frontend (TypeScript)**
```typescript
// Schema Zod pour validation quotités
export const quotitesValidationSchema = z.object({
  owners: z.array(z.object({
    owner_id: z.string().uuid(),
    ownership_percentage: z.number().min(0.01).max(100)
  }))
}).refine(
  (data) => {
    const sum = data.owners.reduce((acc, owner) => acc + owner.ownership_percentage, 0);
    return Math.abs(sum - 100) < 0.01; // Tolérance pour les décimales
  },
  {
    message: "La somme des quotités doit être exactement 100%",
    path: ["owners"]
  }
);

// Type TypeScript
export type QuotitesValidation = z.infer<typeof quotitesValidationSchema>;
```

## 🧪 **Tests Playwright Spécialisés**

### **Test Cases Business Rules**

#### **Test 1: Validation Somme Quotités Exacte**
```typescript
test('quotités somme exactement 100%', async ({ page }) => {
  // Navigation vers création propriété
  await page.goto('/proprietaires/new');
  
  // Ajout premier propriétaire
  await page.fill('[data-testid="owner-1-percentage"]', '60');
  await page.fill('[data-testid="owner-1-name"]', 'Jean Dupont');
  
  // Ajout deuxième propriétaire  
  await page.click('[data-testid="add-owner-button"]');
  await page.fill('[data-testid="owner-2-percentage"]', '40');
  await page.fill('[data-testid="owner-2-name"]', 'Marie Martin');
  
  // Validation somme = 100%
  await expect(page.locator('[data-testid="quotites-sum"]')).toHaveText('100%');
  await expect(page.locator('[data-testid="quotites-valid"]')).toBeVisible();
  
  // Submit doit réussir
  await page.click('[data-testid="submit-button"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

#### **Test 2: Rejet Somme Quotités Incorrecte**
```typescript
test('rejet somme quotités != 100%', async ({ page }) => {
  await page.goto('/proprietaires/new');
  
  // Configuration quotités incorrectes (95%)
  await page.fill('[data-testid="owner-1-percentage"]', '60');
  await page.click('[data-testid="add-owner-button"]');
  await page.fill('[data-testid="owner-2-percentage"]', '35');
  
  // Validation somme != 100%
  await expect(page.locator('[data-testid="quotites-sum"]')).toHaveText('95%');
  await expect(page.locator('[data-testid="quotites-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="quotites-error"]'))
    .toContainText('La somme des quotités doit être exactement 100%');
  
  // Submit doit être disabled
  await expect(page.locator('[data-testid="submit-button"]')).toBeDisabled();
});
```

#### **Test 3: Ajustement Dynamique Quotités**
```typescript
test('ajustement dynamique quotités', async ({ page }) => {
  await page.goto('/proprietaires/edit/123');
  
  // Modification quotité existante
  await page.fill('[data-testid="owner-1-percentage"]', '70'); // était 60%
  
  // Vérification ajustement automatique restant
  await expect(page.locator('[data-testid="owner-2-percentage"]')).toHaveValue('30');
  await expect(page.locator('[data-testid="quotites-sum"]')).toHaveText('100%');
  
  // Submit disponible après ajustement
  await expect(page.locator('[data-testid="submit-button"]')).not.toBeDisabled();
});
```

### **Edge Cases Testing**

#### **Test 4: Propriétaire Unique 100%**
```typescript
test('propriétaire unique doit avoir 100%', async ({ page }) => {
  await page.goto('/proprietaires/new');
  
  // Un seul propriétaire
  await page.fill('[data-testid="owner-1-percentage"]', '100');
  await page.fill('[data-testid="owner-1-name"]', 'Propriétaire Unique');
  
  // Validation immédiate
  await expect(page.locator('[data-testid="quotites-sum"]')).toHaveText('100%');
  await expect(page.locator('[data-testid="quotites-valid"]')).toBeVisible();
});
```

#### **Test 5: Décimales Précision**
```typescript
test('gestion précision décimales', async ({ page }) => {
  await page.goto('/proprietaires/new');
  
  // Quotités avec décimales
  await page.fill('[data-testid="owner-1-percentage"]', '33.33');
  await page.click('[data-testid="add-owner-button"]');
  await page.fill('[data-testid="owner-2-percentage"]', '33.33');
  await page.click('[data-testid="add-owner-button"]');
  await page.fill('[data-testid="owner-3-percentage"]', '33.34');
  
  // Validation somme avec décimales = 100%
  await expect(page.locator('[data-testid="quotites-sum"]')).toHaveText('100%');
  await expect(page.locator('[data-testid="quotites-valid"]')).toBeVisible();
});
```

## 🚨 **Scenarios d'Erreur**

### **Messages d'Erreur Standardisés**
```typescript
export const quotitesErrorMessages = {
  sumNotEqual100: "La somme des quotités doit être exactement 100%",
  percentageOutOfRange: "La quotité doit être entre 0,01% et 100%",
  missingOwner: "Au moins un propriétaire est requis",
  duplicateOwner: "Un propriétaire ne peut pas apparaître plusieurs fois",
  databaseConstraint: "Violation contrainte quotités en base de données"
} as const;
```

### **Gestion Erreurs Database**
```typescript
// Server Action avec gestion erreur quotités
export async function createPropertyOwnership(data: QuotitesValidation): Promise<ActionResult> {
  try {
    const validated = quotitesValidationSchema.parse(data);
    
    const { error } = await supabase
      .from('property_ownership')
      .insert(validated.owners);
    
    if (error?.message?.includes('quotités')) {
      return { 
        success: false, 
        error: quotitesErrorMessages.databaseConstraint 
      };
    }
    
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || quotitesErrorMessages.sumNotEqual100 
      };
    }
    throw error;
  }
}
```

## 📊 **Métriques & Monitoring**

### **KPIs Quotités**
- Taux de validation réussie quotités (objectif: >98%)
- Temps moyen saisie quotités (objectif: <2min)
- Nombre d'erreurs quotités par jour (objectif: <5)
- Temps résolution erreurs quotités (objectif: <30s)

### **Logging Events**
```typescript
// Events de logging pour monitoring
export const quotitesEvents = {
  QUOTITES_VALIDATION_SUCCESS: 'quotites.validation.success',
  QUOTITES_VALIDATION_ERROR: 'quotites.validation.error', 
  QUOTITES_AUTO_ADJUSTMENT: 'quotites.auto.adjustment',
  QUOTITES_DATABASE_ERROR: 'quotites.database.error'
} as const;
```

---

**Cette règle métier est CRITIQUE pour le fonctionnement de Want It Now et doit être testée dans tous les workflows impliquant des propriétaires multiples.**