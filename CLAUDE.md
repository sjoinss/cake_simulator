@AGENTS.md

# 케이크 타이쿤 프로젝트 현황

## 기획 문서
- `cake-tycoon-prompt.md` — **기준 기획서**. 항상 이 문서를 따른다.
- `plan.md` — 최초 아이디어 초안. 참고만 하고 실제 작업 기준으로 쓰지 않는다.

## 기술 스택
- Next.js (App Router) + TypeScript + Tailwind CSS
- 이 컴퓨터에는 Node.js가 기본 PATH에 없다. PowerShell에서 `node`/`npm`/`npx`를 쓰려면 매 명령 앞에
  `$env:Path += ";C:\Program Files\nodejs";` 를 붙여야 한다 (셸 상태가 명령마다 초기화됨).

## 웹 공개 (GitHub Pages)
- 주소: https://sjoinss.github.io/cake_simulator/ — **master에 푸시하면 자동 배포**(`.github/workflows/deploy.yml`: `npm ci` → `npm run build` → `out/`을 Pages에 올림). 저장소는 이걸 위해 공개로 전환함(사용자 결정)
- `next.config.ts`: `output: "export"`(서버 없이 정적 사이트), `trailingSlash`, `images.unoptimized`. 하위 경로는 워크플로가 `PAGES_BASE_PATH=/cake_simulator`로 넣어줄 때만 적용 — 로컬 `npm run dev`는 루트(/) 그대로
- public/ 파일을 `<img>`/CSS url로 직접 쓸 땐 `lib/assets.ts`의 `withBasePath()`를 거칠 것 (하위 경로가 자동으로 안 붙음)
- 서버 기능(API 라우트, 서버 액션 등)은 정적 내보내기라 쓸 수 없다

## 진행 상황 (Phase 1 MVP, cake-tycoon-prompt.md 19장 순서 기준)

