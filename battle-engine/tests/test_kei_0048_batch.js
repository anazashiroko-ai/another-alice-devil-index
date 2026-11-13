const assert=require('node:assert/strict');
const E=require('../src/kei_unified_engine_v0_4_8.js');
const blank=()=>Array(6).fill(null);
const external={initiator:'player',
 player:{rank:6665,wikkaRank:6665,startHour:8,assistCount:50,assistTotal:1000,assistAttack:400,level:20,gender:'female',gold:1000,wins:100,harmonics:300,preferredAssistStat:'defense',dollLatest:false,maxFloor:30,assist_attack:30,assist_defense:50,assist_hp:60,assist_magic:70},
 enemy:{rank:250,wikkaRank:250,startHour:9,assistCount:45,assistTotal:900,assistAttack:300,level:10,gender:'male',gold:900,wins:50,harmonics:200,preferredAssistStat:'attack',dollLatest:true,maxFloor:20,assist_attack:20,assist_defense:30,assist_hp:50,assist_magic:25}};
function config(playerDeck=blank(),enemyDeck=blank(),extra={}){
 return {mode:'full',damageMode:'estimate',randomSeed:12345,orders:Array(6).fill('player'),external,
 player:{base:{attack:1000,defense:5000,hp:1e10,magic:1000}},
 enemy:{base:{attack:1100,defense:4700,hp:1e10-1000,magic:1100}},
 playerDeck,enemyDeck,...extra};
}
function battle(key,turn=1,enemyFirst='vasago'){
 const p=blank(),e=blank();if(turn>1)p[0]='marbas';p[turn-1]=key;e[0]=enemyFirst;
 const b=E.createBattle(config(p,e));
 for(let i=0;i<turn;i++){if(b.complete)break;E.round(b);}
 return b;
}
let tests=0;
function check(name,fn){fn();tests++;console.log('PASS',name);}
const partial=E.SOURCE_RULES.filter(x=>x.coverage==='partial');
check('004.8部分モデル244体、既存記述モデル97件（重複なし）',()=>{
 assert.equal(partial.length,244);
 assert.equal(new Set(partial.map(x=>x.name)).size,244);
 assert.equal(E.SOURCE_RULES.length,341);
});
check('未対応の3候補はモデル計上しない',()=>{
 for(const id of [94,215,309])assert.ok(!E.D['catalog_'+id]?.model,'#'+id);
});
for(const r of partial)check('004.8 '+r.id+' '+r.name,()=>{
 const b=battle(r.key,r.minTurn||1);
 assert.equal(b.error,null,r.name+' '+b.error);
 assert.ok(b.events.some(e=>e.type==='devil'&&e.key===r.key),r.name+' activation missing');
 assert.ok(b.warnings.some(x=>x.includes('主効果のみの部分モデル')),r.name+' incomplete-label missing');
});
check('グシオン：攻撃4倍・敵守備40%減を当ターン解除、回避だけ適用',()=>{
 const p=blank(),e=blank();p[0]='catalog_7';e[0]='vasago';
 const b=E.createBattle(config(p,e));
 const atk=b.fighters.player.current.attack,def=b.fighters.enemy.current.defense;
 E.round(b);
 assert.equal(b.fighters.player.current.attack,atk);
 assert.equal(b.fighters.enemy.current.defense,def);
 assert.ok(b.turns[0].events.some(x=>x.text.includes('回避した')));
});
check('ベレト／ソフィア：自分以外の当ターン守備変更を解除',()=>{
 for(const id of [9,334]){
  const p=blank(),e=blank();p[0]='catalog_'+id;e[0]='vasago';const b=E.createBattle(config(p,e)),v=b.fighters.enemy.current.defense;
  E.round(b);assert.equal(b.fighters.enemy.current.defense,v);
 }
});
check('ロル・ナイトメア：マイナス参照を符号反転し敵デバフがバフになる',()=>{
 const p=blank(),e=blank();p[1]='catalog_161';e[0]='vasago';
 const b=E.createBattle(config(p,e));E.round(b);
 const targetBefore=b.fighters.enemy.current.attack;
 b.fighters.player.current.attack=-1000;b.fighters.player.current.defense=-2000;b.fighters.player.current.magic=-3000;
 E.round(b);
 assert.equal(b.fighters.enemy.current.attack,targetBefore+1000);
});
check('ネメシス：6665位=1ダメージ、6666位以上=0ダメージ（順位番号）',()=>{
 const p=blank(),e=blank();p[0]='marbas';p[2]='catalog_258';e[0]='vasago';
 const a=E.createBattle(config(p,e));E.round(a);E.round(a);const before=a.fighters.enemy.current.hp;E.round(a);const after=a.fighters.enemy.current.hp;
 const q=JSON.parse(JSON.stringify(config(p,e)));q.external=structuredClone(external);q.external.player.rank=6667;
 const b=E.createBattle(q);E.round(b);E.round(b);E.round(b);
 assert.equal(before-after-(before-b.fighters.enemy.current.hp),1);
});
check('ジェントルマン：123456→456123、後半3札を削除しない',()=>{
 const p=blank(),e=['vasago','marbas','sitri','amon','paimon','shax'];p[0]='catalog_316';
 const b=E.createBattle(config(p,e));E.round(b);
 assert.deepEqual(b.tables.enemy,['amon','paimon','shax','vasago','marbas','sitri']);
});
check('ブエル：攻撃前と攻撃後の２段階で発動する',()=>{
 const p=blank(),e=blank();p[0]='catalog_6';e[0]='vasago';const b=E.createBattle(config(p,e));b.fighters.player.current.hp=100000;E.round(b);
 assert.equal(b.turns[0].fired.player.filter(k=>k==='catalog_6').length,2);
 assert.ok(b.fighters.enemy.current.hp<8e9,'自HP30%分が追加ダメージになっていない');
});
check('ルナ・スピアーナ：通常攻撃停止と終了時追撃',()=>{
 const p=blank();p[0]='catalog_294';const b=E.createBattle(config(p,blank()));E.round(b);
 assert.ok(b.turns[0].events.some(x=>x.text.includes('終了時追撃')));
 assert.equal(b.turns[0].fired.player.filter(k=>k==='catalog_294').length,2);
});
check('アロケル：開始・攻撃前・攻撃後の三段処理',()=>{
 const p=blank(),e=blank();p[0]='catalog_48';e[0]='sitri';const b=E.createBattle(config(p,e));const hp=b.fighters.enemy.current.hp;E.round(b);
 assert.equal(b.turns[0].fired.player.filter(k=>k==='catalog_48').length,3);
 assert.ok(b.fighters.enemy.current.hp<=hp-330);
});
check('ジャックフロスト：火属性相手に70%の追ダメージ',()=>{
 const p=blank(),e=blank();p[0]='catalog_151';e[0]='sitri';const b=E.createBattle(config(p,e));E.round(b);
 assert.ok(b.fighters.enemy.current.hp<5e9);
});
check('ドリドルム：相手攻撃を1残して自攻撃を当ターンのみ加算',()=>{
 const p=blank(),e=blank();p[0]='catalog_157';const b=E.createBattle(config(p,e));
 const before=b.fighters.player.current.attack;E.round(b);
 assert.equal(b.fighters.enemy.current.attack,1);
 assert.equal(b.fighters.player.current.attack,before);
});
check('ネモフィラ：次ターンの両札交換と当ターンの戦闘停止',()=>{
 const p=blank(),e=blank();p[0]='catalog_221';p[1]='marbas';e[1]='vasago';
 const b=E.createBattle(config(p,e));E.round(b);
 assert.equal(b.tables.player[1],'vasago');assert.equal(b.tables.enemy[1],'marbas');
 assert.ok(b.turns[0].endTurn);
});
check('マクスウェル：現在ターン以外の全スロットを交換',()=>{
 const p=blank(),e=blank();p[2]='catalog_306';p[3]='marbas';e[3]='vasago';
 const b=E.createBattle(config(p,e));E.round(b);E.round(b);E.round(b);
 assert.equal(b.tables.player[3],'vasago');assert.equal(b.tables.enemy[3],'marbas');
 assert.equal(b.tables.player[2],'catalog_306');
});
check('スプリガン：即死に至らないダメージは回復し守備を増加',()=>{
 const p=blank(),e=blank();p[0]='catalog_190';
 const a={attack:0,defense:4000,hp:1e9,magic:500},z={attack:100000,defense:4700,hp:1e10,magic:1100};
 const b=E.createBattle(config(p,e,{player:{base:a},enemy:{base:z}}));
 const oldHP=b.fighters.player.current.hp;E.round(b);
 assert.ok(!b.error);
 assert.equal(b.fighters.player.current.hp,oldHP);
 assert.ok(b.fighters.player.current.defense>4000);
});
console.log('004.8 suite:',tests,'defined assertions passed (other versions have separate suites)');
