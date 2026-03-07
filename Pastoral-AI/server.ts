import express from "express";
console.log("🚀 Starting server.ts...");
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("🛠️ Starting startServer function...");
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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
