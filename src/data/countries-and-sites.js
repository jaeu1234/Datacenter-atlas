/* ============ 1. 데이터 ============ */
const FACTORS = [
  {key:'temp', label:'기후·냉각',   w:18, up:'높이면 <b>서늘한 고위도 국가</b>가 유리해집니다.'},
  {key:'power',label:'전력 비용',   w:18, up:'높이면 <b>전기가 싼 나라</b>가 유리해집니다.'},
  {key:'renew',label:'재생에너지',  w:14, up:'높이면 <b>수력·풍력 비중이 큰 나라</b>가 유리해집니다.'},
  {key:'grid', label:'전력망 안정성',w:14, up:'높이면 <b>전력 공급이 안정적인 나라</b>가 유리해집니다.'},
  {key:'water',label:'냉각 수자원', w:9,  up:'높이면 <b>물이 풍부한 나라</b>가 유리해집니다. 사막 지역이 크게 불리해집니다.'},
  {key:'net',  label:'인터넷 인프라',w:9,  up:'높이면 <b>통신 허브 국가</b>가 유리해집니다.'},
  {key:'risk', label:'재해 위험',   w:9,  up:'높이면 <b>지진·태풍이 드문 나라</b>가 유리해집니다.'},
  {key:'land', label:'토지 비용',   w:9,  up:'높이면 <b>땅값이 싼 넓은 나라</b>가 유리해집니다.'},
];
const FKEYS = FACTORS.map(f=>f.key);
const FLABEL = Object.fromEntries(FACTORS.map(f=>[f.key,f.label]));

