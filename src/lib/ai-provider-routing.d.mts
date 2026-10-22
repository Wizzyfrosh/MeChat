export declare const FREE_PROVIDER_PRIORITY:readonly string[];
export declare const PROVIDER_IDS:readonly string[];
export declare function providerAttempts(selection:string,available:string[]):string[];
export declare function shouldAutoTryNext(selection:string,status:number):boolean;