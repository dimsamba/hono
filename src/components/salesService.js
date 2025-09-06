import { supabase } from '../components/supabaseClient';

export async function createSale(saleData) {
  // Get the next order number from Postgres
  const { data: orderNum, error: numError } = await supabase.rpc('get_next_order_number');
  if (numError) throw numError;

  // Insert sale with that order number
  const { data, error } = await supabase
    .from('sales')
    .insert([
      {
        orderNumber: orderNum,
        date: new Date().toISOString().split('T')[0],
        ...saleData,
      },
    ])
    .select();

  if (error) throw error;
  return data;
}
