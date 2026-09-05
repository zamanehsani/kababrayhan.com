import { callErpApi } from "./erpServerAction";

export type FulfillPaidSalesOrderResult = {
  salesInvoiceName?: string;
  paymentEntryName?: string;
  error?: string;
};

// In-process lock to prevent duplicate parallel fulfillment between the webhook and the client callback
const inFlightFulfillments = new Map<string, Promise<FulfillPaidSalesOrderResult>>();

/**
 * Submits the Sales Order (docstatus: 1), creates & submits the Sales Invoice (docstatus: 1),
 * and creates & submits the Payment Entry (docstatus: 1) in Frappe.
 * Idempotent: safe to call concurrently from both the frontend and the Stripe webhook.
 */
export async function fulfillPaidSalesOrder(
  salesOrderName: string,
  referenceNo?: string
): Promise<FulfillPaidSalesOrderResult> {
  if (!salesOrderName) {
    return { error: "salesOrderName is required" };
  }

  // If another request is currently fulfilling this exact order, await the active promise
  if (inFlightFulfillments.has(salesOrderName)) {
    console.log(`[Fulfill Order] Re-using in-flight fulfillment promise for: ${salesOrderName}`);
    return inFlightFulfillments.get(salesOrderName)!;
  }

  const fulfillmentPromise = (async () => {
    console.log(`[Fulfill Order] Starting fulfillment for Sales Order: ${salesOrderName}`);

    try {
      const today = new Date().toISOString().split("T")[0];

      // 0. Check current Sales Order status and billing progress
      const orderFetch = await callErpApi<{
        data?: {
          docstatus?: number;
          custom_payment_status?: string;
          per_billed?: number;
          billing_status?: string;
          advance_paid?: number;
          status?: string;
        };
      }>({
        url: `/api/resource/Sales Order/${encodeURIComponent(salesOrderName)}`,
      });

      const orderData = orderFetch.data?.data;
      const currentDocstatus = orderData?.docstatus ?? 0;
      const isAlreadyBilled =
        (orderData?.per_billed ?? 0) >= 100 ||
        orderData?.billing_status === "Fully Billed";

      // 1. Submit the Sales Order (docstatus: 1) if not already submitted
      if (currentDocstatus === 0) {
        const submitOrderResult = await callErpApi({
          url: `/api/resource/Sales Order/${encodeURIComponent(salesOrderName)}`,
          method: "PUT",
          body: {
            docstatus: 1,
            custom_payment_status: "Paid",
          },
        });

        if (submitOrderResult.error) {
          console.warn(`[Fulfill Order] Sales order submit warning/error:`, submitOrderResult.error);
        } else {
          console.log(`[Fulfill Order] Submitted Sales Order ${salesOrderName}`);
        }
      } else {
        console.log(`[Fulfill Order] Sales Order ${salesOrderName} is already submitted (docstatus: ${currentDocstatus})`);
      }

      // 2. Generate Sales Invoice doc from Sales Order if not already billed
      let salesInvoiceName = "";

      if (!isAlreadyBilled) {
        const makeInvoiceResult = await callErpApi<{ message?: Record<string, unknown> }>({
          url: "/api/method/erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice",
          method: "POST",
          params: { source_name: salesOrderName },
        });

        const invoiceDoc = makeInvoiceResult.data?.message;

        if (invoiceDoc) {
          // Ensure posting_date, due_date and payment_schedule match today's date
          const postingDate = (invoiceDoc.posting_date as string) || today;
          invoiceDoc.posting_date = postingDate;
          invoiceDoc.due_date = postingDate;

          if (Array.isArray(invoiceDoc.payment_schedule)) {
            invoiceDoc.payment_schedule.forEach((row: Record<string, unknown>) => {
              row.due_date = postingDate;
            });
          }

          // Create and submit Sales Invoice (docstatus: 1)
          const createInvoiceResult = await callErpApi<{ data?: { name: string } }>({
            url: "/api/resource/Sales Invoice",
            method: "POST",
            body: {
              ...invoiceDoc,
              doctype: "Sales Invoice",
              docstatus: 1,
            },
          });

          if (createInvoiceResult.error) {
            console.warn(`[Fulfill Order] Note on Sales Invoice creation:`, createInvoiceResult.error);
          } else {
            salesInvoiceName = createInvoiceResult.data?.data?.name || "";
            console.log(`[Fulfill Order] Created & Submitted Sales Invoice: ${salesInvoiceName}`);
          }
        }
      } else {
        console.log(`[Fulfill Order] Sales Order ${salesOrderName} is already billed. Skipping new invoice.`);
      }

      // 3. Generate Payment Entry doc from Sales Invoice or Sales Order
      let paymentEntryName = "";
      const dt = salesInvoiceName ? "Sales Invoice" : "Sales Order";
      const dn = salesInvoiceName || salesOrderName;

      const makePaymentResult = await callErpApi<{ message?: Record<string, unknown> }>({
        url: "/api/method/erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry",
        method: "POST",
        params: { dt, dn },
      });

      const paymentDoc = makePaymentResult.data?.message;

      if (paymentDoc) {
        const postingDate = (paymentDoc.posting_date as string) || today;

        // Create and submit Payment Entry (docstatus: 1)
        const createPaymentResult = await callErpApi<{ data?: { name: string } }>({
          url: "/api/resource/Payment Entry",
          method: "POST",
          body: {
            ...paymentDoc,
            doctype: "Payment Entry",
            mode_of_payment: "Stripe",
            reference_no: referenceNo || salesOrderName,
            reference_date: postingDate,
            docstatus: 1,
          },
        });

        if (createPaymentResult.error) {
          console.warn(`[Fulfill Order] Note on Payment Entry creation:`, createPaymentResult.error);
        } else {
          paymentEntryName = createPaymentResult.data?.data?.name || "";
          console.log(`[Fulfill Order] Created & Submitted Payment Entry: ${paymentEntryName}`);
        }
      } else {
        console.log(`[Fulfill Order] Payment Entry already exists or cannot be generated for ${dn}`);
      }

      return {
        salesInvoiceName,
        paymentEntryName,
      };
    } catch (error) {
      console.error(`[Fulfill Order] Error fulfilling Sales Order ${salesOrderName}:`, error);
      return {
        error: error instanceof Error ? error.message : "Fulfillment failed",
      };
    } finally {
      inFlightFulfillments.delete(salesOrderName);
    }
  })();

  inFlightFulfillments.set(salesOrderName, fulfillmentPromise);
  return fulfillmentPromise;
}
