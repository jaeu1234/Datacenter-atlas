/* ============ 5. 실시간 기온 ============ */
DATA.forEach(c=>c.tempBase=c.temp);

// URL 길이 제한을 피하려고 좌표를 나눠서 요청한다 (한 번에 40개씩)
const LIVE_BATCH=40;
async function fetchBatch(items){
  const lat=items.map(c=>c.lat.toFixed(3)).join(',');
  const lng=items.map(c=>c.lng.toFixed(3)).join(',');
  const res=await fetchTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m`);
  if(!res.ok) throw new Error('HTTP '+res.status);
  let d=await res.json();
  if(!Array.isArray(d)) d=[d];
  d.forEach((x,i)=>{
    const t=x&&x.current&&x.current.temperature_2m;
    if(typeof t==='number'&&items[i]){ items[i].liveC=t; items[i].tempLive=tempScore(t); }
  });
}
let liveFetching=false;
async function fetchLive(){
  // 버튼 연타나 10분 타이머와 수동 갱신이 겹치면 여러 요청이 동시에 날아가고,
  // 늦게 도착한 응답이 최신 응답을 덮어써 화면에 오래된 기온이 남을 수 있다.
  if(liveFetching) return;
  liveFetching=true;
  liveState={s:'load',at:liveState.at,msg:''}; renderLive();
  try{
    const batches=[];
    for(let i=0;i<DATA.length;i+=LIVE_BATCH) batches.push(DATA.slice(i,i+LIVE_BATCH));
    const results=await Promise.allSettled(batches.map(fetchBatch));
    const ok=results.filter(r=>r.status==='fulfilled').length;
    if(ok===0) throw new Error('모든 요청 실패');
    liveState={s:'ok',at:new Date(),
      msg: ok<batches.length ? `일부 지역(${batches.length-ok}/${batches.length} 구간)은 갱신하지 못했습니다.` : ''};
    if(liveOn) applyTemp();
  }catch(e){
    liveState={s:'err',at:liveState.at,msg:'실시간 데이터를 불러오지 못했습니다.'};
  }finally{
    liveFetching=false;
  }
  renderLive();
  refresh('data');
}
function applyTemp(){ DATA.forEach(c=>c.temp = (liveOn&&typeof c.tempLive==='number') ? c.tempLive : c.tempBase); }
function setLive(on){
  liveOn=on; if(liveTimer){clearInterval(liveTimer);liveTimer=null;}
  if(on && era!=='now'){
    // 현재 시각의 기온에 미래 상승폭을 덧씌우면 의미가 없으므로 시나리오를 현재로 되돌린다
    era='now'; invalidateRank();
    if(typeof renderEras==='function') renderEras();
    const note=document.getElementById('eraNote');
    if(note) note.innerHTML='실시간 기온을 켜면 기후 시나리오는 <b>현재</b>로 고정됩니다. '+
      '미래 시나리오를 보려면 실시간 기온을 꺼주세요.';
    if(filterMode!=='off') paintGrid();
  }
  if(on){ fetchLive(); liveTimer=setInterval(fetchLive,600000); }
  else{ applyTemp(); renderLive(); refresh('data'); }
}
function renderLive(){
  const el=document.getElementById('liveBar');
  const tm=liveState.at?liveState.at.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}):'—';
  let dot='off',txt='기준 데이터(연평균 기반)로 계산 중';
  if(liveOn&&liveState.s==='ok'){dot='on';txt=`실시간 기온 반영 중 · ${tm} 갱신 · 10분마다 자동`;}
  if(liveOn&&liveState.s==='load'){dot='load';txt='실시간 기온 불러오는 중…';}
  if(liveOn&&liveState.s==='err'){dot='err';txt=liveState.msg;}
  el.innerHTML=`<div class="live-left"><span class="live-dot ${dot}"></span><span class="live-text">${txt}</span></div>
    <div class="live-right"><label class="switch"><input type="checkbox" id="lt" ${liveOn?'checked':''}><span>실시간 기온 반영</span></label>
    <button class="mini-btn" id="lr" ${(liveOn&&!liveFetching)?'':'disabled'}>지금 갱신</button></div>`;
  document.getElementById('lt').onchange=e=>setLive(e.target.checked);
  document.getElementById('lr').onclick=()=>{ if(liveOn) fetchLive(); };
}

/* ============ 5-B. 데이터 출처 · 항목 해설 · AI 설명 ============ */
const SOURCES = {
  temp :{n:'Open-Meteo / NOAA 재분석',u:'https://open-meteo.com/',d:'연평균 기온 °C',   unit:'°C',  key:'tc',   fmt:v=>v.toFixed(1)+'°C'},
  power:{n:'GlobalPetrolPrices · IEA',u:'https://www.globalpetrolprices.com/electricity_prices/',d:'산업용 전기요금 2024', unit:'USD/kWh', key:'elec', fmt:v=>'$'+v.toFixed(3)+'/kWh'},
  renew:{n:'Ember Global Electricity Review',u:'https://ember-energy.org/',d:'재생에너지 발전 비중 2024', unit:'%', key:'re', fmt:v=>v+'%'},
  grid :{n:'각국 규제기관 SAIDI 공표값',u:'https://www.iea.org/',d:'연간 정전 시간 2023–24', unit:'시간/년', key:'out', fmt:v=>v+'시간/년'},
  water:{n:'WRI Aqueduct 물 스트레스',u:'https://www.wri.org/aqueduct',d:'유역 물 스트레스 2023 (배정값)'},
  net  :{n:'Ookla Speedtest Global Index',u:'https://www.speedtest.net/global-index',d:'고정 광대역 중앙값 2025', unit:'Mbps', key:'mbps', fmt:v=>v+' Mbps'},
  risk :{n:'WorldRiskIndex 2024',u:'https://weltrisikobericht.de/',d:'재해 위험 점수 (낮을수록 안전)', unit:'점', key:'wri', fmt:v=>v+'점'},
  land :{n:'각국 산업용지 시세 보고서',u:'https://data.worldbank.org/',d:'산업용지 시세 근사', unit:'USD/m²', key:'land', fmt:v=>'$'+v+'/m²'},
};
// 원자료 값을 보기 좋게 반환 (없으면 null)
function rawText(c,k){
  const src=SOURCES[k]; if(!src||!src.key) return null;
  if(src.key==='tc') return (typeof c.tc==='number') ? src.fmt(c.tc) : null;
  return (c.raw && typeof c.raw[src.key]==='number') ? src.fmt(c.raw[src.key]) : null;
}

// "왜 이 점수인가" 한 줄 해설
// 항목마다 값의 분포가 달라 고정 임계값(80/55)은 부적절하다.
// 각 항목의 상·하위 3분위를 기준으로 판정한다.
let _cuts=null;
function cuts(){
  if(_cuts) return _cuts;
  _cuts={};
  FKEYS.forEach(k=>{
    const v=RANKED_SET.map(c=>c[k]).sort((a,b)=>a-b);
    const q=f=>v[Math.min(v.length-1, Math.floor(f*(v.length-1)))];
    _cuts[k]={hi:q(0.67), lo:q(0.33)};
  });
  return _cuts;
}
function reasonOf(k,v){
  const c=cuts()[k] || {hi:80, lo:55};
  const hi=v>=c.hi, mid=v>=c.lo;
  switch(k){
    case 'temp' : return hi?'연평균 기온이 낮아 외기 냉방만으로 서버를 식힐 수 있는 날이 많습니다'
                     :mid?'냉방기 가동이 필요한 시기가 절반가량 됩니다'
                         :'고온다습해 연중 기계식 냉방이 필요하고 냉각 전력이 크게 듭니다';
    case 'power': return hi?'전력 단가가 낮아 운영비의 가장 큰 항목을 아낄 수 있습니다'
                     :mid?'전력 단가가 평균 수준입니다'
                         :'전력 단가가 높아 장기 운영비 부담이 큽니다';
    case 'renew': return hi?'수력·풍력 비중이 높아 탄소중립 목표를 맞추기 쉽습니다'
                     :mid?'재생에너지 비중이 중간 수준이라 부족분은 전력구매계약(PPA)으로 메워야 합니다'
                         :'화석연료 비중이 높아 RE100 대응이 어렵습니다';
    case 'grid' : return hi?'정전이 드물고 예비 전력이 충분해 무중단 운영에 유리합니다'
                     :mid?'전력망은 안정적이나 대규모 신규 수요 수용에는 협의가 필요합니다'
                         :'정전이 잦아 자체 발전 설비 등 추가 투자가 필요합니다';
    case 'water': return hi?'냉각수를 안정적으로 확보할 수 있고 물 분쟁 위험이 낮습니다'
                     :mid?'냉각수 확보는 가능하나 갈수기 사용 제한 가능성이 있습니다'
                         :'물 부족 지역이라 수냉식 냉각이 어렵고 지역 갈등 위험이 있습니다';
    case 'net'  : return hi?'해저케이블과 백본이 밀집해 지연시간이 짧습니다'
                     :mid?'국제 회선은 확보되나 주요 허브를 경유해야 합니다'
                         :'국제 통신 인프라가 부족해 지연시간이 길어집니다';
    case 'risk' : return hi?'지진·태풍 등 자연재해 발생 빈도가 낮습니다'
                     :mid?'일부 자연재해 위험이 있어 내진·침수 대비가 필요합니다'
                         :'지진 또는 태풍 위험이 커 설비 보호 비용이 크게 듭니다';
    case 'land' : return hi?'토지 가격이 낮아 대규모 캠퍼스를 조성하기 좋습니다'
                     :mid?'토지 비용이 평균 수준입니다'
                         :'토지 가격이 높아 부지 확보 비용이 큰 부담이 됩니다';
  }
  return '';
}

// 해당 국가에 실제로 데이터센터가 있는지 조회
function sitesInCountry(name){ return SITES.filter(s=>s.ct===name); }

// AI 자연어 추천 설명
function aiNarrative(c){
  const list=ranked(), rank=list.findIndex(x=>x.n===c.n)+1;
  const sorted=[...FACTORS].sort((a,b)=>c[b.key]-c[a.key]);
  const strong=sorted.filter(f=>c[f.key]>=75).slice(0,4);
  const weak=sorted.filter(f=>c[f.key]<55).slice(-3).reverse();
  const purpose=PURPOSES.find(p=>p.id===activePurpose);
  const pName=purpose?purpose.name:'사용자 지정 가중치';
  const real=sitesInCountry(c.n);
  const eraTxt = era==='now' ? '' :
    ` ${ERAS[era].label}년 기후 시나리오를 적용한 결과입니다.`;

  let head;
  if(rank===1) head=`<b>${c.n}</b>를 1순위로 추천합니다.`;
  else if(rank<=5) head=`<b>${c.n}</b>는 상위권(${rank}위) 후보입니다.`;
  else if(c.score>=65) head=`<b>${c.n}</b>는 조건부로 검토할 만합니다 (${rank}위).`;
  else head=`<b>${c.n}</b>는 현재 기준에서는 권장하기 어렵습니다 (${rank}위).`;

  const bullets = strong.length
    ? strong.map(f=>`<li><span class="mk">✓</span>${f.label} ${c[f.key]}점 — ${reasonOf(f.key,c[f.key])}</li>`).join('')
    : `<li><span class="mk">✓</span>뚜렷한 강점 항목이 없습니다</li>`;

  let realTxt;
  if(real.length){
    const cos=[...new Set(real.map(r=>r.co))];
    realTxt=`<div class="ai-real">✔ 실제로 ${cos.join(', ')}가 이곳에 데이터센터를 운영 중입니다 (${real.length}개 지점).
      모델의 판단이 기업들의 실제 선택과 일치합니다.</div>`;
  }else if(c.score>=80){
    realTxt=`<div class="ai-real warn">! 점수는 높지만 아직 주요 기업의 대형 데이터센터가 없습니다.
      전력·통신은 좋아도 이용자와 멀어 지연시간이 길거나, 시장 규모가 작기 때문일 수 있습니다.</div>`;
  }else realTxt='';

  const concl = c.score>=80
    ? `따라서 <b>${pName}</b> 기준으로 ${c.n}는 적합한 입지입니다.`
    : c.score>=65
    ? `<b>${pName}</b> 기준으로 무난하지만, 위 약점을 보완할 계획이 필요합니다.`
    : `<b>${pName}</b> 기준으로는 다른 후보를 먼저 검토하는 편이 낫습니다.`;

  return `<div class="ai-head">${head} 총점 <b>${c.score.toFixed(1)}점</b>입니다.${eraTxt}</div>
    <div class="ai-sec"><div class="ai-sub">① 장점</div>
      <ul class="flist good">${bullets}</ul></div>
    <div class="ai-sec"><div class="ai-sub">② 단점</div>
      ${weak.length ? `<ul class="flist bad">${
        weak.map(f=>`<li><span class="mk">△</span>${f.label} ${c[f.key]}점 — ${reasonOf(f.key,c[f.key])}</li>`).join('')}</ul>`
        : '<div class="ai-none">뚜렷한 약점 항목이 없습니다.</div>'}</div>
    <div class="ai-sec"><div class="ai-sub">③ 실제 사례</div>
      ${realTxt || '<div class="ai-none">참고할 실제 운영 사례가 수록되어 있지 않습니다.</div>'}</div>
    <div class="ai-sec"><div class="ai-sub">④ 추천 여부</div>
      <div class="ai-concl">${concl}</div></div>`;
}

/* ============ 5-C. 운영 시뮬레이터 (전력·냉각·탄소·비용) ============ */

// 기후가 좋을수록 PUE(전력효율지표)가 1에 가까워진다
function estPUE(tempScore){ return 1.10 + (1 - tempScore/100) * 0.45; }
// 전력 탄소집약도는 실제 계통 값을 쓴다.
// 재생에너지 비율만으로 추정하면 원자력 비중이 큰 나라(프랑스·스웨덴·한국)가 크게 왜곡된다.
function estCarbonIntensity(c){
  if(typeof c==='number') return Math.round(700 - c*6.2);
  return (typeof c.ci==='number') ? c.ci : Math.round(700 - (c.renew||0)*6.2);
}
// 전력 점수가 높을수록 단가가 싸다 (USD/kWh)
function estTariff(power){ return 0.28 - power/100*0.22; }

// 실시간 기온은 '지금 이 순간' 값이라 연간 효율 추정에는 쓰지 않는다
function annualTempScore(c){
  const base = (typeof c.tempBase==='number') ? c.tempBase : c.temp;
  return mval({lat:c.lat, temp:base, water:c.water, risk:c.risk}, 'temp');
}
// 냉각 방식별 PUE 보정과 물 사용량 계수
const COOLING = {
  air   :{name:'공랭식',      pue:+0.10, water:0.4, why:'설비가 단순하지만 더운 지역에서 전력을 많이 씁니다'},
  water :{name:'수냉식',      pue:0,     water:1.0, why:'냉각 효율이 좋지만 물을 많이 소비합니다'},
  free  :{name:'외기 냉방',   pue:-0.06, water:0.15,why:'서늘한 지역에서만 가능하며 전력·물을 모두 아낍니다'},
  liquid:{name:'액침 냉각',   pue:-0.12, water:0.1, why:'GPU 고밀도 랙에 적합하나 초기 투자비가 큽니다'},
};

// 외기 냉방은 연평균 기온이 낮은 지역에서만 연중 가능하다.
// 16°C 이상이면 이점이 사라지고, 그 사이는 부분적으로만 적용된다.
function freeCoolFeasibility(c){
  const tc = (typeof c.tc==='number') ? c.tc : 12;
  return Math.max(0, Math.min(1, (16 - tc) / 12));
}
function simulate(c){
  const cool=COOLING[coolingMode]||COOLING.water;
  const feas = coolingMode==='free' ? freeCoolFeasibility(c) : 1;
  const pueAdj = coolingMode==='free'
    ? cool.pue*feas + COOLING.air.pue*(1-feas)     // 불가능한 만큼 공랭식으로 대체된다
    : cool.pue;
  const waterAdj = coolingMode==='free'
    ? cool.water*feas + COOLING.air.water*(1-feas)
    : cool.water;
  const pue = Math.max(1.03, estPUE(annualTempScore(c)) + pueAdj);
  const annualGWh = itMW * pue * 8760 / 1000;          // 연간 총 전력량
  const coolShare = (pue - 1) / pue;                    // 냉각 등 부대설비 비중
  const ci = estCarbonIntensity(c);
  // GWh × (g/kWh) = 톤  (1GWh = 1e6 kWh, 1e6 g = 1톤 이므로 계수가 상쇄된다)
  const tonsCO2 = annualGWh * ci;                       // 연간 탄소배출 (톤)
  const tariff = estTariff(c.power);
  // GWh × ($/kWh) = 백만 달러  (1e6 kWh × $/kWh = 백만 달러 단위)
  const costM = annualGWh * tariff;                     // 연간 전기요금 (백만 달러)
  const waterKL = annualGWh * 1.8 * (1 - annualTempScore(c)/100) * waterAdj; // 연간 냉각수 (천 톤)
  // 장비 규모 추정: GPU 서버 1대(8GPU) 약 10kW, 일반 서버 약 0.5kW
  const gpuCount = Math.round(itMW*1000*gpuShare/100/1.25);      // GPU 1장당 약 1.25kW
  const serverCount = Math.round(itMW*1000*(100-gpuShare)/100/0.5);
  // GPU 고밀도 랙은 배전·냉각 설비가 더 필요하고, 액침 냉각은 초기 투자가 크다
  const capexPerMW = 7.5 + (gpuShare/100)*6.5 + (coolingMode==='liquid'?2.2:0);
  const capexM = itMW * capexPerMW;
  return {pue, annualGWh, coolShare, ci, tonsCO2, tariff, costM, waterKL,
          gpuCount, serverCount, capexM, capexPerMW, cool, feas};
}

let simBuilt=false;
function buildSimulator(){
  const box=$('simBox'); if(!box) return;
  box.innerHTML=`
    <div class="sim-input">
      <label>IT 부하 규모
        <input type="range" id="mwRange" min="5" max="500" step="5" value="${itMW}"
               aria-label="IT 부하 규모(메가와트)">
        <b id="mwLabel">${itMW}MW</b>
      </label>
      <label>GPU 랙 비중
        <input type="range" id="gpuRange" min="0" max="100" step="5" value="${gpuShare}"
               aria-label="GPU 랙 비중(퍼센트)">
        <b id="gpuLabel">${gpuShare}%</b>
      </label>
      <div class="cool-row">냉각 방식
        ${Object.entries(COOLING).map(([k,v])=>
          `<button class="cool-btn ${k===coolingMode?'on':''}" data-c="${k}"
            title="${v.why}">${v.name}</button>`).join('')}
      </div>
      <div class="sim-hint" id="coolHint">${COOLING[coolingMode].why}</div>
    </div>
    <div class="sim-grid">
      ${[['장비 규모','gear'],['PUE (전력효율)','pue'],['연간 전력 소비','gwh'],
         ['연간 전기요금','cost'],['연간 냉각비 몫','coolcost'],['연간 탄소배출','co2'],
         ['연간 냉각수','water'],['초기 건설비(추정)','capex'],['1위 국가와 비교','cmp']]
        .map(([k,id])=>`<div class="sim-card"><div class="sk">${k}</div>
         <div class="sv" id="sv-${id}">—</div><div class="sn" id="sn-${id}"></div></div>`).join('')}
    </div>
    <div class="sim-note">PUE는 기후 점수와 냉각 방식으로, 탄소집약도는 실제 계통 값으로,
      전력 단가는 전력 비용 점수로 환산한 <b>추정값</b>입니다.
      장비 수량은 GPU 1장 약 1.25kW, 일반 서버 약 0.5kW로 가정했습니다.</div>`;

  $('mwRange').addEventListener('input',e=>{
    itMW=+e.target.value; $('mwLabel').textContent=itMW+'MW'; updateSimulator(); });
  $('gpuRange').addEventListener('input',e=>{
    gpuShare=+e.target.value; $('gpuLabel').textContent=gpuShare+'%'; updateSimulator(); });
  box.querySelectorAll('.cool-btn').forEach(b=>b.onclick=()=>{
    coolingMode=b.dataset.c;
    box.querySelectorAll('.cool-btn').forEach(x=>x.classList.toggle('on',x===b));
    $('coolHint').textContent=COOLING[coolingMode].why;
    updateSimulator();
  });
  simBuilt=true;
}
function updateSimulator(){
  if(!simBuilt) buildSimulator();
  const c=ranked().find(x=>x.n===selected); if(!c || !$('sv-pue')) return;
  const r=simulate(c), best=ranked()[0], rb=simulate(best);
  const set=(id,val,note,col)=>{
    const v=$('sv-'+id); if(!v) return;
    v.innerHTML=val; v.style.color=col||'';
    const n=$('sn-'+id); if(n && note!==undefined) n.textContent=note;
  };
  set('gear', `${r.gpuCount.toLocaleString()}<span>GPU</span>`,
      `일반 서버 약 ${r.serverCount.toLocaleString()}대`);
  set('pue', r.pue.toFixed(2),
      coolingMode==='free'
        ? (r.feas>=0.85 ? '외기 냉방 연중 가능'
          : r.feas<=0.05 ? '이 지역은 외기 냉방이 사실상 불가능'
          : `외기 냉방 가능 비율 약 ${Math.round(r.feas*100)}%`)
        : `${r.cool.name} 기준`,
      r.pue<=1.2?'var(--good)':r.pue<=1.35?'var(--mid)':'var(--bad)');
  set('gwh', `${r.annualGWh.toFixed(0)}<span>GWh</span>`, `이 중 ${(r.coolShare*100).toFixed(0)}%가 냉각·부대설비`);
  set('cost', `$${r.costM.toFixed(0)}<span>M</span>`, `단가 $${r.tariff.toFixed(3)}/kWh 가정`);
  set('coolcost', `$${(r.costM*r.coolShare).toFixed(0)}<span>M</span>`, '전기요금 중 냉각이 차지하는 몫');
  set('co2', `${Math.round(r.tonsCO2).toLocaleString()}<span>tCO₂</span>`, `탄소집약도 ${r.ci}g/kWh`,
      r.tonsCO2<100000?'var(--good)':r.tonsCO2<400000?'var(--mid)':'var(--bad)');
  set('water', `${Math.round(r.waterKL).toLocaleString()}<span>천 톤</span>`,
      coolingMode==='free' && r.feas<0.85 ? '부족분은 공랭식으로 대체' : `${r.cool.name} 기준`);
  set('capex', `$${r.capexM.toFixed(0)}<span>M</span>`,
      `MW당 약 $${r.capexPerMW.toFixed(1)}M (GPU ${gpuShare}%${coolingMode==='liquid'?' · 액침':''})`);
  const dCO2=r.tonsCO2-rb.tonsCO2, dCost=r.costM-rb.costM;
  set('cmp', `${dCO2>=0?'+':''}${Math.round(dCO2).toLocaleString()} tCO₂`,
      `${best.n} 대비 전기요금 ${dCost>=0?'+':''}$${dCost.toFixed(0)}M`,
      dCO2>0?'var(--bad)':'var(--good)');
  const el=$('sv-cmp'); if(el) el.style.fontSize='15px';
}
const renderSimulator = updateSimulator;

/* ---- 점수 계산 수식 공개 ---- */
function renderFormula(){
  const box=$('formulaBox'); if(!box) return;
  const c=ranked().find(x=>x.n===selected); if(!c) return;
  const w=effectiveWeights(), tw=effTotal()||1;
  const terms=FACTORS.map(f=>({
    label:f.label, v:c[f.key],
    pct:(w[f.key]/tw*100),
    part:c[f.key]*w[f.key]/tw,
  }));
  const total=terms.reduce((a,t)=>a+t.part,0);
  box.innerHTML=`
    <div class="fm-line">최종점수 = Σ (항목 점수 × 유효 가중치) ÷ 가중치 합계</div>
    <div class="fm-calc">${terms.map(t=>
      `<div class="fm-term"><span class="fm-nm">${t.label}</span>
       <span class="fm-num">${t.v}</span><span class="fm-op">×</span>
       <span class="fm-w">${t.pct.toFixed(1)}%</span><span class="fm-op">=</span>
       <span class="fm-part">${t.part.toFixed(2)}</span></div>`).join('')}
      <div class="fm-term fm-sum"><span class="fm-nm">합계</span>
        <span class="fm-part">${total.toFixed(2)}</span></div>
    </div>
    <div class="fm-note">${decorrelate
      ? '지표 중복 보정이 켜져 있어, 설정한 가중치에서 상관이 높은 항목의 몫을 줄인 <b>유효 가중치</b>를 사용합니다.'
      : '설정한 가중치를 그대로 사용합니다. 상관이 높은 항목을 보정하려면 위의 <b>지표 중복 보정</b>을 켜세요.'}
      ${era!=='now'?`<br>${ERAS[era].label} 시나리오가 적용되어 기온·수자원·재해 항목이 조정된 값입니다.`:''}</div>`;
}

/* ============ 5-D. 점수 계산 과정 시각화 ============ */
function renderBreakdown(){
  const box=$('breakBox'); if(!box) return;
  renderFormula();
  const c=ranked().find(x=>x.n===selected); if(!c) return;
  const ew=effectiveWeights(), tw=effTotal()||1;
  const parts=FACTORS.map((f,i)=>({
    label:f.label, w:ew[f.key], v:c[f.key],
    contrib: c[f.key]*ew[f.key]/tw,
    col: SERIES_COLORS[i%SERIES_COLORS.length],
  })).sort((a,b)=>b.contrib-a.contrib);
  const total=parts.reduce((a,x)=>a+x.contrib,0);
  box.innerHTML=`
    <div class="bd-bar">${parts.map(p=>
      `<i style="width:${p.contrib/total*100}%;background:${p.col}" title="${p.label} ${p.contrib.toFixed(1)}점"></i>`).join('')}</div>
    <div class="bd-list">${parts.map(p=>`
      <div class="bd-row">
        <span class="bd-dot" style="background:${p.col}"></span>
        <span class="bd-nm">${p.label}</span>
        <span class="bd-calc">${p.v}점 × ${(p.w/tw*100).toFixed(0)}%</span>
        <span class="bd-val">${p.contrib.toFixed(1)}</span>
      </div>`).join('')}
      <div class="bd-row bd-total">
        <span class="bd-dot" style="background:transparent"></span>
        <span class="bd-nm">합계</span><span class="bd-calc"></span>
        <span class="bd-val">${total.toFixed(1)}</span>
      </div>
    </div>`;
}

/* ============ 5-E. 실제 공개 데이터 연동 ============
   World Bank Open Data API 는 인증 키가 필요 없고 CORS 도 열려 있어 브라우저에서 바로 호출된다.
   IEA·Ember·Ookla 는 무료 공개 API 가 없어 현재는 추정값을 유지한다. */

const WB_INDICATORS = [
  { key:'renew', code:'EG.ELC.RNEW.ZS', alt:'EG.FEC.RNEW.ZS',
    label:'재생에너지', unit:'%', org:'World Bank',
    desc:'전체 발전량 중 재생에너지 비율',
    // 비율이 곧 점수 (0~100)
    toScore: v => Math.round(Math.max(0, Math.min(100, v))) },

  { key:'grid', code:'EG.ELC.LOSS.ZS',
    label:'전력망 안정성', unit:'% 손실', org:'World Bank',
    desc:'송배전 손실률 — 낮을수록 계통이 촘촘하고 안정적',
    // 손실 4% → 100점, 20% 이상 → 낮은 점수
    toScore: v => Math.round(Math.max(5, Math.min(100, 100 - (v - 4) * 5.5))) },

  { key:'net', code:'IT.NET.BBND.P2',
    label:'인터넷 인프라', unit:'명/100명', org:'World Bank',
    desc:'인구 100명당 유선 초고속 인터넷 가입 수',
    // 상위국이 약 45 수준
    toScore: v => Math.round(Math.max(5, Math.min(100, v / 45 * 100))) },

  { key:'land', code:'NY.GDP.PCAP.CD',
    label:'토지 비용', unit:'USD', org:'World Bank',
    desc:'1인당 GDP — 소득이 높을수록 토지·건설비가 비싸다는 대리 지표',
    toScore: v => Math.round(Math.max(5, Math.min(100, 100 - (v / 70000) * 88))) },

  { key:'water', code:'ER.H2O.FWST.ZS',
    label:'냉각 수자원', unit:'% (취수량/가용 담수)', org:'World Bank',
    desc:'물 스트레스 수준 — 가용 담수 대비 취수 비율이 낮을수록 냉각용수 확보가 유리',
    // 물 스트레스 0% → 100점, 100% 이상(취수량이 가용량을 넘는 극심한 물부족) → 최저점
    toScore: v => Math.round(Math.max(3, Math.min(100, 100 - v))) },
];

// 연동 상태: key → {status, year, n, note}
const dataStatus = {
  temp :{status:'est',   src:'문헌 근사치', note:'대표 지점 연평균 기온(°C)을 코드에 입력한 값 — 아래 버튼으로 실측 교체 가능'},
  power:{status:'est',   src:'IEA·GlobalPetrolPrices', note:'무료 API 없음 — 공개 통계를 참고한 추정값'},
  renew:{status:'est',   src:'World Bank', note:'아직 불러오지 않음'},
  grid :{status:'est',   src:'World Bank', note:'아직 불러오지 않음'},
  water:{status:'est',   src:'World Bank', note:'아직 불러오지 않음'},
  net  :{status:'est',   src:'World Bank', note:'아직 불러오지 않음'},
  risk :{status:'est',   src:'WorldRiskIndex', note:'무료 API 없음 — 보고서 수치 기반 추정값'},
  land :{status:'est',   src:'World Bank', note:'아직 불러오지 않음'},
};

async function fetchWorldBank(code){
  const url=`https://api.worldbank.org/v2/country/all/indicator/${code}`
    +`?format=json&per_page=400&mrnev=1`;
  const res=await fetchTimeout(url);
  if(!res.ok) throw new Error('HTTP '+res.status);
  const json=await res.json();
  const rows=Array.isArray(json)&&json[1] ? json[1] : [];
  const out={};
  rows.forEach(r=>{
    if(r && r.countryiso3code && r.value!==null && r.country){
      const iso2=(r.country.id||'').toUpperCase();
      if(iso2) out[iso2]={ value:+r.value, year:r.date };
    }
  });
  return out;
}
// World Bank 는 여러 지표를 연달아 요청하면 가끔 한두 개만 일시적으로 실패한다
// (레이트리밋 추정). 한 번 더 시도해 볼 가치가 있어 짧게 재시도한다.
async function fetchWorldBankRetry(code, tries=2){
  let lastErr;
  for(let i=0;i<tries;i++){
    try{ return await fetchWorldBank(code); }
    catch(e){ lastErr=e; if(i<tries-1) await new Promise(r=>setTimeout(r, 500*(i+1))); }
  }
  throw lastErr;
}

