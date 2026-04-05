import { createClient } from "@supabase/supabase-js";

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ paroquias: [], comunidades: [] }), {
      headers: corsHeaders,
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [pRes, cRes] = await Promise.all([
    supabaseAdmin.from("paroquias").select("id, nome").order("nome"),
    supabaseAdmin.from("comunidades").select("id, paroquia_id, nome").order("nome"),
  ]);

  return new Response(
    JSON.stringify({
      paroquias: pRes.data || [],
      comunidades: cRes.data || [],
    }),
    { headers: corsHeaders }
  );
};
