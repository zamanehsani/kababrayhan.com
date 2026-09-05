import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const getStripeInstance = () => {
  const secretKey =
    process.env.STRIPE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY ||
    "sk_test_placeholder";
  return new Stripe(secretKey);
};

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "Stripe webhook endpoint is online",
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      const stripe = getStripeInstance();
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } else {
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[Stripe Webhook] Error constructing event:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event type: ${event.type} (id: ${event.id})`);

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const salesOrderName = paymentIntent.metadata?.sales_order;

    console.log("[Stripe Webhook] PaymentIntent payload:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
      salesOrderName,
    });

    if (salesOrderName) {
      console.log(
        `[Stripe Webhook] Processing fulfillment for Sales Order: ${salesOrderName}`
      );

      const { fulfillPaidSalesOrder } = await import("@/app/lib/fulfillOrderAction");
      const fulfillResult = await fulfillPaidSalesOrder(salesOrderName, paymentIntent.id);
      console.log(`[Stripe Webhook] Fulfillment result for ${salesOrderName}:`, fulfillResult);
    } else {
      console.log("[Stripe Webhook] No sales_order found in metadata.");
    }
  }

  return NextResponse.json({ received: true });
}
