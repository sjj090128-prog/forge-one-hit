import {materials,draw,forge} from './game.mjs';
import {html,boss} from './assets.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const uuid=()=>crypto.randomUUID();
export default {async fetch(req,env){
 const path=new URL(req.url).pathname;
 if(path==='/')return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});
 if(path==='/boss.jpeg')return boss?new Response(Uint8Array.from(atob(boss),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/jpeg'}}):new Response(null,{status:404});
 const db=env.DB;
 try{
 if(path==='/api/rank'&&req.method==='GET'){
  const {results}=await db.prepare('SELECT nickname, damage, weapon, icon, color FROM players WHERE damage>0 ORDER BY damage DESC, achieved ASC LIMIT 100').all();
  return json(results);
 }
 if(req.method!=='POST')return json({error:'페이지를 찾을 수 없습니다.'},404);
 const body=await req.json();
 if(path==='/api/register'){
  const nickname=typeof body.nickname==='string'?body.nickname.trim().normalize('NFKC'):'';
  const name=typeof body.name==='string'?body.name.trim():'';
  if(nickname.length<2||nickname.length>16||name.length<1||name.length>30)return json({error:'이름과 닉네임(2~16자)을 입력해 주세요.'},400);
  const token=uuid();
  const result=await db.prepare('INSERT OR IGNORE INTO players(token,nickname,nickname_key,name) VALUES (?,?,?,?)').bind(token,nickname,nickname.toLowerCase(),name).run();
  return result.meta.changes?json({token,nickname}):json({error:'이미 쓰는 닉네임입니다.'},409);
 }
 const player=await db.prepare('SELECT token FROM players WHERE token=?').bind(typeof body.token==='string'?body.token:'').first();
 if(!player)return json({error:'참가 정보를 다시 등록해 주세요.'},401);
 if(path==='/api/draw'){
  const ids=draw(), round=uuid();
  await db.prepare('INSERT INTO rounds(token,round,ids) VALUES(?,?,?) ON CONFLICT(token) DO UPDATE SET round=excluded.round,ids=excluded.ids,attempts=0,finished=0,recipe=NULL').bind(player.token,round,JSON.stringify(ids)).run();
  return json({round,materials:ids.map(id=>{const m=materials[id];return {id,name:m.name,group:m.group,color:m.color,hint:['속성 또는 마무리','연결','증폭','마무리','속성 또는 마무리'][m.i]};})});
 }
 const r=await db.prepare('SELECT * FROM rounds WHERE token=? AND round=?').bind(player.token,String(body.round??'')).first();
 if(!r||r.finished)return json({error:'이미 끝났거나 새로 뽑은 판입니다.'},409);
 if(path==='/api/forge'){
  const ids=body.ids;
  if(!Array.isArray(ids)||ids.length!==5||new Set(ids).size!==5||!ids.every(id=>JSON.parse(r.ids).includes(id)))return json({error:'뽑은 재료 다섯 개를 모두 넣어 주세요.'},400);
  const recipe=JSON.stringify(ids);
  const result=await db.prepare('UPDATE rounds SET attempts=attempts+1,recipe=? WHERE token=? AND round=? AND finished=0 AND attempts<2 AND (recipe IS NULL OR recipe<>?)').bind(recipe,player.token,r.round,recipe).run();
  if(!result.meta.changes)return json({error:'순서를 바꿀 기회를 다 썼거나 순서가 같습니다.'},409);
  return json({...forge(ids),attempts:r.attempts+1});
 }
 if(path==='/api/hit'&&r.recipe){
  const w=forge(JSON.parse(r.recipe));
  const [lock]=await db.batch([
   db.prepare('UPDATE rounds SET finished=1 WHERE token=? AND round=? AND finished=0 AND recipe=?').bind(player.token,r.round,r.recipe),
   db.prepare('UPDATE players SET damage=?,weapon=?,icon=?,color=?,achieved=? WHERE token=? AND damage<? AND changes()=1').bind(w.damage,w.name,w.icon,w.color,Date.now(),player.token,w.damage)
  ]);
  if(!lock.meta.changes)return json({error:'이번 판의 공격은 이미 끝났습니다.'},409);
  return json(w);
 }
 return json({error:'먼저 무기를 제작해 주세요.'},400);
 }catch(e){console.error(e.message);return json({error:'잠시 후 다시 시도해 주세요.'},500);}
}};

