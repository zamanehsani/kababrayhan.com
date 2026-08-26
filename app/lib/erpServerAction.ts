"use server";

// Executes every ERP (Frappe) HTTP call on the server so ERP_API_TOKEN never reaches the browser.

const ERP_BASE_URL =
  process.env.ERP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ERP_API_BASE_URL ||
  "http://localhost:8000";

const ERP_API_TOKEN = process.env.ERP_API_TOKEN || "";

export type ErpRequestConfig = {
  url: string;
  method?: string;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

export type ErpActionError = {
  status: number | string;
  data?: unknown;
  error?: string;
};

export type ErpActionResult<T = unknown> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: ErpActionError };

const safeJsonParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export async function callErpApi<T = unknown>(
  config: ErpRequestConfig
): Promise<ErpActionResult<T>> {
  try {
    const path = config.url.startsWith("/") ? config.url : `/${config.url}`;
    const url = new URL(`${ERP_BASE_URL}${path}`);

    if (config.params) {
      for (const [key, value] of Object.entries(config.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const method = config.method || "GET";
    const requestHeaders: Record<string, string> = {
      "X-Frappe-Site-Name": "kababrayhan.com",
      ...(ERP_API_TOKEN ? { Authorization: `token ${ERP_API_TOKEN}` } : {}),
      ...(config.headers || {}),
    };

    const isBodyless = method === "GET" || method === "HEAD";
    const isFormEncoded =
      requestHeaders["Content-Type"] === "application/x-www-form-urlencoded";

    let requestBody: BodyInit | undefined;
    if (!isBodyless && config.body !== undefined) {
      if (isFormEncoded) {
        requestBody = config.body as string;
      } else {
        requestHeaders["Content-Type"] =
          requestHeaders["Content-Type"] || "application/json";
        requestBody = JSON.stringify(config.body);
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: requestBody,
      cache: "no-store",
    });

    const text = await response.text();
    const parsed = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      return {
        error: {
          status: response.status,
          data: parsed ?? text,
        },
      };
    }

    return { data: (parsed ?? null) as T };
  } catch (error) {
    return {
      error: {
        status: "FETCH_ERROR",
        error:
          error instanceof Error ? error.message : "Network request failed",
      },
    };
  }
}