// 최근 1년 관측 기록에서 국가별 연평균 기온을 실제로 받아온다
async function fetchAnnualTemps(){
  const end=new Date(Date.now()-6*864e5), start=new Date(end-364*864e5);
  const fmt=d=>d.toISOString().slice(0,10);
  const targets=RANKED_SET.filter(c=>typeof c.lat==='number');
  const BATCH=12;
  let applied=0, failedBatches=0;
  const totalBatches=Math.ceil(targets.length/BATCH);

  for(let i=0;i<targets.length;i+=BATCH){
    const part=targets.slice(i,i+BATCH);
    const lat=part.map(c=>c.lat.toFixed(3)).join(',');
    const lng=part.map(c=>c.lng.toFixed(3)).join(',');
    const url=`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}`
      +`&start_date=${fmt(start)}&end_date=${fmt(end)}&daily=temperature_2m_mean&timezone=UTC`;
    // 배치 하나가 실패해도 나머지 배치는 계속 시도한다 — 예전엔 여기서 던지면
    // 이미 성공한 앞쪽 배치의 실측값이 반영됐는데도 전체가 "연동 실패"로 표시됐다.
    try{
      const res=await fetchTimeout(url);
      if(!res.ok) throw new Error('HTTP '+res.status);
      let d=await res.json();
      if(!Array.isArray(d)) d=[d];
      d.forEach((row,k)=>{
        const vals=row && row.daily && row.daily.temperature_2m_mean;
        if(!Array.isArray(vals)) return;
        const ok=vals.filter(v=>typeof v==='number');
        if(ok.length<200) return;                      // 결측이 많으면 건너뛴다
        const mean=ok.reduce((a,b)=>a+b,0)/ok.length;
        const c=part[k];
        if(c){ c.tc=+mean.toFixed(1); c.temp=tempScore(c.tc); applied++; }
      });
    }catch(e){
      failedBatches++;
    }
  }

  // 내륙 보조 기준점은 부모 국가의 새 기온에 위도 보정을 다시 적용한다
  DATA.filter(c=>c._parent).forEach(c=>{
    const src=RANKED_SET.find(x=>x.n===c._parent);
    if(!src) return;
    c.tc = src.tc + (estTemp(c.lat) - estTemp(src.lat));
    c.temp = tempScore(c.tc);
  });
  // 기준 기온이 바뀌었으므로 실시간 모드의 원본 값도 갱신한다
  DATA.forEach(c=>{ c.tempBase = c.temp; });
  return {applied, totalBatches, failedBatches};
}

