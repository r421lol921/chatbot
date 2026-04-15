import { updateChatViewCount } from "@/lib/db/queries";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { chatId, count } = body as { chatId?: string; count?: number };

  if (!chatId || typeof count !== "number" || count < 0) {
    return Response.json({ error: "chatId and a non-negative count are required" }, { status: 400 });
  }

  await updateChatViewCount({ chatId, viewCount: Math.floor(count) });
  return Response.json({ success: true, chatId, viewCount: Math.floor(count) });
}
