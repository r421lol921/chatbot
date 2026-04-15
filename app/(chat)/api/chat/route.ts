import { geolocation, ipAddress } from "@vercel/functions";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from "ai";
import { checkBotId } from "botid/server";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import {
  allowedModelIds,
  chatModels,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
} from "@/lib/ai/models";
import { type RequestHints } from "@/lib/ai/prompts";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getLastUserMessageTime,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { generateSmartResponse, generateThinkingText, detectIntent, generateCodeResponse } from "@/lib/ai/smart-responses";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { getMap } from "@/lib/ai/tools/get-map";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const [, session] = await Promise.all([
      checkBotId().catch(() => null),
      auth(),
    ]);

    if (!session?.user) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    const chatModel = allowedModelIds.has(selectedChatModel)
      ? selectedChatModel
      : DEFAULT_CHAT_MODEL;

    await checkIpRateLimit(ipAddress(request));

    const userType: UserType = session.user.type;
    const entitlements = entitlementsByUserType[userType];

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatbotError("forbidden:chat").toResponse();
      }
      messagesFromDb = await getMessagesByChatId({ id });
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    let uiMessages: ChatMessage[];

    if (isToolApprovalFlow && messages) {
      const dbMessages = convertToUIMessages(messagesFromDb);
      const approvalStates = new Map(
        messages.flatMap(
          (m) =>
            m.parts
              ?.filter(
                (p: Record<string, unknown>) =>
                  p.state === "approval-responded" ||
                  p.state === "output-denied"
              )
              .map((p: Record<string, unknown>) => [
                String(p.toolCallId ?? ""),
                p,
              ]) ?? []
        )
      );
      uiMessages = dbMessages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (
            "toolCallId" in part &&
            approvalStates.has(String(part.toolCallId))
          ) {
            return { ...part, ...approvalStates.get(String(part.toolCallId)) };
          }
          return part;
        }),
      })) as ChatMessage[];
    } else {
      uiMessages = [
        ...convertToUIMessages(messagesFromDb),
        message as ChatMessage,
      ];
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Check rate limit BEFORE saving the message so the saved message
    // doesn't immediately count against the user on the very same request.
    if (!isToolApprovalFlow) {
      const messageCount = await getMessageCountByUserId({
        id: session.user.id,
        differenceInHours: entitlements.messageIntervalHours,
      });
      if (messageCount >= entitlements.maxMessagesPerHour) {
        return new ChatbotError("rate_limit:chat").toResponse();
      }
    }

    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const modelConfig = chatModels.find((m) => m.id === chatModel);
    const modelCapabilities = await getCapabilities();
    const capabilities = modelCapabilities[chatModel];

    // Extract the raw user message text for the smart response engine
    const userMessageText = (() => {
      if (message?.parts) {
        return message.parts
          .filter((p: Record<string, unknown>) => p.type === "text")
          .map((p: Record<string, unknown>) => String(p.text ?? ""))
          .join(" ")
          .trim();
      }
      return "";
    })();

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const reasoningId = generateId();
        const messageId = generateId();

        // Detect intent: weather, map, code, or generic text
        const intent = detectIntent(userMessageText);

        // Generate contextual thinking text based on the message
        const thinkingText = generateThinkingText(userMessageText);

        // Simulate thinking animation with reasoning block
        dataStream.write({
          type: "reasoning-start",
          id: reasoningId,
        });

        for (const char of thinkingText) {
          dataStream.write({
            type: "reasoning-delta",
            id: reasoningId,
            delta: char,
          });
          await new Promise((resolve) => setTimeout(resolve, 28));
        }

        dataStream.write({
          type: "reasoning-end",
          id: reasoningId,
        });

        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 800 + 400)
        );

        // ── Weather intent ──────────────────────────────────────────────
        if (intent.type === "weather" && intent.location) {
          const toolCallId = generateId();
          dataStream.write({ type: "tool-input-start", toolCallId, toolName: "getWeather" });
          dataStream.write({ type: "tool-input-delta", toolCallId, inputTextDelta: JSON.stringify({ city: intent.location }) });
          dataStream.write({ type: "tool-input-end", toolCallId });

          try {
            const weatherResult = await getWeather.execute({ city: intent.location }, { toolCallId, messages: [] });
            dataStream.write({ type: "tool-result", toolCallId, result: weatherResult });

            const intro = `Here is the current weather for **${intent.location}**:`;
            dataStream.write({ type: "text-start", id: messageId });
            for (const char of intro) {
              dataStream.write({ type: "text-delta", id: messageId, delta: char });
              await new Promise((r) => setTimeout(r, 30));
            }
            dataStream.write({ type: "text-end", id: messageId });
          } catch {
            const fallback = `I tried fetching the weather for ${intent.location} but hit a snag. Try asking again in a moment!`;
            dataStream.write({ type: "text-start", id: messageId });
            for (const char of fallback) {
              dataStream.write({ type: "text-delta", id: messageId, delta: char });
              await new Promise((r) => setTimeout(r, 35));
            }
            dataStream.write({ type: "text-end", id: messageId });
          }

        // ── Map intent ─────────────────────────────────────────────────
        } else if (intent.type === "map" && intent.location) {
          const toolCallId = generateId();
          dataStream.write({ type: "tool-input-start", toolCallId, toolName: "getMap" });
          dataStream.write({ type: "tool-input-delta", toolCallId, inputTextDelta: JSON.stringify({ query: intent.location }) });
          dataStream.write({ type: "tool-input-end", toolCallId });

          try {
            const mapResult = await getMap.execute({ query: intent.location, zoom: 13 }, { toolCallId, messages: [] });
            dataStream.write({ type: "tool-result", toolCallId, result: mapResult });

            const intro = `Here is a map for **${intent.location}**:`;
            dataStream.write({ type: "text-start", id: messageId });
            for (const char of intro) {
              dataStream.write({ type: "text-delta", id: messageId, delta: char });
              await new Promise((r) => setTimeout(r, 30));
            }
            dataStream.write({ type: "text-end", id: messageId });
          } catch {
            const fallback = `Couldn't load the map for ${intent.location} right now. Try again in a moment!`;
            dataStream.write({ type: "text-start", id: messageId });
            for (const char of fallback) {
              dataStream.write({ type: "text-delta", id: messageId, delta: char });
              await new Promise((r) => setTimeout(r, 35));
            }
            dataStream.write({ type: "text-end", id: messageId });
          }

        // ── Code generation intent ──────────────────────────────────────
        } else if (intent.type === "code") {
          const codeResponse = generateCodeResponse(userMessageText);
          dataStream.write({ type: "text-start", id: messageId });
          for (const char of codeResponse) {
            dataStream.write({ type: "text-delta", id: messageId, delta: char });
            await new Promise((r) => setTimeout(r, 25));
          }
          dataStream.write({ type: "text-end", id: messageId });

        // ── Generic smart text response ─────────────────────────────────
        } else {
          const smartResponse = generateSmartResponse(userMessageText);
          dataStream.write({ type: "text-start", id: messageId });
          for (const char of smartResponse) {
            dataStream.write({ type: "text-delta", id: messageId, delta: char });
            await new Promise((resolve) => setTimeout(resolve, 40));
          }
          dataStream.write({ type: "text-end", id: messageId });
        }

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: "data-chat-title", data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: (error) => {
        console.error("[v0] chat stream error:", error);
        // Return undefined so the SDK does not inject an error text-part
        // into the finished messages — the HTTP status code already surfaces
        // rate-limit / auth errors to the client via ChatbotError.toResponse().
        return undefined;
      },
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch (_) {
          /* non-critical */
        }
      },
    });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }

    console.error("[v0] chat API error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
