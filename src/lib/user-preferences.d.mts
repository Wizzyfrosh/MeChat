export type Theme="light"|"dark";
export type ResponseStyle="balanced"|"concise"|"detailed";
export type Preferences={theme:Theme;responseStyle:ResponseStyle};
export declare const DEFAULT_PREFERENCES:Readonly<Preferences>;
export declare const THEME_OPTIONS:readonly string[];
export declare const RESPONSE_STYLES:readonly string[];
export declare function parsePreferencePatch(value:unknown):
 | {ok:true;patch:Partial<Preferences>}
 | {ok:false;error:string};
export declare function responseStyleInstruction(style:string):string;
