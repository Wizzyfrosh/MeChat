import "server-only";
import {and,asc,desc,eq,lt,or,sql} from "drizzle-orm";
import {getDatabase} from "@/db/client";
import {conversations,messages} from "@/db/schema";

type ConversationExport={
 id:string;title:string;createdAt:Date;updatedAt:Date;
};
type ExportSubject={id:string;email:string;name:string};
type Scope={user:ExportSubject;conversationId?:string;format:"json"|"markdown";signal:AbortSignal};

const encoder=new TextEncoder();
const messageRoleOrder=sql<number>`case when ${messages.role} = 'user' then 0 else 1 end`;
const mime=(format:"json"|"markdown")=>format==="json"?"application/json; charset=utf-8":"text/markdown; charset=utf-8";
const filename=(subject:Scope)=>{
 const day=new Date().toISOString().slice(0,10);
 return subject.conversationId?`mechat-conversation-${subject.conversationId}.${subject.format==="json"?"json":"md"}`:`mechat-data-${day}.json`;
};

/** Stream each message in fixed-size pages, not one unbounded database response. */
async function forEachMessage(db:ReturnType<typeof getDatabase>,conversationId:string,write:(data:string)=>void,format:"json"|"markdown",signal:AbortSignal){
 let offset=0,first=true;
 for(;;){
  if(signal.aborted)throw new Error("Export interrupted");
  const batch=await db.select({
   id:messages.id,role:messages.role,content:messages.content,status:messages.status,
   provider:messages.provider,modelId:messages.modelId,createdAt:messages.createdAt
  }).from(messages).where(eq(messages.conversationId,conversationId))
   .orderBy(asc(messages.createdAt),asc(messages.requestId),asc(messageRoleOrder),asc(messages.id))
   .limit(200).offset(offset);
  for(const item of batch){
   if(format==="json"){
    write((first?"":",")+JSON.stringify(item));
   }else{
    const heading=item.role==="user"?"You":"MeChat";
    write(`\n\n## ${heading}\n\n${item.content}\n`);
    if(item.status!=="complete")write(`\n*Response status: ${item.status}*\n`);
   }
   first=false;
  }
  if(batch.length<200)break;
  offset+=batch.length;
 }
}

/** Export single chat as JSON/Markdown or an entire account's chat data as JSON. */
export function streamChatExport(subject:Scope){
 const db=getDatabase();
 const stream=new ReadableStream<Uint8Array>({
  async start(controller){
   const write=(value:string)=>{if(subject.signal.aborted)throw new Error("Export canceled");controller.enqueue(encoder.encode(value));};
   try{
    const exact=subject.conversationId?
      await db.select({
       id:conversations.id,title:conversations.title,createdAt:conversations.createdAt,updatedAt:conversations.updatedAt
      }).from(conversations)
       .where(and(eq(conversations.userId,subject.user.id),eq(conversations.id,subject.conversationId)))
       .limit(1):null;
    const individual=exact?.[0];
    if(subject.conversationId&&!individual)throw new Error("Export target was removed");
    if(!subject.conversationId){
     write(JSON.stringify({
      format:"mechat-data-v1",exportedAt:new Date().toISOString(),
      account:{name:subject.user.name,email:subject.user.email}
     }).replace(/}$/,',"conversations":['));
    }
    let firstConversation=true;
    let cursor:{updatedAt:Date;id:string}|null=null;
    while(!subject.signal.aborted){
     let page:ConversationExport[];
     if(individual){
      if(!firstConversation)break;
      page=[individual];
     }else{
      const older=cursor?or(
       lt(conversations.updatedAt,cursor.updatedAt),
       and(eq(conversations.updatedAt,cursor.updatedAt),lt(conversations.id,cursor.id))
      ):undefined;
      page=await db.select({
       id:conversations.id,title:conversations.title,createdAt:conversations.createdAt,updatedAt:conversations.updatedAt
      }).from(conversations)
       .where(and(eq(conversations.userId,subject.user.id),older))
       .orderBy(desc(conversations.updatedAt),desc(conversations.id)).limit(50);
     }
     if(!page.length)break;
     for(const chat of page){
      if(subject.format==="markdown"){
       write(`# ${chat.title}\n\nExported from MeChat on ${new Date().toISOString()}\n`);
      }else{
       write((firstConversation?"":",")+JSON.stringify(chat).replace(/}$/,',"messages":['));
      }
      await forEachMessage(db,chat.id,write,subject.format,subject.signal);
      if(subject.format==="json")write("]}");
      firstConversation=false;
     }
     if(individual||page.length<50)break;
     const last=page[page.length-1];
     cursor={updatedAt:last.updatedAt,id:last.id};
    }
    if(subject.format==="json"&&!individual)write("]}");
    if(subject.format==="json"&&individual&&!firstConversation)write("\n");
    controller.close();
   }catch(error){
    // Stream failures must be surfaced to the downloader, never silently
    // deliver a valid-looking but truncated export.
    controller.error(error);
   }
  }
 });
 return new Response(stream,{
  headers:{
   "Content-Type":mime(subject.format),
   "Content-Disposition":`attachment; filename="${filename(subject)}"`,
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Robots-Tag":"noindex"
  }
 });
}
