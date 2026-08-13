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

// 구문 검사는 주석이 그대로 있는 원본 기준으로 한다 — 오류가 나면 줄 번호가 소스와 일치해야 하니까.
try{ new Function(script); }
catch(e){ console.error('✘ 구문 오류:', e.message); process.exit(1); }

/* ---- 배포용 압축 ----
   소스에는 주석을 그대로 두고, 결과물(index.html)에서만 지운다.
   문자열 안에 /* 나 */ 가 없다는 걸 확인해 둔 상태라 블록 주석은 위치와 상관없이
   지워도 안전하다. // 는 코드 뒤에 붙은 인라인 주석까지 지우면 문자열 속 URL
   (https://...) 과 구별하기 어려우므로, 줄 전체가 //로 시작하는 것만 지운다. */
function stripJsComments(text){
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const out=[];
  for(const raw of text.split('\n')){
    const line=raw.trimEnd(), trimmed=line.trim();
    if(trimmed.startsWith('//')) continue;
    if(trimmed===''){ if(out.length && out[out.length-1]==='') continue; out.push(''); }
    else out.push(line);
  }
  return out.join('\n');
}
function stripCssComments(text){
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  return text.split('\n').map(l=>l.trim()).filter(Boolean).join('\n');
}

const minScript = stripJsComments(script);
const minStyles = stripCssComments(styles);

// 압축 후에도 구문이 멀쩡한지 한 번 더 확인한다 (혹시 있을 실수 방지)
try{ new Function(minScript); }
catch(e){ console.error('✘ 압축 후 구문 오류:', e.message); process.exit(1); }

// replace 의 두 번째 인자를 문자열로 주면 $& 같은 패턴이 치환돼 내용이 바뀐다.
// 함수 형태로 넘겨 원문을 그대로 삽입한다.
const out = tpl.replace('{{STYLES}}', ()=>minStyles).replace('{{SCRIPT}}', ()=>minScript);

fs.mkdirSync('dist',{recursive:true});
fs.writeFileSync('dist/datacenter-atlas.html', out);
// GitHub Pages 는 저장소 루트의 index.html 을 그대로 서빙한다
fs.writeFileSync('index.html', out);

console.log('✔ 빌드 완료  index.html · dist/datacenter-atlas.html  ' + (Buffer.byteLength(out,'utf8')/1024).toFixed(1) + 'KB');
ORDER.forEach(f=>console.log('   ' + f.padEnd(36) + (fs.statSync(f).size/1024).toFixed(1) + 'KB'));
