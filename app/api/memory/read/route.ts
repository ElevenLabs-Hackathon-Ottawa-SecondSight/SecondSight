import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const errorResponse = (message: string, status = 500) => NextResponse.json({ error: message }, { status });

export async function POST() {
  const { userId } = await auth();
  if (!userId) return errorResponse("Unauthorized", 401);

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const memories = Array.isArray(user.publicMetadata?.memories)
      ? (user.publicMetadata.memories as string[])
      : [];

    return NextResponse.json({ memories });
  } catch (err: any) {
    return errorResponse(err?.message || "Failed to read memories", 500);
  }
}
