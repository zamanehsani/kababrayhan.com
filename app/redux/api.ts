export type { Customer, Item, OrderCartItem, SalesOrder } from "./apiType";
// src/redux/api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { erpServerActionBaseQuery } from "./erpBaseQuery";
import type {
  Address,
  AttachFileRequest,
  Contact,
  CreateContactRequest,
  CreateCustomerRequest,
  CreateAddressRequest,
  CreateAddressResponse,
  UpdateAddressRequest,
  UpdateAddressResponse,
  CreatePaymentIntentRequest,
  CreateSalesOrderRequest,
  UpdateSalesOrderRequest,
  UpdateSalesOrderResponse,
  CustomerDetails,
  FullItemResponse,
  Item,
  ItemDetails,
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
  RenameCustomerRequest,
  UploadCustomerAvatarRequest,
  UploadedFile,
} from "./apiType";

// Add SendOtp types
export type { SendOtpRequest, SendOtpResponse } from "./apiType";

export const baseUrl =
  process.env.NEXT_PUBLIC_ERP_API_BASE_URL ||
  process.env.ERP_API_BASE_URL ||
  "https://portal.kababrayhan.com";

export const API_RESOURCE_URL = "/api/resource/";
export const API_METHOD_URL = "/api/method/";

export const toErpAbsoluteUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) {return value;}

  return `${baseUrl}${value.startsWith("/") ? value : `/${value}`}`;
};