let syncing=false;
async function syncRealData(){
  if(syncing) return;
  syncing=true;
  renderDataPanel('loading');

  // try/finally 로 감싸 예상 밖 오류가 나도 잠금(syncing)이 풀리고 버튼이
  // "불러오는 중…" 상태로 영구히 멈추지 않게 한다.
  try{
    // (1) 연평균 기온 실측
    try{
      const {applied:n, totalBatches, failedBatches}=await fetchAnnualTemps();
      dataStatus.temp = n>0
        ? {status:'real', src:'Open-Meteo 아카이브', year:'최근 12개월',
           note: failedBatches>0
             ? `대표 지점 연평균 기온 실측 (${n}개국 연동, ${failedBatches}/${totalBatches} 구간은 갱신하지 못했습니다)`
             : `대표 지점 연평균 기온 실측 (${n}개국 연동)`}
        : {status:'fail', src:'Open-Meteo', note:'관측 자료를 받지 못했습니다'};
    }catch(e){
      dataStatus.temp = {status:'fail', src:'Open-Meteo',
        note:'네트워크가 차단되었거나 응답이 없습니다 — 문헌 근사치를 유지합니다'};
    }

    // (2) World Bank 지표
    for(const ind of WB_INDICATORS){
      try{
        let map = await fetchWorldBankRetry(ind.code);
        if(Object.keys(map).length < 10 && ind.alt) map = await fetchWorldBankRetry(ind.alt);

        let applied=0, years=[];
        RANKED_SET.forEach(c=>{
          const row = c.iso && map[c.iso];
          if(!row) return;
          c[ind.key] = ind.toScore(row.value);
          c['_raw_'+ind.key] = row.value;
          applied++; years.push(+row.year);
        });
        dataStatus[ind.key] = applied>0
          ? { status:'real', src:ind.org, n:applied,
              year: years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '',
              note:`${ind.desc} (${applied}개국 연동)` }
          : { status:'fail', src:ind.org, note:'응답에 해당 국가 자료가 없습니다' };
      }catch(e){
        dataStatus[ind.key] = { status:'fail', src:ind.org,
          note:'네트워크가 차단되었거나 응답이 없습니다' };
      }
    }

    // 보조 기준점(rank:0)은 같은 이름의 국가 값을 물려받는다
    DATA.filter(c=>!c.rank).forEach(c=>{
      const src=RANKED_SET.find(x=>x.n===c.n);
      if(src) FKEYS.forEach(k=>{ if(k!=='temp') c[k]=src[k]; });
    });
  }finally{
    syncing=false;
    SITES.forEach(x=>{ delete x._ref; });   // 지점별 기준점 캐시 무효화
    refresh('data');
  }
}

