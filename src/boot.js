/* ============ 7. 초기화 ============ */
$('stCount').textContent=SITES.length;
const scn=$('siteCountNote');
if(scn) scn.textContent=`전 세계에는 약 11,000개의 데이터센터가 있습니다. `
  +`이 지도에는 ${new Set(SITES.map(x=>x.co)).size}개 사업자의 대표 캠퍼스 ${SITES.length}곳을 표시합니다.`;
// 같은 도시의 지점은 하나로 묶여 표시되므로 마커 수를 함께 알려 준다
$('stCountLabel').textContent = GROUPS.length<SITES.length
  ? `수록 지점 · ${GROUPS.length}군` : '수록 지점';
$('stCountLabel').title = `데이터센터 ${SITES.length}곳을 지도에서는 ${GROUPS.length}개 마커로 묶어 표시합니다`;
restoreFromURL();
applyTemp(); invalidateRank();
renderLive(); renderChips(); buildWeights(); renderImpact();
buildRankList(); updateRankList(); buildDetail(); buildCompare(); updateMarkerColors();
renderEras(); renderSources();
/* ---- 아코디언: 분석 탭의 긴 섹션을 접을 수 있게 ---- */
function setupAccordion(){
  document.querySelectorAll('#analysisPane section').forEach(sec=>{
    const body=sec.querySelector('.ai-box,.detail,.break-box,.sim-box,.site-cmp');
    if(!body) return;
    const head=sec.querySelector('.sec-head');
    head.classList.add('collapsible');
    head.insertAdjacentHTML('beforeend','<span class="acc-arrow">▾</span>');
    head.setAttribute('role','button');
    head.setAttribute('tabindex','0');
    head.setAttribute('aria-expanded','true');
    const toggle=()=>{
      const closed=sec.classList.toggle('closed');
      head.setAttribute('aria-expanded', String(!closed));
    };
    head.addEventListener('click',toggle);
    head.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); }
    });
  });
}

/* ---- 기본 / 고급 모드 ---- */
function setMode(adv){
  $('weights').style.display = adv ? '' : 'none';
  $('modeHint').style.display = adv ? 'none' : '';
  $('modeAdv').classList.toggle('on', adv);
  $('modeBasic').classList.toggle('on', !adv);
  $('modeAdv').setAttribute('aria-pressed', String(adv));
  $('modeBasic').setAttribute('aria-pressed', String(!adv));
}
/* ---- 지표 중복(상관) 보정 ---- */
function renderCorr(){
  const C=corrMatrix();
  const pairs=[];
  FKEYS.forEach((a,i)=>FKEYS.slice(i+1).forEach(b=>{
    const r=C[a][b];
    if(Math.abs(r)>=0.5) pairs.push({a,b,r});
  }));
  pairs.sort((x,y)=>Math.abs(y.r)-Math.abs(x.r));
  $('decorrNote').textContent = decorrelate
    ? `중복 ${pairs.length}쌍의 가중치를 낮춰 계산 중`
    : `상관 0.5 이상인 항목이 ${pairs.length}쌍 있습니다`;
  $('corrBox').innerHTML = pairs.length ? `
    <div class="corr-title">서로 겹치는 지표</div>
    ${pairs.map(p=>`<div class="corr-row">
      <span>${FLABEL[p.a]} ↔ ${FLABEL[p.b]}</span>
      <span class="corr-r" style="color:${Math.abs(p.r)>=0.7?'var(--bad)':'var(--mid)'}">r = ${p.r.toFixed(2)}</span>
    </div>`).join('')}
    <div class="corr-note">예를 들어 전력망이 안정적인 나라는 대체로 인터넷 인프라도 좋습니다.
      두 항목에 모두 가중치를 주면 같은 성질이 두 번 반영됩니다.
      보정을 켜면 겹치는 만큼 유효 가중치를 낮춰 계산합니다.</div>` : '';
}
$('decorrToggle').onchange=e=>{
  decorrelate=e.target.checked;
  renderCorr();
  refresh('weights');
};

$('modeBasic').onclick=e=>{ e.stopPropagation(); setMode(false); };
$('modeAdv').onclick=e=>{ e.stopPropagation(); setMode(true); };
setMode(true);   // 가중치 슬라이더를 기본으로 펼쳐 둔다

/* ---- 예시 데이터 배너 ---- */
// 저장소를 못 쓰는 환경에서도 앱이 멈추지 않도록 감싼다
const store={
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
};
if(store.get('atlas.banner')==='closed') $('dataBanner').style.display='none';
$('nbClose').onclick=()=>{ $('dataBanner').style.display='none'; store.set('atlas.banner','closed'); };

$('repPreview').onclick=previewReport;
$('repDownload').onclick=downloadReport;
$('repStudy').onclick=()=>{
  const box=$('reportBox');
  box.style.display='block'; box.textContent=buildStudyReport();
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
  download(`탐구보고서-${selected}-${new Date().toISOString().slice(0,10)}.md`,
           buildStudyReport(), 'text/markdown;charset=utf-8');
};
$('repCSV').onclick=()=>download(
  `datacenter-scores-${new Date().toISOString().slice(0,10)}.csv`, toCSV(), 'text/csv;charset=utf-8');
$('repPDF').onclick=()=>{
  const box=$('reportBox');
  box.style.display='block'; box.textContent=buildReport();
  document.body.classList.add('printing');
  setTimeout(()=>{ window.print();
    setTimeout(()=>document.body.classList.remove('printing'),400); },120);
};
$('repShare').onclick=async ()=>{
  const url=shareURL();
  try{ await navigator.clipboard.writeText(url); $('repShare').textContent='링크가 복사되었습니다'; }
  catch(e){ prompt('아래 링크를 복사하세요', url); }
  setTimeout(()=>{ $('repShare').textContent='분석 결과 링크 복사'; },2200);
};
$('searchInput').addEventListener('input',e=>runSearch(e.target.value));
$('searchInput').addEventListener('blur',()=>setTimeout(()=>{
  if(!$('searchResults').contains(document.activeElement)) $('searchResults').style.display='none';
},180));
$('searchInput').addEventListener('focus',e=>{ if(e.target.value.trim()) runSearch(e.target.value); });
renderBreakdown(); renderSimulator();
setupAccordion(); updateMarkerScale(); renderCorr(); renderDataPanel(); renderSiteFilter();

/* ---- 분석 탭 바로가기: 클릭하면 해당 그룹으로 스크롤, 스크롤 위치에 따라 활성 표시 ---- */
(function setupQuickNav(){
  const nav=document.querySelector('.quicknav'); if(!nav) return;
  const chips=Array.from(nav.querySelectorAll('.qn-chip'));
  chips.forEach(b=>b.addEventListener('click',()=>{
    const target=$(b.dataset.jump);
    if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
  }));
  const targets=chips.map(b=>$(b.dataset.jump)).filter(Boolean);
  const scrollRoot=document.querySelector('#analysisPane .scroll');
  if(!targets.length || !scrollRoot || typeof IntersectionObserver==='undefined') return;
  const io=new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const i=targets.indexOf(en.target);
      chips.forEach((b,j)=>b.classList.toggle('on', j===i));
    });
  }, {root: scrollRoot, rootMargin:'-10% 0px -75% 0px', threshold:0});
  targets.forEach(t=>io.observe(t));
})();
