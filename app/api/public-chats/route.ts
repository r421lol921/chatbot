import { getPublicChats } from "@/lib/db/queries";

export async function GET() {
  const chats = await getPublicChats({ limit: 5 });

  // Total is the sum of each chat's stored viewCount column
  const totalViews = chats.reduce((sum, c) => sum + (c.viewCount ?? 0), 0);

  return Response.json(
    { chats, totalViews },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
