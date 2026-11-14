'use strict';
/* 四月島・検証マップの整合性検査。原作一致率の判定とは別。 */
const assert=require('node:assert/strict');
const {SOURCE_RULES}=require('../src/kei_unified_engine_v0_4_8.js');
const batch=require('../src/kei_batch_rules_0048.js');
const state=require('../../dist/engine-status.json');
const map=require('../research/2026-11-14-verification-map.json');
const definitions=new Map([...SOURCE_RULES,...batch].map(x=>[x.key,x]));
assert.equal(definitions.size,349);
assert.equal(state.devils.length,396);
assert.equal(map.models.length,392);
assert.equal(map.operators.length,170);
function collect(ops){
 const out=[];
 function walk(list,depth){for(const x of list||[]){
  if(!x||typeof x.op!=='string')continue;
  out.push({type:x.op,depth});
  for(const v of Object.values(x))
   if(Array.isArray(v)&&v.length&&v.every(y=>y&&typeof y==='object'&&typeof y.op==='string'))
    walk(v,depth+1);
 }}walk(ops,0);return out;
}
const asSorted=a=>a.slice().sort();
const byId=new Map(state.devils.map(x=>[x.id,x]));
const seen=new Set();
const membership=new Map();
const bucket={verified:0,A:0,B:0,C:0};
for(const row of map.models){
 assert(!seen.has(row.id),'unique model ID');seen.add(row.id);
 const live=byId.get(row.id);
 assert(live && live.engineKey===row.engineKey && live.status===row.modelStatus,
  'map must follow current registry: '+row.id);
 assert(['verified','A','B','C'].includes(row.evidenceLevel));
 bucket[row.evidenceLevel]++;
 const rule=definitions.get(row.engineKey);
 assert.equal(row.ruleKind,rule?'declarative':'manual','rule kind '+row.id);
 if(rule){
  const all=collect(rule.ops);
  assert.deepEqual(row.operationParameters,rule.ops,'rule args '+row.id);
  assert.equal(row.phase,rule.phase);
  assert.deepEqual(asSorted(row.topLevelOperations),
   asSorted([...new Set(all.filter(x=>x.depth===0).map(x=>x.type))]));
  assert.deepEqual(asSorted(row.nestedOperations),
   asSorted([...new Set(all.filter(x=>x.depth>0).map(x=>x.type))]));
  for(const op of new Set(all.map(x=>x.type))){
   if(!membership.has(op))membership.set(op,[]);
   membership.get(op).push(row.id);
  }
 }else{
  assert.deepEqual(row.topLevelOperations,[]);
  assert.equal(row.operationParameters,null);
 }
}
assert.deepEqual(bucket,{verified:8,A:42,B:17,C:325});
assert.equal(seen.size,392);
assert.equal(membership.size,170);
assert.deepEqual(asSorted([...membership.keys()]),asSorted(map.operators.map(x=>x.name)));
for(const op of map.operators){
 assert.deepEqual(asSorted(op.members),asSorted(membership.get(op.name)),
  'operator/devil incidence '+op.name);
 assert.equal(op.members.length,new Set(op.members).size,'no duplicates '+op.name);
}
const top=new Set(map.models.flatMap(x=>x.topLevelOperations));
assert.equal(top.size,169);
const counters=state.counts;
assert.equal(counters.verified+counters.provisional+counters.description+counters.partial+counters.legacy,392);
assert.equal(counters.pending,4);
console.log('PASS verification map: 392 modeled / 349 declarative / 43 manual / 170 operators (169 top-level) / 8+42+17+325 evidence');
