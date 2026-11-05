import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY // зөвхөн anon key. service_role хэзээ ч ашиглахгүй
)
export const money = (n) => '₮' + Number(n || 0).toLocaleString('mn-MN')
