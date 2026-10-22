export declare const MAX_CHAT_REQUEST_BYTES: number;
export declare const MAX_CONTEXT_CHARACTERS: number;
export declare const MAX_CONTEXT_MESSAGE_CHARACTERS: number;
export type ChatBodyResult =
  | {ok:true;value:unknown}
  | {ok:false;status:number;error:string};
export declare function readBoundedChatJson(request:Request,maxBytes?:number):Promise<ChatBodyResult>;
export type HistoryRow = {
  requestId:string;
  role:"user"|"assistant";
  content:string;
  status:"pending"|"complete"|"interrupted"|"failed";
};
export type HistoryMessage = {role:"user"|"assistant";content:string};
export declare function buildBoundedHistory(rows:HistoryRow[]):HistoryMessage[];
