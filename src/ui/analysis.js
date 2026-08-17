/* ============ 6. 분석 화면 (증분 업데이트 구조) ============ */

// 외부 데이터가 들어올 때를 대비한 HTML 이스케이프 (현재는 내부 상수만 사용)

const elWeights=$('weights'), elImpact=$('impact'), elRankList=$('rankList'),
      elDetail=$('detail'), elCmpTable=$('cmpTable'), elStTop=$('stTop');

/* ---- 목적 칩 ---- */
function renderChips(){
  $('chips').innerHTML=PURPOSES.map(p=>
    `<button class="chip ${p.id===activePurpose?'on':''}" data-p="${p.id}" aria-pressed="${p.id===activePurpose}">${p.name}</button>`).join('');
  $('chips').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
    const before=ranked().map(c=>c.n);
    activePurpose=b.dataset.p; lastPurpose=activePurpose;
    setWeights(PURPOSES.find(p=>p.id===activePurpose).w);
    lastShift=shift(before,ranked().map(c=>c.n));
    renderChips(); syncWeights();
    refresh('weights');
  });
}
function shift(a,b){
  const mv=b.map((n,i)=>({n,d:a.indexOf(n)-i})).filter(x=>x.d!==0).sort((x,y)=>y.d-x.d);
  return mv.length?{up:mv[0],down:mv[mv.length-1]}:null;
}

/* ---- 가중치 슬라이더: DOM은 한 번만 만들고 이후엔 값만 갱신 ---- */
let sliderEls={}, valueEls={}, dragBefore=null, recalcRaf=null;

function buildWeights(){
  elWeights.innerHTML=FACTORS.map(f=>`
    <div class="w-row">
      <label><span>${f.label}</span><b data-v="${f.key}">${weights[f.key]}%</b></label>
      <input type="range" min="0" max="45" step="1" value="${weights[f.key]}" data-k="${f.key}"
             aria-label="${f.label} 가중치" aria-valuemin="0" aria-valuemax="45"
             aria-valuenow="${weights[f.key]}" aria-valuetext="${weights[f.key]}퍼센트">
      <div class="w-hint">${f.up}</div>
    </div>`).join('');

  elWeights.querySelectorAll('input[type=range]').forEach(r=>{
    const k=r.dataset.k;
    sliderEls[k]=r;
    valueEls[k]=elWeights.querySelector(`b[data-v="${k}"]`);

    // 드래그 시작 시점의 순위를 기억해 둔다
    const markStart=()=>{ if(dragBefore===null) dragBefore=ranked().map(c=>c.n); };
    r.addEventListener('pointerdown',markStart);
    r.addEventListener('keydown',markStart);

    // 드래그 중: 숫자만 즉시 바꾸고, 무거운 계산은 다음 프레임으로 미룬다
    r.addEventListener('input',()=>{
      const v=+r.value;
      if(weights[k]===v) return;
      setWeights({[k]:v});
      valueEls[k].textContent=v+'%';
      r.setAttribute('aria-valuenow',v); r.setAttribute('aria-valuetext',v+'퍼센트');
      if(activePurpose!==null){ activePurpose=null; renderChips(); }
      scheduleRecalc();
    });

    // 드래그를 놓았을 때만 지도 색상과 순위 변동 요약을 갱신한다
    r.addEventListener('change',()=>{
      if(dragBefore){ lastShift=shift(dragBefore,ranked().map(c=>c.n)); dragBefore=null; }
      refresh('weights');
    });
  });
}
function syncWeights(){
  FKEYS.forEach(k=>{
    if(sliderEls[k]) sliderEls[k].value=weights[k];
    if(valueEls[k]) valueEls[k].textContent=weights[k]+'%';
  });
}
function scheduleRecalc(){
  if(recalcRaf) return;
  recalcRaf=requestAnimationFrame(()=>{ recalcRaf=null; refresh('drag'); });
}
function renderImpact(){
  if(totalWeight()===0){
    elImpact.innerHTML='<b style="color:var(--mid)">모든 가중치가 0입니다.</b> ' +
      '최소 한 개 항목의 가중치를 올려야 점수가 계산됩니다. 목적 프리셋을 누르면 기본값으로 되돌아갑니다.';
    return;
  }
  const top=FACTORS.reduce((a,f)=>weights[f.key]>weights[a.key]?f:a);
  const share=(weights[top.key]/(totalWeight()||1)*100).toFixed(0);
  let sh='';
  if(lastShift) sh=` 방금 조정으로 <span class="up">${lastShift.up.n} ▲${lastShift.up.d}</span>,
    <span class="down">${lastShift.down.n} ▼${Math.abs(lastShift.down.d)}</span> 순위가 움직였습니다.`;
  // 슬라이더를 만지면 프리셋 선택이 바로 풀리는데, 되돌아가는 방법을 안 알려주면
  // "직접 조절" 상태에서 못 빠져나오는 사람이 생긴다.
  const back = activePurpose===null && lastPurpose
    ? ` <b style="color:var(--dim)">${PURPOSES.find(p=>p.id===lastPurpose)?.name}</b> 프리셋과는 달라졌습니다 — 그 값으로 되돌리려면 위에서 같은 칩을 다시 누르세요.`
    : '';
  elImpact.innerHTML=`현재 <b>${top.label}</b>이 총점의 <b>${share}%</b>를 차지해 가장 크게 작용합니다. ${top.up}${sh}
    지도 탭의 <b>종합 적합도</b> 색상도 이 가중치를 따릅니다.${back}`;
}

