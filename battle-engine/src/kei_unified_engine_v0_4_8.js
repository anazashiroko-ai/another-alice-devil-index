/* 四月島・仮想戦闘エンジン 004.8 / 実戦ログ規則反映・安全実装。
   公式プログラムではない。未実装能力は完全戦闘モードを停止する。
   全6ターン。行動順は手動指定、通常ダメージは既存経験式または観測値。 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports) module.exports=api;
 if(root) root.KeiUnifiedEngineV45=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const prev=root?.KeiBattleEngineV2 || (typeof require==='function'?require('./kei_battle_engine_v0_2.js'):null);
const STAT=['attack','defense','hp','magic'];
const LABEL={attack:'攻撃力',defense:'守備力',hp:'体力',magic:'魔力'};
const D={
 kamael:{name:'カマエル',phase:'start',model:true},
 balam:{name:'バラム',phase:'start',model:true},
 hexennacht:{name:'ヘクセンナハト',phase:'start',model:true},
 eligos:{name:'エリゴス',phase:'start',model:true},
 skuld:{name:'スクルド',phase:'start',model:true},
 troll:{name:'トロール',phase:'start',model:true},
 beelzebub:{name:'ベルゼブブ',phase:'start',model:true},
 laplace:{name:'ラプラス',phase:'start',model:true},
 vine:{name:'ヴィネ',phase:'start',model:true},
 rabbit:{name:'うさぎと戯れるナルキッソス',phase:'start',model:true},
 narcissus:{name:'ナルキッソス',phase:'start',model:true},
 chlorissa:{name:'クロリッサ',phase:'start',model:true},
 kings_wind_gremory:{name:'王の風・グレモリー',phase:'start',model:true},
 freya:{name:'フレイヤ',phase:'start',model:true,minimumTurn:2},
 red_folter:{name:'赤い秘密を交わすフォルター夫妻',phase:'start',model:true,minimumTurn:2},
 odradek:{name:'オドラデク',phase:'start',model:true,minimumTurn:2},
 hagenti:{name:'ハーゲンティ',phase:'start',model:true},
 sargatanas:{name:'サルガタナス',phase:'start',model:true},
 furcas:{name:'賢者の火・フルカス',phase:'start',model:true},
 purson:{name:'未来を視通すプルソン',phase:'start',model:true},
 baphomet:{name:'バフォメット',phase:'start',model:true},
 blood_krampus:{name:'鮮血を浴びたクランプス',phase:'before',model:true},
 stras:{name:'ストラス',phase:'after',model:false},
 focalor:{name:'フォカロル',phase:'after',model:false},
 bifrons:{name:'ビフロンス',phase:'after',model:false},
 morax:{name:'モラクス',phase:'before',model:false},
 baal:{name:'バアル',phase:'before',model:true},
 lilah:{name:'ライラ・ケプルス',phase:'end',model:false},
 moloch:{name:'虚の扉を開くモロク',phase:'start',model:false},
 abundia:{name:'アブンディア',phase:'start',model:true,tier:'description-model'},
 abaddon:{name:'アバドン',phase:'start',model:true,tier:'description-model'},
 matthew_hopkins:{name:'マシュー・ホプキンス',phase:'start',model:true,tier:'description-model'},
 newyear_ariel:{name:'謹賀新年・アリエル',phase:'start',model:true,tier:'description-model'},
 diana:{name:'◎ディアーナ',phase:'before',model:true,minimumTurn:2,tier:'description-model'},
 beleth:{name:'党首の威光を放つベレト',phase:'start',model:true,tier:'description-model'},
 tsuma_naberius:{name:'ツマ・ナベリウス',phase:'start',model:false},
 lucifer:{name:'雪崩を切り裂くルシファー',phase:'start',model:true,tier:'explicit-provisional'},
 lady_almiraj:{name:'レディ・アルミラージ',phase:'start',model:false},
 spring_bridget:{name:'春を喜ぶブリギット',phase:'start',model:true,tier:'description-model'},
 nicholas:{name:'ニコラス・レミ',phase:'start',model:false},
 shemihaza:{name:'シャミハザ',phase:'start',model:false},
 proserpina:{name:'プロセルピナ',phase:'start',model:true,tier:'field-verified'},
 uval:{name:'ウヴァル',phase:'start',model:true,tier:'field-verified'},
 uval_fata:{name:'ウヴァル＆ファタ・モルガナ',phase:'start',model:true,tier:'field-provisional'},
 napaiya:{name:'◎ナパイア',phase:'start',model:true,minimumTurn:2,tier:'field-verified'},
 brand_folter:{name:'ブランド・フォルター',phase:'start',model:true,tier:'field-verified'},
 secret_brand_folter:{name:'密かに微笑むブランド・フォルター',phase:'start',model:true,tier:'field-provisional'},
 agaliarept:{name:'アガリアレプト',phase:'start',model:true,minimumTurn:2,tier:'field-verified'},
 jack_lore:{name:'ジャック・ロレ',phase:'start',model:true,tier:'field-verified'},
 flauros_fleurety:{name:'フルーレティ',phase:'start',model:true,minimumTurn:2,tier:'field-verified'},
 brauna:{name:'ブラウナ',phase:'start',model:true,minimumTurn:3,tier:'field-provisional'},
 shackled_magot:{name:'枷から解き放たれたマゴト',phase:'start',model:true,tier:'field-verified'},
 ondine:{name:'オンディーナ',phase:'start',model:true,tier:'field-provisional'},
 nemophila:{name:'ネモフィラ',phase:'start',model:false},
 other:{name:'未実装デビル（テスト札）',phase:'start',model:false}
};
const SOURCE_RULES=[{"key":"vasago","name":"ウァサゴ","phase":"before","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["attack"],"value":1.2}],"comment":""},{"key":"marbas","name":"マルバス","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["attack"],"value":1.5}],"comment":""},{"key":"sitri","name":"シトリー","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["defense"],"value":2}],"comment":""},{"key":"batin","name":"バティン","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"defense","ref":"self.attack","scale":1}],"comment":""},{"key":"saleos","name":"サレオス","phase":"start","minTurn":2,"ops":[{"op":"multiply","who":"self","stats":["attack","defense"],"value":2.5}],"comment":""},{"key":"aim","name":"アイム","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"attack","ref":"self.magic","scale":1.5}],"comment":""},{"key":"marchosias","name":"マルコシアス","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"enemy","stats":["defense"],"value":0.6}],"comment":""},{"key":"shax","name":"シャックス","phase":"start","minTurn":1,"ops":[{"op":"reset","who":"self","stats":["attack","defense","magic"]},{"op":"reset","who":"enemy","stats":["attack","defense","magic"]}],"comment":""},{"key":"crocell","name":"クロケル","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"attack","ref":"enemy.attack","scale":0.5}],"comment":""},{"key":"furcas_basic","name":"フルカス","phase":"start","minTurn":1,"ops":[{"op":"suppressEnemy"},{"op":"multiply","who":"self","stats":["hp"],"value":1.2}],"comment":""},{"key":"gremory","name":"グレモリー","phase":"start","minTurn":2,"ops":[{"op":"suppressEnemy"},{"op":"set","who":"self","stat":"attack","ref":"self.magic","scale":1.5}],"comment":""},{"key":"ose","name":"オセ","phase":"start","minTurn":1,"ops":[{"op":"reset","who":"enemy","stats":["attack","defense","magic"]}],"comment":""},{"key":"vapula","name":"ウァプラ","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["attack","defense"],"value":1.6}],"comment":""},{"key":"belial","name":"ベリアル","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["magic"],"value":1.5}],"comment":""},{"key":"paimon","name":"パイモン","phase":"start","minTurn":1,"ops":[{"op":"swap","first":"enemy.hp","second":"enemy.magic"}],"comment":""},{"key":"caim","name":"カイム","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["magic"],"value":3}],"comment":""},{"key":"zagan","name":"ザガン","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["attack"],"value":2},{"op":"multiply","who":"self","stats":["defense"],"value":1.5},{"op":"multiply","who":"self","stats":["hp"],"value":0.6},{"op":"set","who":"self","stat":"magic","ref":"const.0","scale":1}],"comment":""},{"key":"cimejes","name":"キマリス","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"enemy","stats":["attack","magic"],"value":0.6}],"comment":""},{"key":"amon","name":"アモン","phase":"start","minTurn":1,"ops":[{"op":"subtract","who":"enemy","stat":"attack","ref":"self.magic","scale":0.5},{"op":"subtract","who":"enemy","stat":"defense","ref":"self.magic","scale":0.5},{"op":"subtract","who":"enemy","stat":"magic","ref":"self.magic","scale":0.5}],"comment":"自分の魔力の50％を先に固定し、同値を三能力へ減算"},{"key":"andromalius","name":"アンドロマリウス","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["magic"],"value":2.5}],"comment":""},{"key":"bune","name":"ブネ","phase":"start","minTurn":1,"ops":[{"op":"subtract","who":"enemy","stat":"attack","ref":"self.attack","scale":0.8},{"op":"subtract","who":"enemy","stat":"defense","ref":"self.defense","scale":0.8},{"op":"subtract","who":"enemy","stat":"magic","ref":"self.magic","scale":0.8},{"op":"noAttack","who":"self"}],"comment":""},{"key":"murmur","name":"ムルムル","phase":"before","minTurn":1,"ops":[{"op":"reset","who":"enemy","stats":["attack","defense","magic"]}],"comment":""},{"key":"sylphe","name":"シルフェ","phase":"start","minTurn":1,"ops":[{"op":"swap","first":"self.magic","second":"enemy.magic"}],"comment":""},{"key":"ranaril","name":"ラナリル","phase":"start","minTurn":1,"ops":[{"op":"swap","first":"enemy.attack","second":"enemy.hp"}],"comment":""},{"key":"maria_guazzo","name":"マリア・グァッゾ","phase":"start","minTurn":1,"ops":[{"op":"stopTurn"}],"comment":""},{"key":"leviathan","name":"レヴィアタン","phase":"start","minTurn":1,"ops":[{"op":"swap","first":"self.defense","second":"enemy.defense"}],"comment":""},{"key":"regeneration","name":"○再生","phase":"start","minTurn":1,"ops":[{"op":"reset","who":"self","stats":["attack","defense","hp","magic"]}],"comment":""},{"key":"belphegor","name":"ベルフェゴール","phase":"start","minTurn":1,"ops":[{"op":"blockDevil","offset":2},{"op":"add","who":"self","stat":"defense","ref":"self.magic","scale":0.4}],"comment":""},{"key":"sprenger_kramer","name":"シュプレンゲル＆クラメル","phase":"start","minTurn":1,"ops":[{"op":"subtract","who":"enemy","stat":"attack","ref":"const.6666","scale":1},{"op":"subtract","who":"enemy","stat":"defense","ref":"const.6666","scale":1},{"op":"subtract","who":"enemy","stat":"hp","ref":"const.6666","scale":1},{"op":"subtract","who":"enemy","stat":"magic","ref":"const.6666","scale":1},{"op":"noAttack","who":"self"}],"comment":""},{"key":"aulis","name":"アウリス","phase":"start","minTurn":1,"ops":[{"op":"swap","first":"self.hp","second":"self.magic"}],"comment":""},{"key":"fata_morgana","name":"ファタ・モルガナ","phase":"before","minTurn":1,"ops":[{"op":"add","who":"self","stat":"attack","ref":"self.defense","scale":2},{"op":"set","who":"self","stat":"defense","ref":"const.0","scale":1}],"comment":""},{"key":"nisroc","name":"ニスロク","phase":"start","minTurn":1,"ops":[{"op":"transfer","who":"enemy","to":"self","stat":"hp","scale":0.4},{"op":"transfer","who":"enemy","to":"self","stat":"attack","scale":0.4}],"comment":""},{"key":"pumpkin_panpiki","name":"◎パンプキィ・パンピキィ","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"attack","ref":"self.equipment.attack","scale":3}],"comment":""},{"key":"vivian","name":"ヴィヴィアン","phase":"start","minTurn":1,"ops":[{"op":"set","who":"self","stat":"hp","ref":"self.initial.hp","scale":1},{"op":"noAttack","who":"self"}],"comment":""},{"key":"magot","name":"マゴト","phase":"start","minTurn":1,"ops":[{"op":"damage","ref":"enemy.defense","scale":0.4},{"op":"noAttack","who":"self"},{"op":"noAttack","who":"enemy"}],"comment":""},{"key":"lilith","name":"リリス","phase":"start","minTurn":3,"ops":[{"op":"swap","first":"self.attack","second":"enemy.attack"},{"op":"swap","first":"self.defense","second":"enemy.defense"},{"op":"swap","first":"self.magic","second":"enemy.magic"}],"comment":""},{"key":"nymph","name":"ニンフ","phase":"start","minTurn":1,"ops":[{"op":"damage","ref":"enemy.base.min","scale":1.5}],"comment":""},{"key":"ucobach","name":"ウコバク","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["defense"],"value":3}],"comment":""},{"key":"barachiel","name":"バラキエル","phase":"start","minTurn":1,"ops":[{"op":"swap","first":"enemy.defense","second":"enemy.hp"}],"comment":""},{"key":"scathach","name":"スカアハ","phase":"start","minTurn":1,"ops":[{"op":"swap","first":"enemy.attack","second":"enemy.magic"}],"comment":""},{"key":"dagon","name":"ダゴン","phase":"before","minTurn":2,"ops":[{"op":"damage","ref":"self.attack","scale":1}],"comment":""},{"key":"andramalech","name":"アンドラメレク","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"attack","ref":"enemy.sum","scale":0.3}],"comment":""},{"key":"ouroboros","name":"ウロボロス","phase":"start","minTurn":1,"ops":[{"op":"attackTurnBoost","scale":0.75}],"comment":""},{"key":"shemihazah","name":"シェミハザ","phase":"start","minTurn":1,"ops":[{"op":"rotateEnemy"}],"comment":""},{"key":"dullahan","name":"デュラハン","phase":"before","minTurn":1,"ops":[{"op":"sacrificeHp","fraction":0.95,"attackScale":2}],"comment":""},{"key":"knocker","name":"ノッカー","phase":"start","minTurn":1,"ops":[{"op":"damage","ref":"enemy.defense","scale":0.7},{"op":"set","who":"self","stat":"attack","ref":"const.1","scale":1}],"comment":""},{"key":"eurynome","name":"エウリノーム","phase":"start","minTurn":2,"ops":[{"op":"set","who":"self","stat":"attack","ref":"self.min","scale":3},{"op":"set","who":"self","stat":"defense","ref":"self.min","scale":3},{"op":"set","who":"self","stat":"magic","ref":"self.min","scale":3}],"comment":"最小値は発動開始時点の値を固定して参照"},{"key":"merrow","name":"メロウ","phase":"start","minTurn":1,"ops":[{"op":"set","who":"self","stat":"hp","ref":"self.initial.hp","scale":1},{"op":"add","who":"self","stat":"defense","ref":"self.magic","scale":1}],"comment":""},{"key":"haar_bell","name":"ハール・ベル","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["defense"],"value":1.3}],"comment":""},{"key":"roggenmeme","name":"ロッゲンメーメ","phase":"start","minTurn":1,"ops":[{"op":"subtract","who":"enemy","stat":"attack","ref":"self.hp","scale":0.4},{"op":"subtract","who":"enemy","stat":"magic","ref":"self.hp","scale":0.4}],"comment":""},{"key":"sandmannchen","name":"ザントメンヒェン","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"hp","ref":"self.equipment.hp","scale":2}],"comment":""},{"key":"nergal","name":"ネルガル","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"attack","ref":"self.magic","scale":1},{"op":"add","who":"self","stat":"attack","ref":"self.hp","scale":1}],"comment":""},{"key":"peryton","name":"ペリュトン","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"attack","ref":"self.initial.attack","scale":0.4},{"op":"add","who":"self","stat":"defense","ref":"self.initial.defense","scale":0.4},{"op":"add","who":"self","stat":"hp","ref":"self.initial.hp","scale":0.4}],"comment":""},{"key":"apao","name":"ア・パオ・ア・クゥー","phase":"start","minTurn":1,"ops":[{"op":"sharedMagicHit","fraction":0.3}],"comment":""},{"key":"thunder_leraje","name":"轟雷の矢を放つレライエ","phase":"start","minTurn":1,"ops":[{"op":"set","who":"self","stat":"attack","ref":"self.magic","scale":2.5}],"comment":""},{"key":"aoife","name":"オイフェ","phase":"start","minTurn":1,"ops":[{"op":"swap","first":"enemy.attack","second":"enemy.defense"}],"comment":""},{"key":"cyclops","name":"サイクロプス","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["hp"],"value":2.5}],"comment":""},{"key":"basilisk","name":"バジリスク","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"enemy","stats":["attack","defense","hp","magic"],"value":0.6},{"op":"noAttack","who":"self"}],"comment":""},{"key":"eir","name":"エイル","phase":"start","minTurn":1,"ops":[{"op":"restoreIfBelow","who":"self","stats":["attack","defense","hp","magic"]}],"comment":""},{"key":"law_baphomet","name":"法を改訂するバフォメット","phase":"start","minTurn":1,"ops":[{"op":"set","who":"self","stat":"attack","ref":"enemy.magic","scale":2},{"op":"set","who":"self","stat":"hp","ref":"enemy.magic","scale":2},{"op":"noAttack","who":"self"}],"comment":""},{"key":"eternal_asmodeus","name":"永遠を灯すアスモデウス","phase":"start","minTurn":2,"ops":[{"op":"set","who":"self","stat":"attack","ref":"self.magic","scale":2.5},{"op":"set","who":"self","stat":"defense","ref":"self.magic","scale":2.5}],"comment":""},{"key":"night_swanir","name":"夜空に羽撃くスワニール","phase":"start","minTurn":1,"ops":[{"op":"transferExcess","who":"enemy","fromStat":"magic","toStat":"hp","minRemain":10}],"comment":""},{"key":"summer_saleos","name":"ひまわりワンピを着たサレオス","phase":"start","minTurn":4,"ops":[{"op":"multiply","who":"self","stats":["attack","defense"],"value":3}],"comment":""},{"key":"nicholas_remy","name":"ニコラス・レミ","phase":"start","minTurn":3,"ops":[{"op":"destroyEnemy","offset":0},{"op":"destroyEnemy","offset":1},{"op":"set","who":"enemy","stat":"attack","ref":"const.1","scale":1},{"op":"noAttack","who":"self"}],"comment":""},{"key":"moromoro","name":"モルモル","phase":"start","minTurn":1,"ops":[{"op":"magicToAttack","multiplier":3}],"comment":""},{"key":"belona","name":"ベローナ","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"attack","ref":"self.magic","scale":0.5}],"comment":"仕掛けた際のソウルストーン効果は戦闘結果外"},{"key":"lifeguard_sabnack","name":"ライフセーバー・サブナック","phase":"start","minTurn":1,"ops":[{"op":"set","who":"self","stat":"defense","ref":"self.max","scale":2.5}],"comment":""},{"key":"shax_pumpkin","name":"かぼちゃを投げ落とすシャックス","phase":"start","minTurn":1,"ops":[{"op":"reset","who":"self","stats":["attack","defense","magic"]},{"op":"reset","who":"enemy","stats":["attack","defense","magic"]},{"op":"damage","ref":"enemy.defense","scale":0.3}],"comment":""},{"key":"henri_boguet","name":"アンリ・ボゲ","phase":"start","minTurn":2,"ops":[{"op":"destroyEnemy","offset":2},{"op":"set","who":"enemy","stat":"defense","ref":"const.1","scale":1},{"op":"noAttack","who":"self"}],"comment":""},{"key":"easter_bunny","name":"◎イースターバニー","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["attack","defense","hp","magic"],"value":2},{"op":"multiply","who":"enemy","stats":["attack","defense","hp","magic"],"value":2},{"op":"noAttack","who":"self"},{"op":"noAttack","who":"enemy"}],"comment":""},{"key":"sebek","name":"セベク","phase":"start","minTurn":1,"ops":[{"op":"destroyEnemy","offset":2},{"op":"add","who":"self","stat":"attack","ref":"self.magic","scale":0.3}],"comment":""},{"key":"summer_fata","name":"サマーバケーション・ファタ・モルガナ","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"attack","ref":"self.defense","scale":1.5},{"op":"multiply","who":"self","stats":["defense"],"value":0.5}],"comment":""},{"key":"balam_astaruiz","name":"バラム・アスタルイズ","phase":"start","minTurn":1,"ops":[{"op":"destroyEnemy","offset":1},{"op":"multiply","who":"self","stats":["defense"],"value":2}],"comment":""},{"key":"snowtra","name":"スノトラ","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["attack"],"value":3.5}],"comment":""},{"key":"midnight_amy","name":"夜へと誘うアミー","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"enemy","stats":["attack","defense"],"value":0.3}],"comment":""},{"key":"vidofnir_cozette","name":"ヴィドフニル＆コゼット","phase":"start","minTurn":2,"ops":[{"op":"swap","first":"self.magic","second":"enemy.attack"}],"comment":""},{"key":"island_vidofnir","name":"四月島にいたヴィドフニル","phase":"start","minTurn":1,"ops":[{"op":"swap","first":"self.hp","second":"enemy.magic"}],"comment":""},{"key":"night_orias","name":"夜に涼むオリアス","phase":"start","minTurn":2,"ops":[{"op":"swap","first":"self.hp","second":"enemy.hp"}],"comment":""},{"key":"bed_marchosias","name":"ベッドに誘うマルコシアス","phase":"start","minTurn":1,"ops":[{"op":"multiply","who":"enemy","stats":["defense"],"value":0.1}],"comment":""},{"key":"champagne_henri","name":"シャンパンを開けるアンリ・ボゲ","phase":"start","minTurn":1,"ops":[{"op":"destroyEnemy","offset":2},{"op":"set","who":"enemy","stat":"defense","ref":"const.1","scale":1},{"op":"noAttack","who":"self"}],"comment":""},{"key":"guivre","name":"ギーブル","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"hp","ref":"self.magic","scale":0.7}],"comment":""},{"key":"chef_nisroc","name":"料理をするニスロク","phase":"start","minTurn":1,"ops":[{"op":"transfer","who":"enemy","to":"self","stat":"hp","scale":0.6},{"op":"transfer","who":"enemy","to":"self","stat":"attack","scale":0.6}],"comment":""},{"key":"barbatos","name":"バルバトス","phase":"before","minTurn":1,"ops":[{"op":"transfer","who":"enemy","to":"self","stat":"attack","scale":0.4}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"halphas","name":"ハルファス","phase":"before","minTurn":1,"ops":[{"op":"transfer","who":"enemy","to":"self","stat":"attack","scale":0.3}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"malphas","name":"マルファス","phase":"before","minTurn":1,"ops":[{"op":"transfer","who":"enemy","to":"self","stat":"defense","scale":0.3}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"raum","name":"ラウム","phase":"start","minTurn":1,"ops":[{"op":"transfer","who":"enemy","to":"self","stat":"hp","scale":0.5}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"agares","name":"アガレス","phase":"start","minTurn":1,"ops":[{"op":"transfer","who":"enemy","to":"self","stat":"defense","scale":0.5}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"banshee","name":"バンシー","phase":"start","minTurn":1,"ops":[{"op":"transfer","who":"enemy","to":"self","stat":"defense","scale":0.7}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"dory_j","name":"ドリー・J","phase":"start","minTurn":1,"ops":[{"op":"transfer","who":"enemy","to":"self","stat":"attack","scale":0.2},{"op":"transfer","who":"enemy","to":"self","stat":"defense","scale":0.2},{"op":"transfer","who":"enemy","to":"self","stat":"hp","scale":0.2},{"op":"transfer","who":"enemy","to":"self","stat":"magic","scale":0.2}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"andrealphus","name":"アンドレアルフス","phase":"start","minTurn":1,"ops":[{"op":"subtract","who":"enemy","stat":"attack","ref":"self.defense","scale":0.4},{"op":"subtract","who":"enemy","stat":"defense","ref":"self.defense","scale":0.4},{"op":"subtract","who":"enemy","stat":"magic","ref":"self.defense","scale":0.4}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"seere","name":"セエレ","phase":"start","minTurn":1,"ops":[{"op":"set","who":"self","stat":"attack","ref":"self.max","scale":1.5}],"comment":"最高能力にはHPも含む説明文解釈。実戦未照合。"},{"key":"ostal_priestess","name":"◎オスタルの巫女","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"hp","ref":"self.initial.hp","scale":0.4},{"op":"multiply","who":"self","stats":["defense"],"value":1.4}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"storm_murmur","name":"暴風吹き荒れるムルムル","phase":"before","minTurn":1,"ops":[{"op":"set","who":"enemy","stat":"attack","ref":"enemy.initial.attack","scale":0.5},{"op":"set","who":"enemy","stat":"defense","ref":"enemy.initial.defense","scale":0.5}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"thunder_skaah","name":"冥雷を振りかざすスカアハ","phase":"before","minTurn":1,"ops":[{"op":"multiply","who":"enemy","stats":["attack","magic"],"value":0.2}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"lilah","name":"ライラ・ケプルス","phase":"end","minTurn":1,"ops":[{"op":"multiply","who":"self","stats":["attack","defense","magic"],"value":2},{"op":"multiply","who":"self","stats":["hp"],"value":0.2}],"comment":"説明文の主要数値効果のみ。丸め・競合は実戦未照合。"},{"key":"evil_mandrake","name":"◎邪悪なマンドラゴラ","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"hp","ref":"enemy.attack","scale":0.25},{"op":"add","who":"self","stat":"hp","ref":"enemy.defense","scale":0.25},{"op":"add","who":"self","stat":"hp","ref":"enemy.hp","scale":0.25},{"op":"add","who":"self","stat":"hp","ref":"enemy.magic","scale":0.25},{"op":"subtract","who":"enemy","stat":"attack","ref":"enemy.attack","scale":0.25},{"op":"subtract","who":"enemy","stat":"defense","ref":"enemy.defense","scale":0.25},{"op":"subtract","who":"enemy","stat":"hp","ref":"enemy.hp","scale":0.25},{"op":"subtract","who":"enemy","stat":"magic","ref":"enemy.magic","scale":0.25}],"comment":"敵の4能力の発動前25%を自身HPへ合算し、敵の4能力を減算する説明文解釈。"},{"key":"future_andramelech","name":"未来へ誘うアンドラメレク","phase":"start","minTurn":1,"ops":[{"op":"add","who":"self","stat":"defense","ref":"enemy.attack","scale":0.25},{"op":"add","who":"self","stat":"defense","ref":"enemy.defense","scale":0.25},{"op":"add","who":"self","stat":"defense","ref":"enemy.hp","scale":0.25},{"op":"add","who":"self","stat":"defense","ref":"enemy.magic","scale":0.25},{"op":"subtract","who":"enemy","stat":"attack","ref":"enemy.attack","scale":0.25},{"op":"subtract","who":"enemy","stat":"defense","ref":"enemy.defense","scale":0.25},{"op":"subtract","who":"enemy","stat":"hp","ref":"enemy.hp","scale":0.25},{"op":"subtract","who":"enemy","stat":"magic","ref":"enemy.magic","scale":0.25}],"comment":"敵の4能力の発動前25%を自身守備へ合算し、敵の4能力を減算する説明文解釈。"}];

const BATCH_0048=(root&&root.KeiBatchRules0048)||(typeof require==='function'?require('./kei_batch_rules_0048.js'):[]);
const BATCH_META=Object.fromEntries(BATCH_0048.map(x=>[x.key,x]));
const META_LOOKUP=new Map((root?.KeiDevilMeta0048||[]).map(x=>[String(x.name).normalize('NFKC').replace(/^[○◎]+/,'').trim(),x]));
SOURCE_RULES.push(...BATCH_0048);
for(const x of SOURCE_RULES)D[x.key]={name:x.name,phase:x.phase,model:true,tier:x.coverage==='partial'?'description-partial':'source-model',sourceId:x.key,minimumTurn:x.minTurn,notes:x.comment,coverage:x.coverage||'existing'};
for(const d of Object.values(D)){const meta=META_LOOKUP.get(String(d.name).normalize('NFKC').replace(/^[○◎]+/,'').trim());if(meta){d.dp=meta.dp;d.attr=meta.attr;}}
for(const x of Object.values(D))if(x.model&&!x.tier)x.tier='legacy-preview';
const KIJI3=['moloch','beleth','furcas','tsuma_naberius','lucifer','lady_almiraj'];
const integral=n=>Math.trunc(n); // 実戦で確認した増減に限って適用する
const fstr=n=>Number(n).toLocaleString('ja-JP',{maximumFractionDigits:2});
const blank=()=>({attack:0,defense:0,hp:0,magic:0});
function stats(src){const s=blank();for(const k of STAT){s[k]=Number(src?.[k]??0);if(!Number.isFinite(s[k]))throw Error(`${LABEL[k]}は有限の数値にすること`);}return s;}
function fighter(src,id){const base=stats(src.base),assist=stats(src.assist),equipment=stats(src.equipment),initial=blank();
 for(const k of STAT)initial[k]=base[k]+assist[k]+equipment[k];
 return {id,name:src.name|| (id==='player'?'シロコ':'対戦相手'),base,assist,equipment,activeEquipment:{...equipment},initial,current:{...initial}};
}
function pad(arr){
 if(!Array.isArray(arr)||arr.length!==6)throw Error('デビルテーブルは6枠にすること');
 for(const key of arr){
  if(!key)continue;
  if(D[key])continue;
  // Unknown devils are allowed ONLY as explicitly tagged observational placeholders.
  // Full mode stops at their actual activation. Trace mode can use the supplied phase.
  const m=/^custom:(start|before|after|end):(.+)$/.exec(key);
  if(!m)throw Error('未登録のデビルキー：'+key);
  let name;try{name=decodeURIComponent(m[2]);}catch{throw Error('デビル名を解釈できない');}
  if(!name||name.length>100)throw Error('自由入力デビル名は1〜100文字で指定');
  D[key]={name,phase:m[1],model:false,custom:true};
 }
 return [...arr];
}
function config(src){
 const s={title:src.title||'自由実験',player:src.player,enemy:src.enemy,external:src.external||{},
  playerDeck:pad(src.playerDeck||Array(6).fill(null)),enemyDeck:pad(src.enemyDeck||Array(6).fill(null)),
  orders:(src.orders||Array(6).fill('player')).map(x=>x==='enemy'?'enemy':'player'),
  laplaceTarget:Number(src.laplaceTarget||1),randomSeed:Number(src.randomSeed??20261112),mode:src.mode||'full',damageMode:src.damageMode||'estimate',
  observedHits:src.observedHits||[], expected:src.expected||null};
 if(s.orders.length!==6)throw Error('先攻は六ターン分必要');
 if(!Number.isInteger(s.laplaceTarget)||s.laplaceTarget<1||s.laplaceTarget>6)throw Error('ラプラスの参照先は1〜6');
 if(!Number.isInteger(s.randomSeed)||s.randomSeed<0||s.randomSeed>4294967295)throw Error('乱数シードは0〜4294967295の整数');
 if(!['full','trace'].includes(s.mode))throw Error('モード不正');
 if(!['estimate','observed'].includes(s.damageMode))throw Error('ダメージモード不正');
 return s;
}
function createBattle(input){const c=config(input);for(const side of ['player','enemy'])for(let i=0;i<6;i++){const k=c[side+'Deck'][i],d=D[k];if(d?.minimumTurn && i+1<d.minimumTurn)throw Error(`【${d.name}】は${d.minimumTurn}T以降にセット可能（${i+1}Tには置けない）`);}return {config:c,turn:0,complete:false,outcome:null,error:null,
 fighters:{player:fighter(c.player,'player'),enemy:fighter(c.enemy,'enemy')},
 original:{player:[...c.playerDeck],enemy:[...c.enemyDeck]},tables:{player:[...c.playerDeck],enemy:[...c.enemyDeck]},
 events:[],turns:[],warnings:[],pending:[],sustained:[],blockedDevils:{player:new Set(),enemy:new Set()},
 blockedAttacks:{player:new Set(),enemy:new Set()},blockedActivations:{player:new Set(),enemy:new Set()},truncations:[],forcedFirst:{},magicUntil:0,rngState:c.randomSeed||0x6d2b79f5};}
const opp=id=>id==='player'?'enemy':'player';
function roll(b){let x=b.rngState>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;b.rngState=x>>>0;return b.rngState/4294967296;}

function round(b){
 if(b.complete)return null;
 b.turn++;const t=b.turn;const c=b.config,first=b.forcedFirst[t]||c.orders[t-1],order=[first,opp(first)],events=[];
 const tempUndo=[],lastHits={player:0,enemy:0},turnReceived={player:0,enemy:0},duelHandled=new Set();
  const fired={player:[],enemy:[]},disabled=new Set(),suppressed=new Set(),evading=new Set(),reflecting=new Set(),confused=new Set(),postAttackUvalFata=new Set();let endTurn=false;
 function emit(type,text,meta={}){const e={turn:t,type,text,...meta};b.events.push(e);events.push(e);}
 function outcome(){if(c.mode==='trace')return false;
  for(const s of order)if(b.fighters[s].current.hp<=0){
    if((b.reviveCharges?.[s]||0)>0){b.reviveCharges[s]--;b.fighters[s].current.hp=1;emit('revive',`${b.fighters[s].name}は体力1で復活`);continue;}
    b.outcome=`winner:${opp(s)}`;b.complete=true;emit('result',`${b.fighters[opp(s)].name}の勝利（体力0以下）`);return true;}
  return false;
 }
 function unsupported(key){const msg=`【${D[key]?.name||key}】は数値能力が未実装。勝敗を捏造しないため、ここで停止`;b.error=msg;b.outcome='undetermined';b.complete=true;emit('unknown',msg);}
 const SOURCE_RULE_MAP=new Map(SOURCE_RULES.map(r=>[r.key,r]));
  function markUnknown(reason){b.error=reason;b.outcome='undetermined';b.complete=true;emit('unknown',reason);}
  const ext=c.external||{};
  function externalNumber(side,key){const value=ext[side]?.[key];if(value===null||value===undefined||value===''||!Number.isFinite(Number(value))){markUnknown('外部入力が必要：'+side+'.'+key);return 0;}return Number(value);}
  function externalBool(side,key){const value=ext[side]?.[key];if(typeof value!=='boolean'){markUnknown('外部入力が必要：'+side+'.'+key);return false;}return value;}
  function getDevAttr(key){return (D[key]&&D[key].attr)||null;}
  function deckDp(side,index){const key=b.tables[side][index];if(!key)return 0;if(!Number.isFinite(Number(D[key]?.dp))){markUnknown('DPが未登録：'+key);return 0;}return Number(D[key].dp);}
  function deckDpTotal(side){return b.original[side].reduce((acc,key)=>{if(key&&!Number.isFinite(Number(D[key]?.dp)))markUnknown('DP未登録：'+key);return acc+(key?Number(D[key]?.dp||0):0);},0);}

 function equipmentNeutralize(victim,label){
  const changes={};for(const k of STAT){changes[k]=victim.activeEquipment[k];victim.current[k]-=changes[k];victim.activeEquipment[k]=0;}
  emit('effect',`${label}：${victim.name}の有効装備補正を無効化（${STAT.map(k=>LABEL[k]+'-'+fstr(changes[k])).join('、')}）。今後の装備参照は0`);
  outcome();
 }
 function equipmentSubtract(victim,keys,label){
  for(const k of keys)victim.current[k]-=victim.equipment[k];
  emit('effect',`${label}：${keys.map(k=>LABEL[k]+'-'+fstr(victim.equipment[k])).join('、')}（元装備値を再減算、参照元は維持）`);
  outcome();
 }

 function fire(s,key,{source='table',depth=0,sourceSlot=null}={}){
  if(!key||b.complete||endTurn)return;
  const actor=b.fighters[s],target=b.fighters[opp(s)],dev=D[key];
  if(depth>15){b.error='再発動連鎖が安全上限に達した（ゲームの真の上限ではない）';b.complete=true;b.outcome='undetermined';emit('unknown',b.error);return;}
  // スクルドは主能力が不発でも、テーブルに残っていればネモフィラを止める（実戦観測）。
  if(key==='nemophila'&&b.tables[opp(s)].includes('skuld')){emit('block',`${actor.name}の【ネモフィラ】は相手のスクルドによって発動を阻止された`);return;}
  if(source==='table'&&(suppressed.has(s)||b.blockedDevils[s].has(t))){b.blockedActivations[s].add(`${t}:${key}`);emit('block',`${actor.name}の【${dev.name}】は発動を封じられた`);return;}
  if(source!=='table' && sourceSlot!==null && b.tables[s][sourceSlot]===null){emit('block',`${dev.name}：呼出元の枠が消滅したため保留効果を取消（暫定仕様）`);return;}
  fired[s].push(key);emit('devil',`${actor.name}のデビル【${dev.name}】が実体化${source==='table'?'':`〔再発動：${source}〕`}`,{side:s,key,source});
  if(c.mode==='trace'&&!['troll','beelzebub','laplace','vine','proserpina','brauna'].includes(key)){
   emit('caveat',`${dev.name}の数値・妨害効果は追跡モードでは未計算`);return;
  }
  if(!dev.model){unsupported(key);return;}
  function boost(k,delta){actor.current[k]+=delta;}
  function harm(p,amount,desc){p.current.hp-=amount;emit('effect',`${desc}：${fstr(amount)}、残り体力${fstr(p.current.hp)}`);outcome();}
  if(SOURCE_RULE_MAP.has(key)){
   const rule=SOURCE_RULE_MAP.get(key), actors={self:actor,enemy:target};
   // Freeze all referenced values per operation. Fixed-base references never mutate.
   const get=value=>{
    if(/^const\.-?\d+(?:\.\d+)?$/.test(value))return Number(value.slice(6));
    const [who,stat,extra]=value.split('.');const f=actors[who];
    if(!f)throw Error('source rule: unknown target '+value);
    if(stat==='initial')return f.initial[extra];
    if(stat==='base')return f.base[extra];
    if(stat==='equipment')return f.activeEquipment[extra];
    if(stat==='sum')return STAT.reduce((a,k)=>a+f.current[k],0);
    if(stat==='max')return Math.max(...STAT.map(k=>f.current[k]));
    if(stat==='min')return Math.min(...STAT.map(k=>f.current[k]));
    if(stat==='attack'||stat==='defense'||stat==='hp'||stat==='magic')return f.current[stat];
    throw Error('source rule: unknown ref '+value);
   };
   function who(n){return n==='self'?actor:target;}
   const beforeRule={self:{...actor.current},enemy:{...target.current}};
   function originalGet(value){
    if(/\.(min|max)$/.test(value)){const [w,stat]=value.split('.');return stat==='min'?Math.min(...STAT.map(k=>beforeRule[w][k])):Math.max(...STAT.map(k=>beforeRule[w][k]));}
    return get(value);
   }

   function simpleSubops(ops){for(const sub of ops){const side=sub.who==='enemy'?target:actor;
    if(sub.op==='multiply')for(const st of sub.stats)side.current[st]*=sub.value;
    else if(sub.op==='add')side.current[sub.stat]+=originalGet(sub.ref)*sub.scale;
    else if(sub.op==='subtract')side.current[sub.stat]-=originalGet(sub.ref)*sub.scale;
    else if(sub.op==='set')side.current[sub.stat]=originalGet(sub.ref)*sub.scale;
    else if(sub.op==='confuse')confused.add(opp(s));
    else if(sub.op==='suppressEnemy')suppressed.add(opp(s));
    else if(sub.op==='noAttack')disabled.add(sub.who==='enemy'?opp(s):s);
    else if(sub.op==='damage')target.current.hp-=originalGet(sub.ref)*sub.scale;
    else if(sub.op==='destroyEnemy')if(t+sub.offset<=6)b.tables[opp(s)][t+sub.offset-1]=null;
    else if(sub.op==='cancelMagic')b.magicUntil=t-1;
    else if(sub.op==='destroyBothDevilsForTurns')for(let i=t-1;i<Math.min(6,t-1+sub.turns);i++){b.tables.player[i]=null;b.tables.enemy[i]=null;}
    else if(sub.op==='transfer'){const p=sub.who==='enemy'?target:actor,q=sub.to==='enemy'?target:actor,v=p.current[sub.stat]*sub.scale;p.current[sub.stat]-=v;q.current[sub.stat]+=v;}
    else markUnknown('未対応の条件付き演算：'+sub.op);
   }}
   for(const op of rule.ops){
    if(b.complete||endTurn)break;
    const f=op.who?who(op.who):actor;
    switch(op.op){
     case 'multiply':for(const st of op.stats)f.current[st]=rule.key==='marbas'?integral(f.current[st]*op.value):f.current[st]*op.value;break;
     case 'add':f.current[op.stat]+=originalGet(op.ref)*op.scale;break;
     case 'subtract':f.current[op.stat]-=originalGet(op.ref)*op.scale;break;
     case 'set':f.current[op.stat]=originalGet(op.ref)*op.scale;break;
     case 'swap':{const [x,p]=op.first.split('.'),[y,q]=op.second.split('.');const v=who(x).current[p];who(x).current[p]=who(y).current[q];who(y).current[q]=v;break;}
     case 'reset':for(const st of op.stats)f.current[st]=f.initial[st];break;
     case 'noAttack':disabled.add(op.who==='enemy'?opp(s):s);break;
     case 'blockDevil':if(t+op.offset<=6)b.blockedDevils[opp(s)].add(t+op.offset);break;
     case 'suppressEnemy':suppressed.add(opp(s));break;
     case 'destroyEnemy':if(t+op.offset<=6)b.tables[opp(s)][t+op.offset-1]=null;break;
     case 'damage':target.current.hp-=originalGet(op.ref)*op.scale;break;
     case 'stopTurn':endTurn=true;break;
     case 'transfer':{const v=who(op.who).current[op.stat]*op.scale;who(op.who).current[op.stat]-=v;who(op.to).current[op.stat]+=v;break;}
     case 'restoreIfBelow':for(const st of op.stats)f.current[st]=Math.max(f.current[st],f.initial[st]);break;
     case 'attackTurnBoost':actor.current.attack+=actor.current.attack*t*op.scale;break;
     case 'rotateEnemy':{const q={...target.current};target.current.attack=q.magic;target.current.defense=q.attack;target.current.hp=q.defense;target.current.magic=q.hp;break;}
     case 'sacrificeHp':{const loss=actor.current.hp*op.fraction;actor.current.hp-=loss;actor.current.attack+=loss*op.attackScale;break;}
     case 'damageTakenBoost':actor.current.attack+=(actor.initial.hp-actor.current.hp)*op.scale*t;break;
     case 'sharedMagicHit':{const val=(actor.current.magic+target.current.magic)*op.fraction;target.current.defense-=val;target.current.hp-=val;break;}
     case 'transferExcess':{const value=f.current[op.fromStat];if(value>=op.minRemain){const excess=value-op.minRemain;f.current[op.fromStat]=op.minRemain;f.current[op.toStat]+=excess;}break;}
     case 'magicToAttack':{const delta=actor.current.magic-1;actor.current.magic=1;actor.current.attack+=delta*op.multiplier;break;}

     case 'tempMultiply':for(const st of op.stats){const old=f.current[st];f.current[st]*=op.value;tempUndo.push({f,st,delta:f.current[st]-old});}break;
     case 'tempSet':{const old=f.current[op.stat];f.current[op.stat]=originalGet(op.ref)*op.scale;tempUndo.push({f,st:op.stat,delta:f.current[op.stat]-old});break;}
     case 'evade':evading.add(s);break;
     case 'chanceEvade':if(roll(b)<op.p)evading.add(s);break;
     case 'confuse':confused.add(opp(s));break;
     case 'reflect':reflecting.add(s);break;
     case 'damageLastHit':target.current.hp-=lastHits[s]*op.scale;break;
     case 'reduceEnemyDefenseLastHit':target.current.defense-=lastHits[s]*(op.scale||1);break;
     case 'boostDefenseLastHit':actor.current.defense+=lastHits[s];break;
     case 'thresholdSet':for(const st of op.stats)if(f.current[st]>=op.threshold)f.current[st]=op.value;break;
     case 'stealExcessInitial':for(const st of op.stats){const surplus=Math.max(0,target.current[st]-target.initial[st]);target.current[st]-=surplus;actor.current[st]+=surplus;}break;
     case 'sacrificeStatToHp':for(const st of op.stats){const remainder=actor.current[st]-op.remain;actor.current[st]=op.remain;actor.current.hp+=remainder;}break;
     case 'secondHighestDebuff':{const sorted=STAT.map(st=>actor.current[st]).sort((x,y)=>y-x),value=sorted[1];for(const st of ['attack','defense','magic'])target.current[st]-=value;break;}
     case 'rankDamage':{const rank=externalNumber(s,op.external);if(!b.complete)target.current.hp-=Math.max(0,op.origin-rank);break;}
     case 'higherLowerHeal':{const hi=Math.max(actor.current.attack,actor.current.magic),lo=Math.min(actor.current.attack,actor.current.magic);actor.current.hp+=hi/2;actor.current.defense+=lo/2;break;}
     case 'stealHighestToDefense':{let st=STAT[0];for(const k of STAT)if(target.current[k]>target.current[st])st=k;const value=target.current[st]*op.fraction;target.current[st]-=value;actor.current.defense+=value;break;}
     case 'setEnemyHighest':{let st=STAT[0];for(const k of STAT)if(target.current[k]>target.current[st])st=k;target.current[st]=op.value;break;}
     case 'swapHighestLowest':{const targetF=op.who==='enemy'?target:actor;let hi=STAT[0],lo=STAT[0];for(const k of STAT){if(targetF.current[k]>targetF.current[hi])hi=k;if(targetF.current[k]<targetF.current[lo])lo=k;}const temp=targetF.current[hi];targetF.current[hi]=targetF.current[lo];targetF.current[lo]=temp;break;}
     case 'resetAllEnemyStats':for(const st of STAT)target.current[st]=target.initial[st];break;
     case 'forceFirst':if(t+op.targetOffset<=6)b.forcedFirst[t+op.targetOffset]=s;break;
     case 'blockEnemyAttackFuture':for(let i=t+op.start;i<=Math.min(6,t+op.start+op.turns-1);i++)b.blockedAttacks[opp(s)].add(i);break;
     case 'randomStatTriple':{const st=['attack','defense','magic'][Math.floor(roll(b)*3)];actor.current[st]*=3;break;}
     case 'shuffleEnemyStats':{const vals=STAT.map(st=>target.current[st]);for(let i=vals.length-1;i>0;i--){const j=Math.floor(roll(b)*(i+1));[vals[i],vals[j]]=[vals[j],vals[i]];}STAT.forEach((st,i)=>target.current[st]=vals[i]);break;}
     case 'randomStatAdd':for(const st of op.stats)f.current[st]+=op.values[Math.floor(roll(b)*op.values.length)];break;
     case 'instantKillChance':if(roll(b)<op.p)target.current.hp=0;else if(op.failOps)for(const sub of op.failOps)if(sub.op==='multiply')for(const st of sub.stats)actor.current[st]*=sub.value;break;
     case 'instantKillChanceFromDP':{const dp=deckDp(opp(s),t-1);if(b.complete)break;if(roll(b)<Math.min(1,dp*op.perDP))target.current.hp=0;break;}
     case 'whenHour':{const hour=externalNumber(s,'startHour');if(b.complete)break;if(op.hours.includes(hour))simpleSubops(op.ops);break;}
     case 'whenAllDeckAttr':{const all=b.original[s].filter(Boolean);if(all.length&&all.every(key=>getDevAttr(key)===op.attr))simpleSubops(op.ops);break;}
     case 'attributeKindsBoost':{const kinds=new Set(b.original[s].filter(Boolean).map(getDevAttr));if(kinds.has(null)){markUnknown('属性未登録のデビルがある');break;}const n=kinds.size;if(n>=1&&n<=6)actor.current[op.stat]*=1+op.table[n-1];break;}
     case 'deckCountBoost':{const count=b.original[s].filter(key=>key&&getDevAttr(key)===op.attr).length;actor.current[op.stat]+=actor.current[op.stat]*count*op.scale;break;}
     case 'dpCompareBoost':{const me=deckDpTotal(s),you=deckDpTotal(opp(s));if(b.complete)break;const change=me*(you>me?100:10);for(const st of STAT)actor.current[st]+=change;break;}
     case 'assistCountBoost':{const count=externalNumber(s,'assistCount');if(b.complete)break;const percent=count>=100?4:count>=80?3:count>=60?2:count>=40?1:count>=20?.5:.3;for(const st of op.stat)actor.current[st]*=(1+percent);break;}
     case 'assistCompareEvade':{const own=externalNumber(s,'assistCount'),other=externalNumber(opp(s),'assistCount');if(b.complete)break;if(own>=other){actor.current.defense*=.5;actor.current.attack*=4;}else{actor.current.attack*=.5;actor.current.defense*=4;}evading.add(s);break;}
     case 'darkDeckDestroyCount':{const count=b.tables[opp(s)].filter(key=>key&&getDevAttr(key)==='闇').length;if(count===0){actor.current.defense=1;}else for(let i=t-1;i<Math.min(6,t-1+count);i++)b.tables[opp(s)][i]=null;break;}
     case 'reduceDamage':{b.damageReduction??=[];b.damageReduction.push({side:s,from:t,until:t+op.turns-1,fraction:op.fraction});break;}
     case 'reviveOnce':{b.reviveCharges??={player:0,enemy:0};b.reviveCharges[s]++;break;}
     case 'resetEnemyAttack':target.current.attack=target.initial.attack;break;
     case 'repeatPrevious':{if(t>1){const key=b.tables[s][t-2];if(key)fire(s,key,{source:'前ターン再発動',depth:depth+1});}break;}
     case 'registerEndOfTurnStatGrowth':{b.statGrowth??=[];const [wh,st]=op.stat.includes('.')?op.stat.split('.'):['self',op.stat];b.statGrowth.push({source:s,target:wh==='enemy'?opp(s):s,stat:st,amount:originalGet(op.ref)*op.scale,from:t});break;}
     case 'chanceMagicConfuse':if(roll(b)<op.p){confused.add(opp(s));b.magicUntil=Math.max(b.magicUntil,t);}break;
     case 'magicOrDestroy':if(actor.current.magic>=target.current.magic)b.magicUntil=Math.max(b.magicUntil,t+2);else for(let i=t;i<=Math.min(5,t+1);i++)b.tables[opp(s)][i]=null;break;
     case 'firstOrSecondBuff':if(first===s){actor.current.attack*=6;actor.current.defense*=.1;}else for(const i of [t+1,t+2])if(i<=6)b.forcedFirst[i]=s;break;
     case 'sacrificeHp':{const loss=actor.current.hp*op.fraction;actor.current.hp-=loss;actor.current.attack+=loss*op.attackScale;break;}
     case 'equipmentSubtractScaled':for(const st of ['attack','defense','magic'])target.current[st]-=actor.activeEquipment[st]*op.fraction;break;
     case 'randomChoice':simpleSubops(roll(b)<op.p?op.opsA:op.opsB);break;
     case 'attackAgain':{const m=prev.estimateDamage(actor.current.attack*op.scale,target.current.defense);if(!m.ok){markUnknown('追撃ダメージ未計算');break;}target.current.hp-=m.damage;emit('attack',`${dev.name}の追加攻撃！ ${target.name}に${fstr(m.damage)}のダメージ〔補間〕`);break;}
     case 'extraAttackAtEnd':{const m=prev.estimateDamage(actor.current.attack*op.scale,target.current.defense);if(!m.ok){markUnknown('追加攻撃の式が未計算');break;}target.current.hp-=m.damage;emit('attack',`${dev.name}の終了時追撃！ ${target.name}に${fstr(m.damage)}のダメージ〔補間〕`);break;}
     case 'coppeliaDoll':{const isLatest=externalBool(s,'dollLatest');if(b.complete)break;if(isLatest){for(const st of ['attack','defense'])actor.current[st]+=actor.activeEquipment[st]*2;}else{const stolen=target.current.attack*.3;target.current.attack-=stolen;actor.current.attack+=stolen;}break;}
     case 'stealNextDevil':markUnknown('デビル奪取・再発動の仕様が未検証');break;
     case 'fenrirRandomAttack':markUnknown('10匹出現時の追加攻撃倍率が未記載');break;

     case 'chanceSwap':if(roll(b)<op.p){const [wa,sa]=op.first.split('.'),[wb,sb]=op.second.split('.'),p=who(wa),q=who(wb),v=p.current[sa];p.current[sa]=q.current[sb];q.current[sb]=v;}break;
     case 'magicHit':{const h=prev.estimateDamage(actor.current.magic,target.current.magic);if(!h.ok){markUnknown('魔力攻撃の式を計算できない');break;}target.current.hp-=h.damage;emit('attack',`${dev.name}の魔力攻撃：${fstr(h.damage)}ダメージ〔仮式〕`);break;}
     case 'assistThreshold':{const n=externalNumber(s,'assistTotal');if(b.complete)break;if(n>=501)target.current.attack=externalNumber(s,'assistAttack');else actor.current.hp*=.1;break;}
     case 'chanceMagic':if(roll(b)<op.p)b.magicUntil=Math.max(b.magicUntil,t+op.turns-1);break;
     case 'whenEnemyAttr':if(op.attrs.includes(getDevAttr(b.tables[opp(s)][t-1])))simpleSubops(op.ops);break;
     case 'ifPreviousDevil':{const k=t>1?b.original[s][t-2]:null;simpleSubops(k&&D[k].name.replace(/^[○◎]/,'')===op.name?op.then:op.otherwise);break;}
     case 'orderHighestBuff':{const top=Math.max(...STAT.map(k=>target.current[k]));if(first===s)actor.current.defense=top*2;else actor.current.attack=top*2;break;}
     case 'magicCompareSwapHp':if(actor.current.magic>target.current.magic){const v=actor.current.hp;actor.current.hp=target.current.hp;target.current.hp=v;}else if(actor.current.magic<target.current.magic)actor.current.hp*=.7;else markUnknown('同魔力時オリアス挙動不明');break;
     case 'cancelMagic':b.magicUntil=t-1;break;
     case 'whenSelfGreater':if(actor.current[op.stat]>target.current[op.stat])simpleSubops(op.ops);break;
     case 'selfMinToEnemyMax':{let st=STAT[0];for(const k of STAT)if(actor.current[k]<actor.current[st])st=k;actor.current[st]=Math.max(...STAT.map(k=>target.current[k]));break;}
     case 'destroyAllEnemyAttr':{let n=0;for(let i=0;i<6;i++){const k=b.tables[opp(s)][i];if(k&&op.attrs.includes(getDevAttr(k))){b.tables[opp(s)][i]=null;n++;}}if(n&&op.noAttackIfSuccess)disabled.add(s);break;}
     case 'absorbNormalAttack':b.absorbing??=new Set();b.absorbing.add(s);break;
     case 'chanceBlockEnemyAttack':if(roll(b)<op.p)disabled.add(opp(s));break;
     case 'baseDefenseCompareAbsorb':if(actor.base.defense>target.base.defense){b.absorbing??=new Set();b.absorbing.add(s);}break;
     case 'swapSelfMinEnemyMax':{let lo=STAT[0],hi=STAT[0];for(const k of STAT){if(actor.current[k]<actor.current[lo])lo=k;if(target.current[k]>target.current[hi])hi=k;}const v=actor.current[lo];actor.current[lo]=target.current[hi];target.current[hi]=v;break;}
     case 'incubusStatChange':{const a=Math.min(...STAT.map(k=>actor.current[k])),z=Math.min(...STAT.map(k=>target.current[k]));if(a===z){markUnknown('最低ステータス同値の処理未確認');break;}const w=a<z?actor:target;let k=STAT[0];for(const st of STAT)if(w.current[st]>w.current[k])k=st;w.current[k]=Math.min(...STAT.map(st=>w.current[st]));break;}
     case 'genderConditional':{const a=ext[s]?.gender,z=ext[opp(s)]?.gender;if(!a||!z){markUnknown('性別入力が必要');break;}if(a===z)actor.current.attack+=actor.current.defense*2;else disabled.add(opp(s));break;}
     case 'stealAssistStats':for(const st of STAT){const v=externalNumber(opp(s),'assist_'+st);if(b.complete)break;target.current[st]-=v;actor.current[st]+=v;}break;
     case 'tsumaNaberius':if(actor.current.hp<actor.initial.hp)target.current.hp-=(actor.initial.hp-actor.current.hp);else if(actor.current.hp>actor.initial.hp)actor.current.hp*=.1;break;
     case 'cheshireCat':{const who=ext.initiator;if(who===undefined){markUnknown('仕掛けた側を外部入力');break;}if(who===s){disabled.add(s);disabled.add(opp(s));if(t<6){b.tables[s][t]=null;b.tables[opp(s)][t]=null;}}else{const p={...actor.current},q={...target.current};for(const st of ['attack','defense','magic']){const v=Math.floor((p[st]+q[st])*.5);actor.current[st]=v;target.current[st]=v;}}break;}
     case 'farinishMagicBoost':for(const side of [s,opp(s)])if(b.original[side].some(k=>k&&D[k].name.replace(/^[○◎]/,'')==='ファリニシュ'))actor.current.magic*=1.5;break;
     case 'titaniaWaterFire':{const a=b.original[s].filter(k=>k&&D[k].name!=='タイタニア'&&getDevAttr(k)==='水').length,z=b.original[opp(s)].filter(k=>k&&getDevAttr(k)==='火').length;actor.current.hp+=a*500;target.current.hp-=z*500;break;}
     case 'oberonTime':{const hour=externalNumber(s,'startHour'),init=ext.initiator;if(b.complete)break;if(init===undefined){markUnknown('仕掛けた側を設定');break;}if(init===s&&(hour===8||hour===15))for(const st of STAT)actor.current[st]*=2.5;break;}
     case 'catSidhe':{target.current.hp-=Math.min(...STAT.map(k=>actor.base[k]))*1.5;const i=b.tables[opp(s)].findIndex(k=>k&&D[k].name==='マウ・ビート');if(i>=0){b.tables[opp(s)][i]=null;for(const st of STAT){const v=target.current[st]/3;target.current[st]-=v;actor.current[st]+=v;}}break;}
     case 'mastimaBeelzebub':if(b.tables[opp(s)].some(k=>k&&D[k].name==='ベルゼブブ')){b.tables[opp(s)]=b.tables[opp(s)].map(k=>k&&D[k].name==='ベルゼブブ'?null:k);b.tables[s]=[...b.original[s]];}break;
     case 'enemyAttackToHp':if(target.current.attack>=op.minRemain){const v=target.current.attack-op.minRemain;target.current.attack=op.minRemain;target.current.hp+=v;}break;
     case 'randomEnemyBaseToHp':{const st=STAT[Math.floor(roll(b)*4)],v=target.base[st];actor.current.hp+=v;target.current[st]-=v;break;}
     case 'secondLowestDebuff':{const values=STAT.map(k=>actor.current[k]).sort((a,b)=>a-b),v=values[1];for(const st of ['attack','defense','magic'])target.current[st]-=v;break;}
     case 'mandragoraFirstSecond':if(first===s)actor.current.defense*=2;else{b.tables[opp(s)][t-1]=null;actor.current.defense*=4;}break;
     case 'setEnemyInitialMagic':target.initial.magic=op.value;break;
     case 'destroyBothDevilsForTurns':for(let i=t-1;i<Math.min(6,t-1+op.turns);i++){b.tables.player[i]=null;b.tables.enemy[i]=null;}break;
     case 'addOwnTotalDpToStat':actor.current[op.stat]+=deckDpTotal(s)*op.multiplier;break;
     case 'externalLvDpDamage':{const lv=externalNumber(s,'level');if(!b.complete)target.current.hp-=lv*deckDpTotal(s)*t/3;break;}
     case 'cureReflectConfuse':if(reflecting.has(opp(s))&&confused.has(s)){reflecting.delete(opp(s));confused.delete(s);}break;
     case 'ifMagicActiveThen':if(t<=b.magicUntil)simpleSubops(op.ops);break;
     case 'stealEquipmentHalf':for(const st of STAT){const v=target.activeEquipment[st]*.5;target.activeEquipment[st]-=v;target.current[st]-=v;actor.current[st]+=v;}break;
     case 'magicRatioForceFirst':if(actor.current.magic>target.current.magic&&target.current.magic>0){const n=Math.min(6-t,Math.floor(actor.current.magic/target.current.magic));for(let i=1;i<=n;i++)b.forcedFirst[t+i]=s;}break;
     case 'deckCountAttackBoost':{let n=0;for(const side of op.sides==='both'?[s,opp(s)]:[s])n+=b.original[side].filter(k=>k&&getDevAttr(k)===op.attr).length;actor.current.attack*=1+n*op.scale;break;}
     case 'shamshelDp':{const dp=deckDp(opp(s),t-1);if(b.complete)break;if(dp>=2)b.tables[opp(s)][t-1]=null;if(dp>=3)actor.current.attack*=dp===3?1.5:2;if(dp>=5&&t<6)b.tables[opp(s)][t]=null;break;}
     case 'copyEnemyPositiveBoosts':for(const st of STAT)actor.current[st]+=Math.max(0,target.current[st]-target.initial[st]);break;
     case 'enemyTotalDpDamage':target.current.hp-=deckDpTotal(opp(s))*op.scale;break;
     case 'restoreRemovedDevils':for(let i=0;i<6;i++)if(!b.tables[s][i]&&b.original[s][i])b.tables[s][i]=b.original[s][i];break;
     case 'deckCountDamage':{const side=op.side==='enemy'?opp(s):s;target.current.hp-=b.original[side].filter(k=>k&&getDevAttr(k)===op.attr).length*op.scale;break;}
     case 'setTwoLowestSelf':{const v=STAT.map(k=>({k,n:actor.current[k]})).sort((a,b)=>a.n-b.n);actor.current[v[0].k]=op.value;actor.current[v[1].k]=op.value;break;}
     case 'nanaAttrDestroyDamage':{let n=0;for(let i=0;i<6;i++)if(b.tables[opp(s)][i]&&getDevAttr(b.tables[opp(s)][i])==='火'){b.tables[opp(s)][i]=null;n++;}const a=b.original[s].filter(k=>k&&getDevAttr(k)==='水').length;target.current.hp-=(n+a)*1000;break;}
     case 'attackHalfToEnemyAndConfuse':{const v=actor.current.attack*.5;actor.current.attack-=v;target.current.attack+=v;confused.add(opp(s));break;}
     case 'swapEquipmentStats':for(const st of STAT){const a=actor.activeEquipment[st],z=target.activeEquipment[st];actor.activeEquipment[st]=z;target.activeEquipment[st]=a;actor.current[st]+=z-a;target.current[st]+=a-z;}break;
     case 'harmonicsComparison':{const a=externalNumber(s,'harmonics'),z=externalNumber(opp(s),'harmonics');if(b.complete)break;if(a>z)actor.current.attack+=(a-z)*100;else actor.current.attack*=1.5;break;}
     case 'nameLengthCompare':{const a=b.original[s][0],z=b.original[opp(s)][0];if(!a||!z){markUnknown('双方の1Tデビル名が必要');break;}const al=Array.from(D[a].name).length,zl=Array.from(D[z].name).length;for(const person of al>=zl?[actor]:[actor,target])for(const st of STAT)person.current[st]*=al>=zl?3:2;break;}
     case 'goldCompareBuff':{const a=externalNumber(s,'gold'),z=externalNumber(opp(s),'gold');if(b.complete)break;if(a>=z){const v=STAT.map(k=>({k,n:actor.current[k]})).sort((x,y)=>y.n-x.n);for(const x of v.slice(0,2))actor.current[x.k]*=2;}else for(const st of ['attack','defense','magic'])actor.current[st]=actor.initial[st];break;}
     case 'magicHalfAllStats':{const v=actor.current.magic*.5;for(const st of STAT)actor.current[st]+=v;break;}
     case 'assistCompareDestroyNext':{const a=externalNumber(s,'assistTotal'),z=externalNumber(opp(s),'assistTotal');if(!b.complete&&a>z&&t<6)b.tables[opp(s)][t]=null;break;}
     case 'clearEnemyForcedFirst':for(const k of Object.keys(b.forcedFirst))if(Number(k)>t&&b.forcedFirst[k]===opp(s))delete b.forcedFirst[k];break;
     case 'damageThisTurnDouble':target.current.hp-=turnReceived[s]*2;break;
     case 'stealHpToAttack':{const v=target.current.hp*op.fraction;target.current.hp-=v;actor.current.attack+=v;break;}
     case 'externalScaledAdd':actor.current[op.stat]+=externalNumber(s,op.key)*op.scale;break;
     case 'externalRankBoost':actor.current[op.stat]+=Math.max(0,op.origin-externalNumber(s,op.key));break;
     case 'multiplyEquipmentBonus':{const v=actor.activeEquipment[op.stat]*(op.factor-1);actor.activeEquipment[op.stat]*=op.factor;actor.current[op.stat]+=v;break;}
     case 'highestStealToHp':{let k=STAT[0];for(const st of STAT)if(target.current[st]>target.current[k])k=st;const v=target.current[k]*op.fraction;target.current[k]-=v;actor.current.hp+=v;break;}
     case 'mandragoraEarth':{let n=0;for(let i=0;i<6;i++)if(b.tables[opp(s)][i]&&getDevAttr(b.tables[opp(s)][i])==='土'){b.tables[opp(s)][i]=null;n++;}if(n)actor.current.defense*=3;else actor.current.hp*=.6;break;}
     case 'shamshelVariantDp':{const dp=deckDp(opp(s),t-1);if(b.complete)break;if(dp===3)b.tables[opp(s)][t-1]=null;else if(dp===4){target.current.defense=target.current.magic*.5;actor.current.attack*=3;}else if(dp>=5){b.tables[opp(s)][t-1]=null;if(t<6)b.tables[opp(s)][t]=null;actor.current.attack*=3;}break;}
     case 'ifEnemyAttrSteal':if(op.attrs.includes(getDevAttr(b.tables[opp(s)][t-1])))for(const st of op.stats){const v=target.current[st]*op.fraction;target.current[st]-=v;actor.current[st]+=v;}break;
     case 'stealEnemyAllToAttack':{let sum=0;for(const st of STAT){const v=target.current[st]*op.fraction;target.current[st]-=v;sum+=v;}actor.current.attack+=sum;break;}
     case 'stealEnemyAllToHp':{let sum=0;for(const st of STAT){const v=target.current[st]*op.fraction;target.current[st]-=v;sum+=v;}actor.current.hp+=sum;break;}
     case 'dpBasedHpBoost':actor.current.hp+=actor.current.attack*deckDpTotal(opp(s))*.1;break;
     case 'stealEnemyMagicToHp':{const v=target.current.magic*op.fraction;target.current.magic-=v;actor.current.hp+=v;break;}
     case 'startMagic':b.magicUntil=Math.max(b.magicUntil,t+op.turns-1);break;
     case 'ifSelfMagicBelow':if(actor.current.magic<op.limit)simpleSubops(op.ops);break;

     case 'libraLevel':{const a=externalNumber(s,'level'),z=externalNumber(opp(s),'level');if(b.complete)break;const v=(z-a)*400+3000,preferred=ext[opp(s)]?.preferredAssistStat;if(preferred&&STAT.includes(preferred))target.current[preferred]+=v;else{let st=STAT[0];for(const k of STAT)if(actor.current[k]>actor.current[st])st=k;actor.current[st]+=v;}break;}
     case 'ojiNaberius':{const v=Math.max(...STAT.map(k=>target.current[k]))*.5,preferred=ext[s]?.preferredAssistStat;if(preferred&&STAT.includes(preferred))actor.current[preferred]+=v;else{let st=STAT[0];for(const k of STAT)if(actor.current[k]>actor.current[st])st=k;actor.current[st]+=v;}break;}
     case 'scheduleDeathCurse':{b.deathCurses??=[];b.deathCurses.push({due:t+op.offset,target:opp(s),source:s});break;}
     case 'nemissaHarmonics':{const v=externalNumber(s,'harmonics');if(b.complete)break;if(ext.initiator!==s){markUnknown('ネミッサ：仕掛けた側の外部設定が必要');break;}target.current.hp-=Math.max(0,v-100)*4;break;}
     case 'deletedDevilCountBoost':{let count=0;for(const side of ['player','enemy'])for(let i=0;i<6;i++)if(b.original[side][i]&&!b.tables[side][i])count++;if(count){actor.current.attack*=1+count;actor.current.magic*=1+count;}break;}
     case 'cureStatuses':confused.delete(s);reflecting.delete(opp(s));b.sustained=b.sustained.filter(e=>e.target!==s);break;
     case 'registerEnemyAllStatDrain':{const amount=actor.current.magic*op.fraction;b.statGrowth??=[];for(const st of STAT)b.statGrowth.push({source:s,target:opp(s),stat:st,amount:-amount,from:t});break;}
     case 'moiraConditional':{let found=false;for(let i=0;i<6;i++){const k=b.tables[opp(s)][i];if(k&&['死','ガミジン','デコラ・フォルター'].includes(D[k].name.replace(/^[○◎]/,''))){b.tables[opp(s)][i]=null;found=true;}}if(found){if(roll(b)<.5)target.current.hp=0;}else actor.current.magic*=1.5;break;}
     case 'kikimora':for(const st of ['attack','defense','magic']){const extra=Math.max(0,target.current[st]-target.initial[st]),missing=Math.max(0,actor.initial[st]-actor.current[st]);actor.current[st]+=extra;target.current[st]-=missing;}break;
     case 'destroyByAttrAndBoost':{let count=0;for(let i=0;i<6;i++){const k=b.tables[opp(s)][i];if(k&&getDevAttr(k)===op.attr){b.tables[opp(s)][i]=null;count++;}}actor.current.attack*=1+count*op.scale;break;}
     case 'swapSelfMinEnemyStat':{let st=STAT[0];for(const k of STAT)if(actor.current[k]<actor.current[st])st=k;const v=actor.current[st];actor.current[st]=target.current[op.stat];target.current[op.stat]=v;break;}
     case 'assistMultiplier':for(const side of [s,opp(s)]){const p=b.fighters[side],factor=side===s?op.self:op.enemy;for(const st of STAT){const v=p.assist[st]*(factor-1);p.assist[st]*=factor;p.current[st]+=v;}}break;
     case 'nightstalkDeck':{const dark=b.original[s].filter(k=>k&&getDevAttr(k)==='闇').length,light=b.original[opp(s)].filter(k=>k&&getDevAttr(k)==='光').length;actor.current.attack*=1+dark*.5;actor.current.defense*=1+light*.5;break;}
     case 'nightmareOwnRemoveDp':{let total=0;for(let i=0;i<6;i++){const k=b.tables[s][i];if(k&&k!==key){total+=Number(D[k].dp||0);b.tables[s][i]=null;}}actor.current.attack*=1+total;break;}
     case 'gentlemanRotate':{const k=b.tables[opp(s)][t-1];if(k&&D[k].name===dev.name){if(!duelHandled.has(dev.name)){duelHandled.add(dev.name);if(op.variant==='normal'){disabled.add(s);disabled.add(opp(s));actor.current.hp+=500;target.current.hp+=500;}else{disabled.add(s);disabled.add(opp(s));actor.current.attack+=5000;target.current.attack+=5000;}}}else{const old=[...b.tables[opp(s)]];b.tables[opp(s)]=[...old.slice(3),...old.slice(0,3)];if(op.variant==='sword'){const g=ext[opp(s)]?.gender;if(g==='male')actor.current.attack*=1.5;else if(g==='female')target.current.defense*=1.5;else markUnknown('剣ジェントルマン：相手性別入力が必要');}}break;}
     case 'icarusExternal':{const floor=externalNumber(s,'maxFloor');if(b.complete)break;const fire=getDevAttr(b.tables[opp(s)][t-1])==='火';for(const st of STAT)actor.current[st]+=floor*(fire?-15:30);break;}
     case 'johnGoalSpecial':{const enemyKey=b.tables[opp(s)][t-1],special=enemyKey&&D[enemyKey].name==='マシュー・ホプキンス';if(special||actor.current.magic<10){const k=special?3:2;for(const st of ['attack','defense','magic'])target.current[st]-=actor.base.magic*k;}break;}
     default:markUnknown('未対応の図鑑数値演算：'+op.op);
    }
    if(outcome())break;
   }
   emit('effect',`${dev.name}：図鑑記述に基づく計算モデルを適用（端数処理・未観測条件は未確定）`,{rule:key,sourceLevel:'description'});
   if(rule.comment)emit('caveat',`${dev.name}：${rule.comment}`);
   return;
  }
  switch(key){
   case 'kamael':{
    const amount=integral(actor.current.magic*0.5);
    boost('attack',amount);b.blockedDevils[opp(s)].add(t+1);
    emit('effect',`カマエル：攻撃力+${fstr(amount)}、相手${t+1}Tのデビル発動を阻止`);break;
   }
   case 'balam':{
    const amount=actor.current.magic*0.4;
    boost('defense',amount);b.blockedDevils[opp(s)].add(t+1);
    emit('effect',`バラム：守備力+${fstr(amount)}、相手${t+1}Tのデビル発動を阻止`);break;
   }
   case 'hexennacht':{
    const amount=integral(actor.current.magic*0.5);
    boost('attack',amount);
    const perTurn=Math.floor(target.initial.hp*0.3);
    const exists=b.sustained.some(e=>e.source===s&&e.target===opp(s)&&e.key===key);
    if(!exists)b.sustained.push({source:s,target:opp(s),key,damage:perTurn,fromTurn:t});
    emit('effect',`ヘクセンナハト：攻撃力+${fstr(amount)}。毎ターン${fstr(perTurn)}ダメージ（${exists?'再発動でも継続効果は重複しない':'継続効果を登録'}）`);
    break;
   }
   case 'eligos':{
    const amount=Math.floor(actor.current.attack*1.5);
    boost('attack',amount);emit('effect',`エリゴス：攻撃力+${fstr(amount)}（現攻撃力の150％、端数切捨て・実測1条件）`);break;
   }
   case 'skuld':{
    const difference=target.current.hp-target.initial.hp;
    if(difference>0){boost('defense',difference);emit('effect',`スクルド：敵体力増加分${fstr(difference)}を自身の守備力に加算`);}
    else if(difference<0){const before=actor.current.hp;actor.current.hp=Math.ceil(before/2);emit('effect',`スクルド：敵体力減少により自身の体力を半減（${fstr(before)}→${fstr(actor.current.hp)}）。ネモフィラ常駐阻止は未実装`);outcome();}
    else emit('effect','スクルド：敵体力が初期値と同一のため変化なし（ネモフィラ常駐阻止は未実装）');
    break;
   }
   case 'baal':{
    const up=actor.current.attack*2;const down=Math.floor(target.current.defense*0.3);
    boost('attack',up);target.current.defense-=down;
    emit('effect',`バアル：自身の攻撃力+${fstr(up)}、相手の守備力-${fstr(down)}（実測条件に基づく暫定実装）`);break;
   }
   case 'troll':{
    const side=opp(s),prev=[...b.tables[side]];
    b.tables[side]=[null,...prev.slice(0,5)];
    if(prev[5])b.truncations.push({turn:t,side,devil:prev[5]});
    emit('effect',`トロール：${b.fighters[side].name}の六枠を1ターン遅延（押出：${prev[5]?D[prev[5]].name:'なし'}）`);break;
   }
   case 'beelzebub':{
    const side=opp(s);b.tables[side].reverse();emit('effect',`ベルゼブブ：${b.fighters[side].name}の現在の六枠を反転`);break;
   }
   case 'laplace':case 'vine':{
    const index=key==='vine'?t-2:c.laplaceTarget-1;
    const recalled=index>=0?b.tables[s][index]:null;
    if(key==='vine'&&recalled==='brauna'){
     const msg='ヴィネ→ブラウナ再発動連鎖の内部参照は未確定。架空の再発動ログを防ぐため停止';
     if(c.mode==='full'){b.error=msg;b.outcome='undetermined';b.complete=true;emit('unknown',msg);return;}
     emit('caveat',msg);return;
    }
    emit('effect',`${dev.name}：${index+1}Tの${recalled?D[recalled].name:'空欄'}を参照`);
    if(!recalled)break;
    const phase=D[recalled].phase;
    if(phase==='start')fire(s,recalled,{source:dev.name,depth:depth+1,sourceSlot:t-1});
    else{
     b.pending.push({turn:t,side:s,key:recalled,phase,sourceKey:key,sourceSlot:t-1});
     emit('effect',`${D[recalled].name}の${phase==='before'?'攻撃前':phase==='after'?'攻撃後':'終了時'}実行を予約（取消条件は仮説）`);
    }
    break;
   }
   case 'rabbit':{
    for(const k of STAT)boost(k,2.5*actor.base[k]);
    b.tables[opp(s)][t-1]=null; // 対戦相手当ターンの枠を消滅
    emit('effect',`素ステータス×2.5を四能力へ加算。相手当ターンのデビルを消滅`);break;
   }
   case 'narcissus':{
    for(const k of STAT)boost(k,2*actor.base[k]);disabled.add(opp(s));
    emit('effect',`素ステータス×2を四能力へ加算。相手の通常攻撃を封じる`);break;
   }
   case 'chlorissa':{
    if([s,opp(s)].some(id=>STAT.some(k=>b.fighters[id].activeEquipment[k]!==b.fighters[id].equipment[k]))){
     b.error='クロリッサ×ナパイア／ブランド系の装備無効化後リセットは実戦未確認。安全停止';b.outcome='undetermined';b.complete=true;emit('unknown',b.error);
     return;
    }
    for(const side of [s,opp(s)])for(const k of ['attack','defense','magic'])b.fighters[side].current[k]=b.fighters[side].initial[k];
    endTurn=true;emit('effect','クロリッサ：両者の攻撃・守備・魔力を初期値へ。残りのターン処理を強制終了');break;
   }
   case 'kings_wind_gremory':{
    suppressed.add(opp(s));actor.current.attack=actor.current.magic*2.5;
    emit('effect',`グレモリー：敵の当ターン発動を封じ、攻撃力を${fstr(actor.current.attack)}に設定`);break;
   }
   case 'freya':{
    disabled.add(s);harm(target,Math.max(target.current.attack,target.current.magic),`${target.name}へのフレイヤ直接ダメージ`);break;
   }
   case 'red_folter':{
    equipmentNeutralize(target,'フォルター夫妻');
    if(!b.complete&&t<6){b.tables[opp(s)][t]=null;emit('effect',`フォルター夫妻：相手${t+1}Tのデビル枠を消去`);}break;
   }
   case 'odradek':{
    if(target.activeEquipment.magic<=5000){target.current.attack=1;target.current.defense=1;emit('effect','オドラデク：敵の攻撃力・守備力を1に設定');}
    else emit('block',`オドラデク：敵の魔力装備${fstr(target.activeEquipment.magic)}が条件外`);break;
   }
   case 'hagenti':{
    for(const k of STAT)boost(k,actor.activeEquipment[k]);
    emit('effect','ハーゲンティ：現在有効な装備補正を追加（ウヴァル後は加算可、ナパイア／ブランド後は0）');break;
   }
   case 'sargatanas':{
    for(const k of STAT)boost(k,target.activeEquipment[k]);
    emit('effect','サルガタナス：敵の装備補正の数値を四能力へ加算');break;
   }
   case 'furcas':{
    const side=opp(s);b.tables[side][t-1]=null;if(t<6)b.tables[side][t]=null;
    actor.current.defense-=Math.floor(actor.current.defense*0.3);
    actor.current.hp-=Math.floor(actor.current.hp*0.3);
    emit('effect','フルカス：敵の当ターン・次ターンの枠を消滅。自身の守備・現在体力を約30％減少');outcome();break;
   }
   case 'purson':{
    evading.add(s);b.blockedAttacks[opp(s)].add(t+1);
    emit('effect','プルソン：本ターンの相手通常攻撃を回避（攻撃時デビルは別途発動）、相手の次ターン攻撃を禁止');break;
   }
   case 'abundia':{
    const difference=actor.current.defense-target.current.magic;
    if(difference>0)harm(target,difference,`アブンディア：敵の魔力との差による直接ダメージ`);
    else if(difference<0)harm(actor,-difference,`アブンディア：自分の守備力が低いため反動ダメージ`);
    else emit('effect','アブンディア：守備力と敵魔力が等しく、直接ダメージ0');
    break;
   }
   case 'abaddon':{
    const amount=actor.base.defense*0.4;
    target.current.attack-=amount;target.current.defense-=amount;
    emit('effect',`アバドン：素の守備力×40％＝${fstr(amount)}を敵攻撃力・守備力から減算（「元々」は素ステータスと解釈）`);break;
   }
   case 'matthew_hopkins':{
    suppressed.add(opp(s));target.current.magic=1;
    emit('effect','マシュー・ホプキンス：敵の魔力を1に設定。未発動の当ターン敵デビルを阻止（既発動は巻き戻さない）');break;
   }
   case 'beleth':{
    target.current.defense=target.current.magic*0.3;suppressed.add(opp(s));
    emit('effect',`党首ベレト：敵の守備力を現在魔力の30％＝${fstr(target.current.defense)}に設定。未発動の当ターン敵デビルを阻止`);break;
   }
   case 'spring_bridget':{
    suppressed.add(opp(s));
    if(t<6)b.forcedFirst[t+1]=s;
    emit('effect',`春ブリギット：当ターン敵デビルを阻止${t<6?'、'+(t+1)+'Tの先攻を予約':'（6Tのため次ターン予約なし）'}。同ターン後発ブリギットは予約を上書き`);break;
   }
   case 'newyear_ariel':{
    const v=target.current.magic;
    target.current.magic=actor.current.defense;actor.current.defense=v;
    if(t<6)b.blockedDevils[opp(s)].add(t+1);
    emit('effect',`謹賀新年・アリエル：敵魔力と自分守備力を交換。敵${t+1}Tのデビルを阻止`);break;
   }
   case 'diana':{
    const delta=actor.current.defense-target.current.defense;
    if(delta>0)harm(target,delta,'ディアーナ：守備力の差分を敵に与える');
    else if(delta<0)harm(actor,-delta,'ディアーナ：守備力の差分を自分が受ける');
    else emit('effect','ディアーナ：双方の守備力が等しく差分0');
    break;
   }
   case 'lucifer':{
    // Explicitly provisional: correction base, rounding, and deletion timing lack a confirmed combat log.
    const changes=[];
    for(const stat of ['attack','defense','magic']){
     const shortfall=Math.max(0,actor.initial[stat]-actor.current[stat]);
     if(shortfall>0){actor.current[stat]=actor.initial[stat];target.current[stat]-=shortfall*3;changes.push(`${LABEL[stat]}回復${fstr(shortfall)}・敵-${fstr(shortfall*3)}`);}
    }
    const removed=b.tables[opp(s)][t-1];b.tables[opp(s)][t-1]=null;
    emit('effect',`【仮】雪崩ルシファー：${changes.join('、')||'低下能力なし'}。敵の現在ターン枠${removed?'【'+D[removed].name+'】':'（空欄）'}を消去`);
    emit('caveat','【仮実装】元値との差×3で反撃・現在枠を即消去と解釈。原作の端数処理、発動済み能力への遡及、連鎖時の再参照は未検証');
    outcome();break;
   }
   case 'baphomet':{
    actor.current.attack=target.current.magic*2;actor.current.hp=target.current.magic;disabled.add(s);
    emit('effect','バフォメット：攻撃力を相手魔力×2、体力を相手魔力に設定。自身は攻撃不能');outcome();break;
   }
   case 'proserpina':{
    const src=b.tables[s][5],destination=b.tables[opp(s)][t];
    if(t>=6||!src||!destination){emit('effect','プロセルピナ：自分6Tまたは敵次ターンが空枠のため変更なし');break;}
    b.tables[opp(s)][t]=src;
    emit('effect',`プロセルピナ：敵${t+1}Tの${D[destination].name}を、自分6Tの${D[src].name}へ書き換え（再発動時も現在ターン基準）`);break;
   }
   case 'uval':{equipmentSubtract(target,STAT,'ウヴァル');break;}
   case 'uval_fata':{
    boost('attack',actor.current.defense);postAttackUvalFata.add(s);
    emit('effect','ウヴァル＆ファタ・モルガナ：自身の守備力を攻撃力へ加算。攻撃後に敵の攻撃・守備・魔力の元装備値を反復減算する予定');break;
   }
   case 'brand_folter':{equipmentNeutralize(target,'ブランド・フォルター');break;}
   case 'secret_brand_folter':{
    equipmentNeutralize(target,'密かに微笑むブランド・フォルター');b.blockedAttacks[opp(s)].add(t+1);break;
   }
   case 'napaiya':{
    equipmentNeutralize(actor,'ナパイア（自己装備）');
    target.current.attack=10;target.current.magic=10;
    disabled.add(s);disabled.add(opp(s));suppressed.add(s);suppressed.add(opp(s));
    emit('effect','ナパイア：相手攻撃・魔力を10に設定、このターン双方行動禁止（後続デビルも阻止）');outcome();break;
   }
   case 'agaliarept':{
    const delta=integral(actor.current.magic*0.5);boost('magic',delta);
    b.magicUntil=t+2;
    emit('effect',`アガリアレプト：魔力+${fstr(delta)}、${t}～${Math.min(6,t+2)}Tの双方の通常攻撃を魔力戦へ変更（魔力ダメージ式は暫定）`);break;
   }
   case 'jack_lore':{
    const r=roll(b);
    if(r<0.5){suppressed.add(opp(s));emit('effect',`ジャック・ロレ：分岐① 敵デビル発動を阻止〔乱数${r.toFixed(4)}〕`);}
    else{disabled.add(opp(s));b.magicUntil=Math.max(b.magicUntil,t);emit('effect',`ジャック・ロレ：分岐② 敵の通常攻撃禁止＋当ターン魔力戦〔乱数${r.toFixed(4)}〕`);}
    break;
   }
   case 'flauros_fleurety':{
    const stolen=Math.floor(target.current.hp*0.3);
    target.current.hp-=stolen;actor.current.hp+=stolen;
    confused.add(opp(s));disabled.add(s);
    emit('effect',`フルーレティ：敵の現在体力30％＝${fstr(stolen)}を吸収。このターン相手は混乱、自身は攻撃不能`);outcome();break;
   }
   case 'brauna':{
    const index=t-3,recalled=index>=0?b.tables[s][index]:null;
    if(recalled==='vine'||(recalled==='proserpina'&&b.blockedActivations[s].has(`${index+1}:proserpina`))){
     const msg='ブラウナ：ヴィネとの連鎖または初回阻止されたプロセルピナの再発動は未確認。安全停止';
     if(c.mode==='full'){b.error=msg;b.outcome='undetermined';b.complete=true;emit('unknown',msg);return;}
     emit('caveat',msg);return;
    }
    emit('effect',`ブラウナ：${index+1}Tの${recalled?D[recalled].name:'空欄'}を参照`);
    if(recalled)fire(s,recalled,{source:'ブラウナ',depth:depth+1,sourceSlot:t-1});break;
   }
   case 'shackled_magot':{
    const amount=integral(target.current.defense*0.4);
    target.current.attack-=amount;target.current.hp-=amount;
    disabled.add(s);disabled.add(opp(s));
    emit('effect',`枷から解き放たれたマゴト：敵の攻撃力・体力を各${fstr(amount)}減算、このターン双方攻撃不能`);outcome();break;
   }
   case 'ondine':{
    if(actor.current.defense<=50){emit('effect','オンディーナ：守備力50以下のため反射条件不成立');break;}
    reflecting.add(s);disabled.add(s);
    emit('effect','オンディーナ：このターンの相手通常攻撃ダメージを反射、自身は攻撃不可（特殊攻撃との競合は未検証）');break;
   }
   case 'blood_krampus':{
    const loss=Math.floor(Math.max(...STAT.map(k=>target.current[k]))/2);target.current.hp-=loss;
    actor.current.attack+=actor.current.attack;
    emit('effect',`クランプス：相手現在体力を${fstr(loss)}減少。自身の攻撃力を倍増`);outcome();break;
   }
   default:unsupported(key);
  }
 }
 function phase(s,p){
  if(b.complete||endTurn)return;
  if((p==='before'||p==='after')&&(disabled.has(s)||b.blockedAttacks[s].has(t)))return;
  if(p==='after'&&postAttackUvalFata.has(s)){
   postAttackUvalFata.delete(s);
   equipmentSubtract(b.fighters[opp(s)],['attack','defense','magic'],'ウヴァル＆ファタ・モルガナ（攻撃後）');
   if(b.complete)return;
  }
  // Original slot is re-read at phase time: mutations earlier in the turn matter.
  const current=b.tables[s][t-1];
  if(current&&D[current].phase===p)fire(s,current);
  // The pending queue represents an explicit recall; it is not an extra set-slot.
  const matches=b.pending.filter(x=>x.turn===t&&x.side===s&&x.phase===p);
  b.pending=b.pending.filter(x=>!(x.turn===t&&x.side===s&&x.phase===p));
  for(const x of matches){
   if(b.complete||endTurn)break;
   if(b.tables[s][x.sourceSlot]!==x.sourceKey){emit('block',`${D[x.key].name}：呼出元${D[x.sourceKey].name}の枠消滅/変更により予約取消（暫定モデル）`);continue;}
   fire(s,x.key,{source:`${D[x.sourceKey].name}からの予約`,sourceSlot:x.sourceSlot});
  }
 }
 if(b.deathCurses)for(const curse of b.deathCurses)if(curse.due===t){b.fighters[curse.target].current.hp=0;emit('effect','死の宣告が発動');outcome();}
 emit('turn',`第${t}ターン（${b.fighters[first].name}先攻）`);
 if(t<=b.magicUntil)emit('effect',`魔力戦継続中（${t}T）／両者に適用。通常ダメージ式の流用は仮式`);
 for(const s of order)phase(s,'start');
 if(!b.complete&&!endTurn)for(const s of order){
  phase(s,'before');if(b.complete||endTurn)break;
  if(c.mode==='trace'){emit('attack',`${b.fighters[s].name}：通常攻撃枠（数値未計算）`);}
  else if(disabled.has(s)||b.blockedAttacks[s].has(t))emit('block',`${b.fighters[s].name}は攻撃できない（攻撃時・攻撃後デビルも発動しない）`);
  else{
   const actor=b.fighters[s],target=b.fighters[opp(s)];let hit;
   const magical=t<=b.magicUntil,attack=magical?actor.current.magic:actor.current.attack,defense=magical?target.current.magic:target.current.defense;
   if(evading.has(opp(s))){emit('attack',`${actor.name}の${magical?'攻撃魔法':'攻撃'}！ しかし${target.name}は攻撃を回避した`);}
   else{
    if(c.damageMode==='observed'){
     const found=c.observedHits.find(x=>x.attacker===s&&((!magical&&(!x.kind||x.kind==='physical'))||(magical&&x.kind==='magic'))&&Math.abs(x.attack-attack)<1e-7&&Math.abs(x.defense-defense)<1e-7);
     hit=found?{ok:true,damage:found.damage,confidence:'実測'}:{ok:false,reason:'一致する実測ダメージが登録されていない'};
    }else{
     hit=prev.estimateDamage(attack,defense);
     if(magical&&!b.warnings.includes('魔力戦の通常攻撃ダメージは、物理の経験式を魔力値に仮適用した未検証モデル'))b.warnings.push('魔力戦の通常攻撃ダメージは、物理の経験式を魔力値に仮適用した未検証モデル');
    }
    if(!hit?.ok){b.error=`${actor.name}の攻撃を計算できない：${hit?.reason||'計算式なし'}`;b.outcome='undetermined';b.complete=true;emit('unknown',b.error);break;}
    const receiver=confused.has(s)?actor:reflecting.has(opp(s))?actor:target;
    const reduction=Math.max(0,...(b.damageReduction||[]).filter(x=>x.side===opp(s)&&x.from<=t&&x.until>=t).map(x=>x.fraction));
    hit.damage*=1-reduction;lastHits[s]=receiver===target?hit.damage:0;
    if(receiver===target&&b.absorbing?.has(opp(s))){target.current.hp+=hit.damage;lastHits[s]=0;emit('effect',`${target.name}は通常攻撃を吸収し回復`);}
    else{receiver.current.hp-=hit.damage;turnReceived[receiver.id]+=hit.damage;}
    const suffix=confused.has(s)?'〔混乱・自傷〕':reflecting.has(opp(s))?'〔反射〕':magical?'〔魔力戦・参照魔力／ダメージ式は仮式〕':'';
    emit('attack',`${actor.name}の${magical?'攻撃魔法':'攻撃'}！ ${receiver.name}に${fstr(hit.damage)}のダメージ〔${hit.confidence}〕${suffix}`);
    outcome();
   }
  }
  if(b.complete||endTurn)break;
  if(!disabled.has(s)&&!b.blockedAttacks[s].has(t))phase(s,'after');
 }
 if(!b.complete&&!endTurn)for(const s of order)phase(s,'end');
 for(let i=tempUndo.length-1;i>=0;i--){const u=tempUndo[i];u.f.current[u.st]-=u.delta;}
 if(endTurn)emit('effect','クロリッサにより当ターンを終了（後続の実体化・攻撃はなし）');
 // 継続効果は終了時能力と独立。クロリッサのターン打切り後も処理する。
 // 両側の継続効果が同時発生する場合の優先順位は未検証であり、登録順を暫定採用。
 if(!b.complete){
  for(const effect of b.sustained){
   if(b.complete)break;
   const receiver=b.fighters[effect.target];
   receiver.current.hp-=effect.damage;
   emit('sustain',`${D[effect.key].name}の継続効果！ ${receiver.name}に${fstr(effect.damage)}のダメージ（残り体力${fstr(receiver.current.hp)}）`,{side:effect.source,key:effect.key});
   outcome();
  }
 }
 if(!b.complete&&b.statGrowth)for(const e of b.statGrowth){if(e.from<=t)b.fighters[e.target].current[e.stat]+=e.amount;}
 if(!b.complete&&b.statGrowth)for(const growth of b.statGrowth)if(growth.from<=t)b.fighters[growth.target].current[growth.stat]+=growth.amount;
 if(!b.complete&&t===6){b.complete=true;b.outcome=c.mode==='trace'?'trace_complete':'draw';emit('result',c.mode==='trace'?'6ターンの発動順追跡完了（勝敗は未計算）':'6ターン終了。両者生存のため引き分け');}
 const snapshot={turn:t,first,events,fired,table:{player:[...b.tables.player],enemy:[...b.tables.enemy]},
  fighters:{player:{...b.fighters.player.current},enemy:{...b.fighters.enemy.current}},endTurn,outcome:b.outcome};
 b.turns.push(snapshot);return snapshot;
}
function playAll(b){while(!b.complete)round(b);return b;}
function preset(name='sho'){
 const empty=Array(6).fill(null),orders=['player','enemy','player','player','enemy','player'];
 if(name==='free')return {
  title:'自由デビルテーブル編集',mode:'trace',damageMode:'estimate',orders:Array(6).fill('player'),laplaceTarget:1,
  player:{name:'シロコ',base:{attack:31,defense:6203,hp:100000,magic:10000}},
  enemy:{name:'対戦相手',base:{attack:2570,defense:1560,hp:100000,magic:1580}},
  playerDeck:empty,enemyDeck:empty
 };
 if(name==='fieldHexenVine')return {
  title:'実戦A2：ヘクセンナハト→ヴィネ（重複しない継続効果）',mode:'full',damageMode:'estimate',orders:Array(6).fill('player'),
  player:{name:'シロコ',base:{attack:0,defense:5000,hp:200000,magic:10443}},
  enemy:{name:'検証相手',base:{attack:0,defense:5000,hp:100000,magic:100}},
  playerDeck:['hexennacht','vine',null,null,null,null],enemyDeck:empty
 };
 if(name==='fieldProserpina')return {
  title:'実戦B3：プロセルピナ→ヴィネ（相手2Tと3Tを変更）',mode:'full',damageMode:'estimate',orders:Array(6).fill('player'),
  player:{name:'シロコ',base:{attack:0,defense:5000,hp:250000,magic:12463}},
  enemy:{name:'試験相手',base:{attack:0,defense:5000,hp:250000,magic:100}},
  playerDeck:['proserpina','vine',null,null,null,'paimon'],enemyDeck:[null,'eligos','marbas',null,null,null]
 };
 if(name==='fieldJackLore')return {
  title:'実戦C1：ジャック・ロレ→ラプラス（再発動ごと再抽選）',mode:'full',damageMode:'estimate',orders:Array(6).fill('player'),
  player:{name:'シロコ',base:{attack:1000,defense:5000,hp:200000,magic:10443}},
  enemy:{name:'試験相手',base:{attack:1000,defense:5000,hp:200000,magic:100}},
  playerDeck:['jack_lore',null,null,'laplace',null,null],enemyDeck:empty,
  laplaceTarget:1,randomSeed:20261112
 };
 if(name==='sho')return {
  title:'ショウ・ルースソルト戦（統合エンジン検証）',mode:'full',damageMode:'observed',orders,
  player:{name:'シロコ',base:{attack:1,defense:1,hp:23437,magic:1},assist:{attack:30,defense:10,hp:90,magic:303},equipment:{attack:5775,defense:9812,hp:10917,magic:3050}},
  enemy:{name:'ショウ・ルースソルト',base:{attack:1500,defense:8200,hp:10700,magic:80},assist:{attack:13,defense:0,hp:18,magic:0},equipment:{attack:600,defense:4910,hp:6700,magic:5230}},
  playerDeck:['rabbit','chlorissa','kings_wind_gremory',null,null,null],enemyDeck:empty,
  observedHits:[
   {attacker:'player',attack:5808.5,defense:13110,damage:1166},
   {attacker:'player',attack:8385,defense:13110,damage:1684},
   {attacker:'enemy',attack:2113,defense:9825.5,damage:424},
   {attacker:'enemy',attack:2113,defense:9823,damage:424}
  ],expected:{playerHP:90916.5,enemyHP:9516,outcome:'draw'}
 };
 if(name==='kijiEnemy'||name==='kijiPlayer')return {
  title:name==='kijiEnemy'?'キジ③：2Tモロク先行（発動順追跡）':'キジ③：2Tベルゼブブ先行（発動順追跡）',
  mode:'trace',damageMode:'estimate',orders:name==='kijiEnemy'?['player','enemy','player','enemy','player','enemy']:['player','player','enemy','enemy','player','enemy'],
  laplaceTarget:1,player:{name:'シロコ',base:{attack:31,defense:1003,hp:46994,magic:6458}},enemy:{name:'キジ',base:{attack:32600,defense:15000,hp:33420,magic:115}},
  playerDeck:['troll','beelzebub','sargatanas',null,'laplace',null],enemyDeck:KIJI3
 };
 if(name==='hexen')return {
  title:'継続効果検証：ヘクセンナハト→クロリッサ（終了時ダメージは残る）',
  mode:'full',damageMode:'estimate',orders:Array(6).fill('player'),
  player:{name:'シロコ',base:{attack:31,defense:7000,hp:150000,magic:10000}},
  enemy:{name:'試験相手',base:{attack:1100,defense:8000,hp:100000,magic:2500}},
  playerDeck:['hexennacht',null,'chlorissa',null,null,null],enemyDeck:Array(6).fill(null)
 };
 if(name==='kamael')return {
  title:'連続発動：カマエル→ヴィネで攻撃力を二度加算',
  mode:'full',damageMode:'estimate',orders:Array(6).fill('player'),
  player:{name:'シロコ',base:{attack:2031,defense:2003,hp:100000,magic:11634}},
  enemy:{name:'龍王（試験条件）',base:{attack:2570,defense:1560,hp:150000,magic:1580}},
  playerDeck:['kamael','vine',null,null,null,null],enemyDeck:Array(6).fill(null)
 };
 if(name==='mixed')return {
  title:'統合テスト：表変更＋能力変更＋通常攻撃',mode:'full',damageMode:'estimate',orders:['player','player','enemy','player','enemy','player'],
  laplaceTarget:1,
  player:{name:'シロコ',base:{attack:31,defense:6203,hp:50000,magic:10000}},
  enemy:{name:'試験相手',base:{attack:1010,defense:6133,hp:90000,magic:2000}},
  playerDeck:['troll','beelzebub','rabbit',null,'laplace',null],
  enemyDeck:['marbas','odradek','freya','kings_wind_gremory','chlorissa','red_folter']
 };
 throw Error('不明なプリセット：'+name);
}
return {D,SOURCE_RULES,KIJI3,STAT,LABEL,fstr,config,createBattle,round,playAll,preset};
});
