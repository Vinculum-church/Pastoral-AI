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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log("create-coordinator: VITE_SUPABASE_URL exists:", !!supabaseUrl);
  console.log("create-coordinator: SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseServiceKey);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ 
      error: "Supabase não configurado.",
      debug: { hasUrl: !!supabaseUrl, hasKey: !!supabaseServiceKey }
    }), {
      status: 503,
      headers: corsHeaders
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  
  console.log("create-coordinator: Token received:", !!token);
  
  if (!token) {
    return new Response(JSON.stringify({ error: "Token de autenticação obrigatório." }), {
      status: 401,
      headers: corsHeaders
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Body inválido." }), {
      status: 400,
      headers: corsHeaders
    });
  }
  
  const { email, password, nome, paroquiaId, comunidadeId, pastoralType } = body;

  if (!email || !password || !nome || !paroquiaId || !comunidadeId) {
    return new Response(JSON.stringify({ error: "E-mail, senha, nome, paróquia e comunidade são obrigatórios." }), {
      status: 400,
      headers: corsHeaders
    });
  }

  if (password.length < 6) {
    return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres." }), {
      status: 400,
      headers: corsHeaders
    });
  }

  const validPastoral = ["catequese", "pastoral_crista"].includes(pastoralType) 
    ? pastoralType 
    : "catequese";

  try {
    // Validar o token do usuário
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    console.log("create-coordinator: getUser result:", { callerId: caller?.id, authError: authError?.message });
    
    if (authError || !caller) {
      return new Response(JSON.stringify({ 
        error: "Sessão inválida. Faça login novamente.",
        debug: authError?.message 
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    console.log("create-coordinator: Profile result:", { role: profile?.role, profileError: profileError?.message });

    if (profileError || !profile) {
      return new Response(JSON.stringify({ 
        error: "Perfil não encontrado.",
        debug: profileError?.message 
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    // Verificar se é admin (aceitar várias formas)
    const roleStr = String(profile.role || '').toLowerCase();
    const isAdmin = roleStr === 'admin' || roleStr.includes('admin');
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ 
        error: "Apenas o administrador pode criar coordenadores.",
        debug: { role: profile.role }
      }), {
        status: 403,
        headers: corsHeaders
      });
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
          role: "coordenador",
          pastoral_type: validPastoral,
          paroquia_id: paroquiaId,
          comunidade_id: comunidadeId,
        },
        { onConflict: "id" }
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Coordenador criado. Ele pode acessar o sistema com o e-mail e senha definidos." 
    }), {
      headers: corsHeaders
    });

  } catch (err: any) {
    console.error("Erro ao criar coordenador:", err);
    return new Response(JSON.stringify({ error: err?.message || "Erro interno." }), {
      status: 500,
      headers: corsHeaders
    });
  }
};
