const groups=[
['금속','철괴 흑철 은괴 구리선 별철','대검 레이피어 전쟁낫 관통포 쌍검','⚔️ 🗡️ 🪓 🏹 ⚔️','#fbbf75'],
['불','불씨 용암석 잿가루 태양석 숯덩이','불꽃도끼 용암망치 잿빛낫 태양포 화염검','🪓 🔨 🗡️ ☀️ ⚔️','#ff785c'],
['얼음','얼음석 서리가루 빙하조각 물방울 진주','빙결창 서리검 빙하망치 물결채찍 진주창','🔱 🗡️ 🔨 🌊 🔱','#84dfff'],
['폭풍','번개석 폭풍깃털 자석 바람결정 천둥유리','번개활 깃털석궁 전자포 돌풍부채 천둥검','🏹 🏹 ⚡ 🌪️ 🗡️','#b79dff'],
['자연','갈대 가시덩굴 단풍잎 이끼 뿌리나무','갈대봉 가시채찍 단풍부채 이끼망치 뿌리곤봉','🎋 🌿 🍁 🔨 🪵','#a9db86'],
['괴수','용의비늘 늑대송곳니 돌거인파편 거미줄 달팽이껍데기','용비늘검 송곳니단검 바위해머 거미석궁 껍데기철퇴','⚔️ 🗡️ 🔨 🏹 🐚','#ff9a84'],
['마법','수정 달빛가루 그림자천 별가루 봉인종이','수정지팡이 월광홀 그림자낫 별술서 봉인부','🪄 🌙 🗡️ 📖 📜','#ffa6df'],
['잡동사니','고무줄 유리구슬 낡은스프링 종이컵 빈깡통','고무줄새총 구슬포 스프링건 종이컵포 깡통해머','🏹 🔮 🚀 🥤 🔨','#e0c992']
];
export const materials=groups.flatMap(([group,names,weapons,icons,color],g)=>names.split(' ').map((name,i)=>({id:g*5+i,name,group,g,i,weapon:weapons.split(' ')[i],icon:icons.split(' ')[i],color})));
const specials=[
['갈대 군주의 홀',[20],[16,18,38],'🎋'],['뇌룡 대검',[25],[3],'⚡',15],['빙하 파쇄기',[12],[27,29],'🔨'],['백야의 창',[31],[2,14],'🔱'],['태양 폭쇄 도끼',[9],[8,6],'☀️'],['그림자 봉인부',[32],[30,34],'📜'],['급조한 깡통포',[39],[37,36],'🔩'],['종이컵 태풍기',[38],[16,18],'🌪️'],['유성 관통포',[4],[33,30],'☄️'],['수몰 전자포',[13],[17,15],'⚡'],['가시 별채찍',[21],[33,24],'🌿'],['폭풍 송곳니',[26],[19,16],'🐺']
];
export function draw(){
 const pool=materials.map(x=>x.id);
 for(let i=0;i<5;i++){const j=i+Math.floor(Math.random()*(pool.length-i));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,5);
}
export function forge(ids){
 const m=ids.map(x=>materials[x]), first=m[0];
 let power=100+m.reduce((a,x)=>a+8+x.i,0), strong=0, link=0, position=0;
 for(let i=1;i<5;i++){
  const a=m[i-1], b=m[i];
  if(b.i%4===i-1) position+=5;
  if((a.g+1)%8===b.g && strong<2){link+=15;strong++;}
  else if(a.g===b.g || a.i===b.i)link+=5;
 }
 const special=specials.find(([,a,b,,third])=>m.some((x,i)=>a.includes(x.id)&&b.includes(m[i+1]?.id)&&(third===undefined||third===m[i+2]?.id)));
 const element=m[1];
 return {name:special?.[0]??(first.g===element.g?first.weapon:element.group+' '+first.weapon),icon:special?.[3]??first.icon,color:element.color,damage:power+position+Math.min(40,link)+(special?5:0),position,link:Math.min(40,link),rare:!!special};
}
