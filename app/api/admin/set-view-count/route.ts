import { auth } from "@/app/(auth)/auth";
import { setViewCountForChat } from "@/lib/db/queries";

const ADMIN_EMAILS = ["peytotoria.com@gmail.com"];

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { chatId, count } = body as { chatId?: string; count?: number };

  if (!chatId || typeof count !== "number" || count < 0) {
    return Response.json({ error: "chatId and a non-negative count are required" }, { status: 400 });
  }

  await setViewCountForChat({ chatId, count });
  return Response.json({ success: true, chatId, count });
}
