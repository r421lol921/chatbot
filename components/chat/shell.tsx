"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useWebLLM } from "@/hooks/use-webllm";
import {
  initialArtifactData,
  useArtifact,
  useArtifactSelector,
} from "@/hooks/use-artifact";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { ChatHeader } from "./chat-header";
import { DataStreamHandler } from "./data-stream-handler";
import { submitEditedMessage } from "./message-editor";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { RateLimitBanner } from "./rate-limit-banner";

export function ChatShell() {
  const {
    chatId,
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    addToolApprovalResponse,
    input,
    setInput,
    visibilityType,
    isReadonly,
    isLoading,
    votes,
    currentModelId,
    setCurrentModelId,
  } = useActiveChat();

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();
  
  const webllm = useWebLLM();
  const [localStatus, setLocalStatus] = useState<"ready" | "submitted">("ready");
  
  // Handle sending messages with local model
  const sendLocalMessage = useCallback(
    async (message: ChatMessage) => {
      if (webllm.status !== "ready") {
        return;
      }

      // Add user message to state
      const userMessage: ChatMessage = {
        ...message,
        id: message.id || generateUUID(),
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setLocalStatus("submitted");

      // Create placeholder assistant message
      const assistantId = generateUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        parts: [{ type: "text", text: "" }],
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Convert messages to WebLLM format
        const chatHistory = [...messages, userMessage].map((m) => {
          const textPart = m.parts?.find((p) => p.type === "text");
          return {
            role: m.role as "user" | "assistant" | "system",
            content: textPart && "text" in textPart ? textPart.text : "",
          };
        });

        // Stream the response
        await webllm.generateResponse(chatHistory, (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    parts: [
                      {
                        type: "text",
                        text:
                          ((m.parts?.[0] as { text?: string })?.text || "") +
                          chunk,
                      },
                    ],
                  }
                : m
            )
          );
        });
      } catch (error) {
        console.error("[v0] Local model error:", error);
        // Update the assistant message to show error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  parts: [
                    {
                      type: "text",
                      text: "Sorry, I encountered an error generating a response.",
                    },
                  ],
                }
              : m
          )
        );
      } finally {
        setLocalStatus("ready");
      }
    },
    [webllm, messages, setMessages]
  );
  
  // Determine if we should use local model (user explicitly activated on-device mode)
  const useLocalChat = webllm.isActive &&
    (webllm.status === "ready" || webllm.status === "generating");
  
  // Wrapped send function - matches sendMessage signature
  const wrappedSendMessage: typeof sendMessage = useCallback(
    (message) => {
      if (useLocalChat) {
        sendLocalMessage(message as ChatMessage);
        return Promise.resolve(); 
      } else {
        return sendMessage(message);
      }
    },
    [useLocalChat, sendLocalMessage, sendMessage]
  );
  
  // Combined status
  const effectiveStatus = useLocalChat ? localStatus : status;

  const stopRef = useRef(stop);
  stopRef.current = stop;

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      stopRef.current();
      setArtifact(initialArtifactData);
      setEditingMessage(null);
      setAttachments([]);
    }
  }, [chatId, setArtifact]);

  return (
    <>
      <div className="flex h-dvh w-full flex-row overflow-hidden">
        <div
          className={cn(
            "flex min-w-0 flex-col bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isArtifactVisible ? "w-[40%]" : "w-full"
          )}
        >
          <ChatHeader
            chatId={chatId}
            isReadonly={isReadonly}
            selectedVisibilityType={visibilityType}
          />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
            <Messages
              addToolApprovalResponse={addToolApprovalResponse}
              chatId={chatId}
              isArtifactVisible={isArtifactVisible}
              isLoading={isLoading}
              isReadonly={isReadonly}
              messages={messages}
              onEditMessage={(msg) => {
                const text = msg.parts
                  ?.filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join("");
                setInput(text ?? "");
                setEditingMessage(msg);
              }}
              regenerate={regenerate}
              selectedModelId={currentModelId}
              setMessages={setMessages}
              status={effectiveStatus}
              votes={votes}
            />

            <div className="sticky bottom-0 z-1 flex w-full flex-col gap-0 border-t-0 bg-background pt-1 pb-3 md:pb-4">
              <RateLimitBanner />
              <div className="mx-auto w-full max-w-4xl px-2 md:px-4">
              {!isReadonly && (
                <MultimodalInput
                  attachments={attachments}
                  chatId={chatId}
                  editingMessage={editingMessage}
                  input={input}
                  isLoading={isLoading}
                  messages={messages}
                  onCancelEdit={() => {
                    setEditingMessage(null);
                    setInput("");
                  }}
                  onModelChange={setCurrentModelId}
                  selectedModelId={currentModelId}
                  selectedVisibilityType={visibilityType}
                  sendMessage={
                    editingMessage
                      ? async () => {
                          const msg = editingMessage;
                          setEditingMessage(null);
                          await submitEditedMessage({
                            message: msg,
                            text: input,
                            setMessages,
                            regenerate,
                          });
                          setInput("");
                        }
                      : wrappedSendMessage
                  }
                  setAttachments={setAttachments}
                  setInput={setInput}
                  setMessages={setMessages}
                  status={effectiveStatus}
                  stop={useLocalChat ? webllm.stopGeneration : stop}
                />
              )}
              </div>
            </div>
          </div>
        </div>

        <Artifact
          addToolApprovalResponse={addToolApprovalResponse}
          attachments={attachments}
          chatId={chatId}
          input={input}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={currentModelId}
          selectedVisibilityType={visibilityType}
          sendMessage={wrappedSendMessage}
          setAttachments={setAttachments}
          setInput={setInput}
          setMessages={setMessages}
          status={effectiveStatus}
          stop={useLocalChat ? webllm.stopGeneration : stop}
          votes={votes}
        />
      </div>

      <DataStreamHandler />


    </>
  );
}
