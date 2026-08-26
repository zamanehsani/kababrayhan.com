import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { callErpApi, type ErpRequestConfig } from "@/app/lib/erpServerAction";

type ErpBaseQueryArgs = ErpRequestConfig | string;

// Routes every RTK Query endpoint through the callErpApi server action instead of fetching from the browser.
export const erpServerActionBaseQuery: BaseQueryFn<
  ErpBaseQueryArgs,
  unknown,
  { status: number | string; data?: unknown; error?: string }
> = async (args) => {
  const config: ErpRequestConfig =
    typeof args === "string" ? { url: args } : args;

  const result = await callErpApi(config);

  if (result.error) {
    return { error: result.error };
  }

  return { data: result.data };
};
