#!/usr/bin/env node
/* 모듈 조각을 하나의 HTML 로 합친다.
   결과물은 브라우저에서 파일을 바로 열어도 동작하는 단일 파일이다. */
const fs=require('fs'), path=require('path');

const ORDER=[
  'src/00-helpers.js',
  'src/data/countries-and-sites.js',
  'src/core/state-and-scoring.js',
  'src/ui/tabs.js',
  'src/ui/map.js',
  'src/ui/modules.js',
  'src/ui/analysis.js',
  'src/tests/selftest.js',
  'src/boot.js',
];

const script = ORDER.map(f=>fs.readFileSync(f,'utf8')).join('');
const styles = fs.readFileSync('src/styles/app.css','utf8');
const tpl    = fs.readFileSync('src/index.template.html','utf8');
// replace 의 두 번째 인자를 문자열로 주면 $& 같은 패턴이 치환돼 내용이 바뀐다.
// 함수 형태로 넘겨 원문을 그대로 삽입한다.
const out    = tpl.replace('{{STYLES}}', ()=>styles).replace('{{SCRIPT}}', ()=>script);

fs.mkdirSync('dist',{recursive:true});
fs.writeFileSync('dist/datacenter-atlas.html', out);
// GitHub Pages 는 저장소 루트의 index.html 을 그대로 서빙한다
fs.writeFileSync('index.html', out);

// 구문 검사
try{ new Function(script); }
catch(e){ console.error('✘ 구문 오류:', e.message); process.exit(1); }

console.log('✔ 빌드 완료  index.html · dist/datacenter-atlas.html  ' + (out.length/1024).toFixed(1) + 'KB');
ORDER.forEach(f=>console.log('   ' + f.padEnd(36) + (fs.statSync(f).size/1024).toFixed(1) + 'KB'));
