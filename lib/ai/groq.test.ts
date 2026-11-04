import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { completeWithGroq } from "./groq";

const messages = [{ role: "user" as const, content: "{}" }];
const reply = (content: string | null) => new Response(JSON.stringify({ choices: [{ message: { content } }] }));

const fetchMock = vi.fn();
const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("LLM_API_KEY", "test-key");
  vi.stubEnv("LLM_MODEL", "");
  vi.stubEnv("LLM_BASE_URL", "");
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(reply("{}"));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("completeWithGroq", () => {
  it("calls Groq's chat endpoint with the key, the default model and JSON output", async () => {
    await completeWithGroq(messages, AbortSignal.timeout(1_000));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(sentBody()).toMatchObject({ model: "openai/gpt-oss-120b", response_format: { type: "json_object" }, reasoning_effort: "low" });
  });

  it("treats empty settings from a copied .env.example as unset", async () => {
    await completeWithGroq(messages, AbortSignal.timeout(1_000));
    expect(sentBody().model).toBe("openai/gpt-oss-120b");
  });

  it("uses another model when asked, and only asks for low reasoning from reasoning models", async () => {
    vi.stubEnv("LLM_MODEL", "qwen/qwen3.8-27b");
    await completeWithGroq(messages, AbortSignal.timeout(1_000));
    expect(sentBody().model).toBe("qwen/qwen3.8-27b");
    expect(sentBody()).not.toHaveProperty("reasoning_effort");
  });

  it("returns the text of the answer", async () => {
    fetchMock.mockResolvedValue(reply('{"ok":true}'));
    await expect(completeWithGroq(messages, AbortSignal.timeout(1_000))).resolves.toBe('{"ok":true}');
  });

  it("fails when there is no key, without calling the API", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    await expect(completeWithGroq(messages, AbortSignal.timeout(1_000))).rejects.toThrow("LLM_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails on an error status, such as a rate limit", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 429 }));
    await expect(completeWithGroq(messages, AbortSignal.timeout(1_000))).rejects.toThrow("429");
  });

  it("fails when the model used up its budget thinking and left no answer", async () => {
    fetchMock.mockResolvedValue(reply(null));
    await expect(completeWithGroq(messages, AbortSignal.timeout(1_000))).rejects.toThrow();
  });
});
