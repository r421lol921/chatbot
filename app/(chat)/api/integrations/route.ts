import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { userIntegration } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [integration] = await db
    .select()
    .from(userIntegration)
    .where(eq(userIntegration.userId, session.user.id))
    .limit(1);

  return NextResponse.json({ integration: integration ?? null });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileName, content } = await request.json();

  if (!fileName || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (content.length > 100_000) {
    return NextResponse.json(
      { error: "File content exceeds 100,000 characters" },
      { status: 400 }
    );
  }

  await db
    .insert(userIntegration)
    .values({ userId: session.user.id, fileName, content })
    .onConflictDoUpdate({
      target: userIntegration.userId,
      set: { fileName, content, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .delete(userIntegration)
    .where(eq(userIntegration.userId, session.user.id));

  return NextResponse.json({ success: true });
}
