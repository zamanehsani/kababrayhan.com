import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { ERP_API_BASE_URL, toErpAbsoluteUrl } from "./api";
import type { FullItemResponse, Item, ItemDetails } from "./apiType";

export { ERP_API_BASE_URL } from "./api";

const PUBLIC_API_AUTHORIZATION = `token ${process.env.NEXT_PUBLIC_ERP_API_TOKEN || ""}`;

export const publicApi = createApi({
  reducerPath: "publicApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${ERP_API_BASE_URL}/api/resource/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", PUBLIC_API_AUTHORIZATION);
      headers.set("X-Frappe-Site-Name", "kababrayhan.com");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getItems: builder.query<Item[], void>({
      query: () => ({
        url: "Item",
        params: {
          limit_page_length: 1000,
          filters: JSON.stringify([["Item", "disabled", "=", 0]]),
          fields: JSON.stringify([
            "name",
            "item_name",
            "item_code",
            "has_variants",
            "variant_of",
            "attributes",
            "item_group",
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
        url: `Item/${encodeURIComponent(itemCode)}`,
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
              typeof row.add_on === "string"
                ? row.add_on.trim()
                : "";

            const parsedPrice =
              typeof row.price === "number" ? row.price : Number(row.price ?? 0);

            if (!addOnName) return null;

            return {
              add_on: addOnName,
              price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
            };
          })
          .filter(
            (row): row is { add_on: string; price: number } => Boolean(row)
          );

        return {
          ...itemData,
          custom_allowed_addons,
          allowed_add_ons: custom_allowed_addons,
          image:
            typeof itemData.image === "string"
              ? toErpAbsoluteUrl(itemData.image)
              : itemData.image,
        };
      },
    }),
  }),
});

export const { useGetItemsQuery, useGetItemByCodeQuery } = publicApi;