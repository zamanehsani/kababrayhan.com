import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { VerifyOtpRequest, VerifyOtpResponse } from "./apiType";
import { clearSession, setAuthenticatedIdentity } from "./sessionSlice";

const ERP_API_METHOD_URL = "/api/method/";

const unwrapVerifyOtpResponse = (
  response: VerifyOtpResponse | { message: VerifyOtpResponse }
): VerifyOtpResponse => {
  const maybeWrapped = response as { message?: unknown };

  if (typeof maybeWrapped.message === "object" && maybeWrapped.message !== null) {
    return maybeWrapped.message as VerifyOtpResponse;
  }

  return response as VerifyOtpResponse;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/",
    // ⚠️ CRUCIAL PRODUCTION FIX: Bypasses CSRFTokenError by dropping 
    // blind cross-origin tracking cookies on verification handshakes.
    credentials: "omit", 
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
        url: `${ERP_API_METHOD_URL}pizza_app.api.verify_otp`,
        method: "POST",
        body,
      }),
      transformResponse: (
        response: VerifyOtpResponse | { message: VerifyOtpResponse }
      ): VerifyOtpResponse => unwrapVerifyOtpResponse(response),
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
    logout: builder.mutation<void, { mobile: string }>({
      query: (body) => ({
        url: `${ERP_API_METHOD_URL}pizza_app.api.customer_logout`,
        method: "POST",
        body,
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
