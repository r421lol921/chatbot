"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { ArrowUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";

import { chatModels } from "@/lib/ai/models";
import type { Attachment, ChatMessage } from "@/lib/types";
import { useWebLLM } from "@/hooks/use-webllm";
import { cn } from "@/lib/utils";
import { LockIcon, Cpu, Loader2 } from "lucide-react";
import { WebLLMInstallModal } from "./webllm-install-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { Button } from "../ui/button";
import { PaperclipIcon, StopIcon } from "./icons";
import { ReplyIcon, XIcon, SmileIcon } from "lucide-react";
import type { ReplyContext } from "./messages";

const STORAGE_SELECTED_MODEL_KEY = "lio-selected-model";
import { PreviewAttachment } from "./preview-attachment";
import {
  type SlashCommand,
  SlashCommandMenu,
  slashCommands,
} from "./slash-commands";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "./visibility-selector";

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
  editingMessage,
  onCancelEdit,
  isLoading,
  replyTo,
  onClearReply,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage:
    | UseChatHelpers<ChatMessage>["sendMessage"]
    | (() => Promise<void>);
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  isLoading?: boolean;
  replyTo?: ReplyContext;
  onClearReply?: () => void;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const hasAutoFocused = useRef(false);

  // Determine if sending is blocked because the on-device model is not yet downloaded
  const webllmForBlock = useWebLLM();
  const selectedModelForBlock = chatModels.find((m) => m.id === selectedModelId);
  const isModelNotReady =
    !!selectedModelForBlock?.webllmModelId &&
    webllmForBlock.status !== "ready" &&
    webllmForBlock.status !== "generating";
  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
    }
  }, [localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = event.target.value;
    setInput(val);

    if (val.startsWith("/") && !val.includes(" ")) {
      setSlashOpen(true);
      setSlashQuery(val.slice(1));
      setSlashIndex(0);
    } else {
      setSlashOpen(false);
    }
  };

  const handleSlashSelect = (cmd: SlashCommand) => {
    setSlashOpen(false);
    setInput("");
    switch (cmd.action) {
      case "new":
        router.push("/");
        break;
      case "clear":
        setMessages(() => []);
        break;
      case "rename":
        toast("Rename is available from the sidebar chat menu.");
        break;
      case "model": {
        const modelBtn = document.querySelector<HTMLButtonElement>(
          "[data-testid='model-selector']"
        );
        modelBtn?.click();
        break;
      }
      case "theme":
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        break;
      case "delete":
        toast("Delete this chat?", {
          action: {
            label: "Delete",
            onClick: () => {
              fetch(
                `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
                { method: "DELETE" }
              );
              router.push("/");
              toast.success("Chat deleted");
            },
          },
        });
        break;
      case "purge":
        toast("Delete all chats?", {
          action: {
            label: "Delete all",
            onClick: () => {
              fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
                method: "DELETE",
              });
              router.push("/");
              toast.success("All chats deleted");
            },
          },
        });
        break;
      default:
        break;
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const submitForm = useCallback(() => {
    window.history.pushState(
      {},
      "",
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
    );

    sendMessage({
      role: "user",
      parts: [
        ...attachments.map((attachment) => ({
          type: "file" as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: "text",
          text: input,
        },
      ],
    });

    onClearReply?.();
    setAttachments([]);
    setLocalStorageInput("");
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = useCallback(
    async (file: File): Promise<Attachment | { textContent: string; name: string } | undefined> => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error ?? "Failed to upload file");
          return undefined;
        }

        // Text files return their content directly
        if (data.textContent !== undefined) {
          return { textContent: data.textContent, name: data.name };
        }

        return {
          url: data.url,
          name: data.name,
          contentType: data.contentType,
        };
      } catch (_error) {
        toast.error("Failed to upload file, please try again!");
        return undefined;
      }
    },
    []
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      setUploadQueue(files.map((file) => file.name));

      try {
        const results = await Promise.all(files.map((file) => uploadFile(file)));

        const imageAttachments: Attachment[] = [];
        const textParts: string[] = [];

        for (const result of results) {
          if (!result) continue;
          if ("textContent" in result) {
            textParts.push(
              `--- File: ${result.name} ---\n${result.textContent}\n--- End of file ---`
            );
          } else {
            imageAttachments.push(result as Attachment);
          }
        }

        if (imageAttachments.length > 0) {
          setAttachments((current) => [...current, ...imageAttachments]);
        }

        if (textParts.length > 0) {
          const textToAppend = textParts.join("\n\n");
          setInput((current) =>
            current ? `${current}\n\n${textToAppend}` : textToAppend
          );
          toast.success(
            `${textParts.length} text file${textParts.length > 1 ? "s" : ""} added to message`
          );
        }
      } catch (_error) {
        toast.error("Failed to upload files");
      } finally {
        setUploadQueue([]);
        if (event.target) event.target.value = "";
      }
    },
    [setAttachments, setInput, uploadFile]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) {
        return;
      }

      event.preventDefault();

      setUploadQueue((prev) => [...prev, "Pasted image"]);

      try {
        const uploadPromises = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
          .map((file) => uploadFile(file));

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment =>
            attachment !== undefined &&
            "url" in attachment &&
            attachment.url !== undefined &&
            attachment.contentType !== undefined
        );

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
      } catch (_error) {
        toast.error("Failed to upload pasted image(s)");
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {editingMessage && onCancelEdit && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Editing message</span>
          <button
            className="rounded px-1.5 py-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            onMouseDown={(e) => {
              e.preventDefault();
              onCancelEdit();
            }}
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      {!editingMessage &&
        !isLoading &&
        messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            sendMessage={sendMessage}
          />
        )}

      <input
        accept="image/jpeg,image/png,image/gif,image/webp,text/plain,text/markdown,.txt,.md,.csv,.log"
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <div className="relative">
        {slashOpen && (
          <SlashCommandMenu
            onClose={() => setSlashOpen(false)}
            onSelect={handleSlashSelect}
            query={slashQuery}
            selectedIndex={slashIndex}
          />
        )}
      </div>

      {replyTo && (
        <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
          <ReplyIcon className="size-3 shrink-0 opacity-60" />
          <span className="flex-1 truncate leading-relaxed opacity-80">
            {replyTo.text}
          </span>
          <button
            className="ml-auto rounded p-0.5 transition-colors hover:bg-muted hover:text-foreground"
            onMouseDown={(e) => { e.preventDefault(); onClearReply?.(); }}
            type="button"
            aria-label="Cancel reply"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      )}

      <PromptInput
        className="[&>div]:rounded-2xl [&>div]:border [&>div]:border-border/30 [&>div]:bg-card/70 [&>div]:shadow-[var(--shadow-composer)] [&>div]:transition-shadow [&>div]:duration-300 [&>div]:focus-within:shadow-[var(--shadow-composer-focus)]"
        onSubmit={() => {
          if (isModelNotReady) return;
          if (input.startsWith("/")) {
            const query = input.slice(1).trim();
            const cmd = slashCommands.find((c) => c.name === query);
            if (cmd) {
              handleSlashSelect(cmd);
            }
            return;
          }
          if (!input.trim() && attachments.length === 0) {
            return;
          }
          if (status === "ready" || status === "error") {
            submitForm();
          } else {
            toast.error("Please wait for the model to finish its response!");
          }
        }}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex w-full self-start flex-row gap-2 overflow-x-auto px-3 pt-3 no-scrollbar"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                attachment={attachment}
                key={attachment.url}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.url !== attachment.url)
                  );
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{
                  url: "",
                  name: filename,
                  contentType: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
        )}
        <PromptInputTextarea
          className="min-h-24 text-[13px] leading-relaxed px-4 pt-3.5 pb-1.5 placeholder:text-muted-foreground/35"
          data-testid="multimodal-input"
          onChange={handleInput}
          onKeyDown={(e) => {
            // Block Enter when model is not downloaded
            if (isModelNotReady && e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              return;
            }
            if (slashOpen) {
              const filtered = slashCommands.filter((cmd) =>
                cmd.name.startsWith(slashQuery.toLowerCase())
              );
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSlashIndex((i) => Math.min(i + 1, filtered.length - 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSlashIndex((i) => Math.max(i - 1, 0));
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (filtered[slashIndex]) {
                  handleSlashSelect(filtered[slashIndex]);
                }
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setSlashOpen(false);
                return;
              }
            }
            if (e.key === "Escape" && editingMessage && onCancelEdit) {
              e.preventDefault();
              onCancelEdit();
            }
          }}
          placeholder={
            editingMessage ? "Edit your message..." : "Ask anything..."
          }
          ref={textareaRef}
          value={input}
        />
        <PromptInputFooter className="px-3 pb-3">
          <PromptInputTools>
            <AttachmentsButton
              fileInputRef={fileInputRef}
              status={status}
            />
            <ModelSelectorCompact
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
          </PromptInputTools>

          <div className="flex items-center gap-1">
            <EmojiPickerButton
              onEmojiSelect={(emoji) => {
                setInput((prev) => prev + emoji);
                textareaRef.current?.focus();
              }}
              open={emojiOpen}
              onOpenChange={setEmojiOpen}
            />

            {status === "submitted" || status === "streaming" ? (
              <StopButton setMessages={setMessages} stop={stop} />
            ) : (
              <PromptInputSubmit
              className={cn(
                "h-7 w-7 rounded-xl transition-all duration-200",
                input.trim() && !isModelNotReady
                  ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                  : "bg-muted text-muted-foreground/25 cursor-not-allowed"
              )}
              data-testid="send-button"
              disabled={!input.trim() || uploadQueue.length > 0 || isModelNotReady}
              status={status}
              variant="secondary"
            >
              <ArrowUpIcon className="size-4" />
            </PromptInputSubmit>
            )}
          </div>
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }
    if (prevProps.editingMessage !== nextProps.editingMessage) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }
    if (prevProps.replyTo !== nextProps.replyTo) {
      return false;
    }

    return true;
  }
);

// Animated GIF sticker set
const GIF_STICKERS: { src: string; alt: string; insert: string }[] = [
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/w_tunes.GIF-pHXpiJ3why5pH2NwQ1lzTkyutrw36V.gif", alt: "Kirby with headphones", insert: "[kirby]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/picsart220424212.PNG-xu0AXjWJSudSzTDCqOnSsGUu1nSCUR.png", alt: "Blue star", insert: "[star]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%3Acorazn%3A-115LCtC3BvXucsXfSJiBEpSQPoP8Pq.gif", alt: "Pink heart", insert: "[heart]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/whiteshake.GIF-zy1iXHtYXSF56Obw4hUM99sp6XdKHs.gif", alt: "White bunny", insert: "[bunny]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3D_Angry_Spunchbop.GIF-2ZLLoLcdrjT5dfZlNgW6ufXWCUqCVR.gif", alt: "Angry Spongebob", insert: "[spunchbop]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mine.PNG-tLO4enDEDSjNziY4LTHEePaWivo8Od.png", alt: "Minecraft grass block", insert: "[mine]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/spotify91.GIF-Jl3U0DdnDLTrN6XMxTGW6eBOduX7IW.gif", alt: "Spotify", insert: "[spotify]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/des_sleep.GIF-eo5RHzDSB6xVOVVPqXGd8du9IuZFol.gif", alt: "Sleeping Mario", insert: "[sleep]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hmhm.GIF-0UAMcaxvPQFCLykwR4CxFnnxHhy9Bn.gif", alt: "Thinking", insert: "[think]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/59463dhearts.GIF-md1YyX4oZnluJf9uGQjaTSj8S4uuvo.gif", alt: "Two hearts", insert: "[hearts]" },
];

// Map insert codes → GIF src for rendering in messages
export const GIF_STICKER_MAP: Record<string, string> = Object.fromEntries(
  GIF_STICKERS.map((s) => [s.insert, s.src])
);

function EmojiPickerButton({
  onEmojiSelect,
  open,
  onOpenChange,
}: {
  onEmojiSelect: (emoji: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          className="h-7 w-7 rounded-lg border border-border/40 p-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          title="Pick a sticker"
          variant="ghost"
          type="button"
        >
          <SmileIcon size={14} style={{ width: 14, height: 14 }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-[240px] p-2"
        sideOffset={8}
      >
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-1">Stickers</p>
        <div className="grid grid-cols-5 gap-1">
          {GIF_STICKERS.map((sticker) => (
            <button
              key={sticker.insert}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:bg-muted hover:scale-110 active:scale-95"
              title={sticker.alt}
              onClick={() => {
                onEmojiSelect(sticker.insert);
                onOpenChange(false);
              }}
            >
              <img
                src={sticker.src}
                alt={sticker.alt}
                className="h-8 w-8 object-contain"
                unselectable="on"
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
}) {
  return (
    <Button
      className="h-7 w-7 rounded-lg border border-border/40 p-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      data-testid="attachments-button"
      disabled={status !== "ready"}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      title="Attach images or text files"
      variant="ghost"
    >
      <PaperclipIcon size={14} style={{ width: 14, height: 14 }} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const selectedModel =
    chatModels.find((m) => m.id === selectedModelId) ?? chatModels[0];

  const [showInstallModal, setShowInstallModal] = useState(false);
  const webllm = useWebLLM();

  // On mount: restore the previously selected model from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_SELECTED_MODEL_KEY);
    if (stored && stored !== selectedModelId) {
      onModelChange?.(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selectedModelId changes, persist it and auto-load WebLLM if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_SELECTED_MODEL_KEY, selectedModelId);
    }
    const model = chatModels.find((m) => m.id === selectedModelId);
    if (model?.webllmOnly && model.webllmModelId) {
      // Auto-load WebLLM if the selected model requires it and it isn't loaded yet
      const needsLoad =
        webllm.status === "idle" || webllm.status === "error" ||
        (webllm.status === "ready" && webllm.modelId !== model.webllmModelId);
      if (needsLoad) {
        webllm.switchModel(model.webllmModelId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModelId]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isOnDevice = mounted && webllm.isActive;
  const isWebLLMLoading = mounted && webllm.status === "loading";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground select-none"
            data-testid="model-selector"
            type="button"
          >
            {isWebLLMLoading && (
              <Loader2 className="size-3 animate-spin" />
            )}
            {selectedModel.name}
            {/* On-device pill shown in the trigger */}
            {isOnDevice && !isWebLLMLoading && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold text-foreground/70">
                <Cpu className="size-2.5" />
                on device
              </span>
            )}
            <svg
              className="size-3 opacity-60"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="min-w-[220px]" side="top">
          {chatModels.map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <div key={model.id}>
                <DropdownMenuItem
                  className={cn(
                    "flex items-center gap-2 py-2 group",
                    model.locked && "cursor-not-allowed opacity-70"
                  )}
                  onSelect={(e) => {
                    if (model.locked) {
                      e.preventDefault();
    
                    } else {
                      if (model.id !== selectedModelId && webllm.isActive) {
                        webllm.setActive(false);
                      }
                      onModelChange?.(model.id);
                    }
                  }}
                >
                  <div className="flex flex-col items-start gap-0.5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium">{model.name}</span>
                      {model.locked && (
                        <LockIcon className="size-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                      )}
                      {model.requiresPlus && (
                        <span className="text-[9px] font-semibold plus-badge-bg text-white px-1.5 py-0.5 rounded-full">
                          PLUS
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {model.description}
                    </span>
                    {/* Inline download / status — same visual weight as description */}
                    {model.id === "lio-1" && (
                      isWebLLMLoading ? (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground select-none">
                          <svg
                            className="size-3 animate-spin shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                          </svg>
                          {Math.round(webllm.progress * 100)}%
                        </span>
                      ) : isOnDevice ? (
                        <span className="text-[11px] text-muted-foreground select-none">
                          On device
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-[11px] text-foreground underline underline-offset-2 decoration-muted-foreground/40 hover:decoration-foreground transition-colors cursor-pointer bg-transparent border-0 p-0 m-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            webllm.loadModel();
                          }}
                        >
                          Download
                        </button>
                      )
                    )}
                  </div>
                </DropdownMenuItem>
              </div>
            );
          })}

        </DropdownMenuContent>
      </DropdownMenu>

      {/* WebLLM Install Modal */}
      <WebLLMInstallModal
        open={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onActivate={() => {
          webllm.setActive(true);
          if (selectedModelId !== "lio-1" && selectedModelId !== "lio-2") {
            onModelChange?.("lio-1");
          }
        }}
      />


    </>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      className="h-7 w-7 rounded-xl bg-foreground p-1 text-background transition-all duration-200 hover:opacity-85 active:scale-95 disabled:bg-muted disabled:text-muted-foreground/25 disabled:cursor-not-allowed"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
