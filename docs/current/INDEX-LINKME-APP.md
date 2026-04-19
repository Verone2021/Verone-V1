# LinkMe — Documentation App

_Generated: 2026-04-19 03:48_

## Pages (49)

| Route                              | Fichier  |
| ---------------------------------- | -------- |
| `/login`                           | page.tsx |
| `/cgu`                             | page.tsx |
| `/cookies`                         | page.tsx |
| `/privacy`                         | page.tsx |
| `/[affiliateSlug]/[selectionSlug]` | page.tsx |
| `/[affiliateSlug]`                 | page.tsx |
| `/aide/commandes`                  | page.tsx |
| `/aide/commissions`                | page.tsx |
| `/aide/demarrer`                   | page.tsx |
| `/aide/faq`                        | page.tsx |
| `/aide`                            | page.tsx |
| `/aide/produits`                   | page.tsx |
| `/aide/selections`                 | page.tsx |
| `/cart`                            | page.tsx |
| `/catalogue`                       | page.tsx |
| `/checkout`                        | page.tsx |
| `/commandes/[id]/modifier`         | page.tsx |
| `/commandes/nouvelle`              | page.tsx |
| `/commandes`                       | page.tsx |
| `/commissions/demandes`            | page.tsx |
| `/commissions`                     | page.tsx |
| `/confirmation`                    | page.tsx |
| `/contacts`                        | page.tsx |
| `/dashboard`                       | page.tsx |
| `/ma-selection/[id]`               | page.tsx |
| `/ma-selection/[id]/produits`      | page.tsx |
| `/ma-selection/nouvelle`           | page.tsx |
| `/ma-selection`                    | page.tsx |
| `/mes-produits/[id]`               | page.tsx |
| `/mes-produits/nouveau`            | page.tsx |
| `/mes-produits`                    | page.tsx |
| `/notifications`                   | page.tsx |
| `/organisations`                   | page.tsx |
| `/parametres`                      | page.tsx |
| `/profil`                          | page.tsx |
| `/statistiques`                    | page.tsx |
| `/statistiques/produits`           | page.tsx |
| `/stockage`                        | page.tsx |
| `/about`                           | page.tsx |
| `/contact`                         | page.tsx |
| `/(marketing)`                     | page.tsx |
| `/complete-info/[token]`           | page.tsx |
| `/delivery-info/[token]`           | page.tsx |
| `/s/[id]/catalogue`                | page.tsx |
| `/s/[id]/contact`                  | page.tsx |
| `/s/[id]/faq`                      | page.tsx |
| `/s/[id]`                          | page.tsx |
| `/s/[id]/points-de-vente`          | page.tsx |
| `/unauthorized`                    | page.tsx |

## API Routes (14)

| Endpoint                            | Methods |
| ----------------------------------- | ------- |
| `/api/complete-info/[token]`        | GET     |
| `/api/complete-info/[token]/submit` | POST    |
| `/api/contact/send`                 | POST    |
| `/api/create-order`                 | POST    |
| `/api/emails/form-confirmation`     | POST    |
| `/api/emails/form-notification`     | POST    |
| `/api/emails/notify-enseigne-order` | POST    |
| `/api/emails/order-confirmation`    | POST    |
| `/api/emails/step4-confirmed`       | POST    |
| `/api/forms/submit`                 | POST    |
| `/api/globe-items`                  | GET     |
| `/api/invoices/[orderId]/pdf`       | GET     |
| `/api/page-config/[pageId]`         | GET     |
| `/api/webhook/revolut`              | POST    |

## Components in app (214)

