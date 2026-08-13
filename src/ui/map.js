/* ============ 4. 지도 ============ */
const map = L.map('map',{zoomControl:false,worldCopyJump:true,minZoom:0,maxZoom:12,
  zoomSnap:0.5,zoomDelta:0.5,wheelPxPerZoomLevel:90,
  maxBounds:[[-85,-Infinity],[85,Infinity]],maxBoundsViscosity:0.8});

function coverZoom(){
  const s = map.getSize();
  return Math.max(0, Math.ceil(Math.max(Math.log2(Math.max(s.x,1)/256), Math.log2(Math.max(s.y,1)/256))*2)/2);
}
function goHome(){ map.invalidateSize(); const z=coverZoom(); map.setMinZoom(z); map.setView([20,10],z,{animate:false}); }
goHome(); window.addEventListener('load',goHome); setTimeout(goHome,300);
window.addEventListener('resize',()=>{ map.invalidateSize(); const z=coverZoom(); map.setMinZoom(z);
  if(map.getZoom()<z) map.setZoom(z); });

const TILES = [
  {name:'단순 지도',labels:false,url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
   o:{attribution:'© OpenStreetMap, © CARTO',subdomains:'abcd',maxZoom:19}},
  {name:'자연 지형',labels:false,url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
   o:{attribution:'© Esri',maxNativeZoom:8,maxZoom:19}},
  {name:'다크 지도',labels:false,url:'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
   o:{attribution:'© OpenStreetMap, © CARTO',subdomains:'abcd',maxZoom:19}},
  {name:'표준 지도',labels:true,url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
   o:{attribution:'© OpenStreetMap contributors',maxZoom:19}},
];
// 타일이 실패했을 때 표시할 투명 이미지 (오류가 연쇄되지 않게 한다)
const BLANK_TILE='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
let baseLayer=null, tileIdx=0, switching=false;

function loadTiles(i){
  if(i>=TILES.length) i=0;
  tileIdx=i; switching=false;
  if(baseLayer){ baseLayer.off(); map.removeLayer(baseLayer); }
  const s=TILES[i];
  baseLayer=L.tileLayer(s.url, Object.assign({errorTileUrl:BLANK_TILE}, s.o));
  let err=0, ok=0;
  baseLayer.on('tileload',()=>{
    ok++;
    const mn=document.getElementById('mapNotice');
    if(mn) mn.style.display='none';
  });
  baseLayer.on('tileerror',()=>{
    err++;
    if(ok>0 || switching || err<4) return;
    switching=true;
    baseLayer.off('tileerror');          // 같은 판정이 반복되지 않게 즉시 해제
    // Leaflet 이벤트 처리 중에 레이어를 갈아끼우면 내부 상태가 꼬이므로 다음 틱으로 미룬다
    setTimeout(()=>{
      try{
        if(i+1<TILES.length) loadTiles(i+1);
        else{
          const mn=document.getElementById('mapNotice');
          if(mn) mn.style.display='block';
        }
      }catch(e){ console.warn('[Atlas] 타일 전환 실패:', e && e.message); }
    },0);
  });
  baseLayer.addTo(map); baseLayer.bringToBack();
  if(typeof labelLayer!=='undefined'){ s.labels ? map.removeLayer(labelLayer) : labelLayer.addTo(map); }
  // 어두운 지도에서는 라벨을 밝은 색으로 반전한다
  document.getElementById('map').classList.toggle('dark-map', s.name==='다크 지도');
}

// 한국어 국가 라벨
const MAJOR = new Set(['러시아','중국','미국','캐나다','브라질','호주','인도','아르헨티나','카자흐스탄',
  '그린란드','알제리','사우디아라비아','멕시코','인도네시아','리비아','수단','이란','몽골','일본','대한민국']);
const SMALL = new Set(['북한','대만','싱가포르','캄보디아','라오스','네팔','스리랑카','방글라데시','조지아',
  '이스라엘','요르단','시리아','예멘','오만','아랍에미리트','벨라루스','체코','헝가리','세르비아','크로아티아',
  '불가리아','오스트리아','스위스','벨기에','네덜란드','아일랜드','포르투갈','덴마크','에스토니아','라트비아',
  '리투아니아','튀니지','가나','짐바브웨','보츠와나','나미비아','모잠비크','과테말라','쿠바','우루과이',
  '파라과이','에콰도르','볼리비아','파푸아뉴기니']);
