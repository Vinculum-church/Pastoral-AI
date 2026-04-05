import { createClient } from "@supabase/supabase-js";

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  APP_URL: string;
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
  const { email, nome, password, turmaId, pastoralType, paroquiaId, comunidadeId } = body;

  if (!email || !nome || !password || !turmaId) {
    return new Response(JSON.stringify({ error: "E-mail, nome, senha e turma são obrigatórios." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (password.length < 6) {
    return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres." }), {
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
      .select("role, paroquia_id, comunidade_id, pastoral_type")
      .eq("id", caller.id)
      .single();

    if (profile?.role !== "coordenador" && profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas o coordenador pode criar catequistas." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const effectiveParoquiaId = profile?.role === "coordenador" ? (profile.paroquia_id ?? paroquiaId) : paroquiaId;
    const effectiveComunidadeId = profile?.role === "coordenador" ? (profile.comunidade_id ?? comunidadeId) : comunidadeId;
    const effectivePastoralType = profile?.role === "coordenador" ? (profile.pastoral_type ?? pastoralType) : pastoralType;

    if (profile?.role === "coordenador" && effectiveComunidadeId) {
      const { data: turma } = await supabaseAdmin.from("turmas")
        .select("id, comunidade_id")
        .eq("id", turmaId)
        .single();
      if (!turma || turma.comunidade_id !== effectiveComunidadeId) {
        return new Response(JSON.stringify({ error: "A turma selecionada não pertence à sua comunidade." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      const msg = createError.message?.includes("already been registered")
        ? "Este e-mail já possui conta no sistema."
        : createError.message || "Erro ao criar usuário.";
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (newUser?.user?.id) {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: newUser.user.id,
          nome,
          email,
          role: "lider",
          pastoral_type: effectivePastoralType || "catequese",
          paroquia_id: effectiveParoquiaId || null,
          comunidade_id: effectiveComunidadeId || null,
        },
        { onConflict: "id" }
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Catequista criado. Ele pode acessar o sistema com o e-mail e senha definidos." 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Erro ao criar catequista:", err);
    return new Response(JSON.stringify({ error: err?.message || "Erro interno." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
