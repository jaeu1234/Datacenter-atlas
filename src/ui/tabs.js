/* ============ 3. 탭 ============ */
document.querySelectorAll('.tab').forEach(t=>{
  t.onclick = ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));
    document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected','false'));
    t.classList.add('on'); t.setAttribute('aria-selected','true');
    document.getElementById(t.dataset.t+'Pane').classList.add('on');
    if(t.dataset.t==='map') setTimeout(()=>map.invalidateSize(), 60);
    // 비교 탭은 다른 탭에 있는 동안 무거운 레이더·추세 재계산을 건너뛰므로,
    // 탭을 열 때 한 번 최신 상태로 다시 그린다.
    if(t.dataset.t==='compare') renderCompareTable(true);
  };
});

