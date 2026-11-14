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
check('004.8部分モデル252体、既存記述モデル97件（重複なし）',()=>{
 assert.equal(partial.length,252);
 assert.equal(new Set(partial.map(x=>x.name)).size,252);
 assert.equal(E.SOURCE_RULES.length,349);
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


// 2026-11-14 モーラとヘル。原作ログで確認できた時間移動だけを検査する。
check('モーラ：2Tの双方の攻撃が済んだあと消化3Tへ、次に実行するのは4T',()=>{
 const p=blank(),e=blank();p[1]='catalog_295';p[3]='marbas';e[2]='eligos';
 const b=E.createBattle(config(p,e,{player:{base:{attack:1000,defense:5000,hp:1e10,magic:1000}},enemy:{base:{attack:1100,defense:4700,hp:1e10,magic:1100}}}));
 E.round(b);const firstHP=b.fighters.enemy.current.hp;
 E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.turn,3,'2Tが終了し消化ターン数が3に変化');
 assert.equal(b.turns[1].turn,2,'モーラ自身の発動は2T終了時');
 assert.equal(b.tables.player[1],null,'モーラの札は消滅');
 assert.ok(b.fighters.enemy.current.hp<firstHP,'2Tの通常攻撃が行われる');
 assert.ok(b.turns[1].events.some(x=>x.text.includes('モーラ：2Tの終了時')));
 E.round(b);
 assert.equal(b.turns[2].turn,4,'3Tは実行されない');
 assert.ok(b.turns[2].fired.player.includes('marbas'),'4Tのデビルが通常発動');
 assert.ok(!b.events.some(x=>x.type==='devil'&&x.key==='eligos'),'3Tの敵デビルは発動しない');
});
check('モーラ：双方のモーラ札を完全消滅させ、重複飛ばしをしない',()=>{
 const p=blank(),e=blank();p[1]='catalog_295';e[4]='catalog_295';
 const b=E.createBattle(config(p,e));E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.turn,3);
 assert.equal(b.tables.player[1],null);
 assert.equal(b.tables.enemy[4],null);
});
check('ヘル：4T開始で1Tへ戻り現在体力を保持、双方ヘルを消す',()=>{
 const p=blank(),e=blank();p[0]='marbas';p[3]='catalog_285';e[0]='sitri';e[5]='catalog_285';
 const b=E.createBattle(config(p,e));
 for(let i=0;i<3;i++)E.round(b);
 const hpBefore=b.fighters.player.current.hp;
 const fourth=E.round(b);
 assert.equal(b.error,null);
 assert.equal(b.turn,1);
 assert.equal(fourth.turn,1);
 assert.equal(b.tables.player[3],null);
 assert.equal(b.tables.enemy[5],null);
 assert.ok(b.fighters.player.current.hp<hpBefore,'再訪1Tの被弾は巻戻し前体力から引く');
 assert.ok(fourth.fired.player.includes('catalog_285'),'ヘルは4Tに実体化');
 assert.ok(!fourth.fired.player.includes('marbas'),'再訪1Tの開始時デビルは再発動しない');
 assert.ok(!fourth.fired.enemy.includes('sitri'),'相手の1T開始時デビルも再発動しない');
});
check('ヘル：再訪2Tと3Tは発動済みのエリゴスとマルバスを新たに発動',()=>{
 const p=blank(),e=blank();p[1]='marbas';p[3]='catalog_285';e[1]='eligos';e[2]='marbas';e[0]='sitri';
 const b=E.createBattle(config(p,e));
 for(let i=0;i<4;i++)E.round(b);
 assert.deepEqual(b.turns.map(x=>x.turn),[1,2,3,1]);
 const afterRewindAtk=b.fighters.enemy.current.attack;
 E.round(b);
 assert.equal(b.turns[4].turn,2);
 assert.ok(b.turns[4].fired.enemy.includes('eligos'));
 assert.ok(b.fighters.enemy.current.attack>afterRewindAtk,'元の攻撃値から再実体化分を加算');
 E.round(b);
 assert.equal(b.turns[5].turn,3);
 assert.ok(b.turns[5].fired.enemy.includes('marbas'));
});


