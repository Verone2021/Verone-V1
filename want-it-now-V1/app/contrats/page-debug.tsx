import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { getContrats } from '@/actions/contrats'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ContratsDebugPage() {
  console.log('🔍 DEBUG: ContratsDebugPage - Starting page load')
  
  const authData = await getServerAuthData()
  console.log('🔍 DEBUG: Auth data:', authData ? 'User found' : 'No user')
  
  if (!authData.user) {
    console.log('🔍 DEBUG: No user, redirecting to login')
    redirect('/login')
  }

  console.log('🔍 DEBUG: User authenticated, calling getContrats()')
  
  // Test simple sans paramètres
  const contratsResult = await getContrats()
  
  console.log('🔍 DEBUG: getContrats result:', {
    success: contratsResult.success,
    error: contratsResult.error,
    dataLength: contratsResult.data?.length || 0
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🔍 DEBUG - Contrats</h1>
        <p className="text-gray-600 mt-1">Page de diagnostic des contrats</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informations de Debug</h2>
        
        <div className="space-y-2 text-sm">
          <div><strong>Auth Status:</strong> {authData.user ? '✅ Connected' : '❌ Not connected'}</div>
          <div><strong>User ID:</strong> {authData.user?.id || 'N/A'}</div>
          <div><strong>Organisation:</strong> {authData.organisationId || 'N/A'}</div>
          <div><strong>Role:</strong> {authData.userRole || 'N/A'}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Résultat getContrats()</h2>
        
        <div className="space-y-2 text-sm">
          <div><strong>Success:</strong> {contratsResult.success ? '✅ True' : '❌ False'}</div>
          <div><strong>Error:</strong> {contratsResult.error || 'Aucune erreur'}</div>
          <div><strong>Data Length:</strong> {contratsResult.data?.length || 0}</div>
          <div><strong>Total:</strong> {'total' in contratsResult ? contratsResult.total : 'N/A'}</div>
        </div>

        {contratsResult.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="text-red-800 font-medium">Erreur détectée:</h3>
            <p className="text-red-700 mt-1">{contratsResult.error}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Actions disponibles</h2>
        
        <div className="flex gap-4">
          <Link href="/contrats/new">
            <Button className="bg-[#D4841A] hover:bg-[#B8731A] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Tester Nouveau contrat
            </Button>
          </Link>
          
          <Link href="/contrats">
            <Button variant="outline">
              Retourner à la page normale
            </Button>
          </Link>
        </div>
      </div>

      {contratsResult.success && contratsResult.data && contratsResult.data.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Données Contrats (Premier contrat)</h2>
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(contratsResult.data[0], null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}