/* ---- 순위: 행을 재생성하지 않고 순서와 값만 갱신 ---- */
const rankEls={};
function buildRankList(){
  elRankList.innerHTML='';
  RANKED_SET.forEach(c=>{
    const d=document.createElement('button');
    d.type='button'; d.className='rank-row'; d.dataset.n=c.n;
    d.innerHTML=`<div class="pos"></div>
      <div class="nm">${c.n}<em>${c.region}${c.dc?' · 운영 중':' · 신규 후보'}</em></div>
      <div class="bar"><i></i></div><div class="sc"></div>`;
    d._pos=d.querySelector('.pos'); d._bar=d.querySelector('.bar i'); d._sc=d.querySelector('.sc');
    d.addEventListener('click',()=>{ selected=c.n; refresh('selection'); });
    rankEls[c.n]=d; elRankList.appendChild(d);
  });
}
function updateRankList(){
  const list=ranked();
  if(!selected||!rankEls[selected]) selected=list[0].n;
  const frag=document.createDocumentFragment();
  list.forEach((c,i)=>{
    const el=rankEls[c.n], col=color(c.score);
    el._pos.textContent=String(i+1).padStart(2,'0');
    el._bar.style.width=c.score+'%';
    el._bar.style.background=col;
    el._sc.textContent=c.score.toFixed(1);
    el._sc.style.color=col;
    el.classList.toggle('sel',c.n===selected);
    el.classList.toggle('medal-1',i===0);
    el.classList.toggle('medal-2',i===1);
    el.classList.toggle('medal-3',i===2);
    frag.appendChild(el);   // 기존 노드를 옮기는 것이라 재파싱이 없다
  });
  elRankList.appendChild(frag);
  elStTop.textContent=list[0].n;
}

/* ---- 상세: 레이더는 선택이 바뀔 때만, 점수는 가중치마다 ---- */
/* 국가 비교용 구분색 — 적합도 등급색(초록/앰버/빨강)과 겹치지 않는 팔레트를 쓴다.
   안 그러면 4번째로 고른 나라가 우연히 빨간 선으로 그려질 때 "나쁜 나라"로 오해할 수 있다. */
