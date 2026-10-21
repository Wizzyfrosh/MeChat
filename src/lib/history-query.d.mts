export declare const HISTORY_PAGE_SIZE:number;
export declare const HISTORY_MAX_PAGE_SIZE:number;
export declare const HISTORY_MAX_QUERY:number;
export declare const HISTORY_MAX_CURSOR:number;
export declare function escapeSqlLike(value:string):string;
export type HistoryCursor={updatedAt:Date;id:string};
export declare function encodeHistoryCursor(value:HistoryCursor):string;
export declare function decodeHistoryCursor(raw:string):HistoryCursor;
export declare function parseHistoryQuery(url:string):{q:string;limit:number;cursor:HistoryCursor|null};
