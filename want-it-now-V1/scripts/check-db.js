#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kpwkrqzqvjtzagudxxnk.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Vérification base de données...')
console.log(`URL: ${supabaseUrl}`)
console.log(`Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NON TROUVÉE'}`)

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDB() {
  try {
    // 1. Test connexion
    console.log('\n📡 Test connexion...')
    const { data, error } = await supabase.from('organisations').select('count')
    
    if (error) {
      console.error('❌ Erreur connexion:', error.message)
      return
    }
    
    console.log('✅ Connexion OK')

    // 2. Vérifier organisations
    console.log('\n🏢 Organisations:')
    const { data: orgs, error: orgError } = await supabase
      .from('organisations')
      .select('*')
    
    if (orgError) {
      console.error('❌ Erreur organisations:', orgError.message)
    } else {
      console.log(`   Trouvées: ${orgs?.length || 0}`)
      orgs?.forEach(org => {
        console.log(`   • ${org.nom} (${org.pays}) - ID: ${org.id}`)
      })
    }

    // 3. Vérifier propriétés
    console.log('\n🏠 Propriétés:')
    const { data: props, error: propError } = await supabase
      .from('proprietes')
      .select('*')
    
    if (propError) {
      console.error('❌ Erreur propriétés:', propError.message)
    } else {
      console.log(`   Trouvées: ${props?.length || 0}`)
    }

    // 4. Vérifier contrats
    console.log('\n📜 Contrats:')
    const { data: contrats, error: contratError } = await supabase
      .from('contrats')
      .select('*')
    
    if (contratError) {
      console.error('❌ Erreur contrats:', contratError.message)
    } else {
      console.log(`   Trouvés: ${contrats?.length || 0}`)
    }

    // 5. Vérifier vue propriétés avec contrats
    console.log('\n👁️ Vue propriétés avec contrats:')
    const { data: vue, error: vueError } = await supabase
      .from('v_proprietes_avec_contrats_actifs')
      .select('*')
    
    if (vueError) {
      console.error('❌ Erreur vue:', vueError.message)
    } else {
      console.log(`   Trouvées: ${vue?.length || 0}`)
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error)
  }
}

checkDB()