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
check('004.8部分モデル249体、既存記述モデル97件（重複なし）',()=>{
 assert.equal(partial.length,249);
 assert.equal(new Set(partial.map(x=>x.name)).size,249);
 assert.equal(E.SOURCE_RULES.length,346);
});
check('アラストルが主効果の部分モデルとして登録された',()=>{
 assert.ok(E.D.catalog_94?.model,'#94');
 assert.equal(E.D.catalog_94.tier,'description-partial');
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
check('◎死と再生：当ターンの敵デビルを奪い自身で発動',()=>{
 const p=blank(),e=blank();p[1]='catalog_83';e[1]='marbas';
 const b=E.createBattle(config(p,e));E.round(b);E.round(b);
 assert.equal(b.tables.enemy[1],null);
 assert.ok(b.turns[1].fired.player.includes('marbas'));
});
check('◎誕生と消滅：予約した次ターンの敵デビルを奪って発動',()=>{
 const p=blank(),e=blank();p[0]='catalog_215';e[1]='marbas';
 const b=E.createBattle(config(p,e));E.round(b);E.round(b);
 assert.equal(b.tables.enemy[1],null);
 assert.ok(b.turns[1].fired.player.includes('marbas'));
});
check('フェンリル：図鑑に記載された1～3匹の追撃では計算を継続',()=>{
 const p=blank(),e=blank();p[0]='catalog_309';
 const b=E.createBattle(config(p,e,{randomSeed:1}));E.round(b);
 assert.equal(b.error,null);assert.ok(b.turns[0].events.some(x=>x.text.includes('獣1匹')));
});
check('フェンリル：10匹の未知倍率を仮定せず計算停止',()=>{
 const p=blank(),e=blank();p[0]='catalog_309';
 const b=E.createBattle(config(p,e,{randomSeed:15872}));E.round(b);
 assert.ok(b.error&&b.error.includes('10匹'));
 assert.equal(b.outcome,'undetermined');
});
// 2026-11-14 なーなとの実戦ログ：敵1920ダメージ→被弾側アラストル+9600。
function alastorBattle(orders){
 const playerDeck=blank(),enemyDeck=blank();playerDeck[0]='catalog_94';
 return E.createBattle({
  mode:'full',damageMode:'observed',randomSeed:1,orders,
  player:{name:'シロコ',base:{attack:4171,defense:3050,hp:19887,magic:28634}},
  enemy:{name:'なーな',base:{attack:6275,defense:6730,hp:17823,magic:5960}},
  playerDeck,enemyDeck,
  observedHits:[
   {attacker:'enemy',attack:6275,defense:3050,damage:1920},
   {attacker:'player',attack:4171,defense:6730,damage:841},
   {attacker:'player',attack:13771,defense:6730,damage:2775}
  ]
 });
}
check('アラストル：受けた通常攻撃1920×5=9600が被弾直後に増える',()=>{
 const b=alastorBattle(Array(6).fill('enemy'));E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.fighters.player.current.attack,13771);
 assert.ok(b.turns[0].events.some(x=>x.type==='effect'&&x.text.includes('攻撃力+9,600')));
 assert.ok(b.turns[0].events.some(x=>x.type==='attack'&&x.text.includes('2,775')));
});
check('アラストル：発動できるのは当ターン、攻撃力9600加算は3Tまで持続',()=>{
 const b=alastorBattle(Array(6).fill('enemy'));E.round(b);E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.fighters.player.current.attack,13771);
 assert.equal(b.turns[1].events.filter(x=>x.type==='effect'&&x.text.includes('アラストル：')).length,0);
 assert.equal(b.turns[2].events.filter(x=>x.type==='effect'&&x.text.includes('アラストル：')).length,0);
});
check('アラストル：自身が先攻なら被弾前の通常攻撃には上昇が間に合わない',()=>{
 const b=alastorBattle(Array(6).fill('player'));E.round(b);
 assert.equal(b.error,null);
 const hits=b.turns[0].events.filter(x=>x.type==='attack');
 assert.ok(hits[0].text.includes('841'));
 assert.ok(hits[1].text.includes('1,920'));
 assert.equal(b.fighters.player.current.attack,13771);
 E.round(b);
 assert.ok(b.turns[1].events.some(x=>x.type==='attack'&&x.text.includes('2,775')));
});
// 2026-11-14 マリコのシュレディンガー実戦ログで確かめた3分岐。
check('シュレディンガー②：ネコなしで最低守備3050→6100',()=>{
 const p=blank();p[1]='catalog_131';
 const b=E.createBattle(config(p,blank(),{player:{base:{attack:4171,defense:3050,hp:19887,magic:28634}},enemy:{base:{attack:8180,defense:7974,hp:11200,magic:7980}}}));
 E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.fighters.player.current.defense,6100);
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー②')));
});
check('シュレディンガー①：先のターンに実体化済みのケット・シーも消滅させ、最高魔力28634→13410',()=>{
 const p=blank(),e=blank();p[1]='catalog_131';e[0]='catalog_123';
 const b=E.createBattle(config(p,e,{player:{base:{attack:4171,defense:3050,hp:100000,magic:28634}},enemy:{base:{attack:13410,defense:13410,hp:17654,magic:13130}}}));
 E.round(b);assert.equal(b.error,null);
 b.fighters.enemy.current.magic=28634;b.fighters.enemy.current.hp=16817;
 E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.fighters.enemy.current.magic,13410);
 assert.equal(b.tables.enemy[0],null);
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー①')));
});
check('シュレディンガー③：自分にシロネコがいたら自分の最高魔力28634→最低守備3050、シロネコ消滅',()=>{
 const p=blank();p[0]='catalog_70';p[1]='catalog_131';
 const b=E.createBattle(config(p,blank(),{player:{base:{attack:4171,defense:3050,hp:19887,magic:28634}},enemy:{base:{attack:8180,defense:7974,hp:11200,magic:7980}}}));
 E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.fighters.player.current.magic,3050);
 assert.equal(b.tables.player[0],null);
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー③')));
});
check('シュレディンガー：相手猫札消滅後、死と再生で奪って再発動すると猫なし②に変わる',()=>{
 const p=blank(),e=blank();p[0]='catalog_70';p[1]='catalog_83';e[1]='catalog_131';
 const b=E.createBattle(config(p,e,{orders:Array(6).fill('enemy'),player:{base:{attack:4171,defense:3050,hp:19887,magic:28634}},enemy:{base:{attack:620,defense:4730,hp:10247,magic:5960}}}));
 E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.tables.player[0],null);
 assert.equal(b.tables.enemy[1],null);
 assert.equal(b.fighters.player.current.magic,3050);
 assert.equal(b.fighters.player.current.defense,6100);
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー①')));
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー②')));
});
check('シュレディンガー③：死と再生で2T奪取しても5T未発動クロネコを検出・消滅させる',()=>{
 const p=blank(),e=blank();p[1]='catalog_83';p[4]='catalog_69';e[1]='catalog_131';
 const b=E.createBattle(config(p,e,{
  orders:Array(6).fill('player'),
  player:{base:{attack:4171,defense:3050,hp:19887,magic:28634}},
  enemy:{base:{attack:620,defense:4730,hp:10247,magic:5960}}
 }));
 E.round(b);
 assert.equal(b.tables.player[4],'catalog_69','2T前の未来5T枠にはクロネコが残る');
 E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.tables.player[4],null,'2Tの奪取されたシュレディンガーで5Tクロネコが消滅する');
 assert.equal(b.tables.enemy[1],null,'相手シュレディンガーは奪取済み');
 assert.equal(b.fighters.player.current.magic,3050,'自分の最高魔力が最低守備3050へ変わる');
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー③')));
 assert.ok(b.turns[1].fired.player.includes('catalog_131'),'奪ったシュレディンガーを2Tに発動');
});

