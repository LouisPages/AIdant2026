/**
 * Formes des données de départ (seed). Les dates y sont écrites en clair (« Il y a 2 h », « Hier, 18:42 ») ;
 * le script de seed les convertit en dates ISO enregistrées dans DynamoDB.
 */
import type { ChatMessage, Conversation, ModerationCase, Reply, Thread } from "@/lib/types";

export type SeedReply = Omit<Reply, "createdAt"> & { time: string };
export type SeedThread = Omit<Thread, "createdAt" | "replies"> & { time: string; replies: SeedReply[] };
export type SeedChatMessage = Omit<ChatMessage, "createdAt"> & { time: string };
export type SeedConversation = Omit<Conversation, "messages"> & { messages: SeedChatMessage[] };
export type SeedModerationCase = Omit<ModerationCase, "receivedAt"> & { receivedAt: string };
