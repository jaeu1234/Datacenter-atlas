/* ============ 6-B. 자체 점검 ============
   주소 끝에 ?selftest 를 붙이면 콘솔에서 실행된다.
   지금까지 실제로 겪은 오류 유형(단위 환산, 배열 인덱스 유출, 선언 순서,
   캐시 무효화 누락)을 그대로 시험 항목으로 만들어 재발을 잡는다. */
function selfTest(){
  const out=[]; let pass=0, fail=0;
  const ok=(name,cond,detail)=>{ (cond?pass++:fail++); out.push([cond,name,detail||'']); };

  // 1) 가중치 프리셋 합계
  PURPOSES.forEach(p=>{
    const sum=FKEYS.reduce((a,k)=>a+(p.w[k]||0),0);
    ok(`프리셋 합계 100% — ${p.name}`, sum===100, `${sum}%`);
  });

  // 2) 전 국가 점수가 유효 범위인지 (NaN·인덱스 유출 감지)
  const list=ranked();
  ok('모든 국가 점수 계산', list.length===RANKED_SET.length, `${list.length}/${RANKED_SET.length}`);
  ok('점수에 NaN 없음', list.every(c=>isFinite(c.score)),
     list.filter(c=>!isFinite(c.score)).map(c=>c.n).join(','));
  ok('점수 0~100 범위', list.every(c=>c.score>=0&&c.score<=100));
  ok('내림차순 정렬', list.every((c,i)=>i===0||list[i-1].score>=c.score));

  // 3) 시나리오 계산이 전역 era 를 오염시키지 않는지
  const before=era;
  ['now','e35','e50','e80','e100'].forEach(k=>rankedFor(k));
  ok('시나리오 계산이 전역 상태를 바꾸지 않음', era===before, `${before} → ${era}`);

  // 4) 단위 환산 (GWh → 요금·탄소)
  const c=list[0], sim=simulate(c);
  const expectCost = sim.annualGWh * estTariff(c.power);
  const expectCO2  = sim.annualGWh * estCarbonIntensity(c);
  ok('전기요금 단위 환산', Math.abs(sim.costM-expectCost)<0.01, `${sim.costM.toFixed(1)}M`);
  ok('탄소배출 단위 환산', Math.abs(sim.tonsCO2-expectCO2)<1, `${Math.round(sim.tonsCO2)}t`);
  ok('전력량이 현실 범위(50MW≈400~700GWh)', sim.annualGWh>300 && sim.annualGWh<900,
     `${sim.annualGWh.toFixed(0)}GWh`);

  // 5) 지점·그룹 무결성
  ok('모든 지점이 그룹에 배정', GROUPS.reduce((a,g)=>a+g.sites.length,0)===SITES.length);
  ok('지점→그룹 역참조 정상', SITES.every(x=>typeof x._g==='number'&&GROUPS[x._g]));
  const names=new Set(RANKED_SET.map(x=>x.n));
  const bad=[...new Set(SITES.map(x=>x.ct))].filter(x=>!names.has(x));
  ok('지점 국가명이 모두 매칭', bad.length===0, bad.join(','));

  // 6) 데이터 무결성
  ok('모든 국가에 8개 지표 존재',
     RANKED_SET.every(c=>FKEYS.every(k=>typeof c[k]==='number')));
  ok('기온·탄소 원자료 존재',
     RANKED_SET.every(c=>typeof c.tc==='number'&&typeof c.ci==='number'));

  // 7) 외기 냉방 물리 제약
  const sg=list.find(x=>x.n==='싱가포르');
  ok('더운 지역은 외기 냉방 이점 없음', !sg || freeCoolFeasibility(sg)<0.05);

  // 8) 캐시 무효화
  const s1=ranked()[0].score;
  const keep=weights.temp; weights.temp=0; invalidateRank();
  const s2=ranked()[0].score;
  weights.temp=keep; invalidateRank();
  ok('가중치 변경 시 순위 캐시 갱신', s1!==s2);

  console.log(`%c[Atlas 자체 점검] 통과 ${pass} / 실패 ${fail}`,
    `color:${fail?'#D2634A':'#4FBF87'};font-weight:bold`);
  out.forEach(([o,n,d])=>console.log(`  ${o?'✔':'✘'} ${n}${d?'  — '+d:''}`));
  return {pass, fail};
}
if(location.search.includes('selftest')) setTimeout(selfTest, 400);

