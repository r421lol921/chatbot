import { auth } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";
import { createChatShare } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json();

    const session = await auth();
    if (!session?.user?.id) {
      throw new ChatbotError("unauthorized:chat", "Unauthorized");
    }

    const shareToken = generateUUID().substring(0, 12);

    await createChatShare({
      chatId,
      shareToken,
    });

    return Response.json({ shareToken });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    return Response.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}