### [x] 기반 구조 + 전체 UI 톤
- `lib/gameState.ts` — `Material`, `MaterialRegistry`, `Customer`, `CakeData`, `CakeJob`, `GameState` 등 전체 타입 + `createInitialGameState()`
- `lib/materials.ts` — 재료 레지스트리 (기본 + 커스텀, 아래 "재료 늘리기" 참고)
- `lib/customer.ts` — `createCustomer()`: 이름 없는 손님 + 선반 재료로 무작위 주문
- 테마: `app/globals.css`의 `--theme-*` 변수 세트 (아래 "테마 선택" 참고). 기본 pink는 비비드 핑크가 아니라 채도를 낮춘 파스텔 코랄톤
- 큰 PC 화면(`min-width: 1400px` **그리고** `min-height: 800px`)에서만 `.game-root`를 20:9 프레임(최대 1600px, 92vw)으로 중앙에 띄우고 나머지는 은은한 radial-gradient 비네트로 덮는다 (플래시 게임 창 느낌). 그보다 작은 화면(태블릿, 작은 창, 폰)은 전체화면 — 예전엔 901px부터 프레임을 띄워 태블릿 크기에서 게임이 작아지고 주변만 비어 보였다(사용자 피드백). 프레임 그림자는 오프셋 없이 blur만 줘서 사방에 고르게 퍼지게 함
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
- 서빙(⑤)은 그대로 유지: `ShopScreen`에서 계산대 케이크 pointerdown → `setPointerCapture` → 손가락을 따라다니는 `fixed` 케이크 → pointerup 지점을 `document.elementsFromPoint`로 검사해 `data-table-index` 테이블 판별. 주문을 받은(order_confirmed) 손님이면 **누구에게든** 서빙, 아니면 0.25초 스냅백(감점 없음). 끄는 동안 받을 수 있는 테이블엔 점선, 올려둔 테이블엔 "이 손님에게 주기". 계산대에는 완성 케이크 1개만(`+N` 대기 표시) + 🗑️ 버리기(줄 손님이 없으면 버린다). Enter/Space 키보드 서빙은 가장 먼저 주문한 손님에게(`click`의 `detail === 0`, 18장)
- `serveCake(jobId, tableIndex)`: 채점 → 돈 지급 → 결과 카드(`ServeResultCard`, Papa's "CAKE COMPLETE!") → 3초 먹기(`servedCakes`) → 퇴장(`leavingIds`) → 1초 후 `assignCustomer()`로 새 손님
- 채점 `lib/scoring.ts` `scoreServedCake()` — **서빙받은 손님의 주문 기준으로 서빙 순간에 계산**: 정확도(시트/필링/크림/토핑 재료) · 품질(반죽 양, 굽기, 필링 범위·균일도·양, 크림 범위·균일도·양 — 크림 양은 그 손님 creamAmount 기준) · 속도(`Customer.orderedAt` 주문 확정 ~ 서빙, 150초 만점 / 360초 40점)의 단순 평균. 금액 `30 × 총점/100`. **데코는 점수에 안 들어감**(사용자 결정: 데코는 재미용) — 그림 2획 이상 또는 글자가 있으면 데코 팁 $3이 돈에 더해지고(결과 카드에 "데코 팁 +$3") `player.tipTotal`에도 쌓임. 주문 문구(message)는 없앰(길면 안 예쁨)

### [x] 스테이션 구조 (Papa's 방식, 사용자와 설계 합의 후 구현)
- 하단 `components/game/StationNav.tsx`: `🧾 주문 | 🥣 시트 | 🔥 오븐 | 🍦 필링·크림 | 🎨 토핑·데코` — **매장 포함 어느 화면에서든 항상 보이고 언제든 이동**. 탭마다 할 일 개수 배지, 오븐 탭은 칸별 진행 바 + 적정 구간(초록)/과열(빨강) 깜빡임
- 상단 `components/game/TopBar.tsx`(모든 화면 공통)는 DAY / 돈만. 주문서는 바 **아래 오른쪽** `components/game/OrderClipRail.tsx` — 식당 주방처럼 금속 봉에 집게로 집어 둔 작은 주문서(`#1` 번호만, 최대 3장). 누르면 아래로 영수증 모양 큰 주문서(재료 목록만, 진행 단계는 안 적음)가 펼쳐진다. 주문서 = 주문을 받고 아직 케이크를 못 받은 손님(`status === "order_confirmed"`)
- **지금 어느 주문 케이크를 작업 중인지 화면에 적지 않는다** (사용자 요청: 알려주면 너무 쉬워짐). 스테이션 좌상단엔 버리기 버튼만
- 주문은 손님 이름 대신 **번호(`#1`)**로 부른다. `GameState.nextOrderNumber` — 하루가 시작될 때 1로 리셋. 번호는 `Customer.orderNumber`에도 저장해서 손님 머리 위에 떠날 때까지(먹는 중 포함) **항상** 띄운다. 확정 후엔 말풍선도 안 띄움
- **케이크는 주문과 묶여 있지 않다** (사용자 결정: "미리 만들어 놨는데 필요 없으면 버릴 수밖에. 카운터까지 갔는데 주문한 사람이 없으면 버리는 거지"). `GameState.cakes: CakeJob[]` — 주방에서 만드는 중인 케이크. 주문은 손님 쪽(`Customer.orderNumber`/`orderedAt`/`order`)에만 있다
  - 시트 스테이션엔 **항상 빈 틀이 하나** 놓여 있다(`lib/cake.ts` `withBaseCake`) — 주문 없이도 미리 만들 수 있다. 오븐으로 보내거나 버리면 새 틀이 놓인다. 주방 케이크 수 상한 `MAX_KITCHEN_CAKES`(5)에 차면 안 놓임
  - 필링/크림 점수는 저장하지 않고 서빙 때 계산. 크림 게이지는 목표 하나 대신 조금/보통/듬뿍 **눈금 셋**(`AmountGauge`의 `marks`) — 주문서를 보고 맞춘다
  - 한 스테이션에 케이크가 여러 개면 왼쪽 아래(버리기 옆)에 작은 케이크 목록이 떠서 눌러 바꾼다(`selectCake`). 번호 없이 모양으로만 구분
- 상태: `GameState.station`(현재 화면), `selectedCakeIds`(스테이션별 작업 중 케이크), `ovenSlots`(2칸, jobId). `CakeJob.stage`는 케이크가 있는 스테이션(`base → oven → cream → decorate → ready`, **앞으로만**, 1장 2번). `lib/station.ts`의 `getSelectedCake`는 고른 케이크가 이미 넘어갔으면 대기 중 첫 케이크를 돌려줌
- ⚠️ 버그 수정 기록: `handleCustomerTap`이 `setState` 업데이터 **안에서** 타이머를 걸어서, 개발 모드 StrictMode의 업데이터 이중 실행 때문에 주문이 2개씩 생겼음. 부수 효과는 업데이터 밖으로, 업데이터는 상태 확인 후 멱등하게
- 케이크 버리기 `discardCake` (`components/game/DiscardButton.tsx`, 인라인 확인): 케이크를 주방에서 없앤다(오븐 칸도 비움). 스테이션 작업 중, 오븐 칸, 계산대에서 버릴 수 있다
- 모든 재료는 **먼저 고르고 → 넣는다** (재료가 늘어난다는 전제, 8장). `components/game/MaterialPicker.tsx`는 내부적으로 radiogroup이지만 잼 병(jar)/짤주머니(bag)/그릇(bowl) 모양으로 보여줌. 넣기 시작하면 재료 고정("다시 붓기/바르기"로 비워야 변경)
- 프레스&홀드(1장 4번) 공용 `hooks/useHoldLoop.ts`(rAF), 양 게이지 공용 `components/game/AmountGauge.tsx`(적정량 ±10% 초록 띠)

#### 스테이션별
- 시트 `stages/BaseSelectStage.tsx`: 반죽 재료 선택 → 틀을 누르고 있으면 반죽이 차오름(`BATTER_TARGET`=100, 초당 25). 반죽 양은 채점 + 입체 케이크 높이에 반영
- 오븐 `stages/OvenStage.tsx`: 위쪽(벽)에 오븐 칸, 아래 조리대 위에 반죽을 부은 틀(`cake/BatterTin.tsx`, 반죽 재료 색 + 부은 양만큼 차 있음)이 **가로로 늘어서 있고**(패널 없음, 폭이 모자라면 가로 스크롤 — 틀은 `touch-action: pan-x`라 옆으로 밀면 스크롤, 위로 끌면 드래그), **빈 오븐 칸으로 끌어다 넣는다** (계산대 서빙과 같은 pointer capture + `elementsFromPoint`로 `data-oven-slot` 판별, 빈 칸 점선 표시, 잘못 놓으면 0.25초 스냅백, 키보드 Enter/Space는 첫 빈 칸). 오븐 칸 라벨엔 주문 번호를 적지 않는다(사용자 요청). `OVEN_DURATION_MS`=50초, 80~95%(40~47.5초) 만점, 120%부터 탐. 시트 색이 `getBakeFilter`로 실시간 변함(창백 → 노릇 → 까맘). 칸별 버리기 버튼
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

### [x] 폰 가로 화면 대응 + 작업 공간 분위기 (사용자 결정: 폰 가로가 주 타깃, "작은 화면 전용 배치" 방식)
- `app/globals.css`의 `@custom-variant short (@media (max-height: 480px))` — `short:` 접두사로 상단 바(h-9)/하단 탭(h-8)/주문서 레일/선반/버튼/결과 카드를 촘촘하게. CSS로 안 되는 px 값(오븐·결과 카드 속 케이크 크기)은 `hooks/useIsShort.ts`
- 케이크 크기는 고정 224px이 아니라 남은 공간을 재서 정한다: `components/game/FitBox.tsx`(ResizeObserver, 기본 아래 정렬 — 조리대 위에 놓인 느낌) + `Scaled`(224px로 디자인된 반죽 틀/필링 단면/데코 케이크를 비율 축소. 포인터는 getBoundingClientRect 기준이라 그대로 맞음). ⚠️ FitBox는 `self-stretch`가 없으면 가로 줄 안에서 자기 내용 높이로 줄어 케이크가 작게 굳는다
- 스테이션 공통 배치 `components/game/stages/layout.ts`: 위쪽 벽에 재료 선반, 아래 줄에 [작업 대상 | 게이지 | 버튼] — 줄은 `items-end`로 바닥선을 맞춰 모두 조리대 위에 놓인 것처럼.
- **작업할 케이크가 없는 스테이션**도 빈 안내 문구 대신 세팅된 작업대를 보여준다 (`stages/IdleStation.tsx`): 각 단계 컴포넌트의 `idle` 모드 + `lib/cake.ts`의 `createPlaceholderOrder()`. 선반은 흐리게 하지 않고(`MaterialPicker`의 `inactive`) 조작만 막고, 케이크 자리엔 빈 케이크 받침(`cake/CakeBoard.tsx`) 짧은 화면에선 안내 문구 숨김. 버리기 버튼은 왼쪽 아래 구석(세로 공간 절약)
- 재료 선반 `MaterialPicker`: 나무 선반 판자 위에 병/짤주머니/그릇이 놓이고, 고른 재료는 **선반에서 떠오르고 그림자가 작아지는** 것으로만 표시 (선택 테두리 없음, 사용자 요청). 이름표는 선반 아래(짧은 화면에선 숨김, title/aria-label은 유지)
- 작업 공간 배경 `components/game/StationBackdrop.tsx`: 파스텔 타일 벽 + 매장 계산대와 같은 톤의 나무 조리대
- **이미지 자리**: `lib/assets.ts`의 `STATION_BACKGROUNDS`(스테이션별 배경 경로, null이면 CSS 배경), `Material.image`(재료 그림 경로, 없으면 CSS 병/그릇 + 이모지). 파일은 `public/images/...`
- 매장: 짧은 화면에선 요리사를 줄이고 오른쪽으로 비켜 받침대 위 케이크와 안 겹치게, 받침대는 0.8배
- 크림/필링: 한 칸이 `MAX_STACK`(1.8)을 넘으면 더 얇은 옆 칸으로 흘러 퍼진다(`lib/frosting.ts` `spreadOverflow`) — **사용자가 여러 번 제보한 "떼야 반영됨"의 진짜 원인**은 제자리에서 누르면 그 칸만 무한히 두꺼워지고 그림은 이미 포화돼 모양이 안 변하던 것. 하이라이트는 물방울무늬 격자처럼 보여서 부드러운 radial glow로
- 구운 색: CSS filter(sepia) 대신 `getBakedColor`로 색을 직접 섞음 (필터는 밝은 반죽을 연두빛으로 만들었음)
- 검증: 페이지 안에 667x375 iframe을 띄워(창 리사이즈가 안 먹어서) 짧은 화면 모드로 시트→오븐→필링→크림(윗면·옆면)→토핑→데코→계산대→서빙→결과 카드까지 스크린샷으로 확인

### [x] 매장 화면 꾸미기 (스테이션과 퀄리티 맞추기, 사용자가 디자인 재량을 맡김)
- 콘셉트: 작은 파스텔 빵집 카페. 눈에 띄는 요소는 **계산대 위 코랄·흰 줄무늬 물결 차양 하나**(`PlayerSide`), 나머지는 조용하게
- 계산대 쪽: 스테이션과 같은 타일 벽 + 같은 나무 톤 계산대(상판 #e7c3a0, 널빤지 앞판) + 뒤쪽 벽 선반(장식 병, 🌿, ☕)
  - 주인 캐릭터는 왼쪽(24%)에 서 있고, 바로 앞 계산대 상판 위에 CSS 레트로 금전등록기(`CashRegister`). 오른쪽(68%)엔 넓은 케이크 받침대 + 큰 케이크(92px, 폰 68px)
  - 주인 캐릭터 자리(144x240, 폰 96x152, 아래쪽은 계산대 뒤로 가려짐): **그림 파일을 끌어다 놓거나 눌러서 고르면 바뀌고**, 오른쪽 위 X로 기본 그림으로 돌아간다. 기본 그림은 `lib/assets.ts`의 `DEFAULT_OWNER_IMAGE`(사용자가 나중에 줄 예정, 지금 null → 반투명 점선 네모). (🧑‍🍳 이모지는 Windows에서 얼굴+프라이팬으로 쪼개져 보여서 뺐다)
  - 차양 아래 매달린 간판(`ShopSign`): 기본 "케이크 가게", ✏️를 누르면 입력 → ✔로 확정(Enter도 확정, Esc 취소). 이름은 localStorage(`cake-tycoon.shopName`)
- **가게 꾸미기 창**(`components/game/DecorSettings.tsx`, 상단 바 "🎨 가게 꾸미기"): 주인 그림 + 손님 모습 최대 6종류 × (평소/먹는 중). 사용자에게 제안해서 정한 위치 — 나중에 배경·재료 그림도 여기로 모을 수 있다
  - 그림은 IndexedDB(`lib/imageStore.ts`, DB `cake-tycoon`)에 Blob으로 저장, `components/game/CustomImages.tsx`(Context)가 불러와 object URL로 나눠준다. 공용 칸 `ImageDropZone`(끌어다 놓기 + 눌러서 파일 고르기 + X)
  - 손님은 생성 때 `Customer.look`(0~5)을 받고, 평소 모습이 채워진 칸들 중 `look % 채워진 수`번째 그림을 쓴다. 먹는 중 그림이 없으면 평소 그림, 아무 칸도 없으면 이모지
  - 브라우저 테스트 후엔 테스트 그림/이름을 지워 둘 것 (`indexedDB.deleteDatabase('cake-tycoon')`, localStorage `cake-tycoon.shopName`)
  - 체크무늬 천은 정사각형을 `scaleY(0.36) rotate(45deg)`로 눕혀 계산대 상판과 원근을 맞춤(체크까지 같이 눕는다). 받침대 발이 천 한가운데
- 홀(`CustomerSide`의 `DiningRoom`): 은은한 세로 줄무늬 벽지, 가운데 아치형 창문 하나, 웨인스코팅 벽 패널, 나무 바닥
- 테이블(`CustomerTable`): 흰 대리석 원형 카페 테이블(상판 + 가는 다리 + 받침) + 손님 뒤 나무 의자 등받이 — 손님이 앉아 있는 것처럼. 드롭 점선은 상판에
  - 손님은 고정 크기 상자(64x64, 폰 48x48) 안에 그린다 — 이미지로 바꿔도 위의 주문 번호 이름표(꼬리 달린 흰 알약, 상자 위 14px)와의 간격이 그대로 맞게
- 계산대/홀 사이 구분은 그라데이션 홈 대신 벽 기둥

### [x] 하루(DAY) 진행 (사용자 결정: 손님 10명 받으면 끝)
- `CUSTOMERS_PER_DAY`(10). `GameState.today`(온 손님/서빙 수/번 돈/총점 합). 오늘 손님을 10명 받으면 더 안 오고, 10명 다 서빙 + 테이블이 모두 비면 `isDayOver` → `DayEndCard`(손님 수, 번 돈, 평균 점수). 마지막 손님 결과 카드를 닫은 뒤에 뜬다
- `startNextDay`: DAY+1, 오늘 기록·주문 번호(#1) 초기화, 주방 케이크·오븐 정리(가게 문 닫음) 후 새 틀 + 손님 재배정. 상단 바에 "손님 n/10"
- 손님 배정은 예약 타이머에서 최신 상태를 봐야 해서 `stateRef`로 읽는다
- 브라우저 확인(저장 데이터를 "9명 서빙, 마지막 손님 #10 주문 대기, 계산대에 그림 2획 케이크" 상태로 만들어 시작): 결과 카드 "#10 주문"·점수 3줄·"+ $30 데코 팁 +$3", 돈 $230→$263 / 10명 뒤 새 손님 안 옴 / 손님 퇴장 후 결산 카드(10명, $263, 평균 88%) / "DAY 2 시작" → DAY 2, 손님 3명 새로 오고 첫 주문 #1
  - 테스트 팁: 새로고침하면 게임이 `pagehide` 때 자기 상태를 저장해 localStorage에 넣은 값을 덮어쓴다 → `window.addEventListener('pagehide', () => localStorage.setItem(...))`를 걸고(게임 리스너보다 나중이라 마지막에 실행) `location.reload()`. 계산대 케이크 버튼 `.click()`(detail 0)은 키보드 서빙이라 드래그 없이 서빙된다
- **인내심 게이지는 만들지 않는다** (사용자 결정): 늦어도 손님이 떠나지 않고 속도 점수로 돈만 깎이는 지금 방식 유지. `Customer.patience` 필드만 남아 있음

### [x] 저장 (15장, Phase 2 순서 1번)
- `lib/save.ts`: `GameState` 전체를 localStorage(`cake-tycoon.save`, 버전 1)에 저장. 상태가 바뀌면 0.4초 모았다가 저장 + `pagehide` 때 즉시 저장. 불러올 때 빠진 필드는 기본값으로 채움
- 불러올 때 정리: 주문 말하던 손님(`ordering`) → `waiting`, 먹고 나가던 손님(`served`) → 자리 비움(이미 돈 냄), 화면은 매장부터. 빈자리엔 오늘 손님 수 안에서 새 손님. 오븐은 실제 시간 기준이라 오래 비우면 탄다
- 서버 렌더링과 저장 상태가 어긋나지 않게 `GameRoot`는 `ClientOnly`로 브라우저에서만 그린다
- "가게 꾸미기" 창 아래 **진행 초기화**(확인 한 번 더): 저장 삭제 + DAY 1부터. 꾸미기 그림·가게 이름은 유지. `resetProgress`는 예약 타이머도 모두 멈춘다
- Phase 2 진행 순서(사용자 결정): 저장 → 재료 늘리기 + 커스텀 재료 → 테마 선택. 계산대 케이크 여러 개 보관은 **안 함**(주문에 없는 케이크는 버리는 게 규칙), 캐릭터 꾸미기는 나중으로 보류

### [x] 재료 늘리기 + 커스텀 재료 (8장, Phase 2 순서 2번)
- `lib/materials.ts`: 기본 재료 카테고리별 4개(시트 바닐라/초코/말차/딸기, 필링 딸기잼/초코 가나슈/커스터드/레몬커드, 크림 바닐라/초코/딸기/말차, 토핑 딸기/체리/초코칩/키위). 이모지는 윈도우 10에서 보이는 것만
- 커스텀 재료는 localStorage(`cake-tycoon.customMaterials`)에 저장, 기본 재료 뒤에 붙인 레지스트리를 `getMaterialRegistry()`로 제공(바뀌면 새 객체). 화면은 `hooks/useMaterialRegistry.ts`(useSyncExternalStore)로 구독해 선반·주문서가 바로 바뀐다. 훅 콜백/비컴포넌트 코드는 `getMaterialRegistry()` 직접 호출
- 지운 커스텀 재료는 `retired: true`로 남긴다(이미 받은 주문/만들던 케이크가 가리킬 수 있어서). 선반·새 주문은 `getUnlockedMaterials`가 retired 제외
- 만드는 곳: "가게 꾸미기" 창의 **그림 | 재료** 탭 중 재료 탭(`components/game/MaterialMaker.tsx`) — 종류(시트/필링/크림/토핑), 이름(10자), 색, 이모지(추천 16개 또는 직접 입력, 첫 글자만), 선반 미리보기, 내가 만든 재료 목록(✕로 지우기)
- 손님 주문은 선반 재료(기본+커스텀)에서 무작위 조합(`createCustomer(tableIndex, registry, rank)`). **손님 이름은 없음**(사용자 결정) — 손님은 주문 번호 #N로만 구분, 결과 카드도 "#N 주문"
- 선반이 화면보다 넓어지면 옆으로 밀어서 본다(`MaterialPicker` 바깥 가로 스크롤, 떠오른 재료가 안 잘리게 py-3/-my-3)
- 브라우저 확인: 재료 탭에서 만들기 → 필링 선반에 5번째 병으로 즉시 등장, 초기화 후 새 손님 주문이 무작위(이름·문구 없음), 콘솔 에러 없음. 데코 팁도 서빙까지 확인함(아래 DAY 진행 참고)

### [x] 테마 선택 (10장, Phase 2 순서 3번)
- `app/globals.css`: 7개 파스텔 테마(pink/red/orange/yellow/sky/blue/purple) — 테마마다 기본 5색(`--theme-primary/secondary/background/accent/text`)만 정한다. 매장·작업대 배경색은 `:root`에서 이 5색을 `color-mix`로 섞은 파생 변수: `--theme-wall`(타일 벽), `--theme-wallpaper`/`-stripe`(홀 벽지), `--theme-wainscot`(홀 벽 패널), `--theme-pillar-edge`(가운데 기둥), `--theme-cloth`(계산대 체크 천). 차양은 accent
- 테마에 따라 바뀌지 않는 색(나무 조리대·바닥, 흰 대리석 테이블, 금속, 오븐, 금전등록기 크림색)은 하드코딩 그대로 둔다. **새 화면에 테마색이 들어갈 땐 hex 대신 위 변수를 쓸 것**
- `lib/theme.ts`: 선택은 localStorage(`cake-tycoon.theme`) — 가게 이름·꾸미기 그림처럼 **진행 초기화와 무관**. 모듈 로드 때 `<html data-theme>`을 바로 바꾼다(서버는 pink로 그려서 `app/layout.tsx`의 `<html>`에 `suppressHydrationWarning`). `GameState.player.theme` 필드는 기획서 데이터 구조대로 남아 있지만 쓰지 않는다
- UI: "가게 꾸미기" 창의 **그림 | 재료 | 테마** 탭 중 테마(`components/game/ThemePicker.tsx`) — 차양처럼 줄무늬 동그라미 7개, 누르면 바로 적용
- 브라우저 확인: 스카이/옐로에서 매장(차양·벽·천·벽지·패널·탭)과 필링·크림 작업대 색이 함께 바뀜, 새로고침 후 유지, 콘솔 에러 없음, `next build` 통과

### [x] 앱으로 설치 (PWA, 사용자 요청: 폰 홈 화면에 앱으로, 상태 표시줄 없이 전체 화면)
- `app/manifest.ts` → 빌드 때 `manifest.webmanifest`: `display: "fullscreen"`(안드로이드는 상태 표시줄·주소창 없이), `orientation: "landscape"`. 매니페스트 안 경로엔 basePath가 안 붙어서 `PAGES_BASE_PATH`를 직접 붙인다 (`app/layout.tsx` 아이콘 경로도 마찬가지)
- iOS는 fullscreen을 지원 안 함 → `appleWebApp`(capable + black-translucent) 메타. 가로 화면에선 iOS도 상태 표시줄이 안 보인다. iOS는 설치 버튼이 없어 사파리 공유 → "홈 화면에 추가"로만 설치
- 아이콘 `public/icons/*.png`는 `node scripts/make-icons.mjs`가 코드로 그린다(그림 도구 없음). 디자인을 바꾸면 스크립트를 고쳐 다시 돌리고 PNG를 커밋
- `public/sw.js`: 네트워크 우선 + 실패 시 캐시(오프라인에서도 한 번 연 게임은 켜짐). 등록은 `hooks/useInstallPrompt.ts`에서 배포본만(개발 서버 제외)
- 상단 바 "📲 앱 설치" 버튼: 크롬이 `beforeinstallprompt`를 줄 때만 보인다(이미 설치했거나 iOS면 안 보임)
- 카메라 홀(노치)까지 전체 화면: `viewportFit: "cover"` + `globals.css`의 `--safe-l/-r/-b`(env(safe-area-inset-*)). 배경은 홀 밑까지 깔고, 상단 바·하단 탭·주문서 레일·홀 테이블·주인/금전등록기·스테이션 작업 영역과 버리기 버튼만 그만큼 안쪽으로 민다. **가장자리에 새 조작 요소를 둘 땐 이 변수를 더할 것**

### 기타 참고
- 백그라운드 탭에서는 브라우저가 CSS transition을 그리지 않아 데코 단계 카메라 전환이 스크린샷에 기울어진 채로 찍힐 수 있음 — 실제 transform 값은 정상
- 브라우저 자동화: hidden 탭에서 rAF를 흉내 낼 땐 **누르고 있는 동안만** 가짜 rAF를 켤 것(`window.__fake` 플래그). 항상 켜두면 다른 rAF 루프까지 MessageChannel로 계속 돌아 스크린샷 캡처가 타임아웃난다. 캔버스가 있는 화면은 캡처가 가끔 30초 타임아웃 — 한 번 더 시도하면 대개 된다
- ⚠️ 브라우저 자동화 주의: 탭이 hidden이면 rAF가 아예 멈추고(붓기/짜기 불가) 타이머도 몰아서 실행되며 스크린샷/CDP가 타임아웃난다. Claude가 연 탭이 별도 창/그룹에 있어 hidden인 경우가 많으니, 사용자에게 **"케이크 타이쿤" 탭을 앞으로** 가져와 달라고 요청할 것
- 셸: 이 컴퓨터엔 Python이 없다(`python`은 스토어 스텁). 일부 파일이 CRLF라 문자열 치환 스크립트는 줄바꿈을 정규화해서 처리할 것

## 다음 할 일
- 실제 폰(터치)에서 조작감 확인: 누르고 있기(붓기/짜기), 드래그 서빙, 오븐 틀 드래그(가로 스크롤과 충돌 없는지), 선반 탭. 배포 주소로 폰에서 바로 열어볼 수 있다
- 기본 주인 이미지(사용자가 줄 예정) → `public/images/`에 넣고 `DEFAULT_OWNER_IMAGE` 경로 지정
- 아직 실제로 눌러보지 않은 것: 계산대 🗑️ 버리기, 한 스테이션에 케이크 여러 개일 때 고르기 목록
- 데코 도구 브라우저 실동작 확인 (그리기/지우개/글자 조작/실행 취소)
- 실제 플레이 밸런스 조정 (반죽 속도, 오븐 50초, 크림 흐름 16/초, 회전판 3.5초, 속도 기준 150/360초, 가격 $30 등 전부 임시값). 한 케이크에 단계가 6개라 플레이가 길어졌을 수 있음
- Phase 2 순서(저장 → 재료 → 테마)는 끝남. 다음 할 일은 사용자와 상의

**Phase 1 범위 상기**: 섹션 17 참고. 손님 다양화/커스텀 재료 UI/테마 선택 UI/캐릭터 커스터마이징/재료 해금/장비 업그레이드/팁 시스템/랭크업 연출 등은 Phase 1에서 제외.
