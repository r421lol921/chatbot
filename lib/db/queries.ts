import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { ChatbotError } from "../errors";
import { generateUUID } from "../utils";
import {
  type Chat,
  chat,
  chatMember,
  chatShare,
  chatView,
  type DBMessage,
  document,
  message,
  reaction,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

const connectionString =
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL ??
  "";

// Supabase pooled (PgBouncer) URLs include ?pgbouncer=true and sslmode in
// the query string. Prepared statements must be disabled for the pooler.
const isPooled =
  connectionString.includes("pgbouncer=true") ||
  connectionString.includes("6543"); // Supabase pooler port

const hasSslParam = connectionString.includes("sslmode=");

const sqlClient = postgres(connectionString, {
  ...(hasSslParam ? {} : { ssl: "require" }),
  ...(isPooled ? { prepare: false } : {}),
  max: 10,
});
export const db = drizzle(sqlClient);

/**
 * Upserts a User row by Supabase auth UUID so FK constraints on Chat/Message
 * are satisfied even before the auth trigger fires.
 */
export async function ensureUserRow({
  id,
  email,
  type,
}: {
  id: string;
  email: string;
  type: string;
}) {
  try {
    await db
      .insert(user)
      .values({
        id,
        email,
        password: null,
        isAnonymous: type === "guest",
        userType: type === "guest" ? "guest" : "regular",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: user.id,
        set: { email, updatedAt: new Date() },
      });
  } catch {
    // Row already exists or concurrent insert — safe to ignore
  }
}

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error("[createGuestUser] error:", error);
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<unknown>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save messages");
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt))
      .limit(20);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to save document");
  }
}

export async function updateDocumentContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    const docs = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    const latest = docs[0];
    if (!latest) {
      throw new ChatbotError("not_found:database", "Document not found");
    }

    return await db
      .update(document)
      .set({ content })
      .where(and(eq(document.id, id), eq(document.createdAt, latest.createdAt)))
      .returning();
  } catch (_error) {
    if (_error instanceof ChatbotError) {
      throw _error;
    }
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update document content"
    );
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (_error) {
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const cutoffTime = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, cutoffTime),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function getLastUserMessageTime({
  userId,
}: {
  userId: string;
}): Promise<Date | null> {
  try {
    const [latest] = await db
      .select({ createdAt: message.createdAt })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(and(eq(chat.userId, userId), eq(message.role, "user")))
      .orderBy(desc(message.createdAt))
      .limit(1)
      .execute();

    return latest?.createdAt ?? null;
  } catch (_error) {
    return null;
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function addMessageReaction({
  messageId,
  userId,
  emoji,
}: {
  messageId: string;
  userId: string;
  emoji: string;
}) {
  try {
    return await db.insert(reaction).values({
      messageId,
      userId,
      emoji,
      createdAt: new Date(),
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to add message reaction"
    );
  }
}

export async function getReactionsByMessageId({ messageId }: { messageId: string }) {
  try {
    return await db
      .select()
      .from(reaction)
      .where(eq(reaction.messageId, messageId))
      .orderBy(asc(reaction.createdAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get reactions by message id"
    );
  }
}

export async function createChatShare({
  chatId,
  shareToken,
}: {
  chatId: string;
  shareToken: string;
}) {
  try {
    return await db.insert(chatShare).values({
      chatId,
      shareToken,
      createdAt: new Date(),
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create chat share"
    );
  }
}

export async function getChatShareByToken({ shareToken }: { shareToken: string }) {
  try {
    const [share] = await db
      .select()
      .from(chatShare)
      .where(eq(chatShare.shareToken, shareToken));
    return share || null;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chat share"
    );
  }
}

export async function addChatMember({
  chatId,
  userId,
  email,
}: {
  chatId: string;
  userId?: string;
  email: string;
}) {
  try {
    return await db.insert(chatMember).values({
      chatId,
      userId,
      email,
      joinedAt: new Date(),
    });
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to add chat member"
    );
  }
}

export async function getChatMembers({ chatId }: { chatId: string }) {
  try {
    return await db
      .select()
      .from(chatMember)
      .where(eq(chatMember.chatId, chatId))
      .orderBy(asc(chatMember.joinedAt));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get chat members"
    );
  }
}

export async function setUserType({
  userId,
  userType,
}: {
  userId: string;
  userType: "regular" | "plus" | "guest";
}) {
  try {
    return await db
      .update(user)
      .set({ userType })
      .where(eq(user.id, userId))
      .returning({ id: user.id, email: user.email, userType: user.userType });
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to set user type");
  }
}

export async function getUserById({ id }: { id: string }) {
  try {
    const [found] = await db.select().from(user).where(eq(user.id, id));
    return found ?? null;
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get user by id");
  }
}

export async function getUserByEmail({ email }: { email: string }) {
  try {
    const [found] = await db.select().from(user).where(eq(user.email, email));
    return found ?? null;
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get user by email");
  }
}

export async function getPublicChats({ limit = 5 }: { limit?: number } = {}) {
  try {
    const publicChats = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        userId: chat.userId,
        viewCount: chat.viewCount,
      })
      .from(chat)
      .where(eq(chat.visibility, "public"))
      .orderBy(desc(chat.createdAt))
      .limit(50);

    // Pick random 5 from the pool
    const shuffled = publicChats.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get public chats");
  }
}

export async function updateChatViewCount({
  chatId,
  viewCount,
}: {
  chatId: string;
  viewCount: number;
}) {
  try {
    await db
      .update(chat)
      .set({ viewCount })
      .where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to update view count");
  }
}

export async function getViewCountForChat({ chatId }: { chatId: string }): Promise<number> {
  try {
    const [result] = await db
      .select({ count: count(chatView.id) })
      .from(chatView)
      .where(eq(chatView.chatId, chatId));
    return result?.count ?? 0;
  } catch (_error) {
    return 0;
  }
}

export async function getTotalPublicChatViews(): Promise<number> {
  try {
    const publicChatIds = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.visibility, "public"));

    if (publicChatIds.length === 0) return 0;

    const ids = publicChatIds.map((c) => c.id);
    const [result] = await db
      .select({ count: count(chatView.id) })
      .from(chatView)
      .where(inArray(chatView.chatId, ids));
    return result?.count ?? 0;
  } catch (_error) {
    return 0;
  }
}

export async function recordChatView({
  chatId,
  visitorId,
}: {
  chatId: string;
  visitorId?: string;
}) {
  try {
    await db.insert(chatView).values({
      chatId,
      viewedAt: new Date(),
      visitorId: visitorId ?? null,
    });
  } catch (_error) {
    // Silent — view tracking should never break chat loading
  }
}

export async function setViewCountForChat({
  chatId,
  count: targetCount,
}: {
  chatId: string;
  count: number;
}) {
  try {
    const current = await getViewCountForChat({ chatId });
    const diff = targetCount - current;
    if (diff > 0) {
      // Add synthetic view rows to reach the target
      const rows = Array.from({ length: diff }, () => ({
        chatId,
        viewedAt: new Date(),
        visitorId: null as string | null,
      }));
      await db.insert(chatView).values(rows);
    } else if (diff < 0) {
      // Delete the most recent |diff| rows
      const toDelete = await db
        .select({ id: chatView.id })
        .from(chatView)
        .where(eq(chatView.chatId, chatId))
        .orderBy(desc(chatView.viewedAt))
        .limit(Math.abs(diff));
      if (toDelete.length > 0) {
        await db.delete(chatView).where(
          inArray(
            chatView.id,
            toDelete.map((r) => r.id)
          )
        );
      }
    }
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to set view count");
  }
}
