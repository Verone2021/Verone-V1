/**
 * @verone/utils/validation
 * Validation utilities
 */

// Profile validation
export {
  validatePhone as validatePhoneProfile,
  validateFirstName,
  validateLastName,
  validateJobTitle,
  validateDisplayName,
  validateProfileForm,
  sanitizeProfileData,
  type ValidationResult as ProfileValidationResult,
  type ProfileFormData,
} from './profile-validation';

// Form security
export {
  VALIDATION_PATTERNS,
  sanitizeInput,
  sanitizeObject,
  validateEmail as validateEmailForm,
  validatePhone as validatePhoneForm,
  SecureSchemas,
  SecureOrganisationSchema,
  SecureContactSchema,
  SecureProductSchema,
  SecureOrderSchema,
  validateFormWithCSRF,
  generateCSRFToken,
  useFormSecurity,
} from './form-security';

// Order status validator
export {
  validateStatusTransition,
  STATUS_LABELS,
  STATUS_COLORS,
  type SalesOrderStatus,
  type PaymentStatus,
  type ValidationContext,
  type ValidationResult as OrderValidationResult,
  type SalesOrderData,
} from './order-status-validator';

// API request validation schemas
export {
  // Base schemas
  uuidSchema,
  safeStringSchema,
  positiveIntSchema,
  nonNegativeSchema,
  emailSchema,
  isoDateSchema,
  isoDateTimeSchema,
  // Common schemas
  paginationSchema,
  dateRangeSchema,
  // Orders
  salesOrderItemSchema,
  createSalesOrderSchema,
  updateOrderStatusSchema,
  // Invoices
  createInvoiceSchema,
  sendInvoiceSchema,
  // Customers
  createOrganisationSchema,
  createIndividualSchema,
  // Products
  productSchema,
  // Linkme
  createLinkmeUserSchema,
  createSelectionSchema,
  // Admin
  runMigrationSchema,
  // Helpers
  validateRequestBody,
  validateQueryParams,
} from './api-schemas';
