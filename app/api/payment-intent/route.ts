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

export async function GET() {
  const publishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "";
  return NextResponse.json({ publishable_key: publishableKey });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "aed", sales_order } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount provided for PaymentIntent." },
        { status: 400 }
      );
    }

    const stripe = getStripeInstance();
    const amountInFils = Math.round(Number(amount) * 100);
    const publishableKey =
      process.env.STRIPE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      "";

    console.log("[Next.js Stripe API] Creating PaymentIntent directly with Stripe:", {
      amountInFils,
      currency,
      sales_order,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInFils,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
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
      publishable_key: publishableKey,
    });
  } catch (error) {
    console.error("[Next.js Stripe API] Error creating PaymentIntent:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create PaymentIntent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { payment_intent_id, sales_order } = body;

    if (!payment_intent_id) {
      return NextResponse.json(
        { error: "payment_intent_id is required." },
        { status: 400 }
      );
    }

    const stripe = getStripeInstance();
    const updatedIntent = await stripe.paymentIntents.update(payment_intent_id, {
      metadata: {
        ...(sales_order ? { sales_order: String(sales_order) } : {}),
      },
    });

    console.log("[Next.js Stripe API] Updated PaymentIntent metadata on Stripe:", {
      id: updatedIntent.id,
      metadata: updatedIntent.metadata,
    });

    return NextResponse.json({
      success: true,
      id: updatedIntent.id,
      metadata: updatedIntent.metadata,
    });
  } catch (error) {
    console.error("[Next.js Stripe API] Error updating PaymentIntent metadata:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update PaymentIntent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