// rank:true → 순위·비교에 등장 / rank:false → 지도 색상 계산에만 사용하는 보조 기준점
const DATA = [
  {n:'아이슬란드',rank:1,region:'북유럽',dc:0,lat:64.9,lng:-18.5,temp:99,power:95,renew:100,grid:88,net:78,risk:62,land:88,water:98,tc:5,ci:28,iso:'IS'},
  {n:'노르웨이',rank:1,region:'북유럽',dc:1,lat:62.5,lng:9.5,temp:94,power:93,renew:99,grid:94,net:88,risk:88,land:72,water:96,tc:6,ci:30,iso:'NO'},
  {n:'핀란드',rank:1,region:'북유럽',dc:1,lat:63.5,lng:26.0,temp:95,power:88,renew:88,grid:93,net:90,risk:92,land:78,water:94,tc:5,ci:79,iso:'FI'},
  {n:'스웨덴',rank:1,region:'북유럽',dc:1,lat:62.0,lng:15.5,temp:92,power:87,renew:92,grid:92,net:91,risk:90,land:76,water:93,tc:7,ci:41,iso:'SE'},
  {n:'덴마크',rank:1,region:'북유럽',dc:1,lat:56.0,lng:9.6,temp:87,power:74,renew:96,grid:93,net:90,risk:89,land:64,water:82,tc:9,ci:151,iso:'DK'},
  {n:'에스토니아',rank:1,region:'북유럽',dc:0,lat:58.7,lng:25.6,temp:88,power:79,renew:62,grid:84,net:88,risk:90,land:86,water:88,tc:6.5,ci:464,iso:'EE'},
  {n:'캐나다',rank:1,region:'북미',dc:1,lat:56.1,lng:-106.3,temp:90,power:86,renew:81,grid:90,net:86,risk:82,land:84,water:95,tc:7,ci:120,iso:'CA'},
  {n:'아일랜드',rank:1,region:'서유럽',dc:1,lat:53.2,lng:-8.0,temp:89,power:70,renew:72,grid:78,net:89,risk:91,land:60,water:92,tc:10,ci:300,iso:'IE'},
  {n:'네덜란드',rank:1,region:'서유럽',dc:1,lat:52.2,lng:5.5,temp:83,power:72,renew:74,grid:91,net:96,risk:84,land:48,water:80,tc:11,ci:268,iso:'NL'},
  {n:'오스트리아',rank:1,region:'서유럽',dc:1,lat:47.6,lng:14.1,temp:0,power:58,renew:78,grid:93,net:88,risk:82,land:50,water:88,tc:9,ci:158,iso:'AT'},
  {n:'체코',rank:1,region:'동유럽',dc:1,lat:49.8,lng:15.4,temp:0,power:62,renew:18,grid:88,net:86,risk:88,land:70,water:72,tc:9,ci:437,iso:'CZ'},
  {n:'헝가리',rank:1,region:'동유럽',dc:1,lat:47.1,lng:19.4,temp:0,power:64,renew:20,grid:84,net:84,risk:84,land:74,water:66,tc:11,ci:223,iso:'HU'},
  {n:'불가리아',rank:1,region:'동유럽',dc:1,lat:42.7,lng:25.4,temp:0,power:72,renew:24,grid:78,net:86,risk:80,land:82,water:70,tc:11.5,ci:372,iso:'BG'},
  {n:'리투아니아',rank:1,region:'북유럽',dc:1,lat:55.3,lng:23.9,temp:0,power:66,renew:30,grid:82,net:88,risk:88,land:84,water:80,tc:7,ci:174,iso:'LT'},
  {n:'라트비아',rank:1,region:'북유럽',dc:0,lat:56.9,lng:24.7,temp:0,power:68,renew:52,grid:82,net:86,risk:88,land:84,water:84,tc:6.5,ci:110,iso:'LV'},
  {n:'룩셈부르크',rank:1,region:'서유럽',dc:1,lat:49.6,lng:6.1,temp:0,power:60,renew:14,grid:96,net:94,risk:90,land:32,water:76,tc:10,ci:98,iso:'LU'},
  {n:'이스라엘',rank:1,region:'중동',dc:1,lat:31.4,lng:35.0,temp:0,power:66,renew:12,grid:84,net:86,risk:52,land:40,water:20,tc:20,ci:537,iso:'IL'},
  {n:'카타르',rank:1,region:'중동',dc:1,lat:25.3,lng:51.2,temp:0,power:84,renew:2,grid:90,net:88,risk:84,land:56,water:4,tc:28,ci:490,iso:'QA'},
  {n:'홍콩',rank:1,region:'동아시아',dc:1,lat:22.3,lng:114.2,temp:0,power:58,renew:2,grid:92,net:97,risk:52,land:14,water:56,tc:23.5,ci:700,iso:'HK'},
  {n:'벨기에',rank:1,region:'서유럽',dc:1,lat:50.6,lng:4.6,temp:82,power:60,renew:40,grid:92,net:94,risk:88,land:50,water:74,tc:11,ci:138,iso:'BE'},
  {n:'영국',rank:1,region:'서유럽',dc:1,lat:54.0,lng:-2.5,temp:84,power:63,renew:70,grid:85,net:92,risk:88,land:52,water:88,tc:10,ci:238,iso:'GB'},
  {n:'독일',rank:1,region:'서유럽',dc:1,lat:51.2,lng:10.4,temp:80,power:52,renew:68,grid:94,net:90,risk:86,land:54,water:82,tc:10.5,ci:381,iso:'DE'},
  {n:'프랑스',rank:1,region:'서유럽',dc:1,lat:46.6,lng:2.2,temp:76,power:74,renew:52,grid:91,net:89,risk:84,land:58,water:78,tc:12,ci:56,iso:'FR'},
  {n:'스위스',rank:1,region:'서유럽',dc:1,lat:46.8,lng:8.2,temp:82,power:64,renew:79,grid:95,net:92,risk:80,land:40,water:94,tc:10,ci:41,iso:'CH'},
  {n:'폴란드',rank:1,region:'동유럽',dc:1,lat:52.0,lng:19.4,temp:80,power:68,renew:38,grid:80,net:85,risk:88,land:76,water:70,tc:9,ci:662,iso:'PL'},
  {n:'스페인',rank:1,region:'서유럽',dc:1,lat:40.0,lng:-3.7,temp:66,power:68,renew:64,grid:86,net:88,risk:78,land:66,water:46,tc:15,ci:156,iso:'ES'},
  {n:'뉴질랜드',rank:1,region:'오세아니아',dc:0,lat:-41.5,lng:172.8,temp:86,power:78,renew:90,grid:85,net:79,risk:58,land:74,water:94,tc:13,ci:112,iso:'NZ'},
  {n:'칠레',rank:1,region:'남미',dc:0,lat:-33.5,lng:-71.0,temp:84,power:73,renew:76,grid:76,net:74,risk:52,land:82,water:62,tc:14.5,ci:332,iso:'CL'},
  {n:'미국',rank:1,region:'북미',dc:1,lat:39.5,lng:-98.4,temp:66,power:80,renew:48,grid:82,net:94,risk:66,land:70,water:70,tc:11,ci:369,iso:'US'},
  {n:'대한민국',rank:1,region:'동아시아',dc:1,lat:36.5,lng:127.9,temp:70,power:72,renew:22,grid:95,net:98,risk:78,land:38,water:72,tc:12.5,ci:437,iso:'KR'},
  {n:'일본',rank:1,region:'동아시아',dc:1,lat:36.2,lng:138.3,temp:68,power:54,renew:32,grid:93,net:95,risk:38,land:36,water:86,tc:16,ci:462,iso:'JP'},
  {n:'중국',rank:1,region:'동아시아',dc:1,lat:35.0,lng:103.0,temp:64,power:76,renew:42,grid:82,net:82,risk:60,land:66,water:52,tc:17,ci:538,iso:'CN'},
  {n:'대만',rank:1,region:'동아시아',dc:1,lat:23.7,lng:121.0,temp:48,power:70,renew:16,grid:80,net:93,risk:40,land:38,water:78,tc:23,ci:561,iso:'TW'},
  {n:'호주',rank:1,region:'오세아니아',dc:1,lat:-25.3,lng:133.8,temp:58,power:62,renew:46,grid:79,net:80,risk:62,land:78,water:44,tc:18,ci:549,iso:'AU'},
  {n:'브라질',rank:1,region:'남미',dc:1,lat:-10.8,lng:-52.9,temp:52,power:70,renew:84,grid:70,net:72,risk:74,land:80,water:92,tc:20,ci:110,iso:'BR'},
  {n:'인도',rank:1,region:'남아시아',dc:1,lat:22.6,lng:79.0,temp:36,power:78,renew:34,grid:58,net:70,risk:56,land:84,water:40,tc:27,ci:713,iso:'IN'},
  {n:'멕시코',rank:1,region:'북미',dc:1,lat:23.6,lng:-102.5,temp:58,power:72,renew:30,grid:66,net:70,risk:58,land:78,water:46,tc:16,ci:431,iso:'MX'},
  {n:'남아프리카공화국',rank:1,region:'아프리카',dc:1,lat:-29.0,lng:24.7,temp:66,power:74,renew:20,grid:42,net:66,risk:76,land:82,water:32,tc:16,ci:709,iso:'ZA'},
  {n:'싱가포르',rank:1,region:'동남아',dc:1,lat:1.35,lng:103.8,temp:32,power:56,renew:12,grid:92,net:99,risk:86,land:24,water:38,tc:28,ci:486,iso:'SG'},
  {n:'인도네시아',rank:1,region:'동남아',dc:1,lat:-2.5,lng:118.0,temp:34,power:74,renew:26,grid:62,net:64,risk:36,land:80,water:90,tc:27,ci:686,iso:'ID'},
  {n:'아랍에미리트',rank:1,region:'중동',dc:1,lat:24.0,lng:54.0,temp:24,power:80,renew:22,grid:90,net:88,risk:82,land:62,water:8,tc:28,ci:402,iso:'AE'},
  {n:'바레인',rank:1,region:'중동',dc:1,lat:26.07,lng:50.56,temp:26,power:78,renew:4,grid:86,net:84,risk:84,land:52,water:6,tc:27,ci:470,iso:'BH'},
  {n:'파라과이',rank:1,region:'남미',dc:0,lat:-23.4,lng:-58.4,temp:46,power:88,renew:100,grid:64,net:56,risk:78,land:88,water:90,tc:23,ci:25,iso:'PY'},
  {n:'우루과이',rank:1,region:'남미',dc:0,lat:-32.5,lng:-55.8,temp:62,power:66,renew:88,grid:76,net:78,risk:84,land:82,water:86,tc:17,ci:128,iso:'UY'},

  // --- 지도 색상 계산용 보조 기준점 ---
  {n:'러시아',rank:1,region:'동유럽',dc:1,lat:61.5,lng:90.0,temp:88,power:88,renew:34,grid:74,net:70,risk:82,land:88,water:88,tc:-1,ci:360,iso:'RU'},
  {n:'시베리아 동부',rank:0,lat:62.0,lng:129.7,temp:90,power:88,renew:24,grid:50,net:44,risk:80,land:94,water:90,tc:-8,ci:400},
  {n:'알래스카',rank:0,lat:64.2,lng:-149.5,temp:92,power:74,renew:36,grid:60,net:58,risk:62,land:92,water:94,tc:-3,ci:480},
  {n:'그린란드',rank:0,lat:72.0,lng:-42.0,temp:98,power:70,renew:90,grid:48,net:34,risk:78,land:95,water:96,tc:-15,ci:60},
  {n:'카자흐스탄',rank:1,region:'중앙아시아',dc:1,lat:48.0,lng:66.9,temp:78,power:84,renew:12,grid:66,net:62,risk:80,land:90,water:34,tc:6,ci:620,iso:'KZ'},
  {n:'우즈베키스탄',rank:0,lat:41.4,lng:64.6,temp:68,power:80,renew:16,grid:58,net:54,risk:70,land:88,water:22,tc:13,ci:520},
  {n:'몽골',rank:1,region:'동아시아',dc:0,lat:46.9,lng:103.8,temp:82,power:76,renew:14,grid:52,net:48,risk:76,land:94,water:30,tc:0,ci:700,iso:'MN'},
  {n:'이란',rank:1,region:'중동',dc:0,lat:32.4,lng:53.7,temp:50,power:86,renew:8,grid:60,net:52,risk:52,land:84,water:18,tc:17,ci:550,iso:'IR'},
  {n:'이라크',rank:0,lat:33.2,lng:43.7,temp:44,power:82,renew:6,grid:44,net:46,risk:56,land:86,water:20,tc:22,ci:640},
  {n:'튀르키예',rank:1,region:'중동',dc:1,lat:39.0,lng:35.2,temp:64,power:66,renew:44,grid:74,net:76,risk:48,land:74,water:50,tc:12,ci:440,iso:'TR'},
  {n:'우크라이나',rank:1,region:'동유럽',dc:0,lat:48.4,lng:31.2,temp:76,power:78,renew:22,grid:56,net:74,risk:62,land:88,water:64,tc:8,ci:260,iso:'UA'},
  {n:'벨라루스',rank:0,lat:53.7,lng:27.9,temp:82,power:76,renew:10,grid:72,net:70,risk:86,land:88,water:80,tc:7,ci:420},
  {n:'루마니아',rank:1,region:'동유럽',dc:1,lat:45.9,lng:25.0,temp:74,power:70,renew:48,grid:78,net:88,risk:76,land:82,water:70,tc:9.5,ci:260,iso:'RO'},
  {n:'그리스',rank:1,region:'서유럽',dc:1,lat:39.0,lng:22.0,temp:60,power:60,renew:46,grid:76,net:80,risk:58,land:72,water:48,tc:16,ci:350,iso:'GR'},
  {n:'이탈리아',rank:1,region:'서유럽',dc:1,lat:42.8,lng:12.6,temp:70,power:58,renew:56,grid:84,net:85,risk:64,land:56,water:62,tc:14,ci:330,iso:'IT'},
  {n:'포르투갈',rank:1,region:'서유럽',dc:1,lat:39.5,lng:-8.2,temp:66,power:64,renew:70,grid:84,net:86,risk:70,land:70,water:56,tc:16,ci:180,iso:'PT'},
  {n:'모로코',rank:1,region:'아프리카',dc:1,lat:31.9,lng:-7.1,temp:52,power:70,renew:38,grid:62,net:62,risk:66,land:86,water:30,tc:18,ci:610,iso:'MA'},
  {n:'알제리',rank:0,lat:28.1,lng:2.6,temp:42,power:88,renew:4,grid:58,net:52,risk:74,land:90,water:14,tc:23,ci:490},
  {n:'리비아',rank:0,lat:26.5,lng:17.5,temp:38,power:88,renew:2,grid:38,net:40,risk:76,land:92,water:6,tc:22,ci:720},
  {n:'이집트',rank:1,region:'아프리카',dc:1,lat:26.8,lng:30.0,temp:40,power:80,renew:24,grid:64,net:62,risk:74,land:84,water:10,tc:22,ci:470,iso:'EG'},
  {n:'수단',rank:0,lat:15.5,lng:30.3,temp:26,power:72,renew:34,grid:34,net:36,risk:60,land:92,water:22,tc:29,ci:380},
  {n:'차드',rank:0,lat:15.5,lng:18.7,temp:26,power:58,renew:12,grid:24,net:28,risk:66,land:94,water:20,tc:27,ci:700},
  {n:'니제르',rank:0,lat:17.6,lng:8.1,temp:28,power:64,renew:14,grid:26,net:30,risk:66,land:94,water:14,tc:28,ci:690},
  {n:'말리',rank:0,lat:17.6,lng:-4.0,temp:28,power:62,renew:30,grid:28,net:32,risk:64,land:94,water:24,tc:28,ci:480},
  {n:'나이지리아',rank:1,region:'아프리카',dc:1,lat:9.1,lng:8.7,temp:30,power:66,renew:20,grid:32,net:48,risk:68,land:86,water:72,tc:27,ci:400,iso:'NG'},
  {n:'에티오피아',rank:0,lat:9.2,lng:39.6,temp:48,power:74,renew:96,grid:44,net:40,risk:62,land:90,water:52,tc:18,ci:30},
  {n:'케냐',rank:1,region:'아프리카',dc:1,lat:0.2,lng:37.9,temp:44,power:66,renew:88,grid:52,net:56,risk:66,land:86,water:44,tc:19,ci:90,iso:'KE'},
  {n:'콩고',rank:0,lat:-2.9,lng:23.6,temp:32,power:70,renew:96,grid:26,net:30,risk:64,land:92,water:96,tc:25,ci:30},
  {n:'앙골라',rank:0,lat:-11.2,lng:17.9,temp:40,power:68,renew:70,grid:40,net:44,risk:74,land:88,water:72,tc:21,ci:200},
  {n:'탄자니아',rank:0,lat:-6.4,lng:34.9,temp:40,power:66,renew:62,grid:40,net:44,risk:70,land:90,water:60,tc:22,ci:320},
  {n:'모잠비크',rank:0,lat:-18.7,lng:35.5,temp:44,power:70,renew:80,grid:38,net:40,risk:56,land:92,water:70,tc:24,ci:130},
  {n:'보츠와나',rank:0,lat:-22.3,lng:24.7,temp:56,power:72,renew:10,grid:48,net:50,risk:80,land:92,water:26,tc:21,ci:720},
  {n:'마다가스카르',rank:0,lat:-18.8,lng:46.9,temp:48,power:60,renew:38,grid:30,net:34,risk:44,land:92,water:74,tc:22,ci:480},
  {n:'사우디아라비아',rank:1,region:'중동',dc:1,lat:24.0,lng:45.1,temp:28,power:82,renew:14,grid:88,net:82,risk:82,land:70,water:6,tc:26,ci:600,iso:'SA'},
  {n:'파키스탄',rank:1,region:'남아시아',dc:1,lat:30.4,lng:69.3,temp:48,power:74,renew:30,grid:44,net:50,risk:54,land:88,water:28,tc:22,ci:400,iso:'PK'},
  {n:'방글라데시',rank:1,region:'남아시아',dc:1,lat:23.7,lng:90.4,temp:38,power:78,renew:4,grid:50,net:56,risk:34,land:74,water:84,tc:26,ci:570,iso:'BD'},
  {n:'미얀마',rank:0,lat:21.9,lng:96.0,temp:36,power:72,renew:50,grid:36,net:42,risk:44,land:88,water:86,tc:26,ci:320},
  {n:'태국',rank:1,region:'동남아',dc:1,lat:15.9,lng:100.9,temp:30,power:68,renew:18,grid:74,net:78,risk:64,land:76,water:78,tc:27,ci:500,iso:'TH'},
  {n:'베트남',rank:1,region:'동남아',dc:1,lat:14.1,lng:108.3,temp:32,power:78,renew:44,grid:66,net:74,risk:44,land:80,water:84,tc:25,ci:400,iso:'VN'},
  {n:'말레이시아',rank:1,region:'동남아',dc:1,lat:4.2,lng:102.0,temp:30,power:74,renew:20,grid:78,net:82,risk:80,land:70,water:92,tc:27,ci:552,iso:'MY'},
  {n:'필리핀',rank:1,region:'동남아',dc:1,lat:12.9,lng:121.8,temp:30,power:56,renew:24,grid:54,net:60,risk:30,land:76,water:86,tc:26,ci:590,iso:'PH'},
  {n:'파푸아뉴기니',rank:0,lat:-6.3,lng:143.9,temp:32,power:56,renew:40,grid:30,net:32,risk:34,land:90,water:96,tc:26,ci:550},
  {n:'페루',rank:1,region:'남미',dc:1,lat:-9.2,lng:-75.0,temp:44,power:72,renew:58,grid:60,net:60,risk:48,land:86,water:64,tc:19,ci:240,iso:'PE'},
  {n:'콜롬비아',rank:1,region:'남미',dc:1,lat:4.6,lng:-74.3,temp:38,power:70,renew:72,grid:62,net:64,risk:54,land:84,water:92,tc:24,ci:180,iso:'CO'},
  {n:'베네수엘라',rank:0,lat:6.4,lng:-66.6,temp:34,power:80,renew:70,grid:30,net:44,risk:66,land:88,water:84,tc:26,ci:220},
  {n:'볼리비아',rank:0,lat:-16.3,lng:-63.6,temp:48,power:74,renew:34,grid:52,net:52,risk:66,land:90,water:66,tc:15,ci:400},
  {n:'아르헨티나',rank:1,region:'남미',dc:1,lat:-35.4,lng:-64.2,temp:72,power:74,renew:40,grid:64,net:70,risk:76,land:86,water:64,tc:15,ci:340,iso:'AR'},
  {n:'쿠바',rank:0,lat:21.5,lng:-79.5,temp:34,power:58,renew:12,grid:38,net:38,risk:38,land:84,water:74,tc:25,ci:640},
  {n:'과테말라',rank:0,lat:15.8,lng:-90.2,temp:38,power:62,renew:60,grid:50,net:52,risk:36,land:82,water:82,tc:23,ci:300},
];
// 실제 연평균 기온(tc, °C)에서 기온 점수를 산출한다.
// 손으로 매긴 점수 대신 물리량을 정규화하는 방식이라 시나리오 계산의 기준선도 정확해진다.
DATA.forEach(c=>{ if(typeof c.tc==='number') c.temp = tempScore(c.tc); });

