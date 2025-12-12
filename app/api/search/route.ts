import { NextResponse } from "next/server";

const errorResponse = (message: string, status = 500) => NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return errorResponse("Missing TAVILY_API_KEY", 500);

  let payload: { query?: string };
  try {
    payload = await req.json();
  } catch (err) {
    return errorResponse("Invalid JSON body", 400);
  }

  const query = (payload.query || "").trim();
  if (!query) return errorResponse("'query' is required", 400);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query, max_results: 3, include_answer: true }),
    });

    const body = await response.json();
    if (!response.ok) {
      return errorResponse(body?.error || "Tavily search failed", 502);
    }

    const summary = body?.answer || body?.results?.map((r: any) => r?.content).filter(Boolean).join(" \n ") || "No answer available.";
    return NextResponse.json({ summary });
  } catch (err: any) {
    return errorResponse(err?.message || "Search failed", 502);
  }
}
