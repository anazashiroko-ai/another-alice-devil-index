const assert=require('node:assert/strict');
const E=require('../src/kei_unified_engine_v0_4_5.js');
let passed=0;
function check(name,fn){try{fn();passed++;console.log('PASS',name)}catch(err){console.error('FAIL',name,err.stack);process.exitCode=1;}}
const empty=Array(6).fill(null);
const base=(atk=20,def=1000,hp=100000,magic=100)=>({attack:atk,defense:def,hp,magic});
const make=(a={},b={})=>E.createBattle({title:'unit',mode:'full',damageMode:'estimate',player:{base:base(),...a},enemy:{base:base(),...b},orders:['player','player','player','player','player','player'],playerDeck:empty,enemyDeck:empty});
const fixture=(pd,ed,overrides={})=>E.createBattle({mode:'full',damageMode:'estimate',player:{base:base()},enemy:{base:base()},orders:Array(6).fill('player'),playerDeck:pd,enemyDeck:ed,...overrides});
check('ショウ6T：実測値との最終体力完全一致',()=>{const b=E.createBattle(E.preset('sho'));E.playAll(b);assert.equal(b.outcome,'draw');assert.equal(b.fighters.player.current.hp,90916.5);assert.equal(b.fighters.enemy.current.hp,9516);});
check('ショウ：6ターン分のスナップショット',()=>{const b=E.createBattle(E.preset('sho'));E.playAll(b);assert.equal(b.turns.length,6);assert.equal(b.turns[1].endTurn,true);});
check('ナルキッソス：素の体力×2.5を加算',()=>{const b=E.createBattle(E.preset('sho'));E.round(b);assert.equal(b.turns[0].fighters.player.hp,92612.5);});
check('クロリッサ：後続の実体化と双方攻撃をスキップ',()=>{const b=fixture([null,'chlorissa',null,null,null,null],[null,'odradek',null,null,null,null]);E.round(b);const r=E.round(b);assert.deepEqual(r.fired.player,['chlorissa']);assert.deepEqual(r.fired.enemy,[]);assert.equal(r.events.some(x=>x.type==='attack'),false);});
check('クロリッサ：攻撃・守備・魔力をバトル開始値へ戻す',()=>{const c=E.preset('sho'),b=E.createBattle(c);E.round(b);E.round(b);assert.equal(b.fighters.player.current.attack,5806);assert.equal(b.fighters.player.current.magic,3354);assert.equal(b.fighters.player.current.defense,9823);});
check('グレモリー：魔力×2.5',()=>{const b=E.createBattle(E.preset('sho'));E.round(b);E.round(b);E.round(b);assert.equal(b.fighters.player.current.attack,8385);});
check('キジ③：モロク先行時の発動順',()=>{const b=E.createBattle(E.preset('kijiEnemy'));E.playAll(b);assert.deepEqual(b.turns.map(t=>t.fired.enemy),[[],['moloch'],['furcas'],['beleth'],['beleth'],['moloch']]);});
check('キジ③：ベルゼブブ先行時の発動順',()=>{const b=E.createBattle(E.preset('kijiPlayer'));E.playAll(b);assert.deepEqual(b.turns.map(t=>t.fired.enemy),[[],['tsuma_naberius'],['furcas'],['beleth'],['beleth'],['moloch']]);});
check('ベルゼブブ：現在の配置を逆順に変更',()=>{const b=fixture(['beelzebub',...empty.slice(1)],['freya','odradek','rabbit',null,null,null],{mode:'trace'});E.round(b);assert.deepEqual(b.tables.enemy.slice(0,3),[null,null,null]);assert.deepEqual(b.tables.enemy.slice(3),['rabbit','odradek','freya']);});
check('トロール：6Tのデビルは押出記録に入る',()=>{const b=fixture(['troll',...empty.slice(1)],[null,null,null,null,null,'freya'],{mode:'trace'});E.round(b);assert.equal(b.truncations[0].devil,'freya');assert.equal(b.tables.enemy[5],null);});
check('未実装デビル：完全戦闘モードで停止',()=>{const b=fixture(['other',...empty.slice(1)],empty);E.round(b);assert.equal(b.outcome,'undetermined');assert.ok(b.error.includes('未実装'));assert.equal(b.turns.length,1);});
check('未実装デビル：追跡モードでは警告表示・継続',()=>{const b=fixture(['other',...empty.slice(1)],empty,{mode:'trace'});E.round(b);assert.equal(b.complete,false);assert.ok(b.events.some(x=>x.type==='caveat'));});
check('フォルター夫妻：相手の装備を削り、HPが0以下なら即決着',()=>{const b=fixture(['red_folter',...empty.slice(1)],empty,{enemy:{base:base(20,1000,200,100),equipment:{attack:0,defense:0,hp:300,magic:0}}});b.fighters.enemy.current.hp=100;E.round(b);assert.equal(b.outcome,'winner:player');assert.equal(b.fighters.enemy.current.hp,-200);});
check('フレイヤ：敵現在攻撃力分の直接ダメージ',()=>{const b=fixture(['freya',...empty.slice(1)],empty);E.round(b);assert.equal(b.fighters.enemy.current.hp,99900);assert.equal(b.events.filter(x=>x.type==='attack'&&x.text.includes('シロコの攻撃')).length,0);});
check('オドラデク：魔力装備5000超で不発',()=>{const b=fixture(['odradek',...empty.slice(1)],empty,{enemy:{base:base(),equipment:{magic:5230}}});E.round(b);assert.equal(b.fighters.enemy.current.defense,1000);});
check('オドラデク：魔力装備5000以下なら攻守1',()=>{const b=fixture(['odradek',...empty.slice(1)],empty,{enemy:{base:base(),equipment:{magic:3000}}});E.round(b);assert.equal(b.fighters.enemy.current.defense,1);assert.equal(b.fighters.enemy.current.attack,1);});
check('遅延と反転が同じターンに逐次処理される',()=>{const b=fixture(['troll','beelzebub',null,null,null,null],['freya','odradek','rabbit','chlorissa',null,null],{mode:'trace'});E.round(b);E.round(b);assert.equal(b.tables.enemy[0],null);assert.equal(b.tables.enemy[5],null);});
check('能力を処理した後、体力0以下なら敵は行動できない',()=>{const b=fixture(['freya',...empty.slice(1)],[null,...empty.slice(1)],{enemy:{base:base(100,100,50,100)}});E.round(b);assert.equal(b.outcome,'winner:player');assert.equal(b.events.filter(x=>x.type==='attack').length,0);});
check('原始データを変更せず、戦闘用テーブルだけを変更する',()=>{const b=E.createBattle(E.preset('kijiPlayer'));E.round(b);assert.equal(b.original.enemy[0],'moloch');assert.equal(b.tables.enemy[0],null);});
check('混合プレビュー：表操作と数値戦闘を同じ処理器で実行',()=>{const b=E.createBattle(E.preset('mixed'));E.round(b);assert.ok(b.events.some(e=>e.text.includes('遅延')));assert.ok(b.events.some(e=>e.type==='attack'));});
check('カマエル→ヴィネ：二度加算して攻撃力13,665',()=>{const b=E.createBattle(E.preset('kamael'));E.round(b);E.round(b);assert.equal(b.fighters.player.current.attack,13665);assert.deepEqual(b.turns[1].fired.player,['vine','kamael']);});
check('カマエル：次ターンの相手デビルを妨害',()=>{const b=fixture(['kamael',null,null,null,null,null],[null,'freya',null,null,null,null],{player:{base:base(20,2000,100000,200)}});E.round(b);E.round(b);assert.deepEqual(b.turns[1].fired.enemy,[]);assert.ok(b.turns[1].events.some(x=>x.type==='block'&&x.text.includes('フレイヤ')));});
check('バラム：魔力40％を守備加算し次の敵デビルを阻止',()=>{const b=fixture(['balam',null,null,null,null,null],[null,'freya',null,null,null,null],{player:{base:base(20,1000,100000,1000)}});E.round(b);assert.equal(b.fighters.player.current.defense,1400);E.round(b);assert.deepEqual(b.turns[1].fired.enemy,[]);});
check('ヘクセンナハト：相手初期体力の30％で継続ダメージ',()=>{const b=fixture(['hexennacht',null,null,null,null,null],empty);E.round(b);assert.equal(b.sustained.length,1);assert.equal(b.sustained[0].damage,30000);assert.equal(b.turns[0].events.filter(x=>x.type==='sustain').length,1);E.round(b);assert.equal(b.turns[1].events.filter(x=>x.type==='sustain').length,1);});
check('クロリッサ中の継続効果：攻撃せずにヘクセンダメージは発動',()=>{const b=fixture(['hexennacht',null,'chlorissa',null,null,null],empty);E.round(b);E.round(b);const t=E.round(b);assert.equal(t.endTurn,true);assert.equal(t.events.some(e=>e.type==='attack'),false);assert.equal(t.events.filter(e=>e.type==='sustain').length,1);});
check('エリゴス：実測攻撃5,861→14,652',()=>{const b=fixture(['eligos',null,null,null,null,null],empty,{player:{base:base(5861,3000,100000,50)}});E.round(b);assert.equal(b.fighters.player.current.attack,14652);});
check('バアル：攻撃31→93、敵守備5010→3507',()=>{const b=fixture(['baal',null,null,null,null,null],empty,{player:{base:base(31,7000,100000,100)},enemy:{base:base(20,5010,100000,100)}});E.round(b);assert.equal(b.fighters.player.current.attack,93);assert.equal(b.fighters.enemy.current.defense,3507);});
check('スクルド：相手HP増分を守備に加算',()=>{const b=fixture(['skuld',null,null,null,null,null],empty,{enemy:{base:base(0,1000,100000,100)}});b.fighters.enemy.current.hp+=20000;E.round(b);assert.equal(b.fighters.player.current.defense,21000);});
check('スクルド：相手HP減少時に自分HP半減（奇数切上げ）',()=>{const b=fixture(['skuld',null,null,null,null,null],empty,{player:{base:base(20,1000,86839,100)},enemy:{base:base(0,1000,100000,100)}});b.fighters.enemy.current.hp-=100;E.round(b);assert.equal(b.fighters.player.current.hp,43420);});
check('従来の追跡モードと初期装備値の分離が維持',()=>{const b=E.createBattle(E.preset('kijiEnemy'));E.playAll(b);assert.equal(b.outcome,'trace_complete');assert.equal(b.fighters.enemy.initial.attack,32600);});
console.log(`${passed}/30 tests passed`);
// 004.2: custom textual devils are phase-aware placeholders, never fake numerical abilities.
check('004.3 自由入力デビル：追跡モードで攻撃後にのみ出現',()=>{
 const custom='custom:after:'+encodeURIComponent('自由入力・攻撃後試験');
 const b=fixture([custom,null,null,null,null,null],empty,{mode:'trace'});
 const t=E.round(b),evt=t.events,devIndex=evt.findIndex(e=>e.type==='devil'&&e.text.includes('自由入力・攻撃後試験'));
 assert.ok(devIndex>=0);assert.ok(evt.slice(0,devIndex).some(e=>e.type==='attack'));
 assert.equal(E.D[custom].phase,'after');assert.equal(E.D[custom].model,false);
});
check('004.3 自由入力デビル：完全戦闘は数値未実装で安全停止',()=>{
 const custom='custom:start:'+encodeURIComponent('自由入力・仮想');
 const b=fixture([custom,null,null,null,null,null],empty);
 E.round(b);assert.equal(b.outcome,'undetermined');assert.ok(b.error.includes('未実装'));
});
check('004.3 任意の未登録キーを安全に拒否',()=>{
 assert.throws(()=>fixture(['unknown-key',null,null,null,null,null],empty),/未登録/);
});
check('004.3 自由入力プリセットは六枠空欄',()=>{
 const p=E.preset('free');assert.deepEqual(p.playerDeck,empty);assert.deepEqual(p.enemyDeck,empty);
 assert.equal(p.mode,'trace');
});
console.log(`${passed} total tests passed`);

