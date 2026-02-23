import { describe, it, expect, vi, beforeEach } from "vitest";
import { addTranscript, flushNow, clearBuffer } from "./transcript-store.js";

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn().mockReturnValue({
  upsert: mockUpsert,
  insert: mockInsert,
});

vi.mock("./supabase.js", () => ({
  getSupabase: () => ({
    from: mockFrom,
  }),
}));

describe("transcript-store", () => {
  const sessionId = "test-session-123";

  beforeEach(() => {
    vi.clearAllMocks();
    clearBuffer(sessionId);
  });

  it("batches transcript chunks and flushes with correct structure", async () => {
    addTranscript({
      sessionId,
      speaker: "candidate",
      content: "Hello",
      timestampMs: 1000,
      openaiItemId: null,
    });
    addTranscript({
      sessionId,
      speaker: "interviewer",
      content: "Hi there",
      timestampMs: 2000,
      openaiItemId: "item-1",
    });

    await flushNow(sessionId);

    expect(mockFrom).toHaveBeenCalledWith("transcripts");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          session_id: sessionId,
          speaker: "interviewer",
          content: "Hi there",
          timestamp_ms: 2000,
          openai_item_id: "item-1",
        }),
      ]),
      expect.any(Object)
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          session_id: sessionId,
          speaker: "candidate",
          content: "Hello",
          timestamp_ms: 1000,
        }),
      ])
    );
  });

  it("deduplicates by openaiItemId when upserting", async () => {
    addTranscript({
      sessionId,
      speaker: "candidate",
      content: "First",
      timestampMs: 1000,
      openaiItemId: "item-1",
    });
    addTranscript({
      sessionId,
      speaker: "candidate",
      content: "Updated",
      timestampMs: 1500,
      openaiItemId: "item-1",
    });

    await flushNow(sessionId);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content: "Updated", openai_item_id: "item-1" }),
      ]),
      expect.any(Object)
    );
    expect(mockUpsert.mock.calls[0][0]).toHaveLength(1);
  });
});
