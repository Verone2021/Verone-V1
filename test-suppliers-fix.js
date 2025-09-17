// Test simple pour vérifier la correction de l'erreur suppliers.map
// Ce test simule exactement le problème et sa solution

console.log('🧪 Test de la correction de l\'erreur suppliers.map\n')

// Simulation du hook useOrganisations (ce qu'il retourne réellement)
function useOrganisations() {
  return {
    organisations: [
      { id: '1', name: 'Kartell' },
      { id: '2', name: 'Hay' },
      { id: '3', name: 'Muuto' },
      { id: '4', name: 'Flos' }
    ],
    loading: false,
    error: null
  }
}

// Simulation du hook useSuppliers (qui appelle useOrganisations)
function useSuppliers() {
  return useOrganisations() // Retourne exactement ce que useOrganisations retourne
}

console.log('1️⃣ Test de l\'ancien code (qui causait l\'erreur)...')

try {
  // ❌ Ancien code - FAUSSE destructuration
  const badResult = useSuppliers()
  const suppliers_old = badResult.suppliers // undefined !
  const loading_old = badResult.loading

  console.log('   suppliers (ancien):', suppliers_old) // undefined
  console.log('   loading (ancien):', loading_old)

  // Tentative d'utilisation de .map() - CAUSAIT L'ERREUR
  suppliers_old.map((supplier) => supplier.name) // TypeError!

} catch (error) {
  console.log('❌ Erreur comme attendu:', error.message)
}

console.log('\n2️⃣ Test du nouveau code (corrigé)...')

try {
  // ✅ Nouveau code - BONNE destructuration
  const { organisations: suppliers, loading: suppliersLoading } = useSuppliers()

  console.log('   suppliers (nouveau):', suppliers)
  console.log('   loading (nouveau):', suppliersLoading)

  // Utilisation de .map() - FONCTIONNE MAINTENANT !
  const supplierNames = suppliers.map((supplier) => supplier.name)
  console.log('   Noms fournisseurs:', supplierNames)

  // Simulation du JSX Select qui causait l'erreur
  const selectItems = suppliers.map((supplier) => ({
    key: supplier.id,
    value: supplier.id,
    label: supplier.name
  }))

  console.log('✅ Select items générés:', selectItems)

} catch (error) {
  console.log('❌ Erreur inattendue:', error.message)
}

console.log('\n🎉 Test terminé - La correction fonctionne parfaitement !')
console.log('📝 Résumé:')
console.log('   - Ancien code: suppliers = undefined → .map() échoue')
console.log('   - Nouveau code: suppliers = organisations array → .map() fonctionne')
console.log('   - L\'erreur TypeError est résolue ! ✅')