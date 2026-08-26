// Server-only ERP fetch utility — never import this in a client component.
import type { Item } from "@/app/redux/apiType";

const ERP_BASE_URL =
  process.env.ERP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ERP_API_BASE_URL ||
  "http://localhost:8000";

const ERP_API_TOKEN = process.env.ERP_API_TOKEN || "";

const erpHeaders: HeadersInit = {
  Authorization: `token ${ERP_API_TOKEN}`,
  "X-Frappe-Site-Name": "kababrayhan.com",
  "Content-Type": "application/json",
};

async function erpFetch<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T> {
  const url = new URL(`${ERP_BASE_URL}/api${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
  }
  const res = await fetch(url.toString(), {
    headers: erpHeaders,
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`ERP ${res.status} ${res.statusText}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchMenuItems(): Promise<Item[]> {
  const data = await erpFetch<{ data: Item[] }>("/resource/Item", {
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
  });
  return data.data ?? [];
}

export async function fetchItemGroups(): Promise<
  { name: string; custom_priority: number }[]
> {
  const data = await erpFetch<{
    data: { name: string; custom_priority: number }[];
  }>("/resource/Item Group", {
    limit_page_length: 1000,
    fields: JSON.stringify(["name", "custom_priority"]),
    order_by: "custom_priority asc",
  });
  return data.data ?? [];
}
