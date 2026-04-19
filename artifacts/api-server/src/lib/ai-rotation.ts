import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "./logger";

const ROTATION_MODELS = [
  "gpt-5.2",
  "gpt-5.1",
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
] as const;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function isRateLimitOrQuotaError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const status = (e["status"] as number) ?? (e["statusCode"] as number);
    const message = String(e["message"] ?? "").toLowerCase();
    return (
      status === 429 ||
      status === 503 ||
      status === 500 ||
      message.includes("rate limit") ||
      message.includes("quota") ||
      message.includes("overloaded") ||
      message.includes("capacity")
    );
  }
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function rotateChatCompletion(
  messages: ChatMessage[],
  maxTokens = 8192
): Promise<string> {
  const modelsToTry = [...ROTATION_MODELS];
  let lastError: unknown;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      logger.info({ model, attempt: i + 1 }, "Wise AI attempting model");

      const completion = await openai.chat.completions.create({
        model,
        max_completion_tokens: maxTokens,
        messages,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        if (i > 0) {
          logger.info({ model, primary: modelsToTry[0] }, "Wise AI rotated to fallback model successfully");
        }
        return content;
      }

      throw new Error("Empty response from model");
    } catch (err) {
      lastError = err;

      if (isRateLimitOrQuotaError(err)) {
        logger.warn(
          { model, attempt: i + 1, totalModels: modelsToTry.length },
          "Model rate limited or quota exceeded — rotating to next model"
        );

        if (i < modelsToTry.length - 1) {
          await sleep(300 * (i + 1));
          continue;
        }
      } else {
        logger.error({ model, err }, "Model returned non-quota error — rotating anyway");
        if (i < modelsToTry.length - 1) {
          continue;
        }
      }
    }
  }

  logger.error({ lastError }, "All models exhausted in rotation pool");
  throw new Error(
    "Wise AI is momentarily unavailable across all response channels. Please try again in a moment."
  );
}
