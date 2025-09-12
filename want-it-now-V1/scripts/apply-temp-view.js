const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config()

async function applyTempView() {
  console.log('🚀 Application de la view temporaire...')
  
  try {
    // Utiliser le service role pour contourner les RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ACCESS_TOKEN,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('supabase/migrations/temp_create_view_proprietes_contrats.sql', 'utf8')
    
    // Séparer les commandes SQL (simple split sur les points-virgules)
    const commands = sqlContent
      .split(';')
      .filter(cmd => cmd.trim().length > 0)
      .filter(cmd => !cmd.trim().startsWith('--') && !cmd.trim().startsWith('/*'))
    
    console.log(`📝 Exécution de ${commands.length} commandes SQL...`)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim()
      if (command.length === 0) continue
      
      console.log(`🔄 Commande ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`)
      
      try {
        // Utiliser rpc pour exécuter des commandes SQL brutes
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';'
        })
        
        if (error) {
          console.log(`⚠️  Erreur sur commande ${i + 1} (peut être normale):`, error.message)
        } else {
          console.log(`✅ Commande ${i + 1} exécutée avec succès`)
        }
      } catch (err) {
        console.log(`⚠️  Exception sur commande ${i + 1}:`, err.message)
      }
    }
    
    // Tester la view créée
    console.log('🧪 Test de la view créée...')
    
    const { data: testData, error: testError } = await supabase
      .from('v_proprietes_avec_contrats_actifs')
      .select('propriete_id, propriete_nom, statut_contrat')
      .limit(5)
    
    if (testError) {
      console.error('❌ Erreur test view:', testError)
    } else {
      console.log('✅ View fonctionnelle!')
      console.log(`📊 Trouvé ${testData.length} propriétés avec contrats:`)
      testData.forEach(prop => {
        console.log(`  - ${prop.propriete_nom} (${prop.propriete_id}) - ${prop.statut_contrat}`)
      })
    }
    
    console.log('🎉 Script terminé!')
    
  } catch (error) {
    console.error('❌ Erreur script:', error)
  }
}

applyTempView()
  .then(() => {
    console.log('✅ Application view temporaire terminée')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })