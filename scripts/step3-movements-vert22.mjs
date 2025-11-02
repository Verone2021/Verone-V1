import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://aorroydfjsrygmosnzrl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcyNzQ3MCwiZXhwIjoyMDczMzAzNDcwfQ.q99nRT2xxk8QLbjX10UfnqCsW95wV4h45AYqYxbjRjY');

async function main() {
  const res = await supabase.from('stock_movements').select('id, movement_type, quantity_change, performed_at, notes').eq('product_id', '4a9c6ee2-edf9-4a82-986b-ee52a36b16a1').order('performed_at', { ascending: true });
  console.log(JSON.stringify(res, null, 2));
}
main();