// ---- 내륙 보조 기준점: 큰 나라 내부의 빈 칸을 메운다 (부모 국가 지표를 상속) ----
const INTERIOR = [
  ['러시아',60,60],['러시아',56,80],['러시아',64,105],['러시아',67,145],['러시아',52,105],
  ['카자흐스탄',50,75],['카자흐스탄',44,60],['몽골',44,95],
  ['캐나다',60,-120],['캐나다',54,-75],['캐나다',65,-95],['캐나다',50,-95],['캐나다',68,-130],
  ['알래스카',68,-155],['그린란드',68,-45],['그린란드',77,-35],
  ['미국',40,-115],['미국',35,-95],['미국',45,-100],['미국',37,-80],
  ['멕시코',28,-108],['멕시코',18,-95],
  ['중국',40,90],['중국',31,95],['중국',45,122],['중국',25,105],
  ['인도',26,76],['인도',15,77],
  ['호주',-25,120],['호주',-20,145],['호주',-30,142],['호주',-28,118],
  ['브라질',-5,-60],['브라질',-15,-45],['브라질',-25,-50],['브라질',-8,-40],
  ['아르헨티나',-45,-69],['아르헨티나',-28,-64],['페루',-13,-72],['볼리비아',-19,-64],
  ['알제리',24,4],['알제리',30,-2],['리비아',24,20],['이집트',24,28],
  ['말리',20,-3],['니제르',20,10],['차드',20,18],['수단',18,28],
  ['에티오피아',6,42],['콩고',0,20],['콩고',-6,25],['앙골라',-14,20],
  ['탄자니아',-4,33],['모잠비크',-15,37],['남아프리카공화국',-25,25],
  ['사우디아라비아',22,44],['사우디아라비아',28,42],['이란',30,58],
  ['카자흐스탄',46,72],['우즈베키스탄',42,60],['파키스탄',27,66],
  ['인도네시아',-1,113],['인도네시아',-4,140],['미얀마',20,95],
  ['스웨덴',66,18],['핀란드',67,27],['노르웨이',69,22],['러시아',69,88],
  ['튀르키예',38,38],['우크라이나',49,35],['프랑스',45,4],['스페인',41,-4],
];
INTERIOR.forEach(([parent,lat,lng])=>{
  const src=DATA.find(d=>d.n===parent);
  if(!src) return;
  const tc = src.tc + (estTemp(lat) - estTemp(src.lat));   // 위도 차이만큼 기온 보정
  DATA.push({...src, lat, lng, tc, temp:tempScore(tc), rank:0, _parent:parent});
});

