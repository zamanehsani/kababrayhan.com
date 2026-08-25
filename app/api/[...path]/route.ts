import { NextRequest, NextResponse } from "next/server";

const ERP_BASE_URL =
  process.env.ERP_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ERP_API_BASE_URL ||
  "http://localhost:8000";

const getErpToken = () => process.env.ERP_API_TOKEN || "";

const getForwardedHeaders = (request: NextRequest) => {
  const headers = new Headers();

  for (const [key, value] of request.headers.entries()) {
    if (
      [
        "host",
        "connection",
        "content-length",
        "transfer-encoding",
      ].includes(key.toLowerCase())
    ) {
      continue;
    }

    if (value) {
      headers.set(key, value);
    }
  }

  headers.set("X-Frappe-Site-Name", "kababrayhan.com");

  const token = getErpToken();
  if (token) {
    headers.set("Authorization", `token ${token}`);
  }

  return headers;
};

const buildTargetUrl = (request: NextRequest, path: string[]) => {
  const segments = path.filter(Boolean);
  const normalizedSegments = segments[0] === "api" ? segments.slice(1) : segments;
  const targetPath = normalizedSegments.length
    ? `/${normalizedSegments.join("/")}`
    : "/";
  const url = new URL(`${ERP_BASE_URL}/api${targetPath}`);
  url.search = request.nextUrl.search;
  return url;
};

async function proxyErpRequest(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const targetUrl = buildTargetUrl(request, path);
  const method = request.method;

  const headers = getForwardedHeaders(request);
  const body = ["GET", "HEAD"].includes(method)
    ? undefined
    : await request.text();

  const upstreamResponse = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (
      ["content-length", "transfer-encoding", "connection"].includes(
        key.toLowerCase()
      )
    ) {
      return;
    }
    responseHeaders.set(key, value);
  });

  const setCookieHeaders = upstreamResponse.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookieHeaders) {
    responseHeaders.append("set-cookie", cookie);
  }

  const contentType = upstreamResponse.headers.get("content-type") || "";
  const payloadText = await upstreamResponse.text();

  if (!payloadText) {
    return new NextResponse(null, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  }

  if (contentType.includes("application/json")) {
    try {
      return NextResponse.json(JSON.parse(payloadText), {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });
    } catch {
      return new NextResponse(payloadText, {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });
    }
  }

  return new NextResponse(payloadText, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxyErpRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxyErpRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxyErpRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxyErpRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxyErpRequest(request, context);
}