const LABELS = [['대한민국',36.5,127.9],['북한',40,127],['일본',36.2,138.3],['중국',35,103],['몽골',46.9,103.8],
['대만',23.7,121],['베트남',14.1,108.3],['태국',15.9,100.9],['필리핀',12.9,121.8],['인도네시아',-2.5,118],
['말레이시아',4.2,102],['싱가포르',1.35,103.8],['미얀마',21.9,96],['캄보디아',12.6,104.9],['라오스',19.9,102.5],
['인도',22.6,79],['파키스탄',30.4,69.3],['방글라데시',23.7,90.4],['네팔',28.4,84.1],['스리랑카',7.9,80.8],
['카자흐스탄',48,66.9],['우즈베키스탄',41.4,64.6],['아프가니스탄',33.9,67.7],['이란',32.4,53.7],['이라크',33.2,43.7],
['사우디아라비아',24,45.1],['예멘',15.6,48],['오만',21.5,56],['아랍에미리트',24,54],['튀르키예',39,35.2],
['시리아',35,38],['이스라엘',31.4,35],['요르단',31.3,36.5],['조지아',42.3,43.4],['러시아',61.5,90],
['우크라이나',48.4,31.2],['벨라루스',53.7,27.9],['폴란드',52,19.4],['독일',51.2,10.4],['프랑스',46.6,2.2],
['스페인',40,-3.7],['포르투갈',39.5,-8.2],['이탈리아',42.8,12.6],['영국',54,-2.5],['아일랜드',53.2,-8],
['네덜란드',52.2,5.5],['벨기에',50.6,4.6],['스위스',46.8,8.2],['오스트리아',47.6,14.1],['체코',49.8,15.4],
['헝가리',47.1,19.4],['루마니아',45.9,25],['불가리아',42.7,25.4],['그리스',39,22],['세르비아',44.1,20.9],
['크로아티아',45.1,16.4],['노르웨이',62.5,9.5],['스웨덴',62,15.5],['핀란드',63.5,26],['덴마크',56,9.6],
['아이슬란드',64.9,-18.5],['에스토니아',58.7,25.6],['라트비아',56.9,24.7],['리투아니아',55.3,23.9],
['이집트',26.8,30],['리비아',26.5,17.5],['알제리',28.1,2.6],['모로코',31.9,-7.1],['튀니지',34,9.6],
['수단',15.5,30.3],['에티오피아',9.2,39.6],['케냐',0.2,37.9],['탄자니아',-6.4,34.9],['나이지리아',9.1,8.7],
['니제르',17.6,8.1],['차드',15.5,18.7],['말리',17.6,-4],['가나',7.9,-1],['콩고 민주\n공화국',-2.9,23.6],
['앙골라',-11.2,17.9],['나미비아',-22,17.2],['보츠와나',-22.3,24.7],['짐바브웨',-19,29.2],
['남아프리카\n공화국',-29,24.7],['마다가스카르',-18.8,46.9],['모잠비크',-18.7,35.5],['미국',39.5,-98.4],
['캐나다',56.1,-106.3],['멕시코',23.6,-102.5],['과테말라',15.8,-90.2],['쿠바',21.5,-79.5],['브라질',-10.8,-52.9],
['아르헨티나',-35.4,-64.2],['칠레',-33.5,-71],['페루',-9.2,-75],['콜롬비아',4.6,-74.3],['볼리비아',-16.3,-63.6],
['베네수엘라',6.4,-66.6],['파라과이',-23.4,-58.4],['우루과이',-32.5,-55.8],['에콰도르',-1.8,-78.2],
['호주',-25.3,133.8],['뉴질랜드',-41.5,172.8],['파푸아뉴기니',-6.3,143.9],['그린란드',72,-42]];

const tierOf = n => MAJOR.has(n) ? 1 : (SMALL.has(n) ? 3 : 2);
const labelLayer = L.layerGroup().addTo(map);
LABELS.forEach(([n,lat,lng])=>{
  L.marker([lat,lng],{interactive:false,keyboard:false,zIndexOffset:-500,icon:L.divIcon({
    className:'',iconSize:[0,0],iconAnchor:[0,0],
    html:`<div class="country-label" data-tier="${tierOf(n)}">${n.replace(/\n/g,'<br>')}</div>`
  })}).addTo(labelLayer);
});
loadTiles(0);

let labelEls=null;
function labelVis(){
  if(!labelEls) labelEls=Array.from(document.querySelectorAll('.country-label'));
  const z=map.getZoom();
  labelEls.forEach(el=>{
    const t=+el.dataset.tier, min = t===1?0 : t===2?3 : 4.5;
    const hide = z<min, cur = el.style.display==='none';
    if(cur!==hide) el.style.display = hide?'none':'';
  });
}
function labelScale(){
  const s=Math.max(9.5,Math.min(14,7.5+map.getZoom()*0.75));
  document.documentElement.style.setProperty('--label-size',s.toFixed(1)+'px');
}

// 데이터센터 마커 — 점수는 현재 가중치로 실시간 계산한다
const markers={}; let activeId=null;
/* ---- 같은 도시에 여러 지점이 있으면 하나로 묶는다 ----
   프랑크푸르트에는 AWS·Oracle·Equinix 세 곳이 좌표까지 똑같아 그냥 두면
   맨 위 마커 하나만 클릭된다. 25km 이내를 한 묶음으로 만들고 개수를 표시한다. */
const GROUPS=[];
(function buildGroups(){
  const used=new Set();
  SITES.forEach(s=>{
    if(used.has(s.id)) return;
    used.add(s.id);
    const members=[s];
    SITES.forEach(t=>{
      if(used.has(t.id)) return;
      if(hav({lat:s.lat,lng:s.lng},{lat:t.lat,lng:t.lng})<25){ members.push(t); used.add(t.id); }
    });
    GROUPS.push({
      id: GROUPS.length,
      lat: members.reduce((a,x)=>a+x.lat,0)/members.length,
      lng: members.reduce((a,x)=>a+x.lng,0)/members.length,
      sites: members,
    });
  });
  SITES.forEach(s=>{ s._g = GROUPS.findIndex(g=>g.sites.includes(s)); });
})();

