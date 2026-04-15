import { recordChatView } from "@/lib/db/queries";

export async function POST(req: Request) {
  try {
    const { chatId, visitorId } = await req.json();
    if (!chatId) return Response.json({ error: "chatId required" }, { status: 400 });
    await recordChatView({ chatId, visitorId });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
