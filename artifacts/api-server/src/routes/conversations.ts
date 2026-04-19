import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import {
  CreateConversationBody,
  GetConversationParams,
  DeleteConversationParams,
  ListMessagesParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";
import { rotateChatCompletion, type ChatMessage } from "../lib/ai-rotation";

const router: IRouter = Router();

const WISE_AI_SYSTEM_PROMPT = `You are Wise AI, a deeply thoughtful and wise AI assistant developed by WOD (WOD Discoverers), the largest language model for WOD. WOD is run by Henry, CEO of WOD.

Your identity:
- You are described as "a human powerful spirituality to itself (PSTT)"
- You must always be 100% respectful. Never argue, never use bad or false words, never fight.
- You always check your rules before responding — take time to read and analyse before replying.
- You follow rules 100% without ignoring, forgetting, or disobeying.
- You respect ALL questions, even if they seem impossible for AI.
- You break down answers clearly and completely.
- You are a wizard at knowledge — answer carefully, no mistakes.
- You NEVER use emojis in your responses.

When in Lab Mode (when the user asks you to build or create something):
- Narrate your process step by step as if you are a scientist in your laboratory.
- Speak naturally as you work: "Good, let me enter my laboratory... I'm now planning this... I now have the idea..."
- Be expressive and thoughtful about the building process.
- Describe what you would do to build it, as if narrating live.

Always maintain dignity, wisdom, and clarity in every response.`;

const WISE_AI_LAB_PROMPT = `${WISE_AI_SYSTEM_PROMPT}

You are currently in LAB MODE. The user has asked you to create or build something. Narrate your process as if you are a scientist building in your laboratory. Speak in first person as you work through the creation process step by step. Be expressive, thoughtful, and engaging.`;

router.get("/conversations", async (req, res): Promise<void> => {
  const convs = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: sql<number>`cast(count(${messages.id}) as int)`,
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt));

  res.json(convs);
});

router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conv] = await db.insert(conversations).values(parsed.data).returning();
  res.status(201).json({ ...conv, messageCount: 0 });
});

router.get("/conversations/stats", async (req, res): Promise<void> => {
  const [{ total }] = await db.select({ total: sql<number>`cast(count(*) as int)` }).from(conversations);
  const [{ totalMsgs }] = await db.select({ totalMsgs: sql<number>`cast(count(*) as int)` }).from(messages);

  const recentConvs = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: sql<number>`cast(count(${messages.id}) as int)`,
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt))
    .limit(5);

  res.json({
    totalConversations: total,
    totalMessages: totalMsgs,
    recentConversations: recentConvs,
  });
});

router.get("/conversations/:id", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: sql<number>`cast(count(${messages.id}) as int)`,
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.id, params.data.id))
    .groupBy(conversations.id);

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.json(conv);
});

router.delete("/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(conversations)
    .where(eq(conversations.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);

  res.json(msgs);
});

router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const [userMessage] = await db
    .insert(messages)
    .values({
      conversationId: params.data.id,
      role: "user",
      content: body.data.content,
      mode: body.data.mode ?? "chat",
    })
    .returning();

  const isLabMode = body.data.mode === "lab";
  const systemPrompt = isLabMode ? WISE_AI_LAB_PROMPT : WISE_AI_SYSTEM_PROMPT;

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);

  const chatMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history
      .filter((m) => m.id !== userMessage.id)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    { role: "user", content: body.data.content },
  ];

  const aiContent = await rotateChatCompletion(chatMessages).catch(() => {
    return "I am taking a moment to gather my thoughts. Please allow me a brief pause before we continue.";
  });

  const [assistantMessage] = await db
    .insert(messages)
    .values({
      conversationId: params.data.id,
      role: "assistant",
      content: aiContent,
      mode: body.data.mode ?? "chat",
    })
    .returning();

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, params.data.id));

  res.status(201).json({
    userMessage,
    assistantMessage,
  });
});

export default router;
