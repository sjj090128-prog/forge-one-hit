import { readFileSync,writeFileSync,mkdirSync,existsSync } from 'node:fs';
const html=readFileSync('index.html','utf8');
const boss=existsSync('boss.jpeg')?readFileSync('boss.jpeg').toString('base64'):'';
const game=readFileSync('game.mjs','utf8').replaceAll('export ','');
const worker=readFileSync('worker.mjs','utf8').split('\n').slice(2).join('\n');
mkdirSync('dist/server',{recursive:true});
writeFileSync('dist/server/index.js','const html='+JSON.stringify(html)+';\nconst boss='+JSON.stringify(boss)+';\n'+game+'\n'+worker);