// ---- 바다 기준점: 가장 가까운 것이 바다면 색을 칠하지 않는다 ----
const SEA = [
  [36,18],[38,5],[34,28],[40,16],[43,34],[41,51],[57,19],[56,3],[66,2],[45,-6],   // 유럽 주변
  [40,135],[36,123],[28,125],[16,114],[8,110],[15,88],[18,63],[27,51],[20,38],[12,52], // 아시아 주변
  [-18,41],[-6,116],[-8,128],[2,3],[-4,-32],                                          // 인도양·대서양
  [-16,152],[-38,158],[-38,132],[-12,120],[-25,110],                                  // 오세아니아 주변
  [25,-90],[15,-75],[58,-85],[58,-55],[72,-65],[30,-70],                              // 북미 주변
  [58,-178],[56,-145],[55,148],[74,40],[74,70],[76,125],[73,165],[72,-135],           // 북극·베링
  [45,-40],[55,-25],[30,-45],[10,-40],[-20,-25],[-35,-45],[-45,-60],                  // 대서양
  [0,-140],[20,-160],[-20,-120],[30,-150],[-40,-100],[10,-95],[-15,-85],[40,-170],    // 태평양
  [-20,75],[-35,80],[0,70],[-45,60],[-10,60],[5,90],                                  // 인도양
];
/* ---- 최근접 기준점 탐색 ----
   기준점이 165개뿐이라 공간 색인은 관리 비용이 더 크다 (실측 13배 느림).
   대신 삼각함수 값을 미리 계산해 두고, 가까운 후보를 고를 때는 값싼 근사식을 쓴 뒤
   최종 거리만 정확히 계산한다. 결과는 전수 탐색과 동일하다. */