const SERIES_COLORS=['#57C7E8','#8B7FE8','#5B8DEF','#4FC9C0','#C77DEE'];
// 5개국을 한꺼번에 비교하면 색만으로는(특히 파랑·보라 계열끼리) 구분하기 어려워,
// 선 굵기·점선 패턴도 함께 달리해 색이 비슷해도 어떤 선인지 구분할 수 있게 한다.
const SERIES_DASH=['','5 4','1.5 3','8 3 1.5 3','2 2'];
function radar(items,size=240){
  const cx=size/2,cy=size/2,R=size/2-36,n=FACTORS.length;
  const pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];};
  let g='';
  [0.25,0.5,0.75,1].forEach(f=>{g+=`<polygon points="${FACTORS.map((_,i)=>pt(i,R*f).join(',')).join(' ')}" fill="none" stroke="rgba(133,178,224,0.18)"/>`;});
  FACTORS.forEach((_,i)=>{const[x,y]=pt(i,R);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(133,178,224,0.18)"/>`;});
  items.forEach((c,si)=>{
    const col=SERIES_COLORS[si%SERIES_COLORS.length], dash=SERIES_DASH[si%SERIES_DASH.length];
    g+=`<polygon points="${FACTORS.map((f,i)=>pt(i,R*c[f.key]/100).join(',')).join(' ')}"
        fill="${col}22" stroke="${col}" stroke-width="2.4" stroke-dasharray="${dash}"/>`;
    if(items.length===1) FACTORS.forEach((f,i)=>{const[x,y]=pt(i,R*c[f.key]/100);
      g+=`<circle cx="${x}" cy="${y}" r="3" fill="${col}"/>`;});
  });
  FACTORS.forEach((f,i)=>{const[x,y]=pt(i,R+16);
    const an=Math.abs(x-cx)<6?'middle':(x>cx?'start':'end');
    g+=`<text x="${x}" y="${y+4}" style="fill:var(--muted)" font-size="9.5" text-anchor="${an}">${f.label}</text>`;});
  return `<svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:${size}px">${g}</svg>`;
}
let dScore=null,dStars=null,dVerdict=null;
function buildDetail(){
  const c=ranked().find(x=>x.n===selected); if(!c) return;
  const real=sitesInCountry(c.n);
  elDetail.innerHTML=`
    <div class="radar-wrap">${radar([c])}<div style="font-size:11.5px;color:var(--dim)">8개 항목 프로필</div></div>
    <div><h3>${c.n}</h3>
    <div style="color:var(--muted);font-size:12.5px;margin-top:3px">${c.region} · ${
      real.length?`${real.length}개 지점 운영 중`:'신규 설치 후보지'}</div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:14px">
      <div class="big" id="dScore"></div><div class="stars" id="dStars"></div></div>
    <div class="mrows">${FACTORS.map(f=>`<div class="mrow2">
      <div class="m2-top"><span class="lb">${f.label}</span>
        <span class="vl">${c[f.key]}<span style="color:var(--dim);font-size:10px">점</span></span></div>
      <div class="bar"><i style="width:${c[f.key]}%;background:${color(c[f.key])}"></i></div>
      <div class="m2-why">${reasonOf(f.key,c[f.key])}</div>
      <div class="m2-src">${(()=>{ const rv=rawText(c,f.key);
        return rv ? `<b class="m2-raw">${rv}</b> · ${SOURCES[f.key].n}` : `${SOURCES[f.key].n} (배정값)`; })()}</div>
      </div>`).join('')}</div>
    <div class="verdict" id="dVerdict"></div></div>`;
  updateHeavyPanels();
  dScore=$('dScore'); dStars=$('dStars'); dVerdict=$('dVerdict');
  updateDetailScore();   // renderBreakdown()도 여기서 함께 갱신된다
}
function updateDetailScore(){
  if(!dScore) return;
  const c=ranked().find(x=>x.n===selected); if(!c) return;
  const col=color(c.score);
  dScore.innerHTML=`${c.score.toFixed(1)}<small>/100</small>`;
  dScore.style.color=col;
  dStars.textContent=stars(c.score);
  dStars.style.color=col;
  const s=[...FACTORS].sort((a,b)=>c[b.key]-c[a.key]);
  const grade=c.score>=85?'매우 우수한 입지':c.score>=65?'양호한 입지':'보완이 필요한 입지';
  dVerdict.innerHTML=`<b>${grade}</b>입니다. 강점은 ${s.slice(0,2).map(f=>f.label).join(', ')}이고,
    ${s.slice(-2).reverse().map(f=>f.label).join(', ')}이 상대적으로 약합니다.`;
  renderBreakdown();   // 8개 항목뿐이라 가볍다
}

// 문장 생성·지점 비교·시뮬레이터는 비용이 크므로 드래그가 끝났을 때만 실행한다
// 비교 표(레이더·순위 추세 포함)는 refresh() 가 renderCompareTable() 을 따로 호출해
// 갱신하므로 여기서 다시 부르면 같은 계산이 중복된다.
function updateHeavyPanels(){
  const c=ranked().find(x=>x.n===selected); if(!c) return;
  const ai=$('aiBox'); if(ai) ai.innerHTML=aiNarrative(c);
  renderSiteCompare(c);
  updateSimulator();
}

/* ---- 실제 데이터센터 vs 모델 점수 비교 ---- */
function renderSiteCompare(c){
  const box=$('siteCmp'); if(!box) return;
  const list=SITES.map(s=>({s,r:siteEval(s)})).sort((a,b)=>b.r.total-a.r.total);
  const inCountry=list.filter(x=>x.s.ct===c.n);
  const show=inCountry.length?inCountry.slice(0,6):list.slice(0,6);
  box.innerHTML=`
    <div class="sc-head">${inCountry.length
      ? `${c.n}에서 운영 중인 데이터센터 ${inCountry.length}곳`
      : `${c.n}에는 수록된 데이터센터가 없습니다. 전체 상위 지점과 비교합니다.`}</div>
    ${show.map(x=>{
      const d=x.r.total-c.score;
      const es=FKEYS.map(k=>({k,v:x.r.m[k]})).sort((a,b)=>a.v-b.v)[0];
      return `<div class="sc-row">
        <div class="sc-nm">${esc(x.s.co)} <span>${esc(x.s.pl)}</span></div>
        <div class="sc-sc" style="color:${color(x.r.total)}">${x.r.total.toFixed(1)}</div>
        <div class="sc-df" style="color:${d>=0?'var(--good)':'var(--bad)'}">${d>=0?'+':''}${d.toFixed(1)}</div>
        <div class="sc-note">${x.r.total>=85?'✔ 실제 기업도 선택한 우수 입지':`약점: ${FLABEL[es.k]} ${es.v}점`}</div>
      </div>`;
    }).join('')}`;
}

/* ---- 비교: 표는 국가가 바뀔 때만 다시 만든다 ---- */
let picked=['핀란드','싱가포르','캐나다'];
function buildCompare(){
  const box=$('cmpPick');
  if(box && !box.dataset.init){
    // 70개국을 한 덩어리로 늘어놓으면 훑기 어려워, 지역별로 묶는다. RANKED_SET은
    // 이미 점수순이라 그 순서대로 지역을 처음 만나는 순간 그룹을 여니, 지역이
    // 등장하는 순서도 자연히 "그 지역에서 가장 순위가 높은 나라" 순이 된다.
    const order=[], byRegion={};
    RANKED_SET.forEach(c=>{
      const r=c.region||'기타';
      if(!byRegion[r]){ byRegion[r]=[]; order.push(r); }
      byRegion[r].push(c);
    });
    box.innerHTML=`
      <input type="text" id="cmpPickFilter" class="cmp-pick-filter" placeholder="국가 검색" aria-label="국가 목록 검색" autocomplete="off">
      <div class="cmp-pick-groups" id="cmpPickGroups">${order.map(r=>`
        <div class="pick-group" data-region="${esc(r)}">
          <div class="pick-group-title">${esc(r)}</div>
          <div class="pick-box">${byRegion[r].map(c=>
            `<button class="pchip" data-n="${esc(c.n)}" aria-pressed="false">${esc(c.n)}</button>`).join('')}</div>
        </div>`).join('')}</div>`;
    box.querySelectorAll('.pchip').forEach(b=>b.onclick=()=>{
      const n=b.dataset.n, i=picked.indexOf(n);
      if(i>=0){ if(picked.length>1) picked.splice(i,1); }
      else { if(picked.length>=5){ alert('최대 5개국까지 비교할 수 있습니다.'); return; } picked.push(n); }
      syncPick(); renderCompareTable();
    });
    $('cmpPickFilter').addEventListener('input', filterCmpPick);
    box.dataset.init='1';
    // 좁은 화면에서는 국가 목록이 화면을 다 채워 차트가 한참 아래로 밀리므로 기본은 접어 둔다.
    const details=$('cmpPickerDetails');
    if(details && window.innerWidth<=820) details.removeAttribute('open');
  }
  syncPick(); renderCompareTable();
}
// 국가 검색 — 이름에 검색어가 없는 칩을 숨기고, 그 지역에 남은 칩이 하나도
// 없으면 지역 제목까지 함께 숨긴다.
function filterCmpPick(){
  const term=$('cmpPickFilter').value.trim().toLowerCase();
  $('cmpPickGroups').querySelectorAll('.pick-group').forEach(g=>{
    let any=false;
    g.querySelectorAll('.pchip').forEach(b=>{
      const match=!term || b.dataset.n.toLowerCase().includes(term);
      b.style.display=match?'':'none';
      if(match) any=true;
    });
    g.style.display=any?'':'none';
  });
}
// 헤더 검색으로 국가를 고르는 등, 국가칩을 직접 누르지 않고도 비교 목록에
// 더할 때 쓰는 공용 진입점. pchip 클릭 핸들러와 같은 규칙(최대 5개)을 따른다.
function addToCompare(name){
  if(picked.includes(name)) return;
  if(picked.length>=5){ alert('최대 5개국까지 비교할 수 있습니다.'); return; }
  picked.push(name);
  syncPick(); renderCompareTable();
}
function syncPick(){
  document.querySelectorAll('.pchip').forEach(b=>{
    const i=picked.indexOf(b.dataset.n);
    b.classList.toggle('on', i>=0);
    b.setAttribute('aria-pressed', i>=0);
    b.style.borderColor = i>=0 ? SERIES_COLORS[i%SERIES_COLORS.length] : '';
    b.style.color = i>=0 ? SERIES_COLORS[i%SERIES_COLORS.length] : '';
  });
  renderSelected();
}
// 접힌 국가 목록을 열지 않아도 현재 선택을 보고 뺄 수 있도록 요약 칩을 항상 보여준다.
function renderSelected(){
  const box=$('cmpSelected'); if(!box) return;
  box.innerHTML=picked.map((n,i)=>{
    const col=SERIES_COLORS[i%SERIES_COLORS.length];
    return `<button class="schip" data-n="${esc(n)}" style="border-color:${col};color:${col}">
      ${esc(n)}<span class="x">✕</span></button>`;
  }).join('');
  box.querySelectorAll('.schip').forEach(b=>b.onclick=()=>{
    const n=b.dataset.n, i=picked.indexOf(n);
    if(i>=0 && picked.length>1){ picked.splice(i,1); syncPick(); renderCompareTable(); }
  });
}
// 시나리오별 순위 변화 (기울기 그래프)
function rankTrend(names){
  const rows={};
  ['now','e35','e50','e80','e100'].forEach(k=>{
    const list=rankedFor(k);          // 전역 상태를 바꾸지 않는다
    names.forEach(n=>{
      const i=list.findIndex(c=>c.n===n);
      (rows[n]=rows[n]||[]).push({rank:i+1, score:list[i]?list[i].score:0});
    });
  });
  return rows;
}
function renderRankTrend(){
  const box=$('trendBox'); if(!box) return;
  const names=picked.slice(0,5);
  const rows=rankTrend(names);
  const keys=['now','e35','e50','e80','e100'];
  const labels=keys.map(k=>ERAS[k].label);
  const W=560,H=210,padL=54,padR=86,padT=18,padB=30;
  const total=RANKED_SET.length;
  const xs=keys.map((_,i)=>padL+i*(W-padL-padR)/(keys.length-1));
  const y=r=>padT+(r-1)/(total-1)*(H-padT-padB);
  let g=`<line x1="${padL}" y1="${padT}" x2="${W-padR}" y2="${padT}" stroke="rgba(133,178,224,0.18)"/>`;
  labels.forEach((lb,i)=>{
    g+=`<line x1="${xs[i]}" y1="${padT}" x2="${xs[i]}" y2="${H-padB}" stroke="rgba(133,178,224,0.14)"/>`;
    g+=`<text x="${xs[i]}" y="${H-9}" style="fill:var(--muted)" font-size="10.5" text-anchor="middle">${lb}</text>`;
  });
  // 시작·끝 순위 라벨은 SVG viewBox 와 함께 축소되면 좁은 화면(모바일)에서
  // 글자가 실제로는 7px 안팎까지 줄어 읽기 어려워진다. viewBox 크기와 무관하게
  // 항상 같은 CSS px 로 보이도록 SVG 밖 HTML 오버레이로 그린다.
  let labelsHtml='';
  names.forEach((n,si)=>{
    const col=SERIES_COLORS[si%SERIES_COLORS.length], pts=rows[n];
    if(!pts) return;
    g+=`<polyline points="${pts.map((p,i)=>`${xs[i]},${y(p.rank)}`).join(' ')}"
        fill="none" stroke="${col}" stroke-width="2.2"/>`;
    pts.forEach((p,i)=>{ g+=`<circle cx="${xs[i]}" cy="${y(p.rank)}" r="3.5" fill="${col}"/>`; });
    const startX=(xs[0]-8)/W*100, startY=y(pts[0].rank)/H*100;
    const endX=(xs[xs.length-1]+8)/W*100, endY=y(pts[pts.length-1].rank)/H*100;
    labelsHtml+=`<span class="trend-lbl" style="left:${startX}%;top:${startY}%;color:${col};
      transform:translate(-100%,-50%)">${pts[0].rank}위</span>`;
    labelsHtml+=`<span class="trend-lbl" style="left:${endX}%;top:${endY}%;color:${col};
      transform:translate(0,-50%)">${esc(n)} ${pts[pts.length-1].rank}위</span>`;
  });
  const changes=names.map(n=>{
    const p=rows[n]; if(!p) return '';
    const d=p[0].rank-p[p.length-1].rank;
    return d===0 ? `${n} 변동 없음` : `${n} ${d>0?`${d}계단 상승`:`${-d}계단 하락`}`;
  }).filter(Boolean).join(' · ');
  box.innerHTML=`<div class="trend-chart"><svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${g}</svg>${labelsHtml}</div>
    <div class="trend-note">2100년까지 ${changes}. 위로 갈수록 높은 순위입니다.
      IPCC SSP2-4.5 경로에 위도별 온난화 증폭을 적용한 결과입니다.</div>`;
}

function renderCompareTable(full=true){
  const list=ranked(), sel=picked.map(n=>list.find(c=>c.n===n)).filter(Boolean);
  if(!sel.length) return;
  const order=[...sel].sort((a,b)=>b.score-a.score);
  if(full){
    $('cmpRadar').innerHTML=radar(sel,280)+
      `<div class="legend-series">${sel.map((c,i)=>
        `<span><i style="background:${SERIES_COLORS[i%SERIES_COLORS.length]}"></i>${esc(c.n)}</span>`).join('')}</div>`;
    renderRankTrend();
  }
  $('cmpTable').innerHTML=`<table>
    <thead><tr><th>항목</th>${sel.map(c=>`<th>${c.n}</th>`).join('')}</tr></thead><tbody>
    ${FACTORS.map(f=>{
      const best=Math.max(...sel.map(c=>c[f.key]));
      return `<tr><td>${f.label} <span class="wpct" data-k="${f.key}" style="color:var(--dim);font-size:11px">${weights[f.key]}%</span></td>
        ${sel.map(c=>`<td class="${c[f.key]===best?'win':''}"><span class="n">${c[f.key]}</span></td>`).join('')}</tr>`;
    }).join('')}
    <tr><td>총점</td>${sel.map(c=>`<td class="${c.score===Math.max(...sel.map(x=>x.score))?'win':''}">
      <span class="n">${c.score.toFixed(1)}</span></td>`).join('')}</tr>
    <tr><td>순위</td>${sel.map(c=>`<td><span class="n">${order.findIndex(x=>x.n===c.n)+1} / ${sel.length}</span></td>`).join('')}</tr>
    </tbody></table>`;
}
/* ---- 보고서 자동 생성 (Markdown) ---- */
function buildReport(){
  const c=ranked().find(x=>x.n===selected);
  const list=ranked(), rank=list.findIndex(x=>x.n===c.n)+1;
  const p=PURPOSES.find(x=>x.id===activePurpose);
  const real=sitesInCountry(c.n);
  // 화면의 "장점/단점"(aiNarrative)과 같은 절대 점수 기준을 쓴다.
  // 순위로만 뽑으면 모든 항목이 낮아도(또는 높아도) 억지로 3개를 채우게 된다.
  const factorsSorted=[...FACTORS].sort((a,b)=>c[b.key]-c[a.key]);
  const strong=factorsSorted.filter(f=>c[f.key]>=75).slice(0,4);
  const weak=factorsSorted.filter(f=>c[f.key]<55).slice(-3).reverse();
  const now=new Date().toISOString().slice(0,10);
  const L=[];
  L.push(`# 데이터센터 입지 분석 보고서 — ${c.n}`,'');
  L.push(`- 작성일: ${now}`);
  L.push(`- 평가 기준: ${p?p.name:'사용자 지정 가중치'}`);
  L.push(`- 기후 시나리오: ${ERAS[era].label}${era!=='now'
    ?` (전지구 평균기온 +${ERAS[era].dt}°C, 위도별 증폭 적용 — 북극권 ×1.9 / 중위도 ×1.1 / 열대 ×0.75)`:''}`);
  L.push(`- 종합 점수: **${c.score.toFixed(1)} / 100** (전체 ${list.length}개국 중 ${rank}위)`,'');
  L.push('## 0. 분석 방법','');
  L.push(`- 기온 점수는 대표 지점의 **연평균 기온(°C) 실측값**을 정규화해 산출했습니다 (${c.tc}°C → ${c.temp}점).`);
  L.push(`- 탄소배출 계산에는 재생에너지 비율이 아니라 **실제 계통 탄소집약도 ${c.ci} gCO₂/kWh**를 사용했습니다.`);
  L.push(`- 지표 중복 보정: ${decorrelate?'적용 (상관 0.5 초과분만큼 유효 가중치 축소)':'미적용'}`);
  L.push('');
  methodologyTable().forEach(r=>L.push(r));
  L.push('');
  L.push('> 추정값 항목은 무료 공개 API가 없어 보고서·통계를 참고해 배정한 값입니다. 실측이 아닙니다.','');
  L.push('## 1. 항목별 점수','');
  L.push('| 항목 | 가중치 | 원자료 | 점수 | 평가 근거 | 출처 |');
  L.push('|---|---:|---:|---:|---|---|');
  FACTORS.forEach(f=>{
    const rv=rawText(c,f.key) || '배정값';
    L.push(`| ${f.label} | ${weights[f.key]}% | ${rv} | ${c[f.key]} | ${reasonOf(f.key,c[f.key])} | ${SOURCES[f.key].n} |`);
  });
  L.push('');
  L.push('## 2. 추천 근거','');
  if(strong.length) strong.forEach(f=>L.push(`- **${f.label} ${c[f.key]}점** — ${reasonOf(f.key,c[f.key])}`));
  else L.push('- 75점 이상인 항목이 없습니다.');
  L.push('');
  L.push('## 3. 약점 및 보완 과제','');
  if(weak.length) weak.forEach(f=>L.push(`- **${f.label} ${c[f.key]}점** — ${reasonOf(f.key,c[f.key])}`));
  else L.push('- 55점 미만인 항목이 없습니다.');
  L.push('');
  L.push('## 4. 실제 운영 사례와의 비교','');
  if(real.length){
    L.push(`${c.n}에는 다음 데이터센터가 운영 중이며, 모델의 평가와 기업의 실제 선택이 일치합니다.`,'');
    real.forEach(x=>L.push(`- ${x.co} ${x.pl} — 모델 점수 ${siteEval(x).total.toFixed(1)}점`));
  }else{
    L.push(`${c.n}에는 수록된 대형 데이터센터가 없습니다. 점수와 실제 투자 사이의 차이는`);
    L.push('주요 이용자와의 거리(지연시간), 시장 규모, 규제 환경 등 모델에 포함되지 않은 요인 때문일 수 있습니다.');
  }
  L.push('');
  L.push('## 5. 상위 10개국','');
  L.push('| 순위 | 국가 | 총점 |'); L.push('|---:|---|---:|');
  list.slice(0,10).forEach((x,i)=>L.push(`| ${i+1} | ${x.n} | ${x.score.toFixed(1)} |`));
  L.push('');
  L.push('## 6. 결론','');
  L.push(c.score>=80
    ? `${c.n}는 ${p?p.name:'설정한 기준'}에 부합하는 우수한 입지다. ${strong.map(f=>f.label).join(', ')} 항목에서 특히 강점을 보인다.`
    : c.score>=65
    ? (weak.length
        ? `${c.n}는 조건부로 적합하다. ${weak.map(f=>f.label).join(', ')} 항목의 보완 대책이 전제되어야 한다.`
        : `${c.n}는 조건부로 적합하다. 55점 미만인 뚜렷한 약점 항목은 없지만, 총점이 우수 등급(80점)에는 못 미친다.`)
    : `${c.n}는 현재 기준에서 권장하기 어렵다. 상위 후보인 ${list[0].n}(${list[0].score.toFixed(1)}점)와 비교 검토가 필요하다.`);
  L.push('');
  L.push('---','');
  L.push('### 데이터 출처','');
  FACTORS.forEach(f=>L.push(`- ${f.label}: ${SOURCES[f.key].n} (${SOURCES[f.key].d})`));
  L.push('');
  L.push('### 참고문헌','');
  L.push('1. International Energy Agency (IEA), *Electricity Information*. https://www.iea.org/');
  L.push('2. Ember, *Global Electricity Review*. https://ember-energy.org/');
  L.push('3. World Resources Institute, *Aqueduct Water Risk Atlas*. https://www.wri.org/aqueduct');
  L.push('4. Bündnis Entwicklung Hilft, *WorldRiskReport*. https://weltrisikobericht.de/');
  L.push('5. Ookla, *Speedtest Global Index*. https://www.speedtest.net/global-index');
  L.push('6. Open-Meteo, *Historical Weather API*. https://open-meteo.com/');
  L.push('7. World Bank, *World Development Indicators*. https://data.worldbank.org/');
  L.push('8. IPCC, *AR6 Synthesis Report* (SSP2-4.5 시나리오). https://www.ipcc.ch/report/ar6/syr/');
  L.push('');
  L.push(`> 생성 일시: ${new Date().toLocaleString('ko-KR')}`);
  L.push(`> 사용한 가중치: ${FACTORS.map(f=>`${f.label} ${weights[f.key]}%`).join(', ')}`);
  L.push('> 본 보고서의 수치는 학습용 모델 값이며, 실제 투자 판단에는 각 기관의 원자료 확인이 필요합니다.');
  return L.join('\n');
}
// 두 보고서가 같은 문구를 쓰도록 방법론 표를 한 곳에서 만든다
const CONVERSION_NOTE = {
  temp :'연평균 기온(°C)을 −5°C=100점, 30°C=5점으로 선형 변환',
  power:'공개 전력 단가 통계를 참고한 배정값',
  renew:'발전량 중 재생에너지 비율(%)을 그대로 점수화',
  grid :'송배전 손실률(%)이 낮을수록 고득점',
  water:'물 스트레스 등급을 참고한 배정값',
  net  :'인구 100명당 초고속 인터넷 가입 수를 45=100점 기준으로 환산',
  risk :'WorldRiskIndex 등급을 참고한 배정값',
  land :'1인당 GDP가 높을수록 토지비 부담이 크다고 보아 역방향 환산',
};
function methodologyTable(){
  const L=['| 항목 | 상태 | 출처 | 변환 방식 |','|---|---|---|---|'];
  FACTORS.forEach(f=>{
    const d=dataStatus[f.key];
    const st = d.status==='real' ? '실측 연동'
             : d.status==='fail' ? '연동 실패(추정값)' : '추정값';
    L.push(`| ${f.label} | ${st}${d.year?` (${d.year})`:''} | ${d.src} | ${CONVERSION_NOTE[f.key]||''} |`);
  });
  return L;
}

/* ---- CSV 내보내기 ---- */
function toCSV(){
  const head=['순위','국가','지역','총점',...FACTORS.map(f=>f.label),
              '연평균기온(C)','탄소집약도(g/kWh)','데이터센터 수'];
  const rows=ranked().map((c,i)=>[
    i+1, c.n, c.region||'', c.score.toFixed(2),
    ...FKEYS.map(k=>c[k]),
    c.tc ?? '', c.ci ?? '', sitesInCountry(c.n).length,
  ]);
  const esc2=v=>{ const t=String(v); return /[",\n]/.test(t) ? '"'+t.replace(/"/g,'""')+'"' : t; };
  // Excel 이 한글을 깨지 않도록 BOM 을 붙인다
  return '\uFEFF' + [head, ...rows].map(r=>r.map(esc2).join(',')).join('\n');
}
function download(name, text, type){
  const blob=new Blob([text],{type});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
// 국가의 한글 이름을 다운로드 파일명에 그대로 쓰면 브라우저가 파일명 전체를
// 무시하고 확장자까지 없이 "download"로 저장하는 경우가 있어, 로마자 ISO 코드로 대신한다.
function fileSlug(name){
  const c=RANKED_SET.find(x=>x.n===name);
  return c && c.iso ? c.iso : 'unknown';
}

function downloadReport(){
  const md=buildReport();
  const blob=new Blob([md],{type:'text/markdown;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`datacenter-report-${fileSlug(selected)}-${new Date().toISOString().slice(0,10)}.md`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function previewReport(){
  const box=$('reportBox');
  box.style.display = box.style.display==='block' ? 'none' : 'block';
  if(box.style.display==='block') box.textContent=buildReport();
}

/* ---- 기후 시나리오 UI ---- */
function renderEras(){
  $('eras').innerHTML=Object.entries(ERAS).map(([k,v])=>
    `<button class="chip ${k===era?'on':''}" data-e="${k}" aria-pressed="${k===era}">${v.label}</button>`).join('');
  $('eras').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
    // 실시간 기온이 켜져 있으면 미래 시나리오와 충돌하므로 실시간을 끈다
    if(b.dataset.e!=='now' && liveOn) setLive(false);
    const beforeTop=ranked()[0], beforeSel=ranked().find(c=>c.n===selected);
    era=b.dataset.e;
    renderEras();
    refresh('era');
    const afterTop=ranked()[0], afterSel=ranked().find(c=>c.n===selected);
    const d=(afterSel.score-beforeSel.score);
    $('eraNote').innerHTML = era==='now'
      ? '현재 관측·통계 기준입니다. 2035·2050을 누르면 기온 상승과 물 부족 심화를 반영한 점수를 볼 수 있습니다.'
      : `전지구 평균기온이 <b>+${ERAS[era].dt}°C</b> 오른다고 가정하되,
         <b>위도별 증폭</b>을 적용했습니다 (북극권 최대 ×1.9, 열대 ×0.75).
         ${selected}의 점수는 <b style="color:${d<0?'var(--bad)':'var(--good)'}">${d>=0?'+':''}${d.toFixed(1)}점</b> 변합니다.
         1위는 ${beforeTop.n}에서 <b>${afterTop.n}</b>${josa(afterTop.n,'으로','로')} ${beforeTop.n===afterTop.n?'그대로입니다':'바뀝니다'}.
         고위도는 온난화 폭이 커 <b>냉각 우위가 줄어들고</b>, 아열대 건조대는 물 부족이,
         저위도 해안은 태풍 위험이 더 커집니다.`;
  });
  if(!$('eraNote').innerHTML) $('eraNote').textContent=
    '현재 관측·통계 기준입니다. 2035·2050을 누르면 기온 상승과 물 부족 심화를 반영한 점수를 볼 수 있습니다.';
}

/* ---- 출처 목록 ---- */
function renderSources(){
  $('srcList').innerHTML=`<table><thead><tr><th>항목</th><th style="text-align:left">출처</th>
    <th>단위</th><th>구분</th></tr></thead><tbody>
    ${FACTORS.map(f=>`<tr><td>${f.label}</td>
      <td style="text-align:left"><a href="${SOURCES[f.key].u}" target="_blank" rel="noopener"
        style="color:var(--accent);text-decoration:none">${SOURCES[f.key].n}</a>
        <div style="font-size:10.5px;color:var(--dim);margin-top:2px">${SOURCES[f.key].d}</div></td>
      <td>${SOURCES[f.key].unit || '—'}</td>
      <td style="color:${dataStatus[f.key].status==='real'?'var(--good)':'var(--mid)'}">${dataStatus[f.key].status==='real'?'실측':'배정값'}</td></tr>`).join('')}
    <tr><td>지도</td><td style="text-align:left">OpenStreetMap · CARTO · Esri</td><td>실시간</td></tr>
    </tbody></table>`;
}

/* ---- 화면 갱신 파이프라인 ----
   상태가 바뀌면 렌더 함수를 하나씩 부르지 말고 이 함수만 호출한다.
   지금까지 "드래그 중 무거운 작업" 성능 회귀가 세 번 재발했는데,
   원인은 매번 호출 목록을 손으로 나열하다 빠뜨린 것이었다.
   갱신 순서를 한곳에서 관리해 그 실수를 구조적으로 막는다.

   scope
     'drag'      가중치 슬라이더를 끄는 중 — 가벼운 것만
     'weights'   가중치 확정
     'era'       기후 시나리오 변경
     'selection' 선택 국가 변경
     'filter'    지도 필터 변경
     'data'      실제 데이터 연동 등 원본이 바뀜
*/
function refresh(scope='weights'){
  invalidateRank();
  if(scope==='data'){ _corr=null; _cuts=null; }

  // 1) 가벼운 갱신 — 드래그 중에도 매 프레임 안전한 것들
  updateRankList();
  if(scope==='selection'||scope==='era'||scope==='data') buildDetail();
  else updateDetailScore();
  // 레이더·순위 추세 재계산(340회 adjust())은 비교 탭이 보일 때만 한다 — 다른 탭에서
  // 가중치를 조작할 때마다 안 보이는 화면을 다시 그리는 낭비를 막는다. 탭을 열면
  // tabs.js 가 다시 full=true 로 불러 최신 상태를 보장한다.
  const cmpVisible=$('comparePane').classList.contains('on');
  renderCompareTable(scope!=='drag' && cmpVisible);
  if(scope==='drag') return;

  // 2) 무거운 갱신 — 조작이 끝난 뒤에만
  renderImpact();
  updateHeavyPanels();
  updateMarkerColors();
  if(filterMode!=='off') paintGrid();

  // 3) 원본 데이터가 바뀐 경우에만 필요한 것들
  if(scope==='data'){
    renderDataPanel(); renderCorr(); renderSources();
    gridCells=null; gridRects=null; gridLayer.clearLayers();
    if(filterMode!=='off') paintGrid();
  }
}
