import "server-only";

// Server-only fetch of Company doctype details for header/footer branding.

const ERP_BASE_URL =
  process.env.ERP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ERP_API_BASE_URL ||
  "http://localhost:8000";

const ERP_API_TOKEN = process.env.ERP_API_TOKEN || "";
const COMPANY_NAME =
  process.env.ERP_COMPANY_NAME ||
  process.env.NEXT_PUBLIC_ERP_COMPANY_NAME ||
  "Kabab Al Rayhan";

const erpHeaders: HeadersInit = {
  Authorization: `token ${ERP_API_TOKEN}`,
  "X-Frappe-Site-Name": "kababrayhan.com",
  "Content-Type": "application/json",
};

type CompanyRecord = {
  company_name?: string;
  company_logo?: string | null;
  phone_no?: string | null;
  email?: string | null;
  company_description?: string | null;
};

type CompanyAddressRecord = {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  country?: string;
};

export type CompanyInfo = {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  logoDataUrl: string | null;
};

const FALLBACK_COMPANY_INFO: CompanyInfo = {
  name: "Kabab Al Rayhan",
  description:
    "Authentic Persian & Iranian grill experience in the heart of Ajman. From our signature Qabuli polou to the legendary Tikka Masti, we bring tradition to your table.",
  phone: "+971503021317",
  email: "kababrayhan@gmail.com",
  address: "Al Rawda 2 - Ajman - United Arab Emirates",
  logoDataUrl: null,
};

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").trim();

async function erpFetch<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T> {
  const url = new URL(`${ERP_BASE_URL}/api${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), {
    headers: erpHeaders,
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`ERP ${res.status} ${res.statusText}: ${path}`);
  }
  return res.json() as Promise<T>;
}

async function fetchLogoDataUrl(fileUrl: string): Promise<string | null> {
  try {
    const absoluteUrl = fileUrl.startsWith("http")
      ? fileUrl
      : `${ERP_BASE_URL}${fileUrl}`;
    const res = await fetch(absoluteUrl, {
      headers: erpHeaders,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function fetchCompanyInfo(): Promise<CompanyInfo> {
  try {
    const companyResponse = await erpFetch<{ data: CompanyRecord }>(
      `/resource/Company/${encodeURIComponent(COMPANY_NAME)}`
    );
    const company = companyResponse.data;

    const addressResponse = await erpFetch<{ data: CompanyAddressRecord[] }>(
      "/resource/Address",
      {
        filters: JSON.stringify([
          ["Dynamic Link", "link_doctype", "=", "Company"],
          ["Dynamic Link", "link_name", "=", COMPANY_NAME],
        ]),
        fields: JSON.stringify([
          "address_line1",
          "address_line2",
          "city",
          "country",
        ]),
        limit_page_length: 1,
      }
    ).catch(() => ({ data: [] as CompanyAddressRecord[] }));

    const addressRecord = addressResponse.data?.[0];
    const address = addressRecord
      ? [
          addressRecord.address_line1,
          addressRecord.address_line2,
          addressRecord.city,
          addressRecord.country,
        ]
          .filter(Boolean)
          .join(", ")
      : FALLBACK_COMPANY_INFO.address;

    const logoDataUrl = company.company_logo
      ? await fetchLogoDataUrl(company.company_logo)
      : null;

    return {
      name: company.company_name || FALLBACK_COMPANY_INFO.name,
      description: company.company_description
        ? stripHtml(company.company_description)
        : FALLBACK_COMPANY_INFO.description,
      phone: company.phone_no || FALLBACK_COMPANY_INFO.phone,
      email: company.email || FALLBACK_COMPANY_INFO.email,
      address,
      logoDataUrl,
    };
  } catch (error) {
    console.error("Failed to fetch company info:", error);
    return FALLBACK_COMPANY_INFO;
  }
}