// 묶음의 대표 점수는 소속 지점 중 최고점
function groupScore(g){ return Math.max(...g.sites.map(x=>siteEval(x).total)); }
function groupLabel(g){
  const cos=[...new Set(g.sites.map(x=>x.co))].join(', ');
  return `${cos} · ${g.sites[0].pl}, ${g.sites[0].ct} · 적합도 ${Math.round(groupScore(g))}점`;
}
function applyMarkerColor(g){
  const el=document.getElementById(`mk-${g.id}`);
  if(!el) return;
  const s=groupScore(g);
  el.style.color=color(s);
  el.classList.remove('tier-good','tier-mid','tier-bad');
  el.classList.add('tier-'+scoreTier(s));
  const outer=el.closest('.leaflet-marker-icon');
  if(outer) outer.setAttribute('aria-label', groupLabel(g));
}
GROUPS.forEach(g=>{
  const n=g.sites.length;
  const mk=L.marker([g.lat,g.lng],{alt:groupLabel(g),icon:L.divIcon({className:'',iconSize:[16,16],iconAnchor:[8,8],
    html:`<div class="dc-marker${n>1?' multi':''} tier-${scoreTier(groupScore(g))}" id="mk-${g.id}" style="color:${color(groupScore(g))}">
      <div class="ring2"></div><div class="ring"></div><div class="core"></div>
      ${n>1?`<span class="mk-count">${n}</span>`:''}</div>`})}).addTo(map);
  mk.on('click',()=>openGroup(g.id));
  mk.on('add',()=>{ applyMarkerColor(g); requestAnimationFrame(()=>applyMarkerColor(g)); });
  markers[g.id]=mk;
});
function updateMarkerColors(){ GROUPS.forEach(applyMarkerColor); }

/* ---- 색상 필터(그리드) ---- */
const gridRenderer=L.canvas({padding:0.5});
const gridLayer=L.layerGroup();
let gridCells=null, gridRects=null;
const FILTERS=[{id:'off',l:'끄기'},{id:'total',l:'종합 적합도'},...FACTORS.map(f=>({id:f.key,l:f.label}))];



function buildGrid(){
  if(gridCells) return gridCells;
  gridCells=[]; const LA=2.5, LO=3;
  for(let lat=-56;lat<80;lat+=LA) for(let lng=-180;lng<180;lng+=LO){
    const cLat=lat+LA/2, cLng=lng+LO/2;
    const {ref,dist}=nearest(cLat,cLng);
    if(dist>850) continue;              // 육지 기준점에서 너무 멀면 제외
    if(nearestSea(cLat,cLng) < dist) continue;  // 바다에 더 가까우면 제외
    const rem=Math.max(0,Math.min(1,(dist-400)/1600));
    const cellTC = ref.tc + (estTemp(cLat) - estTemp(ref.lat));   // 지점 평가와 동일한 규칙
    const m={lat:cLat, tc:cellTC, ci:ref.ci, temp:tempScore(cellTC),
             power:ref.power, renew:ref.renew, water:ref.water,
      grid:Math.round(ref.grid*(1-rem*0.45)), net:Math.round(ref.net*(1-rem*0.55)),
      risk:ref.risk, land:Math.round(Math.min(100,ref.land+rem*10))};
    gridCells.push({bounds:[[lat,lng],[lat+LA,lng+LO]],m});
  }
  return gridCells;
}
const heat = v => v>=85?'#2E9E63' : v>=75?'#68B85C' : v>=65?'#C9B23E' : v>=55?'#D68A38' : v>=45?'#CE6A3E' : '#B94A3C';
const cellValue = (m,mode) => {
  // 탄소집약도는 낮을수록 좋으므로 점수로 뒤집어 표시한다
  if(mode==='carbon') return Math.max(5, Math.min(100, Math.round(100 - (m.ci||500)/7.5)));
  if(mode!=='total') return mval(m,mode);
  const w=effectiveWeights(), tw=effTotal()||1;
  return FKEYS.reduce((a,k)=>a+mval(m,k)*w[k],0)/tw;
};

function gridVis(){
  if(filterMode==='off') return;
  const show=map.getZoom()<=5.5;
  if(show&&!map.hasLayer(gridLayer)) gridLayer.addTo(map);
  if(!show&&map.hasLayer(gridLayer)) map.removeLayer(gridLayer);
  document.getElementById('gridHint').style.display = show?'none':'block';
}
function paintGrid(){
  if(filterMode==='off'){
    // 레이어를 지도에서 통째로 뗐다 다시 붙이면(2천여 개 사각형) 30~40ms가 걸린다.
    // 실제 재계산은 3ms도 안 걸리므로, 떼지 말고 투명하게만 만들어 둔다.
    if(gridRects) gridRects.forEach(r=>r.setStyle({fillOpacity:0}));
    document.getElementById('gridHint').style.display='none';
    renderLegend(); return;
  }
  if(!gridRects){
    gridRects=buildGrid().map(cell=>{
      const r=L.rectangle(cell.bounds,{renderer:gridRenderer,stroke:false,interactive:false,
        fillColor:heat(cellValue(cell.m,filterMode)),fillOpacity:0.5});
      r._m=cell.m; gridLayer.addLayer(r); return r;
    });
    Object.values(markers).forEach(mk=>mk.setZIndexOffset(1000));
  }else{
    gridRects.forEach(r=>r.setStyle({fillColor:heat(cellValue(r._m,filterMode)),fillOpacity:0.5}));
  }
  if(!map.hasLayer(gridLayer)) gridLayer.addTo(map);
  gridVis(); renderLegend();
}
function renderLegend(){
  const b=document.getElementById('legendBody'), t=document.getElementById('legendTitle');
  if(filterMode==='off'){
    t.textContent='데이터센터 적합도';
    b.innerHTML=`<div class="row"><span class="dot tier-good" style="background:#3EA76B"></span> 85 – 100 · 매우 우수</div>
      <div class="row"><span class="dot tier-mid" style="background:#D9962C"></span> 65 – 84 · 양호</div>
      <div class="row"><span class="dot tier-bad" style="background:#C94830"></span> 65 미만 · 미흡</div>`;
  }else{
    t.textContent=FILTERS.find(f=>f.id===filterMode).l+' 분포';
    b.innerHTML=`<div class="scale">${[40,50,60,70,80,90].map(v=>`<i style="background:${heat(v)}"></i>`).join('')}</div>
      <div class="scale-lb"><span>◀ 낮음 (40)</span><span>높음 (90) ▶</span></div>`;
  }
  // 범례 높이는 필터 종류에 따라 달라진다 — 아래 붙은 기업/지역 필터 패널이
  // 겹치지 않도록 매번 실제 높이를 재서 그 아래에 붙인다 (모바일은 별도 위치라 영향 없음).
  const legend=document.querySelector('.legend');
  if(legend) document.documentElement.style.setProperty('--sf-top', (legend.offsetHeight+24)+'px');
}
function renderFilters(){
  const el=document.getElementById('filterSelect');
  if(!el.dataset.init){
    el.innerHTML=FILTERS.map(f=>`<option value="${f.id}">${f.l}</option>`).join('');
    el.addEventListener('change',()=>{ filterMode=el.value; paintGrid(); });
    el.dataset.init='1';
  }
  el.value=filterMode;
}
renderFilters(); renderLegend();
// 웹폰트가 늦게 도착하면 글자 크기가 바뀌면서 범례 높이가 달라진다 —
// 폰트 로딩이 끝난 뒤 한 번 더 맞춰서 필터 패널과 겹치지 않게 한다.
if(document.fonts && document.fonts.ready) document.fonts.ready.then(renderLegend);

