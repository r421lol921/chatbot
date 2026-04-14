import { auth } from "@/app/(auth)/auth";
import { ChatbotError } from "@/lib/errors";
import { addMessageReaction, getReactionsByMessageId } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const { chatId, messageId, emoji } = await request.json();

    const session = await auth();
    if (!session?.user?.id) {
      throw new ChatbotError("unauthorized:chat", "Unauthorized");
    }

    await addMessageReaction({
      messageId,
      userId: session.user.id,
      emoji,
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    return Response.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      throw new ChatbotError("bad_request:chat", "Missing messageId");
    }

    const reactions = await getReactionsByMessageId({ messageId });

    // Group reactions by emoji and count
    const grouped = reactions.reduce(
      (acc, reaction) => {
        const existing = acc.find((r) => r.emoji === reaction.emoji);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ emoji: reaction.emoji, count: 1, userReacted: false });
        }
        return acc;
      },
      [] as Array<{ emoji: string; count: number; userReacted: boolean }>
    );

    return Response.json({ reactions: grouped });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    return Response.json(
      { error: "Failed to get reactions" },
      { status: 500 }
    );
  }
}
