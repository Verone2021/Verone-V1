# ✅ Data Validation Vérone Back Office

## 🎯 **VALIDATION STRATEGY OVERVIEW**

### **🛡️ Defense-in-Depth Validation**
```typescript
// Validation à 4 niveaux
const VALIDATION_LAYERS = {
  1: 'client_side',      // UX validation immédiate
  2: 'api_gateway',      // Validation API entrée
  3: 'business_logic',   // Validation règles métier
  4: 'database_constraints' // Contraintes DB finales
}
```

### **📊 Validation Metrics**
```typescript
const VALIDATION_TARGETS = {
  // Performance validation
  client_validation_time: 50,     // <50ms validation client
  api_validation_time: 100,       // <100ms validation API
  error_rate: 0.01,              // <1% erreurs validation

  // Data quality
  data_completeness: 0.95,       // 95% données complètes
  data_accuracy: 0.98,           // 98% données exactes
  duplicate_rate: 0.02,          // <2% doublons

  // User experience
  validation_feedback_time: 200, // <200ms feedback utilisateur
  error_message_clarity: 0.9,   // 90% messages clairs
  form_completion_rate: 0.85     // 85% forms complétés
}
```

## 🔤 **INPUT VALIDATION RULES**

### **👤 User Data Validation**
```typescript
// Validation utilisateurs
const USER_VALIDATION = {
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    max_length: 255,
    required: true,
    unique: true,
    sanitization: 'email_normalize',
    examples: {
      valid: ['user@verone.fr', 'test.user+tag@domain.com'],
      invalid: ['invalid-email', 'user@', '@domain.com']
    }
  },

  nom: {
    regex: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
    min_length: 2,
    max_length: 50,
    required: true,
    sanitization: 'trim_normalize_case',
    examples: {
      valid: ['Dupont', 'Jean-Pierre', "O'Connor"],
      invalid: ['J', 'Nom123', 'Nom-avec-chiffres1']
    }
  },

  prenom: {
    regex: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
    min_length: 2,
    max_length: 50,
    required: true,
    sanitization: 'trim_normalize_case',
    examples: {
      valid: ['Marie', 'Jean-Claude', 'José'],
      invalid: ['M', 'Prénom123', '']
    }
  },

  telephone: {
    regex: /^(?:\+33|0)[1-9](?:[0-9]{8})$/,
    format: 'french_mobile',
    required: false,
    sanitization: 'phone_normalize',
    examples: {
      valid: ['+33123456789', '0123456789'],
      invalid: ['123456789', '+1234567890', '01 23 45 67 89']
    }
  },

  mot_de_passe: {
    min_length: 12,
    max_length: 128,
    patterns: [
      /[a-z]/,           // Minuscule
      /[A-Z]/,           // Majuscule
      /[0-9]/,           // Chiffre
      /[!@#$%^&*(),.?":{}|<>]/ // Symbole
    ],
    forbidden_patterns: [
      /(.)\1{3,}/,       // Pas 4+ caractères identiques
      /123456/,          // Pas séquences numériques
      /azerty|qwerty/i   // Pas motifs clavier
    ],
    entropy_minimum: 60, // 60 bits entropie minimum
    examples: {
      valid: ['MonMotDePasse123!', 'Vérone2025@Secure'],
      invalid: ['password', '123456789', 'azerty123']
    }
  }
}
```

