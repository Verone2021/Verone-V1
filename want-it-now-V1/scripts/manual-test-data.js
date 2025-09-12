/**
 * Créer des contrats de test manuellement via l'interface web
 * Instructions pour créer les données de test
 */

console.log(`
🎯 INSTRUCTIONS POUR CRÉER LES CONTRATS DE TEST

1. Aller sur http://localhost:3000/contrats/new

2. CONTRAT FIXE (Villa Nice):
   ================================
   Type: fixe
   Propriété: Choisir une propriété existante (ex: Villa Nice)
   Date début: 2025-03-01
   Date fin: 2026-02-28
   Meublé: Oui
   Autorisation sous-location: Oui
   Commission: 12%
   Usage propriétaire max: 45 jours

   Informations financières:
   - Loyer mensuel HT: 2500€
   - Charges mensuelles: 200€
   - Dépôt de garantie: 2500€
   - Jour paiement: 5

   Bailleur:
   - Nom: Jean Dupont
   - Email: jean.dupont@gmail.com
   - Téléphone: +33 6 12 34 56 78

3. CONTRAT VARIABLE (Studio Paris):
   ================================
   Type: variable
   Propriété: Choisir une autre propriété (ex: Studio Trocadéro)
   Date début: 2025-02-01
   Date fin: 2026-01-31
   Meublé: Oui
   Autorisation sous-location: Oui
   Commission: 10%
   Usage propriétaire max: 30 jours

   Informations financières:
   - Estimation revenus mensuels: 3200€
   - Méthode calcul: revenus_nets
   - Dates paiement: Mensuel le 10
   - Frais internet: 45€
   - Frais domotique: 25€

   Bailleur:
   - Nom: SCI Famille Martin
   - Email: contact@sci-martin.fr
   - Téléphone: +33 1 42 33 44 55

4. Après création, vérifier:
   - /contrats doit afficher 2 contrats
   - /reservations ne doit afficher que les propriétés avec contrats

⚠️  Si les propriétés n'existent pas, allez d'abord sur /proprietes/new pour les créer.
`);

// Instructions pour créer via code si nécessaire
const testContractData = {
  fixe: {
    type_contrat: 'fixe',
    date_debut: '2025-03-01',
    date_fin: '2026-02-28',
    meuble: true,
    autorisation_sous_location: true,
    commission_pourcentage: 12,
    usage_proprietaire_jours_max: 45,
    loyer_mensuel_ht: 2500,
    charges_mensuelles: 200,
    depot_garantie: 2500,
    jour_paiement_loyer: 5,
    bailleur_nom: 'Jean Dupont',
    bailleur_email: 'jean.dupont@gmail.com',
    bailleur_telephone: '+33 6 12 34 56 78'
  },
  variable: {
    type_contrat: 'variable',
    date_debut: '2025-02-01',
    date_fin: '2026-01-31',
    meuble: true,
    autorisation_sous_location: true,
    commission_pourcentage: 10,
    usage_proprietaire_jours_max: 30,
    estimation_revenus_mensuels: 3200,
    methode_calcul_revenus: 'revenus_nets',
    dates_paiement: 'Mensuel le 10',
    frais_abonnement_internet: 45,
    frais_equipements_domotique: 25,
    bailleur_nom: 'SCI Famille Martin',
    bailleur_email: 'contact@sci-martin.fr',
    bailleur_telephone: '+33 1 42 33 44 55'
  }
}

console.log('\n📋 Données JSON pour copy/paste si besoin:')
console.log('CONTRAT FIXE:', JSON.stringify(testContractData.fixe, null, 2))
console.log('CONTRAT VARIABLE:', JSON.stringify(testContractData.variable, null, 2))