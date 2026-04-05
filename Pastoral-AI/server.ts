import express from "express";
console.log("🚀 Starting server.ts...");
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da pasta atual (Pastoral-AI) e depois de backend/ (se existir)
dotenv.config();
dotenv.config({ path: path.join(__dirname, "..", "backend", ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const appUrl = process.env.APP_URL || "http://localhost:3000";

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function startServer() {
  console.log("🛠️ Starting startServer function...");
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/public/paroquias-comunidades", async (req, res) => {
    if (!supabaseAdmin) {
      return res.json({ paroquias: [], comunidades: [] });
    }
    const [pRes, cRes] = await Promise.all([
      supabaseAdmin.from("paroquias").select("id, nome").order("nome"),
      supabaseAdmin.from("comunidades").select("id, paroquia_id, nome").order("nome"),
    ]);
    res.json({ paroquias: pRes.data || [], comunidades: cRes.data || [] });
  });

  // Convite de usuário (apenas coordenador)
  app.post("/api/invite-user", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY." });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return res.status(401).json({ error: "Token de autenticação obrigatório." });
    }

    const { email, nome, role, pastoralType, paroquiaId, comunidadeId } = req.body;
    if (!email || !nome) {
      return res.status(400).json({ error: "E-mail e nome são obrigatórios." });
    }

    try {
      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !caller) {
        return res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
      }

      const { data: profile } = await supabaseAdmin.from("profiles").select("role, paroquia_id, comunidade_id, pastoral_type").eq("id", caller.id).single();
      if (profile?.role !== "coordenador" && profile?.role !== "admin") {
        return res.status(403).json({ error: "Apenas o coordenador pode convidar usuários." });
      }

      // Coordenador: líder herda paróquia e comunidade do coordenador
      const effectiveParoquiaId = profile?.role === "coordenador" ? (profile.paroquia_id ?? paroquiaId) : paroquiaId;
      const effectiveComunidadeId = profile?.role === "coordenador" ? (profile.comunidade_id ?? comunidadeId) : comunidadeId;
      const effectivePastoralType = profile?.role === "coordenador" ? (profile.pastoral_type ?? pastoralType) : pastoralType;

      const { data: invitedUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${appUrl}/`,
        data: { nome, role: role || "lider", pastoral_type: effectivePastoralType || "catequese", paroquia_id: effectiveParoquiaId || "", comunidade_id: effectiveComunidadeId || "" },
      });

      if (inviteError) {
        const msg = inviteError.message?.includes("already been registered")
          ? "Este e-mail já possui conta no sistema."
          : inviteError.message || "Erro ao enviar convite.";
        return res.status(400).json({ error: msg });
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

      res.json({ success: true, message: "Convite enviado por e-mail. O usuário definirá a senha no primeiro acesso." });
    } catch (err: any) {
      console.error("Erro ao convidar usuário:", err);
      res.status(500).json({ error: err.message || "Erro interno." });
    }
  });

  // Coordenador: criar catequista/líder com senha (sem convite por email)
  app.post("/api/create-lider", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Supabase não configurado." });
    }
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Token obrigatório." });

    const { email, nome, password, turmaId, pastoralType, paroquiaId, comunidadeId } = req.body;
    if (!email || !nome || !password || !turmaId) {
      return res.status(400).json({ error: "E-mail, nome, senha e turma são obrigatórios." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    try {
      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !caller) return res.status(401).json({ error: "Sessão inválida." });

      const { data: profile } = await supabaseAdmin.from("profiles").select("role, paroquia_id, comunidade_id, pastoral_type").eq("id", caller.id).single();
      if (profile?.role !== "coordenador" && profile?.role !== "admin") {
        return res.status(403).json({ error: "Apenas o coordenador pode criar catequistas." });
      }

      const effectiveParoquiaId = profile?.role === "coordenador" ? (profile.paroquia_id ?? paroquiaId) : paroquiaId;
      const effectiveComunidadeId = profile?.role === "coordenador" ? (profile.comunidade_id ?? comunidadeId) : comunidadeId;
      const effectivePastoralType = profile?.role === "coordenador" ? (profile.pastoral_type ?? pastoralType) : pastoralType;

      // Turma deve pertencer à comunidade do coordenador
      if (profile?.role === "coordenador" && effectiveComunidadeId) {
        const { data: turma } = await supabaseAdmin.from("turmas").select("id, comunidade_id").eq("id", turmaId).single();
        if (!turma || turma.comunidade_id !== effectiveComunidadeId) {
          return res.status(400).json({ error: "A turma selecionada não pertence à sua comunidade." });
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
        return res.status(400).json({ error: msg });
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

      res.json({ success: true, message: "Catequista criado. Ele pode acessar o sistema com o e-mail e senha definidos." });
    } catch (err: any) {
      console.error("Erro ao criar catequista:", err);
      const msg = err?.message || err?.error_description || String(err);
      res.status(500).json({ error: msg || "Erro interno." });
    }
  });

  // Admin: criar paróquia
  app.post("/api/admin/create-paroquia", async (req, res) => {
    if (!supabaseAdmin) return res.status(503).json({ error: "Supabase não configurado." });
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Token obrigatório." });
    const { nome, endereco, telefone } = req.body;
    if (!nome?.trim()) return res.status(400).json({ error: "Nome da paróquia é obrigatório." });
    try {
      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !caller) return res.status(401).json({ error: "Sessão inválida." });
      const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", caller.id).single();
      if (profile?.role !== "admin") return res.status(403).json({ error: "Apenas administrador." });
      const { data, error } = await supabaseAdmin.from("paroquias").insert({ nome: nome.trim(), endereco: endereco || null, telefone: telefone || null }).select("id, nome").single();
      if (error) return res.status(400).json({ error: error.message || "Erro ao criar paróquia." });
      res.json({ success: true, paroquia: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro interno." });
    }
  });

  // Admin: criar comunidade
  app.post("/api/admin/create-comunidade", async (req, res) => {
    if (!supabaseAdmin) return res.status(503).json({ error: "Supabase não configurado." });
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Token obrigatório." });
    const { nome, paroquiaId, padroeiro } = req.body;
    if (!nome?.trim() || !paroquiaId) return res.status(400).json({ error: "Nome e paróquia são obrigatórios." });
    try {
      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !caller) return res.status(401).json({ error: "Sessão inválida." });
      const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", caller.id).single();
      if (profile?.role !== "admin") return res.status(403).json({ error: "Apenas administrador." });
      const { data, error } = await supabaseAdmin.from("comunidades").insert({ nome: nome.trim(), paroquia_id: paroquiaId, padroeiro: padroeiro || null }).select("id, nome, paroquia_id").single();
      if (error) {
        console.error("Erro Supabase ao criar comunidade:", error);
        const msg = error.message || "Erro ao criar comunidade.";
        if (error.code === "23503") return res.status(400).json({ error: "Paróquia não encontrada. Crie a paróquia primeiro." });
        if (error.code === "42501") return res.status(403).json({ error: "Sem permissão para criar comunidade. Verifique as políticas RLS no Supabase." });
        return res.status(400).json({ error: msg });
      }
      res.json({ success: true, comunidade: data });
    } catch (err: any) {
      console.error("Erro ao criar comunidade:", err);
      res.status(500).json({ error: err.message || "Erro interno." });
    }
  });

  // Admin: criar coordenador com e-mail e senha (paróquia + comunidade + segmento)
  app.post("/api/admin/create-coordinator", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Supabase não configurado. Defina SUPABASE_SERVICE_ROLE_KEY." });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return res.status(401).json({ error: "Token de autenticação obrigatório." });
    }

    const { email, password, nome, paroquiaId, comunidadeId, pastoralType } = req.body;
    if (!email || !password || !nome || !paroquiaId || !comunidadeId) {
      return res.status(400).json({ error: "E-mail, senha, nome, paróquia e comunidade são obrigatórios." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    const validPastoral = ["catequese", "pastoral_crista"].includes(pastoralType) ? pastoralType : "catequese";

    try {
      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !caller) {
        return res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
      }

      const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", caller.id).single();
      if (profile?.role !== "admin") {
        return res.status(403).json({ error: "Apenas o administrador pode criar coordenadores." });
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
        return res.status(400).json({ error: msg });
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

      res.json({ success: true, message: "Coordenador criado. Ele pode acessar o sistema com o e-mail e senha definidos." });
    } catch (err: any) {
      console.error("Erro ao criar coordenador:", err);
      res.status(500).json({ error: err.message || "Erro interno." });
    }
  });

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId, customerEmail, parishId } = req.body;

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "pix", "boleto"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        customer_email: customerEmail,
        client_reference_id: parishId, // Crucial para o Webhook identificar a paróquia
        metadata: { parishId },
        success_url: `${process.env.APP_URL}/?success=true`,
        cancel_url: `${process.env.APP_URL}/?canceled=true`,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook para ativação automática
  app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const parishId = session.client_reference_id;
      console.log(`✅ Paróquia ${parishId} ativada com sucesso!`);
      // Aqui você faria o UPDATE no Supabase: 
      // UPDATE parishes SET subscription_status = 'active' WHERE id = parishId
    }

    res.json({ received: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    console.log("✅ Vite middleware initialized.");
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  console.log(`📡 Attempting to listen on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

console.log("🏁 startServer function defined, calling it...");
startServer().catch(err => {
  console.error("❌ Failed to start server:", err);
});