### **📦 Product Data Validation**
```typescript
// Validation produits
const PRODUCT_VALIDATION = {
  nom: {
    regex: /^[\w\s\-À-ÿ()\/&'.]+$/,
    min_length: 3,
    max_length: 200,
    required: true,
    unique_per_famille: true,
    sanitization: 'trim_html_escape',
    examples: {
      valid: ['Canapé 3 places', 'Table basse (chêne)', 'Étagère murale'],
      invalid: ['Ab', '<script>alert()</script>', 'Nom@#$%^&*']
    }
  },

  description: {
    max_length: 2000,
    required: false,
    html_allowed: false,
    sanitization: 'html_strip_trim',
    markdown_support: true,
    examples: {
      valid: ['Canapé confortable en cuir véritable', '**Nouveauté** - Table design'],
      invalid: ['<iframe src="malicious"></iframe>']
    }
  },

  prix_unitaire: {
    type: 'decimal',
    min_value: 0.01,
    max_value: 999999.99,
    decimal_places: 2,
    required: true,
    currency: 'EUR',
    examples: {
      valid: [29.99, 1500.00, 15000.50],
      invalid: [-10.00, 0, 'invalid', 1000000]
    }
  },

  sku: {
    regex: /^[A-Z0-9\-]{6,20}$/,
    required: true,
    unique: true,
    format: 'uppercase',
    examples: {
      valid: ['CANAPE-001', 'TABLE-BASSE-123', 'ETG-MUR-456'],
      invalid: ['can-001', 'TOOLONG-SKU-123456789', 'sku with spaces']
    }
  },

  dimensions: {
    longueur: {
      type: 'decimal',
      min_value: 0.1,
      max_value: 1000.0,
      decimal_places: 1,
      unit: 'cm',
      required: false
    },
    largeur: {
      type: 'decimal',
      min_value: 0.1,
      max_value: 1000.0,
      decimal_places: 1,
      unit: 'cm',
      required: false
    },
    hauteur: {
      type: 'decimal',
      min_value: 0.1,
      max_value: 500.0,
      decimal_places: 1,
      unit: 'cm',
      required: false
    }
  },

  poids: {
    type: 'decimal',
    min_value: 0.1,
    max_value: 5000.0,
    decimal_places: 1,
    unit: 'kg',
    required: false,
    examples: {
      valid: [5.5, 120.0, 0.5],
      invalid: [-1, 0, 10000]
    }
  }
}
```

### **🗂️ Collection Data Validation**
```typescript
// Validation collections
const COLLECTION_VALIDATION = {
  nom: {
    regex: /^[\w\s\-À-ÿ()\/&'.]+$/,
    min_length: 3,
    max_length: 100,
    required: true,
    unique_per_user: true,
    sanitization: 'trim_html_escape',
    examples: {
      valid: ['Collection Salon 2025', 'Mobilier Bureau (Moderne)'],
      invalid: ['Co', '<script>', 'Collection-avec-trop-de-caractères-pour-être-valide']
    }
  },

  description: {
    max_length: 500,
    required: false,
    html_allowed: false,
    sanitization: 'html_strip_trim',
    examples: {
      valid: ['Sélection mobilier pour projet client'],
      invalid: ['<iframe>malicious</iframe>']
    }
  },

  produits: {
    type: 'array',
    min_items: 1,
    max_items: 200,
    item_validation: 'valid_product_id',
    unique_items: true,
    examples: {
      valid: [['prod-1', 'prod-2'], ['prod-123']],
      invalid: [[], ['invalid-id'], Array(201).fill('prod-1')]
    }
  },

  statut: {
    enum: ['brouillon', 'active', 'partagee', 'archivee'],
    required: true,
    default: 'brouillon',
    examples: {
      valid: ['brouillon', 'active'],
      invalid: ['invalid-status', 'draft']
    }
  },

  date_expiration: {
    type: 'datetime',
    min_value: 'now',
    max_value: 'now+1year',
    required_if: 'statut=partagee',
    format: 'ISO8601',
    examples: {
      valid: ['2025-12-31T23:59:59Z'],
      invalid: ['2024-01-01T00:00:00Z', 'invalid-date']
    }
  }
}
```

## 🔄 **BUSINESS RULES VALIDATION**

