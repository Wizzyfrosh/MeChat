export type WebShortcut="search"|"new-chat"|"dismiss";
export declare function getWebShortcut(event:{
 key:string;metaKey?:boolean;ctrlKey?:boolean;altKey?:boolean;
 shiftKey?:boolean;repeat?:boolean;isComposing?:boolean;
}):WebShortcut|null;
