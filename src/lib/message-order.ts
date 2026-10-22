import { desc, sql } from "drizzle-orm";
import { messages } from "@/db/schema";

/**
 * Fetch newest turns first to bound queries, then reverse for display and model context.
 * Both rows of a turn share created_at and request_id. Ordering assistant first
 * in the DESC query guarantees user-first after .reverse(), irrespective of
 * PostgreSQL enum declaration order or UUID randomness.
 */
const turnRoleRank=sql<number>`CASE WHEN ${messages.role} = 'assistant' THEN 1 ELSE 0 END`;

export const recentMessageOrder=[
 desc(messages.createdAt),
 desc(messages.requestId),
 desc(turnRoleRank),
 desc(messages.id),
] as const;
