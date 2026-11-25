import { createClient } from "@supabase/supabase-js";

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Token ausente." }), { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Supabase não configurado." }), { status: 503, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !caller) {
    return new Response(JSON.stringify({ error: "Sessão inválida." }), { status: 401, headers: corsHeaders });
  }

  const { data: callerProfile } = await supabaseAdmin.from("profiles").select("role").eq("id", caller.id).single();
  const role = typeof callerProfile?.role === "object" ? (callerProfile.role as any).value : String(callerProfile?.role || "");
  if (!role.toLowerCase().includes("admin")) {
    return new Response(JSON.stringify({ error: "Acesso restrito a administradores." }), { status: 403, headers: corsHeaders });
  }

  const [pRes, cRes, profRes] = await Promise.all([
    supabaseAdmin.from("paroquias").select("id, nome, endereco, telefone").order("nome"),
    supabaseAdmin.from("comunidades").select("id, paroquia_id, nome, padroeiro").order("nome"),
    supabaseAdmin.from("profiles").select("id, nome, email, role, paroquia_id, comunidade_id, pastoral_type").order("nome"),
  ]);

  return new Response(
    JSON.stringify({
      paroquias: pRes.data || [],
      comunidades: cRes.data || [],
      profiles: (profRes.data || []).map((p: any) => ({
        ...p,
        role: typeof p.role === "object" ? (p.role as any).value : String(p.role || ""),
      })),
    }),
    { headers: corsHeaders }
  );
};
