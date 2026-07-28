#!/usr/bin/env node
/* 브라우저 없이 계산 로직을 검증한다.
   DOM·Leaflet 을 최소 스텁으로 대체해 앱 전체를 실제로 평가한 뒤 selfTest() 를 실행한다.
   구문만 맞고 실행이 안 되는 상태를 잡기 위한 장치다. */
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=['src/00-helpers.js','src/data/countries-and-sites.js','src/core/state-and-scoring.js',
  'src/ui/tabs.js','src/ui/map.js','src/ui/modules.js','src/ui/analysis.js',
  'src/tests/selftest.js','src/boot.js'];
const script=ORDER.map(f=>fs.readFileSync(path.join(ROOT,f),'utf8')).join('');

const noop=()=>{};
const el=()=>({ style:{setProperty:noop}, dataset:{}, classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  addEventListener:noop, removeEventListener:noop, appendChild:noop, insertAdjacentHTML:noop, removeChild:noop,
  setAttribute:noop, getAttribute:()=>null, querySelector:()=>el(), querySelectorAll:()=>[],
  getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}), textContent:'', innerHTML:'',
  scrollIntoView:noop, click:noop, focus:noop, value:'', closest:()=>el() });
const layer=()=>({ on:()=>layer(), off:()=>layer(), addTo:()=>layer(), removeLayer:noop, addLayer:noop,
  clearLayers:noop, bringToBack:noop, bringToFront:noop, setStyle:noop, setZIndexOffset:noop });
global.window={addEventListener:noop, location:{search:'',href:'file:///x',hash:''}};
global.document={ getElementById:()=>el(), querySelector:()=>el(), querySelectorAll:()=>[],
  createElement:()=>el(), createDocumentFragment:()=>el(), body:el(),
  documentElement:{style:{setProperty:noop}}, addEventListener:noop };
global.location=global.window.location;
global.navigator={clipboard:{writeText:async()=>{}}};
global.localStorage={getItem:()=>null,setItem:noop};
global.requestAnimationFrame=f=>{f();return 1;}; global.cancelAnimationFrame=noop;
global.setTimeout=()=>0; global.setInterval=()=>0; global.clearInterval=noop;
global.fetch=async()=>({ok:false,status:0,json:async()=>[]});
global.L={ map:()=>({ on:noop,setView:noop,getZoom:()=>3,getSize:()=>({x:800,y:600}),
    invalidateSize:noop,setMinZoom:noop,setZoom:noop,panTo:noop,flyTo:noop,fitBounds:noop,
    hasLayer:()=>false,removeLayer:noop,addLayer:noop,zoomIn:noop,zoomOut:noop,
    containerPointToLatLng:()=>({lat:0,lng:0}) }),
  tileLayer:()=>layer(), layerGroup:()=>layer(), marker:()=>layer(), rectangle:()=>layer(),
  divIcon:()=>({}), canvas:()=>({}), point:(a,c)=>({x:a,y:c}), latLngBounds:()=>({}),
  DomEvent:{disableClickPropagation:noop, disableScrollPropagation:noop} };

let api;
try{
  api = new Function(script + '\nreturn {selfTest, ranked, RANKED_SET, SITES, GROUPS};')();
  console.log('✔ 앱 전체 평가 성공 (초기화 시 참조 오류 없음)\n');
}catch(e){
  console.error('✘ 실행 오류:', e.message);
  console.error(e.stack.split('\n').slice(1,3).join('\n'));
  process.exit(1);
}
const r = api.selfTest();
console.log(`\n국가 ${api.RANKED_SET.length} · 데이터센터 ${api.SITES.length} · 지도 마커 ${api.GROUPS.length}`);
process.exit(r.fail ? 1 : 0);
