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
- `components/game/HUD.tsx` — DAY/money를 아이콘(📅/💰) + 흰 반투명 pill 배지로 표시
- `components/shop/SpeechBubble.tsx` — 얇은 테두리 + 은은한 그림자로 카드 느낌
- 캐릭터/손님 발밑에 흐린 타원 그림자로 바닥에 붙어있는 느낌, 탭 시 `active:scale-*`로 눌리는 피드백
- **캐릭터/손님/테이블은 전부 이모지·CSS 도형 placeholder** — 나중에 실제 이미지 에셋이 생기면 교체 예정 (Phase 1은 기획서 7장 "이미지 에셋 최소화" 원칙에 맞춰 CSS로 최대한 다듬어두는 것으로 진행)

### [x] ① 매장 화면 뼈대 (좌/우 분할, 정적 배치)
- `components/game/GameRoot.tsx` — 최상위 클라이언트 컴포넌트. `useGameState()`를 여기서만 호출하고 `state.screen`에 따라 `ShopScreen`/`CraftingScreen`에 훅 결과 전체(`gameState` prop)를 넘긴다. `app/page.tsx`는 `GameRoot`만 렌더링
- `components/shop/ShopScreen.tsx` — 좌(`basis-2/5`)/우(`basis-3/5`) 분할. 손님 쪽 공간을 더 넓게 확보
- `components/shop/PlayerSide.tsx` — 캐릭터 + 계산대(책상). 책상은 가로를 꽉 채우고 세로 최소 1/4(`h-1/4 min-h-24`)을 차지하며, **넓은 흰색 상판(70%, 위에서 내려다보는 면) + 얇은 테마색 옆면(30%)** 2단 구성 (Good Pizza, Great Pizza류 캐주얼 타이쿤 게임 참고 — 상판 비율이 커야 "위에서 내려다보는 테이블"처럼 보인다). 상판 위에 `CakeCounter`와 크림색 몸체의 캐시 레지스터(작은 모니터형 기계, 파스텔 그라데이션 화면)가 겹쳐 놓인다
  - ⚠️ `perspective()+rotateX()`로 진짜 3D 기울임을 시도했다가 폭 넓은 요소에서 대각선으로 깨지는 아티팩트가 생겨 포기 — 밝기 2단 구분(넓은 상판/얇은 옆면)만으로 입체감을 표현하는 쪽으로 정착
- `components/shop/CakeCounter.tsx` — 책상 상판 위 체크무늬 손수건(정사각형을 `clip-path`로 다이아몬드 모양으로 직접 그림 — `rotate` 대신 이 방식을 쓴 이유: 바닥 기준점 계산이 쉬움) + 케이크 받침대(상판+나팔 모양 기둥, 손수건의 가장 넓은 중간 높이에 겹쳐 배치). `box-shadow`는 `clip-path` 도형을 따라가지 않아 윤곽 그림자는 `drop-shadow`로 처리. 완성된 케이크(`cake` prop)가 있으면 🎂로 표시 (현재 항상 `cake={null}`)
- `components/shop/CustomerSide.tsx` / `CustomerTable.tsx` / `SpeechBubble.tsx` — 테이블 3개, 각자 칸(1/3) 가로를 꽉 채우는 사각 테이블. 플레이어 쪽 책상과 눈높이가 완전히 같으면 어색해서 `mb-2`로 살짝 낮춤

### [x] ② 손님 등장 애니메이션 + 순차 주문 말풍선 + 주문서 확정 (cake-tycoon-prompt.md 3장)
- `hooks/useGameState.ts` — 마운트 시 빈 테이블 3개에 `FIRST_CUSTOMER_DELAY_MS`(0.5s) 후부터 `NEXT_CUSTOMER_GAP_MS`(1s) 간격으로 손님 배정, 배정 순간 `playBellSound()`. `handleCustomerTap(tableIndex)`가 waiting→ordering(순차 진행, `ORDER_STEP_DURATION_MS`=0.9s 간격)→order_confirmed 상태 전이를 관리. 확정된 손님을 다시 탭하면 `status`는 유지한 채 순차 표시만 재생(replay)
- `lib/sound.ts` — 종소리는 오디오 파일 없이 Web Audio API로 합성 (이미지 에셋 최소화 원칙을 오디오로 확장 적용)
- `lib/order.ts` — `Customer.order`를 순차 말풍선 단계 배열로 변환하는 `getOrderSteps()`
- `justArrivedIds`(`Set<string>`, 훅 상태)로 슬라이드업 등장 애니메이션 재생 여부를 판단
  - ⚠️ 처음엔 `key={customer.id}` div의 DOM 마운트 시점으로 애니메이션을 트리거했는데, `GameRoot`가 화면을 통째로 스위칭하는 구조라 제작 화면을 왕복할 때마다 `ShopScreen` 전체가 리마운트되면서 이미 있던 손님까지 매번 애니메이션이 재생되는 버그가 있었음 — DOM 마운트 대신 이 상태값으로 판단하도록 바꿔서 해결