let newTests=0;
const deep=(x)=>JSON.stringify(x);
for(const rule of E.SOURCE_RULES){
 check('記述モデルの実行: '+rule.name,()=>{
  const deck=Array(6).fill(null);deck[rule.minTurn-1]=rule.key;
  const b=E.createBattle({title:'rule-sanity',mode:'full',damageMode:'estimate',
   player:{base:{attack:1200,defense:5200,hp:10000000,magic:3300},equipment:{attack:1000,defense:900,hp:1200,magic:800}},
   enemy:{base:{attack:2100,defense:7100,hp:10000000,magic:4400},equipment:{attack:1000,defense:900,hp:2000,magic:400}},
   playerDeck:deck,enemyDeck:Array(6).fill(null),orders:Array(6).fill('player')});
  for(let t=0;t<rule.minTurn;t++)E.round(b);
  assert.ok(b.turns[rule.minTurn-1].fired.player.includes(rule.key),'発動ログ無し');
  assert.ok(b.events.some(e=>e.type==='effect'&&e.rule===rule.key),'能力ログ無し');
  assert.notEqual(b.outcome,'undetermined',b.error);
  for(const side of ['player','enemy'])for(const stat of E.STAT)assert.ok(Number.isFinite(b.fighters[side].current[stat]),'数値非有限');
 });newTests++;
}
check('単独モデルと先行試作を分類している',()=>{assert.ok(E.SOURCE_RULES.length>=50);assert.equal(E.D.freya.tier,'legacy-preview');assert.equal(E.D.marbas.tier,'source-model');});
check('後半の発動時期が未確定のモデルを誤って実装済み扱いしない',()=>{for(const key of ['orobas','matthew_hopkins','ariosh'])assert.equal(E.D[key],undefined);});
check('単純な乗算：マルバス攻撃力1.5倍',()=>{const b=fixture(['marbas',...empty.slice(1)],empty);E.round(b);assert.equal(b.fighters.player.current.attack,30);});
check('単純な交換：シルフェは双方の魔力を交換',()=>{const b=fixture(['sylphe',...empty.slice(1)],empty,{player:{base:base(20,1000,100000,321)},enemy:{base:base(20,1000,100000,654)}});E.round(b);assert.equal(b.fighters.player.current.magic,654);assert.equal(b.fighters.enemy.current.magic,321);});
check('強制終了：マリア・グァッゾは後続の相手デビルを発動させない',()=>{const b=fixture(['maria_guazzo',...empty.slice(1)],['freya',...empty.slice(1)]);E.round(b);assert.deepEqual(b.turns[0].fired.enemy,[]);assert.equal(b.turns[0].endTurn,true);});
check('複合攻撃前：ファタ・モルガナの守備が0、攻撃が2倍分増加',()=>{const b=fixture(['fata_morgana',...empty.slice(1)],empty);E.round(b);assert.equal(b.fighters.player.current.attack,2020);assert.equal(b.fighters.player.current.defense,0);});
check('後続ターンの阻止：ベルフェゴールは2ターン後に妨害',()=>{const b=fixture(['belphegor',null,null,null,null,null],[null,'freya','freya',null,null,null]);E.round(b);E.round(b);assert.deepEqual(b.turns[1].fired.enemy,['freya']);E.round(b);assert.deepEqual(b.turns[2].fired.enemy,[]);});
check('元データの入力制限：サレオスは1Tにセット不可',()=>{assert.throws(()=>fixture(['saleos',null,null,null,null,null],empty),/2T以降/);});
check('最高能力の交換：シェミハザの回転変換',()=>{const b=fixture(['shemihazah',...empty.slice(1)],empty,{enemy:{base:base(11,22,444,33)}});E.round(b);assert.equal(b.fighters.enemy.current.attack,33);assert.equal(b.fighters.enemy.current.defense,11);assert.equal(b.fighters.enemy.current.magic,444);});
check('フレイヤ：敵攻撃より魔力が高い場合は魔力を採用',()=>{const b=fixture(['freya',...empty.slice(1)],empty,{enemy:{base:base(11,1000,100000,1000)}});E.round(b);assert.equal(b.fighters.enemy.current.hp,99000);});
check('クランプス：敵の最大値が体力以外でもそれに応じてダメージ',()=>{const b=fixture(['blood_krampus',...empty.slice(1)],empty,{enemy:{base:base(201000,1000,100000,100)}});E.round(b);assert.equal(b.fighters.enemy.current.hp,100000-Math.floor(201000/2));});
console.log('Total new source models',E.SOURCE_RULES.length);
// 004.5 : 2026-11-12 field logs, controlled hypotheses, and regression checks.
const customFixture=(p,e,pStats={},eStats={},extra={})=>E.createBattle({
 title:'004.5 field',mode:'full',damageMode:'estimate',
 player:{base:{attack:0,defense:5000,hp:200000,magic:10000},...pStats},
 enemy:{base:{attack:0,defense:5000,hp:200000,magic:10000},...eStats},
 playerDeck:p,enemyDeck:e,orders:Array(6).fill('player'),...extra
});
check('A1 マゴトによる行動停止中、攻撃時ウァサゴが実体化しない',()=>{
 const b=customFixture(['shackled_magot',...empty.slice(1)],['vasago',...empty.slice(1)]);
 E.round(b);assert.equal(b.turns[0].fired.enemy.includes('vasago'),false);
 assert.ok(!b.events.some(x=>x.key==='vasago'));assert.equal(b.outcome,null);
});
check('A1 攻撃禁止中は攻撃後の未実装能力にも到達しない',()=>{
 const b=customFixture(['shackled_magot',...empty.slice(1)],['stras',...empty.slice(1)]);
 E.round(b);assert.notEqual(b.outcome,'undetermined');assert.equal(b.turns[0].fired.enemy.includes('stras'),false);
});
check('A2 ヴィネでヘクセン再発動：継続ダメージ重複なし・攻撃加算は再実行',()=>{
 const b=customFixture(['hexennacht','vine',null,null,null,null],empty,{base:{attack:0,defense:5000,hp:200000,magic:10443}},{base:{attack:0,defense:5000,hp:100000,magic:100}});
 E.round(b);assert.equal(b.sustained.length,1);assert.equal(b.fighters.player.current.attack,5221);
 E.round(b);assert.equal(b.sustained.length,1);assert.equal(b.fighters.player.current.attack,10442);
 assert.equal(b.turns[0].events.filter(x=>x.type==='sustain').length,1);
 assert.equal(b.turns[1].events.filter(x=>x.type==='sustain').length,1);
});
check('A3 スクルドは不発履歴を固定せず、次のヴィネで体力条件を再判定',()=>{
 const b=customFixture(['skuld','vine',null,null,null,null],empty);
 E.round(b);const hp=b.fighters.player.current.hp;b.fighters.enemy.current.hp-=1;
 E.round(b);assert.equal(b.fighters.player.current.hp,Math.ceil(hp/2));
});
check('A3 スクルドは主能力不発でも敵ネモフィラを阻止する',()=>{
 const b=customFixture(['skuld',null,null,null,null,null],['nemophila',null,null,null,null,null]);
 E.round(b);assert.equal(b.turns[0].fired.enemy.length,0);assert.notEqual(b.outcome,'undetermined');
 assert.ok(b.events.some(x=>x.type==='block'&&x.text.includes('スクルド')));
});
check('装備：ウヴァル→ヴィネ再発動は減算二回、相手ハーゲンティは有効',()=>{
 const eq={attack:100,defense:500,hp:1000,magic:200};
 const b=customFixture(['uval','vine',null,null,null,null],[null,null,'hagenti',null,null,null],{},
  {base:{attack:0,defense:2000,hp:100000,magic:1000},equipment:eq});
 E.round(b);assert.equal(b.fighters.enemy.current.defense,2000);
 E.round(b);assert.equal(b.fighters.enemy.current.defense,1500);
 assert.equal(b.fighters.enemy.activeEquipment.defense,500);
 E.round(b);assert.equal(b.fighters.enemy.current.defense,2000);
});
check('装備：ブランドの反復無効化は追加減算なし、後続ハーゲンティも0',()=>{
 const b=customFixture(['brand_folter','vine',null,null,null,null],[null,null,'hagenti',null,null,null],{},
  {base:{attack:0,defense:2000,hp:100000,magic:1000},equipment:{attack:100,defense:500,hp:1000,magic:200}});
 E.round(b);assert.equal(b.fighters.enemy.current.defense,2000);
 E.round(b);assert.equal(b.fighters.enemy.current.defense,2000);
 assert.equal(b.fighters.enemy.activeEquipment.defense,0);
 E.round(b);assert.equal(b.fighters.enemy.current.defense,2000);
});
check('装備：ナパイアは自己装備参照を破壊、次のハーゲンティは増加しない',()=>{
 const b=customFixture([null,'napaiya','hagenti',null,null,null],empty,
  {base:{attack:0,defense:2000,hp:100000,magic:1000},equipment:{attack:100,defense:500,hp:1000,magic:200}});
 E.round(b);E.round(b);assert.equal(b.fighters.player.activeEquipment.defense,0);
 assert.equal(b.fighters.enemy.current.attack,10);assert.equal(b.fighters.enemy.current.magic,10);
 const d=b.fighters.player.current.defense;E.round(b);assert.equal(b.fighters.player.current.defense,d);
});
check('装備：ウヴァル＆ファタは攻撃後に攻撃/守備/魔力を反復減算し装備参照を残す',()=>{
 const b=customFixture(['uval_fata',null,null,null,null,null],empty,{},
  {base:{attack:0,defense:5000,hp:100000,magic:1000},equipment:{attack:100,defense:500,hp:1000,magic:200}});
 E.round(b);assert.equal(b.fighters.enemy.current.defense,5000);
 assert.equal(b.fighters.enemy.current.hp<=101000,true);
 assert.equal(b.fighters.enemy.activeEquipment.defense,500);
 assert.ok(b.events.some(x=>x.text.includes('ウヴァル＆ファタ・モルガナ（攻撃後）')));
});
check('B1 アガリアレプトの魔力戦は発動ターン含む3ターンだけ',()=>{
 const b=customFixture([null,'agaliarept',null,null,null,null],empty);
 E.playAll(b);assert.equal(b.magicUntil,4);
 const attacks=b.turns.map(x=>x.events.filter(e=>e.type==='attack'&&e.text.startsWith('シロコの'))[0]?.text||'');
 assert.ok(!attacks[0].includes('攻撃魔法'));
 for(const i of [1,2,3])assert.ok(attacks[i].includes('攻撃魔法'),attacks[i]);
 assert.ok(!attacks[4].includes('攻撃魔法'));
});
check('B1 アガリアレプトは当時の魔力12,463から切り捨て+6,231',()=>{
 const b=customFixture([null,'agaliarept',null,null,null,null],empty,{base:{attack:0,defense:5000,hp:100000,magic:12463}});
 E.round(b);E.round(b);assert.equal(b.fighters.player.current.magic,18694);
});
check('B2 消滅したカマエルの次ターン予約発動阻止は残る',()=>{
 const b=customFixture(['kamael',null,null,null,null,null],[null,'eligos',null,null,null,null]);
 E.round(b);b.tables.player[0]=null;E.round(b);
 assert.equal(b.turns[1].fired.enemy.length,0);
 assert.ok(b.turns[1].events.some(e=>e.type==='block'&&e.text.includes('エリゴス')));
});
check('B3 プロセルピナ→ヴィネは敵2Tと3Tを自分6Tのデビルへ別々に変更',()=>{
 const b=customFixture(['proserpina','vine',null,null,null,'paimon'],[null,'eligos','marbas',null,null,null]);
 E.round(b);assert.equal(b.tables.enemy[1],'paimon');assert.equal(b.tables.enemy[2],'marbas');
 E.round(b);assert.equal(b.tables.enemy[2],'paimon');assert.equal(b.turns[1].fired.enemy[0],'paimon');
 E.round(b);assert.equal(b.turns[2].fired.enemy[0],'paimon');
});
check('B3 プロセルピナは敵の次ターンが空なら変化なし',()=>{
 const b=customFixture(['proserpina',null,null,null,null,'paimon'],empty);
 E.round(b);assert.equal(b.tables.enemy[1],null);
});
check('B3 ブラウナは2T前のプロセルピナを再発動し、その時点の次枠を書換',()=>{
 const b=customFixture(['proserpina',null,'brauna',null,null,'paimon'],[null,'eligos',null,'marbas',null,null]);
 E.round(b);E.round(b);E.round(b);
 assert.equal(b.tables.enemy[1],'paimon');assert.equal(b.tables.enemy[3],'paimon');
 assert.deepEqual(b.turns[2].fired.player,['brauna','proserpina']);
});
check('C1 ジャック・ロレ：シード固定で再現可能',()=>{
 const x=customFixture(['jack_lore',null,null,null,null,null],empty,{}, {},{randomSeed:12});
 const y=customFixture(['jack_lore',null,null,null,null,null],empty,{}, {},{randomSeed:12});
 E.round(x);E.round(y);assert.deepEqual(x.events,y.events);
});
check('C1 ジャック・ロレ：シードにより両分岐が発生しログに表れる',()=>{
 const seen=new Set();for(let seed=1;seed<100000&&seen.size<2;seed+=137){
  const b=customFixture(['jack_lore',null,null,null,null,null],['vasago',null,null,null,null,null],{}, {},{randomSeed:seed});
  E.round(b);seen.add(b.events.find(e=>e.type==='effect'&&e.text.startsWith('ジャック・ロレ：分岐')).text.includes('分岐①')?'①':'②');
 }
 assert.deepEqual([...seen].sort(),['①','②']);
});
check('C2 フルーレティの体力30%吸収・当ターン混乱・自身攻撃不可',()=>{
 const b=customFixture([null,'flauros_fleurety',null,null,null,null],empty,{}, {base:{attack:1000,defense:5000,hp:200000,magic:10000}});
 E.round(b);const own=b.fighters.player.current.hp,other=b.fighters.enemy.current.hp;
 E.round(b);const stolen=Math.floor(other*.3);
 assert.equal(b.fighters.player.current.hp,own+stolen);
 assert.ok(b.fighters.enemy.current.hp<other-stolen);
 assert.ok(b.turns[1].events.some(e=>e.type==='attack'&&e.text.includes('混乱・自傷')));
 assert.ok(!b.turns[1].events.some(e=>e.type==='attack'&&e.text.startsWith('シロコの')));
});
check('回避：プルソンでも敵の攻撃時デビルは実体化したうえで回避',()=>{
 const b=customFixture(['purson',null,null,null,null,null],['vasago',null,null,null,null,null]);
 E.round(b);assert.ok(b.turns[0].fired.enemy.includes('vasago'));
 assert.ok(b.turns[0].events.some(e=>e.type==='attack'&&e.text.includes('回避した')));
});
check('丸め：攻撃6181にマルバスは+3090として9271',()=>{
 const b=customFixture(['marbas',null,null,null,null,null],empty,{base:{attack:6181,defense:5000,hp:100000,magic:1000}});
 E.round(b);assert.equal(b.fighters.player.current.attack,9271);
});
check('保存データ：乱数シードを設定として往復できる',()=>{
 const c=E.config({...E.preset('free'),randomSeed:12345});assert.equal(c.randomSeed,12345);
 assert.equal(E.createBattle(c).rngState,12345);
});
check('未確定のヴィネ→ブラウナ連鎖は数値を捏造せず安全停止',()=>{
 const b=customFixture(['jack_lore',null,'brauna','vine',null,null],empty);
 E.round(b);E.round(b);E.round(b);E.round(b);
 assert.equal(b.outcome,'undetermined');assert.ok(b.error.includes('内部参照'));
});
check('初回阻止プロセルピナのブラウナ呼出は未確定として停止',()=>{
 const b=customFixture(['proserpina',null,'brauna',null,null,'paimon'],['kings_wind_gremory',null,null,'eligos',null,null],{}, {},{orders:Array(6).fill('enemy')});
 E.round(b);E.round(b);E.round(b);
 assert.equal(b.outcome,'undetermined');assert.ok(b.error.includes('初回阻止'));
});
check('追跡モードではプロセルピナの確定した配置書換を表示',()=>{
 const b=customFixture(['proserpina',null,null,null,null,'paimon'],[null,'eligos',null,null,null,null],{}, {},{mode:'trace'});
 E.round(b);assert.equal(b.tables.enemy[1],'paimon');
});
check('クロリッサ×ブランド装備無効化の未確認ケースは数値予測せず停止',()=>{
 const b=customFixture(['brand_folter','chlorissa',null,null,null,null],empty,
  {},{base:{attack:0,defense:5000,hp:100000,magic:1000},equipment:{attack:0,defense:100,hp:100,magic:0}});
 E.round(b);E.round(b);assert.equal(b.outcome,'undetermined');assert.ok(b.error.includes('未確認'));
});
check('新しい実戦プリセット3種類はどれも実行可能',()=>{
 for(const key of ['fieldHexenVine','fieldProserpina','fieldJackLore']){
  const b=E.createBattle(E.preset(key));E.playAll(b);assert.notEqual(b.outcome,'undetermined',key+' '+b.error);
 }
});
