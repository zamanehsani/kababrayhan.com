import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const getStripeInstance = () => {
  const secretKey =
    process.env.STRIPE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY ||
    "";

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured in the environment.");
  }

  return new Stripe(secretKey);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "aed", pos_invoice, sales_order } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount provided for PaymentIntent." },
        { status: 400 }
      );
    }

    const stripe = getStripeInstance();
    const amountInFils = Math.round(Number(amount) * 100);

    console.log("[Next.js Stripe API] Creating PaymentIntent directly with Stripe:", {
      amountInFils,
      currency,
      pos_invoice,
      sales_order,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInFils,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...(pos_invoice ? { pos_invoice: String(pos_invoice) } : {}),
        ...(sales_order ? { sales_order: String(sales_order) } : {}),
      },
    });

    console.log("[Next.js Stripe API] PaymentIntent created successfully:", {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret ? "received" : "missing",
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error) {
    console.error("[Next.js Stripe API] Error creating PaymentIntent:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create PaymentIntent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