/* 2026-11-14 マリコの実機ネコ判定：名称からの推測ではなく明示的な分類。 */
const confirmedCats=[['シロネコ','catalog_70'],['クロネコ','catalog_69'],['チェシャ猫','catalog_111'],['ケット・シー','catalog_123'],['マニ・エリ','catalog_214'],['バステト','catalog_230']];
const confirmedNonCats=[['フレイヤ','freya'],['ゴリラを連れたケット・シー','catalog_289'],['握手を求めるチェシャ猫','catalog_379']];
function catClassBattle(enemy5,own5=null,enemy4=null){
 const p=blank(),e=blank();
 p[1]='catalog_131';p[4]=own5;e[3]=enemy4;e[4]=enemy5;
 return E.createBattle(config(p,e,{
  player:{base:{attack:4171,defense:3050,hp:19887,magic:28634}},
  enemy:{base:{attack:2000,defense:4700,hp:40000,magic:50000}}
 }));
}
for(const [name,key] of confirmedCats)check('シュレディンガー・ネコ判定：'+name+'は5T未発動でも①の対象',()=>{
 const b=catClassBattle(key);E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.tables.enemy[4],null,name+'はシュレディンガーで消滅');
 assert.equal(b.fighters.enemy.current.magic,2000,'最高魔力50000→最低攻撃2000');
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー①')));
});
for(const [name,key] of confirmedNonCats)check('シュレディンガー・非ネコ判定：'+name+'は消滅せず②になる',()=>{
 const b=catClassBattle(key);E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.tables.enemy[4],key,'非ネコ '+name+' を消滅させない');
 assert.equal(b.fighters.player.current.defense,6100,'ネコなし②で自身最低守備を倍化');
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー②')));
});
for(const [name,key] of confirmedCats.filter(x=>['マニ・エリ','バステト'].includes(x[0])))check('シュレディンガー③：自分の5T'+name+'をネコとして検出',()=>{
 const b=catClassBattle(null,key);E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.tables.player[4],null,'自分の猫デビル消滅');
 assert.equal(b.fighters.player.current.magic,3050,'最高魔力→最低守備');
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー③')));
});
check('シュレディンガー：ネコと名前だけ猫の派生が共存すると確定猫だけ消滅',()=>{
 const b=catClassBattle('catalog_289',null,'catalog_214');E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.tables.enemy[3],null,'マニ・エリは消滅');
 assert.equal(b.tables.enemy[4],'catalog_289','ゴリラを連れたケット・シーは残る');
 assert.ok(b.turns[1].events.some(x=>x.type==='effect'&&x.text.includes('シュレディンガー①')));
});

console.log('004.8 suite:',tests,'defined assertions passed (other versions have separate suites)');