function vdConfig(enemy,enemyCount,devil){
 const p=Array(6).fill(null),e=Array(6).fill(null);p[0]='catalog_319';e[0]=devil||null;
 return config(p,e,{orders:Array(6).fill(devil?'enemy':'player'),
  external:{initiator:'player',player:{assistCount:17},enemy:{assistCount:enemyCount}},
  player:{name:'シロコ',base:{attack:1001,defense:1050,hp:11200,magic:10200},
   assist:{attack:20,hp:270,magic:334},equipment:{attack:3150,defense:2000,hp:8417,magic:18100}},
  enemy});
}
check('ヴィドフニル：なーな1人→99%減と自17%（自己人数未確認）、サルガタナス模倣は元装備参照を変えない',()=>{
 const b=E.createBattle(vdConfig({name:'なーな',base:{attack:500,defense:580,hp:2330,magic:50},
  assist:{hp:17},equipment:{attack:120,defense:4150,hp:7900,magic:5910}},1,'sargatanas'));
 E.round(b);assert.equal(b.error,null);
 const v=b.events.find(x=>x.type==='effect'&&x.key==='catalog_319');assert.ok(v);
 assert.deepEqual(v.enemyEquipmentLoss,{attack:118,defense:4108,hp:7821,magic:5850});
 assert.deepEqual(v.selfEquipmentGain,{attack:535,defense:340,hp:1430,magic:3077});
 assert.equal(b.fighters.enemy.current.attack,3652);
 assert.equal(b.fighters.enemy.current.defense,2622);
 assert.equal(b.fighters.enemy.current.magic,18210);
 assert.equal(b.fighters.player.current.attack,4706);
 assert.equal(b.fighters.player.current.defense,3390);
 assert.equal(b.fighters.player.current.magic,31711);
});
check('ヴィドフニル：トモキ6人→94%減を元装備1500/3000/3200/16300へ適用',()=>{
 const b=E.createBattle(vdConfig({name:'トモキ・クラウン',base:{attack:100,defense:100,hp:14915,magic:100},
  assist:{hp:83},equipment:{attack:1500,defense:3000,hp:3200,magic:16300}},6));
 E.round(b);assert.equal(b.error,null);
 const v=b.events.find(x=>x.type==='effect'&&x.key==='catalog_319');assert.ok(v);
 assert.deepEqual(v.enemyEquipmentLoss,{attack:1410,defense:2820,hp:3008,magic:15322});
 assert.deepEqual(v.selfEquipmentGain,{attack:535,defense:340,hp:1430,magic:3077});
 assert.equal(b.fighters.enemy.current.attack,190);
 assert.equal(b.fighters.enemy.current.defense,280);
 assert.equal(b.fighters.enemy.current.magic,1078);
});
check('ヴィドフニル：アシスト人数未入力は値を捏造せず停止',()=>{
 const c=vdConfig({base:{attack:100,defense:100,hp:100000,magic:100},equipment:{attack:1000}},6);
 delete c.external.player.assistCount;
 const b=E.createBattle(c);E.round(b);
 assert.ok(b.error?.includes('外部入力が必要：player.assistCount'));
 assert.equal(b.outcome,'undetermined');
});

check('ヨハン系：編成候補は残すが能力未実装で安全停止する',()=>{
 for(const id of [347,354]){
  const key='catalog_'+id,p=blank();p[0]=key;
  assert.equal(E.D[key]?.model,false);
  assert.equal(E.D[key].phase,'start');
  const b=E.createBattle(config(p,blank()));E.round(b);
  assert.equal(b.outcome,'undetermined');
  assert.ok(b.error?.includes('能力未実装'));
  assert.ok(b.events.some(e=>e.type==='devil'&&e.key===key));
 }
});
check('白き守護者：追跡モードは攻撃禁止を実行しない',()=>{
 const p=blank();p[0]='catalog_354';
 const b=E.createBattle(config(p,blank(),{mode:'trace'}));
 E.round(b);E.round(b);
 assert.equal(b.error,null);
 assert.ok(b.events.some(e=>e.type==='caveat'&&e.text.includes('未計算')));
 assert.equal(b.turns[1].events.filter(e=>e.type==='attack'&&e.text.includes('通常攻撃枠')).length,2);
});


check('入れ子条件ルール：イボスの守備力条件が成立したら敵次ターンのデビルを阻止',()=>{
 const p=blank(),e=blank();p[0]='catalog_73';e[1]='marbas';
 const b=E.createBattle(config(p,e,{player:{base:{attack:100,defense:10000,hp:100000,magic:100}},
  enemy:{base:{attack:100,defense:1000,hp:100000,magic:100}}}));
 E.round(b);assert.equal(b.error,null);
 assert.ok(b.blockedDevils.enemy.has(2));
 E.round(b);assert.equal(b.error,null);
 assert.ok(!b.turns[1].fired.enemy.includes('marbas'));
});

