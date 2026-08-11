
// 지도 타일 등 외부 리소스의 크로스오리진 잡음만 걸러내고, 코드 오류는 콘솔에 남긴다.
let __xoCount=0, __resCount=0;

// 오류를 세 종류로 나눠 처리한다. 핸들러를 두 개로 나누면 먼저 등록된 쪽이
// 걸러내기 전에 로그를 남겨버리므로 반드시 하나로 합쳐야 한다.
window.addEventListener('error', e=>{
  // (1) 이미지·스크립트·스타일시트 로딩 실패 — e.target 이 엘리먼트다.
  //     message 가 비어 있어 '[Atlas] 오류:  ?:?' 처럼 찍히던 원인.
  const el = e.target;
  if(el && el !== window && el.tagName){
    __resCount++;
    if(__resCount===1){
      console.warn('[Atlas] 외부 리소스(지도 타일 등)를 불러오지 못했습니다. 분석 기능은 정상입니다.');
    }
    e.preventDefault(); e.stopImmediatePropagation();
    return false;
  }

  // (2) 크로스오리진 스크립트 오류 — 브라우저가 내용을 감춰 "Script error." 로만 온다.
  if(e.message==='Script error.' && !e.filename && !e.lineno){
    __xoCount++;
    if(__xoCount===1) console.warn('[Atlas] 외부 지도 서버에 연결하지 못했습니다.');
    e.preventDefault(); e.stopImmediatePropagation();
    return false;
  }

  // (3) 그 밖의 진짜 오류는 콘솔에 남긴다. 메시지가 비어도 위치 정보가 있으면
  //     같은 origin 에서 난 진짜 오류일 수 있으므로 debug 로는 남겨 둔다.
  if(!e.message){
    if(e.filename || e.lineno) console.debug('[Atlas] 메시지 없는 오류:', (e.filename||'?')+':'+(e.lineno||'?'));
    e.preventDefault(); return false;
  }
  console.error('[Atlas] 오류:', e.message, (e.filename||'?')+':'+(e.lineno||'?'));
}, true);

/* ---- 공용 헬퍼 ----
   화살표 상수로 두면 선언 위치보다 먼저 호출될 때 TDZ 오류가 난다.
   앱 전역에서 쓰이므로 호이스팅되는 함수 선언으로 둔다. */
function $(id){ return document.getElementById(id); }
const ESC_MAP={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
function esc(v){ return String(v).replace(/[&<>"']/g, ch => ESC_MAP[ch]); }

// 외부 API 호출에 타임아웃을 건다. 응답이 아예 안 오면(에러도 완료도 아닌 상태)
// "불러오는 중…" 화면이 영원히 멈추므로, 일정 시간 뒤 강제로 실패 처리한다.
async function fetchTimeout(url, ms=12000){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(), ms);
  try{ return await fetch(url, {signal: ctrl.signal}); }
  finally{ clearTimeout(timer); }
}

window.addEventListener('unhandledrejection', e=>{
  console.error('[Atlas] 처리되지 않은 Promise 오류:', e.reason);
});

