/**
 * Script pour créer le bucket Storage "organisation-logos"
 * et configurer les RLS policies
 *
 * Usage: npx tsx scripts/create-storage-bucket-logos.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createStorageBucket() {
  console.log('🪣 Création du bucket "organisation-logos"...\n')

  try {
    // 1. Créer le bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(
      'organisation-logos',
      {
        public: true,
        fileSizeLimit: 5242880, // 5 MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
      }
    )

    if (bucketError) {
      // Si bucket existe déjà, ce n'est pas grave
      if (bucketError.message.includes('already exists')) {
        console.log('ℹ️  Bucket "organisation-logos" existe déjà\n')
      } else {
        throw bucketError
      }
    } else {
      console.log('✅ Bucket "organisation-logos" créé avec succès\n')
    }

    // 2. Vérifier que le bucket existe
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucket = buckets?.find(b => b.name === 'organisation-logos')

    if (bucket) {
      console.log('📋 Configuration du bucket:')
      console.log(`   - ID: ${bucket.id}`)
      console.log(`   - Name: ${bucket.name}`)
      console.log(`   - Public: ${bucket.public}`)
      console.log(`   - File size limit: ${bucket.file_size_limit ? `${bucket.file_size_limit / 1024 / 1024} MB` : 'unlimited'}`)
      console.log(`   - Allowed MIME types: ${bucket.allowed_mime_types?.join(', ') || 'all'}\n`)
    }

    console.log('✅ Setup Storage bucket "organisation-logos" terminé avec succès!')
    console.log('\n📝 Prochaines étapes:')
    console.log('   1. Les RLS policies Storage sont déjà créées via migration SQL')
    console.log('   2. La column logo_url existe dans la table organisations')
    console.log('   3. Les composants OrganisationLogo et LogoUploadButton sont prêts')
    console.log('   4. Vous pouvez maintenant upload/afficher des logos!\n')

  } catch (error) {
    console.error('❌ Erreur lors de la création du bucket:', error)
    process.exit(1)
  }
}

// Exécuter
createStorageBucket()
