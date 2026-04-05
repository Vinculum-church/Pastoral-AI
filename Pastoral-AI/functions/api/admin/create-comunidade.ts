import { createClient } from "@supabase/supabase-js";

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Supabase não configurado." }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Token obrigatório." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await request.json() as any;
  const { nome, paroquiaId, padroeiro } = body;

  if (!nome?.trim() || !paroquiaId) {
    return new Response(JSON.stringify({ error: "Nome e paróquia são obrigatórios." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas administrador." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { data, error } = await supabaseAdmin.from("comunidades")
      .insert({ nome: nome.trim(), paroquia_id: paroquiaId, padroeiro: padroeiro || null })
      .select("id, nome, paroquia_id")
      .single();

    if (error) {
      console.error("Erro Supabase ao criar comunidade:", error);
      if (error.code === "23503") {
        return new Response(JSON.stringify({ error: "Paróquia não encontrada. Crie a paróquia primeiro." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (error.code === "42501") {
        return new Response(JSON.stringify({ error: "Sem permissão para criar comunidade." }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ error: error.message || "Erro ao criar comunidade." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, comunidade: data }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Erro ao criar comunidade:", err);
    return new Response(JSON.stringify({ error: err?.message || "Erro interno." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
