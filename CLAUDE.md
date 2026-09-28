@AGENTS.md

# 케이크 타이쿤 프로젝트 현황

## 기획 문서
- `cake-tycoon-prompt.md` — **기준 기획서**. 항상 이 문서를 따른다.
- `plan.md` — 최초 아이디어 초안. 참고만 하고 실제 작업 기준으로 쓰지 않는다.

## 기술 스택
- Next.js (App Router) + TypeScript + Tailwind CSS
- 이 컴퓨터에는 Node.js가 기본 PATH에 없다. PowerShell에서 `node`/`npm`/`npx`를 쓰려면 매 명령 앞에
  `$env:Path += ";C:\Program Files\nodejs";` 를 붙여야 한다 (셸 상태가 명령마다 초기화됨).

## 진행 상황 (Phase 1 MVP, cake-tycoon-prompt.md 19장 순서 기준)

### [x] 기반 구조 + 전체 UI 톤
- `lib/gameState.ts` — `Material`, `MaterialRegistry`, `Customer`, `ActiveOrder`, `GameState` 등 전체 타입 + `createInitialGameState()`
- `lib/materials.ts` — Phase 1 재료 레지스트리 (카테고리별 1개, decoration은 빈 배열)
- `lib/customer.ts` — 손님 2명 하드코딩 풀 + `createCustomer()`
- 테마: `app/globals.css`의 `--theme-*` 변수, pink 테마 하나만 채움. 실제 색상은 비비드 핑크가 아니라 채도를 낮춘 파스텔 코랄톤 (`data-theme="pink"`라는 이름은 기획서 7장 테마 목록을 그대로 쓴 것 — 새 테마를 만든 게 아님)
- PC(넓은 화면): `min-width: 901px` 미디어쿼리로 `.game-root`를 20:9 폰 가로 비율 프레임으로 중앙에 띄우고 나머지는 은은한 radial-gradient 비네트로 덮는다 (플래시 게임 창 느낌). 900px 이하는 기존처럼 전체화면. 프레임 그림자는 오프셋 없이 blur만 줘서 사방에 고르게 퍼지게 함
- 좌/우 공간 구분선: 네온 글로우 대신 `linear-gradient`로 양쪽 가장자리만 살짝 어두워지는 은은한 홈(seam)
- DAY/money는 아이콘(📅/💰) + 흰 반투명 pill 배지 (지금은 `components/game/TopBar.tsx` 안)
- `components/shop/SpeechBubble.tsx` — 얇은 테두리 + 은은한 그림자로 카드 느낌
- 캐릭터/손님 발밑에 흐린 타원 그림자로 바닥에 붙어있는 느낌, 탭 시 `active:scale-*`로 눌리는 피드백
- **캐릭터/손님/테이블은 전부 이모지·CSS 도형 placeholder** — 나중에 실제 이미지 에셋이 생기면 교체 예정 (Phase 1은 기획서 7장 "이미지 에셋 최소화" 원칙에 맞춰 CSS로 최대한 다듬어두는 것으로 진행)

### [x] ① 매장 화면 뼈대 (좌/우 분할, 정적 배치)
- `components/game/GameRoot.tsx` — 최상위 클라이언트 컴포넌트. `useGameState()`를 여기서만 호출하고 `state.station`에 따라 `ShopScreen`/`StationScreen`에 훅 결과 전체(`gameState` prop)를 넘긴다. 위아래로 `TopBar`/`StationNav`를 항상 붙인다. `app/page.tsx`는 `GameRoot`만 렌더링
- `components/shop/ShopScreen.tsx` — 좌(`basis-2/5`)/우(`basis-3/5`) 분할. 손님 쪽 공간을 더 넓게 확보
- `components/shop/PlayerSide.tsx` — 캐릭터 + 계산대(책상). 책상은 가로를 꽉 채우고 세로 최소 1/4(`h-1/4 min-h-24`)을 차지하며, **넓은 흰색 상판(70%, 위에서 내려다보는 면) + 얇은 테마색 옆면(30%)** 2단 구성 (Good Pizza, Great Pizza류 캐주얼 타이쿤 게임 참고 — 상판 비율이 커야 "위에서 내려다보는 테이블"처럼 보인다). 상판 위에 `CakeCounter`와 크림색 몸체의 캐시 레지스터(작은 모니터형 기계, 파스텔 그라데이션 화면)가 겹쳐 놓인다
  - ⚠️ `perspective()+rotateX()`로 진짜 3D 기울임을 시도했다가 폭 넓은 요소에서 대각선으로 깨지는 아티팩트가 생겨 포기 — 밝기 2단 구분(넓은 상판/얇은 옆면)만으로 입체감을 표현하는 쪽으로 정착
