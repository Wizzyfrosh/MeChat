-- MeChat initial database schema.
-- Tested on dedicated Neon branch mechat-preview (br-blue-cake-ar9amf8p).
-- DO NOT run against production until explicitly reviewed and approved.
-- Database: PostgreSQL 18; UUID generation uses built-in gen_random_uuid().
BEGIN;

CREATE TYPE "mechat_message_role" AS ENUM ('user', 'assistant');
CREATE TYPE "mechat_message_status" AS ENUM ('pending', 'complete', 'interrupted', 'failed');
CREATE TYPE "mechat_theme" AS ENUM ('light', 'dark', 'system');
CREATE TYPE "mechat_response_style" AS ENUM ('balanced', 'concise', 'detailed');

CREATE TABLE "user" (
 "id" text PRIMARY KEY NOT NULL,
 "name" text NOT NULL,
 "email" text UNIQUE NOT NULL,
 "email_verified" boolean DEFAULT false NOT NULL,
 "image" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "session" (
 "id" text PRIMARY KEY NOT NULL,
 "expires_at" timestamp with time zone NOT NULL,
 "token" text UNIQUE NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 "ip_address" text, "user_agent" text,
 "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX "session_user_idx" ON "session"("user_id");

CREATE TABLE "account" (
 "id" text PRIMARY KEY NOT NULL, "account_id" text NOT NULL,
 "provider_id" text NOT NULL, "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 "access_token" text, "refresh_token" text, "id_token" text,
 "access_token_expires_at" timestamp with time zone,
 "refresh_token_expires_at" timestamp with time zone, "scope" text, "password" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "account_user_idx" ON "account"("user_id");

CREATE TABLE "verification" (
 "id" text PRIMARY KEY NOT NULL,
 "identifier" text NOT NULL, "value" text NOT NULL,
 "expires_at" timestamp with time zone NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

CREATE TABLE "conversations" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "user_id" text NOT NULL, "title" varchar(160) DEFAULT 'New chat' NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "conversations_owner_recent_idx" ON "conversations"("user_id", "updated_at" DESC);

CREATE TABLE "messages" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
 "request_id" uuid NOT NULL,
 "role" "mechat_message_role" NOT NULL,
 "content" text NOT NULL,
 "status" "mechat_message_status" DEFAULT 'complete' NOT NULL,
 "provider" varchar(48), "model_id" varchar(128),
 "input_tokens" integer, "output_tokens" integer,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "messages_conversation_order_idx" ON "messages"("conversation_id", "created_at", "id");
CREATE UNIQUE INDEX "messages_request_role_unique_idx" ON "messages"("conversation_id", "request_id", "role");

CREATE TABLE "user_settings" (
 "user_id" text PRIMARY KEY NOT NULL,
 "theme" "mechat_theme" DEFAULT 'light' NOT NULL,
 "response_style" "mechat_response_style" DEFAULT 'balanced' NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "usage_events" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "user_id" text NOT NULL,
 "conversation_id" uuid REFERENCES "conversations"("id") ON DELETE SET NULL,
 "request_id" uuid NOT NULL, "provider" varchar(48) NOT NULL,
 "model_id" varchar(128) NOT NULL,
 "input_tokens" integer DEFAULT 0 NOT NULL,
 "output_tokens" integer DEFAULT 0 NOT NULL,
 "estimated_cost_micros" bigint DEFAULT 0 NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "usage_events_owner_time_idx" ON "usage_events"("user_id", "created_at" DESC);
CREATE UNIQUE INDEX "usage_events_request_unique_idx" ON "usage_events"("request_id");

CREATE TABLE "ai_daily_quotas" (
 "user_id" text NOT NULL,
 "day" date NOT NULL, "requests" integer DEFAULT 0 NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "ai_daily_quotas_pkey" PRIMARY KEY("user_id", "day")
);
COMMIT;
