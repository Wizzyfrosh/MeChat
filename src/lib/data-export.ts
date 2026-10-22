import "server-only";
import {and,asc,desc,eq,lt,or,sql} from "drizzle-orm";
import {getDatabase} from "@/db/client";
import {conversations,messages} from "@/db/schema";

type Subject={user:{id:string;email:string;name:string};conversationId?:string;format:"json"|"markdown";signal:AbortSignal};
type Chat={id:string;title:string;createdAt:Date;updatedAt:Date};
const encoder=new TextEncoder();
const roleOrder=sql<number>`case when ${messages.role} = 'user' then 0 else 1 end`;

/** Bounded database pages plus ReadableStream pull backpressure (one chunk at a time). */
async function* messageChunks(db:ReturnType<typeof getDatabase>,chatId:string,format:"json"|"markdown",signal:AbortSignal){
 let offset=0,first=true;
 for(;;){
  if(signal.aborted)throw new Error("Export canceled");
  const batch=await db.select({
   id:messages.id,role:messages.role,content:messages.content,status:messages.status,
   provider:messages.provider,modelId:messages.modelId,createdAt:messages.createdAt
  }).from(messages).where(eq(messages.conversationId,chatId))
   .orderBy(asc(messages.createdAt),asc(messages.requestId),asc(roleOrder),asc(messages.id))
   .limit(200).offset(offset);
  for(const message of batch){
   if(signal.aborted)throw new Error("Export canceled");
   if(format==="json")yield (first?"":",")+JSON.stringify(message);
   else{
    const name=message.role==="user"?"You":"MeChat";
    yield `\n\n## ${name}\n\n${message.content}\n`;
    if(message.status!=="complete")yield `\n*Response status: ${message.status}*\n`;
   }
   first=false;
  }
  if(batch.length<200)break;
  offset+=batch.length;
 }
}

async function* exportChunks(subject:Subject){
 const db=getDatabase();
 const exact=subject.conversationId?await db.select({
  id:conversations.id,title:conversations.title,createdAt:conversations.createdAt,updatedAt:conversations.updatedAt
 }).from(conversations).where(and(eq(conversations.id,subject.conversationId),eq(conversations.userId,subject.user.id))).limit(1):null;
 if(subject.conversationId&&!exact?.length)throw new Error("Conversation no longer exists");
 if(!subject.conversationId){
  const header={format:"mechat-data-v1",exportedAt:new Date().toISOString(),account:{name:subject.user.name,email:subject.user.email}};
  yield JSON.stringify(header).replace(/}$/,',"conversations":[');
 }
 let first=true;
 let cursor:{updatedAt:Date;id:string}|null=null;
 for(;;){
  if(subject.signal.aborted)throw new Error("Export canceled");
  const older=cursor?or(lt(conversations.updatedAt,cursor.updatedAt),
   and(eq(conversations.updatedAt,cursor.updatedAt),lt(conversations.id,cursor.id))):undefined;
  const page:Chat[]=exact??await db.select({
   id:conversations.id,title:conversations.title,createdAt:conversations.createdAt,updatedAt:conversations.updatedAt
  }).from(conversations).where(and(eq(conversations.userId,subject.user.id),older))
   .orderBy(desc(conversations.updatedAt),desc(conversations.id)).limit(50);
  if(!page.length)break;
  for(const chat of page){
   if(subject.format==="json"){
    yield (first?"":",")+JSON.stringify(chat).replace(/}$/,',"messages":[');
   }else yield `# ${chat.title}\n\nExported from MeChat on ${new Date().toISOString()}\n`;
   yield* messageChunks(db,chat.id,subject.format,subject.signal);
   if(subject.format==="json")yield "]}";
   first=false;
  }
  if(exact||page.length<50)break;
  const last=page[page.length-1];
  cursor={updatedAt:last.updatedAt,id:last.id};
 }
 if(subject.format==="json"&&!exact)yield "]}";
}

/** Download serialization is lazy; the server never buffers an entire history. */
export function streamChatExport(subject:Subject){
 const iterator=exportChunks(subject)[Symbol.asyncIterator]();
 const stream=new ReadableStream<Uint8Array>({
  async pull(controller){
   try{
    const next=await iterator.next();
    if(next.done)controller.close();
    else controller.enqueue(encoder.encode(next.value));
   }catch(error){controller.error(error)}
  },
  async cancel(){await iterator.return?.()}
 });
 const day=new Date().toISOString().slice(0,10);
 const extension=subject.format==="markdown"?"md":"json";
 const filename=subject.conversationId?
  `mechat-conversation-${subject.conversationId}.${extension}`:`mechat-data-${day}.json`;
 return new Response(stream,{
  headers:{
   "Content-Type":subject.format==="markdown"?"text/markdown; charset=utf-8":"application/json; charset=utf-8",
   "Content-Disposition":`attachment; filename="${filename}"`,
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Robots-Tag":"noindex"
  }
 });
}
