'use client';

/**
 * PricingFooterNote — carte explicative en bas de l'onglet Tarification.
 * Rappelle les règles de calcul du prix minimum de vente.
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

export function PricingFooterNote() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
      <p className="text-xs text-neutral-600 leading-relaxed">
        <span className="font-medium">Rappel des règles de calcul.</span> Le
        prix minimum de vente est calculé à partir du prix de revient pondéré
        sur les 12 derniers mois d'achats. Ce prix de revient inclut le prix
        d'achat fournisseur et les frais logistiques (transport, douane,
        assurance) amortis par unité. Pour l'ajuster, modifie la marge cible
        ci-dessus ou attends le prochain achat fournisseur qui actualisera
        automatiquement le prix de revient moyen.
      </p>
    </div>
  );
}
