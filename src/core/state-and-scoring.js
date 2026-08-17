/* ============ 2. 애플리케이션 상태 ============
   화면 전체가 공유하는 가변 상태를 한곳에 모아 둔다.
   여기 있는 값이 바뀌면 순위 캐시(invalidateRank)를 반드시 무효화할 것. */
let weights      = {...PURPOSES[0].w};  // 항목별 가중치 (%)
let activePurpose= 'balanced';          // 선택된 목적 프리셋 (직접 조정 시 null)
let lastPurpose  = 'balanced';          // 슬라이더로 프리셋에서 벗어난 뒤에도 "되돌아갈 곳"을 기억해 둔다
let selected     = null;                // 분석 탭에서 선택된 국가명
let lastShift    = null;                // 직전 조정으로 인한 순위 변동 요약
let era          = 'now';               // 기후 시나리오: now | e35 | e50 | e80 | e100
let itMW         = 50;                  // 시뮬레이터의 IT 부하 규모 (MW)
let gpuShare     = 60;                  // 전력 중 GPU 랙이 차지하는 비율 (%)
let coolingMode  = 'water';             // 냉각 방식 (air | water | free | liquid)
let decorrelate  = false;               // 지표 중복 보정 사용 여부
let filterMode   = 'off';               // 지도 색상 필터 (off | total | 항목키)
let liveOn       = false;               // 실시간 기온 반영 여부
let liveTimer    = null;                // 실시간 갱신 타이머 핸들
let liveState    = {s:'idle', at:null, msg:''};  // 실시간 갱신 상태

const totalWeight = ()=> FKEYS.reduce((a,k)=>a+weights[k],0);
/* weights 는 반드시 이 함수를 통해서만 바꾼다 — 값을 바꾸고 캐시를 무효화하는 걸
   둘 다 잊지 않게 하나로 묶어 둔다. (직접 대입하면 순위가 갱신되지 않는 버그가 난다) */
function setWeights(patch){ Object.assign(weights, patch); invalidateRank(); }
/* ---- 기후 시나리오 ----
   IPCC 중간 경로(SSP2-4.5) 기준 전지구 평균기온 상승폭을 단순 적용한다.
   기온 외에 물 부족(건조지 가중)과 기상재해 위험도 함께 악화시킨다. */
const ERAS={
  now :{dt:0,   label:'현재'},
  e35 :{dt:1.1, label:'2035'},
  e50 :{dt:2.2, label:'2050'},
  e80 :{dt:3.2, label:'2080'},
  e100:{dt:3.9, label:'2100'},
};
const scoreToC = sc => (100-sc)*35/92 - 5;   // 기온 점수 → °C 역산

/* 지역별 기후변화 증폭 계수
   전 세계가 똑같이 더워지지 않는다. 북극은 지구 평균의 2~3배로 빨리 데워지고(북극 증폭),
   열대는 상대적으로 완만하다. 남반구는 바다 비중이 커 북반구보다 상승폭이 작다. */
function warmFactor(lat){
  const a=Math.min(Math.abs(lat||0), 90);
  const amp = Math.pow(a/90, 2.2);
  return lat>=0 ? 0.75 + 1.95*amp    // 북반구: 강한 북극 증폭
                : 0.75 + 0.95*amp;   // 남반구: 해양이 완충
}
/* 물 부족 심화 계수 — 아열대 건조대(위도 20~35°)에서 가장 크게 악화된다 */
function droughtFactor(lat){
  const a=Math.abs(lat||0);
  return 0.45 + 1.35*Math.exp(-Math.pow((a-27)/14, 2));
}
/* 기상재해 강화 계수 — 태풍·허리케인이 발생하는 저·중위도에서 크다 */
function stormFactor(lat){
  const a=Math.abs(lat||0);
  return 0.5 + 1.3*Math.exp(-Math.pow((a-20)/18, 2));
}

function mval(c,k,eraKey){
  const scenario = ERAS[eraKey] || ERAS[era] || ERAS.now;
  const dt = scenario.dt;
  if(!dt) return c[k];
  const lat = (typeof c.lat==='number') ? c.lat : 45;
  if(k==='temp') return tempScore(scoreToC(c.temp) + dt*warmFactor(lat));
  if(k==='water'){
    const dry = c.water<55 ? 0.22 : 0.09;      // 이미 건조한 곳이 더 크게 악화
    return Math.max(2, Math.round(c.water*(1-(dt/2.2)*dry*droughtFactor(lat))));
  }
  if(k==='risk') return Math.max(5, Math.round(c.risk - dt*2.2*stormFactor(lat)));
  return c[k];
}
function adjust(c, eraKey){
  const o={...c};
  FKEYS.forEach(k=>o[k]=mval(c,k,eraKey));
  const w=effectiveWeights(), tw=effTotal()||1;
  o.score=FKEYS.reduce((a,k)=>a+o[k]*w[k],0)/tw;
  return o;
}
// 전역 era 를 건드리지 않고 특정 시나리오의 순위를 계산한다
function rankedFor(eraKey){
  return RANKED_SET.map(c=>adjust(c,eraKey)).sort((a,b)=>b.score-a.score);
}

/* ---- 지표 간 중복 보정 ----
   8개 항목은 서로 독립이 아니다. 예를 들어 전력망 안정성과 인터넷 인프라는 r=0.8 이상으로
   함께 움직이므로, 단순 가중합을 하면 같은 성질이 두 번 반영된다.
   상관이 0.5를 넘는 만큼 유효 가중치를 깎아 중복분을 줄인다. */
let _corr = null;
function corrMatrix(){
  if(_corr) return _corr;
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const col=k=>RANKED_SET.map(c=>c[k]);
  _corr={};
  FKEYS.forEach(a=>{ _corr[a]={};
    FKEYS.forEach(b=>{
      const x=col(a), y=col(b), mx=mean(x), my=mean(y);
      let n=0,dx=0,dy=0;
      for(let i=0;i<x.length;i++){ n+=(x[i]-mx)*(y[i]-my); dx+=(x[i]-mx)**2; dy+=(y[i]-my)**2; }
      _corr[a][b] = (dx&&dy) ? n/Math.sqrt(dx*dy) : 0;
    });
  });
  return _corr;
}
function effectiveWeights(){
  if(!decorrelate) return weights;
  const C=corrMatrix(), out={};
  FKEYS.forEach(k=>{
    let overlap=0;
    FKEYS.forEach(j=>{ if(j!==k) overlap += Math.max(0, Math.abs(C[k][j]) - 0.5); });
    out[k] = weights[k] / (1 + overlap);
  });
  return out;
}
function effTotal(){ const w=effectiveWeights(); return FKEYS.reduce((a,k)=>a+w[k],0); }

let _rankCache=null;
function invalidateRank(){ _rankCache=null; }
function ranked(){
  // map 은 콜백에 (요소, 인덱스)를 넘긴다. adjust 의 2번째 인자가 eraKey 이므로
  // adjust 를 그대로 넘기면 인덱스가 시나리오 키로 새어 들어간다.
  if(!_rankCache) _rankCache = RANKED_SET.map(c=>adjust(c)).sort((a,b)=>b.score-a.score);
  return _rankCache;
}
const color = s => s>=85?'#4FBF87' : s>=65?'#E0A63F' : '#D2634A';
const scoreTier = s => s>=85?'good' : s>=65?'mid' : 'bad';
const stars = s => { const n=Math.round(s/20); return '★★★★★'.slice(0,n)+'☆☆☆☆☆'.slice(0,5-n); };