- `components/shop/CakeCounter.tsx` — 책상 상판 위 체크무늬 손수건(정사각형을 `clip-path`로 다이아몬드 모양으로 직접 그림 — `rotate` 대신 이 방식을 쓴 이유: 바닥 기준점 계산이 쉬움) + 케이크 받침대(상판+나팔 모양 기둥, 손수건의 가장 넓은 중간 높이에 겹쳐 배치). `box-shadow`는 `clip-path` 도형을 따라가지 않아 윤곽 그림자는 `drop-shadow`로 처리. 완성된 케이크가 있으면 받침대 위에 실제 입체 케이크(`CakeSnapshot`) + 주문 번호표
- `components/shop/CustomerSide.tsx` / `CustomerTable.tsx` / `SpeechBubble.tsx` — 테이블 3개, 각자 칸(1/3) 가로를 꽉 채우는 사각 테이블. 플레이어 쪽 책상과 눈높이가 완전히 같으면 어색해서 `mb-2`로 살짝 낮춤

### [x] ② 손님 등장 애니메이션 + 순차 주문 말풍선 + 주문서 확정 (cake-tycoon-prompt.md 3장)
- `hooks/useGameState.ts` — 마운트 시 빈 테이블 3개에 `FIRST_CUSTOMER_DELAY_MS`(0.5s) 후부터 `NEXT_CUSTOMER_GAP_MS`(1s) 간격으로 손님 배정, 배정 순간 `playBellSound()`. `handleCustomerTap(tableIndex)`가 waiting→ordering(순차 진행, `ORDER_STEP_DURATION_MS`=0.9s 간격)→order_confirmed 상태 전이를 관리. 확정된 손님을 다시 탭하면 `status`는 유지한 채 순차 표시만 재생(replay)
- `lib/sound.ts` — 종소리는 오디오 파일 없이 Web Audio API로 합성 (이미지 에셋 최소화 원칙을 오디오로 확장 적용)
- `lib/order.ts` — `Customer.order`를 순차 말풍선 단계 배열로 변환하는 `getOrderSteps()`
- `justArrivedIds`(`Set<string>`, 훅 상태)로 슬라이드업 등장 애니메이션 재생 여부를 판단
  - ⚠️ 처음엔 `key={customer.id}` div의 DOM 마운트 시점으로 애니메이션을 트리거했는데, `GameRoot`가 화면을 통째로 스위칭하는 구조라 제작 화면을 왕복할 때마다 `ShopScreen` 전체가 리마운트되면서 이미 있던 손님까지 매번 애니메이션이 재생되는 버그가 있었음 — DOM 마운트 대신 이 상태값으로 판단하도록 바꿔서 해결

