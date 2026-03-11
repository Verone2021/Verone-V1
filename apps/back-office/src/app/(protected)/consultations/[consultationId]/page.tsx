'use client';

import { useState, useEffect, useCallback } from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

import type { ClientConsultation } from '@verone/consultations';
import { ConsultationImageGallery } from '@verone/consultations';
import { ConsultationOrderInterface } from '@verone/consultations';
import { ConsultationSummaryPdf } from '@verone/consultations';
import { ConsultationTimeline } from '@verone/consultations';
import { EditConsultationModal } from '@verone/consultations';
import { SendConsultationEmailModal } from '@verone/consultations';
import { useConsultations } from '@verone/consultations';
import { useConsultationHistory } from '@verone/consultations';
import { useConsultationImages } from '@verone/consultations';
import { useConsultationItems } from '@verone/consultations';
import { useConsultationQuotes } from '@verone/consultations';
import { useQuotes } from '@verone/finance/hooks';
import { Badge } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { ButtonUnified } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Building,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Package,
  ChevronDown,
  MoreHorizontal,
  FileText,
  ExternalLink,
  Archive,
  ArchiveRestore,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';

// Pre-load images as compressed base64 for @react-pdf (remote URLs block the renderer)
// Uses canvas to resize + JPEG compress → keeps PDF under 500 KB
async function imageUrlToBase64(
  url: string,
  maxSize = 300,
  quality = 0.6
): Promise<string | null> {
  try {
    // Load image via HTMLImageElement (handles CORS naturally for public URLs)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image load failed'));
      image.src = url;
    });

    // Calculate scaled dimensions (never upscale)
    const ratio = Math.min(
      maxSize / img.naturalWidth,
      maxSize / img.naturalHeight,
      1
    );
    const width = Math.round(img.naturalWidth * ratio);
    const height = Math.round(img.naturalHeight * ratio);

    // Draw on canvas and export as compressed JPEG data URI
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.warn('[imageUrlToBase64] Failed for:', url, err);
    return null;
  }
}

// Dynamic import PdfPreviewModal (no SSR — @react-pdf uses browser APIs)
const PdfPreviewModal = dynamic(
  () =>
    import('@verone/finance/components').then(mod => ({
      default: mod.PdfPreviewModal,
    })),
  { ssr: false }
);