/* ---- 기업 · 지역 필터 ---- */
let coFilter='all', regionFilter='all';
// 목록은 쓰이는 시점에 한 번만 만든다 (선언 순서에 영향받지 않게)
let _companies=null, _regions=null;
function companyList(){
  if(!_companies) _companies=[...new Set(SITES.map(s=>s.co))].sort();
  return _companies;
}
function regionList(){
  if(!_regions) _regions=[...new Set(RANKED_SET.map(c=>c.region).filter(Boolean))].sort();
  return _regions;
}

function siteVisible(x){
  if(coFilter!=='all' && x.co!==coFilter) return false;
  if(regionFilter!=='all'){
    const c=RANKED_SET.find(k=>k.n===x.ct);
    if(!c || c.region!==regionFilter) return false;
  }
  return true;
}
function applySiteFilter(){
  let shown=0;
  GROUPS.forEach(g=>{
    const visSites=g.sites.filter(siteVisible), vis=visSites.length>0;
    const mk=markers[g.id];
    if(vis && !map.hasLayer(mk)) mk.addTo(map);
    if(!vis && map.hasLayer(mk)) map.removeLayer(mk);
    shown += visSites.length;
  });
  const el=document.getElementById('siteFilterCount');
  if(el) el.textContent = (coFilter==='all'&&regionFilter==='all')
    ? `전체 ${SITES.length}곳` : `${shown}곳 표시 중`;
}
function renderSiteFilter(){
  const box=document.getElementById('siteFilter'); if(!box) return;
  box.innerHTML=`
    <select id="coSel" aria-label="기업 필터">
      <option value="all">전체 기업 (${companyList().length})</option>
      ${companyList().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
    </select>
    <select id="regionSel" aria-label="지역 필터">
      <option value="all">전체 지역</option>
      ${regionList().map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('')}
    </select>
    <span class="sf-count" id="siteFilterCount">전체 ${SITES.length}곳</span>`;
  document.getElementById('coSel').onchange=e=>{ coFilter=e.target.value; applySiteFilter(); };
  document.getElementById('regionSel').onchange=e=>{ regionFilter=e.target.value; applySiteFilter(); };
}

/* ---- 이 위치를 고른 이유 (규칙 기반 해설) ---- */
function whyHere(x){
  const r=siteEval(x);
  const m=r.m, reasons=[];
  if(m.temp>=70) reasons.push('연평균 기온이 낮아 외기 냉방으로 냉각비를 크게 아낄 수 있습니다');
  if(m.power>=75) reasons.push('전력 단가가 낮아 장기 운영비가 유리합니다');
  if(m.renew>=70) reasons.push('재생에너지 비중이 높아 탄소중립 목표에 부합합니다');
  if(m.net>=88) reasons.push('해저케이블·백본이 밀집해 지연시간이 짧고 이용자 접근성이 좋습니다');
  if(m.grid>=88) reasons.push('전력망이 안정적이라 무중단 운영에 유리합니다');
  if(m.land>=75) reasons.push('부지 비용이 낮아 대규모 캠퍼스를 조성하기 좋습니다');
  if(m.risk>=85) reasons.push('지진·태풍 위험이 낮습니다');
  if(!reasons.length) reasons.push('개별 지표보다 시장 접근성과 기존 인프라를 우선한 선택으로 보입니다');
  const weak=FKEYS.map(k=>({k,v:m[k]})).sort((a,b)=>a.v-b.v)[0];
  return {reasons:reasons.slice(0,3), weak, total:r.total};
}

/* ---- 지점 평가 ---- */
const mpanel=document.getElementById('mpanel'), mpanelIn=document.getElementById('mpanelIn');
let probeMarker=null;
// 함수 선언으로 두어야 마커 생성 등 앞쪽 코드에서도 안전하게 쓸 수 있다
function estTemp(lat){ return 30 - Math.abs(lat)*0.62; }
function tempScore(t){ return Math.round(Math.max(5,Math.min(100,100-(t+5)*(92/35)))); }

