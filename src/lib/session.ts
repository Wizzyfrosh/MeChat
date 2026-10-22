import "server-only";
import { headers } from "next/headers";
import { getAuth, isAuthConfigured } from "./auth";
export async function getUserSession() {
 if(!isAuthConfigured()) return null;
 try{return await getAuth().api.getSession({headers:await headers()})}catch{return null}
}
