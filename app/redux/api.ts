// export const ERP_API_BASE_URL = "http://localhost:8000";
// export const ERP_API_BASE_URL = "http://57.131.47.176:8000";
export const ERP_API_BASE_URL = "https://portal.kababrayhan.com";
export type { Customer, Item, OrderCartItem, SalesOrder } from "./apiType";
// src/redux/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Address,
  AttachFileRequest,
  Contact,
  CreateContactRequest,
  CreateCustomerRequest,
  CreateCustomerResponse,
  CreateAddressRequest,
  CreateAddressResponse,
  CreatePaymentIntentRequest,
  CreateSalesOrderRequest,
  Customer,
  CustomerDetails,
  KitchenOrderTicket,
  PaymentIntentResponse,
  SalesOrder,
  SalesOrderDetails,
  SalesOrderSummary,
  SendOtpRequest,
  SendOtpResponse,
  SetCustomerInfoRequest,
  UpdateContactRequest,
  UpdateCustomerRequest,
  UploadCustomerAvatarRequest,
  UploadedFile,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "./apiType";
import {
  clearSession,
  setAuthenticatedIdentity,
} from "./sessionSlice";

// Add SendOtp types
export type { SendOtpRequest, SendOtpResponse } from "./apiType";

export const ERP_API_METHOD_URL = `${ERP_API_BASE_URL}/api/method/`;

// Read token from environment variable (more secure than hardcoding)
// TODO: Replace with proper session-based auth (see AUTHENTICATION_IMPROVEMENT_PLAN.md)
const ERP_API_AUTHORIZATION = `token ${process.env.NEXT_PUBLIC_ERP_API_TOKEN || ""}`;