### [x] ③~⑤ 제작 + 서빙 (최초 구현 후 "스테이션 구조"로 전면 개편됨 — 아래 참고)
- 최초엔 손님별 "만들기" 버튼 → 제작 화면에서 한 케이크를 끝까지 진행하는 구조였으나, 사용자 피드백("Papa's처럼 주문 받다가도 토핑하러 가고, 굽다가도 새로 만들러 가야 한다")으로 스테이션 구조로 바꿈
- 서빙(⑤)은 그대로 유지: `ShopScreen`에서 계산대 케이크 pointerdown → `setPointerCapture` → 손가락을 따라다니는 `fixed` 케이크 → pointerup 지점을 `document.elementsFromPoint`로 검사해 `data-table-index` 테이블 판별. 주문한 손님이면 서빙, 아니면 0.25초 스냅백(감점 없음). 계산대에는 완성 케이크 1개만(`+N` 대기 표시). Enter/Space 키보드 서빙(`click`의 `detail === 0`, 18장)
- `serveOrder`: 채점 → 돈 지급 → 결과 카드(`ServeResultCard`, Papa's "CAKE COMPLETE!") → 3초 먹기(`servedCakes`) → 퇴장(`leavingIds`) → 1초 후 `assignCustomer()`로 새 손님
- 채점 `lib/gameLogic.ts` `scoreServedCake()`: 정확도(시트/필링/크림/토핑 재료 + 문구) · 품질(반죽 양, 굽기, 필링 평균, 크림 평균) · 데코(40 + 그림 30 + 텍스트 30) · 속도(주문 확정부터, 150초 만점 / 360초 40점)의 단순 평균. 금액 `30 × 총점/100`, tip `총점/20`(누적만)

### [x] 스테이션 구조 (Papa's 방식, 사용자와 설계 합의 후 구현)
- 하단 `components/game/StationNav.tsx`: `🧾 주문 | 🥣 시트 | 🔥 오븐 | 🍦 필링·크림 | 🎨 토핑·데코` — **매장 포함 어느 화면에서든 항상 보이고 언제든 이동**. 탭마다 할 일 개수 배지, 오븐 탭은 칸별 진행 바 + 적정 구간(초록)/과열(빨강) 깜빡임
- 상단 `components/game/TopBar.tsx`(모든 화면 공통)는 DAY / 돈만. 주문서는 바 **아래 오른쪽** `components/game/OrderClipRail.tsx` — 식당 주방처럼 금속 봉에 집게로 집어 둔 작은 주문서(`#1` 번호만, 최대 3장). 누르면 아래로 영수증 모양 큰 주문서(재료 목록만, 진행 단계는 안 적음)가 펼쳐지고, 그 케이크가 있는 스테이션의 작업 대상으로도 선택됨 (`GameRoot.handleBillTap`)
- **지금 어느 주문 케이크를 작업 중인지 화면에 적지 않는다** (사용자 요청: 알려주면 너무 쉬워짐). 스테이션 좌상단엔 버리기 버튼만
- 주문은 손님 이름 대신 **번호(`#1`)**로 부른다. `GameState.nextOrderNumber` — 하루가 시작될 때 1로 리셋할 예정(DAY 진행 미구현). 번호는 `Customer.orderNumber`에도 저장해서 손님 머리 위에 떠날 때까지(먹는 중 포함) **항상** 띄운다. 확정 후엔 말풍선도 안 띄움
- 상태: `GameState.station`(현재 화면), `selectedOrderIds`(스테이션별 작업 중 주문), `ovenSlots`(2칸). `ActiveOrder.stage`는 케이크가 있는 스테이션(`base → oven → cream → decorate → ready`, **앞으로만**, 1장 2번). `lib/station.ts`의 `getSelectedOrder`는 고른 주문이 이미 넘어갔으면 대기열 첫 주문을 돌려줌
- 주문 확정 순간 `ActiveOrder`가 생성되어 시트 스테이션에 올라감 (`createdAt`도 이때부터 = 속도 점수 기준)
- ⚠️ 버그 수정 기록: `handleCustomerTap`이 `setState` 업데이터 **안에서** 타이머를 걸어서, 개발 모드 StrictMode의 업데이터 이중 실행 때문에 주문이 2개씩 생겼음. 부수 효과는 업데이터 밖으로, 업데이터는 상태 확인 후 멱등하게
- 케이크 버리기 `discardOrder` (`components/game/DiscardButton.tsx`, 인라인 "버리고 처음부터? 버리기/취소" 확인): 번호·주문 시각은 유지, 케이크만 초기화 후 시트 단계로. `ActiveOrder.attempt`를 올려 단계 컴포넌트 key를 바꿔 로컬 상태까지 초기화
- 모든 재료는 **먼저 고르고 → 넣는다** (재료가 늘어난다는 전제, 8장). `components/game/MaterialPicker.tsx`는 내부적으로 radiogroup이지만 잼 병(jar)/짤주머니(bag)/그릇(bowl) 모양으로 보여줌. 넣기 시작하면 재료 고정("다시 붓기/바르기"로 비워야 변경)
- 프레스&홀드(1장 4번) 공용 `hooks/useHoldLoop.ts`(rAF), 양 게이지 공용 `components/game/AmountGauge.tsx`(적정량 ±10% 초록 띠)

#### 스테이션별
- 시트 `stages/BaseSelectStage.tsx`: 반죽 재료 선택 → 틀을 누르고 있으면 반죽이 차오름(`BATTER_TARGET`=100, 초당 25). 반죽 양은 채점 + 입체 케이크 높이에 반영
- 오븐 `stages/OvenStage.tsx`: 대기 트레이 → 빈 칸에 넣기. `OVEN_DURATION_MS`=50초, 80~95%(40~47.5초) 만점, 120%부터 탐. 시트 색이 `getBakeFilter`로 실시간 변함(창백 → 노릇 → 까맘). 칸별 버리기 버튼
- 필링·크림 `stages/CreamStation.tsx`: 왼쪽 탭(`stages/StepTabsLayout.tsx`) 필링 → 크림, **필링을 끝내야 크림 탭이 열림**. 공용 `stages/SpreadStage.tsx`
  - 필링: 갈라진 시트 단면(`CakeInsideView`)에 짜서 바름, 목표 두께 고정(`FILLING_TARGET_THICKNESS`)
  - 크림: 입체 케이크 윗면 + **옆면(회전판)**. 옆면은 누르고 있으면 회전판이 돌며 정면 조각에 발림 — 딱 한 바퀴(3.5초)가 "보통" 양(`lib/frosting.ts` `SIDE_SEGMENTS`=24). 주문의 `creamAmount`(조금/보통/듬뿍, 손님 생성 시 무작위)가 목표. 크림 완료 시 케이크가 토핑·데코로 넘어감
  - 판정 `lib/frosting.ts`: 12x12 칸 두께 그리드에 가우시안으로 쌓음. 범위(목표 35% 이상 칸 비율) · 균일도(평균 절대 편차/평균) · 양(`scoreAmountMatch`, 20% 차이 = 70점). 크림은 윗면/옆면 평균 + 합계 양
  - 짜는 동안은 로컬 상태만 갱신하고 손을 뗄 때 주문에 저장. ⚠️ 크림 층을 SVG 원 100여 개 + 블러로 그렸더니 매 프레임 렌더링이 밀려 게이지가 "확" 차오르는 문제가 있어 `CreamCanvas`(canvas)로 교체
- 토핑·데코 `stages/DecorateStation.tsx`: 왼쪽 탭 토핑 → 데코, "토핑 완료"를 눌러야 데코가 열림
  - 토핑: 재료 선택 후 입체 케이크 윗면 탭(6x6 스냅), 다시 탭하면 뺌
  - 데코 `stages/DecorationStage.tsx`: 진입 시 `rotateX(55deg)→0` 카메라 전환(4장). 그리기(색 5, 굵기 3, 획 단위 지우개 `lib/decoration.ts`), 글자(인라인 입력, 크기/회전/색/글꼴/삭제, 드래그·방향키, `clampToCake`), 실행 취소/다시 실행(로컬 히스토리). "완성 🎉" → `ready` + 매장으로 이동

#### 케이크 렌더링 `components/game/cake/CakeRenderer.tsx` (16장 "데이터에서 다시 그리기")
- `CakeTopView`: 224px 평면(데코 단계, 자유 그림/텍스트 % 좌표계의 기준). `CakeInsideView`: 필링 단면. `Cake3D`: 윗면 타원(평면을 `scale(x, 0.42)`로 눕힘) + 원기둥 옆면(아래 타원 곡선, 필링 줄, 회전 반영 옆면 크림 그라데이션, 음영) + **토핑은 눕히지 않고 세워서** y순 정렬. `faceLayer`/`topOverlay`/`sideOverlay`로 입력 영역을 꽂음
- **데코 단계를 뺀 모든 케이크는 입체**(`Cake3D`) — 오븐, 토핑, 계산대, 드래그 중, 결과 카드, 테이블 위(`CakeSnapshot`은 `Cake3D` 래퍼). 예전에 평면을 `scale-y`로 눌러 서빙 케이크가 납작해 보이던 문제 해결
- 옆면 크림 회전판 받침(회색 타원)은 용도가 안 보인다는 피드백으로 제거 — 회전은 옆면 크림 무늬가 도는 것으로만 보인다
- 크림/필링이 "떼야 반영된다"는 제보(두 번): 상태·캔버스는 실시간 갱신되고 있었음(rAF를 MessageChannel로 흉내 내 확인). 원인은 표시 쪽 — ① 크림이 두께 0.45에서 불투명으로 포화돼 그 뒤로 짜도 모양이 안 변했고 ② 🍦 아이콘이 짜는 지점을 가려서, 떼는 순간 아이콘이 사라지며 크림이 "나타나는" 것처럼 보였음. → 두께에 따라 그림자/하이라이트가 계속 커지는 3단계 그리기(`creamPuff`), 짜는 위치는 점선 원 + 옆으로 비킨 작은 아이콘. 캔버스는 `useLayoutEffect`, rAF dt 음수 방지
- **짜는 세기**(살살 0.6 / 보통 1 / 꾹 1.5배): 같은 속도로 전체를 훑었을 때 두께가 달라진다. "조금" 주문을 바르다 마는 식이 아니라 세기로 양을 맞추게 하려는 것 (사용자 요청)
- 검증: tsc/eslint 통과. 백그라운드 탭에서 rAF를 MessageChannel로 흉내 내(`window.requestAnimationFrame` 덮어쓰기) 주문→붓기→오븐 42초→필링→크림 윗면·옆면→토핑→데코 완성→드래그 서빙→결과 카드까지 전체 흐름 확인, 콘솔 에러 없음. **스크린샷 기반 육안 확인은 아직 못 함**(탭 hidden). 한 스크립트가 45초를 넘으면 CDP가 타임아웃되지만 스크립트는 뒤에서 계속 돈다는 점 주의

### 기타 참고
- 백그라운드 탭에서는 브라우저가 CSS transition을 그리지 않아 데코 단계 카메라 전환이 스크린샷에 기울어진 채로 찍힐 수 있음 — 실제 transform 값은 정상
- ⚠️ 브라우저 자동화 주의: 탭이 hidden이면 rAF가 아예 멈추고(붓기/짜기 불가) 타이머도 몰아서 실행되며 스크린샷/CDP가 타임아웃난다. Claude가 연 탭이 별도 창/그룹에 있어 hidden인 경우가 많으니, 사용자에게 **"케이크 타이쿤" 탭을 앞으로** 가져와 달라고 요청할 것
- 셸: 이 컴퓨터엔 Python이 없다(`python`은 스토어 스텁). 일부 파일이 CRLF라 문자열 치환 스크립트는 줄바꿈을 정규화해서 처리할 것

## 다음 할 일
- **육안 확인** (최우선, Chrome 탭을 앞에 둔 상태): 크림/필링이 누르는 동안 눈에 보이게 쌓이는지(사용자 피드백 대기), 입체 케이크 모양(계산대·드래그·결과 카드·테이블 위), 재료 병 모양, 주문서 레일/펼침 위치가 콘텐츠를 가리는지, 좁은 가로 화면에서 세로 공간 부족 여부
- 데코 도구 브라우저 실동작 확인 (그리기/지우개/글자 조작/실행 취소)
- 실제 플레이 밸런스 조정 (반죽 속도, 오븐 50초, 크림 흐름 16/초, 회전판 3.5초, 속도 기준 150/360초, 가격 $30 등 전부 임시값). 한 케이크에 단계가 6개라 플레이가 길어졌을 수 있음
- DAY 진행(하루 종료 조건)은 미구현 — 규칙을 사용자에게 받아야 함 (주문 번호 리셋도 여기에 연결)
- 손님 인내심 게이지(1장 6번)는 17장 Phase 1 목록에 없어서 미구현 (`Customer.patience` 필드만 있음)

**Phase 1 범위 상기**: 섹션 17 참고. 손님 다양화/커스텀 재료 UI/테마 선택 UI/캐릭터 커스터마이징/재료 해금/장비 업그레이드/팁 시스템/랭크업 연출 등은 Phase 1에서 제외.