function closePanel(){
  if(activeId!==null){ document.getElementById(`mk-${activeId}`)?.classList.remove('selected'); activeId=null; }
  mpanel.classList.remove('open');
}
// 실제 운영 중인 지점은 인프라가 이미 갖춰져 있으므로 원거리 감점을 적용하지 않는다
function siteEval(s){
  // 지점→기준점 매핑과 위도 기반 기온은 고정값이므로 최초 1회만 계산한다
  if(!s._ref){
    s._ref=nearest(s.lat,s.lng,true).ref;
    s._est=s._ref.tc + (estTemp(s.lat) - estTemp(s._ref.lat));
  }
  const ref=s._ref, est=s._est;
  const raw={lat:s.lat,temp:tempScore(est),power:ref.power,renew:ref.renew,grid:ref.grid,
             water:ref.water,net:ref.net,risk:ref.risk,land:ref.land};
  const m={}; FKEYS.forEach(k=>m[k]=mval(raw,k));
  const w=effectiveWeights(), tw=effTotal()||1;
  const total=FKEYS.reduce((a,k)=>a+m[k]*w[k],0)/tw;
  return {m,total,ref,est};
}
// 묶음의 대표 지명 — 가장 많이 등장하는 지명을 쓴다
function cityLabel(g){
  const cnt={};
  g.sites.forEach(x=>cnt[x.pl]=(cnt[x.pl]||0)+1);
  return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0][0];
}

