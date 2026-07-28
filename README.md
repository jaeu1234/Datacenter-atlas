# DataCenter Atlas

기후·전력·재생에너지·통신 인프라 등 8개 지표로 전 세계 데이터센터 입지를 분석하는 웹 앱.

- **국가 68개 · 데이터센터 184곳 · 사업자 78곳**
- 기후 시나리오(현재 / 2035 / 2050 / 2080 / 2100), 운영 시뮬레이션, 보고서 자동 생성

## 바로 쓰기

`dist/datacenter-atlas.html` 을 브라우저에서 열면 됩니다. 서버도 설치도 필요 없습니다.

주소 끝에 `?selftest` 를 붙이면 콘솔에서 자체 점검이 실행됩니다.

## 개발

```
node build.js     # src/ 를 합쳐 dist/datacenter-atlas.html 생성
node tests/run.js # 브라우저 없이 전체 실행 + 자체 점검 23항목
```

빌드 결과는 단일 HTML 이라 `file://` 로 열어도 동작합니다.

## 구조

```
src/
  00-helpers.js                  공용 헬퍼, 오류 핸들러
  data/countries-and-sites.js    국가·데이터센터 원자료   (31KB)
  core/state-and-scoring.js      상태·점수 계산·시나리오  (4.3KB)  ← 프로젝트의 본질
  ui/tabs.js  map.js  modules.js  analysis.js
  tests/selftest.js              브라우저에서 도는 자체 점검
  boot.js                        초기화·배선
build.js                         단일 파일로 합치기
tests/run.js                     Node 로 전체 실행 검증
```

## 작업 원칙

1. **수정 후 반드시** `node tests/run.js` 를 돌린다. 구문만 맞고 실행이 안 되는 상태를 잡아 준다.
2. 여러 곳에서 쓰는 함수는 `const f = () => {}` 대신 `function f() {}` 로 쓴다 (선언 순서 문제 방지).
3. 상태를 바꾼 뒤에는 렌더 함수를 직접 부르지 말고 `refresh(scope)` 를 쓴다.
4. 코드 블록을 정규식으로 지우지 않는다. 앞뒤 문자열을 명시해 바꾼다.

## 데이터 출처

기온 Open-Meteo · 재생에너지/전력망/인터넷/토지 World Bank · 탄소집약도 Ember ·
물 스트레스 WRI Aqueduct · 재해 위험 WorldRiskIndex

앱의 **데이터 연동 상태** 패널에서 항목별로 실측인지 추정값인지 확인할 수 있습니다.
