/**
 * Tests TDD pour la validation du wizard de contrats Want It Now
 * Basés sur les règles métier françaises et contraintes de la plateforme
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { z } from 'zod'
import { contratWizardSchema, stepValidationSchemas } from '@/lib/validations/contrats-wizard'
import {
  TEST_CONTRAT_SCENARIOS,
  TEST_EDGE_CASES,
  TEST_HELPERS
} from '@/test-data/contrats-test-data'

describe('Wizard Contrats - Validation Rules', () => {
  
  describe('Business Rules Validation', () => {
    
    it('RÈGLE: Autorisation sous-location obligatoire Want It Now', () => {
      // RED: Test qui doit échouer sans sous-location
      const dataWithoutAuthorization = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        autorisation_sous_location: false
      }
      
      const result = contratWizardSchema.safeParse(dataWithoutAuthorization)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'L\'autorisation de sous-location est obligatoire pour Want It Now',
              path: ['autorisation_sous_location']
            })
          ])
        )
      }
    })
    
    it('RÈGLE: Commission 10% fixe pour contrats variables', () => {
      // RED: Commission incorrecte pour contrat variable
      const dataWithIncorrectCommission = {
        ...TEST_CONTRAT_SCENARIOS.studio_paris_variable,
        type_contrat: 'variable' as const,
        commission_pourcentage: '15' // Devrait être 10%
      }
      
      const result = contratWizardSchema.safeParse(dataWithIncorrectCommission)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'La commission pour les contrats variables doit être de 10%'
            })
          ])
        )
      }
    })
    
    it('GREEN: Commission 10% acceptée pour contrats variables', () => {
      // GREEN: Configuration correcte
      const correctVariableContract = {
        ...TEST_CONTRAT_SCENARIOS.studio_paris_variable,
        type_contrat: 'variable' as const,
        commission_pourcentage: '10'
      }
      
      const result = contratWizardSchema.safeParse(correctVariableContract)
      expect(result.success).toBe(true)
    })
    
    it('RÈGLE: Usage propriétaire max 60 jours par an', () => {
      // RED: Dépassement limite usage propriétaire
      const dataWithExcessiveUsage = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        usage_proprietaire_jours_max: '75' // > 60 jours
      }
      
      const result = contratWizardSchema.safeParse(dataWithExcessiveUsage)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'L\'usage propriétaire ne peut pas dépasser 60 jours par an'
            })
          ])
        )
      }
    })
    
    it('GREEN: Usage propriétaire 60 jours accepté', () => {
      // GREEN: Configuration limite acceptée
      const dataWithMaxUsage = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        usage_proprietaire_jours_max: '60'
      }
      
      const result = contratWizardSchema.safeParse(dataWithMaxUsage)
      expect(result.success).toBe(true)
    })
  })

  describe('Step-by-Step Validation', () => {
    
    it('Étape 1: Sélection propriété OU unité (exclusivité)', () => {
      // RED: Ni propriété ni unité
      const noSelection = {}
      const resultNoSelection = stepValidationSchemas[1].safeParse(noSelection)
      expect(resultNoSelection.success).toBe(false)
      
      // RED: Propriété ET unité (interdit)
      const bothSelected = {
        propriete_id: 'prop_001',
        unite_id: 'unit_001'
      }
      const resultBoth = stepValidationSchemas[1].safeParse(bothSelected)
      expect(resultBoth.success).toBe(false)
      
      // GREEN: Propriété seulement
      const propertyOnly = { propriete_id: 'prop_001' }
      const resultProperty = stepValidationSchemas[1].safeParse(propertyOnly)
      expect(resultProperty.success).toBe(true)
      
      // GREEN: Unité seulement
      const unitOnly = { unite_id: 'unit_001' }
      const resultUnit = stepValidationSchemas[1].safeParse(unitOnly)
      expect(resultUnit.success).toBe(true)
    })
    
    it('Étape 2: Informations générales requises', () => {
      // RED: Champs manquants
      const incompleteData = {
        type_contrat: 'fixe' // Manque date_debut, date_fin, etc.
      }
      
      const result = stepValidationSchemas[2].safeParse(incompleteData)
      expect(result.success).toBe(false)
      
      // GREEN: Données complètes
      const completeData = {
        type_contrat: 'fixe' as const,
        date_debut: '2025-03-01',
        date_fin: '2026-02-28',
        meuble: true,
        autorisation_sous_location: true,
        besoin_renovation: false
      }
      
      const resultComplete = stepValidationSchemas[2].safeParse(completeData)
      expect(resultComplete.success).toBe(true)
    })
    
    it('Étape 3: Conditions financières requises', () => {
      // RED: Champs manquants
      const incompleteFinancial = {
        commission_pourcentage: '12'
        // Manque usage_proprietaire_jours_max
      }
      
      const result = stepValidationSchemas[3].safeParse(incompleteFinancial)
      expect(result.success).toBe(false)
      
      // GREEN: Conditions complètes
      const completeFinancial = {
        commission_pourcentage: '12',
        usage_proprietaire_jours_max: '45',
        loyer_mensuel_ht: '2500',
        charges_mensuelles: '200'
      }
      
      const resultComplete = stepValidationSchemas[3].safeParse(completeFinancial)
      expect(resultComplete.success).toBe(true)
    })
  })

  describe('Date Validation', () => {
    
    it('RÈGLE: Date fin doit être postérieure à date début', () => {
      // RED: Dates incohérentes
      const invalidDates = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        date_debut: '2025-12-01',
        date_fin: '2025-06-01' // Antérieure à début
      }
      
      const result = contratWizardSchema.safeParse(invalidDates)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'La date de fin doit être postérieure à la date de début',
              path: ['date_fin']
            })
          ])
        )
      }
    })
    
    it('GREEN: Dates cohérentes acceptées', () => {
      // GREEN: Dates correctes
      const validDates = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        date_debut: '2025-03-01',
        date_fin: '2026-02-28'
      }
      
      const result = contratWizardSchema.safeParse(validDates)
      expect(result.success).toBe(true)
    })
  })

  describe('Numeric Field Validation', () => {
    
    it('RÈGLE: Champs numériques doivent être des nombres valides', () => {
      // RED: Valeurs non numériques
      const invalidNumericData = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        commission_pourcentage: 'abc', // Non numérique
        usage_proprietaire_jours_max: 'invalid',
        loyer_mensuel_ht: 'not-a-number'
      }
      
      const result = contratWizardSchema.safeParse(invalidNumericData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        const numericErrors = result.error.issues.filter(err => 
          err.message === 'Doit être un nombre valide'
        )
        expect(numericErrors.length).toBeGreaterThan(0)
      }
    })
    
    it('RÈGLE: Jour de paiement doit être entre 1 et 31', () => {
      // RED: Jour invalide (> 31)
      const invalidDay = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        jour_paiement_loyer: '35'
      }
      
      const result = contratWizardSchema.safeParse(invalidDay)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Le jour doit être entre 1 et 31'
            })
          ])
        )
      }
    })
    
    it('GREEN: Valeurs numériques valides acceptées', () => {
      // GREEN: Tous les champs numériques corrects
      const validNumericData = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        commission_pourcentage: '12.5',
        usage_proprietaire_jours_max: '45',
        loyer_mensuel_ht: '2500.00',
        jour_paiement_loyer: '5'
      }
      
      const result = contratWizardSchema.safeParse(validNumericData)
      expect(result.success).toBe(true)
    })
  })

  describe('Edge Cases Validation', () => {
    
    it('Gestion des valeurs limites', () => {
      // Test valeurs limites acceptables
      const edgeCaseData = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        commission_pourcentage: '0.1', // Très faible mais valide
        usage_proprietaire_jours_max: '1', // Minimum
        jour_paiement_loyer: '31' // Maximum
      }
      
      const result = contratWizardSchema.safeParse(edgeCaseData)
      expect(result.success).toBe(true)
    })
    
    it('Gestion des champs optionnels vides', () => {
      // Test avec champs optionnels non renseignés
      const minimalData = {
        type_contrat: 'fixe' as const,
        date_debut: '2025-03-01',
        date_fin: '2026-02-28',
        autorisation_sous_location: true,
        meuble: true,
        besoin_renovation: false,
        commission_pourcentage: '12',
        usage_proprietaire_jours_max: '45'
        // Tous les autres champs optionnels omis
      }
      
      const result = contratWizardSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })
  })

  describe('Email Validation', () => {
    
    it('RÈGLE: Emails doivent être valides ou vides', () => {
      // RED: Email invalide
      const invalidEmail = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        bailleur_email: 'email-invalide' // Format incorrect
      }
      
      const result = contratWizardSchema.safeParse(invalidEmail)
      expect(result.success).toBe(false)
      
      // GREEN: Email valide
      const validEmail = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        bailleur_email: 'test@exemple.fr'
      }
      
      const resultValid = contratWizardSchema.safeParse(validEmail)
      expect(resultValid.success).toBe(true)
      
      // GREEN: Email vide accepté
      const emptyEmail = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        bailleur_email: ''
      }
      
      const resultEmpty = contratWizardSchema.safeParse(emptyEmail)
      expect(resultEmpty.success).toBe(true)
    })
  })

  describe('Contract Type Specific Validation', () => {
    
    it('Contrat Fixe: Validation champs spécifiques', () => {
      // Test que les champs de contrat fixe sont optionnels mais cohérents
      const fixeContract = {
        ...TEST_CONTRAT_SCENARIOS.villa_nice_fixe,
        type_contrat: 'fixe' as const,
        loyer_mensuel_ht: '2500',
        charges_mensuelles: '200',
        depot_garantie: '2500'
      }
      
      const result = contratWizardSchema.safeParse(fixeContract)
      expect(result.success).toBe(true)
    })
    
    it('Contrat Variable: Validation champs spécifiques', () => {
      // Test que les champs de contrat variable sont cohérents
      const variableContract = {
        ...TEST_CONTRAT_SCENARIOS.studio_paris_variable,
        type_contrat: 'variable' as const,
        commission_pourcentage: '10', // Obligatoire 10%
        estimation_revenus_mensuels: '3200',
        methode_calcul_revenus: 'revenus_nets'
      }
      
      const result = contratWizardSchema.safeParse(variableContract)
      expect(result.success).toBe(true)
    })
  })
})

describe('Wizard Contrats - Helper Functions', () => {
  
  it('TEST_HELPERS: Génération données aléatoires', () => {
    const randomData = TEST_HELPERS.generateRandomContractData({
      type_contrat: 'variable',
      commission_pourcentage: '10'
    })
    
    expect(randomData.type_contrat).toBe('variable')
    expect(randomData.commission_pourcentage).toBe('10')
    expect(randomData.date_debut).toBeDefined()
    expect(typeof randomData.date_debut).toBe('string')
  })
  
  it('TEST_HELPERS: Validation structure contrat', () => {
    const validStructure = TEST_HELPERS.validateContractStructure({
      type_contrat: 'fixe',
      date_debut: '2025-01-01',
      date_fin: '2025-12-31',
      autorisation_sous_location: true
    })
    
    expect(validStructure).toBe(true)
    
    const invalidStructure = TEST_HELPERS.validateContractStructure({
      type_contrat: 'fixe'
      // Champs manquants
    })
    
    expect(invalidStructure).toBe(false)
  })
  
  it('TEST_HELPERS: Mock réponse Supabase', () => {
    const successResponse = TEST_HELPERS.mockSupabaseResponse({ id: '123' })
    expect(successResponse.data).toEqual({ id: '123' })
    expect(successResponse.error).toBeNull()
    
    const errorResponse = TEST_HELPERS.mockSupabaseResponse(null, 'Erreur test')
    expect(errorResponse.data).toBeNull()
    expect(errorResponse.error).toEqual({ message: 'Erreur test' })
  })
})