// 두 지점 사이의 대권 거리 (km)
function hav(a,b){
  const R=6371, r=x=>x*Math.PI/180;
  const dLat=r(b.lat-a.lat), dLng=r(b.lng-a.lng);
  const t=Math.sin(dLat/2)**2 + Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(t));
}
function prepGeo(pts){
  pts.forEach(p=>{
    p._rlat = p.lat*Math.PI/180;
    p._rlng = p.lng*Math.PI/180;
    p._clat = Math.cos(p._rlat);
  });
  return pts;
}
let _seaPts=null;
function seaPoints(){
  if(!_seaPts) _seaPts=prepGeo(SEA.map(([lat,lng])=>({lat,lng})));
  return _seaPts;
}
let _geoReady=false;
function ensureGeo(){ if(!_geoReady){ prepGeo(DATA); _geoReady=true; } }

// 등거리 원통 근사로 가장 가까운 점을 고른다 (제곱 거리라 sqrt 도 생략)
function pickNearest(pts, lat, lng){
  const rlat=lat*Math.PI/180, rlng=lng*Math.PI/180, clat=Math.cos(rlat);
  let best=null, bestD2=Infinity;
  for(let i=0;i<pts.length;i++){
    const c=pts[i];
    let dl=rlng-c._rlng;
    if(dl>Math.PI) dl-=2*Math.PI; else if(dl<-Math.PI) dl+=2*Math.PI;
    const x=dl*(clat+c._clat)*0.5, y=rlat-c._rlat;
    const d2=x*x+y*y;
    if(d2<bestD2){ bestD2=d2; best=c; }
  }
  return best;
}
function nearestSea(lat,lng){
  const p=pickNearest(seaPoints(), lat, lng);
  return p ? hav({lat,lng},p) : Infinity;
}
// exact=true 면 모든 후보를 정확한 대권 거리로 비교한다.
// 격자 색칠처럼 수천 번 도는 곳은 근사(기본값), 사용자가 국가명을 직접 보는
// 지점 평가·데이터센터 평가는 정확 모드를 쓴다.
function nearest(lat,lng,exact){
  ensureGeo();
  if(exact){
    let best=null, bestD=Infinity;
    for(const c of DATA){
      const d=hav({lat,lng},c);
      if(d<bestD){ bestD=d; best=c; }
    }
    return {ref:best, dist:bestD};
  }
  const p=pickNearest(DATA, lat, lng);
  return {ref:p, dist:p?hav({lat,lng},p):Infinity};
}

const RANKED_SET = DATA.filter(c=>c.rank);

