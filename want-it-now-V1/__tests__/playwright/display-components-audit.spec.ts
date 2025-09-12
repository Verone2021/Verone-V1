import { test, expect } from '@playwright/test'

/**
 * Tests d'audit des composants d'affichage existants
 * 
 * OBJECTIF: Identifier les incohérences dans l'affichage actuel
 * des données propriétés/unités/quotités
 */
test.describe('Audit Composants Affichage - Détection Incohérences', () => {

  test.beforeEach(async ({ page }) => {
    // Navigation initiale
    await page.goto('http://localhost:3000/proprietes')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Audit Pages Propriétés Existantes', () => {
    
    test('Audit propriété existante - vérification tous champs', async ({ page }) => {
      // Cliquer sur première propriété de la liste
      const firstPropertyLink = page.locator('[data-testid="property-link"]').first()
      if (await firstPropertyLink.count() > 0) {
        await firstPropertyLink.click()
        await page.waitForLoadState('networkidle')
        
        // Capture état actuel
        await page.screenshot({ 
          path: '.playwright-mcp/property-current-state-audit.png',
          fullPage: true 
        })
        
        // AUDIT SYSTÉMATIQUE DE L'AFFICHAGE
        
        console.log('=== AUDIT PROPRIÉTÉ EXISTANTE ===')
        
        // 1. Vérifier titre propriété
        const title = await page.locator('h1').first()
        if (await title.count() > 0) {
          const titleText = await title.textContent()
          console.log('✅ Titre trouvé:', titleText)
        } else {
          console.log('❌ PROBLÈME: Aucun titre h1 trouvé')
        }
        
        // 2. Chercher badge type propriété
        const typeBadge = page.locator('[data-testid="property-type-badge"]')
        if (await typeBadge.count() > 0) {
          const typeText = await typeBadge.textContent()
          console.log('✅ Type propriété affiché:', typeText)
        } else {
          console.log('❌ PROBLÈME: Badge type propriété manquant')
          // Chercher alternatives
          const altTypeBadges = page.locator('.badge, [class*="badge"], [class*="type"]')
          const altCount = await altTypeBadges.count()
          console.log(`🔍 Alternatives type trouvées: ${altCount}`)
        }
        
        // 3. Vérifier affichage adresse
        const addressDisplay = page.locator('[data-testid="property-full-address"]')
        if (await addressDisplay.count() > 0) {
          const addressText = await addressDisplay.textContent()
          console.log('✅ Adresse complète:', addressText)
          
          // CRITIQUE: Vérifier présence pays
          if (addressText?.includes('France') || addressText?.includes('FR')) {
            console.log('✅ PAYS TROUVÉ dans adresse')
          } else {
            console.log('❌ PROBLÈME CRITIQUE: Pays non affiché dans adresse')
          }
        } else {
          console.log('❌ PROBLÈME: Affichage adresse manquant')
          // Chercher alternatives
          const altAddress = page.locator('[class*="address"], [data-testid*="address"]')
          const altCount = await altAddress.count()
          console.log(`🔍 Alternatives adresse trouvées: ${altCount}`)
        }
        
        // 4. Vérifier spécifications techniques
        const surfaceDisplay = page.locator('[data-testid="property-surface-display"]')
        if (await surfaceDisplay.count() > 0) {
          const surfaceText = await surfaceDisplay.textContent()
          console.log('✅ Superficie affichée:', surfaceText)
        } else {
          console.log('❌ PROBLÈME: Superficie non affichée')
        }
        
        const roomsDisplay = page.locator('[data-testid="property-rooms-display"]')
        if (await roomsDisplay.count() > 0) {
          const roomsText = await roomsDisplay.textContent()
          console.log('✅ Pièces affichées:', roomsText)
        } else {
          console.log('❌ PROBLÈME: Nombre de pièces non affiché')
        }
        
        // 5. Vérifier description
        const descriptionDisplay = page.locator('[data-testid="property-description-display"]')
        if (await descriptionDisplay.count() > 0) {
          const descText = await descriptionDisplay.textContent()
          console.log('✅ Description trouvée, longueur:', descText?.length || 0)
        } else {
          console.log('❌ PROBLÈME: Description non affichée')
        }
        
      } else {
        console.log('❌ Aucune propriété trouvée pour audit')
      }
    })
    
    test('Audit spécifique - recherche affichage pays', async ({ page }) => {
      // Aller sur une propriété
      const firstProperty = page.locator('[data-testid="property-link"]').first()
      if (await firstProperty.count() > 0) {
        await firstProperty.click()
        await page.waitForLoadState('networkidle')
        
        console.log('=== AUDIT SPÉCIFIQUE AFFICHAGE PAYS ===')
        
        // Recherche exhaustive mot "France"
        const pageContent = await page.content()
        const franceMatches = (pageContent.match(/France/gi) || []).length
        const frMatches = (pageContent.match(/\bFR\b/g) || []).length
        
        console.log(`🔍 Occurrences "France" trouvées: ${franceMatches}`)
        console.log(`🔍 Occurrences "FR" trouvées: ${frMatches}`)
        
        if (franceMatches > 0 || frMatches > 0) {
          console.log('✅ Pays présent quelque part dans la page')
        } else {
          console.log('❌ PROBLÈME CRITIQUE: Pays absent de la page')
        }
        
        // Rechercher tous éléments contenant pays
        const franceElements = page.locator(':has-text("France")')
        const franceCount = await franceElements.count()
        
        console.log(`🔍 Éléments HTML contenant "France": ${franceCount}`)
        
        for (let i = 0; i < Math.min(franceCount, 5); i++) {
          const element = franceElements.nth(i)
          const tagName = await element.evaluate(el => el.tagName)
          const text = await element.textContent()
          const classes = await element.evaluate(el => el.className)
          
          console.log(`  - ${tagName} [${classes}]: "${text}"`)
        }
        
        // Screenshot avec highlight pays
        if (franceCount > 0) {
          await franceElements.first().highlight()
          await page.screenshot({ 
            path: '.playwright-mcp/country-display-found.png',
            fullPage: true 
          })
        }
      }
    })
    
  })
  
  test.describe('Audit Formulaires vs Affichage', () => {
    
    test('Comparaison champs formulaire création vs affichage détail', async ({ page }) => {
      console.log('=== AUDIT FORMULAIRES VS AFFICHAGE ===')
      
      // 1. Auditer formulaire création
      await page.click('[data-testid="create-property-button"]')
      await page.waitForLoadState('networkidle')
      
      // Capturer structure formulaire
      const formFields = await page.locator('input, select, textarea').all()
      const formFieldsData = []
      
      for (const field of formFields) {
        const testId = await field.getAttribute('data-testid')
        const placeholder = await field.getAttribute('placeholder')
        const type = await field.getAttribute('type')
        const tagName = await field.evaluate(el => el.tagName)
        
        if (testId) {
          formFieldsData.push({
            testId,
            placeholder,
            type,
            tagName
          })
        }
      }
      
      console.log('📋 Champs formulaire détectés:')
      formFieldsData.forEach(field => {
        console.log(`  - ${field.testId} (${field.tagName}:${field.type})`)
      })
      
      // 2. Revenir à la liste et aller sur détail
      await page.goBack()
      const firstProperty = page.locator('[data-testid="property-link"]').first()
      
      if (await firstProperty.count() > 0) {
        await firstProperty.click()
        await page.waitForLoadState('networkidle')
        
        // Chercher éléments d'affichage correspondants
        console.log('🔍 Recherche éléments affichage correspondants:')
        
        for (const formField of formFieldsData) {
          const displayTestId = formField.testId.replace('-input', '-display')
                                               .replace('-select', '-display')
          
          const displayElement = page.locator(`[data-testid="${displayTestId}"]`)
          const exists = await displayElement.count() > 0
          
          if (exists) {
            const text = await displayElement.textContent()
            console.log(`  ✅ ${formField.testId} → ${displayTestId}: "${text}"`)
          } else {
            console.log(`  ❌ ${formField.testId} → ${displayTestId}: MANQUANT`)
          }
        }
      }
      
      // Screenshot comparaison
      await page.screenshot({ 
        path: '.playwright-mcp/form-vs-display-audit.png',
        fullPage: true 
      })
    })
    
  })
  
  test.describe('Audit Unités - Cohérence Affichage', () => {
    
    test('Audit propriété avec unités - vérification affichage complet', async ({ page }) => {
      // Chercher propriété avec unités
      const propertyWithUnits = page.locator('[data-testid*="with-units"], [title*="unité"], [title*="unit"]').first()
      
      if (await propertyWithUnits.count() > 0) {
        await propertyWithUnits.click()
        await page.waitForLoadState('networkidle')
        
        console.log('=== AUDIT UNITÉS ===')
        
        // Vérifier onglet unités
        const unitsTab = page.locator('[data-testid="units-tab"], [role="tab"]:has-text("Unité")')
        if (await unitsTab.count() > 0) {
          await unitsTab.click()
          await page.waitForLoadState('networkidle')
          
          // Compter unités affichées
          const unitCards = page.locator('[data-testid*="unit-card"], .unit-card, [class*="unit"]')
          const unitCount = await unitCards.count()
          
          console.log(`🏠 Unités trouvées: ${unitCount}`)
          
          if (unitCount > 0) {
            // Auditer première unité
            const firstUnit = unitCards.first()
            
            // Chercher nom unité
            const unitName = firstUnit.locator('h3, h4, [data-testid*="unit-name"]')
            if (await unitName.count() > 0) {
              const nameText = await unitName.textContent()
              console.log('✅ Nom unité:', nameText)
            }
            
            // Chercher type unité
            const unitType = firstUnit.locator('[data-testid*="type"], .badge, [class*="badge"]')
            if (await unitType.count() > 0) {
              const typeText = await unitType.textContent()
              console.log('✅ Type unité:', typeText)
            }
            
            // Chercher superficie
            const unitSurface = firstUnit.locator('[data-testid*="surface"], :has-text("m²")')
            if (await unitSurface.count() > 0) {
              const surfaceText = await unitSurface.textContent()
              console.log('✅ Superficie unité:', surfaceText)
            }
            
            // Screenshot unité
            await page.screenshot({ 
              path: '.playwright-mcp/unit-display-audit.png',
              fullPage: true 
            })
          }
        }
      } else {
        console.log('❌ Aucune propriété avec unités trouvée')
      }
    })
    
  })

  test.describe('Audit Quotités - Données Propriétaires', () => {
    
    test('Audit affichage quotités propriétaires', async ({ page }) => {
      const firstProperty = page.locator('[data-testid="property-link"]').first()
      
      if (await firstProperty.count() > 0) {
        await firstProperty.click()
        await page.waitForLoadState('networkidle')
        
        console.log('=== AUDIT QUOTITÉS ===')
        
        // Chercher onglet quotités/propriétaires
        const quotitesTab = page.locator('[data-testid="quotites-tab"], [role="tab"]:has-text("Propriétaire"), [role="tab"]:has-text("Quotité")')
        
        if (await quotitesTab.count() > 0) {
          await quotitesTab.click()
          await page.waitForLoadState('networkidle')
          
          // Chercher tableaux/listes propriétaires
          const ownerElements = page.locator('[data-testid*="owner"], [class*="owner"], [data-testid*="quotite"]')
          const ownerCount = await ownerElements.count()
          
          console.log(`👥 Propriétaires trouvés: ${ownerCount}`)
          
          if (ownerCount > 0) {
            // Auditer premier propriétaire
            const firstOwner = ownerElements.first()
            
            // Nom propriétaire
            const ownerName = firstOwner.locator('[data-testid*="name"], h3, h4, strong, .font-medium')
            if (await ownerName.count() > 0) {
              const nameText = await ownerName.textContent()
              console.log('✅ Nom propriétaire:', nameText)
            }
            
            // Pourcentage
            const percentage = firstOwner.locator('[data-testid*="percentage"], :has-text("%")')
            if (await percentage.count() > 0) {
              const percentText = await percentage.textContent()
              console.log('✅ Pourcentage:', percentText)
            }
            
            // Type propriétaire
            const ownerType = firstOwner.locator('[data-testid*="type"], .badge')
            if (await ownerType.count() > 0) {
              const typeText = await ownerType.textContent()
              console.log('✅ Type propriétaire:', typeText)
            }
            
            // Screenshot quotités
            await page.screenshot({ 
              path: '.playwright-mcp/quotites-display-audit.png',
              fullPage: true 
            })
          }
        }
      }
    })
    
  })

  test.describe('Audit Général - Structure Page', () => {
    
    test('Audit structure complète page détail propriété', async ({ page }) => {
      const firstProperty = page.locator('[data-testid="property-link"]').first()
      
      if (await firstProperty.count() > 0) {
        await firstProperty.click()
        await page.waitForLoadState('networkidle')
        
        console.log('=== AUDIT STRUCTURE COMPLÈTE ===')
        
        // 1. Analyser structure onglets
        const tabs = page.locator('[role="tab"], [data-testid*="tab"]')
        const tabCount = await tabs.count()
        console.log(`📋 Onglets trouvés: ${tabCount}`)
        
        for (let i = 0; i < tabCount; i++) {
          const tab = tabs.nth(i)
          const tabText = await tab.textContent()
          console.log(`  - Onglet ${i + 1}: "${tabText}"`)
        }
        
        // 2. Analyser sections principales
        const sections = page.locator('section, [role="region"], .section, [class*="section"]')
        const sectionCount = await sections.count()
        console.log(`📄 Sections trouvées: ${sectionCount}`)
        
        // 3. Analyser présence données critiques
        const criticalData = {
          title: await page.locator('h1').count(),
          address: await page.locator('[data-testid*="address"], :has-text("rue"), :has-text("avenue")').count(),
          surface: await page.locator(':has-text("m²")').count(),
          country: await page.locator(':has-text("France"), :has-text("FR")').count(),
          price: await page.locator(':has-text("€")').count(),
          percentage: await page.locator(':has-text("%")').count()
        }
        
        console.log('📊 Données critiques détectées:', criticalData)
        
        // Screenshot structure complète
        await page.screenshot({ 
          path: '.playwright-mcp/complete-structure-audit.png',
          fullPage: true 
        })
        
        // Générer rapport détaillé
        console.log('=== RAPPORT FINAL AUDIT ===')
        
        let issues = []
        
        if (criticalData.title === 0) issues.push('❌ CRITIQUE: Pas de titre h1')
        if (criticalData.address === 0) issues.push('❌ CRITIQUE: Pas d\'affichage adresse')
        if (criticalData.country === 0) issues.push('❌ CRITIQUE: Pays non affiché')
        if (criticalData.surface === 0) issues.push('⚠️ Surface non affichée')
        
        if (issues.length === 0) {
          console.log('✅ SUCCÈS: Tous éléments critiques présents')
        } else {
          console.log('❌ PROBLÈMES DÉTECTÉS:')
          issues.forEach(issue => console.log(issue))
        }
      }
    })
    
  })

})