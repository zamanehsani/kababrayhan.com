import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { ERP_API_BASE_URL } from "./api";
import type { VerifyOtpRequest, VerifyOtpResponse } from "./apiType";
import { clearSession, setAuthenticatedIdentity } from "./sessionSlice";

const ERP_API_METHOD_URL = `${ERP_API_BASE_URL}/api/method/`;

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: ERP_API_METHOD_URL,
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
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (body) => ({
        url: "pizza_app.api.verify_otp",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: VerifyOtpResponse | { message: VerifyOtpResponse }
      ) => ("message" in response ? response.message : response),
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
          // Leave identity state unchanged on failed verification.
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "pizza_app.api.customer_logout",
        method: "POST",
      }),
      transformResponse: () => undefined,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearSession());
          dispatch(authApi.util.resetApiState());
        } catch {
          // Keep current auth state if logout request fails.
        }
      },
    }),
  }),
});

export const { useVerifyOtpMutation, useLogoutMutation } = authApi;
