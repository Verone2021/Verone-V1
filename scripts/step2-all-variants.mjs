import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aorroydfjsrygmosnzrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcyNzQ3MCwiZXhwIjoyMDczMzAzNDcwfQ.q99nRT2xxk8QLbjX10UfnqCsW95wV4h45AYqYxbjRjY'
);

async function main() {
  const res = await supabase
    .from('products')
    .select('sku, name, variant_attributes, stock_real')
    .eq('variant_group_id', 'fff629d9-8d80-4357-b186-f9fd60e529d4');
  console.log(JSON.stringify(res, null, 2));
}
main();
