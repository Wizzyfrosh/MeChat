import { bigint, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

// Better Auth owns its user/session/account/verification tables.
// IDs here match its text-based user IDs. API ownership checks are mandatory.
export const messageRole = pgEnum("mechat_message_role", ["user", "assistant"]);
export const messageStatus = pgEnum("mechat_message_status", ["pending", "complete", "interrupted", "failed"]);
export const themePreference = pgEnum("mechat_theme", ["light", "dark", "system"]);
export const responseStyle = pgEnum("mechat_response_style", ["balanced", "concise", "detailed"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: varchar("title", { length: 160 }).notNull().default("New chat"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("conversations_owner_recent_idx").on(t.userId, t.updatedAt.desc()),
]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  requestId: uuid("request_id").notNull(),
  role: messageRole("role").notNull(),
  content: text("content").notNull(),
  status: messageStatus("status").notNull().default("complete"),
  provider: varchar("provider", { length: 48 }),
  modelId: varchar("model_id", { length: 128 }),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  createdAt: createdAt(),
}, (t) => [
  index("messages_conversation_order_idx").on(t.conversationId, t.createdAt, t.id),
  uniqueIndex("messages_request_role_unique_idx").on(t.conversationId, t.requestId, t.role),
]);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  theme: themePreference("theme").notNull().default("light"),
  responseStyle: responseStyle("response_style").notNull().default("balanced"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageEvents = pgTable("usage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  requestId: uuid("request_id").notNull(),
  provider: varchar("provider", { length: 48 }).notNull(),
  modelId: varchar("model_id", { length: 128 }).notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  estimatedCostMicros: bigint("estimated_cost_micros", { mode: "number" }).notNull().default(0),
  createdAt: createdAt(),
}, (t) => [
  index("usage_events_owner_time_idx").on(t.userId, t.createdAt.desc()),
  uniqueIndex("usage_events_request_unique_idx").on(t.requestId),
]);
