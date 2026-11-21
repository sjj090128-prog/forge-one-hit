import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {Readable} from 'node:stream';
import worker from './dist/server/index.js';
const db=new DatabaseSync(process.env.FORGE_DB||'forge.sqlite');
db.exec(readFileSync('drizzle/0001_game.sql','utf8'));
const DB={
 prepare(sql){
  const statement=db.prepare(sql);
  const bind=(...args)=>({
   all:()=>({results:statement.all(...args)}),
   first:()=>statement.get(...args),
   run:()=>({meta:statement.run(...args)})
  });
  return {...bind(),bind};
 },
 batch(statements){
  db.exec('BEGIN');
  try{const results=statements.map(s=>s.run());db.exec('COMMIT');return results;}
  catch(error){db.exec('ROLLBACK');throw error;}
 }
};
export {DB};
if(!process.env.FORGE_TEST){
 const port=Number(process.env.PORT||3000);
 createServer(async(req,res)=>{
  try{
   const body=['GET','HEAD'].includes(req.method)?undefined:Readable.toWeb(req);
   const result=await worker.fetch(new Request('http://localhost'+req.url,{method:req.method,body,duplex:'half',headers:req.headers}),{DB});
   res.writeHead(result.status,Object.fromEntries(result.headers));
   res.end(Buffer.from(await result.arrayBuffer()));
  }catch(error){console.error(error.message);res.writeHead(500).end();}
 }).listen(port,process.env.FORGE_HOST||(process.env.RENDER?'0.0.0.0':'127.0.0.1'),()=>console.log('http://localhost:'+port));
}

