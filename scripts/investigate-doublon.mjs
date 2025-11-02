import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aorroydfjsrygmosnzrl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcyNzQ3MCwiZXhwIjoyMDczMzAzNDcwfQ.q99nRT2xxk8QLbjX10UfnqCsW95wV4h45AYqYxbjRjY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('INVESTIGATION DOUBLON FAUTEUIL MILO VERT');
  
  const res = await supabase
    .from('products')
    .select('id, name, sku, variant_group_id, variant_attributes, stock_real, created_at')
    .in('sku', ['FMIL-VERT-01', 'FMIL-VERT-22']);

  console.log(JSON.stringify(res, null, 2));
}

main();
