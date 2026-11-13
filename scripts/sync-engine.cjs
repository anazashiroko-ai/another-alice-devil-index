/* Source of truth: devils.json for original abilities, engine D for implementation status.
   Build both HTML variants from exactly the same JS sources. */
'use strict';
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const check=process.argv.includes('--check'),changes=[];
function save(file,value){const f=path.join(root,file);if(fs.existsSync(f)&&get(file)===value)return;changes.push(file);if(!check){fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,value,'utf8');}}
function scripts(html,replace){let i=0;const result=html.replace(/<script>([\s\S]*?)<\/script>/g,(whole,source)=>{const v=replace[i++];return v===undefined?whole:'<script>\n'+v.trim()+'\n</script>';});if(i!==4)throw Error('Expected four inline scripts, got '+i);return result;}
function name(x){return String(x||'').normalize('NFKC').replace(/^[○◎]+/,'').trim();}
function main(){
 const source=JSON.parse(get('dist/devils.json')),base=get('battle-engine/src/kei_battle_engine_v0_2.js'),batch=get('battle-engine/src/kei_batch_rules_0048.js'),core=get('battle-engine/src/kei_unified_engine_v0_4_8.js');
 if(source.length!==396)throw Error('Unexpected catalog length; review the 396-devil invariant');
 const version=(core.match(/仮想戦闘エンジン\s+(004\.\d+)/)||[])[1];if(!version)throw Error('Engine version not found');
 const E=require(path.join(root,'battle-engine/src/kei_unified_engine_v0_4_8.js'));
 const models=new Map();for(const [key,d] of Object.entries(E.D))if(d.model){const n=name(d.name);if(models.has(n))throw Error('Duplicate model '+n);models.set(n,{key,d});}
 const tiers={'field-verified':'verified','field-provisional':'provisional','explicit-provisional':'provisional','source-model':'description','description-model':'description','description-partial':'partial','legacy-preview':'legacy'};
 const counts={verified:0,provisional:0,description:0,partial:0,legacy:0,pending:0},seen=new Set();
 const entries=source.map(x=>{if(seen.has(x.id))throw Error('Duplicate catalog ID '+x.id);seen.add(x.id);const found=models.get(name(x.name)),tier=found?found.d.tier:'pending',status=found?tiers[tier]:'pending';if(!status)throw Error('Unknown model tier '+tier);counts[status]++;return {id:x.id,name:x.name,status,tier,engineKey:found?found.key:null,notes:found?found.d.notes||null:null};});
 if(source.length-counts.pending!==models.size)throw Error('Model mismatch');
 save('dist/engine-status.json',JSON.stringify({schemaVersion:1,engineVersion:version,source:'battle-engine/src/kei_unified_engine_v0_4_8.js',note:'実装状況は研究エンジン由来。原作の能力説明を上書きしない。partialは未解明要素を含む。',counts,devils:entries},null,2)+'\n');
 const catalog=get('dist/index.html');if(!/^var DEVILS=.*;$/m.test(catalog))throw Error('Embedded catalog missing');save('dist/index.html',catalog.replace(/^var DEVILS=.*;$/m,()=> 'var DEVILS='+JSON.stringify(source)+';'));
 const normal=get('battle-engine/index.html');save('battle-engine/index.html',scripts(normal,[base,batch,core]).replace(/004\.\d/g,version));
 let babel,env,polyfill;try{babel=require('@babel/core');env=require('@babel/preset-env');polyfill=getPolyfill();}catch(e){throw Error('Legacy build requires @babel/core, @babel/preset-env, core-js-bundle: '+e.message);}
 function getPolyfill(){return fs.readFileSync(require.resolve('core-js-bundle/minified.js'),'utf8');}
 function transpile(js,file){const result=babel.transformSync(js,{filename:file,sourceType:'script',comments:false,compact:true,presets:[[env,{targets:{ie:'11'},modules:false}]]});if(!result?.code)throw Error('No transpilation result for '+file);return result.code;}
 const legacy=get('battle-engine/legacy.html'),parts=[...legacy.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);if(parts.length!==4)throw Error('Legacy script count changed');
 const tag='/* KEI-LEGACY-SHIM */';
 const keep=parts[0].includes(tag)?parts[0].slice(parts[0].indexOf(tag)+tag.length).trim():parts[0].trim();
 const shim=polyfill+'\nif(typeof globalThis==="undefined"){var globalThis=(function(){return this;})();}\nif(!String.prototype.normalize){String.prototype.normalize=function(){return String(this);};}\n'+tag+'\n'+keep;
 // Embedded library uses no network: attach official catalog IDs to existing engine keys.
 const sourceIds={};for(const row of source){const k=name(row.name);if(sourceIds[k]!==undefined)throw Error('Duplicate normalized catalog name '+k);sourceIds[k]=row.id;}
 const keyIds={};for(const key of Object.keys(E.D)){const id=sourceIds[name(E.D[key].name)];if(id!==undefined)keyIds[key]=id;}
 const mapMarker=/^var DEVIL_ID_MAP=.*; \/\* KEI-DEVIL-ID-MAP \*\/$/m;
 if(!mapMarker.test(parts[3]))throw Error('Legacy sort UI lacks generated catalog-ID anchor');
 const ui=parts[3].replace(mapMarker,()=> 'var DEVIL_ID_MAP='+JSON.stringify(keyIds)+'; /* KEI-DEVIL-ID-MAP */');
 save('battle-engine/legacy.html',scripts(legacy,[shim,transpile(base,'damage-v2.js'),transpile(batch+'\n'+core,'engine-0048.js'),ui]).replace(/004\.\d/g,version));
 console.log(version,JSON.stringify(counts));
}
try{main();if(check&&changes.length){console.error('Generated files stale:',changes.join(', '));process.exitCode=1;}else console.log('Sync:',changes.length?changes.join(', '):'up to date');}catch(e){console.error(e.stack||e);process.exitCode=1;}
