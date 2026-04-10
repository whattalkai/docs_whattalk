import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://app.whattalk.ai/api";

export async function POST(req: NextRequest) {
  const { method, endpoint, body, apiKey } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 400 });
  }

  const url = `${BASE_URL}${endpoint}`;

  const fetchOptions: RequestInit = {
    method: method || "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json().catch(() => ({}));

  return NextResponse.json({
    status: response.status,
    ok: response.ok,
    data,
  });
}
