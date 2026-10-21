/**
 * Incremental DeepSeek Chat Completions SSE parser.
 * Treat an empty response, malformed event, non-stop finish, missing [DONE],
 * or output above our cap as incomplete. This module is intentionally pure
 * and directly unit-testable without credentials or database access.
 */
export class DeepSeekStreamAccumulator {
  constructor(maxCharacters=40_000) {
    this.maxCharacters = maxCharacters;
    this.decoder = new TextDecoder();
    this.buffer = "";
    this.answer = "";
    this.usage = {};
    this.finishReason = "";
    this.done = false;
    this.receivedDone = false;
    this.overflow = false;
    this.malformed = false;
  }

  feed(chunk) {
    if (this.done) return [];
    this.buffer += typeof chunk === "string" ? chunk : this.decoder.decode(chunk, {stream:true});
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() ?? "";
    const fragments = [];
    for(const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const value = line.slice(6).trim();
      if(value === "[DONE]") {
        this.receivedDone = true;
        this.done = true;
        break;
      }
      try {
        const packet = JSON.parse(value);
        if (packet.usage && typeof packet.usage === "object") this.usage = packet.usage;
        const choice = packet.choices?.[0];
        if (typeof choice?.finish_reason === "string") this.finishReason = choice.finish_reason;
        const delta = choice?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          if (this.answer.length + delta.length > this.maxCharacters) {
            this.overflow = true;
            this.done = true;
            break;
          }
          this.answer += delta;
          fragments.push(delta);
        }
      } catch {
        this.malformed = true;
      }
    }
    return fragments;
  }

  get complete() {
    return this.receivedDone && !this.overflow && !this.malformed &&
      this.finishReason === "stop" && this.answer.trim().length > 0;
  }
}