const SITES = [
  // Google
  {co:'Google',pl:'Hamina',ct:'핀란드',lat:60.5693,lng:27.1975},
  {co:'Google',pl:'Eemshaven',ct:'네덜란드',lat:53.4386,lng:6.8339},
  {co:'Google',pl:'St Ghislain',ct:'벨기에',lat:50.4550,lng:3.8180},
  {co:'Google',pl:'Dublin',ct:'아일랜드',lat:53.3244,lng:-6.3860},
  {co:'Google',pl:'The Dalles',ct:'미국',lat:45.5946,lng:-121.1787},
  {co:'Google',pl:'Council Bluffs',ct:'미국',lat:41.2619,lng:-95.8608},
  {co:'Google',pl:'Douglas County',ct:'미국',lat:33.7010,lng:-84.7477},
  {co:'Google',pl:'Changhua',ct:'대만',lat:24.0850,lng:120.4820},
  {co:'Google',pl:'Jurong West',ct:'싱가포르',lat:1.3400,lng:103.7000},
  {co:'Google',pl:'Osaka',ct:'일본',lat:34.6937,lng:135.5023},
  {co:'Google',pl:'Sydney',ct:'호주',lat:-33.8688,lng:151.2093},
  {co:'Google',pl:'Quilicura',ct:'칠레',lat:-33.3670,lng:-70.7290},
  {co:'Google',pl:'Mumbai',ct:'인도',lat:19.0760,lng:72.8777},
  {co:'Google',pl:'São Paulo',ct:'브라질',lat:-23.5505,lng:-46.6333},
  // AWS
  {co:'AWS',pl:'N. Virginia',ct:'미국',lat:39.0438,lng:-77.4874},
  {co:'AWS',pl:'Oregon',ct:'미국',lat:45.8400,lng:-119.7000},
  {co:'AWS',pl:'Ohio',ct:'미국',lat:39.9612,lng:-82.9988},
  {co:'AWS',pl:'Dublin',ct:'아일랜드',lat:53.3498,lng:-6.2603},
  {co:'AWS',pl:'Frankfurt',ct:'독일',lat:50.1109,lng:8.6821},
  {co:'AWS',pl:'Stockholm',ct:'스웨덴',lat:59.3293,lng:18.0686},
  {co:'AWS',pl:'London',ct:'영국',lat:51.5074,lng:-0.1278},
  {co:'AWS',pl:'Tokyo',ct:'일본',lat:35.6762,lng:139.6503},
  {co:'AWS',pl:'Seoul',ct:'대한민국',lat:37.5665,lng:126.9780},
  {co:'AWS',pl:'Singapore',ct:'싱가포르',lat:1.3521,lng:103.8198},
  {co:'AWS',pl:'Sydney',ct:'호주',lat:-33.8688,lng:151.2093},
  {co:'AWS',pl:'Mumbai',ct:'인도',lat:19.0760,lng:72.8777},
  {co:'AWS',pl:'São Paulo',ct:'브라질',lat:-23.5505,lng:-46.6333},
  {co:'AWS',pl:'Bahrain',ct:'바레인',lat:26.0667,lng:50.5577},
  {co:'AWS',pl:'Cape Town',ct:'남아프리카공화국',lat:-33.9249,lng:18.4241},
  // Microsoft
  {co:'Microsoft',pl:'Quincy',ct:'미국',lat:47.2343,lng:-119.8524},
  {co:'Microsoft',pl:'San Antonio',ct:'미국',lat:29.4241,lng:-98.4936},
  {co:'Microsoft',pl:'Boydton',ct:'미국',lat:36.6676,lng:-78.3875},
  {co:'Microsoft',pl:'Middenmeer',ct:'네덜란드',lat:52.8167,lng:4.9833},
  {co:'Microsoft',pl:'Dublin',ct:'아일랜드',lat:53.4239,lng:-6.3600},
  {co:'Microsoft',pl:'Gävle',ct:'스웨덴',lat:60.6749,lng:17.1413},
  {co:'Microsoft',pl:'Tokyo',ct:'일본',lat:35.6762,lng:139.6503},
  {co:'Microsoft',pl:'Busan',ct:'대한민국',lat:35.1796,lng:129.0756},
  {co:'Microsoft',pl:'Singapore',ct:'싱가포르',lat:1.3521,lng:103.8198},
  {co:'Microsoft',pl:'Sydney',ct:'호주',lat:-33.8688,lng:151.2093},
  {co:'Microsoft',pl:'Pune',ct:'인도',lat:18.5204,lng:73.8567},
  {co:'Microsoft',pl:'Johannesburg',ct:'남아프리카공화국',lat:-26.2041,lng:28.0473},
  // Meta
  {co:'Meta',pl:'Prineville',ct:'미국',lat:44.2998,lng:-120.8345},
  {co:'Meta',pl:'Eagle Mountain',ct:'미국',lat:40.3141,lng:-112.0069},
  {co:'Meta',pl:'Luleå',ct:'스웨덴',lat:65.5848,lng:22.1567},
  {co:'Meta',pl:'Odense',ct:'덴마크',lat:55.4038,lng:10.4024},
  {co:'Meta',pl:'Clonee',ct:'아일랜드',lat:53.4100,lng:-6.4400},
  {co:'Meta',pl:'Singapore',ct:'싱가포르',lat:1.3200,lng:103.7000},
  // Oracle
  {co:'Oracle',pl:'Phoenix',ct:'미국',lat:33.4484,lng:-112.0740},
  {co:'Oracle',pl:'Ashburn',ct:'미국',lat:39.0438,lng:-77.4874},
  {co:'Oracle',pl:'Frankfurt',ct:'독일',lat:50.1109,lng:8.6821},
  // Apple
  {co:'Apple',pl:'Maiden',ct:'미국',lat:35.5793,lng:-81.2192},
  {co:'Apple',pl:'Viborg',ct:'덴마크',lat:56.4530,lng:9.4020},
  // Alibaba
  {co:'Alibaba',pl:'Hangzhou',ct:'중국',lat:30.2741,lng:120.1551},
  {co:'Alibaba',pl:'Ulanqab',ct:'중국',lat:41.0200,lng:113.1200},
  {co:'Alibaba',pl:'Singapore',ct:'싱가포르',lat:1.3521,lng:103.8198},
  // Tencent
  {co:'Tencent',pl:'Shanghai',ct:'중국',lat:31.2304,lng:121.4737},
  {co:'Tencent',pl:'Guiyang',ct:'중국',lat:26.6470,lng:106.6302},
  // ByteDance
  {co:'ByteDance',pl:'Johor',ct:'말레이시아',lat:1.4927,lng:103.7414},
  // 국내
  {co:'Naver',pl:'Chuncheon',ct:'대한민국',lat:37.8813,lng:127.7300},
  {co:'Naver',pl:'Sejong',ct:'대한민국',lat:36.4800,lng:127.2890},
  {co:'Kakao',pl:'Ansan',ct:'대한민국',lat:37.3219,lng:126.8309},
  // ---- 추가 지점 ----
  // Google
  {co:'Google',pl:'Berkeley County',ct:'미국',lat:33.1960,lng:-80.0140},
  {co:'Google',pl:'Lenoir',ct:'미국',lat:35.9140,lng:-81.5390},
  {co:'Google',pl:'Mayes County',ct:'미국',lat:36.2900,lng:-95.3100},
  {co:'Google',pl:'Papillion',ct:'미국',lat:41.1540,lng:-96.0420},
  {co:'Google',pl:'Storey County',ct:'미국',lat:39.5300,lng:-119.4400},
  {co:'Google',pl:'Fredericia',ct:'덴마크',lat:55.5657,lng:9.7527},
  {co:'Google',pl:'Montréal',ct:'캐나다',lat:45.5017,lng:-73.5673},
  {co:'Google',pl:'Delhi',ct:'인도',lat:28.6139,lng:77.2090},
  {co:'Google',pl:'Jakarta',ct:'인도네시아',lat:-6.2088,lng:106.8456},
  {co:'Google',pl:'Doha 인접 UAE',ct:'아랍에미리트',lat:25.2048,lng:55.2708},
  // AWS
  {co:'AWS',pl:'Paris',ct:'프랑스',lat:48.8566,lng:2.3522},
  {co:'AWS',pl:'Zurich',ct:'스위스',lat:47.3769,lng:8.5417},
  {co:'AWS',pl:'Madrid',ct:'스페인',lat:40.4168,lng:-3.7038},
  {co:'AWS',pl:'Osaka',ct:'일본',lat:34.6937,lng:135.5023},
  {co:'AWS',pl:'Hyderabad',ct:'인도',lat:17.3850,lng:78.4867},
  {co:'AWS',pl:'Jakarta',ct:'인도네시아',lat:-6.1751,lng:106.8650},
  {co:'AWS',pl:'Melbourne',ct:'호주',lat:-37.8136,lng:144.9631},
  {co:'AWS',pl:'Montréal',ct:'캐나다',lat:45.5088,lng:-73.5540},
  {co:'AWS',pl:'Calgary',ct:'캐나다',lat:51.0447,lng:-114.0719},
  {co:'AWS',pl:'UAE',ct:'아랍에미리트',lat:24.4539,lng:54.3773},
  // Microsoft
  {co:'Microsoft',pl:'Newport',ct:'영국',lat:51.5842,lng:-2.9977},
  {co:'Microsoft',pl:'Zurich',ct:'스위스',lat:47.4245,lng:8.5000},
  {co:'Microsoft',pl:'Warsaw',ct:'폴란드',lat:52.2297,lng:21.0122},
  {co:'Microsoft',pl:'Madrid',ct:'스페인',lat:40.4637,lng:-3.7492},
  {co:'Microsoft',pl:'Toronto',ct:'캐나다',lat:43.6532,lng:-79.3832},
  {co:'Microsoft',pl:'Melbourne',ct:'호주',lat:-37.8200,lng:144.9500},
  {co:'Microsoft',pl:'Chennai',ct:'인도',lat:13.0827,lng:80.2707},
  {co:'Microsoft',pl:'Kuala Lumpur',ct:'말레이시아',lat:3.1390,lng:101.6869},
  {co:'Microsoft',pl:'Abu Dhabi',ct:'아랍에미리트',lat:24.4667,lng:54.3667},
  {co:'Microsoft',pl:'São Paulo',ct:'브라질',lat:-23.5489,lng:-46.6388},
  // Meta
  {co:'Meta',pl:'Altoona',ct:'미국',lat:41.6440,lng:-93.4650},
  {co:'Meta',pl:'Fort Worth',ct:'미국',lat:32.7555,lng:-97.3308},
  {co:'Meta',pl:'Huntsville',ct:'미국',lat:34.7304,lng:-86.5861},
  {co:'Meta',pl:'New Albany',ct:'미국',lat:40.0812,lng:-82.8088},
  {co:'Meta',pl:'Toledo',ct:'스페인',lat:39.8628,lng:-4.0273},
  // Apple / Oracle
  {co:'Apple',pl:'Reno',ct:'미국',lat:39.5296,lng:-119.8138},
  {co:'Apple',pl:'Mesa',ct:'미국',lat:33.4152,lng:-111.8315},
  {co:'Oracle',pl:'London',ct:'영국',lat:51.5074,lng:-0.1278},
  // 아이슬란드·노르웨이 — 모델이 최적지로 꼽는 지역의 실제 사업자
  {co:'atNorth',pl:'Keflavík',ct:'아이슬란드',lat:63.9850,lng:-22.5600},
  {co:'Verne',pl:'Reykjanesbær',ct:'아이슬란드',lat:63.9900,lng:-22.5900},
  {co:'Green Mountain',pl:'Stavanger',ct:'노르웨이',lat:58.9700,lng:5.7331},
  {co:'Lefdal Mine',pl:'Måløy',ct:'노르웨이',lat:61.8800,lng:5.1200},
  {co:'Bulk',pl:'Vennesla',ct:'노르웨이',lat:58.2700,lng:7.9800},
  {co:'EcoDataCenter',pl:'Falun',ct:'스웨덴',lat:60.6065,lng:15.6355},
  {co:'Hetzner',pl:'Helsinki',ct:'핀란드',lat:60.1699,lng:24.9384},
  // 유럽 사업자
  {co:'OVHcloud',pl:'Roubaix',ct:'프랑스',lat:50.6942,lng:3.1746},
  {co:'OVHcloud',pl:'Gravelines',ct:'프랑스',lat:50.9870,lng:2.1280},
  {co:'Hetzner',pl:'Falkenstein',ct:'독일',lat:50.4780,lng:12.3710},
  {co:'Equinix',pl:'Frankfurt',ct:'독일',lat:50.1109,lng:8.6821},
  {co:'Equinix',pl:'Amsterdam',ct:'네덜란드',lat:52.3676,lng:4.9041},
  {co:'Virtus',pl:'Slough',ct:'영국',lat:51.5105,lng:-0.5950},
  // 아시아
  {co:'Alibaba',pl:'Zhangbei',ct:'중국',lat:41.1600,lng:114.7200},
  {co:'Huawei',pl:'Guiyang',ct:'중국',lat:26.6470,lng:106.6302},
  {co:'Baidu',pl:'Yangquan',ct:'중국',lat:37.8600,lng:113.5800},
  {co:'GDS',pl:'Shanghai',ct:'중국',lat:31.1800,lng:121.4000},
  {co:'NHN',pl:'Gwangju',ct:'대한민국',lat:35.1595,lng:126.8526},
  {co:'Samsung SDS',pl:'Chuncheon',ct:'대한민국',lat:37.8600,lng:127.7400},
  {co:'LG CNS',pl:'Busan',ct:'대한민국',lat:35.1796,lng:129.0756},
  {co:'Yotta',pl:'Navi Mumbai',ct:'인도',lat:19.0330,lng:73.0297},
  {co:'ST Telemedia',pl:'Singapore',ct:'싱가포르',lat:1.3300,lng:103.7400},
  // 남반구·기타
  {co:'Teraco',pl:'Johannesburg',ct:'남아프리카공화국',lat:-26.1400,lng:28.0900},
  {co:'Ascenty',pl:'São Paulo',ct:'브라질',lat:-23.4800,lng:-46.5000},
  {co:'KIO',pl:'Querétaro',ct:'멕시코',lat:20.5888,lng:-100.3899},
  {co:'NEXTDC',pl:'Sydney',ct:'호주',lat:-33.8700,lng:151.2000},
  {co:'Datacom',pl:'Auckland',ct:'뉴질랜드',lat:-36.8485,lng:174.7633},
  // ---- 추가 지점 2차 ----
  {co:'KT',pl:'Mok-dong',ct:'대한민국',lat:37.5260,lng:126.8750},
  {co:'KT',pl:'Cheonan',ct:'대한민국',lat:36.8151,lng:127.1139},
  {co:'SK브로드밴드',pl:'Sejong',ct:'대한민국',lat:36.4800,lng:127.2890},
  {co:'LG U+',pl:'Pyeongchon',ct:'대한민국',lat:37.3943,lng:126.9568},
  {co:'Samsung SDS',pl:'Suwon',ct:'대한민국',lat:37.2636,lng:127.0286},
  {co:'Kakao',pl:'Siheung',ct:'대한민국',lat:37.3800,lng:126.8030},
  {co:'Yandex',pl:'Vladimir',ct:'러시아',lat:56.1290,lng:40.4070},
  {co:'Sber',pl:'Balabanovo',ct:'러시아',lat:55.1770,lng:36.6570},
  {co:'VK',pl:'Moscow',ct:'러시아',lat:55.7558,lng:37.6173},
  {co:'Freedom Holding',pl:'Almaty',ct:'카자흐스탄',lat:43.2380,lng:76.8890},
  {co:'Start Campus',pl:'Sines',ct:'포르투갈',lat:37.9560,lng:-8.8640},
  {co:'Aruba',pl:'Ponte San Pietro',ct:'이탈리아',lat:45.7000,lng:9.5900},
  {co:'Equinix',pl:'Milan',ct:'이탈리아',lat:45.4642,lng:9.1900},
  {co:'Lamda Hellix',pl:'Athens',ct:'그리스',lat:37.9838,lng:23.7275},
  {co:'ClusterPower',pl:'Craiova',ct:'루마니아',lat:44.3302,lng:23.7949},
  {co:'Atman',pl:'Warsaw',ct:'폴란드',lat:52.2297,lng:21.0122},
  {co:'CE Colo',pl:'Prague',ct:'체코',lat:50.0755,lng:14.4378},
  {co:'NTT',pl:'Vienna',ct:'오스트리아',lat:48.2082,lng:16.3738},
  {co:'Invitech',pl:'Budapest',ct:'헝가리',lat:47.4979,lng:19.0402},
  {co:'LuxConnect',pl:'Bissen',ct:'룩셈부르크',lat:49.7890,lng:6.0680},
  {co:'Telia',pl:'Vilnius',ct:'리투아니아',lat:54.6872,lng:25.2797},
  {co:'DigiPlex',pl:'Oslo',ct:'노르웨이',lat:59.9139,lng:10.7522},
  {co:'Telehouse',pl:'London',ct:'영국',lat:51.5090,lng:-0.0090},
  {co:'Vantage',pl:'Cardiff',ct:'영국',lat:51.4816,lng:-3.1791},
  {co:'Digital Realty',pl:'Marseille',ct:'프랑스',lat:43.2965,lng:5.3698},
  {co:'Interxion',pl:'Madrid',ct:'스페인',lat:40.4168,lng:-3.7038},
  {co:'Switch',pl:'Las Vegas',ct:'미국',lat:36.1699,lng:-115.1398},
  {co:'CyrusOne',pl:'Dallas',ct:'미국',lat:32.7767,lng:-96.7970},
  {co:'QTS',pl:'Atlanta',ct:'미국',lat:33.7490,lng:-84.3880},
  {co:'STACK',pl:'Portland',ct:'미국',lat:45.5152,lng:-122.6784},
  {co:'Aligned',pl:'Salt Lake City',ct:'미국',lat:40.7608,lng:-111.8910},
  {co:'Iron Mountain',pl:'Manassas',ct:'미국',lat:38.7509,lng:-77.4753},
  {co:'xAI',pl:'Memphis',ct:'미국',lat:35.1495,lng:-90.0490},
  {co:'CoreWeave',pl:'Plano',ct:'미국',lat:33.0198,lng:-96.6989},
  {co:'Google',pl:'Dammam',ct:'사우디아라비아',lat:26.4207,lng:50.0888},
  {co:'Ooredoo',pl:'Doha',ct:'카타르',lat:25.2854,lng:51.5310},
  {co:'Microsoft',pl:'Doha',ct:'카타르',lat:25.2760,lng:51.5200},
  {co:'AWS',pl:'Tel Aviv',ct:'이스라엘',lat:32.0853,lng:34.7818},
  {co:'Telecom Egypt',pl:'Cairo',ct:'이집트',lat:30.0444,lng:31.2357},
  {co:'MainOne',pl:'Lagos',ct:'나이지리아',lat:6.5244,lng:3.3792},
  {co:'Africa Data Centres',pl:'Nairobi',ct:'케냐',lat:-1.2921,lng:36.8219},
  {co:'Medasys',pl:'Casablanca',ct:'모로코',lat:33.5731,lng:-7.5898},
  {co:'Turkcell',pl:'Izmir',ct:'튀르키예',lat:38.4237,lng:27.1428},
  {co:'Equinix',pl:'Hong Kong',ct:'홍콩',lat:22.3193,lng:114.1694},
  {co:'AWS',pl:'Hong Kong',ct:'홍콩',lat:22.2800,lng:114.1500},
  {co:'True IDC',pl:'Bangkok',ct:'태국',lat:13.7563,lng:100.5018},
  {co:'AWS',pl:'Bangkok',ct:'태국',lat:13.7000,lng:100.6000},
  {co:'Viettel',pl:'Hanoi',ct:'베트남',lat:21.0285,lng:105.8542},
  {co:'ePLDT',pl:'Manila',ct:'필리핀',lat:14.5995,lng:120.9842},
  {co:'NTT',pl:'Mumbai',ct:'인도',lat:19.1200,lng:72.9000},
  {co:'AirTrunk',pl:'Johor',ct:'말레이시아',lat:1.4600,lng:103.7600},
  {co:'Bridge DC',pl:'Jakarta',ct:'인도네시아',lat:-6.2500,lng:106.9000},
  {co:'NTT',pl:'Tokyo',ct:'일본',lat:35.6900,lng:139.7000},
  {co:'AirTrunk',pl:'Sydney',ct:'호주',lat:-33.7900,lng:150.9000},
  {co:'Ascenty',pl:'Santiago',ct:'칠레',lat:-33.4489,lng:-70.6693},
  {co:'Odata',pl:'Bogotá',ct:'콜롬비아',lat:4.7110,lng:-74.0721},
  {co:'Scala',pl:'Buenos Aires',ct:'아르헨티나',lat:-34.6037,lng:-58.3816},
  {co:'GTD',pl:'Lima',ct:'페루',lat:-12.0464,lng:-77.0428},
].map((s,i)=>({...s,id:i+1}));

