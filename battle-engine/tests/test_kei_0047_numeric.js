'use strict';
// 004.7: ability-description models; these are numerical assertions, not proof of original-game equivalence.
const assert = require('node:assert/strict');
const E = require('../src/kei_unified_engine_v0_4_7.js');
const blank = () => Array(6).fill(null);
const basis = x => Object.assign({attack:0,defense:5000,hp:200000,magic:1000},x||{});
function make(key, options={}){
 const deck=blank(),turn=options.turn||1; deck[turn-1]=key;
 return E.createBattle({
  title:'004.7 numeric',mode:'full',damageMode:'estimate',
  orders:Array(6).fill('player'),
  player:{base:basis(options.player)},
  enemy:{base:basis(options.enemy)},
  playerDeck:deck,enemyDeck:blank()
 });
}
let passed=0;
function test(name,fn){try{fn();console.log('PASS '+name);passed++;}catch(err){console.error('FAIL '+name,err.stack);process.exitCode=1;}}
function run(key,options={},times=1){const b=make(key,options);for(let i=0;i<times;i++)E.round(b);return b;}
const additions=['barbatos','halphas','malphas','raum','agares','banshee','dory_j','andrealphus','seere','ostal_priestess','storm_murmur','thunder_skaah','lilah','evil_mandrake','future_andramelech'];
test('004.7 contains 97 source models, 15 additional from 004.6',()=>{
 assert.equal(E.SOURCE_RULES.length,97);
 assert.equal(new Set(E.SOURCE_RULES.map(x=>x.key)).size,97);
 for(const key of additions){assert.equal(E.D[key].model,true,key);assert.equal(E.D[key].tier,'source-model',key);}
});
test('Gusion variants remain unmodeled (temporary evasion and deck-type rules)',()=>{
 for(const name of ['グシオン','春風に舞うグシオン','王の風・グシオン'])assert.equal(Object.values(E.D).some(x=>x.name===name&&x.model),false,name);
});
test('Barbatos steals 40% attack on attack phase',()=>{
 const b=run('barbatos',{enemy:{attack:2000}});
 assert.equal(b.fighters.player.current.attack,800);
 assert.equal(b.fighters.enemy.current.attack,1200);
});
test('Halphas steals 30% attack on attack phase',()=>{
 const b=run('halphas',{enemy:{attack:2000}});
 assert.equal(b.fighters.player.current.attack,600);
 assert.equal(b.fighters.enemy.current.attack,1400);
});
test('Malphas steals 30% defense on attack phase',()=>{
 const b=run('malphas');
 assert.equal(b.fighters.player.current.defense,6500);
 assert.equal(b.fighters.enemy.current.defense,3500);
});
test('Raum steals 50% of current enemy HP',()=>{
 const b=run('raum');
 assert.equal(b.fighters.player.current.hp,300000);
 assert.equal(b.fighters.enemy.current.hp,100000);
});
test('Agares steals 50% defense',()=>{
 const b=run('agares');
 assert.equal(b.fighters.player.current.defense,7500);
 assert.equal(b.fighters.enemy.current.defense,2500);
});
test('Banshee steals 70% defense',()=>{
 const b=run('banshee');
 assert.equal(b.fighters.player.current.defense,8500);
 assert.equal(b.fighters.enemy.current.defense,1500);
});
test('Dory J transfers 20% of all current stats',()=>{
 const b=run('dory_j');
 assert.equal(b.fighters.player.current.defense,6000);
 assert.equal(b.fighters.enemy.current.defense,4000);
 assert.equal(b.fighters.player.current.magic,1200);
 assert.equal(b.fighters.player.current.hp,240000);
 assert.equal(b.fighters.enemy.current.hp,160000);
});
test('Andrealphus subtracts 40% own defense from three enemy stats',()=>{
 const b=run('andrealphus');
 assert.equal(b.fighters.enemy.current.attack,-2000);
 assert.equal(b.fighters.enemy.current.defense,3000);
 assert.equal(b.fighters.enemy.current.magic,-1000);
});
test('Seere sets attack to 1.5x highest stat (including HP)',()=>{
 const b=run('seere');
 assert.equal(b.fighters.player.current.attack,300000);
});
test('Ostal priestess gains 40% initial HP and 40% current defense',()=>{
 const b=run('ostal_priestess');
 assert.equal(b.fighters.player.current.hp,280000);
 assert.equal(b.fighters.player.current.defense,7000);
});
test('Storm Murmur sets enemy attack and defense to half initial',()=>{
 const b=run('storm_murmur',{enemy:{attack:2000}});
 assert.equal(b.fighters.enemy.current.attack,1000);
 assert.equal(b.fighters.enemy.current.defense,2500);
});
test('Thunder Skaah cuts enemy attack and magic by 80%',()=>{
 const b=run('thunder_skaah',{enemy:{attack:1000}});
 assert.equal(b.fighters.enemy.current.attack,200);
 assert.equal(b.fighters.enemy.current.magic,200);
});
test('Lilah Keplus doubles three stats at end and reduces own HP 80%',()=>{
 const b=run('lilah');
 assert.equal(b.fighters.player.current.defense,10000);
 assert.equal(b.fighters.player.current.magic,2000);
 assert.equal(b.fighters.player.current.hp,40000);
});
test('Evil Mandrake adds four pre-effect 25% values into own HP',()=>{
 const b=run('evil_mandrake');
 assert.equal(b.fighters.player.current.hp,251500);
 assert.equal(b.fighters.enemy.current.hp,150000);
 assert.equal(b.fighters.enemy.current.defense,3750);
 assert.equal(b.fighters.enemy.current.magic,750);
});
test('Future Andramelech adds four pre-effect 25% values into own defense',()=>{
 const b=run('future_andramelech');
 assert.equal(b.fighters.player.current.defense,56500);
 assert.equal(b.fighters.enemy.current.hp,150000);
 assert.equal(b.fighters.enemy.current.defense,3750);
});
console.log(passed+' / 17 tests passed');
if(process.exitCode)process.exit(process.exitCode);