### [x] ③ 제작 화면 진입/이탈 + 여러 주문(activeOrders) 상태 관리
(기획서 19장 5번에 "구현 전 설계안부터 제시" 지시가 있어 설계안을 먼저 보여주고 확인받은 뒤 구현함)
- `hooks/useGameState.ts` — `startOrResumeOrder(customerId)`: 손님별 `activeOrders`에 항목이 있으면 이어서, 없으면 `stage:'base'`의 새 `ActiveOrder`를 만들어 진입. `exitCrafting()`: `screen:'shop'`으로 복귀하되 진행 상태(`stage`/`cake`)는 보존
- `components/shop/CustomerTable.tsx`/`CustomerSide.tsx` — 주문 확정된 손님에게 "만들기"/"이어 만들기" 버튼 (해당 손님의 `activeOrders` 존재 여부로 라벨 결정)
- `components/game/CraftingScreen.tsx`, `OrderTicket.tsx` — 제작 화면 뼈대. 상단 "나가기" 버튼 + 주문서 상시 노출(기획서 1장 원칙)

### [x] ④ 제작 단계들 (시트 선택 → 오븐 → 크림 → 토핑 → 데코레이션) (2장/4장/19장)
- `lib/gameLogic.ts` — 오븐 타이밍 판정(`OVEN_DURATION_MS`=6초, 70~90% 구간이 만점, `scoreBaking`)과 크림 판정(`scoreFrostingCoverage`/`scoreFrostingEvenness`) 순수 함수. ⑤ 결과 화면 채점에 재사용 가능
- `components/game/cake/CakeRenderer.tsx` — 시트/크림/토핑을 `cake` 데이터만 보고 다시 그리는 선언적 렌더러(16장 원칙). 텍스트/자유 그림은 데코 단계 전용 오버레이가 따로 담당(중복 방지)
- `components/game/cake/DrawingCanvas.tsx` — pointer 이벤트 자유 그림, 좌표는 캔버스 크기 대비 %로 저장(토핑/텍스트와 좌표계 통일), `cake.drawings`에서 항상 다시 그림
- `components/game/cake/TextOverlay.tsx` — 드래그 가능한 DOM 텍스트 오버레이(Canvas 아님, 16장 원칙). 텍스트 입력은 Phase 1 단순화로 `window.prompt()` 사용
  - ⚠️ 브라우저 자동화/테스트 시 네이티브 `prompt()`는 세션을 블로킹하니 자동 클릭하지 말 것 (사람이 직접 입력해야 함)
- `components/game/stages/BaseSelectStage.tsx` — 재료 1개뿐이라 사실상 확인 단계지만, 재료가 늘어나도 그대로 쓸 구조
- `components/game/stages/OvenStage.tsx` — `baking.startTime`(절대 시각) 기준 실시간 진행률. 다른 화면 갔다 와도 `Date.now()`로 정확히 재계산됨을 실제로 확인함
- `components/game/stages/FrostingStage.tsx` — 6x6 그리드 드래그 페인팅(19장 4번 "터치 포인트 샘플링 근사치" 원칙), 완료 시 `cake.filling`에 크림 재료 id 자동 지정 + `cake.frosting`에 coverage/evenness 저장
- `components/game/stages/ToppingStage.tsx` — 6x6 스냅 그리드에 탭으로 토핑 추가/제거(1장 5번 "그리드/스냅" 원칙)
- `components/game/stages/DecorationStage.tsx` — 진입 시 `rotateX(55deg)→rotateX(0deg)` 카메라 전환 연출(4장, 생략 불가), 색상 스와치 + 자유 그림 + 텍스트 추가/이동 + "완성" 버튼(누르면 `stage:'ready'`로 바꾸고 매장 화면으로 자동 복귀)
- `hooks/useGameState.ts` — 여러 전용 setter 대신 범용 `updateOrder(orderId, updater)` 하나로 각 단계의 `cake` 필드를 갱신
- `components/game/CraftingScreen.tsx`에서 위 5단계를 `order.stage`에 따라 조립. 브라우저로 시트→오븐→크림→토핑→데코 전체 플로우를 실제로 클릭해서 확인함
  - (⑤에서 해결됨) 예전 한계: "완성"된 주문(`stage:'ready'`)도 매장 화면에서 여전히 "이어 만들기" 버튼으로 보임(재진입하면 "완성된 케이크입니다" 안내만 뜸) — 서빙/결과 화면이 없어서 자연스러운 종료 지점이 아직 없음

