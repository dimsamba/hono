//<reference types="https://deno.land/x/deno_types/types.d.ts" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  try {
    const { error } = await supabase.rpc('run_monthly_expenses')
    if (error) throw error

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err: any) {
    console.error('Edge Function Error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 })
  }
})