const PURPOSES = [
  {id:'balanced',name:'기본 (균형)',w:{temp:18,power:18,renew:14,grid:14,water:9,net:9,risk:9,land:9},
   why:'특정 목적을 정하지 않고 8개 항목을 고르게 반영합니다.'},
  {id:'ai',name:'AI 학습용',w:{temp:22,power:24,renew:9,grid:16,water:9,net:7,risk:7,land:6},
   why:'AI 학습은 며칠씩 쉬지 않고 돌아가 전력 소비가 크고 발열이 심합니다. 전기요금과 냉각 조건이 결정적입니다.'},
  {id:'gpu',name:'GPU 클러스터',w:{temp:24,power:22,renew:8,grid:20,water:12,net:6,risk:5,land:3},
   why:'GPU 랙은 일반 서버의 5~10배 열을 냅니다. 냉각과 전력망 용량, 그리고 수냉에 쓸 물이 함께 필요합니다.'},
  {id:'hpc',name:'HPC (슈퍼컴퓨팅)',w:{temp:22,power:20,renew:8,grid:22,water:12,net:8,risk:5,land:3},
   why:'대규모 병렬 연산은 순간 전력 변동이 커서 계통 안정성이 특히 중요합니다.'},
  {id:'cloud',name:'클라우드 서비스',w:{temp:11,power:13,renew:7,grid:18,water:8,net:26,risk:11,land:6},
   why:'이용자에게 응답을 빨리 돌려주는 것이 핵심이라 통신 인프라와 무중단 운영이 우선입니다.'},
  {id:'green',name:'친환경 · 저탄소',w:{temp:16,power:9,renew:34,grid:13,water:10,net:5,risk:7,land:6},
   why:'RE100·탄소중립 목표를 맞추려면 재생에너지 비율이 가장 중요합니다.'},
  {id:'cost',name:'비용 절감',w:{temp:16,power:29,renew:4,grid:11,water:10,net:5,risk:5,land:20},
   why:'운영비의 대부분은 전기요금이고, 초기 투자에서는 부지 비용이 큽니다.'},
  {id:'latency',name:'초저지연',w:{temp:7,power:9,renew:4,grid:18,water:8,net:37,risk:11,land:6},
   why:'금융 거래·실시간 게임처럼 지연시간이 곧 서비스 품질인 경우입니다.'},
];

