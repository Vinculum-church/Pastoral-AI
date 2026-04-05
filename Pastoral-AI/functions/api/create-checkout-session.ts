import Stripe from "stripe";

interface Env {
  STRIPE_SECRET_KEY: string;
  APP_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  
  const stripeKey = env.STRIPE_SECRET_KEY;
  const appUrl = env.APP_URL || "https://vinculum-pastoral.pages.dev";
  
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe não configurado." }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await request.json() as any;
  const { priceId, customerEmail, parishId } = body;

  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      customer_email: customerEmail,
      client_reference_id: parishId,
      metadata: { parishId },
      success_url: `${appUrl}/?success=true`,
      cancel_url: `${appUrl}/?canceled=true`,
    });

    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
