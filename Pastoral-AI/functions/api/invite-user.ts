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
  const appUrl = env.APP_URL || "https://vinculum-pastoral.pages.dev";
  
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
    return new Response(JSON.stringify({ error: "Token de autenticação obrigatório." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await request.json() as any;
  const { email, nome, role, pastoralType, paroquiaId, comunidadeId } = body;

  if (!email || !nome) {
    return new Response(JSON.stringify({ error: "E-mail e nome são obrigatórios." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("role, paroquia_id, comunidade_id, pastoral_type")
      .eq("id", caller.id)
      .single();

    if (profile?.role !== "coordenador" && profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas o coordenador pode convidar usuários." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const effectiveParoquiaId = profile?.role === "coordenador" ? (profile.paroquia_id ?? paroquiaId) : paroquiaId;
    const effectiveComunidadeId = profile?.role === "coordenador" ? (profile.comunidade_id ?? comunidadeId) : comunidadeId;
    const effectivePastoralType = profile?.role === "coordenador" ? (profile.pastoral_type ?? pastoralType) : pastoralType;

    const { data: invitedUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/`,
      data: { 
        nome, 
        role: role || "lider", 
        pastoral_type: effectivePastoralType || "catequese", 
        paroquia_id: effectiveParoquiaId || "", 
        comunidade_id: effectiveComunidadeId || "" 
      },
    });

    if (inviteError) {
      const msg = inviteError.message?.includes("already been registered")
        ? "Este e-mail já possui conta no sistema."
        : inviteError.message || "Erro ao enviar convite.";
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (invitedUser?.user?.id) {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: invitedUser.user.id,
          nome,
          email,
          role: role || "lider",
          pastoral_type: effectivePastoralType || "catequese",
          paroquia_id: effectiveParoquiaId || null,
          comunidade_id: effectiveComunidadeId || null,
        },
        { onConflict: "id" }
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Convite enviado por e-mail. O usuário definirá a senha no primeiro acesso." 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Erro ao convidar usuário:", err);
    return new Response(JSON.stringify({ error: err?.message || "Erro interno." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
