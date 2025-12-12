import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const errorResponse = (message: string, status = 500) => NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return errorResponse("Unauthorized", 401);

  let payload: { fact?: string };
  try {
    payload = await req.json();
  } catch (err) {
    return errorResponse("Invalid JSON body", 400);
  }

  const fact = (payload.fact || "").trim();
  if (!fact) return errorResponse("'fact' is required", 400);

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const memories = Array.isArray(user.publicMetadata?.memories)
      ? (user.publicMetadata.memories as string[])
      : [];

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        memories: [...memories, fact],
      },
    });

    return NextResponse.json({ message: "Memory saved." });
  } catch (err: any) {
    return errorResponse(err?.message || "Failed to save memory", 500);
  }
}
