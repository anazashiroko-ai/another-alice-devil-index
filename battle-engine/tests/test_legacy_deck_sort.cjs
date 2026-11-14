'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../legacy.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,4,'legacy script count');
assert.match(html,/id="deck-sort-key"/);
assert.match(html,/id="deck-sort-dir"/);
const ui=scripts[3];
assert.match(ui,/\/\* KEI-DEVIL-ID-MAP \*\//);
const nodes={};
function select(){
 return {
  children:[],_value:'',
  get firstChild(){return this.children[0]||null;},
  appendChild(x){this.children.push(x);if(this.children.length===1)this._value=x.value;},
  removeChild(x){const i=this.children.indexOf(x);if(i>=0)this.children.splice(i,1);if(!this.children.length)this._value='';},
  get value(){return this._value;},
  set value(v){this._value=this.children.some(x=>x.value===v)?v:'';}
 };
}
for(const side of ['player','enemy'])for(let t=1;t<=6;t++)nodes[side+'deck'+t]=select();
nodes['deck-sort-key']={value:'kana'};
nodes['deck-sort-dir']={value:'asc'};
const window={addEventListener(){}};
const document={getElementById(id){return nodes[id]},createElement(tag){return tag==='option'?{value:'',textContent:''}:{}}};
const injected=ui.replace(/\}\)\(\);\s*$/,'window._test={sort:sortDevils,render:renderDeckChoices,setChoices:function(x){devilChoices=x;},map:DEVIL_ID_MAP};})();');
assert.notEqual(injected,ui,'test hooks injected');
vm.runInNewContext(injected,{window,document});
const util=window._test;
assert.equal(util.map.catalog_7,7,'ID must come from real catalog');
assert.equal(util.map.catalog_48,48,'catalog ID 48 must be present');
assert.equal(util.map.catalog_221,221,'catalog ID 221 must be present');
assert.equal(util.map.catalog_347,347,'Johan in options map');
assert.equal(util.map.catalog_354,354,'White guardian in options map');
const list=[
 {key:'catalog_7',id:7,name:'グシオン',model:true,min:1},
 {key:'catalog_48',id:48,name:'アロケル',model:true,min:1},
 {key:'catalog_151',id:151,name:'ジャックフロスト',model:true,min:1},
 {key:'catalog_97',id:97,name:'○アリエル',model:true,min:1},
 {key:'other',id:0,name:'未実装デビル（テスト札）',model:false,min:1}
];
assert.equal(JSON.stringify(Array.from(util.sort(list,'id','asc'),x=>x.id)),JSON.stringify([7,48,97,151,0]));
assert.equal(JSON.stringify(Array.from(util.sort(list,'id','desc'),x=>x.id)),JSON.stringify([151,97,48,7,0]));
const kana=Array.from(util.sort(list,'kana','asc'),x=>x.key);
assert.ok(kana.indexOf('catalog_97')<kana.indexOf('catalog_48'),'○ marker must not affect Japanese alphabetical order');
assert.ok(kana.indexOf('catalog_48')<kana.indexOf('catalog_7'),'kana alphabetical order');
assert.deepEqual(Array.from(util.sort(list,'kana','desc'),x=>x.key),kana.slice().reverse());
util.setChoices(list);
util.render();
assert.equal(nodes.playerdeck1.children.length,list.length+1,'empty choice plus all devils');
assert.equal(nodes.enemydeck6.children.length,list.length+1);
nodes.playerdeck1.value='catalog_7';nodes.playerdeck3.value='catalog_151';nodes.enemydeck6.value='catalog_48';
const before={p1:nodes.playerdeck1.value,p3:nodes.playerdeck3.value,e6:nodes.enemydeck6.value};
for(const kind of ['id','kana'])for(const dir of ['asc','desc']){
 nodes['deck-sort-key'].value=kind;nodes['deck-sort-dir'].value=dir;util.render();
 assert.deepEqual({p1:nodes.playerdeck1.value,p3:nodes.playerdeck3.value,e6:nodes.enemydeck6.value},before,
  'sort must not replace placed devils: '+kind+'/'+dir);
 assert.equal(nodes.playerdeck1.children[0].value,'','empty slot stays first');
 assert.equal(nodes.enemydeck6.children[0].value,'','enemy empty slot stays first');
 if(kind==='id'){
  assert.match(nodes.playerdeck1.children[1].textContent,/^ID [0-9]+\｜/,'ID shown on options');
  assert.match(nodes.playerdeck1.children[nodes.playerdeck1.children.length-1].textContent,/^IDなし/,'non-catalog entry sorted last');
 }
}
const code=ui.replace(/^var DEVIL_ID_MAP=.*; \/\* KEI-DEVIL-ID-MAP \*\/$/m,'var DEVIL_ID_MAP={}; /* KEI-DEVIL-ID-MAP */');
assert.ok(!/(^|[^a-zA-Z])(let|const|class)\s+/.test(code),'legacy UI should use ES5 syntax');
util.setChoices([...list,{key:'catalog_347',id:347,name:'ヨハン',model:false,min:1},{key:'catalog_354',id:354,name:'白き守護者ヨハン',model:false,min:1}]);util.render();
for(const key of ['catalog_347','catalog_354']){const o=nodes.playerdeck1.children.find(x=>x.value===key);assert.ok(o);assert.ok(o.textContent.includes('能力未実装'));}
console.log('PASS legacy deck sort: 50音/ID, 昇順/降順, ID mapping, slot preservation, 12 native selects');