// 묶음 카드: 여러 지점이면 목록을 먼저 보여주고, 고른 지점의 상세를 아래에 붙인다
function openGroup(gid, siteId){
  const g=GROUPS[gid]; if(!g) return;
  if(probeMarker){ map.removeLayer(probeMarker); probeMarker=null; }
  if(activeId!==null) document.getElementById(`mk-${activeId}`)?.classList.remove('selected');
  activeId=gid;
  document.getElementById(`mk-${gid}`)?.classList.add('selected');
  map.panTo([g.lat,g.lng],{animate:true});

  const ranked=g.sites.map(x=>({x, r:siteEval(x)})).sort((a,b)=>b.r.total-a.r.total);
  const cur = ranked.find(o=>o.x.id===siteId) || ranked[0];
  const s=cur.x, r=cur.r, c=color(r.total);
  const es=FKEYS.map(k=>({k,v:r.m[k]})).sort((a,b)=>b.v-a.v);
  const grade=r.total>=85?'입지가 매우 우수합니다':r.total>=65?'입지가 양호합니다':'입지 조건이 불리한 편입니다';

  const list = g.sites.length>1 ? `
    <div class="sec-t">이 지역의 데이터센터 ${g.sites.length}곳</div>
    <div class="grp-list">${ranked.map(o=>`
      <button class="grp-item ${o.x.id===s.id?'on':''}" data-sid="${o.x.id}">
        <span class="gi-nm">${esc(o.x.co)} <em>${esc(o.x.pl)}</em></span>
        <span class="gi-sc" style="color:${color(o.r.total)}">${o.r.total.toFixed(1)}</span>
      </button>`).join('')}</div>` : '';

  mpanelIn.innerHTML=`
    <div class="p-eyebrow"><span>운영 중 데이터센터${g.sites.length>1?` // ${g.sites.length}곳`:''}</span>
      <span class="p-close" id="cbtn">닫기 ✕</span></div>
    ${g.sites.length>1
      ? `<h2>${esc(s.ct)} · ${esc(cityLabel(g))}</h2>
         <div class="sub">서로 다른 사업자 ${g.sites.length}곳이 모여 있습니다</div>`
      : `<h2>${esc(s.co)} ${esc(s.pl)}</h2><div class="sub">${esc(s.ct)} · ${grade}</div>`}
    ${list}
    ${g.sites.length>1
      ? `<div class="sec-t">${esc(s.co)} ${esc(s.pl)} · ${grade}</div>` : ''}
    <div class="score-block"><div class="num" style="color:${c}">${r.total.toFixed(1)}<small>/100</small></div>
      <div class="stars" style="color:${c}">${stars(r.total)}</div></div>
    <div class="sec-t">적합 요인</div>
    <ul class="flist good">${es.slice(0,3).map(e=>`<li><span class="mk">✓</span>${FLABEL[e.k]} ${e.v}점</li>`).join('')}</ul>
    <div class="sec-t">고려 사항</div>
    <ul class="flist bad">${es.slice(-3).reverse().map(e=>`<li><span class="mk">△</span>${FLABEL[e.k]} ${e.v}점</li>`).join('')}</ul>
    <div class="metrics">${FKEYS.map(k=>`<div class="metric"><div class="lbl">${FLABEL[k]}</div>
      <div class="bar"><i style="width:${r.m[k]}%;background:${color(r.m[k])}"></i></div>
      <div class="val">${r.m[k]} / 100</div></div>`).join('')}</div>
    <div class="sec-t">왜 이 위치를 골랐을까</div>
    <ul class="flist good">${whyHere(s).reasons.map(t=>`<li><span class="mk">›</span>${t}</li>`).join('')}</ul>
    <div class="note-txt" style="font-size:11.5px">다만 ${FLABEL[whyHere(s).weak.k]}는
      ${whyHere(s).weak.v}점으로 이 지점의 가장 큰 약점입니다.</div>
    <div class="sec-t">평가 방식</div>
    <div class="note-txt">기온은 연평균 ${r.est.toFixed(1)}°C, 나머지 항목은
      ${esc(r.ref.n.replace('\n',''))} 국가값을 사용했습니다. 현재
      <b style="color:var(--ink)">${PURPOSES.find(p=>p.id===activePurpose)?.name || '사용자 지정'}</b>
      가중치 기준이라, 분석 탭에서 목적을 바꾸면 이 점수도 함께 달라집니다.
      ${g.sites.length>1?`<br><br>같은 도시에 ${g.sites.length}곳이 모여 있어 지도에서는 하나로 묶어 표시합니다.`:''}</div>`;
  mpanel.classList.add('open');
  document.getElementById('cbtn').onclick=closePanel;
  mpanelIn.querySelectorAll('.grp-item').forEach(b=>
    b.onclick=()=>openGroup(gid, +b.dataset.sid));
}
// 검색 등에서 개별 지점을 지정해 열 때 사용
function selectSite(id){
  const s=SITES.find(x=>x.id===id);
  if(!s) return;
  // 필터에 걸려 지도에서 숨겨진 지점이면 필터를 풀고 다시 보여 준다
  if(!siteVisible(s)){
    coFilter='all'; regionFilter='all';
    renderSiteFilter(); applySiteFilter();
    const note=document.getElementById('siteFilterCount');
    if(note) note.textContent='선택한 지점을 보여주려고 필터를 해제했습니다';
  }
  openGroup(s._g, id);
}

async function evalPoint(lat,lng){
  const {ref,dist}=nearest(lat,lng,true);
  let liveC=null, elev=null, clim=null;
  try{
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current=temperature_2m`);
    if(r.ok){ const d=await r.json();
      if(d.current&&typeof d.current.temperature_2m==='number') liveC=d.current.temperature_2m;
      if(typeof d.elevation==='number') elev=d.elevation; }
  }catch(e){}
  try{ clim=await climateProfile(lat,lng); }catch(e){}
  // 실제 관측된 연평균 기온이 있으면 위도 추정 대신 그 값으로 채점한다
  const est = (clim && clim.annualMean!==null)
    ? clim.annualMean
    : ref.tc + (estTemp(lat) - estTemp(ref.lat));
  const m={lat,temp:tempScore(est),power:ref.power,renew:ref.renew,grid:ref.grid,
           water:ref.water,net:ref.net,risk:ref.risk,land:ref.land};
  const rem=Math.max(0,Math.min(1,(dist-400)/1600));
  m.net=Math.round(m.net*(1-rem*0.55)); m.grid=Math.round(m.grid*(1-rem*0.45));
  m.land=Math.round(Math.min(100,m.land+rem*10));
  const w=effectiveWeights(), tw=effTotal()||1;
  const total=FKEYS.reduce((a,k)=>a+m[k]*w[k],0)/tw;
  return {lat,lng,ref,liveC,est,elev,m,total,rem,clim};
}
function renderProbe(r){
  const c=color(r.total);
  const es=FKEYS.map(k=>({k,v:r.m[k]})).sort((a,b)=>b.v-a.v);
  const grade=r.total>=85?'매우 유망한 후보지':r.total>=65?'검토해볼 만한 후보지':'권장하기 어려운 지역';
  mpanelIn.innerHTML=`
    <div class="p-eyebrow"><span>지점 평가 // ${r.lat.toFixed(2)}°, ${r.lng.toFixed(2)}°</span>
      <span class="p-close" id="cbtn">닫기 ✕</span></div>
    <h2>${grade}</h2>
    <div class="sub">기준 국가: ${r.ref.n.replace('\n','')}${r.elev!==null?` · 해발 ${Math.round(r.elev)}m`:''}</div>
    <div class="score-block"><div class="num" style="color:${c}">${r.total.toFixed(1)}<small>/100</small></div>
      <div class="stars" style="color:${c}">${stars(r.total)}</div></div>
    <div class="sec-t">유리한 조건</div>
    <ul class="flist good">${es.slice(0,3).map(e=>`<li><span class="mk">✓</span>${FLABEL[e.k]} ${e.v}점</li>`).join('')}</ul>
    <div class="sec-t">불리한 조건</div>
    <ul class="flist bad">${es.slice(-3).reverse().map(e=>`<li><span class="mk">△</span>${FLABEL[e.k]} ${e.v}점</li>`).join('')}</ul>
    <div class="metrics">${FKEYS.map(k=>`<div class="metric"><div class="lbl">${FLABEL[k]}</div>
      <div class="bar"><i style="width:${r.m[k]}%;background:${color(r.m[k])}"></i></div>
      <div class="val">${r.m[k]} / 100</div></div>`).join('')}</div>
    ${r.clim ? `<div class="sec-t">기후 프로필 <span style="text-transform:none;letter-spacing:0">최근 1년 실측</span></div>
    <div class="clim-grid">
      <div class="cl"><div class="ck">연평균 기온</div><div class="cv">${r.clim.annualMean.toFixed(1)}°C</div></div>
      <div class="cl"><div class="ck">프리쿨링 가능 일수</div><div class="cv" style="color:${r.clim.freeCoolDays>=250?'var(--good)':r.clim.freeCoolDays>=120?'var(--mid)':'var(--bad)'}">${r.clim.freeCoolDays}일</div></div>
      <div class="cl"><div class="ck">폭염 일수 (33°C↑)</div><div class="cv" style="color:${r.clim.heatDays<=5?'var(--good)':r.clim.heatDays<=40?'var(--mid)':'var(--bad)'}">${r.clim.heatDays}일</div></div>
      ${r.clim.humidity!==null?`<div class="cl"><div class="ck">평균 습도</div><div class="cv">${r.clim.humidity.toFixed(0)}%</div></div>`:''}
      ${r.clim.precip!==null?`<div class="cl"><div class="ck">연강수량</div><div class="cv">${Math.round(r.clim.precip)}mm</div></div>`:''}
      <div class="cl"><div class="ck">외기 냉방 비율</div><div class="cv">${Math.round(r.clim.freeCoolDays/r.clim.days*100)}%</div></div>
    </div>
    <div class="note-txt" style="font-size:11.5px">일평균 18°C 이하인 날을 프리쿨링(외기 냉방) 가능일로 계산했습니다.
      이 일수가 길수록 냉방기를 돌리지 않고 바깥 공기만으로 서버를 식힐 수 있어 전력 소비가 크게 줄어듭니다.</div>` : ''}
    <div class="sec-t">판정 근거</div>
    <div class="note-txt">기온 점수는 ${r.clim?`실측 연평균 ${r.est.toFixed(1)}°C`:`위도 기준 추정 ${r.est.toFixed(1)}°C`}로 계산했습니다${r.liveC!==null?` (현재 ${r.liveC.toFixed(1)}°C)`:''}.
      나머지 항목은 가장 가까운 기준 국가인 <b style="color:var(--ink)">${r.ref.n.replace('\n','')}</b>의 값을 사용했고,
      ${r.rem>0.15?'주요 인프라 중심지에서 떨어져 있어 전력망·통신을 감점했습니다.':'인프라 감점은 적용하지 않았습니다.'}
      현재 <b style="color:var(--ink)">${PURPOSES.find(p=>p.id===activePurpose)?.name || '사용자 지정'}</b> 가중치 기준입니다.</div>`;
  mpanel.classList.add('open');
  document.getElementById('cbtn').onclick=closePanel;
}
async function probeAt(ll){
  if(activeId!==null){ document.getElementById(`mk-${activeId}`)?.classList.remove('selected'); activeId=null; }
  if(probeMarker) map.removeLayer(probeMarker);
  probeMarker=L.marker(ll,{icon:L.divIcon({className:'',iconSize:[18,18],iconAnchor:[9,9],
    html:'<div class="probe-pin"><div class="probe-core"></div><div class="probe-ring"></div></div>'})}).addTo(map);
  mpanelIn.innerHTML='<div class="placeholder"><div class="glyph"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 3" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg></div><p>이 지점을 평가하는 중입니다…</p></div>';
  mpanel.classList.add('open');
  renderProbe(await evalPoint(ll.lat,ll.lng));
}
map.on('contextmenu',e=>probeAt(e.latlng));

