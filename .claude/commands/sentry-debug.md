# 🚀 Sentry Debug Template - Workflow Professionnel 2025

## **RÈGLE ABSOLUE**
**JAMAIS déclarer le succès sans validation console complète**

## **Processus Obligatoire**

### 1. **Think Phase**
- Analyser l'erreur avec `mcp__sequential-thinking__sequentialthinking`
- Identifier le contexte et la cause racine
- Planifier la correction avec TodoWrite

### 2. **Validate Phase**
```typescript
import { validateSentryConnection, displayValidationStatus } from '@/lib/validation/sentry-validation'

// Validation OBLIGATOIRE avant toute action
const validation = await validateSentryConnection()
displayValidationStatus(validation)

if (validation.status === 'critical') {
  throw new Error('❌ Validation Sentry échouée - Arrêt immédiat')
}
```

### 3. **Debug Phase**
```bash
# Vérification console (OBLIGATOIRE)
mcp__playwright__browser_console_messages

# Vérification indicateur rouge (OBLIGATOIRE)
# Si indicateur rouge présent : CLIQUER DESSUS IMMÉDIATEMENT
# Analyser chaque erreur avec "Next"/"Previous"
```

### 4. **Fix Phase**
- Corriger le code identifié
- Tester la correction localement
- Vérifier 0 erreur console

### 5. **Verify Phase**
```typescript
// Re-validation post-correction (OBLIGATOIRE)
const postFixValidation = await validateSentryConnection()
displayValidationStatus(postFixValidation)

// SUCCESS seulement si :
// ✅ validation.status !== 'critical'
// ✅ 0 erreur console visible
// ✅ Indicateur rouge disparu
```

## **Templates d'Analyse**

### **Context-Driven Analysis**
```typescript
// Corrélation erreur → code
const errorAnalysis = {
  errorId: 'VERONE-BACKOFFICE-XX',
  errorType: 'API/Component/Database',
  relatedFiles: ['src/...'],
  possibleCauses: ['...'],
  suggestedFix: '...'
}
```

### **Reset Intelligence**
```typescript
// Reset intelligent avec validation préalable
if (validation.status === 'healthy') {
  await sentryDetector.resetErrorCounter()
  console.log('✅ Reset Sentry autorisé - Statut healthy confirmé')
} else {
  console.warn('⚠️ Reset refusé - Résoudre erreurs critiques avant reset')
}
```

## **Workflow Standards 2025**

1. **Think** → Sequential Thinking Tool
2. **Test** → Console + Visual Indicators
3. **Code** → Correction ciblée
4. **Verify** → Re-validation complète

**❌ INTERDIT** : Déclarer "fonctionne" sans les 4 étapes

## **Emergency Checklist**

- [ ] Console messages vérifiées
- [ ] Indicateur rouge vérifié/cliqué
- [ ] Validation Sentry executée
- [ ] Status ≠ 'critical' confirmé
- [ ] Erreurs corrigées et testées
- [ ] Re-validation post-fix OK

**Success = Toutes cases cochées**