/* ============ 3. 탭 ============ */
document.querySelectorAll('.tab').forEach(t=>{
  t.onclick = ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));
    document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected','false'));
    t.classList.add('on'); t.setAttribute('aria-selected','true');
    document.getElementById(t.dataset.t+'Pane').classList.add('on');
    if(t.dataset.t==='map') setTimeout(()=>map.invalidateSize(), 60);
  };
});