export const erpApi = createApi({
  reducerPath: "erpApi",
  tagTypes: ["CustomerAddresses"],
  baseQuery: erpServerActionBaseQuery,
  endpoints: (builder) => ({
    sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
      query: (body) => {
        return {
          url: `${API_METHOD_URL}pizza_app.api.send_otp`,
          method: "POST",
          body,
        };
      },
      transformResponse: (response: { message: SendOtpResponse }) =>
        response.message,
    }),
    getItems: builder.query<Item[], void>({
      query: () => ({
        url: `${API_RESOURCE_URL}Item`,
        params: {
          limit_page_length: 1000,
          filters: JSON.stringify([
            ["Item", "disabled", "=", 0],
            ["Item", "variant_of", "is", "not set"],
          ]),
          fields: JSON.stringify([
            "name",
            "item_name",
            "item_code",
            "has_variants",
            "variant_of",
            "attributes",
            "item_group",
            "custom_priority",
            "standard_rate",
            "image",
            "description",
            "max_discount",
            "custom_calories",
            "custom_prep_time",
            "disabled",
          ]),
        },
      }),
      transformResponse: (response: { data: Item[] }) => response.data,
    }),

    getItemVariants: builder.query<Item[], string>({
      query: (parentItemCode) => ({
        url: `${API_RESOURCE_URL}Item`,
        params: {
          limit_page_length: 100,
          filters: JSON.stringify([
            ["Item", "disabled", "=", 0],
            ["Item", "variant_of", "=", parentItemCode],
          ]),
          fields: JSON.stringify([
            "name",
            "item_name",
            "item_code",
            "has_variants",
            "variant_of",
            "attributes",
            "item_group",
            "custom_priority",
            "standard_rate",
            "image",
            "description",
            "max_discount",
            "custom_calories",
            "custom_prep_time",
            "disabled",
          ]),
        },
      }),
      transformResponse: (response: { data: Item[] }) => response.data,
    }),

    getItemByCode: builder.query<ItemDetails, string>({
      query: (itemCode) => ({
        url: `${API_RESOURCE_URL}Item/${encodeURIComponent(itemCode)}`,
      }),
      transformResponse: (response: FullItemResponse) => {
        const itemData = response.data ?? {};
        let rawAddOns: Array<{ add_on?: unknown; price?: unknown }> = [];

        if (Array.isArray(itemData.custom_allowed_addons)) {
          rawAddOns = itemData.custom_allowed_addons as Array<{
            add_on?: unknown;
            price?: unknown;
          }>;
        } else if (Array.isArray(itemData.allowed_add_ons)) {
          rawAddOns = itemData.allowed_add_ons as Array<{
            add_on?: unknown;
            price?: unknown;
          }>;
        }

        const custom_allowed_addons = rawAddOns
          .map((row) => {
            const addOnName =
              typeof row.add_on === "string" ? row.add_on.trim() : "";

            const parsedPrice =
              typeof row.price === "number"
                ? row.price
                : Number(row.price ?? 0);

            if (!addOnName) return null;

            return {
              add_on: addOnName,
              price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
            };
          })
          .filter((row): row is { add_on: string; price: number } =>
            Boolean(row)
          );

        return {
          ...itemData,
          custom_allowed_addons,
          allowed_add_ons: custom_allowed_addons,
        };
      },
    }),
    // create the customer
    createCustomer: builder.mutation<CustomerDetails, CreateCustomerRequest>({
      query: (body) => ({
        url: `${API_RESOURCE_URL}Customer`,
        method: "POST",
        body: {
          ...body,
          customer_type: body.customer_type || "Individual",
          customer_group: body.customer_group || "All Customer Groups",
          territory: body.territory || "All Territories",
        },
      }),
      transformResponse: (response: { data: CustomerDetails }) => response.data,
    }),
    // get customer
    getCustomer: builder.query<CustomerDetails, string>({
      query: (customerName) => ({
        url: `${API_RESOURCE_URL}Customer/${encodeURIComponent(customerName)}`,
      }),
      transformResponse: (response: { data: CustomerDetails }) => response.data,
    }),
    getCustomersByMobile: builder.query<Array<{ name: string; customer_name?: string; mobile_no?: string }>,string>({
      query: (mobileNo) => ({
        url: `${API_RESOURCE_URL}Customer`,
        params: {
          filters: JSON.stringify([["mobile_no", "=", mobileNo]]),
          fields: JSON.stringify(["name", "customer_name", "mobile_no"]),
          limit_page_length: 20,
        },
      }),
      transformResponse: (response: {
        data: Array<{
          name: string;
          customer_name?: string;
          mobile_no?: string;
        }>;
      }) => response.data,
    }),
    getCustomersByMobileNumber: builder.query<CustomerDetails[], string>({
      query: (mobileNumber) => ({
        url: `${API_RESOURCE_URL}Customer`,
        params: {
          filters: JSON.stringify([["mobile_no", "=", mobileNumber]]),
          fields: JSON.stringify(["*"]),
          limit_page_length: 20,
        },
      }),
      transformResponse: (response: {
        data: CustomerDetails[];
      }) => response.data,
    }),
    getCustomerAvatar: builder.query<string | null, string>({
      query: (customerName) => ({
        url: `${API_RESOURCE_URL}File`,
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
        url: `${API_RESOURCE_URL}Address`,
        params: {
          filters: JSON.stringify([
            ["Dynamic Link", "link_doctype", "=", "Customer"],
            ["Dynamic Link", "link_name", "=", customerName],
            ["disabled", "=", 0],
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
            "is_shipping_address",
            "custom_latitude",
            "custom_longitude",
          ]),
        },
      }),
      transformResponse: (response: { data: Address[] }) => {
        return response.data;
      },
      providesTags: (_result, _error, customerName) => [
        { type: "CustomerAddresses", id: customerName },
        { type: "CustomerAddresses", id: "LIST" },
      ],
    }),

    getItemGroups: builder.query<{ name: string; custom_priority: number }[],void>({
      query: () => ({
        url: `${API_RESOURCE_URL}Item Group`,
        params: {
          limit_page_length: 1000,
          fields: JSON.stringify(["name", "custom_priority"]),
          order_by: "custom_priority asc",
        },
      }),
      transformResponse: (response: {
        data: { name: string; custom_priority: number }[];
      }) => response.data,
    }),
    updateCustomer: builder.mutation<CustomerDetails, UpdateCustomerRequest>({
      query: ({ customerName, ...body }) => ({
        url: `${API_RESOURCE_URL}Customer/${encodeURIComponent(customerName)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: { data: CustomerDetails }) => response.data,
    }),
    renameCustomer: builder.mutation<{ name: string }, RenameCustomerRequest>({
      query: ({ oldName, newName }) => ({
        url: `${API_METHOD_URL}frappe.client.rename_doc`,
        method: "POST",
        body: {
          doctype: "Customer",
          old_name: oldName,
          new_name: newName,
          merge: 0,
        },
      }),
      transformResponse: (
        response: { message?: string | { name?: string } }
      ) => ({
        name:
          typeof response.message === "string"
            ? response.message
            : response.message?.name || "",
      }),
    }),
    getContact: builder.query<Contact, string>({
      query: (contactName) => ({
        url: `${API_RESOURCE_URL}Contact/${encodeURIComponent(contactName)}`,
      }),
      transformResponse: (response: { data: Contact }) => response.data,
    }),
    createContact: builder.mutation<Contact, CreateContactRequest>({
      query: (body) => ({
        url: `${API_RESOURCE_URL}Contact`,
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
        url: `${API_RESOURCE_URL}Contact/${encodeURIComponent(contactName)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: { data: Contact }) => response.data,
    }),
    setCustomerInfo: builder.mutation<{ message?: unknown },SetCustomerInfoRequest>({
      queryFn: async (
        { customerName, fieldname, value },
        _api,
        _extraOptions,
        fetchWithBQ
      ) => {
        const result = await fetchWithBQ({
          url: `${API_METHOD_URL}erpnext.selling.page.point_of_sale.point_of_sale.set_customer_info`,
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
    uploadCustomerAvatar: builder.mutation<UploadedFile, UploadCustomerAvatarRequest>({
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
          url: `${API_METHOD_URL}frappe.client.attach_file`,
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
        url: `${API_RESOURCE_URL}Sales Order`,
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
        url: `${API_RESOURCE_URL}Sales Order/${encodeURIComponent(orderName)}`,
      }),
      transformResponse: (response: { data: SalesOrderDetails }) =>
        response.data,
    }),
    // get kitchen order ticket details
    getKitchenOrderTicket: builder.query<KitchenOrderTicket, string>({
      query: (kotName) => ({
        url: `${API_RESOURCE_URL}Kitchen Order Ticket/${encodeURIComponent(kotName)}`,
      }),
      transformResponse: (response: { data: KitchenOrderTicket }) =>
        response.data,
    }),
    createSalesOrder: builder.mutation<SalesOrder, CreateSalesOrderRequest>({
      query: (body) => ({
        url: `${API_RESOURCE_URL}Sales Order`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: SalesOrder }) => response.data,
    }),
    updateSalesOrder: builder.mutation<UpdateSalesOrderResponse, UpdateSalesOrderRequest>({
      query: ({ salesOrderName, ...body }) => ({
        url: `${API_RESOURCE_URL}Sales Order/${encodeURIComponent(
          salesOrderName
        )}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: {
        data: UpdateSalesOrderResponse["data"];
      }) => ({
        data: response.data,
      }),
    }),
    createPaymentIntent: builder.mutation< PaymentIntentResponse, CreatePaymentIntentRequest>({
      queryFn: async (body, _api, _extraOptions, fetchWithBQ) => {
        // ERPNext reads from frappe.form_dict, so send as form-urlencoded
        // Send raw AED amount — the ERPNext get_stripe_intent endpoint converts to fils (× 100) itself
        const formData = new URLSearchParams();
        formData.append("amount", String(Math.round(body.amount)));
        formData.append("currency", body.currency ?? "aed");
        formData.append("sales_order", body.sales_order);

        const result = await fetchWithBQ({
          url: `${API_METHOD_URL}get_stripe_intent`,
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });
        if (result.error) return { error: result.error };
        const data = result.data as { message: PaymentIntentResponse };
        return { data: data.message };
      },
    }),

    createAddress: builder.mutation< CreateAddressResponse, CreateAddressRequest >({
      query: (body) => ({
        url: `${API_RESOURCE_URL}Address`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => {
        const linkedCustomer = body.links?.find(
          (link) => link.link_doctype === "Customer"
        )?.link_name;

        return [
          { type: "CustomerAddresses", id: linkedCustomer || "LIST" },
          { type: "CustomerAddresses", id: "LIST" },
        ];
      },
    }),
    updateAddress: builder.mutation< UpdateAddressResponse, UpdateAddressRequest >({
      query: ({ addressName, ...body }) => ({
        url: `${API_RESOURCE_URL}Address/${encodeURIComponent(
          addressName
        )}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "CustomerAddresses", id: "LIST" }],
    }),
    deleteAddress: builder.mutation<{ message?: unknown } | null, string>({
      queryFn: async (addressName, _api, _extraOptions, fetchWithBQ) => {
        const result = await fetchWithBQ({
          url: `${API_RESOURCE_URL}Address/${encodeURIComponent(addressName)}`,
          method: "DELETE",
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: (result.data as { message?: unknown } | null) ?? null };
      },
      invalidatesTags: [{ type: "CustomerAddresses", id: "LIST" }],
    }),
    disableAddress: builder.mutation<{ message?: unknown } | null, string>({
      queryFn: async (addressName, _api, _extraOptions, fetchWithBQ) => {
        const result = await fetchWithBQ({
          url: `${API_RESOURCE_URL}Address/${encodeURIComponent(addressName)}`,
          method: "PUT",
          body: {
            disabled: 1,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: (result.data as { message?: unknown } | null) ?? null };
      },
      invalidatesTags: [{ type: "CustomerAddresses", id: "LIST" }],
    }),

    completeDoorstepOrder: builder.mutation<{ status: string; kot_name?: string; invoice_name?: string },{salesOrderName: string; paymentMethod: "cod" | "card_on_delivery"; changeRequired?: string; } >({
      query: ({ salesOrderName, paymentMethod, changeRequired }) => {
        const targetUrl = `${API_METHOD_URL}pizza_app.api.complete_doorstep_order`;

        return {
          // By using an absolute URL string, RTK Query bypasses prepending the baseQuery url
          url: targetUrl,
          method: "POST",
          body: {
            sales_order_name: salesOrderName,
            payment_method: paymentMethod,
            change_required: changeRequired,
          },
        };
      },
    }),
  }),
});

export const {
  useCreateCustomerMutation,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useDisableAddressMutation,
  useGetCustomerQuery,
  useGetCustomersByMobileQuery,
  useGetCustomersByMobileNumberQuery,
  useGetCustomerAvatarQuery,
  useGetCustomerAddressesQuery,
  useGetContactQuery,
  useUpdateCustomerMutation,
  useRenameCustomerMutation,
  useCreateContactMutation,
  useUpdateContactMutation,
  useSetCustomerInfoMutation,
  useUploadCustomerAvatarMutation,
  useGetCustomerSalesOrdersQuery,
  useGetSalesOrderQuery,
  useGetKitchenOrderTicketQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useCreatePaymentIntentMutation,
  useGetItemsQuery,
  useGetItemVariantsQuery,
  useGetItemGroupsQuery,
  useSendOtpMutation,
  useGetItemByCodeQuery,
  useCompleteDoorstepOrderMutation,
} = erpApi;