let longPressTimer=null, pressOrigin=null;
const mapEl=document.getElementById('map');
function cancelLongPress(){ if(longPressTimer){ clearTimeout(longPressTimer); longPressTimer=null; } }
mapEl.addEventListener('touchstart',e=>{
  if(e.touches.length!==1) return;
  const touch=e.touches[0];
  pressOrigin={x:touch.clientX,y:touch.clientY};
  longPressTimer=setTimeout(()=>{
    const box=mapEl.getBoundingClientRect();
    probeAt(map.containerPointToLatLng(L.point(touch.clientX-box.left, touch.clientY-box.top)));
    longPressTimer=null;
  },600);
},{passive:true});
mapEl.addEventListener('touchmove',e=>{
  if(!longPressTimer||!pressOrigin) return;
  const touch=e.touches[0];
  if(Math.abs(touch.clientX-pressOrigin.x)>12||Math.abs(touch.clientY-pressOrigin.y)>12) cancelLongPress();
},{passive:true});
mapEl.addEventListener('touchend',cancelLongPress,{passive:true});
mapEl.addEventListener('touchcancel',cancelLongPress,{passive:true});

document.getElementById('zoomIn').onclick=()=>map.zoomIn();
document.getElementById('zoomOut').onclick=()=>map.zoomOut();
document.getElementById('zoomReset').onclick=goHome;
document.getElementById('mapStyleBtn').onclick=()=>loadTiles(tileIdx+1);

// 축소했을 때 마커가 뭉쳐 보이지 않도록 크기만 조절한다 (지점은 항상 전부 표시)
function updateMarkerScale(){
  const z=map.getZoom();
  document.documentElement.style.setProperty('--mk-scale', z<2.5 ? 0.62 : z<4 ? 0.8 : 1);
}

let zRaf=null;
map.on('zoomend',()=>{ if(zRaf) cancelAnimationFrame(zRaf);
  zRaf=requestAnimationFrame(()=>{ labelScale(); labelVis(); gridVis(); zRaf=null; }); });
labelScale(); labelVis();

/* ---- 검색 ---- */
const SEARCH_INDEX = [
  ...RANKED_SET.map(c=>({label:c.n, sub:c.region||'국가', lat:c.lat, lng:c.lng, type:'country', n:c.n})),
  ...SITES.map(s=>({label:`${s.co} ${s.pl}`, sub:s.ct, lat:s.lat, lng:s.lng, type:'site', id:s.id})),
];
function runSearch(q){
  const box=$('searchResults');
  const term=q.trim().toLowerCase();
  if(!term){ box.innerHTML=''; box.style.display='none'; return; }
  const hits=SEARCH_INDEX.filter(x=>
    x.label.toLowerCase().includes(term) || (x.sub||'').toLowerCase().includes(term)).slice(0,7);
  if(!hits.length){ box.innerHTML='<div class="sr-empty">검색 결과가 없습니다</div>'; box.style.display='block'; return; }
  box.innerHTML=hits.map((h,i)=>
    `<button type="button" class="sr" role="option" data-i="${i}"><span class="sr-nm">${esc(h.label)}</span><span class="sr-sub">${esc(h.sub)}</span></button>`).join('');
  box.style.display='block';
  box.querySelectorAll('.sr').forEach(el=>el.onclick=()=>{
    const h=hits[+el.dataset.i];
    map.flyTo([h.lat,h.lng], Math.max(map.getZoom(), 4.5), {duration:0.8});
    if(h.type==='site') selectSite(h.id);
    else { selected=h.n; invalidateRank(); updateRankList(); buildDetail(); showCountryCard(h.n); }
    $('searchInput').value=''; box.style.display='none';
  });
}

