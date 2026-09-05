import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { callErpApi } from "@/app/lib/erpServerAction";

const getStripeInstance = () => {
  const secretKey =
    process.env.STRIPE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY ||
    "sk_test_placeholder";
  return new Stripe(secretKey);
};

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
    const posInvoiceName =
      paymentIntent.metadata?.pos_invoice ||
      paymentIntent.metadata?.sales_order;

    console.log("[Stripe Webhook] PaymentIntent payload:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
      posInvoiceName,
    });

    if (posInvoiceName) {
      console.log(
        `[Stripe Webhook] Processing submission for POS Invoice: ${posInvoiceName}`
      );

      try {
        const updateResult = await callErpApi({
          url: `/api/resource/POS Invoice/${encodeURIComponent(posInvoiceName)}`,
          method: "PUT",
          body: {
            docstatus: 1,
          },
        });
        console.log(`[Stripe Webhook] Successfully submitted POS Invoice ${posInvoiceName}:`, updateResult);
      } catch (submitErr) {
        console.error(
          `[Stripe Webhook] Failed to submit POS Invoice ${posInvoiceName}:`,
          submitErr
        );
      }
    } else {
      console.log("[Stripe Webhook] No pos_invoice found in metadata.");
    }
  }

  return NextResponse.json({ received: true });
}