### **💰 Pricing Business Rules**
```typescript
// Validation règles tarifaires
const PRICING_VALIDATION = {
  remise_maximum: {
    b2b: {
      max_percentage: 40,
      validation: (prix_base, prix_remise) => {
        const remise = ((prix_base - prix_remise) / prix_base) * 100
        return remise <= 40
      },
      error_message: 'La remise B2B ne peut pas dépasser 40%'
    },
    b2c: {
      max_percentage: 20,
      validation: (prix_base, prix_remise) => {
        const remise = ((prix_base - prix_remise) / prix_base) * 100
        return remise <= 20
      },
      error_message: 'La remise B2C ne peut pas dépasser 20%'
    }
  },

  prix_coherence: {
    validation: (produit) => {
      // Vérification cohérence prix/famille
      const famille = getFamilleProduit(produit.famille_id)
      const prix_moyenne_famille = famille.prix_moyen
      const ecart_max = prix_moyenne_famille * 0.5 // 50% écart max

      return Math.abs(produit.prix - prix_moyenne_famille) <= ecart_max
    },
    error_message: 'Prix incohérent avec la moyenne de la famille de produits'
  },

  quantite_minimale: {
    validation: (produit, quantite) => {
      // Validation MOQ (Minimum Order Quantity)
      return quantite >= produit.moq
    },
    error_message: 'Quantité inférieure au minimum de commande'
  }
}
```

### **📦 Stock & Availability Rules**
```typescript
// Validation règles stock
const STOCK_VALIDATION = {
  disponibilite: {
    en_stock: {
      validation: (produit) => produit.stock_physique > 0,
      message: 'Produit en stock'
    },
    sur_commande: {
      validation: (produit) => {
        return produit.stock_physique === 0 &&
               produit.stock_previsionnel > 0 &&
               produit.delai_approvisionnement <= 30
      },
      message: 'Disponible sur commande sous 30 jours'
    },
    rupture: {
      validation: (produit) => {
        return produit.stock_physique === 0 &&
               (produit.stock_previsionnel === 0 ||
                produit.delai_approvisionnement > 30)
      },
      message: 'Produit en rupture de stock'
    }
  },

  stock_coherence: {
    validation: (stock_physique, stock_reserve, stock_disponible) => {
      return stock_disponible === (stock_physique - stock_reserve) &&
             stock_reserve >= 0 &&
             stock_physique >= 0
    },
    error_message: 'Incohérence dans les données de stock'
  }
}
```

### **🔗 Relationship Validation**
```typescript
// Validation relations entités
const RELATIONSHIP_VALIDATION = {
  produit_famille: {
    validation: async (produit_id, famille_id) => {
      const famille = await getFamille(famille_id)
      return famille && famille.actif === true
    },
    error_message: 'Famille de produits invalide ou inactive'
  },

  produit_categorie: {
    validation: async (produit_id, categorie_id, famille_id) => {
      const categorie = await getCategorie(categorie_id)
      return categorie &&
             categorie.famille_id === famille_id &&
             categorie.actif === true
    },
    error_message: 'Catégorie incompatible avec la famille sélectionnée'
  },

  collection_produits: {
    validation: async (collection_id, produit_ids) => {
      const produits = await getProduits(produit_ids)
      const organisation_id = await getCollectionOrganisation(collection_id)

      return produits.every(p =>
        p.organisation_id === organisation_id &&
        p.actif === true
      )
    },
    error_message: 'Certains produits ne sont pas accessibles ou inactifs'
  },

  user_organisation: {
    validation: async (user_id, organisation_id) => {
      const assignment = await getUserOrganisationAssignment(user_id, organisation_id)
      return assignment && assignment.statut === 'actif'
    },
    error_message: 'Utilisateur non autorisé pour cette organisation'
  }
}
```

## 🛡️ **SANITIZATION & SECURITY**

