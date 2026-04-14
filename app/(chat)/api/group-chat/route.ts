import { auth } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";
import { addChatMember, getChatById } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const { chatId, emails } = await request.json();

    const session = await auth();
    if (!session?.user?.id) {
      throw new ChatbotError("unauthorized:chat", "Unauthorized");
    }

    const chat = await getChatById({ id: chatId });
    if (!chat) {
      throw new ChatbotError("not_found:chat", "Chat not found");
    }

    if (chat.userId !== session.user.id) {
      throw new ChatbotError("unauthorized:chat", "You don't have permission to invite members");
    }

    for (const email of emails) {
      await addChatMember({
        chatId,
        email,
      });
    }

    return Response.json({ success: true, invitedCount: emails.length });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    return Response.json(
      { error: "Failed to invite members" },
      { status: 500 }
    );
  }
}
