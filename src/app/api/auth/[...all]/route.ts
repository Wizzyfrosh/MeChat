import { toNextJsHandler } from "better-auth/next-js";
import { getAuth, isAuthConfigured } from "@/lib/auth";
export const runtime="nodejs";
async function handle(req: Request) {
 if(!isAuthConfigured())return Response.json({error:"Authentication is not configured yet."},{status:503});
 const { GET, POST }=toNextJsHandler(getAuth());
 return req.method==="GET"?GET(req):POST(req);
}
export const GET=handle;
export const POST=handle;