### **🧹 Data Sanitization**
```typescript
// Fonctions sanitization
const SANITIZATION_FUNCTIONS = {
  // Text sanitization
  trim_normalize_case: (input: string) => {
    return input.trim()
                .replace(/\s+/g, ' ')
                .split(' ')
                .map(word =>
                  word.charAt(0).toUpperCase() +
                  word.slice(1).toLowerCase()
                )
                .join(' ')
  },

  html_strip_trim: (input: string) => {
    return input.replace(/<[^>]*>/g, '')
                .trim()
                .replace(/\s+/g, ' ')
  },

  email_normalize: (email: string) => {
    return email.toLowerCase()
                .trim()
                .replace(/\+.*@/, '@') // Remove + aliases
  },

  phone_normalize: (phone: string) => {
    return phone.replace(/[^\d+]/g, '')
                .replace(/^0/, '+33')
  },

  // SQL injection prevention
  sql_escape: (input: string) => {
    return input.replace(/'/g, "''")
                .replace(/;/g, '\\;')
                .replace(/--/g, '\\-\\-')
  },

  // XSS prevention
  xss_prevent: (input: string) => {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    }

    return input.replace(/[&<>"'\/]/g, char => entityMap[char])
  }
}
```

### **🔍 Injection Attack Prevention**
```typescript
// Prévention attaques injection
const INJECTION_PREVENTION = {
  // SQL injection detection
  sql_injection_patterns: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+=\d+)/i,
    /(;|\-\-|\/\*|\*\/)/,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|IFRAME|OBJECT|EMBED)\b)/i
  ],

  // XSS detection patterns
  xss_patterns: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<\s*\w+\s+on\w+/gi
  ],

  // Path traversal prevention
  path_traversal_patterns: [
    /\.\./,
    /\.\.\//,
    /\.\.\\\\,
    /%2e%2e%2f/gi,
    /%252e%252e%252f/gi
  ],

  // Validation function
  detect_injection: (input: string) => {
    const patterns = [
      ...INJECTION_PREVENTION.sql_injection_patterns,
      ...INJECTION_PREVENTION.xss_patterns,
      ...INJECTION_PREVENTION.path_traversal_patterns
    ]

    return patterns.some(pattern => pattern.test(input))
  }
}
```

## 📊 **VALIDATION ERROR HANDLING**

### **🎯 Error Response Format**
```typescript
// Format standardisé erreurs validation
interface ValidationError {
  field: string
  code: string
  message: string
  value?: any
  suggestion?: string
}

interface ValidationResponse {
  success: boolean
  errors: ValidationError[]
  warnings?: ValidationError[]
  data?: any
}

// Exemples erreurs validation
const VALIDATION_ERRORS = {
  REQUIRED_FIELD: {
    code: 'REQUIRED_FIELD',
    message: 'Ce champ est obligatoire',
    suggestion: 'Veuillez renseigner ce champ'
  },

  INVALID_FORMAT: {
    code: 'INVALID_FORMAT',
    message: 'Format invalide',
    suggestion: 'Veuillez vérifier le format attendu'
  },

  TOO_LONG: {
    code: 'TOO_LONG',
    message: 'Valeur trop longue',
    suggestion: 'Réduisez la longueur du texte'
  },

  TOO_SHORT: {
    code: 'TOO_SHORT',
    message: 'Valeur trop courte',
    suggestion: 'Augmentez la longueur du texte'
  },

  DUPLICATE_VALUE: {
    code: 'DUPLICATE_VALUE',
    message: 'Cette valeur existe déjà',
    suggestion: 'Utilisez une valeur unique'
  },

  BUSINESS_RULE_VIOLATION: {
    code: 'BUSINESS_RULE_VIOLATION',
    message: 'Violation des règles métier',
    suggestion: 'Vérifiez les contraintes business'
  },

  SECURITY_VIOLATION: {
    code: 'SECURITY_VIOLATION',
    message: 'Contenu potentiellement dangereux détecté',
    suggestion: 'Modifiez le contenu pour respecter les règles de sécurité'
  }
}
```

