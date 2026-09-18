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

- [x] 프로젝트 초기 구조 + 타입 정의
  - `lib/gameState.ts` — `Material`, `MaterialRegistry`, `Customer`, `ActiveOrder`, `GameState` 등 전체 타입 + `createInitialGameState()`
  - `lib/materials.ts` — Phase 1 재료 레지스트리 (카테고리별 1개, decoration은 빈 배열)
  - `lib/customer.ts` — 손님 2명 하드코딩 풀 + `createCustomer()`
  - `app/globals.css` — `--theme-*` CSS 변수(파스텔 핑크만 채움), `.game-root`/`.rotate-notice` 세로모드 안내, `prefers-reduced-motion` 대응
  - `app/layout.tsx` — `data-theme="pink"` 적용
- [x] **① 매장 화면 뼈대** (좌/우 분할, 정적 배치)
  - `components/game/HUD.tsx` — Day/Money 상단 고정 표시
  - `components/shop/ShopScreen.tsx` — 좌/우 분할 컨테이너, 임시로 `useState(createInitialGameState)` 로컬 상태만 사용 중 (아직 진짜 게임 상태 관리 훅 없음)
  - `components/shop/PlayerSide.tsx` — 플레이어 캐릭터(이모지 placeholder) + 계산대
  - `components/shop/CustomerSide.tsx` / `CustomerTable.tsx` / `SpeechBubble.tsx` — 테이블 3개, 현재는 전부 빈 테이블만 렌더링 (Customer 데이터 연결 전)
  - `components/shop/CakeCounter.tsx` — 계산대 위 케이크 표시 (현재 항상 `cake={null}`)
  - 캐릭터/손님은 아직 실제 이미지 없이 이모지로 대체 중 (기획서 7장 "이미지 에셋 최소화" 원칙과도 부합하므로 이미지 에셋이 생기기 전까지는 유지해도 무방)

## 다음 할 일 — ② 손님 등장 애니메이션 + 순차 주문 말풍선 + 주문서 확정 로직

cake-tycoon-prompt.md 3장 "손님 등장 애니메이션 및 주문 흐름" 기준:

1. 빈 테이블에 손님 배정 시: 종소리 효과음 + 아래→위 슬라이드업 등장 애니메이션
2. 등장 직후 "..." 말풍선 대기 상태
3. 손님을 터치하면 주문 항목을 하나씩 순차 표시 (Papa's처럼 자동 진행, 한 항목씩 잠깐 멈췄다가 다음)
4. 다 말하면 주문서 확정 (`status: 'order_confirmed'`), 이후 손님을 터치하면 주문서를 다시 볼 수 있음

이 단계부터는 `ShopScreen`의 로컬 `useState`만으로는 부족해질 가능성이 크다 — 손님 배정/주문 진행 타이머 등 실제 게임 상태 관리가 필요하므로, `hooks/useGameState.ts`를 이 시점에 만들지 검토할 것 (아직 만들지 않음).

**Phase 1 범위 상기**: 섹션 17 참고. 손님 다양화/커스텀 재료 UI/테마 선택 UI/캐릭터 커스터마이징/재료 해금/장비 업그레이드/팁 시스템/랭크업 연출 등은 Phase 1에서 제외.