check('2026-11-14新ログ：パイモン後のベルフェゴールは更新後魔力11307の40%=4522を守備に加算',()=>{
 const p=blank(),e=blank();p[0]='paimon';e[0]='belphegor';
 const b=E.createBattle(config(p,e,{orders:Array(6).fill('player'),
  player:{base:{attack:4171,defense:3050,hp:19887,magic:28634}},
  enemy:{base:{attack:10739,defense:12312,hp:11307,magic:1046}}}));
 E.round(b);assert.equal(b.error,null);
 assert.equal(b.fighters.enemy.current.magic,11307);
 assert.equal(b.fighters.enemy.current.defense,16834);
});
check('2026-11-14新ログ：終わりなき夜ロキの敵半減奪取は各能力で整数切捨て',()=>{
 const p=blank(),e=blank();p[0]='paimon';e[0]='catalog_346';
 const b=E.createBattle(config(p,e,{orders:Array(6).fill('player'),
  player:{base:{attack:4171,defense:3050,hp:19887,magic:28634}},
  enemy:{base:{attack:10570,defense:5960,hp:7233,magic:7361}}}));
 E.round(b);assert.equal(b.error,null);
 assert.equal(E.D.catalog_346.attr,'闇','Nodeとブラウザで同じ属性メタを読む');
 assert.equal(b.fighters.player.current.attack,2086);
 assert.equal(b.fighters.player.current.defense,1525);
 assert.equal(b.fighters.player.current.magic,14317);
 assert.equal(b.fighters.enemy.current.attack,12655);
 assert.equal(b.fighters.enemy.current.defense,7485);
 assert.equal(b.fighters.enemy.current.magic,21550);
});
check('2026-11-14新ログ：レディ・アルミラージは13912の99%で13772を引き140残す',()=>{
 const p=blank();p[0]='catalog_372';
 const b=E.createBattle(config(p,blank(),{player:{base:{attack:1,defense:10000,hp:13912,magic:100}},
  enemy:{base:{attack:0,defense:10000,hp:100000,magic:100}}}));
 E.round(b);assert.equal(b.error,null);
 assert.equal(b.fighters.player.current.hp,140);
});
check('2026-11-14新ログ：ルシファーは初期魔力15950との差1684を復旧し相手魔力5052減',()=>{
 const p=blank(),e=blank();p[2]='marbas';e[2]='lucifer';
 const b=E.createBattle(config(p,e,{orders:Array(6).fill('enemy'),
  player:{base:{attack:4171,defense:3050,hp:10000000,magic:28634}},
  enemy:{base:{attack:5010,defense:6000,hp:10000000,magic:15950}}}));
 E.round(b);E.round(b);
 b.fighters.enemy.current.magic=14266;
 E.round(b);assert.equal(b.error,null);
 assert.equal(b.fighters.enemy.current.magic,15950);
 assert.equal(b.fighters.player.current.magic,23582);
 assert.equal(b.tables.player[2],null);
});
check('2026-11-14新ログ：装備無効化の後なら初期魔力装備18100でもオドラデクが有効',()=>{
 const p=blank(),e=blank();e[1]='red_folter';e[2]='odradek';
 const b=E.createBattle(config(p,e,{orders:Array(6).fill('enemy'),
  player:{base:{attack:1021,defense:1050,hp:10000000,magic:10534},equipment:{attack:3150,defense:2000,hp:8417,magic:18100}},
  enemy:{base:{attack:100,defense:10000,hp:10000000,magic:1000}}}));
 E.round(b);E.round(b);assert.equal(b.error,null);
 assert.equal(b.fighters.player.activeEquipment.magic,0);
 E.round(b);assert.equal(b.error,null);
 assert.equal(b.fighters.player.current.attack,1);
 assert.equal(b.fighters.player.current.defense,1);
});


