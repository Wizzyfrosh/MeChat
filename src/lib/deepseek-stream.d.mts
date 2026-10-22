export declare class DeepSeekStreamAccumulator {
  constructor(maxCharacters?: number);
  feed(chunk: Uint8Array|string): string[];
  readonly answer: string;
  readonly complete: boolean;
  readonly done: boolean;
  readonly receivedDone: boolean;
  readonly overflow: boolean;
  readonly malformed: boolean;
  readonly finishReason: string;
  readonly usage: {prompt_tokens?:number;completion_tokens?:number};
}