### [x] ⑤ 계산대 표시 + 드래그 서빙 + 결과 화면 (3장 93~97줄, 12장, 17장 8~11번)
- `lib/gameState.ts` — `ActiveOrder`에 `createdAt`/`completedAt` 추가 (속도 점수용)
- `lib/gameLogic.ts` — `scoreServedCake()`: 주문 정확도(시트/크림/토핑/문구 일치) · 제작 품질(굽기+크림 범위+균일도 평균) · 데코레이션(40 + 그림 30 + 텍스트 30) · 속도(60초 이내 만점, 180초 이상 40점)의 단순 평균이 총점. 금액 = `30 × 총점/100`, tip = `총점/20` (`player.tipTotal`에 누적만, 표시 안 함 — 17장 "팁 시스템 제외")
- `hooks/useGameState.ts`
  - `completeOrder(orderId)`: 데코 "완성" → `stage:'ready'` + `completedAt` + 매장 복귀
  - `serveOrder(orderId)`: 채점 → 돈 지급 → 손님 `status:'served'` → `activeOrders`에서 제거 → 결과 카드(`serveResult`) → `EATING_DURATION_MS`(3초) 먹는 연출 → 퇴장 애니메이션(0.45초) → 테이블 비움 → 1초 후 `assignCustomer()`로 새 손님(종소리+슬라이드업)
  - 서빙된 케이크는 `activeOrders`에서 빠지므로 먹는 동안 테이블에 그릴 데이터는 `servedCakes`(customerId → cake)에 따로 보관. 퇴장 중 손님은 `leavingIds`
  - 초기 손님 배정 로직을 `assignCustomer(tableIndex)`로 분리해 퇴장 후 재배정에도 재사용
- `components/shop/ShopScreen.tsx` — 드래그 상태 보유. 계산대 케이크에서 pointerdown → `setPointerCapture` → 손가락을 따라다니는 `fixed` 🎂 → pointerup 지점을 `document.elementsFromPoint`로 검사해 `data-table-index` 테이블을 찾는다. 주문한 손님이면 서빙, 아니면 받침대 위치로 0.25초 스냅백(감점 없음)
  - 계산대에는 완성 케이크 1개만 올린다(완성 순서대로). 나머지는 이름표에 `+N`으로 대기 표시
  - 키보드 대체 조작: 케이크 버튼을 Enter/Space로 누르면(`click` 이벤트의 `detail === 0`) 바로 해당 손님에게 서빙 (18장 접근성)
- `components/shop/CakeCounter.tsx` — 받침대 위 흔들리는 🎂(`animate-cake-wiggle`) + 손님 이름표
- `components/shop/CustomerTable.tsx` — 드래그 중 주인 테이블엔 "여기에 놓기 ⬇", 다른 손님 테이블 위에선 "이 손님 케이크가 아니에요" 라벨 + 점선 외곽선. 완성 대기 중엔 "만들기" 버튼 대신 "🎂 서빙 대기" 배지(기존 "이어 만들기" 한계 해결). 먹는 중엔 😋 + 테이블 위 🎂
- `components/shop/ServeResultCard.tsx` — Papa's 스타일 "CAKE COMPLETE!" 카드(항목별 %, TOTAL, + $금액). 매장 위 오버레이라 뒤에서 먹기/퇴장은 계속 진행됨
- 브라우저에서 실제 마우스 드래그로 확인: 잘못된 테이블 드롭 → 스냅백, 올바른 테이블 → 결과 카드 + HUD 금액 증가, 먹기 → 퇴장 → 새 손님 등장까지 확인. 콘솔 에러 없음

## 다음 할 일
Phase 1 MVP(19장 ①~⑤)는 전부 구현됨. 이후 후보 (우선순위는 사용자와 상의):
- 실제 플레이 밸런스 조정 (오븐 6초, 속도 기준 60/180초, 케이크 가격 $30 등 전부 임시값)
- 제작 단계 이동 제한 (지금은 하단 탭으로 아무 단계나 건너뛸 수 있음 — 건너뛰면 점수가 낮게 나오는 것으로만 처리 중)
- 결과 화면/먹는 연출에서 손님이 받은 실제 케이크 모습(그림/텍스트 포함) 보여주기 — 지금은 🎂 이모지 placeholder
- DAY 진행(하루 종료 조건)은 기획서 Phase 1 범위에 명시가 없어 미구현

**Phase 1 범위 상기**: 섹션 17 참고. 손님 다양화/커스텀 재료 UI/테마 선택 UI/캐릭터 커스터마이징/재료 해금/장비 업그레이드/팁 시스템/랭크업 연출 등은 Phase 1에서 제외.