check('実戦4本・イボス：敵の通常攻撃を封じても開始時ナルキッソスは発動し、次Tフレイヤは阻止',()=>{
 const p=blank(),e=blank();p[0]='rabbit';p[1]='freya';e[0]='catalog_73';
 const b=E.createBattle(config(p,e,{orders:Array(6).fill('enemy'),
 player:{base:{attack:1001,defense:1050,hp:11200,magic:10200},assist:{attack:20,hp:270,magic:334},equipment:{attack:3915,defense:1350,hp:12217,magic:12900}},
 enemy:{base:{attack:5560,defense:34486,hp:5246,magic:100}}}));
 E.round(b);assert.equal(b.error,null);
 assert.ok(b.turns[0].fired.player.includes('rabbit'));
 assert.ok(b.blockedDevils.player.has(2));
 assert.ok(!b.turns[0].events.some(x=>x.type==='attack'&&x.text.startsWith('シロコの攻撃')),'イボスでシロコの通常攻撃イベントはない');
 E.round(b);assert.equal(b.error,null);assert.ok(!b.turns[1].fired.player.includes('freya'));
});
check('実戦4本・ディアーナ：現在守備差29461を与え、装備無効化後のヴィネ再発動で12875',()=>{
 const p=blank(),e=blank();p[0]='rabbit';p[2]='red_folter';e[1]='diana';e[2]='vine';
 const b=E.createBattle(config(p,e,{orders:Array(6).fill('enemy'),
 player:{base:{attack:1001,defense:1050,hp:11200,magic:10200},assist:{attack:20,hp:270,magic:334},equipment:{attack:3915,defense:1350,hp:12217,magic:12900}},
 enemy:{base:{attack:100,defense:17900,hp:4000,magic:0},assist:{hp:46},equipment:{attack:5460,defense:16586,hp:1200}}}));
 E.round(b);E.round(b);E.round(b);assert.equal(b.error,null);
 const hits=b.events.filter(x=>x.type==='effect'&&x.text.includes('ディアーナ：守備力の差分'));
 assert.equal(hits.length,2);assert.ok(hits[0].text.includes('29,461'));assert.ok(hits[1].text.includes('12,875'));
});
check('実戦4本・ウァレフォル：通常攻撃で変化しないHP50445の攻撃後60%は30267',()=>{
 const e=blank();e[0]='catalog_4';
 const b=E.createBattle(config(blank(),e,{player:{base:{attack:0,defense:10000,hp:50445,magic:100}},
 enemy:{base:{attack:0,defense:10000,hp:1000000,magic:100}}}));
 E.round(b);assert.equal(b.error,null);assert.equal(b.fighters.player.current.hp,20178);
 assert.ok(b.turns[0].fired.enemy.includes('catalog_4'));
});
check('実戦4本・マニエリ：開始時の実体化だけで40%ダメージは与えず攻撃後フェーズ',()=>{
 const e=blank();e[0]='catalog_214';
 const b=E.createBattle(config(blank(),e,{player:{base:{attack:0,defense:10000,hp:50445,magic:100}},
 enemy:{base:{attack:0,defense:10000,hp:1000000,magic:100}}}));
 E.round(b);assert.equal(b.error,null);
 const i=b.events.map(x=>x.type==='attack'?x.text:x.type==='devil'?'DEVIL '+x.key:'').filter(Boolean);
 assert.equal(b.fighters.player.current.hp,30267,'図鑑説明に基づく攻撃後の40%（この分岐は原作数値未照合）');
 assert.ok(i.findIndex(x=>x.includes('DEVIL catalog_214'))<i.findIndex(x=>x.includes('攻撃')));
 assert.equal(b.turns[0].fired.enemy.filter(x=>x==='catalog_214').length,2);
});
check('実戦4本・ルシファー：フルカスによる守備3020低下を復旧し敵守備9060減',()=>{
 const p=blank(),e=blank();p[3]='marbas';e[3]='lucifer';
 const b=E.createBattle(config(p,e,{orders:Array(6).fill('enemy'),
 player:{base:{attack:4936,defense:2400,hp:10000000,magic:23434}},
 enemy:{base:{attack:900,defense:10068,hp:10000000,magic:19010}}}));
 E.round(b);E.round(b);E.round(b);b.fighters.enemy.current.defense=7048;
 E.round(b);
 assert.ok(b.error?.includes('守備力が負のとき'),'負守備への通常攻撃は原作公式未確定として安全停止する');
 assert.equal(b.fighters.enemy.current.defense,10068);
 assert.equal(b.fighters.player.current.defense,-6660);
 assert.equal(b.tables.player[3],null);
});

console.log('004.8 suite:',tests,'defined assertions passed (other versions have separate suites)');
