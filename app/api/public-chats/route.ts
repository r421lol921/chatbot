import {
  getPublicChats,
  getTotalPublicChatViews,
  getViewCountForChat,
} from "@/lib/db/queries";

export async function GET() {
  const [chats, totalViews] = await Promise.all([
    getPublicChats({ limit: 5 }),
    getTotalPublicChatViews(),
  ]);

  // Fetch per-chat view counts in parallel
  const chatViewCounts = await Promise.all(
    chats.map((c) => getViewCountForChat({ chatId: c.id }))
  );

  const chatsWithViews = chats.map((c, i) => ({
    ...c,
    viewCount: chatViewCounts[i] ?? 0,
  }));

  return Response.json({ chats: chatsWithViews, totalViews });
}
