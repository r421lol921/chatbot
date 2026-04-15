import { getPublicChats } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const chats = await getPublicChats({ limit: 5 });

  // Total is the sum of each chat's stored viewCount column
  const totalViews = chats.reduce((sum, c) => sum + (c.viewCount ?? 0), 0);

  return Response.json({ chats, totalViews });
}