| Fichier                                                                                                   |
| --------------------------------------------------------------------------------------------------------- |
| `src/app/(main)/catalogue/components/CatalogTabs.tsx`                                                     |
| `src/app/(main)/catalogue/components/CategoryAccordion.tsx`                                               |
| `src/app/(main)/catalogue/components/CategoryBar.tsx`                                                     |
| `src/app/(main)/catalogue/components/CategoryDropdown.tsx`                                                |
| `src/app/(main)/catalogue/components/FilterDrawer.tsx`                                                    |
| `src/app/(main)/catalogue/components/ProductCard.tsx`                                                     |
| `src/app/(main)/checkout/components/BillingSection.tsx`                                                   |
| `src/app/(main)/checkout/components/CheckoutHeader.tsx`                                                   |
| `src/app/(main)/checkout/components/ContactSection.tsx`                                                   |
| `src/app/(main)/checkout/components/OrderSummary.tsx`                                                     |
| `src/app/(main)/checkout/components/PaymentSection.tsx`                                                   |
| `src/app/(main)/checkout/components/ShippingSection.tsx`                                                  |
| `src/app/(main)/commandes/[id]/modifier/components/BillingSection.tsx`                                    |
| `src/app/(main)/commandes/[id]/modifier/components/EditOrderHeader.tsx`                                   |
| `src/app/(main)/commandes/[id]/modifier/components/ProductsSection.tsx`                                   |
| `src/app/(main)/commandes/[id]/modifier/components/ResponsableSection.tsx`                                |
| `src/app/(main)/commandes/[id]/modifier/components/ShippingSection.tsx`                                   |
| `src/app/(main)/commandes/[id]/modifier/components/StickyBottomBar.tsx`                                   |
| `src/app/(main)/commandes/components/ApproveOrderDialog.tsx`                                              |
| `src/app/(main)/commandes/components/CreateOrderModal.tsx`                                                |
| `src/app/(main)/commandes/components/CreateOrderModal/ConfirmOrderModal.tsx`                              |
| `src/app/(main)/commandes/components/CreateOrderModal/ExistingRestaurantForm.tsx`                         |
| `src/app/(main)/commandes/components/CreateOrderModal/NewRestaurantStepper.tsx`                           |
| `src/app/(main)/commandes/components/CreateOrderModal/QuestionInitiale.tsx`                               |
| `src/app/(main)/commandes/components/CreateOrderModal/existing-restaurant/OrderSummaryTable.tsx`          |
| `src/app/(main)/commandes/components/CreateOrderModal/existing-restaurant/ProductCatalogWithCart.tsx`     |
| `src/app/(main)/commandes/components/CreateOrderModal/existing-restaurant/SelectionAndRestaurantGrid.tsx` |
| `src/app/(main)/commandes/components/CreateOrderModal/steps/StepFacturation.tsx`                          |
| `src/app/(main)/commandes/components/CreateOrderModal/steps/StepProduits.tsx`                             |
| `src/app/(main)/commandes/components/CreateOrderModal/steps/StepProprietaire.tsx`                         |
| `src/app/(main)/commandes/components/CreateOrderModal/steps/StepRecapitulatif.tsx`                        |
| `src/app/(main)/commandes/components/CreateOrderModal/steps/StepRestaurant.tsx`                           |
| `src/app/(main)/commandes/components/OrderAddressesSection.tsx`                                           |
| `src/app/(main)/commandes/components/OrderContactCard.tsx`                                                |
| `src/app/(main)/commandes/components/OrderDetailModal.tsx`                                                |
| `src/app/(main)/commandes/components/OrderItemsTable.tsx`                                                 |
| `src/app/(main)/commandes/components/OrderShipmentSection.tsx`                                            |
| `src/app/(main)/commandes/components/OrderTotalsSection.tsx`                                              |
| `src/app/(main)/mes-produits/components/ProductDetailSheet.tsx`                                           |
| `src/app/(main)/mes-produits/components/ProductSalesSection.tsx`                                          |
| `src/app/(main)/mes-produits/components/SendToStorageDialog.tsx`                                          |
| `src/app/(main)/mes-produits/nouveau/components/ProductPreviewSidebar.tsx`                                |
| `src/app/(main)/mes-produits/nouveau/components/ProductStorageSection.tsx`                                |
| `src/app/(main)/organisations/components/OrganisationsPagination.tsx`                                     |
| `src/app/(main)/statistiques/components/StatsCommissionsTab.tsx`                                          |
| `src/app/(main)/statistiques/components/StatsOrdersTab.tsx`                                               |
| `src/app/(main)/statistiques/components/StatsProductsTab.tsx`                                             |
| `src/app/(main)/statistiques/components/StatsSelectionsTab.tsx`                                           |
| `src/app/(main)/statistiques/produits/components/ProductSalesDetailModal.tsx`                             |
| `src/app/(main)/statistiques/produits/components/ProductStatsCharts.tsx`                                  |
| `src/app/(main)/stockage/components/StorageMonthlyTab.tsx`                                                |
| `src/app/(main)/stockage/components/StorageOverviewTab.tsx`                                               |
| `src/app/(main)/stockage/components/StorageProductsTab.tsx`                                               |
| `src/app/(main)/stockage/components/StorageRequestsTab.tsx`                                               |
| `src/app/(main)/stockage/components/StorageYearlyTab.tsx`                                                 |
| `src/app/(public)/complete-info/[token]/components/FieldRenderer.tsx`                                     |
| `src/app/(public)/complete-info/[token]/components/StatusScreens.tsx`                                     |
| `src/app/(public)/complete-info/[token]/components/StepEntreprise.tsx`                                    |
| `src/app/(public)/complete-info/[token]/components/StepFacturation.tsx`                                   |
| `src/app/(public)/complete-info/[token]/components/StepLivraison.tsx`                                     |
| `src/app/(public)/complete-info/[token]/components/StepResponsable.tsx`                                   |
| `src/app/(public)/complete-info/[token]/components/WizardFooter.tsx`                                      |
| `src/app/(public)/complete-info/[token]/components/WizardHeader.tsx`                                      |
| `src/components/ContactsSection.tsx`                                                                      |
| `src/components/OrderFormUnified.tsx`                                                                     |
| `src/components/RequireRole.tsx`                                                                          |
| `src/components/analytics/AffiliateKPIGrid.tsx`                                                           |
| `src/components/analytics/CommissionsOverview.tsx`                                                        |
| `src/components/analytics/ProductStatsTable.tsx`                                                          |
| `src/components/analytics/RevenueChart.tsx`                                                               |
| `src/components/analytics/SelectionPerformanceCard.tsx`                                                   |
| `src/components/analytics/TopProductsTable.tsx`                                                           |
| `src/components/auth/UserMenu.tsx`                                                                        |
| `src/components/cart/CartDrawer.tsx`                                                                      |
| `src/components/cart/CartProvider.tsx`                                                                    |
| `src/components/catalogue/AddToSelectionModal.tsx`                                                        |
| `src/components/catalogue/ProductDetailModal.tsx`                                                         |
| `src/components/catalogue/add-to-selection/MarginConfigSection.tsx`                                       |
| `src/components/catalogue/add-to-selection/SelectionPickerSection.tsx`                                    |
| `src/components/commissions/CommissionDetailContent.tsx`                                                  |
| `src/components/commissions/CommissionKPICard.tsx`                                                        |
| `src/components/commissions/CommissionSelectionModal.tsx`                                                 |
| `src/components/commissions/CommissionsChart.tsx`                                                         |
| `src/components/commissions/CommissionsTable.tsx`                                                         |
| `src/components/commissions/CommissionsTableHead.tsx`                                                     |
| `src/components/commissions/HowToGetPaidBanner.tsx`                                                       |
| `src/components/commissions/InvoiceTemplate.tsx`                                                          |
| `src/components/commissions/PaymentRequestModal.tsx`                                                      |
| `src/components/commissions/PaymentRequestsPanel.tsx`                                                     |
| `src/components/contacts/ContactDisplayCard.tsx`                                                          |
| `src/components/dashboard/CommissionKPICard.tsx`                                                          |
| `src/components/dashboard/KPICard.tsx`                                                                    |
| `src/components/dashboard/MetricCard.tsx`                                                                 |
| `src/components/forms/ProductImageUpload.tsx`                                                             |
| `src/components/landing/CTA.tsx`                                                                          |
| `src/components/landing/Features.tsx`                                                                     |
| `src/components/landing/Footer.tsx`                                                                       |
| `src/components/landing/Header.tsx`                                                                       |
| `src/components/landing/Hero.tsx`                                                                         |
| `src/components/landing/HowItWorks.tsx`                                                                   |
| `src/components/landing/Marketplace.tsx`                                                                  |
| `src/components/landing/PricingModels.tsx`                                                                |
| `src/components/layout/ActionsRequiredDropdown.tsx`                                                       |
| `src/components/layout/AppSidebar.tsx`                                                                    |
| `src/components/layout/Footer.tsx`                                                                        |
| `src/components/layout/Header.tsx`                                                                        |
| `src/components/layout/MinimalHeader.tsx`                                                                 |
| `src/components/layout/RouteGuard.tsx`                                                                    |
| `src/components/layout/SidebarProvider.tsx`                                                               |
| `src/components/network/FranceMap.tsx`                                                                    |
| `src/components/network/NetworkCard.tsx`                                                                  |
| `src/components/network/NetworkStatsGrid.tsx`                                                             |
| `src/components/network/SearchFilterBar.tsx`                                                              |
| `src/components/onboarding/OnboardingChecklist.tsx`                                                       |
| `src/components/onboarding/PageTourTrigger.tsx`                                                           |
| `src/components/onboarding/WelcomeTourTrigger.tsx`                                                        |
| `src/components/order-form/BillingStep.tsx`                                                               |
| `src/components/order-form/CartSummary.tsx`                                                               |
| `src/components/order-form/DeliveryStep.tsx`                                                              |
| `src/components/order-form/Footer.tsx`                                                                    |
| `src/components/order-form/Header.tsx`                                                                    |
| `src/components/order-form/InlineConfirmation.tsx`                                                        |
| `src/components/order-form/OrderFormStepper.tsx`                                                          |
| `src/components/order-form/RequesterStep.tsx`                                                             |
| `src/components/order-form/ResponsableStep.tsx`                                                           |
| `src/components/order-form/RestaurantStep.tsx`                                                            |
| `src/components/order-form/ValidationStep.tsx`                                                            |
| `src/components/orders/ClientConfirmationDialog.tsx`                                                      |
| `src/components/orders/NewOrderForm.tsx`                                                                  |
| `src/components/orders/OrderConfirmationDialog.tsx`                                                       |
| `src/components/orders/OrderStepper.tsx`                                                                  |
| `src/components/orders/RestaurantSelectorModal.tsx`                                                       |
| `src/components/orders/steps/BillingStep.tsx`                                                             |
| `src/components/orders/steps/CartStep.tsx`                                                                |
| `src/components/orders/steps/ProductsStep.tsx`                                                            |
| `src/components/orders/steps/ResponsableStep.tsx`                                                         |
| `src/components/orders/steps/RestaurantStep/RestaurantStep.tsx`                                           |
| `src/components/orders/steps/RestaurantStep/components/ExistingRestaurantMode.tsx`                        |
| `src/components/orders/steps/RestaurantStep/components/ModeToggle.tsx`                                    |
| `src/components/orders/steps/RestaurantStep/components/NewRestaurantForm.tsx`                             |
| `src/components/orders/steps/SelectionStep.tsx`                                                           |
| `src/components/orders/steps/ShippingStep/ShippingStep.tsx`                                               |
| `src/components/orders/steps/ShippingStep/components/AddressSection.tsx`                                  |
| `src/components/orders/steps/ShippingStep/components/ContactForm.tsx`                                     |
| `src/components/orders/steps/ShippingStep/components/DateSection.tsx`                                     |
| `src/components/orders/steps/ShippingStep/components/DeliveryContactSection.tsx`                          |
| `src/components/orders/steps/ShippingStep/components/DeliveryOptionsSection.tsx`                          |
| `src/components/orders/steps/ShippingStep/components/NotesSection.tsx`                                    |
| `src/components/orders/steps/ValidationStep.tsx`                                                          |
| `src/components/orders/steps/billing/BillingAddressCards.tsx`                                             |
| `src/components/orders/steps/billing/BillingAddressSection.tsx`                                           |
| `src/components/orders/steps/billing/BillingContactSection.tsx`                                           |
| `src/components/orders/steps/contacts/AddressCard.tsx`                                                    |
| `src/components/orders/steps/contacts/AddressForm.tsx`                                                    |
| `src/components/orders/steps/contacts/AddressGrid.tsx`                                                    |
| `src/components/orders/steps/contacts/BillingAddressSection.tsx`                                          |
| `src/components/orders/steps/contacts/ContactCard.tsx`                                                    |
| `src/components/orders/steps/contacts/ContactGrid.tsx`                                                    |
| `src/components/orders/steps/contacts/ContactSelector.tsx`                                                |
| `src/components/orders/steps/contacts/DeliverySection.tsx`                                                |
| `src/components/orders/steps/products/ProductCard.tsx`                                                    |
| `src/components/orders/steps/validation/ValidationContactsSection.tsx`                                    |
| `src/components/orders/steps/validation/ValidationSectionWrapper.tsx`                                     |
| `src/components/orders/steps/validation/ValidationTotalsSection.tsx`                                      |
| `src/components/organisations/CreateContactDialog.tsx`                                                    |
| `src/components/organisations/CreateEnseigneContactModal.tsx`                                             |
| `src/components/organisations/EnseigneContactsTab.tsx`                                                    |
| `src/components/organisations/OrganisationActionsBar.tsx`                                                 |
| `src/components/organisations/OrganisationCard.tsx`                                                       |
| `src/components/organisations/OrganisationDetailModal.tsx`                                                |
| `src/components/organisations/OrganisationDetailSheet.tsx`                                                |
| `src/components/organisations/OrganisationFilterTabs.tsx`                                                 |
| `src/components/organisations/QuickEditBillingAddressModal.tsx`                                           |
| `src/components/organisations/QuickEditOwnershipTypeModal.tsx`                                            |
| `src/components/organisations/QuickEditShippingAddressModal.tsx`                                          |
| `src/components/organisations/organisation-detail/ActivityTab.tsx`                                        |
| `src/components/organisations/organisation-detail/ContactsTab.tsx`                                        |
| `src/components/organisations/organisation-detail/InfosTab.tsx`                                           |
| `src/components/organisations/organisation-detail/SharedComponents.tsx`                                   |
| `src/components/providers/LinkmeActivityTrackerProvider.tsx`                                              |
| `src/components/providers/MarketingProviders.tsx`                                                         |
| `src/components/providers/Providers.tsx`                                                                  |
| `src/components/providers/PublicProviders.tsx`                                                            |
| `src/components/public-selection/CategoryTabs.tsx`                                                        |
| `src/components/public-selection/ContactForm.tsx`                                                         |
| `src/components/public-selection/FAQSection.tsx`                                                          |
| `src/components/public-selection/Pagination.tsx`                                                          |
| `src/components/public-selection/ProductFilters.tsx`                                                      |
| `src/components/public-selection/SelectionCategoryBar.tsx`                                                |
| `src/components/public-selection/SelectionCategoryDropdown.tsx`                                           |
| `src/components/public-selection/SelectionHeader.tsx`                                                     |
| `src/components/public-selection/SelectionHero.tsx`                                                       |
| `src/components/public-selection/StoreLocatorMap.tsx`                                                     |
| `src/components/public-selection/store-locator/StoreLocatorMarkers.tsx`                                   |
| `src/components/public-selection/store-locator/StoreLocatorPanel.tsx`                                     |
| `src/components/selection/EditMarginModal.tsx`                                                            |
| `src/components/selection/ProductDetailSheet.tsx`                                                         |
| `src/components/selection/ProductFilters.tsx`                                                             |
| `src/components/selection/SelectionConfigSheet.tsx`                                                       |
| `src/components/selection/SelectionImageUpload.tsx`                                                       |
| `src/components/selection/SelectionImageUploadDialog.tsx`                                                 |
| `src/components/selection/SelectionProductGrid.tsx`                                                       |
| `src/components/selection/SelectionProductsSheet.tsx`                                                     |
| `src/components/selection/ShareSelectionButton.tsx`                                                       |
| `src/components/selection/StockBadge.tsx`                                                                 |
| `src/components/selection/selection-catalog/SelectionProductRow.tsx`                                      |
| `src/components/shared/MapLibreMapView.tsx`                                                               |
| `src/components/shared/MapPopupCard.tsx`                                                                  |
| `src/components/storage/PricingGridReadOnly.tsx`                                                          |
| `src/components/storage/StorageKPICard.tsx`                                                               |
| `src/components/storage/StorageProductCard.tsx`                                                           |
| `src/components/ui/ImageSphere.tsx`                                                                       |
| `src/components/ui/SphereImageGrid.tsx`                                                                   |
| `src/components/ui/sphere/SphereSpotlightModal.tsx`                                                       |