// Helper pour récupérer le nom du client (enseigne ou organisation)
function getClientName(consultation: ClientConsultation | null): string {
  if (!consultation) return 'Client inconnu';
  if (consultation.enseigne?.name) {
    return consultation.enseigne.name;
  }
  if (consultation.organisation?.trade_name) {
    return consultation.organisation.trade_name;
  }
  if (consultation.organisation?.legal_name) {
    return consultation.organisation.legal_name;
  }
  return 'Client inconnu';
}

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const {
    consultations,
    loading,
    fetchConsultations,
    updateStatus,
    updateConsultation,
    validateConsultation,
    archiveConsultation,
    unarchiveConsultation,
    deleteConsultation,
  } = useConsultations();

  const consultationId = params.consultationId as string;
  const [consultation, setConsultation] = useState<ClientConsultation | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailPdfLoading, setEmailPdfLoading] = useState(false);
  const [pdfImages, setPdfImages] = useState<{
    consultationImages: Array<{ id: string; base64: string }>;
    productImages: Record<string, string>;
  }>({ consultationImages: [], productImages: {} });
  const [emailPdfImages, setEmailPdfImages] = useState<{
    consultationImages: Array<{ id: string; base64: string }>;
    productImages: Record<string, string>;
  }>({ consultationImages: [], productImages: {} });

  // Hooks for PDF data
  const { consultationItems, calculateTotal, fetchConsultationItems } =
    useConsultationItems(consultationId);

  const { images } = useConsultationImages({ consultationId, autoFetch: true });

  const {
    quotes: linkedQuotes,
    loading: quotesLoading,
    fetchQuotes: refetchLinkedQuotes,
  } = useConsultationQuotes(consultationId);

  const { createQuote } = useQuotes();
  const [creatingQuote, setCreatingQuote] = useState(false);

  const {
    events: historyEvents,
    loading: historyLoading,
    fetchHistory,
  } = useConsultationHistory(consultationId);

  useEffect(() => {
    void fetchConsultations().catch(error => {
      console.error('[ConsultationDetail] Fetch failed:', error);
    });
  }, [fetchConsultations]);

  useEffect(() => {
    if (consultations && consultations.length > 0) {
      const foundConsultation = consultations.find(
        c => c.id === consultationId
      );
      setConsultation(foundConsultation ?? null);
    }
  }, [consultations, consultationId]);

  const handleStatusChange = async (
    newStatus: ClientConsultation['status']
  ) => {
    if (!consultation) return;

    const success = await updateStatus(consultationId, newStatus);
    if (success) {
      setConsultation(prev => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleUpdateConsultation = async (
    updates: Partial<ClientConsultation>
  ): Promise<boolean> => {
    try {
      const success = await updateConsultation(consultationId, updates);
      if (success) {
        await fetchConsultations();
      }
      return success;
    } catch (error) {
      console.error('[ConsultationDetail] Update failed:', error);
      return false;
    }
  };

  const handleValidateConsultation = async () => {
    try {
      const success = await validateConsultation(consultationId);
      if (success) {
        await fetchConsultations();
      }
    } catch (error) {
      console.error('[ConsultationDetail] Validate failed:', error);
    }
  };

  const handleArchiveConsultation = async () => {
    try {
      const success = await archiveConsultation(consultationId);
      if (success) {
        await fetchConsultations();
      }
    } catch (error) {
      console.error('[ConsultationDetail] Archive failed:', error);
    }
  };

  const handleUnarchiveConsultation = async () => {
    try {
      const success = await unarchiveConsultation(consultationId);
      if (success) {
        await fetchConsultations();
      }
    } catch (error) {
      console.error('[ConsultationDetail] Unarchive failed:', error);
    }
  };

  const handleItemsChanged = useCallback(() => {
    void fetchConsultationItems(consultationId).catch(err => {
      console.error('[ConsultationDetail] Refresh items failed:', err);
    });
  }, [fetchConsultationItems, consultationId]);

  const handleCreateQuote = async () => {
    if (!consultation || consultationItems.length === 0) return;
    setCreatingQuote(true);
    try {
      const supabase = createClient();

      // Find parent organisation for the enseigne (billing org)
      let partnerId: string | null = null;

      let billingAddress: Record<string, unknown> | undefined;

      if (consultation.enseigne_id) {
        const { data: parentOrg } = await supabase
          .from('organisations')
          .select('id, legal_name, address_line1, city, postal_code, country')
          .eq('enseigne_id', consultation.enseigne_id)
          .eq('is_enseigne_parent', true)
          .single();

        if (parentOrg) {
          partnerId = parentOrg.id;
          if (parentOrg.address_line1) {
            billingAddress = {
              street: parentOrg.address_line1,
              city: parentOrg.city ?? '',
              postal_code: parentOrg.postal_code ?? '',
              country: parentOrg.country ?? 'FR',
            };
          }
        } else {
          // Fallback: first org of the enseigne
          const { data: firstOrg } = await supabase
            .from('organisations')
            .select('id, legal_name, address_line1, city, postal_code, country')
            .eq('enseigne_id', consultation.enseigne_id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
          if (firstOrg) {
            partnerId = firstOrg.id;
            if (firstOrg.address_line1) {
              billingAddress = {
                street: firstOrg.address_line1,
                city: firstOrg.city ?? '',
                postal_code: firstOrg.postal_code ?? '',
                country: firstOrg.country ?? 'FR',
              };
            }
          }
        }
      } else if (consultation.organisation_id) {
        partnerId = consultation.organisation_id;
        // Fetch address for direct org
        const { data: directOrg } = await supabase
          .from('organisations')
          .select('address_line1, city, postal_code, country')
          .eq('id', consultation.organisation_id)
          .single();
        if (directOrg?.address_line1) {
          billingAddress = {
            street: directOrg.address_line1,
            city: directOrg.city ?? '',
            postal_code: directOrg.postal_code ?? '',
            country: directOrg.country ?? 'FR',
          };
        }
      }

      if (!partnerId) {
        console.error(
          '[ConsultationDetail] No partner found for quote creation'
        );
        return;
      }

      // Map consultation items to quote items
      const items = consultationItems
        .filter(item => !item.is_free)
        .map(item => ({
          product_id: item.product_id,
          description: item.product?.name ?? 'Produit',
          quantity: item.quantity,
          unit_price_ht: item.unit_price ?? 0,
          tva_rate: 20,
          discount_percentage: 0,
          eco_tax: 0,
        }));

      if (items.length === 0) {
        console.error('[ConsultationDetail] No billable items');
        return;
      }

      const quoteId = await createQuote({
        channel_id: null,
        customer_id: partnerId,
        customer_type: 'organization',
        items,
        validity_days: 30,
        notes: consultation.descriptif ?? undefined,
        consultation_id: consultationId,
        billing_address: billingAddress,
      });

      if (quoteId) {
        await refetchLinkedQuotes();
        await fetchHistory();
        router.push(`/factures/devis/${quoteId}`);
      }
    } catch (error) {
      console.error('[ConsultationDetail] Create quote failed:', error);
    } finally {
      setCreatingQuote(false);
    }
  };

  const handleDeleteConsultation = async () => {
    if (
      !window.confirm(
        'Êtes-vous sûr de vouloir supprimer définitivement cette consultation ?'
      )
    ) {
      return;
    }
    const success = await deleteConsultation(consultationId);
    if (success) {
      router.push('/consultations');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'bg-gray-100 text-gray-900 border-gray-200';
      case 'en_cours':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'terminee':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'annulee':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Clock className="h-3 w-3" />;
      case 'en_cours':
        return <AlertCircle className="h-3 w-3" />;
      case 'terminee':
        return <CheckCircle className="h-3 w-3" />;
      case 'annulee':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-200';
      case 2:
        return 'bg-gray-100 text-gray-900 border-gray-200';
      case 3:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 4:
        return 'bg-green-100 text-green-800 border-green-200';
      case 5:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Très urgent';
      case 2:
        return 'Urgent';
      case 3:
        return 'Normal';
      case 4:
        return 'Faible';
      case 5:
        return 'Très faible';
      default:
        return 'Normal';
    }
  };

  const statusOptions: {
    value: ClientConsultation['status'];
    label: string;
  }[] = [
    { value: 'en_attente', label: 'En attente' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'terminee', label: 'Terminée' },
    { value: 'annulee', label: 'Annulée' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black mx-auto mb-1" />
          <p className="text-gray-600">Chargement de la consultation...</p>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-1">
            <AlertCircle className="h-3 w-3 text-gray-400 mx-auto mb-1" />
            <h3 className="text-xs font-medium text-gray-900 mb-1">
              Consultation non trouvée
            </h3>
            <p className="text-gray-600 mb-1">
              Cette consultation n&apos;existe pas ou a été supprimée.
            </p>
            <ButtonUnified
              onClick={() => router.push('/consultations')}
              variant="outline"
            >
              <ArrowLeft className="h-3 w-3 mr-2" />
              Retour aux consultations
            </ButtonUnified>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientName = getClientName(consultation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header compact ── */}
      <div className="bg-white border-b">
        <div className="w-full px-2 py-1">
          {/* Row 1: Back + Title + Badges */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              <ButtonUnified
                variant="ghost"
                onClick={() => router.push('/consultations')}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-3 w-3 mr-2" />
                Retour
              </ButtonUnified>
              <div>
                <h1 className="text-xs font-bold text-black">
                  Consultation: {clientName}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={getStatusColor(consultation.status)}
              >
                {getStatusIcon(consultation.status)}
                <span className="ml-1 capitalize">
                  {consultation.status.replace('_', ' ')}
                </span>
              </Badge>
              <Badge
                variant="outline"
                className={getPriorityColor(consultation.priority_level)}
              >
                Priorité: {getPriorityLabel(consultation.priority_level)}
              </Badge>
              {consultation.validated_at && (
                <Badge className="bg-green-600 text-white">
                  Validée le{' '}
                  {new Date(consultation.validated_at).toLocaleDateString(
                    'fr-FR'
                  )}
                </Badge>
              )}
              {consultation.archived_at && (
                <Badge
                  variant="outline"
                  className="border-gray-400 text-gray-700"
                >
                  Archivée le{' '}
                  {new Date(consultation.archived_at).toLocaleDateString(
                    'fr-FR'
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Row 2: Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Modifier */}
            <ButtonUnified
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-3 w-3 mr-2" />
              Modifier
            </ButtonUnified>

            {/* Changer statut dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ButtonUnified variant="outline" size="sm">
                  Changer statut
                  <ChevronDown className="h-3 w-3 ml-2" />
                </ButtonUnified>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {statusOptions.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    disabled={consultation.status === opt.value}
                    onClick={() => {
                      void handleStatusChange(opt.value).catch(error => {
                        console.error(
                          '[ConsultationDetail] Status change failed:',
                          error
                        );
                      });
                    }}
                  >
                    {getStatusIcon(opt.value)}
                    <span className="ml-2">{opt.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Plus d'actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ButtonUnified variant="outline" size="sm">
                  <MoreHorizontal className="h-3 w-3 mr-2" />
                  Plus
                </ButtonUnified>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {/* Valider */}
                {!consultation.validated_at && !consultation.archived_at && (
                  <DropdownMenuItem
                    onClick={() => {
                      void handleValidateConsultation().catch(error => {
                        console.error(
                          '[ConsultationDetail] Validate failed:',
                          error
                        );
                      });
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Valider la consultation
                  </DropdownMenuItem>
                )}
                {/* Archiver */}
                {!consultation.archived_at && (
                  <DropdownMenuItem
                    onClick={() => {
                      void handleArchiveConsultation().catch(error => {
                        console.error(
                          '[ConsultationDetail] Archive failed:',
                          error
                        );
                      });
                    }}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archiver
                  </DropdownMenuItem>
                )}
                {/* Désarchiver */}
                {consultation.archived_at && (
                  <DropdownMenuItem
                    onClick={() => {
                      void handleUnarchiveConsultation().catch(error => {
                        console.error(
                          '[ConsultationDetail] Unarchive failed:',
                          error
                        );
                      });
                    }}
                  >
                    <ArchiveRestore className="h-4 w-4 mr-2 text-blue-600" />
                    Désarchiver
                  </DropdownMenuItem>
                )}
                {/* Supprimer */}
                {consultation.archived_at && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => {
                        void handleDeleteConsultation().catch(error => {
                          console.error(
                            '[ConsultationDetail] Delete failed:',
                            error
                          );
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer définitivement
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Envoyer par email */}
            <ButtonUnified
              variant="outline"
              size="sm"
              disabled={emailPdfLoading}
              onClick={() => {
                setEmailPdfLoading(true);
                const loadImagesForEmail = async () => {
                  try {
                    const productImgEntries = await Promise.all(
                      consultationItems
                        .filter(item => item.product?.image_url)
                        .map(async item => {
                          const base64 = await imageUrlToBase64(
                            item.product!.image_url!,
                            300,
                            0.6
                          );
                          return [item.product_id, base64 ?? ''] as const;
                        })
                    );
                    setEmailPdfImages({
                      consultationImages: [],
                      productImages: Object.fromEntries(
                        productImgEntries.filter(([, b]) => b)
                      ),
                    });
                  } catch (err) {
                    console.error('[Email] Image preload failed:', err);
                  } finally {
                    setEmailPdfLoading(false);
                    setShowEmailModal(true);
                  }
                };
                void loadImagesForEmail();
              }}
            >
              <Mail className="h-3 w-3 mr-2" />
              {emailPdfLoading ? 'Chargement...' : 'Envoyer par email'}
            </ButtonUnified>

            {/* Résumé PDF */}
            <ButtonUnified
              variant="outline"
              size="sm"
              disabled={pdfLoading}
              onClick={() => {
                setPdfLoading(true);
                // Pre-load product images as base64 before opening PDF
                const loadImages = async () => {
                  try {
                    const productImgEntries = await Promise.all(
                      consultationItems
                        .filter(item => item.product?.image_url)
                        .map(async item => {
                          const base64 = await imageUrlToBase64(
                            item.product!.image_url!,
                            300,
                            0.6
                          );
                          return [item.product_id, base64 ?? ''] as const;
                        })
                    );

                    setPdfImages({
                      consultationImages: [],
                      productImages: Object.fromEntries(
                        productImgEntries.filter(([, b]) => b)
                      ),
                    });
                    setShowPdfPreview(true);
                  } catch (err) {
                    console.error('[PDF] Image preload failed:', err);
                    // Open anyway without images
                    setShowPdfPreview(true);
                  } finally {
                    setPdfLoading(false);
                  }
                };
                void loadImages();
              }}
            >
              <FileText className="h-3 w-3 mr-2" />
              {pdfLoading ? 'Chargement...' : 'Résumé PDF'}
            </ButtonUnified>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="w-full px-2 py-1 space-y-1">
        {/* Photos + Infos side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
          {/* Photos gallery */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center mb-3">
                  <Package className="h-3 w-3 mr-2 text-gray-500" />
                  <span className="text-sm font-semibold">
                    Photos consultation
                  </span>
                </div>
                <ConsultationImageGallery
                  consultationId={consultationId}
                  consultationTitle={clientName}
                  consultationStatus={consultation.status}
                  allowEdit
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Client info */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center mb-3">
                  <Building className="h-3 w-3 mr-2 text-gray-500" />
                  <span className="text-sm font-semibold">Informations</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  <div className="space-y-1">
                    <div>
                      <p className="text-xs text-gray-600">Client</p>
                      <p className="font-medium">{clientName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Email client</p>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 text-gray-400 mr-2" />
                        <p className="font-medium">
                          {consultation.client_email}
                        </p>
                      </div>
                    </div>
                    {consultation.client_phone && (
                      <div>
                        <p className="text-xs text-gray-600">Téléphone</p>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 text-gray-400 mr-2" />
                          <p className="font-medium">
                            {consultation.client_phone}
                          </p>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-600">
                        Canal d&apos;origine
                      </p>
                      <p className="font-medium capitalize">
                        {consultation.source_channel}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div>
                      <p className="text-xs text-gray-600">Créée le</p>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 text-gray-400 mr-2" />
                        <p className="font-medium">
                          {new Date(consultation.created_at).toLocaleDateString(
                            'fr-FR'
                          )}
                        </p>
                      </div>
                    </div>
                    {consultation.tarif_maximum && (
                      <div>
                        <p className="text-xs text-gray-600">Budget maximum</p>
                        <p className="font-medium">
                          {consultation.tarif_maximum}€
                        </p>
                      </div>
                    )}
                    {consultation.estimated_response_date && (
                      <div>
                        <p className="text-xs text-gray-600">Réponse estimée</p>
                        <p className="font-medium">
                          {new Date(
                            consultation.estimated_response_date
                          ).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                    {consultation.assigned_to && (
                      <div>
                        <p className="text-xs text-gray-600">Assignée à</p>
                        <div className="flex items-center">
                          <User className="h-3 w-3 text-gray-400 mr-2" />
                          <p className="font-medium">
                            {consultation.assigned_to}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-1">
                  <p className="text-xs text-gray-600 mb-1">Description</p>
                  <p className="bg-gray-50 p-1 rounded">
                    {consultation.descriptif}
                  </p>
                </div>

                {consultation.notes_internes && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-600 mb-1">Notes internes</p>
                    <p className="bg-gray-50 p-1 rounded border-l-4 border-gray-300">
                      {consultation.notes_internes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Produits consultation */}
        <ConsultationOrderInterface
          consultationId={consultationId}
          onItemsChanged={handleItemsChanged}
        />

        {/* Devis liés + Timeline side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
          {/* Devis liés */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold">Devis lies</span>
                  <span className="text-xs text-gray-400">
                    ({linkedQuotes.length})
                  </span>
                </div>
                <ButtonUnified
                  variant="outline"
                  size="sm"
                  disabled={creatingQuote || consultationItems.length === 0}
                  onClick={() => {
                    void handleCreateQuote().catch(error => {
                      console.error(
                        '[ConsultationDetail] Create quote failed:',
                        error
                      );
                    });
                  }}
                >
                  {creatingQuote ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3 mr-2" />
                  )}
                  {creatingQuote ? 'Creation...' : 'Creer un devis'}
                </ButtonUnified>
              </div>

              {quotesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                </div>
              ) : linkedQuotes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun devis lie a cette consultation
                </p>
              ) : (
                <div className="space-y-2">
                  {linkedQuotes.map(quote => {
                    const statusColors: Record<string, string> = {
                      draft: 'bg-gray-100 text-gray-700',
                      sent: 'bg-blue-100 text-blue-700',
                      accepted: 'bg-green-100 text-green-700',
                      declined: 'bg-red-100 text-red-700',
                      expired: 'bg-amber-100 text-amber-700',
                      converted: 'bg-purple-100 text-purple-700',
                    };
                    const statusLabels: Record<string, string> = {
                      draft: 'Brouillon',
                      sent: 'Envoye',
                      accepted: 'Accepte',
                      declined: 'Refuse',
                      expired: 'Expire',
                      converted: 'Converti',
                    };

                    return (
                      <div
                        key={quote.id}
                        className="flex items-center justify-between p-2 rounded border border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">
                              {quote.document_number}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(quote.document_date).toLocaleDateString(
                                'fr-FR'
                              )}{' '}
                              —{' '}
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(quote.total_ht)}{' '}
                              HT
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              statusColors[quote.quote_status] ??
                              'bg-gray-100 text-gray-700'
                            }
                          >
                            {statusLabels[quote.quote_status] ??
                              quote.quote_status}
                          </Badge>
                          <ButtonUnified
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/factures/devis/${quote.id}`)
                            }
                          >
                            <ExternalLink className="h-3 w-3" />
                          </ButtonUnified>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline historique */}
          <ConsultationTimeline
            events={historyEvents}
            loading={historyLoading}
          />
        </div>
      </div>

      {/* Modal d'édition */}
      {consultation && (
        <EditConsultationModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          consultation={consultation}
          onUpdated={handleUpdateConsultation}
        />
      )}

      {/* Modal envoi email */}
      {consultation && (
        <SendConsultationEmailModal
          open={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          consultationId={consultationId}
          clientEmail={consultation.client_email ?? ''}
          clientName={clientName}
          consultationPdfDocument={
            <ConsultationSummaryPdf
              consultation={consultation}
              items={consultationItems}
              images={images}
              totalHT={calculateTotal()}
              clientName={clientName}
              preloadedImages={emailPdfImages}
            />
          }
          linkedQuotes={linkedQuotes.map(q => ({
            id: q.id,
            document_number: q.document_number,
            qonto_pdf_url: q.qonto_pdf_url,
            qonto_invoice_id: q.qonto_invoice_id,
          }))}
          onSent={() => {
            void fetchHistory().catch(err => {
              console.error(
                '[ConsultationDetail] Refresh history after email:',
                err
              );
            });
          }}
        />
      )}

      {/* Modal PDF preview */}
      {showPdfPreview && consultation && (
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          title={`Résumé - ${clientName}`}
          filename={`consultation-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`}
          document={
            <ConsultationSummaryPdf
              consultation={consultation}
              items={consultationItems}
              images={images}
              totalHT={calculateTotal()}
              clientName={clientName}
              preloadedImages={pdfImages}
            />
          }
        />
      )}
    </div>
  );
}
