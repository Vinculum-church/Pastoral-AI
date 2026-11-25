import { createClient } from "@supabase/supabase-js";

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const ALLOWED_TABLES = ["paroquias", "comunidades", "profiles"];
const ALLOWED_ACTIONS = ["insert", "update", "delete"];

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
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

  let body: any;
  try { body = await request.json(); } catch { 
    return new Response(JSON.stringify({ error: "Body inválido." }), { status: 400, headers: corsHeaders });
  }

  const { table, action, data, id } = body;

  if (!ALLOWED_TABLES.includes(table) || !ALLOWED_ACTIONS.includes(action)) {
    return new Response(JSON.stringify({ error: "Operação não permitida." }), { status: 400, headers: corsHeaders });
  }

  try {
    let result: any;

    if (action === "insert") {
      result = await supabaseAdmin.from(table).insert(data).select().single();
    } else if (action === "update") {
      if (!id) return new Response(JSON.stringify({ error: "ID obrigatório para update." }), { status: 400, headers: corsHeaders });
      result = await supabaseAdmin.from(table).update(data).eq("id", id);
    } else if (action === "delete") {
      if (!id) return new Response(JSON.stringify({ error: "ID obrigatório para delete." }), { status: 400, headers: corsHeaders });
      result = await supabaseAdmin.from(table).delete().eq("id", id);
    }

    if (result?.error) {
      return new Response(JSON.stringify({ error: result.error.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, data: result?.data }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Erro interno." }), { status: 500, headers: corsHeaders });
  }
};