### **🌐 Multilingual Error Messages**
```typescript
// Messages d'erreur multilingues
const ERROR_MESSAGES = {
  fr: {
    REQUIRED_FIELD: 'Ce champ est obligatoire',
    INVALID_EMAIL: 'Adresse email invalide',
    PASSWORD_TOO_WEAK: 'Mot de passe trop faible',
    PRODUCT_NAME_TOO_LONG: 'Nom du produit trop long (max 200 caractères)',
    PRICE_NEGATIVE: 'Le prix ne peut pas être négatif',
    STOCK_NEGATIVE: 'Le stock ne peut pas être négatif'
  },

  en: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Invalid email address',
    PASSWORD_TOO_WEAK: 'Password is too weak',
    PRODUCT_NAME_TOO_LONG: 'Product name too long (max 200 characters)',
    PRICE_NEGATIVE: 'Price cannot be negative',
    STOCK_NEGATIVE: 'Stock cannot be negative'
  }
}
```

## 🧪 **VALIDATION TESTING**

### **🔬 Test Cases Examples**
```typescript
// Tests validation automatisés
describe('Product Validation', () => {
  test('valid product passes validation', () => {
    const validProduct = {
      nom: 'Canapé 3 places',
      description: 'Canapé confortable en cuir',
      prix_unitaire: 1299.99,
      sku: 'CANAPE-001',
      famille_id: 'famille-1'
    }

    const result = validateProduct(validProduct)
    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('product with XSS attempt fails validation', () => {
    const maliciousProduct = {
      nom: '<script>alert("XSS")</script>',
      prix_unitaire: 100
    }

    const result = validateProduct(maliciousProduct)
    expect(result.success).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'nom',
      code: 'SECURITY_VIOLATION',
      message: 'Contenu potentiellement dangereux détecté'
    })
  })

  test('business rule validation works', () => {
    const productWithExcessiveDiscount = {
      prix_base: 1000,
      prix_remise_b2b: 500, // 50% discount > 40% max
      type_client: 'b2b'
    }

    const result = validatePricing(productWithExcessiveDiscount)
    expect(result.success).toBe(false)
    expect(result.errors[0].code).toBe('BUSINESS_RULE_VIOLATION')
  })
})
```

### **📊 Validation Performance Testing**
```typescript
// Tests performance validation
describe('Validation Performance', () => {
  test('validates 1000 products under 1 second', async () => {
    const products = generateTestProducts(1000)
    const startTime = Date.now()

    const results = await Promise.all(
      products.map(p => validateProduct(p))
    )

    const endTime = Date.now()
    const duration = endTime - startTime

    expect(duration).toBeLessThan(1000)
    expect(results.every(r => r !== null)).toBe(true)
  })

  test('complex business rule validation under 100ms', async () => {
    const complexProduct = generateComplexProduct()
    const startTime = Date.now()

    const result = await validateComplexBusinessRules(complexProduct)

    const endTime = Date.now()
    expect(endTime - startTime).toBeLessThan(100)
  })
})
```

---

## 🔄 **VALIDATION MONITORING**

### **📊 Validation Metrics Dashboard**
```typescript
const VALIDATION_MONITORING = {
  // Métriques temps réel
  real_time_metrics: [
    'validation_success_rate',
    'validation_error_rate',
    'validation_performance',
    'security_violations_detected'
  ],

  // Alertes validation
  alerts: {
    high_error_rate: {
      threshold: 0.05,              // >5% erreurs
      window: '5 minutes',
      action: 'investigate_immediately'
    },

    security_violations: {
      threshold: 1,                 // 1+ violation
      window: '1 minute',
      action: 'security_team_alert'
    },

    performance_degradation: {
      threshold: 500,               // >500ms validation
      window: '10 minutes',
      action: 'performance_investigation'
    }
  }
}
```

---

*Data integrity is user trust - Validate early, validate often*
*Dernière mise à jour : 15 septembre 2025*