function renderDataPanel(state){
  const box=$('dataPanel'); if(!box) return;
  const badge=st=>st==='real'?'<span class="ds real">실측 연동</span>'
    :st==='fail'?'<span class="ds fail">연동 실패</span>'
    :'<span class="ds est">추정값</span>';
  const realCount=FKEYS.filter(k=>dataStatus[k].status==='real').length;
  box.innerHTML=`
    <div class="ds-head">
      <div><b>${realCount} / ${FKEYS.length}</b> 항목이 실제 공개 데이터입니다</div>
      <button class="mini-btn ${state==='loading'?'':'primary'}" id="syncBtn"
        ${state==='loading'?'disabled':''}>
        ${state==='loading'?'불러오는 중…':'공개 데이터 불러오기'}</button>
    </div>
    <div class="ds-list">
      ${FKEYS.map(k=>{
        const d=dataStatus[k];
        return `<div class="ds-row">
          <span class="ds-nm">${FLABEL[k]}</span>
          ${badge(d.status)}
          <span class="ds-src">${esc(d.src)}${d.year?` · ${d.year}`:''}</span>
          <span class="ds-note">${esc(d.note||'')}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="ds-foot">World Bank Open Data 는 인증 키 없이 호출할 수 있어 브라우저에서 바로 연동됩니다.
      전력 단가(IEA)·물 스트레스(WRI)·재해 위험(WorldRiskIndex)은 무료 API 가 없어
      공개 보고서를 참고한 추정값을 유지합니다. 불러온 값은 각 지표의 최신 연도 자료입니다.</div>`;
  const btn=$('syncBtn');
  if(btn && state!=='loading') btn.onclick=syncRealData;
}

