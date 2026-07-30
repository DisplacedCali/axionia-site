/**
 * Model access for the research pipeline.
 *
 * Deliberately an interface, not a hardcoded SDK call. Two reasons:
 *   1. The pipeline can be exercised end-to-end against a deterministic mock,
 *      so wave ordering and resumability are testable without spending tokens.
 *   2. Steps stay pure — they receive a client, they don't reach for a global.
 *
 * SERVER ONLY. ANTHROPIC_API_KEY must never reach the browser.
 */

import Anthropic from "@anthropic-ai/sdk";
import { JSON_ONLY_SUFFIX } from "./prompts";

/** Prompt truncation limits, carried over verbatim from axionia-app callAPI(). */
export const MAX_USER_PROMPT_CHARS = 6000;
export const MAX_SYSTEM_PROMPT_CHARS = 2000;

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
export const DEFAULT_MAX_TOKENS = Number(process.env.RESEARCH_MAX_TOKENS ?? 1500);

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface CompletionResult {
  text: string;
  usage: Usage;
  model: string;
  stopReason: string | null;
}

export interface LlmClient {
  complete(args: {
    system?: string | null;
    user: string;
    maxTokens?: number;
    label?: string;
  }): Promise<CompletionResult>;
}

/** Thrown when a step's model call fails. Carries the step label for the runner. */
export class LlmError extends Error {
  constructor(
    message: string,
    readonly label?: string,
    readonly status?: number,
  ) {
    super(label ? `[${label}] ${message}` : message);
    this.name = "LlmError";
  }
}

function truncate(s: string, limit: number): string {
  return s.length > limit ? s.slice(0, limit) + "\n[trimmed]" : s;
}

export function createAnthropicClient(opts?: {
  apiKey?: string;
  model?: string;
}): LlmClient {
  const apiKey = opts?.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set — the research pipeline cannot run without it.",
    );
  }
  const model = opts?.model ?? DEFAULT_MODEL;
  const anthropic = new Anthropic({ apiKey });

  return {
    async complete({ system, user, maxTokens, label }) {
      const trimmedUser = truncate(user, MAX_USER_PROMPT_CHARS);
      const trimmedSystem = system ? truncate(system, MAX_SYSTEM_PROMPT_CHARS) : undefined;

      let message: Anthropic.Message;
      try {
        message = await anthropic.messages.create({
          model,
          max_tokens: Math.min(maxTokens ?? DEFAULT_MAX_TOKENS, 8000),
          ...(trimmedSystem ? { system: trimmedSystem } : {}),
          messages: [{ role: "user", content: trimmedUser }],
        });
      } catch (e) {
        const err = e as { message?: string; status?: number };
        throw new LlmError(err.message ?? "model call failed", label, err.status);
      }

      const text = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();

      if (!text) throw new LlmError("empty response from model", label);

      return {
        text,
        usage: {
          inputTokens: message.usage?.input_tokens ?? 0,
          outputTokens: message.usage?.output_tokens ?? 0,
        },
        model,
        stopReason: message.stop_reason ?? null,
      };
    },
  };
}

/** Convenience wrapper: appends the JSON-only instruction. Ported from askJSON(). */
export async function completeJson(
  llm: LlmClient,
  args: { system?: string | null; user: string; maxTokens?: number; label?: string },
): Promise<CompletionResult> {
  return llm.complete({
    ...args,
    system: (args.system ?? "") + JSON_ONLY_SUFFIX,
  });
}

/**
 * Deterministic mock, for exercising the DAG without spending tokens.
 *
 * `responses` is keyed by step label. Any label present in `failOn` throws, so
 * resumability can be tested by failing a wave and re-running.
 */
export function createMockClient(opts: {
  responses: Record<string, string>;
  failOn?: string[];
  onCall?: (label: string) => void;
}): LlmClient {
  const failOn = new Set(opts.failOn ?? []);
  return {
    async complete({ user, label }) {
      const key = label ?? "unlabelled";
      opts.onCall?.(key);
      if (failOn.has(key)) throw new LlmError("simulated failure", key);
      const text = opts.responses[key];
      if (text === undefined) {
        throw new LlmError(`mock has no response for step "${key}"`, key);
      }
      return {
        text,
        usage: { inputTokens: user.length, outputTokens: text.length },
        model: "mock",
        stopReason: "end_turn",
      };
    },
  };
}