export const toErpAbsoluteUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${ERP_API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

export const erpApi = createApi({
  reducerPath: "erpApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${ERP_API_BASE_URL}/api/resource/`,
    credentials: "include",
    prepareHeaders: async (headers) => {
      headers.set("X-Frappe-Site-Name", "kababrayhan.com");

      if (typeof window === "undefined") {
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          const sidCookieValue = cookieStore.get("sid")?.value;

          if (sidCookieValue) {
            headers.set("Cookie", `sid=${sidCookieValue}`);
          }
        } catch {
          // Ignore cookie forwarding errors outside Next.js request context.
        }
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
      query: (body) => {
        return {
          url: `${ERP_API_METHOD_URL}pizza_app.api.send_otp`,
          method: "POST",
          body,
          headers: {
            Authorization: ERP_API_AUTHORIZATION,
          },
        };
      },
      transformResponse: (response: { message: SendOtpResponse }) =>
        response.message,
    }),
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (body) => {
        return {
          url: `${ERP_API_METHOD_URL}pizza_app.api.verify_otp`,
          method: "POST",
          body,
        };
      },
      transformResponse: (response: { message: VerifyOtpResponse }) =>
        response.message,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data.status === "success") {
            dispatch(
              setAuthenticatedIdentity({
                user: data.user,
                customer: data.customer,
              })
            );
          }
        } catch {
          // Leave auth state unchanged on failed verification.
        }
      },
    }),
    // create the customer
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (body) => ({
        url: "Customer",
        method: "POST",
        body: {
          ...body,
          customer_type: body.customer_type || "Individual",
          customer_group: body.customer_group || "All Customer Groups",
          territory: body.territory || "All Territories",
        },
      }),
      transformResponse: (response: { data: Customer }) => response.data,
    }),
    // get customer
    getCustomer: builder.query<CustomerDetails, string>({
      query: (customerName) => ({
        url: `Customer/${encodeURIComponent(customerName)}`,
      }),
      transformResponse: (response: { data: CustomerDetails }) => response.data,
    }),
    getCustomerAvatar: builder.query<string | null, string>({
      query: (customerName) => ({
        url: "File",
        params: {
          filters: JSON.stringify([
            ["attached_to_doctype", "=", "Customer"],
            ["attached_to_name", "=", customerName],
            ["attached_to_field", "=", "image"],
          ]),
          fields: JSON.stringify(["file_url"]),
          order_by: "creation desc",
          limit_page_length: 1,
        },
      }),
      transformResponse: (response: { data: Array<{ file_url: string }> }) => {
        const latestFile = response.data[0];
        return latestFile?.file_url
          ? toErpAbsoluteUrl(latestFile.file_url)
          : null;
      },
    }),
    // Fetch all addresses linked to a customer from ERPNext
    getCustomerAddresses: builder.query<Address[], string>({
      query: (customerName) => ({
        url: "Address",
        params: {
          filters: JSON.stringify([
            ["Dynamic Link", "link_doctype", "=", "Customer"],
            ["Dynamic Link", "link_name", "=", customerName],
          ]),
          fields: JSON.stringify([
            "name",
            "address_title",
            "address_type",
            "address_line1",
            "address_line2",
            "city",
            "country",
            "phone",
            "is_primary_address",
          ]),
        },
      }),
      transformResponse: (response: { data: Address[] }) => response.data,
    }),
    updateCustomer: builder.mutation<CustomerDetails, UpdateCustomerRequest>({
      query: ({ customerName, ...body }) => ({
        url: `Customer/${encodeURIComponent(customerName)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: { data: CustomerDetails }) => response.data,
    }),
    getContact: builder.query<Contact, string>({
      query: (contactName) => ({
        url: `Contact/${encodeURIComponent(contactName)}`,
      }),
      transformResponse: (response: { data: Contact }) => response.data,
    }),
    createContact: builder.mutation<Contact, CreateContactRequest>({
      query: (body) => ({
        url: "Contact",
        method: "POST",
        body: {
          doctype: "Contact",
          ...body,
        },
      }),
      transformResponse: (response: { data: Contact }) => response.data,
    }),
    updateContact: builder.mutation<Contact, UpdateContactRequest>({
      query: ({ contactName, ...body }) => ({
        url: `Contact/${encodeURIComponent(contactName)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: { data: Contact }) => response.data,
    }),
    setCustomerInfo: builder.mutation<
      { message?: unknown },
      SetCustomerInfoRequest
    >({
      queryFn: async (
        { customerName, fieldname, value },
        _api,
        _extraOptions,
        fetchWithBQ
      ) => {
        const result = await fetchWithBQ({
          url: `${ERP_API_BASE_URL}/api/method/erpnext.selling.page.point_of_sale.point_of_sale.set_customer_info`,
          method: "POST",
          body: {
            fieldname,
            customer: customerName,
            value,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: (result.data as { message?: unknown }) ?? {} };
      },
    }),
    uploadCustomerAvatar: builder.mutation<
      UploadedFile,
      UploadCustomerAvatarRequest
    >({
      queryFn: async (
        { customerName, file },
        _api,
        _extraOptions,
        fetchWithBQ
      ) => {
        const toDataUrl = () =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
                return;
              }

              reject(new Error("Could not read the image file."));
            };

            reader.onerror = () => {
              reject(
                reader.error ?? new Error("Could not read the image file.")
              );
            };

            reader.readAsDataURL(file);
          });

        let filedata: string;

        try {
          filedata = await toDataUrl();
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error:
                error instanceof Error
                  ? error.message
                  : "Could not read the image file.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `${ERP_API_BASE_URL}/api/method/frappe.client.attach_file`,
          method: "POST",
          body: {
            filename: file.name,
            filedata,
            doctype: "Customer",
            docname: customerName,
            folder: "Home/Attachments",
            is_private: 0,
            decode_base64: 1,
            docfield: "image",
          } satisfies AttachFileRequest,
        });

        if (result.error) {
          return { error: result.error };
        }

        const payload = result.data as {
          message?: UploadedFile;
          data?: UploadedFile;
        };
        const uploadedFile = payload.message ?? payload.data;

        if (!uploadedFile?.file_url) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Upload response did not include a file URL.",
              data: payload,
            },
          };
        }

        return {
          data: {
            ...uploadedFile,
            file_url: toErpAbsoluteUrl(uploadedFile.file_url),
          },
        };
      },
    }),
    // get sales orders for a customer
    getCustomerSalesOrders: builder.query<SalesOrderSummary[], string>({
      query: (customerName) => ({
        url: "Sales Order",
        params: {
          filters: JSON.stringify([["customer", "=", customerName]]),
          fields: JSON.stringify([
            "name",
            "creation",
            "transaction_date",
            "grand_total",
            "status",
            "custom_kitchen_order_ticket",
            "custom_kitchen_order_ticket.status as kitchen_order_ticket_status",
          ]),
          order_by: "creation desc",
        },
      }),
      transformResponse: (response: { data: SalesOrderSummary[] }) =>
        response.data,
    }),

    // get sales order details
    getSalesOrder: builder.query<SalesOrderDetails, string>({
      query: (orderName) => ({
        url: `Sales Order/${encodeURIComponent(orderName)}`,
      }),
      transformResponse: (response: { data: SalesOrderDetails }) =>
        response.data,
    }),
    // get kitchen order ticket details
    getKitchenOrderTicket: builder.query<KitchenOrderTicket, string>({
      query: (kotName) => ({
        url: `Kitchen Order Ticket/${encodeURIComponent(kotName)}`,
      }),
      transformResponse: (response: { data: KitchenOrderTicket }) =>
        response.data,
    }),
    createSalesOrder: builder.mutation<SalesOrder, CreateSalesOrderRequest>({
      query: (body) => ({
        url: "Sales Order",
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: SalesOrder }) => response.data,
    }),
    createPaymentIntent: builder.mutation<
      PaymentIntentResponse,
      CreatePaymentIntentRequest
    >({
      queryFn: async (body, _api, _extraOptions, fetchWithBQ) => {
        // ERPNext reads from frappe.form_dict, so send as form-urlencoded
        // Send raw AED amount — the ERPNext get_stripe_intent endpoint converts to fils (× 100) itself
        const formData = new URLSearchParams();
        formData.append("amount", String(Math.round(body.amount)));
        formData.append("currency", body.currency ?? "aed");
        formData.append("sales_order", body.sales_order);

        const result = await fetchWithBQ({
          url: `${ERP_API_BASE_URL}/api/method/get_stripe_intent`,
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });
        if (result.error) return { error: result.error };
        const data = result.data as { message: PaymentIntentResponse };
        return { data: data.message };
      },
    }),

    createCustomerNew: builder.mutation<
      CreateCustomerResponse,
      CreateCustomerRequest
    >({
      query: (body) => ({
        url: `${ERP_API_BASE_URL}/api/resource/Customer`,
        method: "POST",
        body,
        headers: {
          Authorization: ERP_API_AUTHORIZATION,
        },
      }),
    }),
    createAddress: builder.mutation<
      CreateAddressResponse,
      CreateAddressRequest
    >({
      query: (body) => ({
        url: `${ERP_API_BASE_URL}/api/resource/Address`,
        method: "POST",
        body,
        headers: {
          Authorization: ERP_API_AUTHORIZATION,
        },
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: `${ERP_API_METHOD_URL}pizza_app.api.customer_logout`,
        method: "POST",
        credentials: "include",
      }),
      transformResponse: () => undefined,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearSession());
          dispatch(erpApi.util.resetApiState());
        } catch {
          // Keep current auth state if logout request fails.
        }
      },
    }),
  }),
});

export const {
  useCreateCustomerMutation,
  useCreateAddressMutation,
  useGetCustomerQuery,
  useGetCustomerAvatarQuery,
  useGetCustomerAddressesQuery,
  useGetContactQuery,
  useUpdateCustomerMutation,
  useCreateContactMutation,
  useUpdateContactMutation,
  useSetCustomerInfoMutation,
  useUploadCustomerAvatarMutation,
  useGetCustomerSalesOrdersQuery,
  useGetSalesOrderQuery,
  useGetKitchenOrderTicketQuery,
  useCreateSalesOrderMutation,
  useCreatePaymentIntentMutation,
  useLogoutMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useCreateCustomerNewMutation,
} = erpApi;
