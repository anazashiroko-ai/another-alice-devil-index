/*
 * 四月島・仮想戦闘エンジン / 試作機002 (非公式研究用)
 * 標本の計算モデル。観測データから推定した近似であり、公式ではない。
 * - デビル効果、ステータス、戦闘進行を計算
 * - 実測モードと計算モードを別々に実行
 * - 先攻/発動順は明示的に入力（ゲームでの抽選規則を推測しない）
 * - 不明な領域は「計算不能」として中断し、架空の勝敗を出さない
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KeiBattleEngineV2 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STATS = ['attack', 'defense', 'hp', 'magic'];
  const NAMES = {attack:'攻撃力', defense:'守備力', hp:'体力', magic:'魔力'};
  const DEVILS = {
    rabbit:'うさぎと戯れるナルキッソス', chlorissa:'クロリッサ',
    kings_wind_gremory:'王の風・グレモリー', freya:'フレイヤ',
    red_folter:'赤い秘密を交わすフォルター夫妻', odradek:'オドラデク'
  };
  const fmt = n => Number(n).toLocaleString('ja-JP', {maximumFractionDigits:2});
  const copy = obj => Object.fromEntries(STATS.map(k => [k, Number(obj[k] ?? 0)]));
  const assertNumber = (n, key) => {
    if (!Number.isFinite(n) || n < 0) throw Error(key + 'は0以上の有限数で入力すること');
    return n;
  };
  // Damage measurements: attack A, opponent defence D, observed damage Y.
  // This is a calibration set, not an exact set of game parameters.
  // The Sho six-turn reference log (D=9823/13110) is deliberately NOT used here.
  const DAMAGE_ANCHORS = [
    [11,2570,19126],[21,2570,5870],[31,2570,3368],[41,2570,2385],
    [51,2570,1876],[61,2570,1571],[71,2570,1370],[81,2570,1229],
    [91,2570,1125],[101,2570,1045],[111,2570,983],
    [500,822,183],[1050,12799,2732],[1560,885,183],
    [2147,2020,415],[3067,2020,411],[4800,12799,2589],
    [5537,59670,12069],[6133,52170,10537],[9400,12799,2573],
    [12000,12799,2570],[12341,2570,516],[15010,8610,1728],
    [21607,12799,2566],[43214,12799,2562]
  ].map(([defense,attack,damage]) => ({
    defense, attack, damage,
    // Midpoint of the observed integer bin mitigates truncation noise.
    factor: (damage + 0.5 - attack / 5) / (attack * Math.log(attack))
  }));
  const LOW_DEF_COEF = 803.993367; // five D=0/1 observations, not an internal constant

  function estimateDamage(attack, defense) {
    attack = Number(attack); defense = Number(defense);
    if (!Number.isFinite(attack) || !Number.isFinite(defense)) return {ok:false, reason:'数値が不正'};
    if (attack <= 0) return {ok:true, damage:0, confidence:'推定', method:'攻撃力が0以下', note:'低・負攻撃力の仕様は未検証'};
    if (defense < 0) return {ok:false, reason:'守備力が負のときの公式は未検証'};
    if (defense !== 0 && defense !== 1 && defense < 11) return {ok:false, reason:'守備力0・1以外で11未満の領域は未検証'};
    if (defense <= 1) {
      if (attack < 1) return {ok:false,reason:'攻撃力1未満の範囲は未検証'};
      const amount = Math.floor(Math.max(0, attack * (0.2 + LOW_DEF_COEF * Math.log(attack))));
      return {ok:true,damage:amount,confidence:attack>=11 && attack<=8610?'検証範囲':'範囲外',
        method:'低守備力・対数経験式',note:'守備力0と1は同じ式と仮定（同一攻撃力での直接比較は未実施）'};
    }
    let lo = DAMAGE_ANCHORS[0], hi = DAMAGE_ANCHORS[DAMAGE_ANCHORS.length-1];
    for (let i=0;i<DAMAGE_ANCHORS.length;i++) {
      const point = DAMAGE_ANCHORS[i];
      if (point.defense <= defense) lo=point;
      if (point.defense >= defense) {hi=point;break;}
    }
    let factor;
    let confidence='補間';
    if (defense >= DAMAGE_ANCHORS[DAMAGE_ANCHORS.length-1].defense) {
      // Beyond measured D, trend to the baseline 20%. This is an extrapolation.
      const last = DAMAGE_ANCHORS[DAMAGE_ANCHORS.length-1];
      factor=last.factor * last.defense / defense;
      confidence='外挿';
    } else if (lo.defense===hi.defense) {
      factor=lo.factor;confidence='校正点';
    } else {
      const t=(Math.log(defense)-Math.log(lo.defense))/(Math.log(hi.defense)-Math.log(lo.defense));
      factor=Math.exp((1-t)*Math.log(lo.factor)+t*Math.log(hi.factor));
    }
    const raw = attack * (0.2 + Math.log(attack) * factor);
    return {ok:true, damage:Math.max(0,Math.floor(raw + 1e-9)),confidence,method:'守備力補間・対数経験式',
      note: '異なる戦闘の実測点を使う近似。小さい攻撃力や未測定条件では誤差が大きくなり得る'};
  }

  function fighter(spec) {
    const base=copy(spec.base), assist=copy(spec.assist||{}),equipment=copy(spec.equipment||{});
    STATS.forEach(k=>{assertNumber(base[k],spec.name+'の素'+k);assertNumber(assist[k],spec.name+'の補正'+k);assertNumber(equipment[k],spec.name+'の装備'+k);});
    const initial={};STATS.forEach(k=>initial[k]=base[k]+assist[k]+equipment[k]);
    return {id:spec.id, name:spec.name,base,assist,equipment,activeEquipment:{...equipment}, initial,current:{...initial}};
  }
  function referenceScenario() {
    return {
      title:'ショウ・ルースソルト戦（実戦ログとの照合）', ids:['shiroko','sho'], maxTurns:6,
      fighters:[
        {id:'shiroko',name:'シロコ',base:{attack:1,defense:1,hp:23437,magic:1},assist:{attack:30,defense:10,hp:90,magic:303},equipment:{attack:5775,defense:9812,hp:10917,magic:3050}},
        {id:'sho',name:'ショウ・ルースソルト',base:{attack:1500,defense:8200,hp:10700,magic:80},assist:{attack:13,hp:18},equipment:{attack:600,defense:4910,hp:6700,magic:5230}}
      ],
      rounds:[
        {devils:['rabbit',null],devilOrder:['shiroko','sho'],attackOrder:['shiroko','sho']},
        {devils:['chlorissa',null],devilOrder:['shiroko','sho'],attackOrder:['sho','shiroko']},
        {devils:['kings_wind_gremory',null],devilOrder:['shiroko','sho'],attackOrder:['shiroko','sho']},
        {devils:[null,null],devilOrder:['shiroko','sho'],attackOrder:['shiroko','sho']},
        {devils:[null,null],devilOrder:['shiroko','sho'],attackOrder:['sho','shiroko']},
        {devils:[null,null],devilOrder:['shiroko','sho'],attackOrder:['shiroko','sho']}
      ],
      observedHits:[
        {attacker:'shiroko',defender:'sho',attack:5808.5,defense:13110,damage:1166},
        {attacker:'shiroko',defender:'sho',attack:8385,defense:13110,damage:1684},
        {attacker:'sho',defender:'shiroko',attack:2113,defense:9825.5,damage:424},
        {attacker:'sho',defender:'shiroko',attack:2113,defense:9823,damage:424}
      ],
      expected:{shiroko:90916.5,sho:9516,outcome:'draw'}
    };
  }
  function sandboxScenario({shiroko,enemy,deck=[],enemyDeck=[],first='shiroko'}) {
    function spec(id,name,values) {
      const cur={attack:Number(values.attack),defense:Number(values.defense),hp:Number(values.hp),magic:Number(values.magic)};
      // In sandbox the provided start and base stats are identical.
      return {id,name,base:cur,assist:{},equipment:{}};
    }
    const firstID=first==='enemy'?'enemy':'shiroko';const other=firstID==='enemy'?'shiroko':'enemy';
    return {
      title:'自由試験（両者の能力値・自分のテーブルを設定）',ids:['shiroko','enemy'],maxTurns:6,
      fighters:[spec('shiroko','シロコ',shiroko),spec('enemy','対戦相手',enemy)],
      rounds:Array.from({length:6},(_,i)=>({
        devils:[deck[i]||null,enemyDeck[i]||null],
        devilOrder:[firstID,other],
        attackOrder:i%2===0?[firstID,other]:[other,firstID]
      })), observedHits:[], expected:null
    };
  }
  function createBattle(config=referenceScenario(), damageMode='estimate') {
    if (!['estimate','observed'].includes(damageMode)) throw Error('未対応のダメージモード');
    const f=Object.fromEntries(config.fighters.map(x=>[x.id,fighter(x)]));
    return {config,fighters:f,turn:0,outcome:null,turns:[],damageMode,
      disabledAttacks:new Set(),suppressedDevils:new Set(),blockedDevilsUntil:{},warnings:[],estimatedHits:[]};
  }
  function observedDamage(b,actor,enemy) {
    const hit=(b.config.observedHits||[]).find(x=>x.attacker===actor.id && x.defender===enemy.id &&
      Math.abs(x.attack-actor.current.attack)<0.00001 && Math.abs(x.defense-enemy.current.defense)<0.00001);
    return hit?{ok:true,damage:hit.damage,confidence:'実測',method:'実測値'}:{ok:false,reason:'この攻撃に対応する実測値がない'};
  }
  function outcomeFor(b) {
    const [a,c]=b.config.ids;
    if (b.fighters[a].current.hp<=0 && b.fighters[c].current.hp<=0) return 'draw';
    if (b.fighters[a].current.hp<=0) return `winner:${c}`;
    if (b.fighters[c].current.hp<=0) return `winner:${a}`;
    return null;
  }
  function applyAbility(key,b,actor,enemy,emit) {
    switch(key) {
      case 'rabbit':
        STATS.forEach(k=>{const delta=2.5*actor.base[k];actor.current[k]+=delta;emit(`${NAMES[k]}を＋${fmt(delta)}（現在${fmt(actor.current[k])}）`,'effect');});
        b.suppressedDevils.add(enemy.id);emit('敵の当ターンのデビルを消滅','effect');break;
      case 'chlorissa':
        [actor,enemy].forEach(f=>['attack','defense','magic'].forEach(k=>{f.current[k]=f.initial[k];}));
        b.disabledAttacks.add(actor.id);b.disabledAttacks.add(enemy.id);
        emit('両者の攻撃力・守備力・魔力を戦闘開始時へ戻し、双方の通常攻撃を封じた','effect');break;
      case 'kings_wind_gremory':
        b.suppressedDevils.add(enemy.id);
        actor.current.attack=actor.current.magic*2.5;
        emit(`敵の当ターンのデビルを阻止。攻撃力＝魔力${fmt(actor.current.magic)}×2.5＝${fmt(actor.current.attack)}`,'effect');break;
      case 'freya':
        enemy.current.hp-=enemy.current.attack;
        b.disabledAttacks.add(actor.id);
        emit(`${enemy.name}に${fmt(enemy.current.attack)}の直接ダメージ。${actor.name}は攻撃不能`,'special');break;
      case 'red_folter':
        STATS.forEach(k=>{const loss=enemy.activeEquipment[k];enemy.current[k]-=loss;enemy.activeEquipment[k]=0;});
        b.blockedDevilsUntil[enemy.id]=b.turn+1;
        emit(`${enemy.name}の有効な装備補正をすべて減算。次ターンの敵デビルを封じる`,'effect');break;
      case 'odradek':
        if (enemy.activeEquipment.magic<=5000) {
          enemy.current.attack=1;enemy.current.defense=1;
          emit(`${enemy.name}の攻撃力・守備力を1にした`,'effect');
        } else emit(`相手の有効魔力装備補正${fmt(enemy.activeEquipment.magic)}が5000を超えるため不発`,'block');
        break;
      default:throw Error('未実装デビル: '+key);
    }
  }
  function advance(b) {
    if (b.outcome || b.turn>=b.config.maxTurns) return null;
    const row=b.config.rounds[b.turn];b.turn++;
    b.disabledAttacks.clear();b.suppressedDevils.clear();
    const events=[];const emit=(message,type='info')=>events.push({message,type});
    emit(`第${b.turn}ターン`,'turn');
    for (const id of row.devilOrder) {
      const i=b.config.ids.indexOf(id);if(i<0)throw Error('未登録の発動者');
      const key=row.devils[i], actor=b.fighters[id],enemy=b.fighters[b.config.ids[1-i]];
      if(!key)continue;
      if (b.suppressedDevils.has(id)||b.blockedDevilsUntil[id]===b.turn) {
        emit(`${actor.name}の【${DEVILS[key]}】は発動できなかった`,'block');continue;
      }
      if(!DEVILS[key])throw Error('未実装のデビル: '+key);
      emit(`${actor.name}のデビル【${DEVILS[key]}】が発動`,'devil');
      applyAbility(key,b,actor,enemy,emit);
      b.outcome=outcomeFor(b);
      if(b.outcome){emit('デビルの効果によって決着','end');break;}
    }
    if(!b.outcome)for(const id of row.attackOrder) {
      const i=b.config.ids.indexOf(id);const actor=b.fighters[id],enemy=b.fighters[b.config.ids[1-i]];
      if(b.disabledAttacks.has(id)){emit(`${actor.name}は攻撃できない`,'block');continue;}
      const hit=b.damageMode==='observed'?observedDamage(b,actor,enemy):estimateDamage(actor.current.attack,enemy.current.defense);
      if(!hit.ok) {
        const m=`${actor.name}の攻撃を計算できない：${hit.reason}`;
        b.warnings.push(m);emit(m,'unknown');b.outcome='undetermined';break;
      }
      enemy.current.hp-=hit.damage;
      b.estimatedHits.push({turn:b.turn,attacker:id,defender:enemy.id,attack:actor.current.attack,
        defense:enemy.current.defense,damage:hit.damage,confidence:hit.confidence,method:hit.method});
      emit(`${actor.name}の攻撃！ ${enemy.name}に${fmt(hit.damage)}のダメージ〔${hit.confidence}〕。残り体力${fmt(enemy.current.hp)}`,'attack');
      b.outcome=outcomeFor(b);
      if(b.outcome){emit(`${actor.name}の勝利`,'end');break;}
    }
    if(!b.outcome && b.turn>=b.config.maxTurns){b.outcome='draw';emit('6ターン終了。両者生存のため引き分け','end');}
    const snap=Object.fromEntries(Object.entries(b.fighters).map(([k,v])=>[k,{...v.current}]));
    const result={turn:b.turn,events,snapshot:snap,outcome:b.outcome};b.turns.push(result);
    return result;
  }
  function playAll(b){while(!b.outcome && b.turn<b.config.maxTurns)advance(b);return b;}
  function checkReference(b) {
    const e=b.config.expected;if(!e)return null;
    return {reference:{...e}, actual:Object.fromEntries(b.config.ids.map(id=>[id,b.fighters[id].current.hp])),
      deltas:Object.fromEntries(b.config.ids.map(id=>[id,b.fighters[id].current.hp-e[id]])),
      outcome:b.outcome, exact:b.outcome===e.outcome && b.config.ids.every(id=>b.fighters[id].current.hp===e[id])};
  }
  function verifyLowDefense() {
    const tests=[[11,1,21209],[61,1,201624],[121,1,466574],[4214,0,28277892],[8610,1,62723215]];
    return tests.map(([attack,defense,actual])=>({attack,defense,actual,estimated:estimateDamage(attack,defense).damage}));
  }
  return {STATS,DEVILS,DAMAGE_ANCHORS,estimateDamage,referenceScenario,sandboxScenario,createBattle,
    advance,playAll,checkReference,verifyLowDefense,fmt};
});
