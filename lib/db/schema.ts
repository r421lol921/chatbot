import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Better Auth manages the "user" table directly — we mirror it here for Drizzle queries.
export const user = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  isAnonymous: boolean("isAnonymous").notNull().default(false),
  userType: varchar("userType", { length: 20 }).notNull().default("regular"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});



export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: text("userId").notNull(),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  viewCount: integer("viewCount").notNull().default(0),
});

export type Chat = InferSelectModel<typeof chat>;

export const chatView = pgTable("ChatView", {
  id: text("id").primaryKey().notNull(),
  chatId: text("chatId").notNull().references(() => chat.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewedAt").notNull().defaultNow(),
  visitorId: varchar("visitorId", { length: 64 }),
});

export type ChatView = InferSelectModel<typeof chatView>;

export const message = pgTable("Message_v2", {
  id: text("id").primaryKey().notNull(),
  chatId: text("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: text("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: text("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: text("id").notNull(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: text("userId").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  })
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: text("id").notNull(),
    documentId: text("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: text("userId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: text("id").notNull(),
    chatId: text("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const reaction = pgTable("MessageReaction", {
  id: text("id").primaryKey().notNull(),
  messageId: text("messageId")
    .notNull()
    .references(() => message.id),
  userId: text("userId"),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type MessageReaction = InferSelectModel<typeof reaction>;

export const chatShare = pgTable("ChatShare", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  shareToken: varchar("shareToken", { length: 32 }).notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt"),
});

export type ChatShare = InferSelectModel<typeof chatShare>;

export const chatMember = pgTable("ChatMember", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  userId: uuid("userId").references(() => user.id),
  email: varchar("email", { length: 64 }),
  role: varchar("role", { enum: ["member", "owner"] }).notNull().default("member"),
  joinedAt: timestamp("joinedAt").notNull().defaultNow(),
});

export type ChatMember = InferSelectModel<typeof chatMember>;

export const game = pgTable("Game", {
  id: varchar("id", { length: 12 }).primaryKey().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  html: text("html").notNull(),
  userId: uuid("userId").references(() => user.id),
  chatId: uuid("chatId").references(() => chat.id),
  shareToken: varchar("shareToken", { length: 32 }).notNull().unique(),
  plays: integer("plays").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Game = InferSelectModel<typeof game>;

export const userIntegration = pgTable("UserIntegration", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => user.id),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserIntegration = InferSelectModel<typeof userIntegration>;