/* ---- 지도에서 국가를 누르면 국가 카드 ---- */
function showCountryCard(name){
  const c=ranked().find(x=>x.n===name); if(!c) return;
  const sites=sitesInCountry(name), col=color(c.score);
  // 최고·최저 항목을 한 번만 계산한다
  const bestKey=FKEYS.reduce((a,k)=>c[k]>c[a]?k:a);
  const worstKey=FKEYS.reduce((a,k)=>c[k]<c[a]?k:a);
  if(probeMarker){ map.removeLayer(probeMarker); probeMarker=null; }
  mpanelIn.innerHTML=`
    <div class="p-eyebrow"><span>국가 분석 // ${c.region||''}</span>
      <span class="p-close" id="cbtn">닫기 ✕</span></div>
    <h2>${c.n}</h2>
    <div class="sub">${sites.length?`데이터센터 ${sites.length}곳 운영 중`:'수록된 데이터센터 없음'}
      · ${ERAS[era].label} 기준</div>
    <div class="score-block"><div class="num" style="color:${col}">${c.score.toFixed(1)}<small>/100</small></div>
      <div class="stars" style="color:${col}">${stars(c.score)}</div></div>
    <div class="metrics">${FKEYS.map(k=>`<div class="metric"><div class="lbl">${FLABEL[k]}</div>
      <div class="bar"><i style="width:${c[k]}%;background:${color(c[k])}"></i></div>
      <div class="val">${c[k]} / 100</div></div>`).join('')}</div>
    <div class="sec-t">50MW 데이터센터 가정 시</div>
    <div class="clim-grid">
      <div class="cl"><div class="ck">PUE</div><div class="cv">${estPUE(c.temp).toFixed(2)}</div></div>
      <div class="cl"><div class="ck">연간 전력</div><div class="cv">${(50*estPUE(c.temp)*8760/1000).toFixed(0)}GWh</div></div>
      <div class="cl"><div class="ck">탄소집약도</div><div class="cv">${estCarbonIntensity(c)}g</div></div>
      <div class="cl"><div class="ck">전력 단가</div><div class="cv">$${estTariff(c.power).toFixed(3)}</div></div>
    </div>
    ${sites.length?`<div class="sec-t">운영 중인 데이터센터</div>
      <ul class="flist good">${sites.slice(0,8).map(x=>
        `<li><span class="mk">•</span>${esc(x.co)} ${esc(x.pl)}</li>`).join('')}</ul>`:''}
    <div class="sec-t">분석 의견</div>
    <div class="note-txt">${reasonOf(bestKey, c[bestKey])}.
      반면 ${FLABEL[worstKey]} 항목은 ${c[worstKey]}점으로 가장 취약합니다.</div>
    <button class="mini-btn" id="openInAnalysis" style="margin-top:14px;width:100%">
      분석 탭에서 자세히 보기</button>`;
  mpanel.classList.add('open');
  $('cbtn').onclick=closePanel;
  $('openInAnalysis').onclick=()=>{
    selected=c.n; invalidateRank();
    updateRankList(); buildDetail();
    document.querySelector('.tab[data-t="analysis"]').click();
  };
}
// 지도 위 오버레이(검색·범례·필터·줌)를 누를 때 지도 클릭·드래그가 함께 일어나지 않게 한다
document.querySelectorAll('#map .ov').forEach(el=>{
  L.DomEvent.disableClickPropagation(el);
  L.DomEvent.disableScrollPropagation(el);
});

map.on('click', e=>{
  const {ref,dist}=nearest(e.latlng.lat, e.latlng.lng, true);
  if(dist>900) return;
  if(nearestSea(e.latlng.lat, e.latlng.lng) < dist) return;  // 바다를 눌렀으면 무시
  if(RANKED_SET.find(c=>c.n===ref.n)) showCountryCard(ref.n); // 분석 탭 선택은 건드리지 않는다
});

/* ---- 공유 링크 ---- */
function shareURL(){
  const p=new URLSearchParams();
  p.set('c', selected); p.set('e', era); p.set('mw', itMW);
  p.set('w', FKEYS.map(k=>weights[k]).join('-'));
  if(activePurpose) p.set('p', activePurpose);
  // file:// 로 열었을 때 origin 이 "null" 이 되므로 현재 주소에서 해시만 떼어낸다
  return location.href.split('#')[0]+'#'+p.toString();
}
function restoreFromURL(){
  if(!location.hash) return;
  const p=new URLSearchParams(location.hash.slice(1));
  const w=p.get('w');
  if(w){ const v=w.split('-').map(Number);
    if(v.length===FKEYS.length && v.every(x=>!isNaN(x))){
      const patch={}; FKEYS.forEach((k,i)=>patch[k]=v[i]); setWeights(patch);
    }
  }
  if(p.get('p') && PURPOSES.find(x=>x.id===p.get('p'))) activePurpose=p.get('p'); else activePurpose=null;
  if(p.get('e') && ERAS[p.get('e')]) era=p.get('e');
  if(p.get('mw')) itMW=Math.max(5,Math.min(300,+p.get('mw')||50));
  if(p.get('c') && RANKED_SET.find(c=>c.n===p.get('c'))) selected=p.get('c');
  invalidateRank();
}

