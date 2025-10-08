#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

console.log('🚀 Exécution SQL via Supabase REST API...\n');

(async () => {
  try {
    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20251007_001_product_colors_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration chargée:', migrationPath);
    console.log('📏 Taille SQL:', migrationSQL.length, 'caractères\n');

    // Construire l'URL de l'API REST Supabase
    const apiUrl = `${supabaseUrl}/rest/v1/rpc`;

    // Diviser le SQL en commandes individuelles (simple split sur ';')
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 ${commands.length} commandes SQL à exécuter\n`);

    // Exécuter via fetch (API REST Supabase accepte SQL via query)
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';

      // Skip comments
      if (command.startsWith('/*') || command.trim().startsWith('COMMENT')) {
        console.log(`⏭️  Commande ${i + 1}/${commands.length}: Comment (skipped)`);
        continue;
      }

      console.log(`⚙️  Commande ${i + 1}/${commands.length}: ${command.substring(0, 60)}...`);

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: command })
        });

        if (!response.ok) {
          const error = await response.text();
          console.warn(`   ⚠️  Erreur (peut être ignorée si table existe):`, error.substring(0, 100));
        } else {
          console.log(`   ✅ Succès`);
        }
      } catch (err) {
        console.warn(`   ⚠️  Erreur commande:`, err.message.substring(0, 100));
      }
    }

    console.log('\n✅ Migration terminée (vérification manuelle recommandée)\n');
    console.log('📋 Vérification recommandée:');
    console.log('   1. Aller sur Supabase Dashboard');
    console.log('   2. Vérifier que la table "product_colors" existe');
    console.log('   3. Vérifier les 15 couleurs prédéfinies');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();
