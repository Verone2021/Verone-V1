'use client';

/**
 * 📦 Formulaire Expédition Sales Order - WORKFLOW PACKLINK 4 ÉTAPES
 *
 * Workflow:
 * 1. Dimensions & Poids colis (infos client pré-remplies en read-only)
 * 2. Assurance (oui/non + valeur déclarée)
 * 3. Choix transporteur PackLink
 * 4. Validation & Paiement
 */

import { useState, useEffect } from 'react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Package,
  Shield,
  Truck,
  CheckCircle2,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';

import {
  useSalesShipments,
  type SalesOrderForShipment,
} from '@verone/orders/hooks';

import {
  PickupPointSelector,
  type PacklinkDropoffPoint,
} from '../shipments/PickupPointSelector';
import {
  ServiceSelector,
  type PacklinkService,
} from '../shipments/ServiceSelector';

interface SalesOrderShipmentFormProps {
  salesOrder: SalesOrderForShipment;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PackageData {
  id: string;
  length: number; // cm
  width: number; // cm
  height: number; // cm
  weight: number; // kg
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export function SalesOrderShipmentForm({
  salesOrder,
  onSuccess,
  onCancel,
}: SalesOrderShipmentFormProps) {
  const supabase = createClient();
  const { prepareShipmentItems } = useSalesShipments();

  // Workflow step
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Step 1: Dimensions & Poids
  const [packages, setPackages] = useState<PackageData[]>([
    { id: '1', length: 0, width: 0, height: 0, weight: 0 },
  ]);

  // Step 2: Assurance
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceValue, setInsuranceValue] = useState('');

  // Step 3: Services PackLink
  const [services, setServices] = useState<PacklinkService[]>([]);
  const [selectedService, setSelectedService] =
    useState<PacklinkService | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Points relais/lockers (dropoffs)
  const [originDropoffPoint, setOriginDropoffPoint] =
    useState<PacklinkDropoffPoint | null>(null);
  const [destinationDropoffPoint, setDestinationDropoffPoint] =
    useState<PacklinkDropoffPoint | null>(null);

  // Step 4: Validation
  const [submitting, setSubmitting] = useState(false);

  // Infos destinataire (client) - EDITABLES
  // ✅ FIX: Initialiser depuis shipping_address (adresse de livraison client)
  const [recipientName, setRecipientName] = useState('');
  const [recipientSurname, setRecipientSurname] = useState('');
  const [company, setCompany] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [postalCode, setPostalCode] = useState(() => {
    const shippingAddr = salesOrder.shipping_address;
    if (typeof shippingAddr === 'string') {
      // Extraire code postal depuis texte (5 chiffres)
      const zipMatch = shippingAddr.match(/\b(\d{5})\b/);
      return zipMatch ? zipMatch[1] : '';
    } else if (shippingAddr) {
      // Extraire depuis objet structuré
      return (
        shippingAddr.postal_code ||
        shippingAddr.zip_code ||
        shippingAddr.zipcode ||
        ''
      );
    }
    return '';
  });
  const [city, setCity] = useState(() => {
    const shippingAddr = salesOrder.shipping_address;
    if (typeof shippingAddr === 'string') {
      // Extraire ville depuis texte (après code postal)
      const cityMatch = shippingAddr.match(
        /\d{5}\s*([A-ZÀ-Üa-zà-ü\s-]+?)(?:France|$)/i
      );
      return cityMatch ? cityMatch[1].trim() : '';
    } else if (shippingAddr) {
      // Extraire depuis objet structuré
      return shippingAddr.city || '';
    }
    return '';
  });
  const [country, setCountry] = useState('France');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Infos expéditeur (Vérone) - EDITABLES (pré-remplies)
  const [senderName, setSenderName] = useState('Service client');
  const [senderSurname, setSenderSurname] = useState('Entreprise');
  const [senderCompany, setSenderCompany] = useState('Vérone');
  const [senderAddress, setSenderAddress] = useState('4 rue du Pérou');
  const [senderCity, setSenderCity] = useState('Massy');
  const [senderPostalCode, setSenderPostalCode] = useState('91300');
  const [senderCountry, setSenderCountry] = useState('France');
  const [senderPhone, setSenderPhone] = useState('0656720702');
  const [senderEmail, setSenderEmail] = useState('romeo@veronecollections.fr');

  // 🆕 Informations colis (Step 5) - OBLIGATOIRES PackLink
  const [content, setContent] = useState('Mobilier et décoration'); // Description contenu (max 50 chars)
  const [contentValue, setContentValue] = useState(
    salesOrder.total_ttc?.toString() || '100'
  ); // Valeur déclarée (EUR) - Pré-remplie depuis commande
  const [isUsed, setIsUsed] = useState(false); // Produit d'occasion (optionnel)

  // Pré-remplir infos client au montage avec fallbacks intelligents
  useEffect(() => {
    const shippingAddr = salesOrder.shipping_address;

    // Parser adresse avec fallbacks multiples
    if (shippingAddr) {
      if (typeof shippingAddr === 'string') {
        // Adresse en format texte brut - extraction intelligente
        const text = shippingAddr;

        // 1. Extraire code postal (5 chiffres)
        const zipMatch = text.match(/\b(\d{5})\b/);
        if (zipMatch) {
          setPostalCode(zipMatch[1]);

          // 2. Extraire ville (après code postal, avant "France" ou fin de chaîne)
          const cityMatch = text.match(
            /\d{5}\s*([A-ZÀ-Üa-zà-ü\s-]+?)(?:France|$)/i
          );
          if (cityMatch) {
            setCity(cityMatch[1].trim());
          }

          // 3. 🔧 CORRECTION ROBUSTE : Extraire SEULEMENT la partie adresse (commence par chiffre)
          // Ex: "Pokawa Amiens47 Pl. René Goblet80000" → "47 Pl. René Goblet"
          const streetWithNumber = text.match(/(\d+[^\d]*?)(?=\d{5})/);
          if (streetWithNumber) {
            let street = streetWithNumber[1].trim();

            // Nettoyer les espaces manquants (ex: "47Pl" → "47 Pl")
            street = street.replace(/(\d)([a-zA-Zà-ÿ])/g, '$1 $2');

            setAddressLine1(street);
          } else {
            // Fallback : extraire tout avant le code postal
            const beforeZipMatch = text.match(/^(.*?)(?=\d{5})/);
            if (beforeZipMatch) {
              setAddressLine1(beforeZipMatch[1].trim());
            }
          }
        } else {
          // Pas de code postal trouvé, mettre tout dans addressLine1
          setAddressLine1(text);
        }

        // 4. Détecter pays
        if (text.toLowerCase().includes('france')) {
          setCountry('France');
        }
      } else {
        // Adresse structurée JSONB
        setRecipientName(
          shippingAddr.recipient_name || shippingAddr.name || ''
        );
        setCompany(shippingAddr.company || '');

        let addr =
          shippingAddr.address_line1 ||
          shippingAddr.street1 ||
          shippingAddr.address ||
          '';
        const zip =
          shippingAddr.postal_code ||
          shippingAddr.zip_code ||
          shippingAddr.zipcode ||
          '';
        const cityValue = shippingAddr.city || '';

        // 🔧 CORRECTION CRITIQUE : TOUJOURS nettoyer l'adresse pour extraire SEULEMENT la rue
        // Ex: "Pokawa Amiens47 Pl. René Goblet80000 AmiensFrance" → "47 Pl. René Goblet"
        if (addr) {
          const zipMatch = addr.match(/\b(\d{5})\b/);
          if (zipMatch) {
            // Parser zip et city si manquants
            if (!zip) setPostalCode(zipMatch[1]);

            // Extraire ville (après code postal, avant "France")
            const cityMatch = addr.match(
              /\d{5}\s*([A-ZÀ-Üa-zà-ü\s-]+?)(?:France|$)/i
            );
            if (cityMatch && !cityValue) {
              setCity(cityMatch[1].trim());
            }

            // 🔧 CORRECTION ROBUSTE : Extraire SEULEMENT la partie adresse (commence par chiffre)
            // Ex: "Pokawa Amiens47 Pl. René Goblet80000" → "47 Pl. René Goblet"
            // Stratégie : chercher le premier chiffre, c'est le début du numéro de rue
            const streetWithNumber = addr.match(/(\d+[^\d]*?)(?=\d{5})/);
            if (streetWithNumber) {
              let street = streetWithNumber[1].trim();

              // Nettoyer les espaces manquants (ex: "47Pl" → "47 Pl")
              street = street.replace(/(\d)([a-zA-Zà-ÿ])/g, '$1 $2');

              addr = street; // ✅ Utiliser la rue nettoyée
            } else {
              // Fallback : extraire tout avant le code postal
              const beforeZipMatch = addr.match(/^(.*?)(?=\d{5})/);
              if (beforeZipMatch) {
                addr = beforeZipMatch[1].trim();
              }
            }
          }
        }

        setAddressLine1(addr);
        setAddressLine2(
          shippingAddr.address_line2 || shippingAddr.street2 || ''
        );
        // 🔧 FIX: Ne pas reset à "" si shipping_address ne contient pas ces données
        // Laisser organisations les remplir plus tard dans le useEffect
        if (zip) setPostalCode(zip);
        if (cityValue) setCity(cityValue);
        setCountry(shippingAddr.country || 'France');
        setPhone(shippingAddr.phone || '');
        setEmail(shippingAddr.email || '');
      }
    }

    // Récupérer infos client (organisations ou individuals)
    if (salesOrder.organisations) {
      const org = salesOrder.organisations;
      const legalName = org.legal_name || org.trade_name || '';

      console.log('🔍 [DEBUG] Organisation data:', {
        postal_code: org.postal_code,
        city: org.city,
        address_line1: org.address_line1,
      });
      console.log('🔍 [DEBUG] Current state before org prefill:', {
        postalCode,
        city,
        addressLine1,
      });

      // Division du nom légal pour Packlink
      // Ex: "SARL Dupont Mobilier" → surname="SARL", name="Dupont Mobilier"
      if (legalName && !recipientName) {
        const parts = legalName.split(' ', 2);
        if (parts.length > 1) {
          setRecipientSurname(parts[0]); // "SARL", "SAS", etc.
          setRecipientName(parts.slice(1).join(' ')); // "Dupont Mobilier"
        } else {
          setRecipientName(legalName);
        }
      }

      setCompany(legalName);
      if (!email) setEmail(org.email || '');
      if (!phone) setPhone(org.phone || '');

      // 🆕 Pré-remplir code postal et ville depuis organisations
      // 🔧 FIX: Gérer empty strings (pas seulement undefined)
      if ((!postalCode || postalCode.trim() === '') && org.postal_code) {
        console.log(
          '✅ [DEBUG] Setting postal_code from org:',
          org.postal_code
        );
        setPostalCode(org.postal_code);
      } else {
        console.log('❌ [DEBUG] NOT setting postal_code. Reason:', {
          postalCodeEmpty: !postalCode || postalCode.trim() === '',
          orgHasPostalCode: !!org.postal_code,
        });
      }
      if ((!city || city.trim() === '') && org.city) {
        console.log('✅ [DEBUG] Setting city from org:', org.city);
        setCity(org.city);
      } else {
        console.log('❌ [DEBUG] NOT setting city. Reason:', {
          cityEmpty: !city || city.trim() === '',
          orgHasCity: !!org.city,
        });
      }
      // Bonus : pré-remplir address_line1 si manquante
      if (!addressLine1 && org.address_line1) {
        setAddressLine1(org.address_line1);
      }
    }
  }, [salesOrder]);

  // Auto-calculer valeur assurance depuis salesOrder
  useEffect(() => {
    if (salesOrder.total_ttc) {
      setInsuranceValue(salesOrder.total_ttc.toFixed(2));
    }
  }, [salesOrder.total_ttc]);

  // Ajouter un colis
  const addPackage = () => {
    const newId = (packages.length + 1).toString();
    setPackages([
      ...packages,
      { id: newId, length: 0, width: 0, height: 0, weight: 0 },
    ]);
  };

  // Supprimer un colis
  const removePackage = (id: string) => {
    if (packages.length > 1) {
      setPackages(packages.filter(p => p.id !== id));
    }
  };

  // Mettre à jour colis
  const updatePackage = (
    id: string,
    field: keyof PackageData,
    value: number
  ) => {
    setPackages(
      packages.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Validation Step 1 (Origine + Destination)
  const canProceedStep1 =
    // Origine
    senderCity.trim() !== '' &&
    senderPostalCode.trim() !== '' &&
    /^\d{5}$/.test(senderPostalCode) &&
    // Destination
    city.trim() !== '' &&
    postalCode.trim() !== '' &&
    /^\d{5}$/.test(postalCode); // Code postal français valide

  // Validation Step 2 (Dimensions & Poids)
  const canProceedStep2 = packages.every(
    p => p.length > 0 && p.width > 0 && p.height > 0 && p.weight > 0
  );

  // Helper: Normaliser code pays vers ISO 2 lettres
  const normalizeCountryCode = (countryInput: string | undefined): string => {
    if (!countryInput) return 'FR';

    const normalized = countryInput.toUpperCase().trim();

    // Si déjà code ISO à 2 lettres, retourner tel quel
    if (normalized.length === 2) return normalized;

    // Mapping noms complets → codes ISO
    const countryMap: Record<string, string> = {
      FRANCE: 'FR',
      ALLEMAGNE: 'DE',
      GERMANY: 'DE',
      ESPAGNE: 'ES',
      SPAIN: 'ES',
      ITALIE: 'IT',
      ITALY: 'IT',
      BELGIQUE: 'BE',
      BELGIUM: 'BE',
      'PAYS-BAS': 'NL',
      NETHERLANDS: 'NL',
      LUXEMBOURG: 'LU',
      SUISSE: 'CH',
      SWITZERLAND: 'CH',
    };

    return countryMap[normalized] || 'FR';
  };

  // Validation Step 5 (Coordonnées complètes)
  // Note: ville/code postal déjà validés au Step 1, pas besoin de revérifier
  const canProceedStep5 =
    // Expéditeur - tous les champs requis
    senderName.trim() !== '' &&
    senderSurname.trim() !== '' &&
    senderAddress.trim() !== '' &&
    senderPostalCode.trim() !== '' &&
    senderCity.trim() !== '' &&
    senderPhone.trim() !== '' &&
    senderEmail.trim() !== '' &&
    // Destinataire - champs requis (ville/CP déjà validés Step 1)
    recipientName.trim() !== '' &&
    recipientSurname.trim() !== '' && // ✅ FIX: Required by PackLink API
    addressLine1.trim() !== '' &&
    phone.trim() !== '' &&
    // ✅ FIX: Email OPTIONNEL (PackLink API) mais si fourni, doit être valide
    (email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) &&
    // Validation format email expéditeur (requis)
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail) &&
    // 🆕 Informations colis (obligatoires PackLink)
    content.trim() !== '' &&
    parseFloat(contentValue) > 0;

  // Rechercher services PackLink
  const searchServices = async () => {
    setLoadingServices(true);
    setServicesError(null);
    setServices([]);

    try {
      const response = await fetch('/api/packlink/search-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: {
            street1: senderAddress,
            city: senderCity, // ✅ Depuis Step 1 (validé)
            zip_code: senderPostalCode, // ✅ Depuis Step 1 (validé)
            country: normalizeCountryCode(senderCountry),
          },
          to: {
            street1: addressLine1 || 'Adresse client',
            city: city, // ✅ Toujours défini (validé au Step 1)
            zip_code: postalCode, // ✅ Toujours défini (validé au Step 1)
            country: normalizeCountryCode(country),
          },
          packages: packages.map(p => ({
            length: p.length,
            width: p.width,
            height: p.height,
            weight: p.weight,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // ✅ FIX #1: Détecter erreur validation ville/code postal
        const errorMsg = error.error || '';
        const isAddressError =
          errorMsg.toLowerCase().includes('zip') ||
          errorMsg.toLowerCase().includes('postal') ||
          errorMsg.toLowerCase().includes('city') ||
          errorMsg.toLowerCase().includes('address') ||
          errorMsg.toLowerCase().includes('location');

        if (isAddressError) {
          // Retour automatique Step 1 avec message clair
          setServicesError(
            `⚠️ Erreur validation adresse : La ville "${city}" ne correspond pas au code postal "${postalCode}". ` +
              `Veuillez retourner à l'étape 1 pour corriger.`
          );
          setCurrentStep(1);
          setLoadingServices(false);
          return;
        }

        throw new Error(errorMsg || 'Erreur API PackLink');
      }

      const data = await response.json();
      setServices(data.services || []);

      if (!data.services || data.services.length === 0) {
        setServicesError('Aucun service disponible pour cette destination');
      }
    } catch (error: any) {
      console.error('[PackLink] Erreur recherche services:', error);
      setServicesError(
        error.message || 'Erreur lors de la recherche des services'
      );
    } finally {
      setLoadingServices(false);
    }
  };

  // Handler passage à étape 4 (recherche auto services)
  const proceedToStep4 = () => {
    setCurrentStep(4);
    searchServices(); // Utilise city/postalCode du Step 1
  };

  // Valider et créer shipment
  const handleSubmit = async () => {
    if (!selectedService) {
      alert('Veuillez sélectionner un service PackLink');
      return;
    }

    setSubmitting(true);

    try {
      // 🔧 Générer items depuis salesOrder en utilisant prepareShipmentItems()
      const shipmentItems = prepareShipmentItems(salesOrder);
      const items = shipmentItems.map(item => ({
        sales_order_item_id: item.sales_order_item_id,
        quantity: item.quantity_to_ship,
      }));

      // 1. Créer shipment PackLink
      const createResponse = await fetch('/api/sales-shipments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_order_id: salesOrder.id,
          items: items, // ✅ FIX: Ajouter items requis par backend
          service_id: selectedService.id,
          packages: packages,
          insurance: insuranceEnabled ? parseFloat(insuranceValue) : null,
          shipping_address: {
            name: recipientName, // ✅ FIX: Separate name and surname for PackLink API
            surname: recipientSurname,
            company: company || undefined,
            street1: addressLine1, // ✅ FIX: Renommé address_line1 → street1
            street2: addressLine2 || undefined, // ✅ FIX: Renommé address_line2 → street2
            zip_code: postalCode, // ✅ FIX: Renommé postal_code → zip_code
            city: city,
            country: country,
            phone: phone || undefined,
            email: email || undefined,
          },
          // Points relais/lockers (dropoffs) - Spread conditionnel pour éviter null
          ...(originDropoffPoint?.id && {
            origin_dropoff_point_id: originDropoffPoint.id,
          }),
          ...(destinationDropoffPoint?.id && {
            destination_dropoff_point_id: destinationDropoffPoint.id,
          }),
          // 🆕 Informations colis (obligatoires PackLink)
          content: content,
          content_value: parseFloat(contentValue),
          is_used: isUsed,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Erreur création shipment');
      }

      const data = await createResponse.json();

      // 2. Rediriger vers paiement PackLink
      if (data.payment_url) {
        // Ouvrir page paiement PackLink dans nouvelle fenêtre
        window.open(data.payment_url, '_blank');

        // TODO: Écouter webhook pour récupération tracking number après paiement
        alert(
          'Paiement PackLink en cours. Le numéro de suivi sera automatiquement importé après paiement.'
        );
      }

      // 3. Success callback
      onSuccess();
    } catch (error: any) {
      console.error('[PackLink] Erreur création shipment:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-verone-primary" />
            Nouvelle Expédition PackLink
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Commande {salesOrder.order_number} •{' '}
            {salesOrder.organisations?.trade_name ||
              salesOrder.organisations?.legal_name}
          </p>
        </div>
        <Badge variant="outline">Étape {currentStep}/5</Badge>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map(step => (
          <div
            key={step}
            className={`flex-1 h-2 rounded-full transition-colors ${
              step <= currentStep ? 'bg-verone-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step Labels */}
      <div className="grid grid-cols-6 gap-2 text-xs text-center">
        <div
          className={
            currentStep === 1 ? 'font-semibold' : 'text-muted-foreground'
          }
        >
          Destination
        </div>
        <div
          className={
            currentStep === 2 ? 'font-semibold' : 'text-muted-foreground'
          }
        >
          Dimensions & Poids
        </div>
        <div
          className={
            currentStep === 3 ? 'font-semibold' : 'text-muted-foreground'
          }
        >
          Assurance
        </div>
        <div
          className={
            currentStep === 4 ? 'font-semibold' : 'text-muted-foreground'
          }
        >
          Choix Transporteur
        </div>
        <div
          className={
            currentStep === 5 ? 'font-semibold' : 'text-muted-foreground'
          }
        >
          Coordonnées
        </div>
        <div
          className={
            currentStep === 6 ? 'font-semibold' : 'text-muted-foreground'
          }
        >
          Validation
        </div>
      </div>

      {/* STEP 1: Origine & Destination (READONLY - Auto-filled) */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-6">
          {/* Section ORIGINE (Vérone - Non éditable) */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-verone-primary" />
              <div>
                <Label className="text-base font-semibold">
                  Adresse d'expédition (origine)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {senderAddress}, {senderPostalCode} {senderCity}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Code postal :
                  </span>
                  <p className="text-gray-900 mt-1">{senderPostalCode}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Ville :</span>
                  <p className="text-gray-900 mt-1">{senderCity}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t pt-6" />

          {/* Section DESTINATION (Client - Non éditable) */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-blue-600" />
              <div>
                <Label className="text-base font-semibold">
                  Adresse de livraison (destination)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {addressLine1}, {postalCode} {city}
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">
                    Code postal :
                  </span>
                  <p className="text-blue-900 mt-1">{postalCode}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Ville :</span>
                  <p className="text-blue-900 mt-1">{city}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <Info className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              <strong>
                Ces adresses proviennent automatiquement de vos données.
              </strong>{' '}
              Origine = Votre organisation. Destination = Adresse client de la
              commande. Pour modifier, mettez à jour les données
              organisation/client puis recréez l'expédition.
            </p>
          </div>
        </Card>
      )}

      {/* STEP 2: Dimensions & Poids */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">
                <strong>Expédition :</strong> {senderPostalCode} {senderCity}
                {' → '}
                <strong>Destination :</strong> {postalCode} {city} (saisis à
                l'étape 1)
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">
                Colis à expédier
              </Label>
              <ButtonV2 variant="outline" size="sm" onClick={addPackage}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un colis
              </ButtonV2>
            </div>

            <div className="space-y-4">
              {packages.map((pkg, index) => (
                <div key={pkg.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Colis #{index + 1}</Label>
                    {packages.length > 1 && (
                      <ButtonV2
                        variant="ghost"
                        size="sm"
                        onClick={() => removePackage(pkg.id)}
                      >
                        <X className="w-4 h-4" />
                      </ButtonV2>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Longueur (cm) *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={pkg.length || ''}
                        onChange={e =>
                          updatePackage(
                            pkg.id,
                            'length',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="50"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label>Largeur (cm) *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={pkg.width || ''}
                        onChange={e =>
                          updatePackage(
                            pkg.id,
                            'width',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="40"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label>Hauteur (cm) *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={pkg.height || ''}
                        onChange={e =>
                          updatePackage(
                            pkg.id,
                            'height',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="30"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Poids (kg) *</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={pkg.weight || ''}
                      onChange={e =>
                        updatePackage(
                          pkg.id,
                          'weight',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="5.0"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: Assurance */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-verone-primary" />
            <div>
              <Label className="text-base font-semibold">Assurance colis</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Protégez votre envoi contre la perte ou les dommages
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="insurance"
              checked={insuranceEnabled}
              onCheckedChange={checked =>
                setInsuranceEnabled(checked as boolean)
              }
            />
            <Label htmlFor="insurance" className="cursor-pointer">
              Oui, je souhaite assurer ce colis
            </Label>
          </div>

          {insuranceEnabled && (
            <div className="pl-6 space-y-4">
              <div>
                <Label>Valeur déclarée (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={insuranceValue}
                  onChange={e => setInsuranceValue(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valeur pré-remplie depuis commande :{' '}
                  {formatCurrency(parseFloat(insuranceValue) || 0)}
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 4: Choix Transporteur */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-verone-primary" />
            <div>
              <Label className="text-base font-semibold">
                Services disponibles
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {loadingServices
                  ? 'Recherche en cours...'
                  : `${services.length} service(s) disponible(s)`}
              </p>
            </div>
          </div>

          {loadingServices && (
            <div className="flex justify-center items-center py-12">
              <div className="text-muted-foreground">
                Recherche services PackLink...
              </div>
            </div>
          )}

          {servicesError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {servicesError}
            </div>
          )}

          <ServiceSelector
            services={services}
            selectedServiceId={selectedService?.id}
            onSelect={serviceId => {
              const service = services.find(s => s.id === serviceId);
              if (service) setSelectedService(service);
            }}
            loading={loadingServices}
          />

          {/* Points Relais/Lockers - Dépôt (si service type dropoff) */}
          {selectedService?.collection_type === 'dropoff' && (
            <div className="mt-6">
              <PickupPointSelector
                serviceId={selectedService.id}
                country="FR"
                zipCode={senderPostalCode}
                label="Point de dépôt (collecte)"
                selectedPointId={originDropoffPoint?.id}
                onSelect={setOriginDropoffPoint}
              />
            </div>
          )}

          {/* Points Relais/Lockers - Retrait (si service type dropoff) */}
          {selectedService?.delivery_type === 'dropoff' && (
            <div className="mt-6">
              <PickupPointSelector
                serviceId={selectedService.id}
                country="FR"
                zipCode={postalCode}
                label="Point de retrait (livraison)"
                selectedPointId={destinationDropoffPoint?.id}
                onSelect={setDestinationDropoffPoint}
              />
            </div>
          )}
        </Card>
      )}

      {/* STEP 5: Coordonnées et adresse */}
      {currentStep === 5 && (
        <Card className="p-6 space-y-8">
          <div>
            <Label className="text-lg font-semibold mb-2 block">
              Expéditeur
            </Label>

            {/* Message informatif CP/Ville disabled */}
            <div className="flex items-start gap-2 p-3 mb-4 bg-blue-50 border border-blue-200 rounded">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Le code postal et la ville d'expédition proviennent de l'étape 1
                et ne peuvent pas être modifiés ici. Pour les changer, retournez
                à l'étape 1.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom *</Label>
                <Input
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="Service client"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  value={senderSurname}
                  onChange={e => setSenderSurname(e.target.value)}
                  placeholder="Entreprise"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Entreprise</Label>
                <Input
                  value={senderCompany}
                  onChange={e => setSenderCompany(e.target.value)}
                  placeholder="Vérone"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Adresse *</Label>
                <Input
                  value={senderAddress}
                  onChange={e => setSenderAddress(e.target.value)}
                  placeholder="4 rue du Pérou"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Code postal *</Label>
                <Input
                  value={senderPostalCode}
                  disabled
                  className="mt-1 bg-muted cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Ville *</Label>
                <Input
                  value={senderCity}
                  disabled
                  className="mt-1 bg-muted cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Téléphone *</Label>
                <Input
                  value={senderPhone}
                  onChange={e => setSenderPhone(e.target.value)}
                  placeholder="0656720702"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  placeholder="romeo@veronecollections.fr"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <Label className="text-lg font-semibold mb-2 block">
              Destinataire
            </Label>

            {/* Message informatif CP/Ville disabled + Infos pré-remplies */}
            <div className="flex items-start gap-2 p-3 mb-4 bg-blue-50 border border-blue-200 rounded">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Le code postal et la ville de destination proviennent de l'étape
                1. Les autres informations (nom, adresse) ont été pré-remplies
                depuis la commande client et peuvent être modifiées si
                nécessaire.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom *</Label>
                <Input
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="Jean"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nom de famille *</Label>
                <Input
                  value={recipientSurname}
                  onChange={e => setRecipientSurname(e.target.value)}
                  placeholder="Dupont"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Entreprise (optionnel)</Label>
                <Input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Nom de l'entreprise"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Adresse *</Label>
                <Input
                  value={addressLine1}
                  onChange={e => setAddressLine1(e.target.value)}
                  placeholder="12 rue de la Paix"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Complément d'adresse</Label>
                <Input
                  value={addressLine2}
                  onChange={e => setAddressLine2(e.target.value)}
                  placeholder="Appartement, étage, etc."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Code postal *</Label>
                <Input
                  value={postalCode}
                  disabled
                  className="mt-1 bg-muted cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Ville *</Label>
                <Input
                  value={city}
                  disabled
                  className="mt-1 bg-muted cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Téléphone *</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email (optionnel)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* 🆕 Informations du colis (obligatoires PackLink) */}
          <div className="border-t pt-6">
            <Label className="text-lg font-semibold mb-2 block">
              Informations du colis
            </Label>

            <div className="flex items-start gap-2 p-3 mb-4 bg-amber-50 border border-amber-200 rounded">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Ces informations sont obligatoires pour créer l'expédition
                PackLink. La valeur est pré-remplie depuis le montant total de
                la commande.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Contenu du colis *</Label>
                <Input
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Ex: Mobilier et décoration"
                  maxLength={50}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Description du contenu (maximum 50 caractères)
                </p>
              </div>

              <div>
                <Label>Valeur déclarée (€) *</Label>
                <Input
                  type="number"
                  value={contentValue}
                  onChange={e => setContentValue(e.target.value)}
                  placeholder="100"
                  min="1"
                  step="0.01"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valeur totale du contenu pour l'assurance (pré-remplie depuis
                  commande)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="used-item"
                  checked={isUsed}
                  onCheckedChange={checked => setIsUsed(checked as boolean)}
                />
                <Label htmlFor="used-item" className="cursor-pointer">
                  Produit d'occasion
                </Label>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 6: Validation */}
      {currentStep === 6 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <Label className="text-base font-semibold">
                Récapitulatif expédition
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Vérifiez les informations avant validation
              </p>
            </div>
          </div>

          {/* Récap Destinataire */}
          <div className="border-l-4 border-blue-500 pl-4 space-y-2">
            <div className="font-medium">Destinataire</div>
            <div className="text-sm text-muted-foreground">
              {recipientName || company}
              <br />
              {addressLine1}
              <br />
              {addressLine2 && (
                <>
                  {addressLine2}
                  <br />
                </>
              )}
              {postalCode} {city}, {country}
              <br />
              {phone && (
                <>
                  Tél: {phone}
                  <br />
                </>
              )}
              {email && <>Email: {email}</>}
            </div>
          </div>

          {/* Récap Colis */}
          <div className="border-l-4 border-green-500 pl-4 space-y-2">
            <div className="font-medium">{packages.length} colis</div>
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="text-sm text-muted-foreground">
                Colis #{index + 1} : {pkg.length}x{pkg.width}x{pkg.height} cm,{' '}
                {pkg.weight} kg
              </div>
            ))}
          </div>

          {/* Récap Assurance */}
          {insuranceEnabled && (
            <div className="border-l-4 border-yellow-500 pl-4 space-y-2">
              <div className="font-medium">Assurance</div>
              <div className="text-sm text-muted-foreground">
                Valeur déclarée : {formatCurrency(parseFloat(insuranceValue))}
              </div>
            </div>
          )}

          {/* Récap Service */}
          {selectedService && (
            <div className="border-l-4 border-purple-500 pl-4 space-y-2">
              <div className="font-medium">Service sélectionné</div>
              <div className="text-sm text-muted-foreground">
                {selectedService.carrier_name} - {selectedService.service_name}
                <br />
                Prix : {formatCurrency(selectedService.price.amount)}
                {selectedService.delivery_time && (
                  <>
                    <br />
                    Livraison : {selectedService.delivery_time.min_days} à{' '}
                    {selectedService.delivery_time.max_days} jours
                  </>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="font-medium text-yellow-800 mb-1">
              Prochaine étape : Paiement PackLink
            </p>
            <p className="text-yellow-700">
              Après validation, vous serez redirigé vers la page de paiement
              sécurisée PackLink. Le numéro de suivi sera automatiquement
              importé dans notre système après paiement.
            </p>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <ButtonV2
          variant="outline"
          onClick={() => {
            if (currentStep === 1) {
              onCancel();
            } else {
              setCurrentStep((currentStep - 1) as Step);
            }
          }}
          disabled={submitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Annuler' : 'Précédent'}
        </ButtonV2>

        <ButtonV2
          onClick={() => {
            if (currentStep === 1 && canProceedStep1) {
              setCurrentStep(2);
            } else if (currentStep === 2 && canProceedStep2) {
              setCurrentStep(3);
            } else if (currentStep === 3) {
              proceedToStep4(); // Recherche services avec ville/CP du Step 1
            } else if (currentStep === 4 && selectedService) {
              setCurrentStep(5);
            } else if (currentStep === 5 && canProceedStep5) {
              setCurrentStep(6);
            } else if (currentStep === 6) {
              handleSubmit();
            }
          }}
          disabled={
            (currentStep === 1 && !canProceedStep1) ||
            (currentStep === 2 && !canProceedStep2) ||
            (currentStep === 4 && !selectedService) ||
            (currentStep === 5 && !canProceedStep5) ||
            submitting
          }
          className="bg-verone-primary hover:bg-verone-primary/90"
        >
          {currentStep === 6 ? (
            submitting ? (
              'Traitement...'
            ) : (
              'Valider & Payer'
            )
          ) : (
            <>
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </ButtonV2>
      </div>
    </div>
  );
}
